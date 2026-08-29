/* FINORA x DAPIN — Seed Demo Data (konsisten: semua lewat business logic) */
(function (root) {
  if (root.SEED) return root.SEED;
  root.FMT = root.UIK && root.UIK.fmt; /* alias format */

  function seed() {
    var existing = DB.load();
    if (existing) return existing;

    var db = {
      version: 1,
      users: [], roles: [], profiles: [], wallets: [], transactions: [], budgets: [], notifications: [],
      dapin_members: [], dapin_savings: [], dapin_loans: [], dapin_payments: [], dapin_ledger: [], dapin_audit_logs: [],
      settings: { org_name: 'Koperasi Maju Bersama', currency: 'IDR', dapin_savings_types: ['Pokok', 'Wajib', 'Sukarela'], notif_due_days: 7 },
      silentNotifications: true, sessionUser: null
    };

    db.users.push({ id: 'U1', name: 'Admin FINORA', email: 'admin@finora.app', password: 'admin123', role: 'SUPER_ADMIN' });
    db.users.push({ id: 'U2', name: 'Dina Staff', email: 'staff@finora.app', password: 'staff123', role: 'DAPIN_STAFF' });
    db.users.push({ id: 'U3', name: 'Andi User', email: 'user@finora.app', password: 'user123', role: 'USER' });
    db.roles.push(
      { id: 'R1', name: 'SUPER_ADMIN', perms: ['*'] },
      { id: 'R2', name: 'ADMIN', perms: ['*'] },
      { id: 'R3', name: 'DAPIN_STAFF', perms: ['dapin:*', 'finance:read'] },
      { id: 'R4', name: 'USER', perms: ['finance:*', 'dapin:read'] }
    );
    db.profiles.push({ id: 'P1', user_id: 'U1', full_name: 'Admin FINORA', phone: '0812-3456-7890', company: 'FINORA Labs' });

    db.wallets.push({ id: 'W1', name: 'Kas Utama', type: 'cash', balance: 0, owner: 'U1' });
    db.wallets.push({ id: 'W2', name: 'Bank BCA', type: 'bank', balance: 0, owner: 'U1' });
    db.wallets.push({ id: 'W3', name: 'GoPay', type: 'ewallet', balance: 0, owner: 'U1' });

    function pushTx(type, category, amount, date, wallet, ref, notes) {
      db.transactions.push({ id: DB.uid('TXN'), user_id: 'U1', type: type, category: category, amount: amount, date: date, wallet_id: wallet, reference: ref, notes: notes || '', created_at: DB.nowISO() });
    }
    /* Keuangan inti FINORA (non-DAPIN) */
    pushTx('income', 'Gaji', 15000000, '2026-07-25', 'W2', 'SAL-0726', 'Gaji bulan Juli');
    pushTx('income', 'Gaji', 15000000, '2026-06-25', 'W2', 'SAL-0626', 'Gaji bulan Juni');
    pushTx('income', 'Gaji', 15000000, '2026-05-25', 'W2', 'SAL-0526', 'Gaji bulan Mei');
    pushTx('income', 'Pendapatan Jasa', 4000000, '2026-08-15', 'W2', 'INV-015', 'Jasa konsultasi klien');
    pushTx('income', 'Pendapatan Jasa', 3200000, '2026-07-15', 'W2', 'INV-012', 'Jasa konsultasi klien');
    pushTx('expense', 'Operasional', 2500000, '2026-07-10', 'W2', 'EXP-001', 'Sewa ruang kantor');
    pushTx('expense', 'Operasional', 2500000, '2026-06-10', 'W2', 'EXP-004', 'Sewa ruang kantor');
    pushTx('expense', 'Belanja', 1350000, '2026-08-18', 'W2', 'EXP-002', 'Belanja operasional bulanan');
    pushTx('expense', 'Transportasi', 420000, '2026-08-12', 'W2', 'EXP-005', 'Transport dinas');
    pushTx('income', 'Bunga Deposito', 250000, '2026-07-31', 'W2', 'INT-01', 'Bunga deposito bulanan');
    pushTx('expense', 'Digital & SaaS', 900000, '2026-08-05', 'W3', 'EXP-006', 'Langganan software');

    db.budgets.push(
      { id: 'B1', category: 'Operasional', limit: 3000000, spent: 2500000, period: '2026-08' },
      { id: 'B2', category: 'Belanja', limit: 2000000, spent: 1350000, period: '2026-08' },
      { id: 'B3', category: 'Digital & SaaS', limit: 1500000, spent: 900000, period: '2026-08' },
      { id: 'B4', category: 'Transportasi', limit: 1000000, spent: 420000, period: '2026-08' },
      { id: 'B5', category: 'Gaji', limit: 15000000, spent: 15000000, period: '2026-08' }
    );

    db.sessionUser = 'U1';
    /* --- Anggota DAPIN (langsung, tanpa notifikasi) --- */
    var members = [
      { name: 'Budi Santoso', phone: '0812-1111-2222', email: 'budi@mail.com', address: 'Jl. Melati No.1, Jakarta', joinDate: '2026-01-10', status: 'Active' },
      { name: 'Siti Rahayu', phone: '0813-2222-3333', email: 'siti@mail.com', address: 'Jl. Kenanga No.5, Bandung', joinDate: '2026-02-14', status: 'Active' },
      { name: 'Agus Wijaya', phone: '0814-3333-4444', email: 'agus@mail.com', address: 'Jl. Mawar No.8, Surabaya', joinDate: '2026-03-02', status: 'Active' },
      { name: 'Dewi Lestari', phone: '0815-4444-5555', email: 'dewi@mail.com', address: 'Jl. Anggrek No.12, Jakarta', joinDate: '2026-04-20', status: 'Active' },
      { name: 'Rudi Hartono', phone: '0816-5555-6666', email: 'rudi@mail.com', address: 'Jl. Cempaka No.3, Semarang', joinDate: '2026-05-11', status: 'Inactive' },
      { name: 'Maya Kusuma', phone: '0817-6666-7777', email: 'maya@mail.com', address: 'Jl. Flamboyan No.7, Yogyakarta', joinDate: '2026-06-05', status: 'Active' }
    ];
    var mIds = [];
    members.forEach(function (m) {
      var res = LG.createMember(db, m, 'U1');
      if (res.ok) mIds.push(res.member.id);
    });
    var BUDI = mIds[0], SITI = mIds[1], AGUS = mIds[2], DEWI = mIds[3], MAYA = mIds[5];

    /* --- Simpanan --- */
    function sv(memberId, type, amount, date, ref, w, notes) {
      LG.recordSavings(db, { member_id: memberId, type: type, amount: amount, date: date, reference: ref, wallet_id: w, notes: notes || '' }, 'U1');
    }
    sv(BUDI, 'Pokok', 500000, '2026-01-10', 'SVP-001', 'W1');
    sv(BUDI, 'Wajib', 100000, '2026-08-01', 'SVP-008', 'W1');
    sv(BUDI, 'Sukarela', 500000, '2026-06-15', 'SVP-003', 'W1', 'Tabungan liburan');
    sv(SITI, 'Pokok', 500000, '2026-02-14', 'SVP-002', 'W1');
    sv(SITI, 'Wajib', 100000, '2026-08-01', 'SVP-009', 'W1');
    sv(AGUS, 'Pokok', 500000, '2026-03-02', 'SVP-004', 'W1');
    sv(AGUS, 'Wajib', 100000, '2026-08-01', 'SVP-010', 'W1');
    sv(DEWI, 'Pokok', 500000, '2026-04-20', 'SVP-005', 'W1');
    sv(DEWI, 'Wajib', 100000, '2026-08-01', 'SVP-011', 'W1');
    sv(MAYA, 'Pokok', 500000, '2026-06-05', 'SVP-006', 'W1');
    sv(MAYA, 'Wajib', 100000, '2026-08-01', 'SVP-012', 'W1');

    /* --- Pinjaman --- */
    function loan(memberId, principal, method, rate, tenor, start) {
      var r = LG.createLoan(db, { member_id: memberId, principal: principal, method: method, rate: rate, tenor: tenor, startDate: start }, 'U1');
      return r.loan;
    }
    function payRows(loanId, count) {
      for (var k = 0; k < count; k++) {
        var loan = db.dapin_loans.find(function (l) { return l.id === loanId; });
        if (!loan) return;
        var row = loan.schedule.find(function (r) { return r.status !== 'Paid'; });
        if (!row) return;
        LG.processPayment(db, { loan_id: loanId, amount: row.total, date: row.dueDate, wallet_id: 'W1', method: 'cash' }, 'U1');
      }
    }
    var l1 = loan(BUDI, 10000000, 'flat', 1.2, 12, '2026-05-01'); payRows(l1.id, 2);   /* Mei–Jun dibayar; #3 (01 Agu) overdue */
    var l2 = loan(SITI, 15000000, 'annuity', 12, 12, '2026-03-01'); payRows(l2.id, 4); /* Mar–Jul #1-4 dibayar; #5 (01 Agu) overdue */
    var l3 = loan(AGUS, 5000000, 'flat', 1.0, 6, '2026-02-15'); payRows(l3.id, 6);      /* lunas */
    var l4 = loan(DEWI, 8000000, 'flat', 1.5, 10, '2026-08-01');                        /* angsuran pertama 01 Sep → Upcoming */
    var l5 = loan(MAYA, 3000000, 'flat', 0.8, 6, '2026-07-20'); payRows(l5.id, 1);

    /* --- Hitung ulang saldo wallet dari seluruh transaksi (satu sumber kebenaran) --- */
    db.wallets.forEach(function (w) {
      w.balance = db.transactions.filter(function (t) { return t.wallet_id === w.id; })
        .reduce(function (s, t) { return s + (t.type === 'income' ? t.amount : -t.amount); }, 0);
    });

    /* --- Link USER (U3) ke anggota DAPIN pertama (Budi) + tambah akun anggota lain --- */
    db.users[2].dapin_member_id = BUDI;  /* Andi User → Budi Santoso */
    db.users.push({ id: 'U4', name: 'Siti Rahayu', email: 'siti@finora.app', password: 'siti123', role: 'USER', dapin_member_id: SITI });
    db.users.push({ id: 'U5', name: 'Agus Wijaya', email: 'agus@finora.app', password: 'agus123', role: 'USER', dapin_member_id: AGUS });
    db.users.push({ id: 'U6', name: 'Dewi Lestari', email: 'dewi@finora.app', password: 'dewi123', role: 'USER', dapin_member_id: DEWI });
    db.users.push({ id: 'U7', name: 'Maya Kusuma', email: 'maya@finora.app', password: 'maya123', role: 'USER', dapin_member_id: MAYA });

    db.silentNotifications = false;
    db.sessionUser = null;
    /* Notifikasi kurasi untuk demo */
    LG.notify(db, 'Angsuran #03 Budi Santoso (LN-001) sudah melewati jatuh tempo.', 'warn', '#/dapin/due-dates');
    LG.notify(db, 'Angsuran #05 Siti Rahayu (LN-002) sudah melewati jatuh tempo.', 'warn', '#/dapin/due-dates');
    LG.notify(db, 'Pinjaman LN-003 (Agus Wijaya) telah LUNAS. 🎉', 'success', '#/dapin/loans');
    LG.notify(db, 'Pembayaran PAY-013 (Maya Kusuma) berhasil dicatat.', 'success', '#/dapin/payments');
    LG.notify(db, 'Simpanan Pokok Rp500.000 untuk Maya Kusuma tercatat.', 'info', '#/dapin/savings');
    LG.notify(db, 'Terdapat 2 pembayaran yang telah overdue.', 'warn', '#/dapin/due-dates');

    DB.save(db);
    return db;
  }

  function resetDemo() { DB.clear(); return seed(); }
  root.SEED = { seed: seed, resetDemo: resetDemo };
  return root.SEED;
})(typeof window !== 'undefined' ? window : globalThis);
