/* FINORA x DAPIN — Views: Dashboard & FINORA (transactions, wallet, budget, analytics, reports) */
(function (root) {
  var UIK = root.UIK, LG = root.LG, CH = root.CH;
  var esc = UIK.esc, icon = UIK.icon, badge = UIK.badge, money = root.APP.money, fmt = UIK.fmt;
  var Pages = root.Pages;

  function lastMonths(n) {
    var out = [], d = new Date();
    for (var i = n - 1; i >= 0; i--) {
      var dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push({ y: dt.getFullYear(), m: String(dt.getMonth() + 1).padStart(2, '0'), label: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][dt.getMonth()] });
    }
    return out;
  }
  function monthlySeries(db, n) {
    var months = lastMonths(n);
    var inc = months.map(function (mo) { return db.transactions.filter(function (t) { return t.type === 'income' && t.date.slice(0, 7) === mo.y + '-' + mo.m; }).reduce(function (s, t) { return s + t.amount; }, 0); });
    var exp = months.map(function (mo) { return db.transactions.filter(function (t) { return t.type === 'expense' && t.date.slice(0, 7) === mo.y + '-' + mo.m; }).reduce(function (s, t) { return s + t.amount; }, 0); });
    return { labels: months.map(function (m) { return m.label; }), inc: inc, exp: exp };
  }
  function cumSavings(db, n) {
    var months = lastMonths(n); var run = 0;
    return months.map(function (mo) {
      run += db.dapin_savings.filter(function (s) { return s.date.slice(0, 7) === mo.y + '-' + mo.m; }).reduce(function (s, x) { return s + x.amount; }, 0);
      return run;
    });
  }

  /* ================= DASHBOARD (FINORA) ================= */
  Pages.dashboard = function () {
    var db = root.APP.getDB();
    var f = LG.financeTotals(db);
    var due = LG.dueItems(db, 1);
    var ms = monthlySeries(db, 6);
    var txs = db.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 8);
    var budgets = db.budgets;
    return root.APP.pageHead('Dashboard', 'Gambaran menyeluruh keuangan & simpan-pinjam FINORA × DAPIN') +
      '<div class="kpis">' +
        stat('wallet', 'Total Balance', money(f.balance), 'Semua wallet', 'k-primary') +
        stat('tx', 'Total Income', money(f.income), 'Semua pemasukan', 'k-green') +
        stat('tx', 'Total Expenses', money(f.expense), 'Semua pengeluaran', 'k-red') +
        stat('savings', 'Total Savings', money(f.savings), 'Simpanan anggota DAPIN', 'k-dapin') +
        stat('loans', 'DAPIN Outstanding', money(f.outstanding), 'Pinjaman berjalan', 'k-violet') +
        stat('due', 'DAPIN Receivable', money(f.receivable), 'Tagihan belum dibayar', 'k-orange') +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-t"><h3>Arus Kas (Income vs Expense)</h3></div>' + CH.bar({ labels: ms.labels, series: [{ name: 'Income', data: ms.inc, color: CH.C.income }, { name: 'Expense', data: ms.exp, color: CH.C.expense }] }) + '</div>' +
        '<div class="card"><div class="card-t"><h3>Pertumbuhan Simpanan DAPIN</h3><span class="chip dapin">DAPIN</span></div>' + CH.line({ labels: ms.labels, series: [{ name: 'Saldo Simpanan', data: cumSavings(db, 6), color: CH.C.dapin }] }) + '</div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-t"><h3>Anggaran Bulan Ini</h3><a class="link" href="#/finance/budget">Kelola</a></div>' + CH.hbars(budgets.map(function (b) {
          var pct = b.limit ? b.spent / b.limit * 100 : 0;
          return { label: b.category, value: b.spent, right: money(b.spent) + ' / ' + money(b.limit), pct: pct, tone: pct > 100 ? 'fill-red' : pct > 80 ? 'fill-orange' : 'fill-green' };
        })) + '</div>' +
        '<div class="card"><div class="card-t"><h3>Jatuh Tempo (Hari Ini & Besok)</h3><a class="link" href="#/dapin/due-dates">Semua</a></div>' +
          (due.length ? due.map(function (d) {
            var tone = d.status === 'Overdue' ? 't-red' : d.status === 'DueToday' ? 't-orange' : 't-blue';
            return '<div class="due-row"><div>' + root.APP.avatar(d.member, 30) + '<div><b>' + esc(d.member) + '</b><small>' + esc(d.loan) + ' · Angsuran #' + d.installment + '</small></div></div><div class="due-right"><b>' + money(d.amount) + '</b><span class="badge ' + tone + '">' + (d.status === 'Overdue' ? 'Terlambat ' + (-d.days) + ' hr' : d.status === 'DueToday' ? 'Hari ini' : 'Besok') + '</span></div></div>';
          }).join('') : UIK.emptyState('check', 'Aman', 'Tidak ada jatuh tempo hari ini/besok.')) +
        '</div>' +
      '</div>' +
      '<div class="card"><div class="card-t"><h3>Transaksi Terbaru</h3><a class="link" href="#/finance/transactions">Lihat semua</a></div>' +
        root.APP.tbl(
          [{ label: 'Tanggal', fn: function (t) { return fmt.date(t.date); } }, { label: 'Keterangan', fn: function (t) { return '<b>' + esc(t.notes) + '</b><small class="sub">' + esc(t.category) + '</small>'; } }, { label: 'Wallet', fn: function (t) { var w = db.wallets.find(function (x) { return x.id === t.wallet_id; }); return esc(w ? w.name : '—'); } }, { label: 'Jumlah', fn: function (t) { return '<span class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '−') + money(t.amount) + '</span>'; } }],
          txs, { emptyTitle: 'Belum ada transaksi' }
        ) + '</div>';
  };
  function stat(ic, label, value, sub, cls) {
    return '<div class="kpi card ' + cls + '"><div class="kpi-ic">' + icon(ic) + '</div><div><div class="kpi-label">' + esc(label) + '</div><div class="kpi-value">' + value + '</div><div class="kpi-sub">' + esc(sub) + '</div></div></div>';
  }

  /* ================= TRANSACTIONS ================= */
  Pages.transactions = function () {
    var db = root.APP.getDB();
    var q = '';
    function body() {
      var rows = db.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
      if (q) rows = rows.filter(function (t) { return (t.notes + t.category + (t.reference || '')).toLowerCase().indexOf(q) >= 0; });
      var inc = rows.filter(function (t) { return t.type === 'income'; }).reduce(function (s, t) { return s + t.amount; }, 0);
      var exp = rows.filter(function (t) { return t.type === 'expense'; }).reduce(function (s, t) { return s + t.amount; }, 0);
      return '<div class="kpis mini">' + stat('tx', 'Pemasukan', money(inc), '', 'k-green') + stat('tx', 'Pengeluaran', money(exp), '', 'k-red') + stat('wallet', 'Selisih', money(inc - exp), '', 'k-primary') + '</div>' +
        root.APP.tbl(
          [{ label: 'Tanggal', fn: function (t) { return fmt.date(t.date); } }, { label: 'Tipe', fn: function (t) { return badge(t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'); } }, { label: 'Kategori', k: 'category' }, { label: 'Keterangan', k: 'notes' }, { label: 'Referensi', k: 'reference' }, { label: 'Wallet', fn: function (t) { var w = db.wallets.find(function (x) { return x.id === t.wallet_id; }); return esc(w ? w.name : '—'); } }, { label: 'Jumlah', fn: function (t) { return '<span class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '−') + money(t.amount) + '</span>'; } }],
          rows, { emptyTitle: 'Belum ada transaksi', emptyDesc: 'Tambahkan transaksi pertama Anda.' }
        );
    }
    return root.APP.pageHead('Transaksi', 'Seluruh pemasukan & pengeluaran FINORA (termasuk aktivitas DAPIN)', '<button class="btn btn-primary" id="btnAddTx">' + icon('plus') + ' Transaksi Baru</button> <button class="btn btn-ghost" id="btnCsvTx">' + icon('download') + ' CSV</button>') +
      '<div class="toolbar"><div class="search-inline">' + icon('search') + '<input id="txSearch" placeholder="Cari transaksi…"></div></div>' +
      '<div id="txBody">' + body() + '</div>';
  };
  Pages._bind_transactions = function () {
    var db = root.APP.getDB();
    document.getElementById('txSearch').addEventListener('input', function (e) {
      var q = e.target.value.toLowerCase();
      var rows = db.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).filter(function (t) { return !q || (t.notes + t.category).toLowerCase().indexOf(q) >= 0; });
      var inc = rows.filter(function (t) { return t.type === 'income'; }).reduce(function (s, t) { return s + t.amount; }, 0);
      var exp = rows.filter(function (t) { return t.type === 'expense'; }).reduce(function (s, t) { return s + t.amount; }, 0);
      document.getElementById('txBody').innerHTML = '<div class="kpis mini">' + stat('tx', 'Pemasukan', money(inc), '', 'k-green') + stat('tx', 'Pengeluaran', money(exp), '', 'k-red') + stat('wallet', 'Selisih', money(inc - exp), '', 'k-primary') + '</div>' +
        root.APP.tbl([{ label: 'Tanggal', fn: function (t) { return fmt.date(t.date); } }, { label: 'Tipe', fn: function (t) { return badge(t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'); } }, { label: 'Kategori', k: 'category' }, { label: 'Keterangan', k: 'notes' }, { label: 'Referensi', k: 'reference' }, { label: 'Wallet', fn: function (t) { var w = db.wallets.find(function (x) { return x.id === t.wallet_id; }); return esc(w ? w.name : '—'); } }, { label: 'Jumlah', fn: function (t) { return '<span class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '−') + money(t.amount) + '</span>'; } }], rows);
    });
    document.getElementById('btnAddTx').onclick = function () { openTxModal(); };
    document.getElementById('btnCsvTx').onclick = function () { exportCSV('transaksi', [['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Referensi', 'Wallet', 'Jumlah']].concat(db.transactions.map(function (t) { var w = db.wallets.find(function (x) { return x.id === t.wallet_id; }); return [t.date, t.type, t.category, t.notes, t.reference || '', w ? w.name : '', t.type === 'income' ? t.amount : -t.amount]; }))); };
  };
  function openTxModal() {
    var db = root.APP.getDB();
    var walletOpts = db.wallets.map(function (w) { return { v: w.id, l: w.name }; });
    UIK.openModal('<h3>Tambah Transaksi</h3><form id="txForm"><div class="frow">' +
      UIK.field('Tipe', UIK.select('type', [{ v: 'income', l: 'Pemasukan' }, { v: 'expense', l: 'Pengeluaran' }], 'income')) +
      UIK.field('Jumlah (Rp)', UIK.input('amount', '', '0', 'number')) + '</div>' +
      UIK.field('Kategori', UIK.input('category', '', 'mis. Operasional')) +
      '<div class="frow">' + UIK.field('Tanggal', UIK.input('date', DB.today(), '', 'date')) + UIK.field('Wallet', UIK.select('wallet_id', walletOpts, db.wallets[0] && db.wallets[0].id)) + '</div>' +
      UIK.field('Keterangan', UIK.input('notes', '', 'Catatan')) +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div></form>');
    document.getElementById('txForm').onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(e.target); var amt = Number(d.amount);
      if (!amt || amt <= 0) { UIK.toast('Jumlah tidak valid.', 'error'); return; }
      var w = db.wallets.find(function (x) { return x.id === d.wallet_id; });
      w.balance = Math.round((w.balance + (d.type === 'income' ? amt : -amt)) * 100) / 100;
      db.transactions.push({ id: DB.uid('TXN'), user_id: root.APP.getSession().userId, type: d.type, category: d.category || 'Lainnya', amount: amt, date: d.date, wallet_id: w.id, reference: '', notes: d.notes || '', created_at: DB.nowISO() });
      root.APP.afterMutate(); UIK.closeModal(); UIK.toast('Transaksi disimpan.', 'success'); root.APP.nav('/finance/transactions');
    };
  }

  /* ================= WALLET ================= */
  Pages.wallet = function () {
    var db = root.APP.getDB();
    var total = db.wallets.reduce(function (s, w) { return s + w.balance; }, 0);
    var typeLabel = { cash: 'Tunai', bank: 'Bank', ewallet: 'E-Wallet' };
    var recent = db.transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 6);
    return root.APP.pageHead('Wallet', 'Dompet & rekening — satu sumber saldo untuk FINORA dan DAPIN', root.APP.canManage() ? '<button class="btn btn-primary" id="btnAddWal">' + icon('plus') + ' Wallet Baru</button>' : '') +
      '<div class="wallet-grid">' + db.wallets.map(function (w) {
        return '<div class="wallet-card card"><div class="wallet-top"><span class="wallet-ic">' + icon(w.type === 'bank' ? 'bank' : w.type === 'ewallet' ? 'ew' : 'cash') + '</span><span class="badge">' + (typeLabel[w.type] || w.type) + '</span></div><div class="wallet-name">' + esc(w.name) + '</div><div class="wallet-bal">' + money(w.balance) + '</div><div class="wallet-foot"><small>Terhubung ke FINORA & DAPIN</small></div></div>';
      }).join('') +
      '<div class="wallet-card card wallet-total"><div class="wallet-top"><span class="wallet-ic">' + icon('wallet') + '</span></div><div class="wallet-name">Total Saldo</div><div class="wallet-bal">' + money(total) + '</div></div></div>' +
      '<div class="card"><div class="card-t"><h3>Pergerakan Terakhir</h3></div>' + root.APP.tbl(
        [{ label: 'Tanggal', fn: function (t) { return fmt.date(t.date); } }, { label: 'Keterangan', k: 'notes' }, { label: 'Wallet', fn: function (t) { var w = db.wallets.find(function (x) { return x.id === t.wallet_id; }); return esc(w ? w.name : '—'); } }, { label: 'Jumlah', fn: function (t) { return '<span class="' + (t.type === 'income' ? 'pos' : 'neg') + '">' + (t.type === 'income' ? '+' : '−') + money(t.amount) + '</span>'; } }], recent) + '</div>';
  };
  Pages._bind_wallet = function () {
    var b = document.getElementById('btnAddWal');
    if (!b) return;
    b.onclick = function () {
      UIK.openModal('<h3>Tambah Wallet</h3><form id="walForm">' +
        UIK.field('Nama', UIK.input('name', '', 'mis. Kas Kecil')) +
        '<div class="frow">' + UIK.field('Tipe', UIK.select('type', [{ v: 'cash', l: 'Tunai' }, { v: 'bank', l: 'Bank' }, { v: 'ewallet', l: 'E-Wallet' }], 'cash')) + UIK.field('Saldo Awal', UIK.input('balance', '0', '0', 'number')) + '</div>' +
        '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div></form>');
      document.getElementById('walForm').onsubmit = function (e) {
        e.preventDefault();
        var d = UIK.formdata(e.target);
        var res = LG.createWallet(root.APP.getDB(), d, root.APP.getSession().userId);
        if (!res.ok) { UIK.toast(res.error, 'error'); return; }
        root.APP.afterMutate(); UIK.closeModal(); UIK.toast('Wallet ditambahkan.', 'success'); location.hash = '#/finance/wallet'; location.reload();
      };
    };
  };

  /* ================= BUDGET ================= */
  Pages.budget = function () {
    var db = root.APP.getDB();
    var totalLimit = db.budgets.reduce(function (s, b) { return s + b.limit; }, 0);
    var totalSpent = db.budgets.reduce(function (s, b) { return s + b.spent; }, 0);
    return root.APP.pageHead('Budget', 'Penganggaran per kategori bulan ini', root.APP.canManage() ? '<button class="btn btn-primary" id="btnAddBud">' + icon('plus') + ' Budget Baru</button>' : '') +
      '<div class="kpis mini">' + stat('budget', 'Total Anggaran', money(totalLimit), '', 'k-primary') + stat('budget', 'Terpakai', money(totalSpent), '', 'k-orange') + stat('budget', 'Sisa', money(totalLimit - totalSpent), '', 'k-green') + '</div>' +
      '<div class="card"><div class="card-t"><h3>Anggaran per Kategori</h3></div>' + CH.hbars(db.budgets.map(function (b) {
        var pct = b.limit ? b.spent / b.limit * 100 : 0;
        return { label: b.category, value: b.spent, right: money(b.spent) + ' / ' + money(b.limit) + ' (' + Math.round(pct) + '%)', pct: pct, tone: pct > 100 ? 'fill-red' : pct > 80 ? 'fill-orange' : 'fill-green' };
      })) + '</div>' +
      '<div class="card">' + root.APP.tbl(
        [{ label: 'Kategori', k: 'category' }, { label: 'Anggaran', fn: function (b) { return money(b.limit); } }, { label: 'Terpakai', fn: function (b) { return money(b.spent); } }, { label: 'Sisa', fn: function (b) { return '<span class="' + (b.limit - b.spent >= 0 ? 'pos' : 'neg') + '">' + money(b.limit - b.spent) + '</span>'; } }, { label: 'Progres', fn: function (b) { var p = b.limit ? Math.round(b.spent / b.limit * 100) : 0; return '<div class="bar-sm"><div class="bar-sm-fill ' + (p > 100 ? 'fill-red' : p > 80 ? 'fill-orange' : 'fill-green') + '" style="width:' + Math.min(100, p) + '%"></div></div><small>' + p + '%</small>'; } }], db.budgets) + '</div>';
  };
  Pages._bind_budget = function () {
    var b = document.getElementById('btnAddBud');
    if (!b) return;
    b.onclick = function () {
      UIK.openModal('<h3>Tambah Budget</h3><form id="budForm">' + UIK.field('Kategori', UIK.input('category', '', 'mis. Marketing')) + '<div class="frow">' + UIK.field('Limit (Rp)', UIK.input('limit', '', '0', 'number')) + UIK.field('Terpakai (Rp)', UIK.input('spent', '0', '0', 'number')) + '</div><div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div></form>');
      document.getElementById('budForm').onsubmit = function (e) {
        e.preventDefault();
        var d = UIK.formdata(e.target);
        if (!Number(d.limit)) { UIK.toast('Limit wajib diisi.', 'error'); return; }
        root.APP.getDB().budgets.push({ id: DB.uid('B'), category: d.category || 'Lainnya', limit: Number(d.limit), spent: Number(d.spent) || 0, period: DB.today().slice(0, 7) });
        root.APP.afterMutate(); UIK.closeModal(); UIK.toast('Budget disimpan.', 'success'); location.reload();
      };
    };
  };

  /* ================= ANALYTICS ================= */
  Pages.analytics = function () {
    var db = root.APP.getDB();
    var ms = monthlySeries(db, 6);
    var byCat = {};
    db.transactions.filter(function (t) { return t.type === 'expense'; }).forEach(function (t) { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
    var catItems = Object.keys(byCat).map(function (k, i) { var colors = [CH.C.violet, CH.C.primary, CH.C.cyan, CH.C.pink, CH.C.warn, CH.C.dapin]; return { label: k, value: byCat[k], color: colors[i % colors.length] }; });
    var f = LG.financeTotals(db);
    var savRate = f.income ? Math.round((f.income - f.expense) / f.income * 100) : 0;
    return root.APP.pageHead('Analytics', 'Wawasan keuangan FINORA × DAPIN') +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-t"><h3>Arus Kas 6 Bulan</h3></div>' + CH.line({ labels: ms.labels, series: [{ name: 'Income', data: ms.inc, color: CH.C.income }, { name: 'Expense', data: ms.exp, color: CH.C.expense }] }) + '</div>' +
        '<div class="card"><div class="card-t"><h3>Pengeluaran per Kategori</h3></div>' + CH.donut({ items: catItems, center: 'Pengeluaran' }) + '</div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-t"><h3>Net Cash Flow</h3></div>' + CH.bar({ labels: ms.labels, series: [{ name: 'Net', data: ms.inc.map(function (v, i) { return v - ms.exp[i]; }), color: CH.C.primary }] }) + '</div>' +
        '<div class="card"><div class="card-t"><h3>Rasio Keuangan</h3><span class="chip dapin">DAPIN</span></div>' + CH.hbars([
          { label: 'Savings / Income', value: f.income ? f.savings / f.income * 100 : 0, right: Math.round(f.income ? f.savings / f.income * 100 : 0) + '%', pct: f.income ? f.savings / f.income * 100 : 0, tone: 'fill-green' },
          { label: 'Outstanding / Savings', value: f.savings ? f.outstanding / f.savings * 100 : 0, right: Math.round(f.savings ? f.outstanding / f.savings * 100 : 0) + '%', pct: f.savings ? f.outstanding / f.savings * 100 : 0, tone: 'fill-orange' },
          { label: 'Receivable / Outstanding', value: f.outstanding ? f.receivable / f.outstanding * 100 : 0, right: Math.round(f.outstanding ? f.receivable / f.outstanding * 100 : 0) + '%', pct: f.outstanding ? f.receivable / f.outstanding * 100 : 0, tone: 'fill-violet' }
        ]) + '<div class="chip-line"><span class="chip">Rasio Tabungan: <b>' + savRate + '%</b></span><span class="chip">Pendapatan: <b>' + money(f.income) + '</b></span></div></div>' +
      '</div>';
  };

  /* ================= FINORA REPORTS ================= */
  Pages.financeReports = function () {
    var db = root.APP.getDB();
    var f = LG.financeTotals(db);
    var ms = monthlySeries(db, 6);
    function cashflow() {
      return ms.labels.map(function (l, i) { return [l + ' 2026', ms.inc[i], ms.exp[i], ms.inc[i] - ms.exp[i]]; });
    }
    function walletRows() {
      return db.wallets.map(function (w) { return [w.name, w.type, w.balance]; });
    }
    function savingsRows() {
      var byM = {};
      db.dapin_savings.forEach(function (s) { var k = s.member_name; byM[k] = (byM[k] || 0) + s.amount; });
      return Object.keys(byM).map(function (k) { return [k, byM[k]]; });
    }
    var reports = [
      { name: 'Laporan Pemasukan', desc: 'Rekap seluruh income per bulan.', icon: 'tx', data: ms.labels.map(function (l, i) { return [l + ' 2026', ms.inc[i]]; }), head: ['Bulan', 'Pemasukan'] },
      { name: 'Laporan Pengeluaran', desc: 'Rekap seluruh expense per bulan.', icon: 'tx', data: ms.labels.map(function (l, i) { return [l + ' 2026', ms.exp[i]]; }), head: ['Bulan', 'Pengeluaran'] },
      { name: 'Laporan Arus Kas', desc: 'Cash flow bersih 6 bulan terakhir.', icon: 'analytics', data: cashflow(), head: ['Bulan', 'Masuk', 'Keluar', 'Net'] },
      { name: 'Laporan Wallet', desc: 'Saldo rekening / dompet saat ini.', icon: 'wallet', data: walletRows(), head: ['Wallet', 'Tipe', 'Saldo'] },
      { name: 'Laporan Simpanan (via DAPIN)', desc: 'Total simpanan anggota DAPIN.', icon: 'savings', data: savingsRows(), head: ['Anggota', 'Total Simpanan'] }
    ];
    var cards = reports.map(function (r, i) {
      return '<div class="report-card card"><div class="report-ic">' + icon(r.icon) + '</div><div><b>' + esc(r.name) + '</b><p class="muted">' + esc(r.desc) + '</p><div class="report-actions"><button class="btn btn-ghost btn-sm" data-rp="' + i + '">Lihat</button><button class="btn btn-ghost btn-sm" data-csv="' + i + '">' + icon('download') + ' CSV</button><button class="btn btn-ghost btn-sm" data-print="' + i + '">Cetak</button></div></div></div>';
    }).join('');
    return root.APP.pageHead('Reports — FINORA', 'Laporan keuangan, siap ekspor (PDF/CSV)') + '<div class="report-grid">' + cards + '</div>';
  };
  Pages._bind_financeReports = function () {
    var db = root.APP.getDB();
    var ms = monthlySeries(db, 6);
    var REP = {
      0: { head: ['Bulan', 'Pemasukan'], rows: ms.labels.map(function (l, i) { return [l + ' 2026', ms.inc[i]]; }) },
      1: { head: ['Bulan', 'Pengeluaran'], rows: ms.labels.map(function (l, i) { return [l + ' 2026', ms.exp[i]]; }) },
      2: { head: ['Bulan', 'Masuk', 'Keluar', 'Net'], rows: ms.labels.map(function (l, i) { return [l + ' 2026', ms.inc[i], ms.exp[i], ms.inc[i] - ms.exp[i]]; }) },
      3: { head: ['Wallet', 'Tipe', 'Saldo'], rows: db.wallets.map(function (w) { return [w.name, w.type, w.balance]; }) },
      4: { head: ['Anggota', 'Total Simpanan'], rows: (function () { var byM = {}; db.dapin_savings.forEach(function (s) { byM[s.member_name] = (byM[s.member_name] || 0) + s.amount; }); return Object.keys(byM).map(function (k) { return [k, byM[k]]; }); })() }
    };
    document.querySelectorAll('[data-rp]').forEach(function (b) { b.onclick = function () { showReportModal(REP[Number(b.getAttribute('data-rp'))]); }; });
    document.querySelectorAll('[data-csv]').forEach(function (b) { b.onclick = function () { var r = REP[Number(b.getAttribute('data-csv'))]; exportCSV(r.head[0] + '-laporan', [r.head].concat(r.rows)); }; });
    document.querySelectorAll('[data-print]').forEach(function (b) { b.onclick = function () { var r = REP[Number(b.getAttribute('data-print'))]; showReportModal(r, true); }; });
  };
  function showReportModal(r, doPrint) {
    var table = '<table class="report-table"><thead><tr>' + r.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + r.rows.map(function (row) { return '<tr>' + row.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    if (doPrint) {
      var w = window.open('', '_blank');
      w.document.write('<html><head><title>Laporan FINORA × DAPIN</title><style>body{font-family:sans-serif;padding:32px;color:#111}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #ccc;padding:8px 12px;text-align:left}th{background:#f3f4f6}</style></head><body><h2>Laporan FINORA × DAPIN</h2>' + table + '</body></html>');
      w.document.close(); w.print();
      return;
    }
    UIK.openModal('<h3>Laporan</h3>' + table, true);
  }
  function exportCSV(name, rows) {
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.csv'; a.click();
    UIK.toast('CSV diunduh: ' + name + '.csv', 'success');
  }
  root.APP.exportCSV = exportCSV;
  root.APP.reportModal = showReportModal;
})(typeof window !== 'undefined' ? window : globalThis);
