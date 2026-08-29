/* FINORA x DAPIN — Views: DAPIN (overview, members, profile, savings, loans, installments, payments, due dates, ledger, reports) */
(function (root) {
  var UIK = root.UIK, LG = root.LG, CH = root.CH;
  var esc = UIK.esc, icon = UIK.icon, badge = UIK.badge, money = root.APP.money, fmt = UIK.fmt;
  var Pages = root.Pages;

  function stat(ic, label, value, sub, cls) {
    return '<div class="kpi card ' + cls + '"><div class="kpi-ic">' + icon(ic) + '</div><div><div class="kpi-label">' + esc(label) + '</div><div class="kpi-value">' + value + '</div><div class="kpi-sub">' + esc(sub) + '</div></div></div>';
  }
  function memberOptions(selected) {
    var db = root.APP.getDB();
    return db.dapin_members.map(function (m) { return { v: m.id, l: m.name + ' (' + m.member_id + ')' }; });
  }
  function walletOptions(selected) {
    var db = root.APP.getDB();
    return db.wallets.map(function (w) { return { v: w.id, l: w.name }; });
  }
  function activeLoanOptions() {
    var db = root.APP.getDB();
    return db.dapin_loans.filter(function (l) { return l.status === 'Active' || l.status === 'Overdue'; }).map(function (l) {
      var next = l.schedule.find(function (r) { return r.status !== 'Paid'; });
      return { v: l.id, l: l.loan_id + ' — ' + l.member_name + ' (sisa ' + money(l.remaining_balance) + (next ? ', jatuh ' + fmt.dateShort(next.dueDate) : '') + ')' };
    });
  }

  /* ============ DAPIN OVERVIEW ============ */
  Pages.dapin = function () {
    var db = root.APP.getDB();
    var activeMembers = db.dapin_members.filter(function (m) { return m.status === 'Active'; }).length;
    var totalSavings = db.dapin_savings.reduce(function (s, x) { return s + x.amount; }, 0);
    var totalLoans = db.dapin_loans.filter(function (l) { return l.status !== 'Cancelled' && l.status !== 'Draft'; }).reduce(function (s, l) { return s + l.principal; }, 0);
    var active = db.dapin_loans.filter(function (l) { return l.status === 'Active' || l.status === 'Overdue'; });
    var outstanding = active.reduce(function (s, l) { return s + l.remaining_balance; }, 0);
    var paidInst = db.dapin_payments.length;
    var pending = LG.dueItems(db, 999).filter(function (d) { return d.days <= 7 || d.status === 'Overdue'; }).length;
    var due = LG.dueItems(db, 7);
    /* charts */
    var months = lastMonths(6);
    var savRun = 0;
    var savSeries = months.map(function (mo) { savRun += db.dapin_savings.filter(function (s) { return s.date.slice(0, 7) === mo.y + '-' + mo.m; }).reduce(function (a, s) { return a + s.amount; }, 0); return savRun; });
    var paySeries = months.map(function (mo) { return db.dapin_payments.filter(function (p) { return p.date.slice(0, 7) === mo.y + '-' + mo.m; }).reduce(function (a, p) { return a + p.amount; }, 0); });
    var byMember = {};
    active.forEach(function (l) { byMember[l.member_name] = (byMember[l.member_name] || 0) + l.remaining_balance; });
    var donutItems = Object.keys(byMember).map(function (k, i) { var cs = [CH.C.primary, CH.C.violet, CH.C.cyan, CH.C.pink, CH.C.warn, CH.C.dapin]; return { label: k, value: byMember[k], color: cs[i % cs.length] }; });
    return root.APP.pageHead('DAPIN Overview', 'Pusat modul simpan-pinjam — terintegrasi penuh dengan FINORA', root.APP.canManage() ? '<button class="btn btn-primary" id="btnNewMember">' + icon('plus') + ' Anggota</button> <button class="btn btn-primary" id="btnNewLoan">' + icon('plus') + ' Pinjaman</button>' : '') +
      '<div class="kpis">' +
        stat('members', 'Total Members', activeMembers + ' / ' + db.dapin_members.length, 'Anggota aktif', 'k-primary') +
        stat('savings', 'Total Savings', money(totalSavings), 'Seluruh jenis simpanan', 'k-dapin') +
        stat('loans', 'Total Loans', money(totalLoans), 'Pokok pinjaman disalurkan', 'k-violet') +
        stat('loans', 'Outstanding Loans', money(outstanding), 'Sisa pinjaman berjalan', 'k-orange') +
        stat('payments', 'Paid Installments', paidInst, 'Pembayaran tercatat', 'k-green') +
        stat('due', 'Pending Payments', pending, 'Belum dibayar', 'k-red') +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-t"><h3>Pertumbuhan Simpanan</h3><span class="chip dapin">DAPIN</span></div>' + CH.line({ labels: months.map(function (m) { return m.label; }), series: [{ name: 'Simpanan Kumulatif', data: savSeries, color: CH.C.dapin }] }) + '</div>' +
        '<div class="card"><div class="card-t"><h3>Distribusi Outstanding Pinjaman</h3></div>' + (donutItems.length ? CH.donut({ items: donutItems, center: 'Outstanding' }) : UIK.emptyState('loans', 'Tidak ada pinjaman aktif')) + '</div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card-t"><h3>Pembayaran per Bulan</h3></div>' + CH.bar({ labels: months.map(function (m) { return m.label; }), series: [{ name: 'Pembayaran', data: paySeries, color: CH.C.primary }] }) + '</div>' +
        '<div class="card"><div class="card-t"><h3>Saldo Outstanding per Pinjaman</h3></div>' + (active.length ? CH.hbars(active.map(function (l) { var pct = l.total_payment ? l.remaining_balance / l.total_payment * 100 : 0; return { label: l.loan_id + ' · ' + l.member_name, value: l.remaining_balance, right: money(l.remaining_balance), pct: pct, tone: pct > 70 ? 'fill-red' : pct > 40 ? 'fill-orange' : 'fill-green' }; })) : UIK.emptyState('loans', 'Tidak ada pinjaman aktif')) + '</div>' +
      '</div>' +
      '<div class="card"><div class="card-t"><h3>Jatuh Tempo 7 Hari ke Depan</h3><a class="link" href="#/dapin/due-dates">Lihat semua</a></div>' +
        (due.length ? due.map(function (d) {
          var tone = d.status === 'Overdue' ? 't-red' : d.status === 'DueToday' ? 't-orange' : 't-blue';
          return '<div class="due-row"><div>' + root.APP.avatar(d.member, 30) + '<div><b>' + esc(d.member) + '</b><small>' + esc(d.loan) + ' · Angsuran #' + d.installment + ' · ' + fmt.date(d.dueDate) + '</small></div></div><div class="due-right"><b>' + money(d.amount) + '</b><span class="badge ' + tone + '">' + (d.status === 'Overdue' ? 'Terlambat ' + (-d.days) + ' hr' : d.status === 'DueToday' ? 'Hari ini' : 'Dalam ' + d.days + ' hr') + '</span></div></div>';
        }).join('') : UIK.emptyState('due', 'Tidak ada jatuh tempo', 'Semua angsuran aman.')) +
      '</div>';
  };
  Pages._bind_dapin = function () {
    var b1 = document.getElementById('btnNewMember'); if (b1) b1.onclick = function () { openMemberModal(); };
    var b2 = document.getElementById('btnNewLoan'); if (b2) b2.onclick = function () { openLoanModal(); };
  };

  /* ============ MEMBERS ============ */
  Pages.members = function () {
    var db = root.APP.getDB();
    var rows = db.dapin_members.map(function (m) {
      var st = LG.memberStats(db, m.id);
      return { m: m, savings: st.totalSavings, loans: st.totalLoans, outstanding: st.outstanding };
    });
    return root.APP.pageHead('Members', 'Kelola anggota koperasi (simpanan & pinjaman)', root.APP.canManage() ? '<button class="btn btn-primary" id="btnAddMember">' + icon('plus') + ' Anggota Baru</button>' : '') +
      '<div class="toolbar"><div class="search-inline">' + icon('search') + '<input id="memberSearch" placeholder="Cari nama, ID, telepon…"></div>' +
      '<select id="memberFilter"><option value="">Semua Status</option><option>Active</option><option>Inactive</option></select></div>' +
      '<div id="memberBody">' + memberTable(rows) + '</div>';
  };
  function memberTable(rows) {
    var db = root.APP.getDB();
    return root.APP.tbl(
      [{ label: 'Anggota', fn: function (r) { return '<div class="cell-user">' + root.APP.avatar(r.m.name, 34) + '<div><b>' + esc(r.m.name) + '</b><small>' + esc(r.m.member_id) + '</small></div></div>'; } },
      { label: 'Kontak', fn: function (r) { return '<small>' + esc(r.m.phone || '—') + '</small><small class="sub">' + esc(r.m.email || '') + '</small>'; } },
      { label: 'Bergabung', fn: function (r) { return fmt.date(r.m.join_date); } },
      { label: 'Simpanan', fn: function (r) { return money(r.savings); } },
      { label: 'Outstanding', fn: function (r) { return r.outstanding > 0 ? '<span class="neg">' + money(r.outstanding) + '</span>' : '<span class="muted">—</span>'; } },
      { label: 'Status', fn: function (r) { return badge(r.m.status); } },
      { label: 'Aksi', fn: function (r) {
        var btns = '<button class="btn btn-ghost btn-xs" data-view="' + r.m.id + '">Buka</button>';
        if (root.APP.canManage()) btns += '<button class="btn btn-ghost btn-xs" data-edit="' + r.m.id + '">Edit</button><button class="btn btn-ghost btn-xs ' + (r.m.status === 'Active' ? 'btn-danger-ghost' : '') + '" data-toggle="' + r.m.id + '">' + (r.m.status === 'Active' ? 'Nonaktif' : 'Aktifkan') + '</button>';
        return btns; } }],
      rows, { emptyTitle: 'Belum ada anggota', emptyDesc: 'Tambahkan anggota pertama DAPIN.', emptyIcon: 'members' }
    );
  }
  Pages._bind_members = function () {
    var db = root.APP.getDB();
    var s = document.getElementById('memberSearch'), f = document.getElementById('memberFilter');
    function refresh() {
      var q = (s.value || '').toLowerCase();
      var st = f.value;
      var rows = db.dapin_members.filter(function (m) { return (!q || (m.name + m.member_id + m.phone + m.email).toLowerCase().indexOf(q) >= 0) && (!st || m.status === st); })
        .map(function (m) { var ms = LG.memberStats(db, m.id); return { m: m, savings: ms.totalSavings, loans: ms.totalLoans, outstanding: ms.outstanding }; });
      document.getElementById('memberBody').innerHTML = memberTable(rows);
      bindMemberActions();
    }
    s.addEventListener('input', refresh); f.addEventListener('change', refresh);
    bindMemberActions();
    var ab = document.getElementById('btnAddMember'); if (ab) ab.onclick = function () { openMemberModal(); };
  };
  function bindMemberActions() {
    document.querySelectorAll('[data-view]').forEach(function (b) { b.onclick = function () { location.hash = '#/dapin/members/' + b.getAttribute('data-view'); }; });
    document.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { openMemberModal(b.getAttribute('data-edit')); }; });
    document.querySelectorAll('[data-toggle]').forEach(function (b) { b.onclick = function () {
      var id = b.getAttribute('data-toggle');
      var m = root.APP.getDB().dapin_members.find(function (x) { return x.id === id; });
      UIK.confirmModal(m.status === 'Active' ? 'Nonaktifkan Anggota' : 'Aktifkan Anggota', 'Ubah status ' + m.name + ' menjadi ' + (m.status === 'Active' ? 'Inactive' : 'Active') + '?', 'Ya', function () {
        var res = LG.deactivateMember(root.APP.getDB(), id, root.APP.getSession().userId);
        if (!res.ok) { UIK.toast(res.error, 'error'); return; }
        root.APP.afterMutate(); UIK.toast('Status diperbarui.', 'success'); renderAgain('members');
      });
    }; });
  }
  function openMemberModal(id) {
    var db = root.APP.getDB();
    var m = id ? db.dapin_members.find(function (x) { return x.id === id; }) : null;
    UIK.openModal('<h3>' + (m ? 'Edit Anggota' : 'Tambah Anggota') + '</h3><form id="memForm">' +
      UIK.field('Nama Lengkap *', UIK.input('name', m ? m.name : '', 'Nama anggota')) +
      '<div class="frow">' + UIK.field('Telepon', UIK.input('phone', m ? m.phone : '', '08xx-xxxx-xxxx')) + UIK.field('Email', UIK.input('email', m ? m.email : '', 'email@mail.com', 'email')) + '</div>' +
      UIK.field('Alamat', UIK.input('address', m ? m.address : '', 'Alamat')) +
      '<div class="frow">' + UIK.field('Tanggal Bergabung', UIK.input('joinDate', m ? m.join_date : DB.today(), '', 'date')) + UIK.field('Status', UIK.select('status', ['Active', 'Inactive'], m ? m.status : 'Active')) + '</div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div></form>');
    document.getElementById('memForm').onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(e.target);
      var res;
      if (m) res = LG.updateMember(db, m.id, d, root.APP.getSession().userId);
      else res = LG.createMember(db, d, root.APP.getSession().userId);
      if (!res.ok) { UIK.toast(res.error, 'error'); return; }
      root.APP.afterMutate(); UIK.closeModal(); UIK.toast(m ? 'Anggota diperbarui.' : 'Anggota ditambahkan.', 'success'); renderAgain('members');
    };
  }

  /* ============ MEMBER PROFILE ============ */
  Pages.member = function (id) {
    var db = root.APP.getDB();
    var m = db.dapin_members.find(function (x) { return x.id === id; });
    if (!m) return '<div class="state">' + icon('members') + '<h4>Anggota tidak ditemukan</h4><a class="btn btn-primary" href="#/dapin/members">Kembali</a></div>';
    var st = LG.memberStats(db, m.id);
    var txHead = { SAVINGS_DEPOSIT: 'Simpanan', LOAN_DISBURSED: 'Pencairan', INSTALLMENT_PAYMENT: 'Angsuran', INTEREST_PAYMENT: 'Bunga' };
    var hist = st.transactions.map(function (t) {
      return '<tr><td data-label="Tanggal">' + fmt.date(t.date) + '</td><td data-label="Tipe"><span class="badge ' + (t.type === 'SAVINGS_DEPOSIT' ? 't-green' : t.type === 'LOAN_DISBURSED' ? 't-red' : 't-blue') + '">' + (txHead[t.type] || t.type) + '</span></td><td data-label="Keterangan">' + esc(t.label) + (t.notes ? '<small class="sub">' + esc(t.notes) + '</small>' : '') + '</td><td data-label="Referensi">' + esc(t.ref) + '</td><td data-label="Jumlah" class="' + (t.type === 'LOAN_DISBURSED' ? 'neg' : 'pos') + '">' + (t.type === 'LOAN_DISBURSED' ? '−' : '+') + money(t.amount) + '</td></tr>';
    }).join('');
    return root.APP.pageHead('Member Profile', m.member_id, root.APP.canManage() ? '<button class="btn btn-primary" id="btnEditMember">Edit</button>' : '') +
      '<div class="profile-hero card"><div>' + root.APP.avatar(m.name, 64) + '</div><div class="profile-id"><h3>' + esc(m.name) + '</h3><p class="muted">' + esc(m.member_id) + ' · Bergabung ' + fmt.date(m.join_date) + '</p><div class="profile-contact">' + icon('phone') + ' ' + esc(m.phone || '—') + ' &nbsp; ' + icon('mail') + ' ' + esc(m.email || '—') + ' &nbsp; ' + icon('pin') + ' ' + esc(m.address || '—') + '</div></div><div>' + badge(m.status) + '</div></div>' +
      '<div class="kpis">' +
        stat('savings', 'Total Savings', money(st.totalSavings), st.savingsCount + ' setoran', 'k-dapin') +
        stat('loans', 'Total Loans', money(st.totalLoans), 'Pokok pernah dipinjam', 'k-violet') +
        stat('loans', 'Outstanding', money(st.outstanding), st.activeLoans.length + ' pinjaman aktif', 'k-orange') +
        stat('payments', 'Total Dibayar', money(st.totalPaid), 'Angsuran terbayar', 'k-green') +
      '</div>' +
      (st.activeLoans.length ? '<div class="card"><div class="card-t"><h3>Pinjaman Aktif</h3></div>' + root.APP.tbl(
        [{ label: 'Pinjaman', k: 'loan_id' }, { label: 'Pokok', fn: function (l) { return money(l.principal); } }, { label: 'Angsuran', fn: function (l) { return money(l.installment) + ' /bln'; } }, { label: 'Dibayar', fn: function (l) { return money(l.paid_amount); } }, { label: 'Sisa', fn: function (l) { return '<b class="neg">' + money(l.remaining_balance) + '</b>'; } }, { label: 'Status', fn: function (l) { return badge(l.status); } }, { label: '', fn: function (l) { return '<button class="btn btn-ghost btn-xs" data-mloan="' + l.id + '">Detail</button>'; } }], st.activeLoans) + '</div>' : '') +
      '<div class="card"><div class="card-t"><h3>Riwayat Transaksi</h3></div><div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Tipe</th><th>Keterangan</th><th>Referensi</th><th>Jumlah</th></tr></thead><tbody>' + (hist || '<tr><td colspan="5" class="muted center">Belum ada transaksi</td></tr>') + '</tbody></table></div></div>';
  };
  Pages._bind_member = function (id) {
    var b = document.getElementById('btnEditMember');
    if (b) b.onclick = function () { openMemberModal(id); };
    document.querySelectorAll('[data-mloan]').forEach(function (x) { x.onclick = function () { root.APP.openLoanDetail(x.getAttribute('data-mloan')); }; });
  };

  /* ============ SAVINGS ============ */
  Pages.savings = function () {
    var db = root.APP.getDB();
    var types = db.settings.dapin_savings_types;
    var total = db.dapin_savings.reduce(function (s, x) { return s + x.amount; }, 0);
    function body(q, t) {
      var rows = db.dapin_savings.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
      if (q) rows = rows.filter(function (s) { return (s.member_name + s.ref + s.type).toLowerCase().indexOf(q) >= 0; });
      if (t) rows = rows.filter(function (s) { return s.type === t; });
      return root.APP.tbl(
        [{ label: 'Referensi', k: 'ref' }, { label: 'Anggota', fn: function (s) { return '<div class="cell-user">' + root.APP.avatar(s.member_name, 28) + '<b>' + esc(s.member_name) + '</b></div>'; } }, { label: 'Jenis', fn: function (s) { return badge(s.type); } }, { label: 'Tanggal', fn: function (s) { return fmt.date(s.date); } }, { label: 'Jumlah', fn: function (s) { return '<span class="pos">+' + money(s.amount) + '</span>'; } }, { label: 'Wallet', fn: function (s) { var w = db.wallets.find(function (x) { return x.id === s.wallet_id; }); return esc(w ? w.name : '—'); } }, { label: 'Catatan', k: 'notes' }],
        rows, { emptyTitle: 'Belum ada simpanan', emptyIcon: 'savings' }
      );
    }
    return root.APP.pageHead('Savings', 'Simpanan anggota — jenis dapat dikonfigurasi di Pengaturan', root.APP.canManage() ? '<button class="btn btn-primary" id="btnAddSav">' + icon('plus') + ' Setoran</button>' : '') +
      '<div class="kpis mini">' + stat('savings', 'Total Simpanan', money(total), '', 'k-dapin') + '</div>' +
      '<div class="toolbar"><div class="search-inline">' + icon('search') + '<input id="savSearch" placeholder="Cari simpanan…"></div>' +
      '<select id="savFilter"><option value="">Semua Jenis</option>' + types.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></div>' +
      '<div id="savBody">' + body('', '') + '</div>';
  };
  Pages._bind_savings = function () {
    var db = root.APP.getDB();
    var s = document.getElementById('savSearch'), f = document.getElementById('savFilter');
    function refresh() {
      var q = (s.value || '').toLowerCase(), t = f.value;
      var rows = db.dapin_savings.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
      if (q) rows = rows.filter(function (x) { return (x.member_name + x.ref + x.type).toLowerCase().indexOf(q) >= 0; });
      if (t) rows = rows.filter(function (x) { return x.type === t; });
      document.getElementById('savBody').innerHTML = root.APP.tbl([{ label: 'Referensi', k: 'ref' }, { label: 'Anggota', fn: function (x) { return '<div class="cell-user">' + root.APP.avatar(x.member_name, 28) + '<b>' + esc(x.member_name) + '</b></div>'; } }, { label: 'Jenis', fn: function (x) { return badge(x.type); } }, { label: 'Tanggal', fn: function (x) { return fmt.date(x.date); } }, { label: 'Jumlah', fn: function (x) { return '<span class="pos">+' + money(x.amount) + '</span>'; } }, { label: 'Wallet', fn: function (x) { var w = db.wallets.find(function (y) { return y.id === x.wallet_id; }); return esc(w ? w.name : '—'); } }, { label: 'Catatan', k: 'notes' }], rows);
    }
    s.addEventListener('input', refresh); f.addEventListener('change', refresh);
    var b = document.getElementById('btnAddSav'); if (b) b.onclick = function () { openSavingsModal(); };
  };
  function openSavingsModal() {
    var db = root.APP.getDB();
    var types = db.settings.dapin_savings_types;
    UIK.openModal('<h3>Catat Setoran Simpanan</h3><form id="savForm">' +
      UIK.field('Anggota *', UIK.select('member_id', memberOptions(), db.dapin_members[0] && db.dapin_members[0].id)) +
      '<div class="frow">' + UIK.field('Jenis Simpanan', UIK.select('type', types, types[0])) + UIK.field('Jumlah (Rp) *', UIK.input('amount', '', '0', 'number')) + '</div>' +
      '<div class="frow">' + UIK.field('Tanggal', UIK.input('date', DB.today(), '', 'date')) + UIK.field('Sumber Dana (Wallet)', UIK.select('wallet_id', walletOptions(), db.wallets[0] && db.wallets[0].id)) + '</div>' +
      UIK.field('Referensi', UIK.input('reference', '', 'opsional')) +
      UIK.field('Catatan', UIK.input('notes', '', 'opsional')) +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div></form>');
    document.getElementById('savForm').onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(e.target);
      var res = LG.recordSavings(db, d, root.APP.getSession().userId);
      if (!res.ok) { UIK.toast(res.error, 'error'); return; }
      root.APP.afterMutate(); UIK.closeModal(); UIK.toast('Setoran tersimpan.', 'success'); renderAgain('savings');
    };
  }

  /* ============ LOANS ============ */
  Pages.loans = function () {
    var db = root.APP.getDB();
    var totalDisbursed = db.dapin_loans.filter(function (l) { return l.status !== 'Draft' && l.status !== 'Cancelled'; }).reduce(function (s, l) { return s + l.principal; }, 0);
    var active = db.dapin_loans.filter(function (l) { return l.status === 'Active' || l.status === 'Overdue'; });
    var outstanding = active.reduce(function (s, l) { return s + l.remaining_balance; }, 0);
    var interestEarned = db.dapin_loans.reduce(function (s, l) { return s + l.paid_amount; }, 0) - db.dapin_loans.filter(function (l) { return l.status !== 'Cancelled'; }).reduce(function (s, l) { return s + l.principalPaidTotal || 0; }, 0);
    return root.APP.pageHead('Loans', 'Manajemen pinjaman — kalkulasi otomatis & transparan', root.APP.canManage() ? '<button class="btn btn-primary" id="btnCreateLoan">' + icon('plus') + ' Pinjaman Baru</button>' : '') +
      '<div class="kpis mini">' + stat('loans', 'Disalurkan', money(totalDisbursed), '', 'k-violet') + stat('loans', 'Outstanding', money(outstanding), active.length + ' pinjaman', 'k-orange') + stat('payments', 'Dibayar', money(db.dapin_loans.reduce(function (s, l) { return s + l.paid_amount; }, 0)), '', 'k-green') + '</div>' +
      '<div class="card">' + root.APP.tbl(
        [{ label: 'Pinjaman', k: 'loan_id' }, { label: 'Anggota', fn: function (l) { return '<div class="cell-user">' + root.APP.avatar(l.member_name, 28) + '<b>' + esc(l.member_name) + '</b></div>'; } },
        { label: 'Pokok', fn: function (l) { return money(l.principal); } }, { label: 'Bunga', fn: function (l) { return l.rate + (l.method === 'annuity' ? '%/thn' : '%/bln'); } },
        { label: 'Tenor', fn: function (l) { return l.tenor + ' bln'; } }, { label: 'Angsuran', fn: function (l) { return money(l.installment) + '/bln'; } },
        { label: 'Dibayar', fn: function (l) { return money(l.paid_amount); } }, { label: 'Sisa', fn: function (l) { return '<b class="' + (l.remaining_balance > 0 ? 'neg' : 'pos') + '">' + money(l.remaining_balance) + '</b>'; } },
        { label: 'Status', fn: function (l) { return badge(l.status); } },
        { label: 'Aksi', fn: function (l) {
          var b = '<button class="btn btn-ghost btn-xs" data-loan="' + l.id + '">Jadwal</button>';
          if (root.APP.canManage() && (l.status === 'Active' || l.status === 'Overdue')) b += '<button class="btn btn-primary btn-xs" data-pay="' + l.id + '">Bayar</button>';
          if (root.APP.canManage() && l.status === 'Draft') b += '<button class="btn btn-danger-ghost btn-xs" data-cancel="' + l.id + '">Batal</button>';
          if (root.APP.canManage() && l.status === 'Pending') b += '<button class="btn btn-success btn-xs" data-approve="' + l.id + '">Approve</button><button class="btn btn-danger-ghost btn-xs" data-reject="' + l.id + '">Tolak</button>';
          if (l.status === 'Pending' && l.photo) b += '<button class="btn btn-ghost btn-xs" data-view-photo="' + l.id + '">Foto</button>';
          if (l.status === 'Pending' && l.documents && l.documents.length) b += '<button class="btn btn-ghost btn-xs" data-view-docs="' + l.id + '">Dok (' + l.documents.length + ')</button>';
          return b; } }],
        db.dapin_loans.slice().sort(function (a, b) { return b.created_at.localeCompare(a.created_at); }), { emptyTitle: 'Belum ada pinjaman', emptyIcon: 'loans' }
      ) + '</div>';
  };
  Pages._bind_loans = function () {
    document.querySelectorAll('[data-loan]').forEach(function (b) { b.onclick = function () { root.APP.openLoanDetail(b.getAttribute('data-loan')); }; });
    document.querySelectorAll('[data-pay]').forEach(function (b) { b.onclick = function () { openPaymentModal(b.getAttribute('data-pay')); }; });
    document.querySelectorAll('[data-cancel]').forEach(function (b) { b.onclick = function () {
      var id = b.getAttribute('data-cancel');
      UIK.confirmModal('Batalkan Pinjaman', 'Batalkan draft pinjaman ini?', 'Batalkan', function () {
        var l = root.APP.getDB().dapin_loans.find(function (x) { return x.id === id; });
        l.status = 'Cancelled';
        root.APP.afterMutate(); UIK.toast('Pinjaman dibatalkan.', 'success'); renderAgain('loans');
      });
    }; });
    /* Approve pengajuan anggota */
    document.querySelectorAll('[data-approve]').forEach(function (b) { b.onclick = function () {
      var id = b.getAttribute('data-approve');
      var loan = root.APP.getDB().dapin_loans.find(function (l) { return l.id === id; });
      UIK.confirmModal('Approve Pinjaman', 'Setujui pengajuan ' + loan.loan_id + ' — ' + loan.member_name + ' (' + root.APP.money(loan.principal) + ')? Pinjaman akan langsung dicairkan.', 'Approve & Cairkan', function () {
        var db = root.APP.getDB();
        var res = LG.approveLoan(db, id, root.APP.getSession().userId);
        if (!res.ok) { UIK.toast(res.error, 'error'); return; }
        root.APP.saveDB(); root.APP.afterMutate();
        UIK.toast('Pinjaman ' + loan.loan_id + ' disetujui & dicairkan! ✅', 'success');
        renderAgain('loans');
      });
    }; });
    /* Reject pengajuan anggota */
    document.querySelectorAll('[data-reject]').forEach(function (b) { b.onclick = function () {
      var id = b.getAttribute('data-reject');
      var loan = root.APP.getDB().dapin_loans.find(function (l) { return l.id === id; });
      UIK.confirmModal('Tolak Pinjaman', 'Tolak pengajuan ' + loan.loan_id + ' — ' + loan.member_name + '?', 'Tolak', function () {
        var db = root.APP.getDB();
        var res = LG.rejectLoan(db, id, root.APP.getSession().userId, 'Ditolak oleh admin');
        if (!res.ok) { UIK.toast(res.error, 'error'); return; }
        root.APP.saveDB(); root.APP.afterMutate();
        UIK.toast('Pinjaman ' + loan.loan_id + ' ditolak.', 'info');
        renderAgain('loans');
      });
    }; });
    /* Lihat foto wajah pengajuan */
    document.querySelectorAll('[data-view-photo]').forEach(function (b) { b.onclick = function () {
      var loan = root.APP.getDB().dapin_loans.find(function (l) { return l.id === b.getAttribute('data-view-photo'); });
      if (loan && loan.photo) UIK.openModal('<h3>Foto Wajah — ' + esc(loan.loan_id) + '</h3><p class="muted">' + esc(loan.member_name) + '</p><img src="' + loan.photo + '" style="width:100%;border-radius:8px;margin-top:12px">', true);
    }; });
    /* Lihat dokumen pendukung */
    document.querySelectorAll('[data-view-docs]').forEach(function (b) { b.onclick = function () {
      var loan = root.APP.getDB().dapin_loans.find(function (l) { return l.id === b.getAttribute('data-view-docs'); });
      if (!loan || !loan.documents) return;
      var html = '<h3>Dokumen Pendukung — ' + esc(loan.loan_id) + '</h3><p class="muted">' + esc(loan.member_name) + '</p><ul style="list-style:none;padding:0;margin-top:12px">';
      loan.documents.forEach(function (doc) {
        var isImg = doc.fileType && doc.fileType.indexOf('image') >= 0;
        if (isImg && doc.data) html += '<li style="margin-bottom:12px"><a href="' + doc.data + '" download="' + esc(doc.name) + '" style="color:var(--primary)">' + esc(doc.name) + '</a><br><img src="' + doc.data + '" style="max-width:100%;border-radius:8px;margin-top:6px;border:1px solid var(--border2)"></li>';
        else if (doc.data) html += '<li style="margin-bottom:8px"><a href="' + doc.data + '" download="' + esc(doc.name) + '" style="color:var(--primary)">' + esc(doc.name) + '</a></li>';
        else html += '<li style="margin-bottom:8px">' + esc(doc.name) + ' <span class="muted">(gagal)</span></li>';
      });
      html += '</ul>';
      UIK.openModal(html, true);
    }; });
    var b = document.getElementById('btnCreateLoan'); if (b) b.onclick = function () { openLoanModal(); };
  };
  function openLoanModal() {
    var db = root.APP.getDB();
    UIK.openModal('<h3>Buat Pinjaman Baru</h3><form id="loanForm">' +
      UIK.field('Anggota *', UIK.select('member_id', memberOptions(), db.dapin_members[0] && db.dapin_members[0].id)) +
      '<div class="frow">' + UIK.field('Pokok (Rp) *', UIK.input('principal', '', 'mis. 10000000', 'number')) + UIK.field('Tenor (bulan) *', UIK.input('tenor', '12', '12', 'number')) + '</div>' +
      '<div class="frow">' + UIK.field('Metode Bunga', UIK.select('method', [{ v: 'flat', l: 'Flat (per bulan)' }, { v: 'annuity', l: 'Anuitas (per tahun)' }], 'flat')) + UIK.field('Suku Bunga (%) *', UIK.input('rate', '1.2', '1.2', 'number')) + '</div>' +
      UIK.field('Tanggal Mulai', UIK.input('startDate', DB.today(), '', 'date')) +
      '<div class="loan-preview card" id="loanPreview"><p class="muted">Isi data untuk melihat perhitungan otomatis.</p></div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan Pinjaman</button></div></form>');
    var form = document.getElementById('loanForm');
    function preview() {
      var d = UIK.formdata(form);
      var pr = Number(d.principal), te = Number(d.tenor), ra = Number(d.rate);
      var box = document.getElementById('loanPreview');
      if (!pr || !te || ra == null) { box.innerHTML = '<p class="muted">Isi pokok, tenor, dan bunga untuk melihat perhitungan.</p>'; return; }
      if (te < 1 || te > 120) { box.innerHTML = '<p class="neg">Tenor harus 1–120 bulan.</p>'; return; }
      var rows = LG.buildSchedule(d.method, pr, ra, te, d.startDate || DB.today());
      var t = LG.loanTotals(rows);
      box.innerHTML = '<div class="kpis mini">' +
        stat('loans', 'Total Bunga', money(t.interestTotal), '', 'k-orange') +
        stat('loans', 'Total Bayar', money(t.totalPayment), '', 'k-violet') +
        stat('installments', 'Angsuran/Bulan', money(t.installment), d.method === 'annuity' ? 'Anuitas' : 'Flat', 'k-green') + '</div>' +
        '<div class="loan-formula"><small>Formula ' + (d.method === 'annuity' ? 'anuitas' : 'flat') + ': ' + (d.method === 'annuity' ? 'A = P·r·(1+r)^n / ((1+r)^n − 1), r = bunga/12' : 'Bunga = Pokok × ' + ra + '% per bulan; Pokok dibagi rata ' + te + ' bulan') + '</small></div>';
    }
    ['principal', 'tenor', 'rate', 'method', 'startDate'].forEach(function (n) { var el = form.elements[n]; if (el) el.addEventListener('input', preview); el && el.addEventListener('change', preview); });
    preview();
    form.onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(form);
      var res = LG.createLoan(db, d, root.APP.getSession().userId);
      if (!res.ok) { UIK.toast(res.error, 'error'); return; }
      root.APP.afterMutate(); UIK.closeModal(); UIK.toast('Pinjaman ' + res.loan.loan_id + ' dibuat.', 'success'); renderAgain('loans');
    };
  }

  /* ============ INSTALLMENTS ============ */
  Pages.installments = function () {
    var db = root.APP.getDB();
    function rows(q, st) {
      var out = [];
      db.dapin_loans.forEach(function (l) {
        if (l.status === 'Draft' || l.status === 'Cancelled') return;
        l.schedule.forEach(function (r) {
          out.push({ loan: l, r: r });
        });
      });
      if (q) out = out.filter(function (x) { return (x.loan.loan_id + x.loan.member_name + x.r.n).toLowerCase().indexOf(q) >= 0; });
      if (st) out = out.filter(function (x) { return x.r.status === st; });
      out.sort(function (a, b) { return a.r.dueDate.localeCompare(b.r.dueDate); });
      return out;
    }
    function table(out) {
      var cfg = { label: '#' };
      return root.APP.tbl(
        [{ label: 'Pinjaman', k: 'loan_id' }, { label: 'Anggota', k: 'member_name' }, { label: 'Angsuran', fn: function (x) { return '#' + x.r.n + ' / ' + x.loan.tenor; } }, { label: 'Jatuh Tempo', fn: function (x) { return fmt.date(x.r.dueDate); } }, { label: 'Pokok', fn: function (x) { return money(x.r.principal); } }, { label: 'Bunga', fn: function (x) { return money(x.r.interest); } }, { label: 'Total', fn: function (x) { return money(x.r.total); } }, { label: 'Dibayar', fn: function (x) { return money(x.r.paid); } }, { label: 'Sisa', fn: function (x) { return x.r.paid >= x.r.total ? '<span class="pos">Lunas</span>' : money(x.r.total - x.r.paid); } }, { label: 'Status', fn: function (x) { return badge(x.r.status); } }],
        out.map(function (x) { return { loan_id: x.loan.loan_id, member_name: x.loan.member_name, r: x.r, loan: x.loan }; }), { emptyTitle: 'Tidak ada angsuran', emptyIcon: 'installments' }
      );
    }
    return root.APP.pageHead('Installments', 'Jadwal angsuran seluruh pinjaman') +
      '<div class="toolbar"><div class="search-inline">' + icon('search') + '<input id="instSearch" placeholder="Cari pinjaman / anggota…"></div>' +
      '<select id="instFilter"><option value="">Semua Status</option><option>Upcoming</option><option>Due</option><option>Paid</option><option>Partial</option><option>Overdue</option></select></div>' +
      '<div id="instBody">' + table(rows('', '')) + '</div>';
  };
  Pages._bind_installments = function () {
    var db = root.APP.getDB();
    var s = document.getElementById('instSearch'), f = document.getElementById('instFilter');
    function refresh() {
      var q = (s.value || '').toLowerCase(), st = f.value;
      var out = [];
      db.dapin_loans.forEach(function (l) { if (l.status === 'Draft' || l.status === 'Cancelled') return; l.schedule.forEach(function (r) { out.push({ loan: l, r: r }); }); });
      if (q) out = out.filter(function (x) { return (x.loan.loan_id + x.loan.member_name + x.r.n).toLowerCase().indexOf(q) >= 0; });
      if (st) out = out.filter(function (x) { return x.r.status === st; });
      out.sort(function (a, b) { return a.r.dueDate.localeCompare(b.r.dueDate); });
      document.getElementById('instBody').innerHTML = root.APP.tbl(
        [{ label: 'Pinjaman', k: 'loan_id' }, { label: 'Anggota', k: 'member_name' }, { label: 'Angsuran', fn: function (x) { return '#' + x.r.n + ' / ' + x.loan.tenor; } }, { label: 'Jatuh Tempo', fn: function (x) { return fmt.date(x.r.dueDate); } }, { label: 'Pokok', fn: function (x) { return money(x.r.principal); } }, { label: 'Bunga', fn: function (x) { return money(x.r.interest); } }, { label: 'Total', fn: function (x) { return money(x.r.total); } }, { label: 'Dibayar', fn: function (x) { return money(x.r.paid); } }, { label: 'Sisa', fn: function (x) { return x.r.paid >= x.r.total ? '<span class="pos">Lunas</span>' : money(x.r.total - x.r.paid); } }, { label: 'Status', fn: function (x) { return badge(x.r.status); } }],
        out.map(function (x) { return { loan_id: x.loan.loan_id, member_name: x.loan.member_name, r: x.r, loan: x.loan }; }));
    }
    s.addEventListener('input', refresh); f.addEventListener('change', refresh);
  };

  /* ============ PAYMENTS ============ */
  Pages.payments = function () {
    var db = root.APP.getDB();
    var total = db.dapin_payments.reduce(function (s, p) { return s + p.amount; }, 0);
    var principal = db.dapin_payments.reduce(function (s, p) { return s + (p.principal || 0); }, 0);
    var interest = db.dapin_payments.reduce(function (s, p) { return s + (p.interest || 0); }, 0);
    return root.APP.pageHead('Payments', 'Pembayaran angsuran — mengalir otomatis ke installment, loan, wallet & transaksi FINORA', root.APP.canManage() ? '<button class="btn btn-primary" id="btnAddPay">' + icon('plus') + ' Catat Pembayaran</button>' : '') +
      '<div class="kpis mini">' + stat('payments', 'Total Diterima', money(total), '', 'k-green') + stat('payments', 'Pokok Terbayar', money(principal), '', 'k-primary') + stat('payments', 'Bunga Terbayar', money(interest), '', 'k-orange') + '</div>' +
      '<div class="card">' + root.APP.tbl(
        [{ label: 'ID', k: 'id' }, { label: 'Anggota', fn: function (p) { return '<div class="cell-user">' + root.APP.avatar(p.member_name, 28) + '<b>' + esc(p.member_name) + '</b></div>'; } }, { label: 'Pinjaman', k: 'loan_ref' }, { label: 'Angsuran', k: 'installment_no' }, { label: 'Pokok', fn: function (p) { return money(p.principal); } }, { label: 'Bunga', fn: function (p) { return money(p.interest); } }, { label: 'Total', fn: function (p) { return '<b class="pos">+' + money(p.amount) + '</b>'; } }, { label: 'Tanggal', fn: function (p) { return fmt.date(p.date); } }, { label: 'Metode', k: 'method' }],
        db.dapin_payments.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }), { emptyTitle: 'Belum ada pembayaran', emptyIcon: 'payments' }
      ) + '</div>';
  };
  Pages._bind_payments = function () {
    var b = document.getElementById('btnAddPay'); if (b) b.onclick = function () { openPaymentModal(); };
  };
  function openPaymentModal(loanId) {
    var db = root.APP.getDB();
    var opts = activeLoanOptions();
    if (!opts.length) { UIK.toast('Tidak ada pinjaman aktif untuk dibayar.', 'error'); return; }
    var sel = loanId || opts[0].v;
    UIK.openModal('<h3>Catat Pembayaran Angsuran</h3><form id="payForm">' +
      UIK.field('Pinjaman *', UIK.select('loan_id', opts, sel)) +
      '<div class="frow">' + UIK.field('Jumlah (Rp) *', UIK.input('amount', '', '0', 'number')) + UIK.field('Tanggal', UIK.input('date', DB.today(), '', 'date')) + '</div>' +
      '<div class="frow">' + UIK.field('Metode', UIK.select('method', ['cash', 'transfer', 'ewallet'], 'cash')) + UIK.field('Dana Masuk (Wallet)', UIK.select('wallet_id', walletOptions(), db.wallets[0] && db.wallets[0].id)) + '</div>' +
      UIK.field('Catatan', UIK.input('notes', '', 'opsional')) +
      '<div class="pay-hint" id="payHint"></div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Catat & Proses</button></div></form>');
    var form = document.getElementById('payForm');
    function hint() {
      var l = db.dapin_loans.find(function (x) { return x.id === form.elements.loan_id.value; });
      if (!l) return;
      var next = l.schedule.find(function (r) { return r.status !== 'Paid'; });
      document.getElementById('payHint').innerHTML = '<small>Angsuran berikutnya: <b>#' + (next ? next.n : '—') + '</b> sebesar <b>' + (next ? money(next.total - next.paid) : '—') + '</b> jatuh tempo ' + (next ? fmt.date(next.dueDate) : '—') + '. Sisa pinjaman: ' + money(l.remaining_balance) + '</small>';
      var amt = document.getElementById('payForm').elements.amount;
      if (!amt.value && next) amt.value = Math.round(next.total - next.paid);
    }
    form.elements.loan_id.addEventListener('change', hint);
    hint();
    form.onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(form);
      var res = LG.processPayment(db, d, root.APP.getSession().userId);
      if (!res.ok) { UIK.toast(res.error, 'error'); return; }
      root.APP.afterMutate(); UIK.closeModal();
      UIK.toast('Pembayaran ' + res.payId + ' tercatat → angsuran #' + res.affected.join(',#') + ' (' + money(res.principalPaid) + ' pokok + ' + money(res.interestPaid) + ' bunga).', 'success');
      renderAgain('payments');
    };
  }

  /* ============ DUE DATES ============ */
  Pages.dueDates = function () {
    var db = root.APP.getDB();
    var all = LG.dueItems(db, 90);
    var today = DB.today();
    var dueToday = all.filter(function (d) { return d.status === 'DueToday'; });
    var overdue = all.filter(function (d) { return d.status === 'Overdue'; });
    var upcoming = all.filter(function (d) { return d.status === 'Upcoming'; });
    function sec(title, tone, items) {
      return '<div class="card"><div class="card-t"><h3>' + title + ' <span class="badge ' + tone + '">' + items.length + '</span></h3></div>' +
        (items.length ? root.APP.tbl(
          [{ label: 'Anggota', fn: function (d) { return '<div class="cell-user">' + root.APP.avatar(d.member, 30) + '<b>' + esc(d.member) + '</b></div>'; } }, { label: 'Pinjaman', k: 'loan' }, { label: 'Angsuran', fn: function (d) { return '#' + d.installment; } }, { label: 'Jatuh Tempo', fn: function (d) { return fmt.date(d.dueDate) + (d.days < 0 ? ' <span class="badge t-red">+(' + (-d.days) + ' hr)</span>' : ''); } }, { label: 'Jumlah', fn: function (d) { return '<b>' + money(d.amount) + '</b>'; } }, { label: 'Status', fn: function (d) { return badge(d.status === 'Overdue' ? 'Overdue' : d.status === 'DueToday' ? 'Due Today' : d.status === 'Partial' ? 'Partial' : 'Upcoming'); } }, { label: '', fn: function (d) { return root.APP.canManage() && d.status !== 'Paid' ? '<button class="btn btn-primary btn-xs" data-paydue="' + d.loan_id + '">Bayar</button>' : ''; } }],
          items, { emptyTitle: 'Tidak ada', emptyIcon: 'check' }) : '<p class="muted pad">Tidak ada.</p>') + '</div>';
    }
    return root.APP.pageHead('Due Dates', 'Sistem jatuh tempo — pantau pembayaran hari ini, mendatang, dan terlambat') +
      '<div class="alert-banner ' + (overdue.length ? 'alert-red' : 'alert-green') + '">' + icon(overdue.length ? 'alert' : 'check') + '<span>' + (overdue.length ? '<b>' + overdue.length + ' pembayaran terlambat!</b> Segera hubungi anggota terkait.' : 'Tidak ada pembayaran yang terlambat.') + '</span></div>' +
      sec('Terlambat (Overdue)', 't-red', overdue) +
      sec('Jatuh Tempo Hari Ini', 't-orange', dueToday) +
      sec('Mendatang (7 Hari)', 't-blue', upcoming);
  };
  Pages._bind_dueDates = function () {
    document.querySelectorAll('[data-paydue]').forEach(function (b) { b.onclick = function () { openPaymentModal(b.getAttribute('data-paydue')); }; });
  };

  /* ============ LEDGER ============ */
  Pages.ledger = function () {
    var db = root.APP.getDB();
    var types = [{ v: '', l: 'Semua Tipe' }, { v: 'SAVINGS_DEPOSIT', l: 'Simpanan' }, { v: 'LOAN_CREATED', l: 'Pinjaman Dibuat' }, { v: 'LOAN_DISBURSED', l: 'Pencairan' }, { v: 'INSTALLMENT_PAYMENT', l: 'Pokok Angsuran' }, { v: 'INTEREST_PAYMENT', l: 'Bunga' }, { v: 'ADJUSTMENT', l: 'Penyesuaian' }];
    return root.APP.pageHead('Ledger DAPIN', 'Buku besar transparan — tidak pernah dihapus saat data utama berubah', root.APP.canManage() ? '<button class="btn btn-primary" id="btnAdj">' + icon('plus') + ' Penyesuaian</button>' : '') +
      '<div class="toolbar"><select id="ledgerFilter">' + types.map(function (t) { return '<option value="' + t.v + '">' + t.l + '</option>'; }).join('') + '</select></div>' +
      '<div id="ledgerBody">' + ledgerTable('') + '</div>';
  };
  function ledgerTable(filter) {
    var db = root.APP.getDB();
    var rows = db.dapin_ledger.slice().sort(function (a, b) { return b.created_at.localeCompare(a.created_at); });
    if (filter) rows = rows.filter(function (x) { return x.type === filter; });
    var name = { SAVINGS_DEPOSIT: 'Setoran Simpanan', LOAN_CREATED: 'Pinjaman Dibuat', LOAN_DISBURSED: 'Pencairan Pinjaman', INSTALLMENT_PAYMENT: 'Pokok Angsuran', INTEREST_PAYMENT: 'Bunga Angsuran', ADJUSTMENT: 'Penyesuaian' };
    var tone = { SAVINGS_DEPOSIT: 't-green', LOAN_CREATED: 't-gray', LOAN_DISBURSED: 't-red', INSTALLMENT_PAYMENT: 't-blue', INTEREST_PAYMENT: 't-orange', ADJUSTMENT: 't-gray' };
    return root.APP.tbl(
      [{ label: 'Tanggal', fn: function (x) { return fmt.date(x.date); } }, { label: 'Tipe', fn: function (x) { return '<span class="badge ' + (tone[x.type] || 't-gray') + '">' + (name[x.type] || x.type) + '</span>'; } }, { label: 'Anggota', fn: function (x) { var m = db.dapin_members.find(function (y) { return y.id === x.member_id; }); return esc(m ? m.name : '—'); } }, { label: 'Jumlah', fn: function (x) { return '<b class="' + (x.amount < 0 ? 'neg' : '') + '">' + money(x.amount) + '</b>'; } }, { label: 'Referensi', k: 'reference' }, { label: 'Catatan', k: 'notes' }, { label: 'Oleh', fn: function (x) { var u = root.APP.getDB().users.find(function (y) { return y.id === x.created_by; }); return esc(u ? u.name : x.created_by); } }],
      rows, { emptyTitle: 'Ledger kosong', emptyIcon: 'book' }
    );
  }
  Pages._bind_ledger = function () {
    var f = document.getElementById('ledgerFilter');
    f.addEventListener('change', function () { document.getElementById('ledgerBody').innerHTML = ledgerTable(f.value); });
    var b = document.getElementById('btnAdj'); if (b) b.onclick = function () {
      var db = root.APP.getDB();
      UIK.openModal('<h3>Penyesuaian Ledger</h3><form id="adjForm">' +
        '<div class="frow">' + UIK.field('Jenis', UIK.select('type', ['ADJUSTMENT'], 'ADJUSTMENT')) + UIK.field('Jumlah (Rp)', UIK.input('amount', '', 'positif/negatif', 'number')) + '</div>' +
        '<div class="frow">' + UIK.field('Tanggal', UIK.input('date', DB.today(), '', 'date')) + UIK.field('Anggota', UIK.select('member_id', [{ v: '', l: '— Tanpa anggota —' }].concat(memberOptions()), '')) + '</div>' +
        UIK.field('Catatan', UIK.input('notes', '', 'Alasan penyesuaian')) +
        '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Simpan</button></div></form>');
      document.getElementById('adjForm').onsubmit = function (e) {
        e.preventDefault();
        var d = UIK.formdata(e.target);
        var res = LG.recordAdjustment(db, d, root.APP.getSession().userId);
        if (!res.ok) { UIK.toast(res.error, 'error'); return; }
        root.APP.afterMutate(); UIK.closeModal(); UIK.toast('Penyesuaian tercatat.', 'success'); renderAgain('ledger');
      };
    };
  };

  /* ============ DAPIN REPORTS ============ */
  Pages.dapinReports = function () {
    var db = root.APP.getDB();
    function memberRows() { return db.dapin_members.map(function (m) { var s = LG.memberStats(db, m.id); return [m.member_id, m.name, s.totalSavings, s.totalLoans, s.totalPaid, s.outstanding, m.status]; }); }
    function savingsRows() { return db.dapin_savings.map(function (s) { return [s.ref, s.member_name, s.type, s.amount, s.date, s.notes]; }); }
    function loanRows() { return db.dapin_loans.map(function (l) { return [l.loan_id, l.member_name, l.principal, l.interest_total, l.total_payment, l.installment, l.paid_amount, l.remaining_balance, l.status]; }); }
    function instRows() { var out = []; db.dapin_loans.forEach(function (l) { if (l.status === 'Draft' || l.status === 'Cancelled') return; l.schedule.forEach(function (r) { out.push([l.loan_id, l.member_name, r.n, r.dueDate, r.principal, r.interest, r.total, r.paid, r.status]); }); }); return out; }
    function payRows() { return db.dapin_payments.map(function (p) { return [p.id, p.loan_ref, p.member_name, p.amount, p.principal, p.interest, p.date, p.method]; }); }
    function outstandingRows() { return db.dapin_loans.filter(function (l) { return l.status === 'Active' || l.status === 'Overdue'; }).map(function (l) { return [l.loan_id, l.member_name, l.principal, l.paid_amount, l.remaining_balance, l.status]; }); }
    function overdueRows() { return LG.dueItems(db, 999).filter(function (d) { return d.status === 'Overdue'; }).map(function (d) { return [d.loan, d.member, d.installment, d.dueDate, d.amount]; }); }
    var REP = [
      { name: 'Laporan Anggota', desc: 'Data lengkap anggota + ringkasan finansial.', icon: 'members', head: ['ID', 'Nama', 'Simpanan', 'Total Pinjaman', 'Dibayar', 'Outstanding', 'Status'], rows: memberRows() },
      { name: 'Laporan Simpanan', desc: 'Seluruh setoran simpanan.', icon: 'savings', head: ['Ref', 'Anggota', 'Jenis', 'Jumlah', 'Tanggal', 'Catatan'], rows: savingsRows() },
      { name: 'Laporan Pinjaman', desc: 'Seluruh pinjaman beserta kalkulasinya.', icon: 'loans', head: ['ID', 'Anggota', 'Pokok', 'Bunga Total', 'Total Bayar', 'Angsuran', 'Dibayar', 'Sisa', 'Status'], rows: loanRows() },
      { name: 'Laporan Angsuran', desc: 'Jadwal & status seluruh angsuran.', icon: 'installments', head: ['Pinjaman', 'Anggota', '#', 'Jatuh Tempo', 'Pokok', 'Bunga', 'Total', 'Dibayar', 'Status'], rows: instRows() },
      { name: 'Laporan Pembayaran', desc: 'Seluruh pembayaran yang tercatat.', icon: 'payments', head: ['ID', 'Pinjaman', 'Anggota', 'Total', 'Pokok', 'Bunga', 'Tanggal', 'Metode'], rows: payRows() },
      { name: 'Laporan Outstanding', desc: 'Pinjaman yang masih berjalan.', icon: 'loans', head: ['ID', 'Anggota', 'Pokok', 'Dibayar', 'Sisa', 'Status'], rows: outstandingRows() },
      { name: 'Laporan Overdue', desc: 'Angsuran yang melewati jatuh tempo.', icon: 'alert', head: ['Pinjaman', 'Anggota', '#', 'Jatuh Tempo', 'Jumlah'], rows: overdueRows() }
    ];
    return root.APP.pageHead('Reports — DAPIN', 'Laporan simpan-pinjam, siap ekspor (PDF/CSV)') +
      '<div class="report-grid">' + REP.map(function (r, i) {
        return '<div class="report-card card"><div class="report-ic">' + icon(r.icon) + '</div><div><b>' + esc(r.name) + '</b><p class="muted">' + esc(r.desc) + '</p><div class="report-actions"><button class="btn btn-ghost btn-sm" data-dr="' + i + '">Lihat</button><button class="btn btn-ghost btn-sm" data-dcsv="' + i + '">' + icon('download') + ' CSV</button><button class="btn btn-ghost btn-sm" data-dprint="' + i + '">Cetak</button></div></div></div>';
      }).join('') + '</div>';
  };
  Pages._bind_dapinReports = function () {
    var db = root.APP.getDB();
    function memberRows() { return db.dapin_members.map(function (m) { var s = LG.memberStats(db, m.id); return [m.member_id, m.name, s.totalSavings, s.totalLoans, s.totalPaid, s.outstanding, m.status]; }); }
    function savingsRows() { return db.dapin_savings.map(function (s) { return [s.ref, s.member_name, s.type, s.amount, s.date, s.notes]; }); }
    function loanRows() { return db.dapin_loans.map(function (l) { return [l.loan_id, l.member_name, l.principal, l.interest_total, l.total_payment, l.installment, l.paid_amount, l.remaining_balance, l.status]; }); }
    function instRows() { var out = []; db.dapin_loans.forEach(function (l) { if (l.status === 'Draft' || l.status === 'Cancelled') return; l.schedule.forEach(function (r) { out.push([l.loan_id, l.member_name, r.n, r.dueDate, r.principal, r.interest, r.total, r.paid, r.status]); }); }); return out; }
    function payRows() { return db.dapin_payments.map(function (p) { return [p.id, p.loan_ref, p.member_name, p.amount, p.principal, p.interest, p.date, p.method]; }); }
    function outstandingRows() { return db.dapin_loans.filter(function (l) { return l.status === 'Active' || l.status === 'Overdue'; }).map(function (l) { return [l.loan_id, l.member_name, l.principal, l.paid_amount, l.remaining_balance, l.status]; }); }
    function overdueRows() { return LG.dueItems(db, 999).filter(function (d) { return d.status === 'Overdue'; }).map(function (d) { return [d.loan, d.member, d.installment, d.dueDate, d.amount]; }); }
    var REP = [
      { head: ['ID', 'Nama', 'Simpanan', 'Total Pinjaman', 'Dibayar', 'Outstanding', 'Status'], rows: memberRows() },
      { head: ['Ref', 'Anggota', 'Jenis', 'Jumlah', 'Tanggal', 'Catatan'], rows: savingsRows() },
      { head: ['ID', 'Anggota', 'Pokok', 'Bunga Total', 'Total Bayar', 'Angsuran', 'Dibayar', 'Sisa', 'Status'], rows: loanRows() },
      { head: ['Pinjaman', 'Anggota', '#', 'Jatuh Tempo', 'Pokok', 'Bunga', 'Total', 'Dibayar', 'Status'], rows: instRows() },
      { head: ['ID', 'Pinjaman', 'Anggota', 'Total', 'Pokok', 'Bunga', 'Tanggal', 'Metode'], rows: payRows() },
      { head: ['ID', 'Anggota', 'Pokok', 'Dibayar', 'Sisa', 'Status'], rows: outstandingRows() },
      { head: ['Pinjaman', 'Anggota', '#', 'Jatuh Tempo', 'Jumlah'], rows: overdueRows() }
    ];
    document.querySelectorAll('[data-dr]').forEach(function (b) { b.onclick = function () { var r = REP[Number(b.getAttribute('data-dr'))]; root.APP.reportModal(r); }; });
    document.querySelectorAll('[data-dcsv]').forEach(function (b) { b.onclick = function () { var r = REP[Number(b.getAttribute('data-dcsv'))]; root.APP.exportCSV(r.head[0] + '-laporan', [r.head].concat(r.rows)); }; });
    document.querySelectorAll('[data-dprint]').forEach(function (b) { b.onclick = function () { var r = REP[Number(b.getAttribute('data-dprint'))]; root.APP.reportModal(r, true); }; });
  };

  /* ============ HELPERS ============ */
  function lastMonths(n) {
    var out = [], d = new Date();
    for (var i = n - 1; i >= 0; i--) {
      var dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push({ y: dt.getFullYear(), m: String(dt.getMonth() + 1).padStart(2, '0'), label: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][dt.getMonth()] });
    }
    return out;
  }
  function renderAgain(key) {
    var fn = root.Pages[key];
    if (fn) {
      var view = document.getElementById('view');
      view.innerHTML = UIK.loading();
      setTimeout(function () {
        view.innerHTML = fn(currentParam());
        if (root.APP._bindPage) root.APP._bindPage(key, currentParam());
      }, 10);
    } else { location.reload(); }
  }
  function currentParam() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    return h.indexOf('/') >= 0 ? h.slice(h.indexOf('/') + 1) : null;
  }

  /* =============================================================
     ANGGOTA (USER) — Panel terbatas: hanya bayar & pinjam
     Tidak mengubah panel admin sama sekali.
     ============================================================= */

  /* Beranda anggota — ringkasan data sendiri */
  Pages.memberDashboard = function () {
    var db = root.APP.getDB();
    var mid = root.APP.memberDapinId();
    if (!mid) return UIK.emptyState('user', 'Akun tidak terhubung ke anggota', 'Hubungi admin untuk mengaitkan akun Anda.');
    var st = LG.memberStats(db, mid);
    var member = db.dapin_members.find(function (m) { return m.id === mid; });
    var due = LG.dueItems(db, 30).filter(function (d) { return d.loan_id && db.dapin_loans.find(function (l) { return l.id === d.loan_id && l.member_id === mid; }); });
    return root.APP.pageHead('Beranda, ' + esc(member ? member.name : 'Anggota'), 'Ringkasan simpanan, pinjaman, dan angsuran Anda') +
      '<div class="kpis">' +
        stat('savings', 'Simpanan Saya', money(st.totalSavings), st.savingsCount + ' setoran', 'k-dapin') +
        stat('loans', 'Pinjaman Aktif', money(st.outstanding), st.activeLoans.length + ' pinjaman', 'k-orange') +
        stat('payments', 'Total Dibayar', money(st.totalPaid), 'Angsuran dibayar', 'k-green') +
        stat('due', 'Jatuh Tempo', String(due.length), '30 hari ke depan', due.length ? 'k-red' : 'k-primary') +
      '</div>' +
      '<div class="page-actions" style="margin-bottom:16px">' +
        '<a class="btn btn-primary" href="#/member/pay">' + icon('payments') + ' Bayar Angsuran</a>' +
        '<a class="btn btn-success" href="#/member/apply">' + icon('plus') + ' Ajukan Pinjaman</a>' +
      '</div>' +
      (due.length ? '<div class="card"><div class="card-t"><h3>Angsuran Jatuh Tempo</h3></div>' + root.APP.tbl([
        { label: 'Pinjaman', fn: function (r) { return esc(r.loan); } },
        { label: 'Cicilan', fn: function (r) { return '#' + r.installment; } },
        { label: 'Jatuh Tempo', fn: function (r) { return esc(fmt.date(r.dueDate)); } },
        { label: 'Jumlah', fn: function (r) { return money(r.amount); } },
        { label: 'Status', fn: function (r) { return badge(r.status); } }
      ], due.slice(0, 5)) + '</div>' : UIK.emptyState('check', 'Tidak ada angsuran jatuh tempo', 'Semua cicilan lancar! 🎉'));
  };

  /* Pinjaman Saya */
  Pages.memberLoans = function () {
    var db = root.APP.getDB();
    var mid = root.APP.memberDapinId();
    var loans = db.dapin_loans.filter(function (l) { return l.member_id === mid; });
    if (!loans.length) return root.APP.pageHead('Pinjaman Saya', 'Anda belum memiliki pinjaman') +
      '<a class="btn btn-success" href="#/member/apply">' + icon('plus') + ' Ajukan Pinjaman</a>';
    return root.APP.pageHead('Pinjaman Saya', loans.length + ' pinjaman tercatat') +
      root.APP.tbl([
        { label: 'No', fn: function (l) { return esc(l.loan_id); } },
        { label: 'Jumlah', fn: function (l) { return money(l.principal); } },
        { label: 'Tenor', fn: function (l) { return l.tenor + ' bln'; } },
        { label: 'Cicilan/bln', fn: function (l) { return money(l.installment); } },
        { label: 'Sisa', fn: function (l) { return money(l.remaining_balance); } },
        { label: 'Status', fn: function (l) {
          if (l.status === 'Pending') return badge('Pending') + ' <small class="muted">menunggu approve admin</small>';
          if (l.status === 'Rejected') return badge('Rejected') + (l.rejectReason ? ' <small class="muted">' + esc(l.rejectReason) + '</small>' : '');
          return badge(l.status);
        } },
        { label: '', fn: function (l) { return '<button class="btn btn-ghost btn-sm" data-loan="' + l.id + '">' + icon('eye') + ' Detail</button>'; } }
      ], loans);
  };

  /* Bayar Angsuran */
  Pages.memberPay = function () {
    var db = root.APP.getDB();
    var mid = root.APP.memberDapinId();
    var loans = db.dapin_loans.filter(function (l) { return l.member_id === mid && (l.status === 'Active' || l.status === 'Overdue'); });
    if (!loans.length) return root.APP.pageHead('Bayar Angsuran', 'Tidak ada pinjaman aktif') +
      '<a class="btn btn-success" href="#/member/apply">' + icon('plus') + ' Ajukan Pinjaman</a>';
    var items = [];
    loans.forEach(function (l) {
      l.schedule.forEach(function (r) {
        if (r.status !== 'Paid') items.push({ loan: l, row: r });
      });
    });
    if (!items.length) return root.APP.pageHead('Bayar Angsuran', 'Semua angsuran sudah lunas! 🎉');
    return root.APP.pageHead('Bayar Angsuran', items.length + ' angsuran belum dibayar') +
      root.APP.tbl([
        { label: 'Pinjaman', fn: function (r) { return esc(r.loan.loan_id); } },
        { label: 'Cicilan', fn: function (r) { return '#' + r.row.n; } },
        { label: 'Jumlah', fn: function (r) { return money(r.row.total - r.row.paid); } },
        { label: 'Jatuh Tempo', fn: function (r) { return esc(fmt.date(r.row.dueDate)); } },
        { label: 'Status', fn: function (r) { return badge(r.row.status); } },
        { label: '', fn: function (r) { return '<button class="btn btn-success btn-sm" data-pay-loan="' + r.loan.id + '" data-pay-amt="' + (r.row.total - r.row.paid) + '">Bayar</button>'; } }
      ], items);
  };

  /* Ajukan Pinjaman — form: jumlah + foto wajah + tenor → kwitansi otomatis */
  Pages.memberApply = function () {
    var db = root.APP.getDB();
    var mid = root.APP.memberDapinId();
    var active = db.dapin_loans.filter(function (l) { return l.member_id === mid && (l.status === 'Active' || l.status === 'Overdue'); });
    if (active.length >= 3) return root.APP.pageHead('Ajukan Pinjaman', '') +
      '<div class="state"><div class="state-ic">' + icon('alert') + '</div><h4>Batas pinjaman aktif tercapai</h4><p class="muted">Anda sudah memiliki 3 pinjaman aktif. Selesaikan salah satu sebelum mengajukan lagi.</p></div>';
    return root.APP.pageHead('Ajukan Pinjaman', 'Isi data untuk mengajukan pinjaman') +
      '<div class="card"><div class="card-t"><h3>Form Pengajuan</h3></div><div class="card-body">' +
      '<form id="applyForm">' +
        UIK.field('Jumlah Pinjaman (Rp)', UIK.input('principal', '', 'Minimal Rp 100.000', 'number')) +
        '<div class="field"><label>Foto Wajah</label><input type="file" name="photo" accept="image/*" capture="user" style="padding:8px;background:var(--bg-2);border:1px solid var(--border2);border-radius:8px;color:var(--text-muted);width:100%"><small class="muted" style="display:block;margin-top:4px">Ambil foto wajah untuk verifikasi pengajuan.</small></div>' +
        '<div class="field"><label>Upload Dokumen (PDF/JPG)</label><input type="file" name="docs" accept=".pdf,image/jpeg,image/jpg,image/png" multiple style="padding:8px;background:var(--bg-2);border:1px solid var(--border2);border-radius:8px;color:var(--text-muted);width:100%"><small class="muted" style="display:block;margin-top:4px">Unggah KTP, slip gaji, atau dokumen pendukung (PDF/JPG/PNG, boleh lebih dari 1).</small></div>' +
        UIK.field('Tenor (bulan)', UIK.input('tenor', '', 'Berapa bulan', 'number')) +
        '<button type="submit" class="btn btn-success" style="margin-top:8px">' + icon('plus') + ' Ajukan Pinjaman</button>' +
      '</form></div></div>';
  };

  /* Simpanan Saya */
  Pages.memberSavings = function () {
    var db = root.APP.getDB();
    var mid = root.APP.memberDapinId();
    var st = LG.memberStats(db, mid);
    var savings = db.dapin_savings.filter(function (s) { return s.member_id === mid; });
    return root.APP.pageHead('Simpanan Saya', 'Total ' + money(st.totalSavings)) +
      '<div class="kpis">' + stat('savings', 'Total Simpanan', money(st.totalSavings), st.savingsCount + ' setoran', 'k-dapin') + '</div>' +
      (savings.length ? root.APP.tbl([
        { label: 'Ref', fn: function (s) { return esc(s.ref); } },
        { label: 'Jenis', fn: function (s) { return esc(s.type); } },
        { label: 'Jumlah', fn: function (s) { return money(s.amount); } },
        { label: 'Tanggal', fn: function (s) { return esc(fmt.date(s.date)); } },
        { label: 'Catatan', fn: function (s) { return esc(s.notes || '—'); } }
      ], savings) : UIK.emptyState('savings', 'Belum ada simpanan', 'Simpanan Anda akan muncul di sini.'));
  };

  /* Bind events untuk halaman anggota */
  Pages._bind_memberLoans = function () {
    document.querySelectorAll('[data-loan]').forEach(function (b) {
      b.onclick = function () { root.APP.openLoanDetail(b.getAttribute('data-loan')); };
    });
  };
  Pages._bind_memberPay = function () {
    document.querySelectorAll('[data-pay-loan]').forEach(function (b) {
      b.onclick = function () {
        var loanId = b.getAttribute('data-pay-loan');
        var amt = Number(b.getAttribute('data-pay-amt'));
        var db = root.APP.getDB();
        var loan = db.dapin_loans.find(function (l) { return l.id === loanId; });
        UIK.confirmModal('Bayar Angsuran', 'Anda akan membayar ' + root.APP.money(amt) + ' untuk pinjaman ' + loan.loan_id + '. Saldo pinjaman akan berkurang.', 'Bayar', function () {
          var res = LG.processPayment(db, { loan_id: loanId, amount: amt, wallet_id: db.wallets[0].id, method: 'transfer' }, root.APP.getSession().userId);
          if (!res.ok) { UIK.toast(res.error, 'error'); return; }
          root.APP.saveDB();
          root.APP.afterMutate();
          UIK.toast('Pembayaran ' + res.payId + ' berhasil! ✅', 'success');
          location.hash = '#/member/loans';
        });
      };
    });
  };
  Pages._bind_memberApply = function () {
    var form = document.getElementById('applyForm');
    if (!form) return;
    var FIXED_RATE = 35;      /* internal: 35% per bulan flat — TIDAK DITAMPILKAN ke anggota */
    var FIXED_METHOD = 'flat';
    var ADMIN_FEE_PCT = 10;   /* potongan admin 10% */

    form.onsubmit = function (e) {
      e.preventDefault();
      var d = UIK.formdata(form);
      var p = Number(d.principal), t = Number(d.tenor);
      var photoInput = form.querySelector('input[name="photo"]');
      var docsInput = form.querySelector('input[name="docs"]');

      /* validasi */
      if (!p || p < 100000) { UIK.toast('Minimal pinjaman Rp 100.000.', 'error'); return; }
      if (!t || t < 1) { UIK.toast('Tenor minimal 1 bulan.', 'error'); return; }
      if (!photoInput || !photoInput.files || !photoInput.files[0]) { UIK.toast('Foto wajah wajib diunggah.', 'error'); return; }

      /* hitung internal (tidak ditampilkan ke anggota) */
      var sched = LG.buildSchedule(FIXED_METHOD, p, FIXED_RATE, t, DB.today());
      var tot = LG.loanTotals(sched);
      var adminFee = Math.round(p * ADMIN_FEE_PCT / 100);
      var amountReceived = p - adminFee;
      var monthlyPayment = Math.round(tot.installment);
      var totalRepayment = Math.round(tot.totalPayment);

      /* buat pinjaman di database — status Pending, belum dicairkan */
      var db = root.APP.getDB();
      var res = LG.createLoan(db, {
        member_id: root.APP.memberDapinId(),
        principal: p, method: FIXED_METHOD, rate: FIXED_RATE,
        tenor: t, startDate: DB.today()
      }, root.APP.getSession().userId);

      if (!res.ok) { UIK.toast(res.error, 'error'); return; }

      /* OVERRIDE: anggota ajukan → Pending, tidak langsung cair */
      res.loan.status = 'Pending';
      res.loan.approved = false;

      /* kumpulkan semua file: foto wajah + dokumen pendukung */
      var allFiles = [];
      /* foto wajah — wajib */
      allFiles.push({ name: photoInput.files[0].name, file: photoInput.files[0], type: 'photo' });
      /* dokumen pendukung — opsional, boleh multiple */
      if (docsInput && docsInput.files) {
        for (var i = 0; i < docsInput.files.length; i++) {
          allFiles.push({ name: docsInput.files[i].name, file: docsInput.files[i], type: 'doc' });
        }
      }

      /* baca semua file sebagai base64 secara paralel */
      var fileResults = [];
      var done = 0;
      var total = allFiles.length;

      allFiles.forEach(function (item, idx) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          fileResults[idx] = { name: item.name, data: ev.target.result, type: item.type, fileType: item.file.type };
          done++;
          if (done === total) finishSubmit();
        };
        reader.onerror = function () {
          fileResults[idx] = { name: item.name, data: null, type: item.type, fileType: item.file.type };
          done++;
          if (done === total) finishSubmit();
        };
        reader.readAsDataURL(item.file);
      });

      function finishSubmit() {
        /* simpan foto & dokumen ke loan */
        var photoData = null;
        var docsList = [];
        fileResults.forEach(function (r) {
          if (r.type === 'photo' && r.data) photoData = r.data;
          else if (r.type === 'doc') docsList.push({ name: r.name, data: r.data, fileType: r.fileType });
        });
        res.loan.photo = photoData;
        res.loan.documents = docsList;
        root.APP.saveDB();
        root.APP.afterMutate();

        /* tampilkan KWITANSI */
        var member = db.dapin_members.find(function (m) { return m.id === root.APP.memberDapinId(); });
        var loanNum = res.loan.loan_id;
        var todayStr = fmt.date(DB.today());
        var memberName = member ? member.name : '—';
        var memberId = member ? member.member_id : '—';

        /* dokumen list untuk kwitansi */
        var docsHTML = '';
        if (docsList.length > 0) {
          docsHTML = '<div class="kwitansi-docs"><div class="kw-docs-title">Dokumen Pendukung (' + docsList.length + '):</div><ul class="kw-docs-list">';
          docsList.forEach(function (doc) {
            var isImg = doc.fileType && doc.fileType.indexOf('image') >= 0;
            if (isImg && doc.data) {
              docsHTML += '<li class="kw-doc-item"><a href="' + doc.data + '" target="_blank" download="' + esc(doc.name) + '">' + icon('reports') + esc(doc.name) + '</a><img src="' + doc.data + '" style="width:40px;height:40px;border-radius:4px;object-fit:cover;margin-left:8px"></li>';
            } else if (doc.data) {
              docsHTML += '<li class="kw-doc-item"><a href="' + doc.data + '" target="_blank" download="' + esc(doc.name) + '">' + icon('reports') + esc(doc.name) + '</a></li>';
            } else {
              docsHTML += '<li class="kw-doc-item">' + icon('reports') + esc(doc.name) + ' <small class="muted">(gagal dibaca)</small></li>';
            }
          });
          docsHTML += '</ul></div>';
        }

        var kwitansiHTML =
          '<div class="kwitansi">' +
            '<div class="kwitansi-head">' +
              '<div class="kwitansi-brand">' + icon('dapin') + '<div><b>FINORA <em>×</em> DAPIN</b><small>Bukti Pengajuan Pinjaman</small></div></div>' +
              '<div class="kwitansi-no"><small>No. Dokumen</small><b>' + esc(loanNum) + '</b></div>' +
            '</div>' +
            '<div class="kwitansi-meta">' +
              '<div><small>Tanggal</small><span>' + esc(todayStr) + '</span></div>' +
              '<div><small>Nama Anggota</small><span>' + esc(memberName) + '</span></div>' +
              '<div><small>ID Anggota</small><span>' + esc(memberId) + '</span></div>' +
              '<div class="kwitansi-photo"><small>Foto Wajah</small>' + (photoData ? '<img src="' + photoData + '" style="width:80px;height:80px;border-radius:8px;object-fit:cover;border:2px solid var(--border2)">' : '<span class="muted">—</span>') + '</div>' +
            '</div>' +
            '<table class="kwitansi-table">' +
              '<tr><td>Jumlah Pinjaman</td><td class="kw-val">' + money(p) + '</td></tr>' +
              '<tr><td>Potongan Admin (10%)</td><td class="kw-val kw-red">− ' + money(adminFee) + '</td></tr>' +
              '<tr class="kw-highlight"><td>Jumlah Diterima</td><td class="kw-val">' + money(amountReceived) + '</td></tr>' +
              '<tr><td>Tenor</td><td class="kw-val">' + t + ' bulan</td></tr>' +
              '<tr class="kw-highlight"><td>Pembayaran per Bulan</td><td class="kw-val">' + money(monthlyPayment) + '</td></tr>' +
              '<tr class="kw-highlight kw-total"><td>Total yang Harus Dikembalikan</td><td class="kw-val">' + money(totalRepayment) + '</td></tr>' +
            '</table>' +
            docsHTML +
            '<div class="kwitansi-foot">' +
              '<p class="muted">Pengajuan Anda telah terkirim. Menunggu persetujuan admin. Anda akan melihat status pinjaman di halaman Pinjaman Saya.</p>' +
              '<div class="kwitansi-actions">' +
                '<button class="btn btn-ghost" data-close>Tutup</button>' +
                '<a class="btn btn-success" href="#/member/loans">Lihat Pinjaman Saya</a>' +
              '</div>' +
            '</div>' +
          '</div>';

        UIK.openModal(kwitansiHTML, true);
        UIK.toast('Pengajuan ' + loanNum + ' terkirim! Menunggu approve admin.', 'success');
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
