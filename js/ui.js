/* FINORA x DAPIN — UI Kit: icons, format, modal, toast, empty/loading states */
(function (root) {
  if (root.UIK) return root.UIK;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- Icons ---------- */
  var P = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var I = {
    dashboard: '<svg viewBox="0 0 24 24" ' + P + '><rect x="3" y="3" width="7" height="9" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="16" width="7" height="5" rx="1.6"/></svg>',
    tx: '<svg viewBox="0 0 24 24" ' + P + '><path d="M3 6h13M13 3l4 3-4 3"/><path d="M21 18H8M11 15l-4 3 4 3"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" ' + P + '><rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 15h2"/><path d="M16 6l-1.5-2.6a1.6 1.6 0 0 0-2.2-.6L7 6"/></svg>',
    budget: '<svg viewBox="0 0 24 24" ' + P + '><path d="M12 3v18"/><path d="M18 7c0-2-2.5-3.5-6-3.5S6 5 6 7s2.5 3 6 3 6 1 6 3-2.5 3.5-6 3.5S6 13 6 11"/></svg>',
    analytics: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
    reports: '<svg viewBox="0 0 24 24" ' + P + '><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 13h6M9 17h6"/></svg>',
    dapin: '<svg viewBox="0 0 24 24" ' + P + '><path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z"/><path d="M12 8v4M10 10h4"/></svg>',
    members: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.7-3.4 3.2-5 6.2-5s5.5 1.6 6.2 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 15.2c2.6.2 4.5 1.6 5.2 4.3"/></svg>',
    savings: '<svg viewBox="0 0 24 24" ' + P + '><ellipse cx="12" cy="5.5" rx="7" ry="3"/><path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/><path d="M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
    loans: '<svg viewBox="0 0 24 24" ' + P + '><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg>',
    installments: '<svg viewBox="0 0 24 24" ' + P + '><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6l1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/></svg>',
    payments: '<svg viewBox="0 0 24 24" ' + P + '><rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M2.5 10.5h19M6.5 15h4"/></svg>',
    due: '<svg viewBox="0 0 24 24" ' + P + '><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M9.5 15l2 2 3.5-3.5"/></svg>',
    calc: '<svg viewBox="0 0 24 24" ' + P + '><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 7h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01M8.5 18.5h.01M12 18.5h.01"/></svg>',
    loanCalc: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    savCalc: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 19V9l8-5 8 5v10"/><path d="M9 19v-6h6v6"/><path d="M4 19h16"/></svg>',
    bell: '<svg viewBox="0 0 24 24" ' + P + '><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></svg>',
    user: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-5.5 8-5.5s7.2 1.5 8 5.5"/></svg>',
    settings: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.15-1.4l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.4-1.4L13.7 3h-3.4l-.45 2.3a7 7 0 0 0-2.4 1.4l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5.05.95.15 1.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.4 1.4l.45 2.3h3.4l.45-2.3a7 7 0 0 0 2.4-1.4l2.3 1 2-3.4-2-1.5c.1-.45.15-.9.15-1.4z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" ' + P + '><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>',
    search: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" ' + P + '><path d="M15 5l-7 7 7 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" ' + P + '><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 20h4L20 8a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 6.5l3 3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14"/></svg>',
    eye: '<svg viewBox="0 0 24 24" ' + P + '><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    download: '<svg viewBox="0 0 24 24" ' + P + '><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" ' + P + '><path d="M6 6l12 12M18 6L6 18"/></svg>',
    mail: '<svg viewBox="0 0 24 24" ' + P + '><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" ' + P + '><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" ' + P + '><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    bank: '<svg viewBox="0 0 24 24" ' + P + '><path d="M3 9l9-6 9 6M4 9v11M20 9v11M8 13v4M12 13v4M16 13v4M2 20h20"/></svg>',
    cash: '<svg viewBox="0 0 24 24" ' + P + '><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M5.5 9.5h.01M18.5 14.5h.01"/></svg>',
    ew: '<svg viewBox="0 0 24 24" ' + P + '><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M9 9.5c.8-1 2.2-1.3 3.4-.6 1.4.8 1.4 2.3 0 3.1-1 .6-1 .6 0 1.2 1.4.8 1.4 2.3 0 3.1-1.2.7-2.6.4-3.4-.6"/></svg>',
    check: '<svg viewBox="0 0 24 24" ' + P + '><path d="M5 13l4 4L19 7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" ' + P + '><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" ' + P + '><path d="M12 3L2.5 20h19z"/><path d="M12 10v4M12 17.5h.01"/></svg>',
    filter: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    chart: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" ' + P + '><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    book: '<svg viewBox="0 0 24 24" ' + P + '><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/></svg>'
  };
  function icon(name, cls) { return '<span class="ic ' + (cls || '') + '">' + (I[name] || I.dashboard) + '</span>'; }

  /* ---------- Format ---------- */
  var fmt = {
    money: function (n) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0); },
    num: function (n) { return new Intl.NumberFormat('id-ID').format(n || 0); },
    date: function (d) { if (!d) return '—'; var p = String(d).split('-'); if (p.length !== 3) return d; return p[2] + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(p[1]) - 1] + ' ' + p[0]; },
    dateShort: function (d) { if (!d) return '—'; var p = String(d).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; },
    datetime: function (iso) { if (!iso) return '—'; var d = new Date(iso); return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  };

  var STATUS_TONE = { Active: 't-green', Inactive: 't-gray', Draft: 't-gray', Completed: 't-green', Cancelled: 't-gray', Overdue: 't-red', 'Due Today': 't-orange', DueToday: 't-orange', Upcoming: 't-blue', Due: 't-orange', Paid: 't-green', Partial: 't-orange', upcoming: 't-blue', overdue: 't-red', paid: 't-green', partial: 't-orange' };
  function badge(s) {
    var tone = STATUS_TONE[s] || 't-gray';
    return '<span class="badge ' + tone + '">' + esc(s) + '</span>';
  }
  function avColor(name) {
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return 'hsl(' + h + ',65%,58%)';
  }
  function avatar(name, size) {
    var init = name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
    return '<span class="avatar" style="background:' + avColor(name) + ';width:' + (size || 36) + 'px;height:' + (size || 36) + 'px;font-size:' + ((size || 36) * 0.36) + 'px">' + esc(init) + '</span>';
  }

  /* ---------- Modal / Toast ---------- */
  function openModal(html, wide) {
    closeModal();
    var m = document.createElement('div'); m.className = 'modal-overlay'; m.id = 'modalOverlay';
    m.innerHTML = '<div class="modal ' + (wide ? 'modal-wide' : '') + '"><button class="modal-x" data-close>X</button><div class="modal-body">' + html + '</div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.getAttribute('data-close')) closeModal(); });
    var first = m.querySelector('input,select,textarea'); if (first) setTimeout(function () { first.focus(); }, 60);
    return m;
  }
  function closeModal() { var m = document.getElementById('modalOverlay'); if (m) m.remove(); }
  function confirmModal(title, msg, okLabel, onOk) {
    openModal('<h3>' + esc(title) + '</h3><p class="muted">' + esc(msg) + '</p><div class="modal-actions"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" id="cfOk">' + esc(okLabel || 'Hapus') + '</button></div>');
    document.getElementById('cfOk').onclick = function () { closeModal(); onOk && onOk(); };
  }
  function toast(msg, type) {
    var box = document.getElementById('toastBox');
    if (!box) { box = document.createElement('div'); box.id = 'toastBox'; box.className = 'toast-box'; document.body.appendChild(box); }
    var t = document.createElement('div'); t.className = 'toast ' + (type || 'info');
    t.innerHTML = '<span class="toast-ic">' + icon(type === 'success' ? 'check' : type === 'error' ? 'alert' : 'bell') + '</span><span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 350); }, 3200);
  }
  function loading(msg) { return '<div class="state loading"><div class="spinner"></div><p>' + esc(msg || 'Memuat data…') + '</p></div>'; }
  function emptyState(ic, title, desc) { return '<div class="state"><div class="state-ic">' + icon(ic) + '</div><h4>' + esc(title) + '</h4>' + (desc ? '<p class="muted">' + esc(desc) + '</p>' : '') + '</div>'; }
  function statCard(iconName, label, value, sub, cls) {
    return '<div class="card stat ' + (cls || '') + '"><div class="stat-ic">' + icon(iconName) + '</div><div class="stat-body"><div class="stat-label">' + esc(label) + '</div><div class="stat-value">' + value + '</div>' + (sub ? '<div class="stat-sub">' + sub + '</div>' : '') + '</div></div>';
  }

  /* ---------- Field builder ---------- */
  function field(label, html, cls) { return '<div class="field ' + (cls || '') + '"><label>' + esc(label) + '</label>' + html + '</div>'; }
  function input(name, val, ph, type) { return '<input type="' + (type || 'text') + '" name="' + name + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '">'; }
  function select(name, options, val) {
    var o = options.map(function (op) { var v = typeof op === 'object' ? op.v : op; var l = typeof op === 'object' ? op.l : op; return '<option value="' + esc(v) + '" ' + (String(v) === String(val) ? 'selected' : '') + '>' + esc(l) + '</option>'; }).join('');
    return '<select name="' + name + '">' + o + '</select>';
  }
  function formdata(form) { var o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); return o; }
  function moneyInputCls(v) { return v < 0 ? 'neg' : ''; }

  root.UIK = { esc: esc, icon: icon, fmt: fmt, badge: badge, avatar: avatar, openModal: openModal, closeModal: closeModal, confirmModal: confirmModal, toast: toast, loading: loading, emptyState: emptyState, statCard: statCard, field: field, input: input, select: select, formdata: formdata, moneyInputCls: moneyInputCls, STATUS_TONE: STATUS_TONE };
  return root.UIK;
})(typeof window !== 'undefined' ? window : globalThis);
