/* FINORA x DAPIN — Business Logic
   Kalkulasi pinjaman (flat & anuitas) + cascade pembayaran konsisten:
   Payment → Installment → Loan balance → Wallet → FINORA transaction → Ledger → Notification → Audit.
   Semua fungsi murni: menerima db (object), mengembalikan db BARU + hasil.
*/
(function (root) {
  if (root.LG) return root.LG;

  function esc(s) { return String(s == null ? '' : s); }
  function r2(n) { return Math.round(n * 100) / 100; }

  /* ---------- Schedule builders ---------- */
  function buildSchedule(method, principal, rate, tenor, startDate) {
    // rate: dalam % per bulan (flat) atau % per tahun (anuitas)
    var rows = [];
    if (method === 'annuity') {
      var mr = rate / 100 / 12;
      var inst = mr === 0 ? principal / tenor : principal * mr * Math.pow(1 + mr, tenor) / (Math.pow(1 + mr, tenor) - 1);
      var rem = principal;
      for (var i = 1; i <= tenor; i++) {
        var interest = rem * mr;
        var prin = inst - interest;
        if (i === tenor) { prin = rem; interest = inst - prin < 0 ? 0 : inst - prin; }
        rem = Math.max(0, rem - prin);
        rows.push({ n: i, dueDate: DB.addMonths(startDate, i), principal: r2(prin), interest: r2(interest), total: r2(prin + interest), paid: 0, interestPaid: 0, principalPaid: 0, status: 'Upcoming', paidDate: null });
      }
    } else {
      var mi = principal * (rate / 100);
      var pp = principal / tenor;
      for (var j = 1; j <= tenor; j++) {
        rows.push({ n: j, dueDate: DB.addMonths(startDate, j), principal: r2(pp), interest: r2(mi), total: r2(pp + mi), paid: 0, interestPaid: 0, principalPaid: 0, status: 'Upcoming', paidDate: null });
      }
    }
    /* tandai overdue berdasarkan tanggal hari ini */
    var today = DB.today();
    rows.forEach(function (r) {
      if (r.status === 'Upcoming' && r.dueDate < today) r.status = 'Overdue';
      if (r.dueDate === today) r.status = 'Due';
    });
    return rows;
  }
  function loanTotals(rows) {
    var interest = rows.reduce(function (s, r) { return s + r.interest; }, 0);
    var total = rows.reduce(function (s, r) { return s + r.total; }, 0);
    return { interestTotal: r2(interest), totalPayment: r2(total), installment: r2(rows[0] ? rows[0].total : 0) };
  }
  function refreshStatus(loan, today) {
    var rows = loan.schedule;
    var sumPaid = rows.reduce(function (s, r) { return s + r.paid; }, 0);
    /* Tulis langsung ke field kanonik (snake_case) yang dibaca semua agregasi & view */
    loan.paid_amount = r2(sumPaid);
    loan.remaining_balance = Math.max(0, r2((loan.total_payment || 0) - sumPaid));
    if (loan.status === 'Cancelled' || loan.status === 'Draft') return;
    if (loan.remaining_balance <= 1) { /* toleransi pembulatan rupiah */
      loan.status = 'Completed';
      loan.completedDate = loan.completedDate || today;
      rows.forEach(function (r) { if (r.status !== 'Paid') { r.status = 'Paid'; r.paidDate = loan.completedDate; } });
      return loan;
    }
    var hasOverdue = rows.some(function (r) { return r.status === 'Overdue' || (r.status === 'Partial' && r.dueDate < today); });
    loan.status = hasOverdue ? 'Overdue' : 'Active';
    return loan;
  }

  /* ---------- CREATE MEMBER ---------- */
  function createMember(db, data, actor) {
    var name = esc(data.name || '').trim();
    if (!name) return { ok: false, error: 'Nama anggota wajib diisi.' };
    var id = 'M' + String(db.dapin_members.length + 1).padStart(3, '0');
    var member = {
      id: DB.uid('MBR'), member_id: id, name: name, phone: esc(data.phone || ''), email: esc(data.email || ''),
      address: esc(data.address || ''), join_date: data.joinDate || DB.today(), status: data.status || 'Active',
      created_at: DB.nowISO(), created_by: actor
    };
    db.dapin_members.push(member);
    addAudit(db, actor, 'Member created', 'member', member.id, { member_id: id, name: name });
    notify(db, 'Anggota baru ditambahkan: ' + name, 'info', '#/dapin/members/' + member.id);
    return { ok: true, member: member };
  }

  /* ---------- CREATE LOAN ---------- */
  function createLoan(db, data, actor) {
    var principal = Number(data.principal); var tenor = Number(data.tenor); var rate = Number(data.rate);
    if (!principal || principal <= 0) return { ok: false, error: 'Pokok pinjaman tidak valid.' };
    if (!tenor || tenor < 1 || tenor > 120) return { ok: false, error: 'Tenor harus 1–120 bulan.' };
    if (rate == null || rate < 0 || rate > 100) return { ok: false, error: 'Bunga tidak valid.' };
    var member = db.dapin_members.find(function (m) { return m.id === data.member_id; });
    if (!member) return { ok: false, error: 'Anggota tidak ditemukan.' };
    var method = data.method === 'annuity' ? 'annuity' : 'flat';
    var startDate = data.startDate || DB.today();
    var schedule = buildSchedule(method, principal, rate, tenor, startDate);
    var totals = loanTotals(schedule);
    var number = 'LN-' + String(db.dapin_loans.filter(function (l) { return /^LN-\d+$/.test(l.loan_id || ''); }).length + 1).padStart(3, '0');
    var loan = {
      id: DB.uid('LN'), loan_id: number, member_id: member.id, member_name: member.name, principal: r2(principal),
      method: method, rate: Number(rate), tenor: tenor, start_date: startDate, due_date: schedule[schedule.length - 1].dueDate,
      installment: totals.installment, interest_total: totals.interestTotal, total_payment: totals.totalPayment,
      paid_amount: 0, remaining_balance: totals.totalPayment, status: startDate <= DB.today() ? 'Active' : 'Draft',
      schedule: schedule, created_at: DB.nowISO(), created_by: actor
    };
    db.dapin_loans.push(loan);
    db.dapin_ledger.push({ id: DB.uid('LED'), member_id: member.id, loan_id: loan.id, type: 'LOAN_CREATED', amount: principal, date: startDate, reference: number, notes: 'Pinjaman ' + number + ' dibuat', created_by: actor, created_at: DB.nowISO() });
    addAudit(db, actor, 'Loan created', 'loan', loan.id, { loan_id: number, member: member.name, principal: principal });
    notify(db, 'Pinjaman ' + number + ' (' + member.name + ') dibuat.', 'info', '#/dapin/loans');
    if (loan.status === 'Active') {
      db.dapin_ledger.push({ id: DB.uid('LED'), member_id: member.id, loan_id: loan.id, type: 'LOAN_DISBURSED', amount: principal, date: startDate, reference: number, notes: 'Pencairan pinjaman ' + number, created_by: actor, created_at: DB.nowISO() });
      /* Integrasi FINORA: pencairan = dana keluar (expense) dari wallet */
      var wallet = db.wallets[0];
      wallet.balance = Math.max(0, r2(wallet.balance - principal));
      db.transactions.push({ id: DB.uid('TXN'), user_id: db.sessionUser || null, type: 'expense', category: 'DAPIN · Pencairan', amount: principal, date: startDate, wallet_id: wallet.id, reference: number, notes: 'Pencairan pinjaman ' + number + ' — ' + member.name, created_at: DB.nowISO() });
      notify(db, 'Pinjaman ' + number + ' dicairkan sebesar ' + FMT.money(principal) + '.', 'success', '#/dapin/loans');
    }
    return { ok: true, loan: loan };
  }

  /* ---------- PROCESS PAYMENT (cascade atomik) ---------- */
  function processPayment(db, data, actor) {
    var amount = Number(data.amount);
    if (!amount || amount <= 0) return { ok: false, error: 'Jumlah pembayaran tidak valid.' };
    var loan = db.dapin_loans.find(function (l) { return l.id === data.loan_id; });
    if (!loan) return { ok: false, error: 'Pinjaman tidak ditemukan.' };
    if (loan.status === 'Completed') return { ok: false, error: 'Pinjaman sudah lunas.' };
    if (loan.status === 'Cancelled') return { ok: false, error: 'Pinjaman dibatalkan.' };
    var date = data.date || DB.today();
    var rows = loan.schedule.filter(function (r) { return r.status !== 'Paid'; });
    if (!rows.length) return { ok: false, error: 'Tidak ada angsuran yang tertunggak.' };

    var remaining = amount, interestPaid = 0, principalPaid = 0, affected = [];
    for (var i = 0; i < rows.length && remaining > 0; i++) {
      var row = rows[i];
      var dueRow = r2(row.total - row.paid);
      if (dueRow <= 0) continue;
      var take = Math.min(remaining, dueRow);
      row.paid = r2(row.paid + take); remaining = r2(remaining - take);
      var rowIntLeft = r2(row.interest - (row.interestPaid || 0));
      var iPart = Math.min(take, rowIntLeft);
      var pPart = take - iPart;
      row.interestPaid = r2((row.interestPaid || 0) + iPart);
      row.principalPaid = r2((row.principalPaid || 0) + pPart);
      interestPaid = r2(interestPaid + iPart); principalPaid = r2(principalPaid + pPart);
      if (row.paid >= row.total - 0.01) { row.status = 'Paid'; row.paidDate = date; } else { row.status = 'Partial'; }
      affected.push(row.n);
    }
    if (principalPaid + interestPaid <= 0) return { ok: false, error: 'Tidak ada pos yang dapat dibayar.' };

    var payId = 'PAY-' + String(db.dapin_payments.length + 1).padStart(3, '0');
    refreshStatus(loan, date);
    if (loan.status === 'Completed') { loan.completedDate = date; loan.schedule.forEach(function (r) { if (r.status !== 'Paid') { r.status = 'Paid'; r.paidDate = date; } }); }

    /* 1) Wallet FINORA bertambah */
    var wallet = db.wallets.find(function (w) { return w.id === data.wallet_id; }) || db.wallets[0];
    wallet.balance = r2(wallet.balance + amount);

    /* 2) Transaksi FINORA (income) */
    db.transactions.push({ id: DB.uid('TXN'), user_id: db.sessionUser || null, type: 'income', category: 'DAPIN · Angsuran', amount: amount, date: date, wallet_id: wallet.id, reference: payId, notes: 'Angsuran ' + loan.loan_id + ' — ' + loan.member_name + (data.notes ? ' · ' + data.notes : ''), created_at: DB.nowISO() });

    /* 3) Ledger DAPIN (transparan: bunga vs pokok) */
    if (interestPaid > 0) db.dapin_ledger.push({ id: DB.uid('LED'), member_id: loan.member_id, loan_id: loan.id, type: 'INTEREST_PAYMENT', amount: interestPaid, date: date, reference: payId, notes: 'Bunga angsuran #' + affected.join(',#') + ' — ' + loan.loan_id, created_by: actor, created_at: DB.nowISO() });
    if (principalPaid > 0) db.dapin_ledger.push({ id: DB.uid('LED'), member_id: loan.member_id, loan_id: loan.id, type: 'INSTALLMENT_PAYMENT', amount: principalPaid, date: date, reference: payId, notes: 'Pokok angsuran #' + affected.join(',#') + ' — ' + loan.loan_id, created_by: actor, created_at: DB.nowISO() });

    /* 4) Record payment */
    db.dapin_payments.push({ id: payId, loan_id: loan.id, loan_ref: loan.loan_id, member_id: loan.member_id, member_name: loan.member_name, installment_no: affected.join(','), amount: amount, principal: principalPaid, interest: interestPaid, date: date, method: data.method || 'cash', wallet_id: wallet.id, notes: data.notes || '', created_by: actor, created_at: DB.nowISO() });

    /* 5) Notification + audit */
    if (loan.status === 'Completed') {
      notify(db, 'Pinjaman ' + loan.loan_id + ' (' + loan.member_name + ') telah LUNAS. 🎉', 'success', '#/dapin/loans');
      addAudit(db, actor, 'Loan completed', 'loan', loan.id, { loan_id: loan.loan_id });
    } else {
      notify(db, 'Pembayaran angsuran ' + payId + ' tercatat (' + FMT.money(amount) + ').', 'success', '#/dapin/payments');
    }
    addAudit(db, actor, 'Payment recorded', 'payment', payId, { loan_id: loan.loan_id, amount: amount, member: loan.member_name });

    return { ok: true, payId: payId, loan: loan, affected: affected, principalPaid: principalPaid, interestPaid: interestPaid, remaining: remaining };
  }

  /* ---------- SAVINGS DEPOSIT ---------- */
  function recordSavings(db, data, actor) {
    var amount = Number(data.amount);
    if (!amount || amount <= 0) return { ok: false, error: 'Jumlah simpanan tidak valid.' };
    var member = db.dapin_members.find(function (m) { return m.id === data.member_id; });
    if (!member) return { ok: false, error: 'Anggota tidak ditemukan.' };
    var type = esc(data.type || 'Sukarela');
    var date = data.date || DB.today();
    var ref = 'SVP-' + String(db.dapin_savings.length + 1).padStart(3, '0');
    db.dapin_savings.push({ id: DB.uid('SVP'), ref: ref, member_id: member.id, member_name: member.name, type: type, amount: r2(amount), date: date, reference: data.reference || '', notes: data.notes || '', wallet_id: data.wallet_id || null, created_by: actor, created_at: DB.nowISO() });
    var wallet = db.wallets.find(function (w) { return w.id === data.wallet_id; }) || db.wallets[0];
    wallet.balance = r2(wallet.balance + amount);
    db.transactions.push({ id: DB.uid('TXN'), user_id: db.sessionUser || null, type: 'income', category: 'DAPIN · Simpanan', amount: amount, date: date, wallet_id: wallet.id, reference: ref, notes: 'Simpanan ' + type + ' — ' + member.name, created_at: DB.nowISO() });
    db.dapin_ledger.push({ id: DB.uid('LED'), member_id: member.id, loan_id: null, type: 'SAVINGS_DEPOSIT', amount: amount, date: date, reference: ref, notes: 'Setoran ' + type + ' — ' + member.name, created_by: actor, created_at: DB.nowISO() });
    notify(db, 'Simpanan ' + type + ' ' + FMT.money(amount) + ' untuk ' + member.name + ' tercatat.', 'success', '#/dapin/savings');
    addAudit(db, actor, 'Savings deposit', 'savings', ref, { member: member.name, amount: amount, type: type });
    return { ok: true, ref: ref };
  }

  /* ---------- ADJUSTMENT / LEDGER ---------- */
  function recordAdjustment(db, data, actor) {
    var amount = Number(data.amount);
    if (!amount) return { ok: false, error: 'Jumlah penyesuaian tidak valid.' };
    var type = esc(data.type || 'ADJUSTMENT').toUpperCase().replace(/[^A-Z_]/g, '_');
    var ref = 'ADJ-' + String(db.dapin_ledger.length + 1).padStart(3, '0');
    db.dapin_ledger.push({ id: DB.uid('LED'), member_id: data.member_id || null, loan_id: data.loan_id || null, type: type, amount: amount, date: data.date || DB.today(), reference: ref, notes: data.notes || '', created_by: actor, created_at: DB.nowISO() });
    addAudit(db, actor, 'Ledger adjustment', 'ledger', ref, { amount: amount });
    return { ok: true, ref: ref };
  }

  /* ---------- WALLET ---------- */
  function createWallet(db, data, actor) {
    var name = esc(data.name || '').trim();
    if (!name) return { ok: false, error: 'Nama wallet wajib diisi.' };
    var wallet = { id: DB.uid('WAL'), name: name, type: data.type || 'cash', balance: r2(Number(data.balance) || 0), owner: actor };
    db.wallets.push(wallet);
    addAudit(db, actor, 'Wallet created', 'wallet', wallet.id, { name: name });
    return { ok: true, wallet: wallet };
  }

  /* ---------- MEMBER EDIT / STATUS ---------- */
  function updateMember(db, memberId, patch, actor) {
    var m = db.dapin_members.find(function (x) { return x.id === memberId; });
    if (!m) return { ok: false, error: 'Anggota tidak ditemukan.' };
    Object.keys(patch).forEach(function (k) { if (patch[k] !== undefined && k !== 'id') m[k] = patch[k]; });
    addAudit(db, actor, 'Member updated', 'member', m.id, { member_id: m.member_id });
    return { ok: true, member: m };
  }
  function deactivateMember(db, memberId, actor) {
    var m = db.dapin_members.find(function (x) { return x.id === memberId; });
    if (!m) return { ok: false, error: 'Anggota tidak ditemukan.' };
    m.status = m.status === 'Active' ? 'Inactive' : 'Active';
    addAudit(db, actor, m.status === 'Active' ? 'Member activated' : 'Member deactivated', 'member', m.id, { member_id: m.member_id });
    notify(db, 'Status anggota ' + m.name + ' → ' + m.status + '.', 'info', '#/dapin/members/' + m.id);
    return { ok: true, member: m };
  }

  /* ---------- NOTIFICATION & AUDIT ---------- */
  function notify(db, message, type, link) {
    if (db.silentNotifications) return;
    db.notifications.unshift({ id: DB.uid('NTF'), message: message, type: type || 'info', link: link || null, read: false, created_at: DB.nowISO() });
    if (db.notifications.length > 200) db.notifications.pop();
  }
  function addAudit(db, user, action, target, targetId, metadata) {
    db.dapin_audit_logs.unshift({ id: DB.uid('AUD'), user: user, action: action, target: target, target_id: targetId, metadata: metadata || {}, created_at: DB.nowISO() });
    if (db.dapin_audit_logs.length > 500) db.dapin_audit_logs.pop();
  }

  /* ---------- DUE DATE HELPERS ---------- */
  function dueItems(db, daysAhead) {
    var today = DB.today(); var out = [];
    db.dapin_loans.forEach(function (loan) {
      if (loan.status === 'Completed' || loan.status === 'Cancelled' || loan.status === 'Draft') return;
      loan.schedule.forEach(function (row) {
        if (row.status === 'Paid') return;
        var d = DB.daysBetween(today, row.dueDate);
        if (d > (daysAhead || 7)) return;
        out.push({ member: loan.member_name, loan: loan.loan_id, loan_id: loan.id, installment: row.n, dueDate: row.dueDate, amount: r2(row.total - row.paid), status: row.status === 'Partial' ? 'Partial' : (d < 0 ? 'Overdue' : (d === 0 ? 'DueToday' : 'Upcoming')), days: d });
      });
    });
    out.sort(function (a, b) { return (a.status === 'Overdue' ? -1 : 0) - (b.status === 'Overdue' ? -1 : 0) || a.dueDate.localeCompare(b.dueDate); });
    return out;
  }

  /* ---------- AGGREGATES ---------- */
  function memberStats(db, memberId) {
    var savings = db.dapin_savings.filter(function (s) { return s.member_id === memberId; });
    var totalSavings = savings.reduce(function (s, x) { return s + x.amount; }, 0);
    var loans = db.dapin_loans.filter(function (l) { return l.member_id === memberId; });
    var active = loans.filter(function (l) { return l.status === 'Active' || l.status === 'Overdue'; });
    var totalLoans = loans.reduce(function (s, l) { return s + l.principal; }, 0);
    var outstanding = active.reduce(function (s, l) { return s + l.remaining_balance; }, 0);
    var totalPaid = loans.reduce(function (s, l) { return s + l.paid_amount; }, 0);
    var payments = db.dapin_payments.filter(function (p) { return p.member_id === memberId; });
    var transactions = [];
    savings.forEach(function (s) { transactions.push({ id: s.ref, type: 'SAVINGS_DEPOSIT', label: 'Simpanan ' + s.type, amount: s.amount, date: s.date, ref: s.ref, notes: s.notes }); });
    loans.forEach(function (l) {
      if (l.status !== 'Draft' && l.status !== 'Cancelled') transactions.push({ id: l.id + '-disb', type: 'LOAN_DISBURSED', label: 'Pencairan ' + l.loan_id, amount: l.principal, date: l.start_date, ref: l.loan_id, notes: 'Pokok pinjaman' });
    });
    db.dapin_payments.forEach(function (p) {
      if (p.member_id === memberId) transactions.push({ id: p.id, type: 'INSTALLMENT_PAYMENT', label: 'Angsuran ' + p.loan_ref + ' #' + p.installment_no, amount: p.amount, date: p.date, ref: p.id, notes: 'Pokok ' + p.principal + ' · Bunga ' + p.interest });
    });
    transactions.sort(function (a, b) { return b.date.localeCompare(a.date); });
    return { totalSavings: r2(totalSavings), totalLoans: r2(totalLoans), outstanding: r2(outstanding), totalPaid: r2(totalPaid), activeLoans: active, transactions: transactions, savingsCount: savings.length };
  }
  function financeTotals(db) {
    var txs = db.transactions;
    var income = txs.filter(function (t) { return t.type === 'income'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var expense = txs.filter(function (t) { return t.type === 'expense'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var balance = db.wallets.reduce(function (s, w) { return s + w.balance; }, 0);
    var savings = db.dapin_savings.reduce(function (s, x) { return s + x.amount; }, 0);
    var activeLoans = db.dapin_loans.filter(function (l) { return l.status === 'Active' || l.status === 'Overdue'; });
    var outstanding = activeLoans.reduce(function (s, l) { return s + l.remaining_balance; }, 0);
    var receivable = dueItems(db, 999).filter(function (d) { return d.status !== 'Upcoming' || d.days <= 7; }).reduce(function (s, d) { return s + d.amount; }, 0);
    return { income: r2(income), expense: r2(expense), balance: r2(balance), savings: r2(savings), outstanding: r2(outstanding), receivable: r2(receivable) };
  }

  root.LG = { buildSchedule: buildSchedule, loanTotals: loanTotals, refreshStatus: refreshStatus, createMember: createMember, createLoan: createLoan, processPayment: processPayment, recordSavings: recordSavings, recordAdjustment: recordAdjustment, createWallet: createWallet, updateMember: updateMember, deactivateMember: deactivateMember, notify: notify, addAudit: addAudit, dueItems: dueItems, memberStats: memberStats, financeTotals: financeTotals };
  return root.LG;
})(typeof window !== 'undefined' ? window : globalThis);
