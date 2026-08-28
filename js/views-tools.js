/* FINORA x DAPIN — Views: Tools (Financial, Loan, Savings Calculator) */
(function (root) {
  var UIK = root.UIK, LG = root.LG, CH = root.CH;
  var esc = UIK.esc, icon = UIK.icon, money = root.APP.money, fmt = UIK.fmt;
  var Pages = root.Pages;

  function calcShell(title, sub, formHTML, resultId, note) {
    return root.APP.pageHead(title, sub) +
      '<div class="grid-2 calc-grid"><div class="card"><form id="calcForm">' + formHTML + '</form></div>' +
      '<div class="card" id="' + resultId + '"><p class="muted pad">Isi parameter lalu hasil kalkulasi muncul di sini.</p></div></div>' +
      (note ? '<div class="card"><div class="card-t"><h3>Rumus</h3></div><p class="muted">' + note + '</p></div>' : '');
  }

  /* ---------- Financial Calculator ---------- */
  Pages.finCalc = function () {
    return calcShell('Financial Calculator', 'Hitung bunga sederhana, majemuk, dan target tabungan',
      UIK.field('Jenis Perhitungan', UIK.select('mode', [
        { v: 'simple', l: 'Bunga Sederhana' }, { v: 'compound', l: 'Bunga Majemuk' }, { v: 'target', l: 'Target Tabungan' }
      ], 'simple')) +
      UIK.field('Modal Awal (Rp)', UIK.input('principal', '10000000', '0', 'number')) +
      '<div class="frow">' + UIK.field('Suku Bunga (% per tahun)', UIK.input('rate', '6', '6', 'number')) + UIK.field('Periode (tahun)', UIK.input('years', '5', '5', 'number')) + '</div>' +
      '<div id="targetField" class="field hidden">' + UIK.field('Setoran per Bulan (Rp)', UIK.input('monthly', '500000', '0', 'number')) + '</div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-primary" id="calcBtn">Hitung</button></div>',
      'finResult',
      'Bunga sederhana: Bunga = P × r × t. Bunga majemuk: A = P(1 + r/n)^(nt). Target tabungan: nilai masa depan dari seri setoran bulanan.');
  };
  Pages._bind_finCalc = function () {
    var form = document.getElementById('calcForm');
    function toggleTarget() {
      var m = form.elements.mode.value;
      document.getElementById('targetField').classList.toggle('hidden', m !== 'target');
    }
    form.elements.mode.addEventListener('change', toggleTarget);
    document.getElementById('calcBtn').onclick = function () {
      var d = UIK.formdata(form);
      var P = Number(d.principal) || 0, r = (Number(d.rate) || 0) / 100, t = Number(d.years) || 0;
      var box = document.getElementById('finResult');
      if (d.mode === 'simple') {
        var interest = P * r * t;
        box.innerHTML = '<div class="kpis mini">' + card('Modal', money(P), 'k-primary') + card('Bunga Diterima', money(interest), 'k-orange') + card('Total Akhir', money(P + interest), 'k-green') + '</div>';
      } else if (d.mode === 'compound') {
        var A = P * Math.pow(1 + r, t);
        box.innerHTML = '<div class="kpis mini">' + card('Modal', money(P), 'k-primary') + card('Bunga Majemuk', money(A - P), 'k-orange') + card('Total Akhir', money(A), 'k-green') + '</div>';
      } else {
        var pm = Number(d.monthly) || 0;
        var mr = r / 12, n = t * 12;
        var fv = pm * ((Math.pow(1 + mr, n) - 1) / mr) + P * Math.pow(1 + mr, n);
        box.innerHTML = '<div class="kpis mini">' + card('Total Setoran', money(pm * n), 'k-primary') + card('Bunga Diperoleh', money(fv - pm * n), 'k-orange') + card('Nilai Akhir', money(fv), 'k-green') + '</div>';
      }
    };
  };

  /* ---------- Loan Calculator ---------- */
  Pages.loanCalc = function () {
    return calcShell('Loan Calculator', 'Simulasikan pinjaman — flat atau anuitas — dengan jadwal angsuran lengkap',
      UIK.field('Metode Bunga', UIK.select('method', [{ v: 'flat', l: 'Flat (per bulan)' }, { v: 'annuity', l: 'Anuitas (per tahun)' }], 'annuity')) +
      '<div class="frow">' + UIK.field('Pokok (Rp)', UIK.input('principal', '10000000', '0', 'number')) + UIK.field('Tenor (bulan)', UIK.input('tenor', '12', '12', 'number')) + '</div>' +
      '<div class="frow">' + UIK.field('Suku Bunga (%)', UIK.input('rate', '12', '12', 'number')) + UIK.field('Tanggal Mulai', UIK.input('startDate', DB.today(), '', 'date')) + '</div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-primary" id="lcBtn">Simulasikan</button></div>',
      'loanResult',
      'Flat: bunga = pokok × rate% setiap bulan, pokok dibagi rata. Anuitas: A = P·r(1+r)^n/((1+r)^n−1), r = rate/12.');
  };
  Pages._bind_loanCalc = function () {
    document.getElementById('lcBtn').onclick = function () {
      var d = UIK.formdata(document.getElementById('calcForm'));
      var P = Number(d.principal), te = Number(d.tenor), ra = Number(d.rate);
      var box = document.getElementById('loanResult');
      if (!P || !te || ra == null) { box.innerHTML = '<p class="neg">Lengkapi pokok, tenor, dan bunga.</p>'; return; }
      if (te < 1 || te > 120) { box.innerHTML = '<p class="neg">Tenor harus 1–120 bulan.</p>'; return; }
      var rows = LG.buildSchedule(d.method, P, ra, te, d.startDate || DB.today());
      var t = LG.loanTotals(rows);
      box.innerHTML = '<div class="kpis mini">' + card('Total Bunga', money(t.interestTotal), 'k-orange') + card('Total Bayar', money(t.totalPayment), 'k-violet') + card('Angsuran/Bulan', money(t.installment), 'k-green') + '</div>' +
        '<div class="table-wrap hint-scroll"><table class="compact"><thead><tr><th>#</th><th>Jatuh Tempo</th><th>Pokok</th><th>Bunga</th><th>Total</th><th>Sisa</th></tr></thead><tbody>' +
        (function () { var acc = 0; var totalPay = t.totalPayment; return rows.map(function (r) { acc += r.total; return '<tr><td>' + r.n + '</td><td>' + fmt.date(r.dueDate) + '</td><td>' + money(r.principal) + '</td><td>' + money(r.interest) + '</td><td>' + money(r.total) + '</td><td>' + money(Math.max(0, totalPay - acc)) + '</td></tr>'; }).join(''); })() +
        '</tbody></table></div>';
    };
  };

  /* ---------- Savings Calculator ---------- */
  Pages.savCalc = function () {
    return calcShell('Savings Calculator', 'Proyeksikan pertumbuhan tabungan DAPIN Anda',
      UIK.field('Saldo Awal (Rp)', UIK.input('principal', '1000000', '0', 'number')) +
      '<div class="frow">' + UIK.field('Setoran per Bulan (Rp)', UIK.input('monthly', '200000', '0', 'number')) + UIK.field('Bunga Simpanan (% per tahun)', UIK.input('rate', '3', '3', 'number')) + '</div>' +
      UIK.field('Lama Menabung (tahun)', UIK.input('years', '5', '5', 'number')) +
      '<div class="modal-actions"><button type="button" class="btn btn-primary" id="scBtn">Proyeksikan</button></div>',
      'savResult',
      'Nilai akhir tabungan = setoran berulang + bunga majemuk tahunan.');
  };
  Pages._bind_savCalc = function () {
    document.getElementById('scBtn').onclick = function () {
      var d = UIK.formdata(document.getElementById('calcForm'));
      var P = Number(d.principal) || 0, pm = Number(d.monthly) || 0, r = (Number(d.rate) || 0) / 100, t = Number(d.years) || 0;
      var months = t * 12, mr = r / 12;
      var fv = pm * (Math.pow(1 + mr, months) - 1) / mr + P * Math.pow(1 + mr, months);
      var series = []; var bal = P; var run = 0;
      for (var i = 1; i <= t; i++) {
        for (var m = 0; m < 12; m++) { bal = bal * (1 + mr) + pm; }
        series.push(Math.round(bal));
      }
      var labels = []; var yy = new Date().getFullYear(); for (var k = 1; k <= t; k++) labels.push(String(yy + k));
      document.getElementById('savResult').innerHTML = '<div class="kpis mini">' + card('Total Setoran', money(P + pm * months), 'k-primary') + card('Bunga', money(fv - (P + pm * months)), 'k-orange') + card('Proyeksi Akhir', money(fv), 'k-green') + '</div>' +
        CH.line({ labels: labels, series: [{ name: 'Saldo', data: series, color: CH.C.dapin }] });
    };
  };

  function card(label, value, cls) {
    return '<div class="kpi card ' + cls + '"><div class="kpi-ic">' + icon('calc') + '</div><div><div class="kpi-label">' + esc(label) + '</div><div class="kpi-value">' + value + '</div></div></div>';
  }
})(typeof window !== 'undefined' ? window : globalThis);
