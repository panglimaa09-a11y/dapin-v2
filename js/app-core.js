/**
 * FINORA × DAPIN — App Core
 * Shell, sidebar, router, role-based navigation.
 * Admin  → full menu (Dashboard, Finance, Wallet, DAPIN, Tools, Settings)
 * Anggota → limited menu (Beranda, Pinjaman Saya, Bayar Angsuran, Ajukan Pinjaman, Simpanan Saya, Profil)
 */
const App = (() => {
  let currentRoute = 'login';
  const routes = {};

  function register(name, renderer) { routes[name] = renderer; }

  function go(name) {
    currentRoute = name;
    render();
  }

  function getMenu() {
    const s = Auth.current();
    if (!s) return [];
    if (s.role === 'admin') {
      return [
        { name: 'dashboard',    label: 'Dashboard',     icon: '📊' },
        { name: 'finance',      label: 'Keuangan',       icon: '💰' },
        { name: 'wallet',       label: 'Wallet',        icon: '👛' },
        { name: 'dapin-members', label: 'Anggota',      icon: '👥' },
        { name: 'dapin-savings', label: 'Simpanan',     icon: '🏦' },
        { name: 'dapin-loans',   label: 'Pinjaman',     icon: '📋' },
        { name: 'dapin-ledger',  label: 'Buku Besar',   icon: '📖' },
        { name: 'tools',        label: 'Kalkulator',    icon: '🧮' },
        { name: 'settings',     label: 'Pengaturan',    icon: '⚙️' },
      ];
    } else {
      return [
        { name: 'member-dashboard',  label: 'Beranda',         icon: '🏠' },
        { name: 'member-loans',      label: 'Pinjaman Saya',    icon: '📋' },
        { name: 'member-pay',        label: 'Bayar Angsuran',   icon: '💳' },
        { name: 'member-apply',      label: 'Ajukan Pinjaman',  icon: '📝' },
        { name: 'member-savings',    label: 'Simpanan Saya',    icon: '🏦' },
        { name: 'member-profile',    label: 'Profil',           icon: '👤' },
      ];
    }
  }

  function renderSidebar() {
    const s = Auth.current();
    const sidebar = UI.el('aside', { class: 'sidebar' });
    // brand
    sidebar.appendChild(UI.el('div', { class: 'sidebar-brand' }, [
      UI.el('span', { class: 'brand-logo' }, ['🏛️']),
      UI.el('div', {}, [
        UI.el('div', { class: 'brand-name' }, ['FINORA']),
        UI.el('div', { class: 'brand-sub' }, ['× DAPIN']),
      ]),
    ]));
    // role badge
    const roleLabel = s.role === 'admin' ? 'Administrator' : 'Anggota';
    const roleColor = s.role === 'admin' ? 'admin' : 'member';
    sidebar.appendChild(UI.el('div', { class: `sidebar-role role-${roleColor}` }, [
      UI.el('span', { class: 'role-badge' }, [s.role === 'admin' ? '🔧 ' + roleLabel : '👤 ' + roleLabel]),
      UI.el('span', { class: 'role-name' }, [s.name]),
    ]));
    // nav
    const nav = UI.el('nav', { class: 'sidebar-nav' });
    getMenu().forEach(item => {
      const a = UI.el('a', {
        class: 'nav-item' + (currentRoute === item.name ? ' active' : ''),
        onclick: () => go(item.name),
      }, [UI.el('span', { class: 'nav-icon' }, [item.icon]), UI.el('span', {}, [item.label])]);
      nav.appendChild(a);
    });
    sidebar.appendChild(nav);
    // logout
    sidebar.appendChild(UI.el('div', { class: 'sidebar-footer' }, [
      UI.btn('🚪 Keluar', () => { Auth.logout(); go('login'); }, { color: 'danger', size: 'sm' }),
    ]));
    return sidebar;
  }

  function renderTopbar() {
    const s = Auth.current();
    const bar = UI.el('header', { class: 'topbar' });
    bar.appendChild(UI.el('div', { class: 'topbar-title' }, [getPageTitle()]));
    const right = UI.el('div', { class: 'topbar-right' });
    // notifications
    const notifs = Store.getNotifications().filter(n => !n.read);
    const bell = UI.el('button', { class: 'topbar-btn', onclick: () => go(s.role === 'admin' ? 'settings' : 'member-profile') }, [
      '🔔',
      notifs.length > 0 ? UI.el('span', { class: 'notif-badge' }, [String(notifs.length)]) : null,
    ]);
    right.appendChild(bell);
    right.appendChild(UI.el('span', { class: 'topbar-user' }, [s.name]));
    bar.appendChild(right);
    return bar;
  }

  function getPageTitle() {
    const menu = getMenu();
    const item = menu.find(m => m.name === currentRoute);
    return item ? item.label : 'FINORA × DAPIN';
  }

  function render() {
    const root = document.getElementById('app');
    root.innerHTML = '';

    const s = Auth.current();
    if (!s || currentRoute === 'login') {
      currentRoute = 'login';
      root.appendChild(renderLogin());
      return;
    }

    // Guard: member trying to access admin routes
    const adminRoutes = ['dashboard','finance','wallet','dapin-members','dapin-savings','dapin-loans','dapin-ledger','tools','settings'];
    const memberRoutes = ['member-dashboard','member-loans','member-pay','member-apply','member-savings','member-profile'];
    if (s.role === 'member' && adminRoutes.includes(currentRoute)) {
      currentRoute = 'member-dashboard';
    }
    if (s.role === 'admin' && memberRoutes.includes(currentRoute)) {
      currentRoute = 'dashboard';
    }

    const layout = UI.el('div', { class: 'app-layout' });
    layout.appendChild(renderSidebar());
    const main = UI.el('div', { class: 'main-area' });
    main.appendChild(renderTopbar());
    const content = UI.el('div', { class: 'content-area' });

    const renderer = routes[currentRoute] || routes['dashboard'] || routes['member-dashboard'];
    if (renderer) {
      const r = renderer();
      if (r) content.appendChild(r);
    } else {
      content.appendChild(UI.emptyState('Halaman belum tersedia.'));
    }
    main.appendChild(content);
    layout.appendChild(main);
    root.appendChild(layout);
  }

  function renderLogin() {
    const wrap = UI.el('div', { class: 'login-screen' });
    const card = UI.el('div', { class: 'login-card' });
    // header
    card.appendChild(UI.el('div', { class: 'login-header' }, [
      UI.el('div', { class: 'login-logo' }, ['🏛️']),
      UI.el('h1', {}, ['FINORA × DAPIN']),
      UI.el('p', { class: 'login-sub' }, ['Modern Financial Management & Digital Lending']),
    ]));
    // panel selector
    const panelTabs = UI.el('div', { class: 'panel-tabs' });
    const adminTab = UI.el('button', { class: 'panel-tab active', dataset: { panel: 'admin' } }, ['🔧 Panel Admin']);
    const memberTab = UI.el('button', { class: 'panel-tab', dataset: { panel: 'member' } }, ['👤 Panel Anggota']);
    panelTabs.appendChild(adminTab);
    panelTabs.appendChild(memberTab);
    card.appendChild(panelTabs);

    // form
    const form = UI.el('div', { class: 'login-form' });
    const emailInput = UI.input('email', { placeholder: 'Email', id: 'login-email' });
    const passInput = UI.input('password', { placeholder: 'Password', id: 'login-password' });
    form.appendChild(UI.formField('Email', emailInput));
    form.appendChild(UI.formField('Password', passInput));
    const errBox = UI.el('div', { class: 'login-error', id: 'login-error' });
    form.appendChild(errBox);
    form.appendChild(UI.el('button', {
      class: 'btn btn-primary btn-block',
      onclick: () => doLogin(),
    }, ['Masuk']));
    card.appendChild(form);

    // quick accounts
    const demoBox = UI.el('div', { class: 'demo-accounts' });
    demoBox.appendChild(UI.el('p', { class: 'demo-title' }, ['Akun demo (klik untuk isi otomatis):']));
    const accountList = UI.el('div', { class: 'demo-list' });
    Auth.demoAccounts().forEach(a => {
      const item = UI.el('button', {
        class: 'demo-item' + (a.role === 'admin' ? ' demo-admin' : ' demo-member'),
        onclick: () => {
          emailInput.value = a.email;
          passInput.value = a.password;
          // switch tab to match role
          switchPanel(a.role);
        },
      }, [
        UI.el('span', { class: 'demo-role' }, [a.role === 'admin' ? '🔧 Admin' : '👤 Anggota']),
        UI.el('span', { class: 'demo-email' }, [a.email]),
      ]);
      accountList.appendChild(item);
    });
    demoBox.appendChild(accountList);
    card.appendChild(demoBox);

    // tab switching
    function switchPanel(panel) {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      const tab = panel === 'admin' ? adminTab : memberTab;
      tab.classList.add('active');
      card.className = 'login-card panel-' + panel;
    }
    adminTab.addEventListener('click', () => switchPanel('admin'));
    memberTab.addEventListener('click', () => switchPanel('member'));

    wrap.appendChild(card);

    function doLogin() {
      const email = emailInput.value.trim();
      const password = passInput.value;
      const result = Auth.login(email, password);
      if (!result.ok) {
        errBox.textContent = result.error;
        errBox.classList.add('show');
        return;
      }
      // route based on role
      currentRoute = result.session.role === 'admin' ? 'dashboard' : 'member-dashboard';
      render();
    }

    // enter key
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    return wrap;
  }

  function init() {
    Store.load();
    // register routes
    register('login', renderLogin);
    if (typeof ViewsFinance !== 'undefined') {
      register('dashboard', ViewsFinance.dashboard);
      register('finance', ViewsFinance.finance);
      register('wallet', ViewsFinance.wallet);
    }
    if (typeof ViewsDapin !== 'undefined') {
      register('dapin-members', ViewsDapin.members);
      register('dapin-savings', ViewsDapin.savings);
      register('dapin-loans', ViewsDapin.loans);
      register('dapin-ledger', ViewsDapin.ledger);
      // member routes
      register('member-dashboard', ViewsDapin.memberDashboard);
      register('member-loans', ViewsDapin.memberLoans);
      register('member-pay', ViewsDapin.memberPay);
      register('member-apply', ViewsDapin.memberApply);
      register('member-savings', ViewsDapin.memberSavings);
      register('member-profile', ViewsDapin.memberProfile);
    }
    if (typeof ViewsTools !== 'undefined') register('tools', ViewsTools.calc);
    if (typeof ViewsSystem !== 'undefined') register('settings', ViewsSystem.settings);

    const s = Auth.current();
    currentRoute = s ? (s.role === 'admin' ? 'dashboard' : 'member-dashboard') : 'login';
    render();
  }

  return { register, go, render, init, getMenu };
})();
