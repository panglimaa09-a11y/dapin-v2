/* FINORA x DAPIN — App Core: boot, auth screens, shell, sidebar, router, global search, notifications */
(function (root) {
  if (root.APP) return root.APP;
  var UIK = root.UIK, LG = root.LG, CH = root.CH, FMT = UIK.fmt;
  var esc = UIK.esc, icon = UIK.icon, badge = UIK.badge;

  var NAV = [
    { group: 'OVERVIEW', items: [
      { path: '/dashboard', label: 'Dashboard', ic: 'dashboard', all: true }
    ]},
    { group: 'FINANCE', items: [
      { path: '/finance/transactions', label: 'Transactions', ic: 'tx', all: true },
      { path: '/finance/wallet', label: 'Wallet', ic: 'wallet', all: true },
      { path: '/finance/budget', label: 'Budget', ic: 'budget', all: true },
      { path: '/finance/analytics', label: 'Analytics', ic: 'analytics', all: true },
      { path: '/finance/reports', label: 'Reports', ic: 'reports', all: true }
    ]},
    { group: 'DAPIN', items: [
      { path: '/dapin', label: 'DAPIN Overview', ic: 'dapin', all: true },
      { path: '/dapin/members', label: 'Members', ic: 'members', all: true },
      { path: '/dapin/savings', label: 'Savings', ic: 'savings', all: true },
      { path: '/dapin/loans', label: 'Loans', ic: 'loans', all: true },
      { path: '/dapin/installments', label: 'Installments', ic: 'installments', all: true },
      { path: '/dapin/payments', label: 'Payments', ic: 'payments', all: true },
      { path: '/dapin/due-dates', label: 'Due Dates', ic: 'due', all: true },
      { path: '/dapin/ledger', label: 'Ledger', ic: 'book', all: true },
      { path: '/dapin/reports', label: 'DAPIN Reports', ic: 'reports', all: true }
    ]},
    { group: 'TOOLS', items: [
      { path: '/tools/financial-calculator', label: 'Financial Calculator', ic: 'calc', all: true },
      { path: '/tools/loan-calculator', label: 'Loan Calculator', ic: 'loanCalc', all: true },
      { path: '/tools/savings-calculator', label: 'Savings Calculator', ic: 'savCalc', all: true }
    ]},
    { group: 'SYSTEM', items: [
      { path: '/system/notifications', label: 'Notifications', ic: 'bell', all: true },
      { path: '/system/profile', label: 'Profile', ic: 'user', all: true },
      { path: '/system/settings', label: 'Settings', ic: 'settings', admin: true },
      { path: '/system/audit-logs', label: 'Audit Logs', ic: 'shield', admin: true }
    ]},
    { group: 'ACCOUNT', items: [
      { path: '__logout', label: 'Logout', ic: 'logout', all: true }
    ]}
  ];

  var db = null, session = null;

  /* Menu khusus anggota (role USER) — hanya bayar & pinjam */
  var NAV_MEMBER = [
    { group: 'ANGGOTA', items: [
      { path: '/member/dashboard', label: 'Beranda', ic: 'dashboard' },
      { path: '/member/loans', label: 'Pinjaman Saya', ic: 'loans' },
      { path: '/member/pay', label: 'Bayar Angsuran', ic: 'payments' },
      { path: '/member/apply', label: 'Ajukan Pinjaman', ic: 'loanCalc' },
      { path: '/member/savings', label: 'Simpanan Saya', ic: 'savings' },
    ]},
    { group: 'ACCOUNT', items: [
      { path: '/system/profile', label: 'Profil', ic: 'user' },
      { path: '__logout', label: 'Logout', ic: 'logout' },
    ]}
  ];

  function getDB() { return db; }
  function getSession() { return session; }
  function currentUser() { return session ? db.users.find(function (u) { return u.id === session.userId; }) : null; }
  function canManage() { return session && ['SUPER_ADMIN', 'ADMIN', 'DAPIN_STAFF'].indexOf(session.role) >= 0; }
  function isAdmin() { return session && (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN'); }
  function isMember() { return session && session.role === 'USER'; }
  function memberDapinId() {
    if (!session) return null;
    var u = db.users.find(function (x) { return x.id === session.userId; });
    return u ? u.dapin_member_id || null : null;
  }
  function mtime(iso) { var d = new Date(iso); return (Date.now() - d.getTime()) / 3600000; }
  function timeAgo(iso) {
    var h = mtime(iso);
    if (h < 1) return 'Baru saja';
    if (h < 24) return Math.floor(h) + ' jam lalu';
    if (h < 720) return Math.floor(h / 24) + ' hari lalu';
    return FMT.date(iso.slice(0, 10));
  }

  /* ---------------- Table helper ---------------- */
  function tbl(cols, rows, opts) {
    opts = opts || {};
    if (!rows || !rows.length) return UIK.emptyState(opts.emptyIcon || 'reports', opts.emptyTitle || 'Tidak Ada Data', opts.emptyDesc || 'Belum ada data untuk ditampilkan.');
    var th = cols.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('');
    var tr = rows.map(function (r) {
      return '<tr>' + cols.map(function (c) {
        var v = c.fn ? c.fn(r) : r[c.k];
        if (v === undefined || v === null || v === '') v = '—';
        return '<td data-label="' + esc(c.label) + '">' + v + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="table-wrap"><table><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
  }
  function pageHead(title, sub, actions) {
    return '<div class="page-head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p class="muted">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }
  function searchBox(ph) { return '<div class="toolbar"><div class="search-inline">' + icon('search') + '<input id="tbSearch" placeholder="' + esc(ph || 'Cari…') + '"></div></div>'; }

  /* ---------------- Boot ---------------- */
  function boot() {
    db = SEED.seed();
    session = AUTH.session();
    window.addEventListener('hashchange', route);
    if (!session) { renderAuth(); return; }
    renderShell();
    route();
  }

  /* ---------------- Auth screens ---------------- */
  function renderAuth() {
    var el = document.getElementById('app');
    el.innerHTML = '<div class="auth-wrap">' +
      '<div class="auth-brand"><span class="brand-badge">' + icon('dapin') + '</span><div><h1>FINORA <em>×</em> DAPIN</h1><p>Modern Financial Management &amp; Digital Lending Platform</p></div></div>' +
      '<div class="auth-card card">' +
        '<div class="auth-tabs"><button id="tabLogin" class="active">Masuk</button><button id="tabReg">Daftar</button></div>' +
        '<form id="authForm" autocomplete="off">' +
          '<div id="regField" class="field hidden"><label>Nama Lengkap</label><input name="name" placeholder="Nama Anda"></div>' +
          '<div class="field"><label>Email</label><input type="email" name="email" placeholder="nama@email.com"></div>' +
          '<div class="field"><label>Password</label><input type="password" name="password" placeholder="••••••••"></div>' +
          '<button type="submit" class="btn btn-primary btn-block" id="authBtn">Masuk</button>' +
        '</form>' +
        '<div class="auth-demo"><p>Akun demo:</p><ul>' +
          '<li><b>admin@finora.app</b> / admin123 — SUPER ADMIN</li>' +
          '<li><b>staff@finora.app</b> / staff123 — DAPIN STAFF</li>' +
          '<li><b>budi@finora.app</b> / budi123 — ANGGOTA (Budi)</li>' +
          '<li><b>siti@finora.app</b> / siti123 — ANGGOTA (Siti)</li>' +
          '<li><b>dewi@finora.app</b> / dewi123 — ANGGOTA (Dewi)</li>' +
        '</ul><button class="btn btn-ghost btn-sm" id="resetDemo">↺ Reset Data Demo</button></div>' +
      '</div>' +
      '<p class="auth-foot">FINORA × DAPIN — Satu ekosistem keuangan &amp; simpan-pinjam.</p>' +
    '</div>';
    var mode = 'login';
    function setMode(m) {
      mode = m;
      document.getElementById('tabLogin').classList.toggle('active', m === 'login');
      document.getElementById('tabReg').classList.toggle('active', m === 'register');
      document.getElementById('regField').classList.toggle('hidden', m !== 'register');
      document.getElementById('authBtn').textContent = m === 'login' ? 'Masuk' : 'Buat Akun';
    }
    document.getElementById('tabLogin').onclick = function () { setMode('login'); };
    document.getElementById('tabReg').onclick = function () { setMode('register'); };
    document.getElementById('resetDemo').onclick = function () { SEED.resetDemo(); location.hash = ''; renderAuth(); UIK.toast('Data demo direset.', 'success'); };
    document.getElementById('authForm').onsubmit = function (e) {
      e.preventDefault();
      var f = UIK.formdata(e.target);
      var res = mode === 'login' ? AUTH.login(f.email, f.password) : AUTH.register(f.name, f.email, f.password);
      if (!res.ok) { UIK.toast(res.error, 'error'); return; }
      session = res.session; db = DB.load();
      UIK.toast('Selamat datang, ' + res.session.name + '!', 'success');
      if (session.role === 'USER') location.hash = '#/member/dashboard';
      renderShell(); route();
    };
  }

  /* ---------------- Shell ---------------- */
  function renderShell() {
    var u = currentUser();
    var unread = db.notifications.filter(function (n) { return !n.read; }).length;
    var el = document.getElementById('app');
    el.innerHTML =
      '<div class="shell">' +
        '<aside class="sidebar" id="sidebar"><div class="sb-head">' +
          '<div class="sb-brand"><span class="brand-badge">' + icon('dapin') + '</span><div class="sb-brand-txt"><b>FINORA <em>×</em> DAPIN</b><small>One Fintech Ecosystem</small></div></div>' +
          '<button class="sb-close" id="sbClose">' + icon('x') + '</button></div>' +
          '<nav class="sb-nav" id="sbNav"></nav>' +
          '<div class="sb-foot"><div class="sb-user">' + UIK.avatar(u.name, 34) + '<div><b>' + esc(u.name) + '</b><small>' + esc(u.role) + '</small></div></div></div>' +
        '</aside>' +
        '<div class="sb-overlay" id="sbOverlay"></div>' +
        '<div class="main">' +
          '<header class="topbar">' +
            '<button class="icon-btn" id="menuBtn" title="Menu">' + icon('menu') + '</button>' +
            '<div class="tb-title" id="tbTitle">Dashboard</div>' +
            '<div class="tb-right">' +
              '<button class="icon-btn tb-search" id="searchBtn" title="Cari global">' + icon('search') + '</button>' +
              '<button class="icon-btn tb-bell" id="bellBtn" title="Notifikasi">' + icon('bell') + (unread ? '<span class="bell-dot">' + unread + '</span>' : '') + '</button>' +
              '<div class="tb-user" id="tbUser">' + UIK.avatar(u.name, 32) + '</div>' +
            '</div>' +
            '<div class="bell-panel hidden" id="bellPanel"></div>' +
            '<div class="user-panel hidden" id="userPanel">' +
              '<a href="#/system/profile">' + icon('user') + ' Profil Saya</a>' +
              '<a href="#/system/settings">' + icon('settings') + ' Pengaturan</a>' +
              '<button id="doLogout">' + icon('logout') + ' Keluar</button>' +
            '</div>' +
          '</header>' +
          '<main class="view" id="view"></main>' +
        '</div>' +
      '</div>' +
      '<div class="search-modal hidden" id="searchModal"><div class="search-panel"><div class="search-input">' + icon('search') + '<input id="gSearch" placeholder="Cari anggota, pinjaman, pembayaran, transaksi…"><button class="icon-btn" id="gClose">' + icon('x') + '</button></div><div class="search-results" id="gResults"></div></div></div>';
    buildSidebar();
    bindShell();
  }
  function buildSidebar() {
    var navData = isMember() ? NAV_MEMBER : NAV;
    var nav = document.getElementById('sbNav');
    nav.innerHTML = navData.map(function (g) {
      var items = g.items.filter(function (it) { return !it.admin || isAdmin(); }).map(function (it) {
        if (it.path === '__logout') return '<button class="sb-item sb-logout" data-path="__logout">' + icon(it.ic) + '<span>' + esc(it.label) + '</span></button>';
        return '<a class="sb-item" href="#' + it.path + '" data-path="' + it.path + '">' + icon(it.ic) + '<span>' + esc(it.label) + '</span></a>';
      }).join('');
      return '<div class="sb-group"><div class="sb-group-t">' + esc(g.group) + '</div>' + items + '</div>';
    }).join('');
  }
  function setActive(path) {
    document.querySelectorAll('.sb-item').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-path') === path);
    });
  }
  function bindShell() {
    function closeDrawer() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sbOverlay').classList.remove('show'); }
    document.getElementById('menuBtn').onclick = function () { document.getElementById('sidebar').classList.add('open'); document.getElementById('sbOverlay').classList.add('show'); };
    document.getElementById('sbClose').onclick = closeDrawer;
    document.getElementById('sbOverlay').onclick = closeDrawer;
    document.querySelectorAll('[data-path="__logout"]').forEach(function (b) { b.onclick = function () { AUTH.logout(); location.hash = ''; location.reload(); }; });
    var bellP = document.getElementById('bellPanel'), userP = document.getElementById('userPanel');
    document.getElementById('bellBtn').onclick = function (e) { e.stopPropagation(); userP.classList.add('hidden'); bellP.classList.toggle('hidden'); renderBell(); };
    document.getElementById('tbUser').onclick = function (e) { e.stopPropagation(); bellP.classList.add('hidden'); userP.classList.toggle('hidden'); };
    document.addEventListener('click', function () { bellP.classList.add('hidden'); userP.classList.add('hidden'); });
    document.getElementById('doLogout').onclick = function () { AUTH.logout(); location.reload(); };
    /* search */
    var sm = document.getElementById('searchModal');
    document.getElementById('searchBtn').onclick = function () { sm.classList.remove('hidden'); document.getElementById('gSearch').value = ''; renderSearch(''); setTimeout(function () { document.getElementById('gSearch').focus(); }, 40); };
    document.getElementById('gClose').onclick = function () { sm.classList.add('hidden'); };
    sm.addEventListener('click', function (e) { if (e.target === sm) sm.classList.add('hidden'); });
    var gs = document.getElementById('gSearch');
    gs.addEventListener('input', function () { renderSearch(gs.value); });
    gs.addEventListener('keydown', function (e) { if (e.key === 'Escape') sm.classList.add('hidden'); });
    document.addEventListener('keydown', function (e) { if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); document.getElementById('searchBtn').click(); } });
  }
  function renderBell() {
    var p = document.getElementById('bellPanel');
    var items = db.notifications.slice(0, 8);
    p.innerHTML = '<div class="bell-head"><b>Notifikasi</b><button class="link" id="markAll">Tandai semua dibaca</button></div>' +
      (items.length ? items.map(function (n) {
        return '<a class="bell-item ' + (n.read ? 'read' : '') + '" href="' + (n.link || '#/system/notifications') + '"><span class="ntf-ic ntf-' + (n.type || 'info') + '">' + icon(n.type === 'success' ? 'check' : n.type === 'warn' ? 'alert' : 'bell') + '</span><div><p>' + esc(n.message) + '</p><small>' + timeAgo(n.created_at) + '</small></div></a>';
      }).join('') : UIK.emptyState('bell', 'Tidak ada notifikasi')) +
      '<div class="bell-foot"><a class="link" href="#/system/notifications">Lihat semua</a></div>';
    var ma = document.getElementById('markAll');
    if (ma) ma.onclick = function () { db.notifications.forEach(function (n) { n.read = true; }); DB.save(db); renderBell(); APP.refreshBadge(); };
  }
  function refreshBadge() {
    var unread = db.notifications.filter(function (n) { return !n.read; }).length;
    var dot = document.querySelector('.tb-bell .bell-dot');
    if (unread) { if (dot) dot.textContent = unread; else document.querySelector('.tb-bell').insertAdjacentHTML('beforeend', '<span class="bell-dot">' + unread + '</span>'); }
    else if (dot) dot.remove();
  }

  /* ---------------- Global search ---------------- */
  function renderSearch(q) {
    q = String(q || '').toLowerCase().trim();
    var box = document.getElementById('gResults');
    if (!q) { box.innerHTML = '<div class="g-hint">Ketik untuk mencari — misalnya nama anggota, nomor pinjaman, atau pembayaran. (Tekan <b>Esc</b> untuk tutup)</div>'; return; }
    var groups = [];
    db.dapin_members.filter(function (m) { return (m.name + ' ' + m.member_id + ' ' + m.phone + ' ' + m.email).toLowerCase().indexOf(q) >= 0; })
      .slice(0, 5).forEach(function (m) {
        groups.push('<a class="g-item" href="#/dapin/members/' + m.id + '">' + UIK.avatar(m.name, 28) + '<div><b>' + esc(m.name) + '</b><small>Anggota · ' + esc(m.member_id) + '</small></div>' + badge(m.status) + '</a>');
      });
    db.dapin_loans.filter(function (l) { return (l.loan_id + ' ' + l.member_name).toLowerCase().indexOf(q) >= 0; })
      .slice(0, 5).forEach(function (l) {
        groups.push('<a class="g-item" href="#/dapin/loans" data-go-loan="' + l.id + '">' + icon('loans') + '<div><b>' + esc(l.loan_id) + '</b><small>Pinjaman · ' + esc(l.member_name) + '</small></div>' + badge(l.status) + '</a>');
      });
    db.dapin_payments.filter(function (p) { return (p.id + ' ' + p.member_name + ' ' + p.loan_ref).toLowerCase().indexOf(q) >= 0; })
      .slice(0, 5).forEach(function (p) { groups.push('<a class="g-item" href="#/dapin/payments">' + icon('payments') + '<div><b>' + esc(p.id) + '</b><small>Pembayaran · ' + esc(p.member_name) + '</small></div><small>' + esc(FMT.date(p.date)) + '</small></a>'); });
    db.transactions.filter(function (t) { return (t.notes + ' ' + t.category + ' ' + (t.reference || '')).toLowerCase().indexOf(q) >= 0; })
      .slice(0, 5).forEach(function (t) { groups.push('<a class="g-item" href="#/finance/transactions">' + icon('tx') + '<div><b>' + esc(t.notes) + '</b><small>Transaksi · ' + esc(t.category) + '</small></div><small>' + FMT.money(t.amount) + '</small></a>'); });
    box.innerHTML = groups.length ? groups.join('') : '<div class="g-hint">Tidak ditemukan hasil untuk “' + esc(q) + '”.</div>';
    box.querySelectorAll('[data-go-loan]').forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); UIK.openModal(loanDetailHTML(a.getAttribute('data-go-loan'))); };
    });
  }

  /* ---------------- Router ---------------- */
  var ROUTES = [
    { re: /^dashboard$/, key: 'dashboard', title: 'Dashboard' },
    { re: /^finance\/transactions$/, key: 'transactions', title: 'Transactions' },
    { re: /^finance\/wallet$/, key: 'wallet', title: 'Wallet' },
    { re: /^finance\/budget$/, key: 'budget', title: 'Budget' },
    { re: /^finance\/analytics$/, key: 'analytics', title: 'Analytics' },
    { re: /^finance\/reports$/, key: 'financeReports', title: 'Reports — FINORA' },
    { re: /^dapin$/, key: 'dapin', title: 'DAPIN Overview' },
    { re: /^dapin\/members$/, key: 'members', title: 'Members' },
    { re: /^dapin\/members\/(.+)$/, key: 'member', title: 'Member Profile' },
    { re: /^dapin\/savings$/, key: 'savings', title: 'Savings' },
    { re: /^dapin\/loans$/, key: 'loans', title: 'Loans' },
    { re: /^dapin\/installments$/, key: 'installments', title: 'Installments' },
    { re: /^dapin\/payments$/, key: 'payments', title: 'Payments' },
    { re: /^dapin\/due-dates$/, key: 'dueDates', title: 'Due Dates' },
    { re: /^dapin\/ledger$/, key: 'ledger', title: 'DAPIN Ledger' },
    { re: /^dapin\/reports$/, key: 'dapinReports', title: 'Reports — DAPIN' },
    { re: /^tools\/financial-calculator$/, key: 'finCalc', title: 'Financial Calculator' },
    { re: /^tools\/loan-calculator$/, key: 'loanCalc', title: 'Loan Calculator' },
    { re: /^tools\/savings-calculator$/, key: 'savCalc', title: 'Savings Calculator' },
    { re: /^system\/notifications$/, key: 'notifications', title: 'Notifications' },
    { re: /^system\/profile$/, key: 'profile', title: 'Profile' },
    { re: /^system\/settings$/, key: 'settings', title: 'Settings' },
    { re: /^system\/audit-logs$/, key: 'audit', title: 'Audit Logs' },
    /* === Anggota (USER) routes === */
    { re: /^member\/dashboard$/, key: 'memberDashboard', title: 'Beranda' },
    { re: /^member\/loans$/, key: 'memberLoans', title: 'Pinjaman Saya' },
    { re: /^member\/pay$/, key: 'memberPay', title: 'Bayar Angsuran' },
    { re: /^member\/apply$/, key: 'memberApply', title: 'Ajukan Pinjaman' },
    { re: /^member\/savings$/, key: 'memberSavings', title: 'Simpanan Saya' }
  ];
  function route() {
    if (!session) return; /* layar auth: jangan render shell */
    var h = (location.hash || (isMember() ? '#/member/dashboard' : '#/dashboard')).replace(/^#\/?/, '');
    /* Anggota (USER) tidak bokses rute admin — redirect ke beranda anggota */
    if (isMember() && h.indexOf('member/') !== 0 && h !== 'system/profile' && h !== '__logout') {
      location.hash = '#/member/dashboard'; return;
    }
    var found = null, param = null;
    for (var i = 0; i < ROUTES.length; i++) {
      var m = h.match(ROUTES[i].re);
      if (m) { found = ROUTES[i]; param = m[1]; break; }
    }
    if (!found) { location.hash = isMember() ? '#/member/dashboard' : '#/dashboard'; return; }
    if (found.admin && !isAdmin()) { renderDenied(found.title); setActive(null); return; }
    var title = document.getElementById('tbTitle');
    if (title) title.textContent = found.title;
    setActive('/' + (h === 'dashboard' ? 'dashboard' : h));
    var view = document.getElementById('view');
    var fn = Pages[found.key];
    if (!fn) { view.innerHTML = UIK.emptyState('alert', 'Halaman tidak ditemukan'); return; }
    view.innerHTML = UIK.loading();
    try {
      var html = fn(param);
      view.innerHTML = html;
      window.scrollTo(0, 0);
      if (typeof bindPage === 'function') bindPage(found.key, param);
    } catch (err) {
      console.error(err);
      view.innerHTML = '<div class="state error-state"><div class="state-ic">' + icon('alert') + '</div><h4>Gagal memuat halaman</h4><p class="muted">' + esc(err.message || 'Terjadi kesalahan.') + '</p><button class="btn btn-ghost" onclick="location.reload()">Muat Ulang</button></div>';
    }
    var drawer = document.getElementById('sidebar');
    if (drawer) drawer.classList.remove('open');
    var ov = document.getElementById('sbOverlay');
    if (ov) ov.classList.remove('show');
  }
  function renderDenied(title) {
    document.getElementById('tbTitle').textContent = 'Akses Ditolak';
    document.getElementById('view').innerHTML = '<div class="state"><div class="state-ic">' + icon('shield') + '</div><h4>Anda tidak memiliki akses</h4><p class="muted">Halaman <b>' + esc(title) + '</b> hanya untuk Administrator.</p><a class="btn btn-primary" href="#/dashboard">Kembali ke Dashboard</a></div>';
  }

  /* shared helpers used by views */
  function money(n) { return FMT.money(n); }
  function saveDB() { DB.save(db); }
  function afterMutate() { DB.save(db); refreshBadge(); }
  function openLoanDetail(loanId) { UIK.openModal(loanDetailHTML(loanId), true); }
  function loanDetailHTML(loanId) {
    var l = db.dapin_loans.find(function (x) { return x.id === loanId; });
    if (!l) return '<p>Pinjaman tidak ditemukan.</p>';
    var rows = l.schedule.map(function (r) {
      return '<tr><td>#' + r.n + '</td><td>' + esc(FMT.date(r.dueDate)) + '</td><td>' + money(r.principal) + '</td><td>' + money(r.interest) + '</td><td>' + money(r.total) + '</td><td>' + money(r.paid) + '</td><td>' + money(Math.max(0, r.total - r.paid)) + '</td><td>' + badge(r.status) + '</td></tr>';
    }).join('');
    return '<h3>Jadwal Angsuran — ' + esc(l.loan_id) + '</h3>' +
      '<div class="modal-meta">' + esc(l.member_name) + ' · ' + (l.method === 'annuity' ? 'Anuitas' : 'Flat') + ' · Bunga ' + l.rate + (l.method === 'annuity' ? '%/thn' : '%/bln') + ' · Tenor ' + l.tenor + ' bln · Sisa <b>' + money(l.remaining_balance) + '</b> (' + badge(l.status) + ')</div>' +
      '<div class="table-wrap"><table><thead><tr><th>#</th><th>Jatuh Tempo</th><th>Pokok</th><th>Bunga</th><th>Total</th><th>Dibayar</th><th>Sisa</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  var Pages = root.Pages = root.Pages || {};
  root.APP = {
    boot: boot, getDB: function () { return db; }, getSession: function () { return session; }, currentUser: currentUser,
    canManage: canManage, isAdmin: isAdmin, isMember: isMember, memberDapinId: memberDapinId, nav: function (p) { location.hash = '#' + p; },
    saveDB: saveDB, afterMutate: afterMutate, refreshBadge: refreshBadge, timeAgo: timeAgo,
    tbl: tbl, pageHead: pageHead, searchBox: searchBox, money: money, esc: esc, icon: icon, badge: badge,
    openLoanDetail: openLoanDetail, loanDetailHTML: loanDetailHTML, toast: UIK.toast, fmt: FMT, avatar: UIK.avatar
  };
  return root.APP;
})(typeof window !== 'undefined' ? window : globalThis);
