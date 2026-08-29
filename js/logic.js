/**
 * FINORA × DAPIN — Business Logic
 * Loan calculations (anuitas / flat), payment schedule, aggregation.
 */
const Logic = {
  /**
   * Generate installment schedule.
   * @param principal  — pokok pinjaman
   * @param ratePct    — bunga per tahun (%)
   * @param term       — jumlah cicilan (bulan)
   * @param type       — 'anuitas' | 'flat'
   */
  generateSchedule(principal, ratePct, term, type) {
    if (!principal || !term) return [];
    const schedule = [];
    const monthlyRate = ratePct / 100 / 12;

    if (type === 'anuitas') {
      const anuitas = monthlyRate > 0
        ? principal * monthlyRate * Math.pow(1 + monthlyRate, term) / (Math.pow(1 + monthlyRate, term) - 1)
        : principal / term;
      let balance = principal;
      for (let i = 1; i <= term; i++) {
        const interest = balance * monthlyRate;
        const principalPart = anuitas - interest;
        balance -= principalPart;
        schedule.push({
          number: i,
          principal: Math.round(principalPart),
          interest: Math.round(interest),
          payment: Math.round(anuitas),
          dueDate: this.addMonths(new Date(), i).toISOString().slice(0,10),
          balance: Math.max(0, Math.round(balance)),
          status: 'pending',
          paidDate: null,
        });
      }
    } else {
      // flat
      const principalPart = principal / term;
      const interest = principal * monthlyRate;
      const payment = principalPart + interest;
      let balance = principal;
      for (let i = 1; i <= term; i++) {
        balance -= principalPart;
        schedule.push({
          number: i,
          principal: Math.round(principalPart),
          interest: Math.round(interest),
          payment: Math.round(payment),
          dueDate: this.addMonths(new Date(), i).toISOString().slice(0,10),
          balance: Math.max(0, Math.round(balance)),
          status: 'pending',
          paidDate: null,
        });
      }
    }
    return schedule;
  },

  addMonths(date, n) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
  },

  formatCurrency(n) {
    return 'Rp ' + (n || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  formatDate(d) {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  // Aggregations
  totalSavingsByMember(memberId) {
    return Store.getSavingsByMember(memberId).reduce((s, x) => s + x.amount, 0);
  },

  totalLoansByMember(memberId) {
    return Store.getLoansByMember(memberId).reduce((s, l) => s + (l.remaining_balance || 0), 0);
  },

  totalPaymentsByMember(memberId) {
    return Store.getPaymentsByMember(memberId).reduce((s, p) => s + p.amount, 0);
  },

  activeLoansByMember(memberId) {
    return Store.getLoansByMember(memberId).filter(l => l.status === 'active');
  },

  totalWalletBalance() {
    return Store.getWallets().reduce((s, w) => s + w.balance, 0);
  },

  totalOutstandingLoans() {
    return Store.getLoans().filter(l => l.status === 'active').reduce((s, l) => s + (l.remaining_balance || 0), 0);
  },

  totalSavingsAll() {
    return Store.getSavings().reduce((s, x) => s + x.amount, 0);
  },

  totalMembers() {
    return Store.getMembers().length;
  },

  activeLoanCount() {
    return Store.getLoans().filter(l => l.status === 'active').length;
  },

  // Income vs Expense for a given month
  monthlySummary() {
    const txns = Store.getTransactions();
    const now = new Date();
    const ym = now.toISOString().slice(0,7);
    let income = 0, expense = 0;
    txns.forEach(t => {
      if (t.date && t.date.slice(0,7) === ym) {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      }
    });
    return { income, expense, net: income - expense, month: ym };
  },

  // Due dates for a member's loans
  upcomingInstallments(memberId) {
    const loans = Store.getLoansByMember(memberId).filter(l => l.status === 'active');
    const items = [];
    loans.forEach(l => {
      (l.installments || []).forEach(i => {
        if (i.status !== 'paid') {
          items.push({ loanId: l.id, memberId, number: i.number, dueDate: i.dueDate, payment: i.payment, balance: i.balance });
        }
      });
    });
    return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  // Next due installment for a loan
  nextDue(loan) {
    if (!loan || loan.status !== 'active') return null;
    return (loan.installments || []).find(i => i.status !== 'paid') || null;
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = Logic;
