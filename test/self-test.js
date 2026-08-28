/* FINORA x DAPIN — Self-test (Node): verifikasi seed & konsistensi cascade pembayaran */
'use strict';
globalThis.localStorage = {
  _d: {},
  getItem: function (k) { return (k in this._d) ? this._d[k] : null; },
  setItem: function (k, v) { this._d[k] = String(v); },
  removeItem: function (k) { delete this._d[k]; }
};
require('/home/user/finora-dapin/js/data.js');
require('/home/user/finora-dapin/js/charts.js');
require('/home/user/finora-dapin/js/logic.js');
require('/home/user/finora-dapin/js/ui.js');
require('/home/user/finora-dapin/js/auth.js');
require('/home/user/finora-dapin/js/seed.js');

var fails = 0;
function check(name, cond, extra) {
  if (cond) { console.log('  PASS ' + name); }
  else { fails++; console.error('  FAIL ' + name + (extra !== undefined ? ' — ' + extra : '')); }
}

console.log('== 1. SEED ==');
var db = SEED.seed();
check('6 anggota ter-seed', db.dapin_members.length === 6, db.dapin_members.length);
check('5 pinjaman ter-seed', db.dapin_loans.length === 5, db.dapin_loans.length);
check('11 simpanan ter-seed', db.dapin_savings.length === 11, db.dapin_savings.length);
check('13 pembayaran ter-seed', db.dapin_payments.length === 13, db.dapin_payments.length);
check('audit log terisi', db.dapin_audit_logs.length > 5, db.dapin_audit_logs.length);
check('ledger terisi', db.dapin_ledger.length > 10, db.dapin_ledger.length);
check('notifikasi = 6 kurasi (silent seed)', db.notifications.length === 6, db.notifications.length);

var f0 = LG.financeTotals(db);
check('saldo total > 0', f0.balance > 0, f0.balance);
check('outstanding DAPIN > 0', f0.outstanding > 0, f0.outstanding);

/* Konsistensi flat loan 1: Budi 10jt @1.2%/bln x 12 */
var l1 = db.dapin_loans.find(function (l) { return l.member_name === 'Budi Santoso'; });
check('LN-001 = flat 12 bln', l1.loan_id === 'LN-001' && l1.tenor === 12, l1.loan_id);
check('angsuran Budi = Rp953.333 (10jt/12 + 120rb)', Math.abs(l1.installment - 953333.33) < 0.5, l1.installment);
check('total bayar = 11.440.000', Math.abs(l1.total_payment - 11440000) < 1, l1.total_payment);
check('sisa saldo Budi = 10 x angsuran', Math.abs(l1.remaining_balance - 10 * 953333.33) < 2, l1.remaining_balance);
check('LN-003 (Agus) tuntas karena toleransi pembulatan', db.dapin_loans.find(function (l) { return l.loan_id === 'LN-003'; }).status === 'Completed', db.dapin_loans.find(function (l) { return l.loan_id === 'LN-003'; }).status);

console.log('== 2. CASCADE PEMBAYARAN (Budi, angsuran #4 overdue) ==');
var before = {
  rem: l1.remaining_balance,
  wal: db.wallets[0].balance,
  txs: db.transactions.length,
  ledger: db.dapin_ledger.length,
  notif: db.notifications.length,
  out: LG.financeTotals(db).outstanding
};
var row = l1.schedule.find(function (r) { return r.status !== 'Paid'; });
check('angsuran berikutnya = #3', row.n === 3, row.n);
check('status #3 = Overdue', row.status === 'Overdue', row.status);
var res = LG.processPayment(db, { loan_id: l1.id, amount: row.total, date: DB.today(), wallet_id: 'W1', method: 'cash' }, 'U1');
check('pembayaran sukses', res.ok, res.error || '');
check('behavioral: row #3 -> Paid (jadwal ter-update)', l1.schedule[2].status === 'Paid', l1.schedule[2].status);
check('loan.paid_amount ter-update', Math.abs(l1.paid_amount - 3 * 953333.33) < 2, l1.paid_amount);
check('loan.remaining_balance ter-update', Math.abs(l1.remaining_balance - 9 * 953333.33) < 2, l1.remaining_balance);
check('saldo pinjaman berkurang sesuai jumlah', Math.abs(l1.remaining_balance - (before.rem - row.total)) < 0.02, l1.remaining_balance + ' vs ' + (before.rem - row.total));
check('wallet Kas Utama bertambah', Math.abs(db.wallets[0].balance - (before.wal + row.total)) < 0.02, db.wallets[0].balance);
check('transaksi FINORA income bertambah', db.transactions.length === before.txs + 1 && db.transactions[db.transactions.length - 1].type === 'income');
check('ledger mencatat pokok + bunga', db.dapin_ledger.length >= before.ledger + 2);
check('outstanding dashboard turun', Math.abs(LG.financeTotals(db).outstanding - (before.out - row.total)) < 0.02, LG.financeTotals(db).outstanding);
check('notifikasi pembayaran dibuat', db.notifications.length > before.notif);
var pay = db.dapin_payments[db.dapin_payments.length - 1];
check('payment id PAY-014 berurutan', pay.id === 'PAY-014', pay.id);
check('rincian pokok+bunga > 0', pay.principal > 0 && pay.interest > 0, pay.principal + ' / ' + pay.interest);

console.log('== 3. KALKULATOR PINJAMAN (anuitas) ==');
var sch = LG.buildSchedule('annuity', 12000000, 12, 12, '2026-09-01');
var tot = LG.loanTotals(sch);
check('12 baris jadwal', sch.length === 12);
check('angsuran anuitas konsisten', tot.installment > 1000000 && tot.installment < 1100000, tot.installment);
var sum = sch.reduce(function (s, r) { return s + r.total; }, 0);
check('total bayar = jumlah baris', Math.abs(sum - tot.totalPayment) < 2, sum + ' vs ' + tot.totalPayment);

console.log('== 4. PENCARIAN JATUH TEMPO ==');
var due = LG.dueItems(db, 999);
check('ada item overdue', due.some(function (d) { return d.status === 'Overdue'; }));
check('jumlah item jatuh tempo > 0', due.length > 0, due.length);

console.log('== 5. MEMBER STATS ==');
var st = LG.memberStats(db, l1.member_id);
check('total savings Budi = 1.100.000', st.totalSavings === 1100000, st.totalSavings);
check('outstanding Budi > 0', st.outstanding > 0, st.outstanding);
check('riwayat transaksi Budi terisi', st.transactions.length > 5, st.transactions.length);

console.log('');
if (fails === 0) { console.log('ALL TESTS PASSED ✔'); process.exit(0); }
else { console.error(fails + ' TEST(S) FAILED ✘'); process.exit(1); }
