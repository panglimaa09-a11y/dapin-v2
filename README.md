# FINORA × DAPIN — One Fintech Ecosystem

**Modern Financial Management & Digital Lending Platform.**

Satu aplikasi web mandiri (tanpa build step) yang menggabungkan **FINORA** (financial dashboard)
dan **DAPIN** (modul simpan-pinjam / pembiayaan) sebagai satu ekosistem dengan satu navigasi,
satu sumber data, dan satu design system.

## Menjalankan

Buka `index.html` langsung di browser, atau jalankan server statis:

```bash
npx serve .
# lalu buka http://localhost:3000
```

Data tersimpan di **localStorage** browser (persisten antar sesi). Tombol *Reset Data Demo*
ada di layar login & halaman Settings.

### Akun demo

| Role            | Email              | Password  |
|-----------------|--------------------|-----------|
| SUPER ADMIN     | admin@finora.app   | admin123  |
| DAPIN STAFF     | staff@finora.app   | staff123  |
| USER            | user@finora.app    | user123   |

## Struktur

```
css/style.css           Design system (dark, glassmorphism, responsif)
js/data.js              Lapisan data (adapter localStorage — ganti ke Supabase untuk produksi)
js/charts.js            Grafik SVG ringan (line, bar, donut, hbar)
js/logic.js             Mesin bisnis: kalkulasi pinjaman + cascade pembayaran (murni, atomik)
js/ui.js                UI kit: ikon, modal, toast, badge, state loading/empty/error
js/auth.js              Auth demo (verifikasi lokal — ganti ke Supabase Auth untuk produksi)
js/seed.js              Seed data demo yang konsisten (semua lewat business logic)
js/app-core.js          Boot, sidebar, router hash, pencarian global, notifikasi, shell
js/views-finance.js     Dashboard, Transactions, Wallet, Budget, Analytics, Reports
js/views-dapin.js       DAPIN: Overview, Members, Profile, Savings, Loans, Installments, Payments, Due Dates, Ledger, Reports
js/views-tools.js       Kalkulator Keuangan, Pinjaman, Tabungan
js/views-system.js      Notifikasi, Profile, Settings, Audit Logs
test/self-test.js       Uji konsistensi data (Node)
test/dom-test.js        Uji render seluruh halaman (Node + jsdom)
```

## Konsistensi data (inti)

Satu pembayaran angsuran menjalankan **cascade atomik** dalam satu fungsi:

```
Payment → installment (status Paid/Partial) → remaining_balance pinjaman
        → status pinjaman (Completed jika lunas) → saldo wallet FINORA
        → transaksi FINORA (income) → ledger DAPIN (pokok + bunga terpisah)
        → notifikasi → audit log
```

Metode bunga: **Flat** (per bulan) dan **Anuitas** (per tahun). Formula ditampilkan
transparan di antarmuka.

## Mode demo vs produksi

- **Demo ini**: localStorage, auth verifikasi lokal, satu organisasi, tanpa server.
- **Produksi (Supabase + Vercel)**: ganti adapter `js/data.js` ke Supabase (Auth, PostgreSQL,
  RLS, Storage) — seluruh lapisan logika `js/logic.js` tetap dipakai tanpa perubahan;
  tambah RLS `user_id` / `organization_id`; ubah pendaftaran ke Supabase Auth; lalu deploy ke Vercel.
- Belum ada migrasi otomatis ke Supabase — kredensial tidak pernah disimpan di frontend.

## Fitur lengkap

- Dashboard 6 KPI (Balance, Income, Expense, Savings, DAPIN Outstanding, DAPIN Receivable)
- Wallet multi-rekening (cash / bank / e-wallet) sebagai satu sumber saldo
- Manajemen anggota (CRUD, cari, filter, profil per anggota dengan riwayat transaksi)
- Simpanan configurable (Pokok / Wajib / Sukarela)
- Pinjaman: pembuatan otomatis jadwal angsuran, kalkulasi bunga transparan
- Installments, Payments, Due Dates (overdue, hari ini, mendatang) dengan peringatan visual
- Ledger DAPIN permanen (SAVINGS_DEPOSIT, LOAN_CREATED, LOAN_DISBURSED, INSTALLMENT_PAYMENT, INTEREST_PAYMENT, ADJUSTMENT)
- Laporan FINORA & DAPIN dengan ekspor **CSV** dan **Cetak/PDF** (window.print)
- Notifikasi terintegrasi + badge, pencarian global (teknikal `/`), role-based access,
  audit log, sidebar collapsible & mobile drawer, tabel responsif kartu di HP
