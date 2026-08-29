/* FINORA x DAPIN — Data Layer
   Default: localStorage adapter (demo mandiri, tanpa server).
   Produksi: ganti adapter dengan Supabase (Auth + PostgreSQL + RLS) tanpa mengubah logika.
*/
(function (root) {
  if (root.DB) return root.DB;
  var KEY = 'finora_dapin_db_v1';
  var adapter = (typeof localStorage !== 'undefined') ? localStorage : null;

  function setAdapter(a) { adapter = a; }
  function load() {
    if (!adapter) return null;
    try { var r = adapter.getItem(KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function save(db) { if (adapter) adapter.setItem(KEY, JSON.stringify(db)); }
  function clear() { if (adapter) adapter.removeItem(KEY); }
  function uid(p) { p = p || 'id'; return p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function nowISO() { return new Date().toISOString(); }
  function addMonths(dateStr, m) {
    var p = dateStr.split('-').map(Number); var dt = new Date(p[0], p[1] - 1 + m, p[2]);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function addDays(dateStr, n) { var dt = new Date(dateStr + 'T00:00:00'); dt.setDate(dt.getDate() + n); return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }

  root.DB = { KEY: KEY, setAdapter: setAdapter, load: load, save: save, clear: clear, uid: uid, today: today, nowISO: nowISO, addMonths: addMonths, addDays: addDays, daysBetween: daysBetween };
  return root.DB;
})(typeof window !== 'undefined' ? window : globalThis);
