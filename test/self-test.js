/**
 * FINORA × DAPIN — Self-Test
 * Verifies data consistency: payment → loan balance → wallet → FINORA transactions.
 * Run with: node test/self-test.js
 */

// mock localStorage for Node
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
};

// In browser, these are globals. In Node, assign to global so cross-references work.
global.Logic = require('../js/logic.js');
global.SeedData = require('../js/seed.js');
const Store = require('../js/data.js');
global.Store = Store;
const Logic = global.Logic;

let pass = 0, fail = 0;
function assert(name, cond, detail) {
  if (cond) { console.log('  ✅ ' + name); pass++; }
  else { console.log('  ❌ ' + name + (detail ? ' — ' + detail : '')); fail++; }
}

console.log('\n🧪 FINORA × DAPIN Self-Test\n');

// Reset to clean state
Store.reset();
const db = Store.load();

console.log('1. Seed data integrity');
assert('Members seeded', db.members.length === 5, 'expected 5, got ' + db.members.length);
assert('Users seeded (1 admin + 5 anggota)', db.users.length === 6, 'expected 6, got ' + db.users.length);
assert('Admin user exists', db.users.some(u => u.role === 'admin'));
assert('Member users exist', db.users.filter(u => u.role === 'member').length === 5);
assert('Wallets seeded', db.wallets.length === 2);
assert('Savings seeded', db.savings.length === 7);
assert('Loans seeded', db.loans.length === 2);
assert('Payments seeded', db.payments.length === 2);

console.log('\n2. Login separation (admin vs anggota)');
const admin = Store.findUser('admin@finora.com', 'admin123');
assert('Admin login works', admin && admin.role === 'admin');
const budi = Store.findUser('budi@finora.com', 'member123');
assert('Member login works', budi && budi.role === 'member');
const badPw = Store.findUser('budi@finora.com', 'wrong');
assert('Wrong password rejected', !badPw);
assert('Admin has no memberId', admin.memberId === null);
assert('Member has memberId', budi.memberId === 'M001');

console.log('\n3. Loan schedule generation');
const sched1 = Logic.generateSchedule(5000000, 12, 10, 'anuitas');
assert('Anuitas schedule has 10 installments', sched1.length === 10);
assert('Anuitas first payment > 0', sched1[0].payment > 0);
assert('Anuitas last balance = 0', sched1[9].balance === 0);

const sched2 = Logic.generateSchedule(3000000, 10, 6, 'flat');
assert('Flat schedule has 6 installments', sched2.length === 6);
assert('Flat first payment = principal/6 + interest', sched2[0].payment === Math.round(3000000/6 + 3000000 * 0.10/12));

console.log('\n4. Payment cascade (payment → loan → wallet → transaction)');
const loanBefore = Store.getLoan('L001');
const balBefore = loanBefore.remaining_balance;
const paidBefore = loanBefore.paid_amount;
const walletBefore = Store.getWallet('main').balance;
const txCountBefore = Store.getTransactions().length;

Store.addPayment({ loanId: 'L001', memberId: 'M001', amount: 557736, installmentNumber: 2 });

const loanAfter = Store.getLoan('L001');
const walletAfter = Store.getWallet('main').balance;
const txCountAfter = Store.getTransactions().length;

assert('Loan remaining_balance decreased', loanAfter.remaining_balance < balBefore,
  'before=' + balBefore + ' after=' + loanAfter.remaining_balance);
assert('Loan paid_amount increased', loanAfter.paid_amount > paidBefore,
  'before=' + paidBefore + ' after=' + loanAfter.paid_amount);
assert('Wallet balance increased (income)', walletAfter > walletBefore,
  'before=' + walletBefore + ' after=' + walletAfter);
assert('FINORA transaction created', txCountAfter === txCountBefore + 1);
assert('Installment marked paid', loanAfter.installments[1].status === 'paid');

console.log('\n5. Loan application (member applies)');
Store.addLoan({ memberId: 'M003', principal: 2000000, interestRate: 10, term: 5, type: 'flat' });
const newLoans = Store.getLoansByMember('M003');
assert('New loan created for M003', newLoans.length === 1);
assert('New loan has schedule', newLoans[0].installments.length === 5);
assert('New loan remaining = principal', newLoans[0].remaining_balance === 2000000);
assert('Disbursement transaction created', Store.getTransactions().length === txCountAfter + 1);
assert('Wallet decreased (expense)', Store.getWallet('main').balance < walletAfter);

console.log('\n6. Role-based data access');
const memberLoans = Store.getLoansByMember('M001');
const allLoans = Store.getLoans();
assert('Member sees only own loans', memberLoans.length <= allLoans.length);
assert('Member cannot access other members loans', !memberLoans.some(l => l.memberId !== 'M001'));
const memberSavings = Store.getSavingsByMember('M002');
assert('Member savings scoped', !memberSavings.some(s => s.memberId !== 'M002'));

console.log('\n7. Aggregations');
assert('totalSavingsByMember M001 > 0', Logic.totalSavingsByMember('M001') > 0);
assert('totalOutstandingLoans > 0', Logic.totalOutstandingLoans() > 0);
assert('totalWalletBalance > 0', Logic.totalWalletBalance() > 0);
assert('upcomingInstallments returns array', Array.isArray(Logic.upcomingInstallments('M001')));

console.log('\n8. Loan payoff scenario');
Store.reset();
// Create a small loan and pay it off fully
Store.addLoan({ memberId: 'M004', principal: 600000, interestRate: 0, term: 3, type: 'flat' });
const smallLoan = Store.getLoansByMember('M004')[0];
assert('Small loan created', smallLoan.principal === 600000);
// Pay all 3 installments
smallLoan.installments.forEach((inst, i) => {
  Store.addPayment({ loanId: smallLoan.id, memberId: 'M004', amount: inst.payment, installmentNumber: inst.number });
});
const paidLoan = Store.getLoansByMember('M004')[0];
assert('Loan fully paid off', paidLoan.remaining_balance === 0);
assert('Loan status = paid_off', paidLoan.status === 'paid_off');
assert('All installments paid', paidLoan.installments.every(i => i.status === 'paid'));

console.log('\n===================');
console.log(`Result: ${pass} passed, ${fail} failed`);
console.log('===================\n');
process.exit(fail > 0 ? 1 : 0);
