/**
 * FINORA × DAPIN — Auth Layer
 * Two-panel login: Admin vs Anggota.
 * Admin  → full access (dashboard, finance, DAPIN management, settings)
 * Anggota → limited panel (view own savings/loans, pay installments, apply for loans)
 */
const Auth = (() => {
  const SESSION_KEY = 'finora_dapin_session';

  function login(email, password) {
    const user = Store.findUser(email, password);
    if (!user) return { ok: false, error: 'Email atau password salah.' };
    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      memberId: user.memberId,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    Store.addNotification({ type: 'info', title: 'Login berhasil', message: `${user.name} masuk sebagai ${user.role === 'admin' ? 'Administrator' : 'Anggota'}.` });
    return { ok: true, session };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function current() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function isAdmin() {
    const s = current();
    return s && s.role === 'admin';
  }

  function isMember() {
    const s = current();
    return s && s.role === 'member';
  }

  function requireAuth() {
    const s = current();
    if (!s) { App.go('login'); return false; }
    return true;
  }

  function requireAdmin() {
    if (!requireAuth()) return false;
    if (!isAdmin()) { App.go('member-dashboard'); return false; }
    return true;
  }

  /** All demo accounts for the login screen quick-fill */
  function demoAccounts() {
    return [
      { label: 'Administrator',  email: 'admin@finora.com', password: 'admin123',  role: 'admin'  },
      { label: 'Budi Santoso',   email: 'budi@finora.com',  password: 'member123', role: 'member' },
      { label: 'Siti Rahayu',    email: 'siti@finora.com',  password: 'member123', role: 'member' },
      { label: 'Agus Wijaya',    email: 'agus@finora.com',  password: 'member123', role: 'member' },
      { label: 'Dewi Lestari',   email: 'dewi@finora.com',  password: 'member123', role: 'member' },
      { label: 'Maya Putri',     email: 'maya@finora.com',  password: 'member123', role: 'member' },
    ];
  }

  return { login, logout, current, isAdmin, isMember, requireAuth, requireAdmin, demoAccounts };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Auth;
