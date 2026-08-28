/* FINORA x DAPIN — DOM smoke test (Node + jsdom): boot, login, render seluruh halaman */
'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const w = dom.window;
w.scrollTo = function () {};
w.matchMedia = w.matchMedia || function () { return { matches: false, addListener: function () {}, removeListener: function () {} }; };
global.window = w; global.document = w.document; global.localStorage = w.localStorage;

const files = ['js/data.js', 'js/charts.js', 'js/logic.js', 'js/ui.js', 'js/auth.js', 'js/seed.js', 'js/app-core.js', 'js/views-finance.js', 'js/views-dapin.js', 'js/views-tools.js', 'js/views-system.js'];
for (const f of files) w.eval(fs.readFileSync('/home/user/finora-dapin/' + f, 'utf8'));

w.bindPage = function (key, param) { var fn = (w.Pages || {})['_bind_' + key]; if (fn) fn(param); };
w.APP._bindPage = w.bindPage;

w.APP.boot();
var res = w.AUTH.login('admin@finora.app', 'admin123');
if (!res.ok) { console.error('LOGIN FAIL', res.error); process.exit(1); }
console.log('  PASS login admin@finora.app (role SUPER_ADMIN)');
w.APP.boot(); /* re-render shell setelah login */

function nav(path) { w.location.hash = '#' + path; w.dispatchEvent(new w.Event('hashchange')); }

const pages = ['dashboard', 'finance/transactions', 'finance/wallet', 'finance/budget', 'finance/analytics', 'finance/reports', 'dapin', 'dapin/members', 'dapin/savings', 'dapin/loans', 'dapin/installments', 'dapin/payments', 'dapin/due-dates', 'dapin/ledger', 'dapin/reports', 'tools/financial-calculator', 'tools/loan-calculator', 'tools/savings-calculator', 'system/notifications', 'system/profile', 'system/settings', 'system/audit-logs'];
let fails = 0;
for (const p of pages) {
  nav(p);
  const view = w.document.getElementById('view');
  const html = view ? view.innerHTML : '';
  const ok = html && html.length > 80 && html.indexOf('Gagal memuat halaman') === -1;
  console.log((ok ? '  PASS ' : '  FAIL ') + '/' + p + ' (' + (html ? html.length : 0) + ' chars)');
  if (!ok) fails++;
}
const db = w.APP.getDB();
const mid = db.dapin_members[0].id;
nav('dapin/members/' + mid);
let html = w.document.getElementById('view').innerHTML;
let ok = html && html.length > 200 && html.indexOf('Gagal memuat halaman') === -1;
console.log((ok ? '  PASS ' : '  FAIL ') + '/dapin/members/[id]');
if (!ok) fails++;

/* global search */
w.document.getElementById('searchBtn').click();
const gs = w.document.getElementById('gSearch'); gs.value = 'Budi';
gs.dispatchEvent(new w.Event('input'));
const gr = w.document.getElementById('gResults').innerHTML;
console.log((gr.indexOf('Budi') !== -1 ? '  PASS ' : '  FAIL ') + 'global search "Budi"');
if (gr.indexOf('Budi') === -1) fails++;
w.document.getElementById('gClose').click();

/* admin dapat membuka Audit Logs */
nav('system/audit-logs');
html = w.document.getElementById('view').innerHTML;
ok = html.indexOf('Audit Logs') !== -1;
console.log((ok ? '  PASS ' : '  FAIL ') + 'admin membuka Audit Logs');
if (!ok) fails++;

/* login sebagai USER → Audit Logs harus diblokir */
w.AUTH.logout();
var lres = w.AUTH.login('user@finora.app', 'user123');
if (!lres.ok) { console.error('LOGIN USER FAIL', lres.error); process.exit(1); }
w.APP.boot();
nav('system/audit-logs');
html = w.document.getElementById('view').innerHTML;
ok = html.indexOf('Akses dibatasi') !== -1;
console.log((ok ? '  PASS ' : '  FAIL ') + 'role guard: USER diblokir dari Audit Logs');
if (!ok) fails++;
nav('dashboard');
html = w.document.getElementById('view').innerHTML;
ok = html.indexOf('Total Balance') !== -1;
console.log((ok ? '  PASS ' : '  FAIL ') + 'USER tetap dapat membuka Dashboard/Finance');
if (!ok) fails++;

const f = w.LG.financeTotals(db);
console.log('  INFO balance=' + f.balance + ' income=' + f.income + ' expense=' + f.expense + ' savings=' + f.savings + ' outstanding=' + f.outstanding);
console.log('');
if (fails === 0) { console.log('DOM SMOKE TESTS PASSED (' + pages.length + ' halaman)'); process.exit(0); }
else { console.error(fails + ' DOM TEST(S) FAILED'); process.exit(1); }
