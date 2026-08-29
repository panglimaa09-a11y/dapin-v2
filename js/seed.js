/**
 * FINORA × DAPIN — Seed Data
 * Demo users (admin + anggota), members, savings, loans, transactions, wallets.
 */
const SeedData = {
  create() {
    const today = new Date().toISOString().slice(0,10);

    const members = [
      { id: 'M001', name: 'Budi Santoso',   email: 'budi@finora.com',   phone: '0812-1111-0001', joinedDate: '2026-01-15', status: 'active' },
      { id: 'M002', name: 'Siti Rahayu',    email: 'siti@finora.com',   phone: '0812-1111-0002', joinedDate: '2026-02-20', status: 'active' },
      { id: 'M003', name: 'Agus Wijaya',    email: 'agus@finora.com',   phone: '0812-1111-0003', joinedDate: '2026-03-10', status: 'active' },
      { id: 'M004', name: 'Dewi Lestari',   email: 'dewi@finora.com',   phone: '0812-1111-0004', joinedDate: '2026-04-05', status: 'active' },
      { id: 'M005', name: 'Maya Putri',     email: 'maya@finora.com',   phone: '0812-1111-0005', joinedDate: '2026-05-12', status: 'active' },
    ];

    const users = [
      // Admin
      { id: 'U_ADMIN', name: 'Administrator', email: 'admin@finora.com', password: 'admin123', role: 'admin', memberId: null },
      // Anggota — password sama untuk demo: member123
      { id: 'U_BUDI', name: 'Budi Santoso',   email: 'budi@finora.com',   password: 'member123', role: 'member', memberId: 'M001' },
      { id: 'U_SITI', name: 'Siti Rahayu',    email: 'siti@finora.com',   password: 'member123', role: 'member', memberId: 'M002' },
      { id: 'U_AGUS', name: 'Agus Wijaya',    email: 'agus@finora.com',   password: 'member123', role: 'member', memberId: 'M003' },
      { id: 'U_DEWI', name: 'Dewi Lestari',   email: 'dewi@finora.com',   password: 'member123', role: 'member', memberId: 'M004' },
      { id: 'U_MAYA', name: 'Maya Putri',     email: 'maya@finora.com',   password: 'member123', role: 'member', memberId: 'M005' },
    ];

    const wallets = [
      { id: 'main', name: 'Kas Utama',  balance: 50000000, type: 'cash' },
      { id: 'bank', name: 'Bank BCA',   balance: 75000000, type: 'bank' },
    ];

    const savings = [
      { id: 'S001', memberId: 'M001', type: 'pokok',   amount: 100000, date: '2026-01-15' },
      { id: 'S002', memberId: 'M001', type: 'wajib',   amount: 50000,  date: '2026-02-15' },
      { id: 'S003', memberId: 'M002', type: 'pokok',   amount: 100000, date: '2026-02-20' },
      { id: 'S004', memberId: 'M002', type: 'wajib',   amount: 50000,  date: '2026-03-20' },
      { id: 'S005', memberId: 'M003', type: 'pokok',   amount: 100000, date: '2026-03-10' },
      { id: 'S006', memberId: 'M004', type: 'pokok',   amount: 100000, date: '2026-04-05' },
      { id: 'S007', memberId: 'M005', type: 'pokok',   amount: 100000, date: '2026-05-12' },
    ];

    const loans = [
      {
        id: 'L001', memberId: 'M001', principal: 5000000, interestRate: 12, term: 10, type: 'anuitas',
        disbursementDate: '2026-02-01', status: 'active', paid_amount: 1000000, remaining_balance: 4000000,
        installments: []
      },
      {
        id: 'L002', memberId: 'M002', principal: 3000000, interestRate: 10, term: 6, type: 'flat',
        disbursementDate: '2026-03-01', status: 'active', paid_amount: 500000, remaining_balance: 2500000,
        installments: []
      },
    ];
    // generate schedules
    loans.forEach(l => {
      l.installments = Logic.generateSchedule(l.principal, l.interestRate, l.term, l.type);
      // mark first installment paid for L001
      if (l.id === 'L001' && l.installments[0]) { l.installments[0].status = 'paid'; l.installments[0].paidDate = '2026-03-01'; }
      if (l.id === 'L002' && l.installments[0]) { l.installments[0].status = 'paid'; l.installments[0].paidDate = '2026-04-01'; }
    });

    const payments = [
      { id: 'P001', loanId: 'L001', memberId: 'M001', amount: 1000000, installmentNumber: 1, date: '2026-03-01' },
      { id: 'P002', loanId: 'L002', memberId: 'M002', amount: 500000,  installmentNumber: 1, date: '2026-04-01' },
    ];

    const transactions = [
      { id: 'T001', type: 'income',  category: 'Simpanan Anggota',   amount: 100000,  date: '2026-01-15', description: 'Simpanan pokok Budi',    walletId: 'main' },
      { id: 'T002', type: 'income',  category: 'Simpanan Anggota',   amount: 50000,   date: '2026-02-15', description: 'Simpanan wajib Budi',    walletId: 'main' },
      { id: 'T003', type: 'expense', category: 'Pencairan Pinjaman', amount: 5000000, date: '2026-02-01', description: 'Pencairan Budi',         walletId: 'main' },
      { id: 'T004', type: 'income',  category: 'Angsuran Pinjaman',  amount: 1000000, date: '2026-03-01', description: 'Angsuran Budi',          walletId: 'main' },
      { id: 'T005', type: 'income',  category: 'Simpanan Anggota',   amount: 100000,  date: '2026-02-20', description: 'Simpanan pokok Siti',    walletId: 'main' },
      { id: 'T006', type: 'expense', category: 'Pencairan Pinjaman', amount: 3000000, date: '2026-03-01', description: 'Pencairan Siti',         walletId: 'main' },
      { id: 'T007', type: 'income',  category: 'Angsuran Pinjaman',  amount: 500000,  date: '2026-04-01', description: 'Angsuran Siti',          walletId: 'main' },
    ];

    const notifications = [
      { id: 'N001', date: new Date().toISOString(), read: false, type: 'info', title: 'Selamat datang di FINORA × DAPIN', message: 'Sistem siap digunakan.' },
    ];

    return { users, members, wallets, savings, loans, payments, transactions, notifications };
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = SeedData;
