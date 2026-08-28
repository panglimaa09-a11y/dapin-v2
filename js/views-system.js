/* FINORA x DAPIN — Views: System (Notifications, Profile, Settings, Audit Logs) */
(function (root) {
  var UIK = root.UIK, LG = root.LG;
  var esc = UIK.esc, icon = UIK.icon, badge = UIK.badge, money = root.APP.money, fmt = UIK.fmt;
  var Pages = root.Pages;

  Pages.notifications = function () {
    var db = root.APP.getDB();
    var items = db.notifications;
    var unread = items.filter(function (n) { return !n.read; }).length;
    return root.APP.pageHead('Notifications', 'Pusat notifikasi sistem', '<button class="btn btn-ghost" id="btnMarkAll">Tandai semua dibaca</button>') +
      '<div class="kpis mini">' + '<div class="kpi card k-primary"><div class="kpi-ic">' + icon('bell') + '</div><div><div class="kpi-label">Belum Dibaca</div><div class="kpi-value">' + unread + '</div></div></div></div>' +
      '<div class="card">' + (items.length ? items.map(function (n) {
        var ic = n.type === 'success' ? 'check' : n.type === 'warn' ? 'alert' : 'bell';
        var tone = n.type === 'success' ? 't-green' : n.type === 'warn' ? 't-orange' : 't-blue';
        return '<div class="ntf-row ' + (n.read ? 'read' : '') + '"><span class="ntf-ic ntf-' + (n.type || 'info') + '">' + icon(ic) + '</span><div class="ntf-body"><p>' + esc(n.message) + '</p><small>' + root.APP.timeAgo(n.created_at) + (n.link ? ' · <a href="' + esc(n.link) + '">Buka</a>' : '') + '</small></div>' + (n.read ? '' : '<span class="badge ' + tone + '">Baru</span>') + '</div>';
      }).join('') : UIK.emptyState('bell', 'Tidak ada notifikasi')) + '</div>';
  };
  Pages._bind_notifications = function () {
    document.getElementById('btnMarkAll').onclick = function () {
      root.APP.getDB().notifications.forEach(function (n) { n.read = true; });
      root.APP.afterMutate(); UIK.toast('Semua notifikasi ditandai dibaca.', 'success'); location.reload();
    };
  };

  Pages.profile = function () {
    var db = root.APP.getDB();
    var u = root.APP.currentUser();
    var p = db.profiles.find(function (x) { return x.user_id === u.id; });
    var f = LG.financeTotals(db);
    return root.APP.pageHead('Profile', 'Informasi akun Anda') +
      '<div class="profile-hero card"><div>' + root.APP.avatar(u.name, 64) + '</div><div class="profile-id"><h3>' + esc(u.name) + '</h3><p class="muted">' + esc(u.email) + ' · Role: ' + badge(u.role) + '</p></div></div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-t"><h3>Data Diri</h3></div><form id="profForm">' +
          UIK.field('Nama Lengkap', UIK.input('full_name', p ? p.full_name : u.name)) +
          UIK.field('Telepon', UIK.input('phone', p ? p.phone : '', '08xx-xxxx-xxxx')) +
          UIK.field('Perusahaan / Organisasi', UIK.input('company', p ? p.company : '')) +
          '<div class="modal-actions"><button class="btn btn-primary">Simpan Profil</button></div></form></div>' +
        '<div class="card"><div class="card-t"><h3>Ringkasan Keuangan Saya</h3><span class="chip">FINORA</span></div>' +
          CH.hbars([
            { label: 'Total Balance', value: f.balance, right: money(f.balance), pct: f.income ? f.balance / f.income * 100 : 0, tone: 'fill-green' },
            { label: 'Income', value: f.income, right: money(f.income), pct: 100, tone: 'fill-green' },
            { label: 'Expense', value: f.expense, right: money(f.expense), pct: f.income ? f.expense / f.income * 100 : 0, tone: 'fill-orange' },
            { label: 'Savings (DAPIN)', value: f.savings, right: money(f.savings), pct: f.income ? f.savings / f.income * 100 : 0, tone: 'fill-violet' }
          ]) + '</div>' +
      '</div>';
  };
  Pages._bind_profile = function () {
    document.getElementById('profForm').onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(e.target);
      var db = root.APP.getDB();
      var u = root.APP.currentUser();
      var p = db.profiles.find(function (x) { return x.user_id === u.id; });
      if (p) { p.full_name = d.full_name; p.phone = d.phone; p.company = d.company; }
      u.name = d.full_name;
      var s = root.APP.getSession(); s.name = d.full_name;
      root.APP.afterMutate(); UIK.toast('Profil disimpan.', 'success'); location.reload();
    };
  };

  Pages.settings = function () {
    var db = root.APP.getDB();
    if (!root.APP.isAdmin()) return '<div class="state"><div class="state-ic">' + icon('shield') + '</div><h4>Akses dibatasi</h4><p class="muted">Halaman ini khusus Administrator.</p></div>';
    var s = db.settings;
    return root.APP.pageHead('Settings', 'Konfigurasi sistem FINORA × DAPIN') +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-t"><h3>Organisasi</h3></div><form id="stForm">' +
          UIK.field('Nama Organisasi / Koperasi', UIK.input('org_name', s.org_name)) +
          UIK.field('Mata Uang', UIK.select('currency', ['IDR', 'USD', 'MYR'], s.currency)) +
          UIK.field('Jangka Waktu Notifikasi Jatuh Tempo (hari)', UIK.input('notif_due_days', s.notif_due_days, '7', 'number')) +
          '<div class="modal-actions"><button class="btn btn-primary">Simpan Pengaturan</button></div></form></div>' +
        '<div class="card"><div class="card-t"><h3>Jenis Simpanan DAPIN</h3><span class="chip dapin">DAPIN</span></div>' +
          '<p class="muted">Daftar jenis simpanan (pisahkan dengan koma).</p>' +
          '<form id="stTypes"><div class="field"><label>Jenis Simpanan</label><input name="types" value="' + esc(s.dapin_savings_types.join(', ')) + '"></div>' +
          '<div class="modal-actions"><button class="btn btn-primary">Simpan Jenis</button></div></form>' +
          '<div class="card-t" style="margin-top:18px"><h3>Zona Bahaya</h3></div>' +
          '<button class="btn btn-danger-ghost" id="btnResetAll">↺ Reset Seluruh Data Demo</button>' +
          '<p class="muted" style="margin-top:8px">Menghapus seluruh data lokal dan membuat ulang seed demo. Akun demo tetap: admin@finora.app / admin123.</p></div>' +
      '</div>';
  };
  Pages._bind_settings = function () {
    if (!root.APP.isAdmin()) return;
    var db = root.APP.getDB();
    document.getElementById('stForm').onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(e.target);
      db.settings.org_name = d.org_name || db.settings.org_name;
      db.settings.currency = d.currency;
      db.settings.notif_due_days = Number(d.notif_due_days) || 7;
      root.APP.afterMutate(); UIK.toast('Pengaturan disimpan.', 'success');
    };
    document.getElementById('stTypes').onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(e.target);
      db.settings.dapin_savings_types = String(d.types).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      root.APP.afterMutate(); UIK.toast('Jenis simpanan diperbarui.', 'success');
    };
    document.getElementById('btnResetAll').onclick = function () {
      UIK.confirmModal('Reset Data Demo', 'Seluruh data akan dikembalikan ke kondisi awal demo. Lanjutkan?', 'Reset', function () {
        SEED.resetDemo(); AUTH.logout(); location.hash = ''; location.reload();
      });
    };
  };

  Pages.audit = function () {
    var db = root.APP.getDB();
    if (!root.APP.isAdmin()) return '<div class="state"><div class="state-ic">' + icon('shield') + '</div><h4>Akses dibatasi</h4><p class="muted">Halaman ini khusus Administrator.</p></div>';
    return root.APP.pageHead('Audit Logs', 'Jejak tindakan penting sistem — tidak dihapus dalam operasi normal') +
      '<div class="card">' + root.APP.tbl(
        [{ label: 'Waktu', fn: function (x) { return fmt.datetime(x.created_at); } }, { label: 'User', fn: function (x) { var u = db.users.find(function (y) { return y.id === x.user; }); return esc(u ? u.name : x.user); } }, { label: 'Aksi', fn: function (x) { return badge(x.action); } }, { label: 'Target', fn: function (x) { return esc(x.target) + ' <small class="sub">' + esc(x.target_id) + '</small>'; } }, { label: 'Detail', fn: function (x) { try { return '<small>' + esc(JSON.stringify(x.metadata || {})) + '</small>'; } catch (e) { return '—'; } } }],
        db.dapin_audit_logs, { emptyTitle: 'Belum ada audit log', emptyIcon: 'shield' }
      ) + '</div>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
