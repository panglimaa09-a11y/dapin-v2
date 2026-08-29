/**
 * FINORA × DAPIN — Data Layer
 * localStorage-backed store, swappable to Supabase later.
 */
const Store = (() => {
  const KEY = 'finora_dapin_db_v2';
  let db = null;

  function load() {
    if (db) return db;
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? JSON.parse(raw) : null;
    } catch { db = null; }
    if (!db) db = seed();
    return db;
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function reset() {
    db = seed();
    save();
    return db;
  }

  function seed() {
    return SeedData.create();
  }

  // Users (auth)
  function getUsers() { return load().users; }
  function findUser(email, password) {
    return load().users.find(u => u.email === email && u.password === password);
  }
  function findUserByEmail(email) {
    return load().users.find(u => u.email === email);
  }

  // Members
  function getMembers() { return load().members; }
  function getMember(id) { return load().members.find(m => m.id === id); }
  function addMember(m) {
    m.id = 'M' + Date.now();
    m.joinedDate = new Date().toISOString().slice(0,10);
    m.status = 'active';
    load().members.push(m);
    save();
    return m;
  }
  function updateMember(id, patch) {
    const m = getMember(id);
    if (m) Object.assign(m, patch);
    save();
  }
  function deleteMember(id) {
    const d = load();
    d.members = d.members.filter(m => m.id !== id);
    save();
  }

  // Savings
  function getSavings() { return load().savings; }
  function getSavingsByMember(memberId) {
    return load().savings.filter(s => s.memberId === memberId);
  }
  function addSaving(s) {
    s.id = 'S' + Date.now();
    s.date = new Date().toISOString().slice(0,10);
    load().savings.push(s);
    // cascade to wallet
    addTransaction({
      type: 'income', category: 'Simpanan Anggota',
      amount: s.amount, description: `Simpanan ${getMember(s.memberId)?.name || ''}`,
      walletId: 'main'
    });
    save();
  }
  function deleteSaving(id) {
    const d = load();
    d.savings = d.savings.filter(s => s.id !== id);
    save();
  }

  // Loans
  function getLoans() { return load().loans; }
  function getLoansByMember(memberId) {
    return load().loans.filter(l => l.memberId === memberId);
  }
  function getLoan(id) { return load().loans.find(l => l.id === id); }
  function addLoan(l) {
    const d = load();
    l.id = 'L' + Date.now();
    l.disbursementDate = new Date().toISOString().slice(0,10);
    l.status = 'active';
    l.paid_amount = 0;
    l.remaining_balance = l.principal;
    l.installments = Logic.generateSchedule(l.principal, l.interestRate, l.term, l.type);
    d.loans.push(l);
    // disbursement = expense from wallet
    addTransaction({
      type: 'expense', category: 'Pencairan Pinjaman',
      amount: l.principal, description: `Pencairan pinjaman ${getMember(l.memberId)?.name || ''}`,
      walletId: 'main'
    });
    save();
    return l;
  }
  function updateLoan(id, patch) {
    const l = getLoan(id);
    if (l) Object.assign(l, patch);
    save();
  }
  function deleteLoan(id) {
    const d = load();
    d.loans = d.loans.filter(l => l.id !== id);
    save();
  }

  // Payments (installments)
  function getPayments() { return load().payments; }
  function getPaymentsByLoan(loanId) {
    return load().payments.filter(p => p.loanId === loanId);
  }
  function getPaymentsByMember(memberId) {
    return load().payments.filter(p => p.memberId === memberId);
  }
  function addPayment(p) {
    const d = load();
    p.id = 'P' + Date.now();
    p.date = new Date().toISOString().slice(0,10);
    d.payments.push(p);
    // cascade: reduce loan balance
    const loan = getLoan(p.loanId);
    if (loan) {
      loan.paid_amount = (loan.paid_amount || 0) + p.amount;
      loan.remaining_balance = Math.max(0, (loan.remaining_balance || loan.principal) - p.amount);
      // mark installment paid
      const inst = loan.installments?.find(i => i.number === p.installmentNumber && i.status !== 'paid');
      if (inst) { inst.status = 'paid'; inst.paidDate = p.date; }
      if (loan.remaining_balance <= 0) loan.status = 'paid_off';
    }
    // cascade: income to wallet
    addTransaction({
      type: 'income', category: 'Angsuran Pinjaman',
      amount: p.amount, description: `Angsuran ${getMember(p.memberId)?.name || ''}`,
      walletId: 'main'
    });
    save();
    return p;
  }

  // Transactions (FINORA)
  function getTransactions() { return load().transactions; }
  function addTransaction(t) {
    const d = load();
    t.id = 'T' + Date.now() + Math.random().toString(36).slice(2,6);
    if (!t.date) t.date = new Date().toISOString().slice(0,10);
    d.transactions.push(t);
    // update wallet balance
    const wallet = d.wallets.find(w => w.id === (t.walletId || 'main'));
    if (wallet) {
      if (t.type === 'income') wallet.balance += t.amount;
      else wallet.balance -= t.amount;
    }
    save();
    return t;
  }
  function deleteTransaction(id) {
    const d = load();
    const t = d.transactions.find(tx => tx.id === id);
    if (t) {
      const wallet = d.wallets.find(w => w.id === t.walletId);
      if (wallet) {
        if (t.type === 'income') wallet.balance -= t.amount;
        else wallet.balance += t.amount;
      }
    }
    d.transactions = d.transactions.filter(tx => tx.id !== id);
    save();
  }

  // Wallets
  function getWallets() { return load().wallets; }
  function getWallet(id) { return load().wallets.find(w => w.id === id); }

  // Notifications
  function getNotifications() { return load().notifications; }
  function addNotification(n) {
    const d = load();
    n.id = 'N' + Date.now();
    n.date = new Date().toISOString();
    n.read = false;
    d.notifications.unshift(n);
    if (d.notifications.length > 50) d.notifications = d.notifications.slice(0,50);
    save();
  }
  function markNotificationRead(id) {
    const n = load().notifications.find(x => x.id === id);
    if (n) n.read = true;
    save();
  }
  function clearNotifications() {
    load().notifications = [];
    save();
  }

  return {
    load, save, reset,
    getUsers, findUser, findUserByEmail,
    getMembers, getMember, addMember, updateMember, deleteMember,
    getSavings, getSavingsByMember, addSaving, deleteSaving,
    getLoans, getLoansByMember, getLoan, addLoan, updateLoan, deleteLoan,
    getPayments, getPaymentsByLoan, getPaymentsByMember, addPayment,
    getTransactions, addTransaction, deleteTransaction,
    getWallets, getWallet,
    getNotifications, addNotification, markNotificationRead, clearNotifications,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Store;
