/* FINORA x DAPIN — Auth (demo: verifikasi lokal; produksi: Supabase Auth + RLS) */
(function (root) {
  if (root.AUTH) return root.AUTH;
  var SKEY = 'finora_session_v1';

  function session() { try { var s = JSON.parse(localStorage.getItem(SKEY)); return s; } catch (e) { return null; } }
  function login(email, pass) {
    var db = DB.load();
    if (!db) return { ok: false, error: 'Database belum tersedia. Muat ulang halaman.' };
    var u = db.users.find(function (x) { return x.email.toLowerCase() === String(email || '').toLowerCase().trim() && x.password === String(pass || ''); });
    if (!u) return { ok: false, error: 'Email atau password salah.' };
    var s = { userId: u.id, name: u.name, email: u.email, role: u.role, loggedAt: new Date().toISOString() };
    localStorage.setItem(SKEY, JSON.stringify(s));
    LG.addAudit(db, u.id, 'User login', 'user', u.id, {});
    DB.save(db);
    return { ok: true, session: s };
  }
  function register(name, email, pass) {
    var db = DB.load();
    if (!name || !email || !pass) return { ok: false, error: 'Lengkapi nama, email, dan password.' };
    if (String(pass).length < 6) return { ok: false, error: 'Password minimal 6 karakter.' };
    email = String(email).toLowerCase().trim();
    if (db.users.some(function (x) { return x.email === email; })) return { ok: false, error: 'Email sudah terdaftar.' };
    var id = 'U' + (db.users.length + 1);
    db.users.push({ id: id, name: String(name).trim(), email: email, password: String(pass), role: 'USER' });
    db.profiles.push({ id: 'P' + id, user_id: id, full_name: String(name).trim(), phone: '', company: '' });
    LG.addAudit(db, id, 'User registered', 'user', id, { email: email });
    DB.save(db);
    return login(email, pass);
  }
  function logout() {
    var db = DB.load(); var s = session();
    if (db && s) { LG.addAudit(db, s.userId, 'User logout', 'user', s.userId, {}); DB.save(db); }
    localStorage.removeItem(SKEY);
  }
  function can(role, needed) { return needed === '*' || role === 'SUPER_ADMIN' || role === 'ADMIN' || role === needed; }
  root.AUTH = { session: session, login: login, register: register, logout: logout, can: can };
  return root.AUTH;
})(typeof window !== 'undefined' ? window : globalThis);
