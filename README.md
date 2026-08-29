# FINORA × DAPIN

**Modern Financial Management & Digital Lending Platform**

FINORA = pusat pengelolaan keuangan (transaksi, saldo, wallet, budget, analytics, reports).
DAPIN = modul simpan-pinjam/pembiayaan di dalam FINORA (anggota, simpanan, pinjaman, angsuran).

## ✨ Fitur Baru — Login Terpisah Panel Admin & Anggota

| Panel | Akses | Fungsi |
|-------|-------|--------|
| **🔧 Admin** | Full control | Dashboard, Keuangan, Wallet, Kelola Anggota, Simpanan, Pinjaman, Buku Besar, Kalkulator, Pengaturan |
| **👤 Anggota** | Terbatas | Beranda, Pinjaman Saya, Bayar Angsuran, Ajukan Pinjaman, Simpanan Saya, Profil |

Anggota **tidak bisa** mengelola anggota lain, menghapus data, atau mengakses keuangan organisasi.
Anggota **hanya bisa** melihat data sendiri, membayar angsuran, dan mengajukan pinjaman baru.

## 🔑 Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@finora.com` | `admin123` |
| Anggota (Budi) | `budi@finora.com` | `member123` |
| Anggota (Siti) | `siti@finora.com` | `member123` |
| Anggota (Agus) | `agus@finora.com` | `member123` |
| Anggota (Dewi) | `dewi@finora.com` | `member123` |
| Anggota (Maya) | `maya@finora.com` | `member123` |

## 🚀 Cara Menjalankan

### Opsi 1 — Buka langsung
Ekstrak ZIP → buka `finora-dapin/index.html` di browser.

### Opsi 2 — Server statis (rekomendasi)
```bash
cd finora-dapin
npx serve .
# atau
python3 -m http.server 8000
```
Buka `http://localhost:8000` atau `http://localhost:3000`.

## 🧪 Pengujian
```bash
node test/self-test.js
```
Memverifikasi: seed data, login separation, loan schedule (anuitas/flat), payment cascade (pembayaran → saldo pinjaman → wallet → transaksi FINORA), role-based access, loan payoff.

## 📁 Struktur File

```
finora-dapin/
├── index.html              # Entry point SPA
├── README.md
├── .gitignore
├── css/
│   └── style.css           # Design system dark fintech
├── js/
│   ├── data.js             # Lapisan data (localStorage)
│   ├── seed.js             # Data demo
│   ├── auth.js             # Auth + role separation (admin/anggota)
│   ├── logic.js            # Kalkulasi pinjaman + cascade pembayaran
│   ├── ui.js               # Pustaka komponen UI
│   ├── charts.js           # Grafik SVG (donut, bar, line)
│   ├── app-core.js         # Shell, sidebar, router, role-based menu
│   ├── views-finance.js    # Halaman FINORA (admin: dashboard, finance, wallet)
│   ├── views-dapin.js      # Halaman DAPIN (admin: kelola; anggota: bayar & pinjam)
│   ├── views-tools.js      # Kalkulator pinjaman
│   └── views-system.js     # Pengaturan sistem
└── test/
    └── self-test.js        # Pengujian konsistensi data
```

## 🏗️ Arsitektur

- **SPA murni** — HTML/CSS/JS, no build step, no framework
- **Data layer** — localStorage, siap ditukar ke Supabase
- **Role-based routing** — menu dan akses berbeda untuk admin vs anggota
- **Cascade pembayaran** — pembayaran angsuran otomatis mengurangi saldo pinjaman, menambah wallet, dan mencatat transaksi FINORA
- **Kalkulasi pinjaman** — anuitas (rumus standar) dan flat

## 📝 Catatan

- Data tersimpan di localStorage browser (per-browser, per-device)
- Tombol **Reset Data Demo** di Settings (admin) untuk kembali ke data awal
- Saat admin menambah anggota baru, akun login anggota otomatis dibuat (password default: `member123`)
