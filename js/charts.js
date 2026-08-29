/* FINORA x DAPIN — Lightweight SVG charts (no external libs) */
(function (root) {
  if (root.CH) return root.CH;
  var C = {
    primary: '#5b7cfa', violet: '#8b5cf6', dapin: '#10b981', income: '#22c55e',
    expense: '#ef4444', warn: '#f59e0b', cyan: '#22d3ee', pink: '#f472b6', grid: 'rgba(255,255,255,.07)', text: '#93a0bd'
  };
  function fmtShort(n) {
    if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace('.0', '') + ' M';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' jt';
    if (n >= 1000) return (n / 1000).toFixed(0) + ' rb';
    return String(n);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  /* Line / area chart: cfg = {labels:[], series:[{name,data,color}], height, money} */
  function line(cfg) {
    var W = 640, H = cfg.height || 280, padL = 62, padR = 16, padT = 18, padB = 34;
    var iw = W - padL - padR, ih = H - padT - padB;
    var max = 0; cfg.series.forEach(function (s) { s.data.forEach(function (v) { if (v > max) max = v; }); });
    if (max === 0) max = 1; max = max * 1.15;
    function X(i) { return padL + (cfg.labels.length <= 1 ? iw / 2 : iw * i / (cfg.labels.length - 1)); }
    function Y(v) { return padT + ih - (v / max) * ih; }
    var ticks = 4, g = '';
    for (var t = 0; t <= ticks; t++) {
      var val = max * t / ticks, y = padT + ih - ih * t / ticks;
      g += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="' + C.grid + '" stroke-width="1"/>';
      g += '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="' + C.text + '">' + fmtShort(val) + '</text>';
    }
    cfg.labels.forEach(function (lb, i) {
      g += '<text x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="' + C.text + '">' + esc(lb) + '</text>';
    });
    var pathS = '';
    cfg.series.forEach(function (s) {
      var d = s.data.map(function (v, i) { return (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
      var area = d + ' L' + X(s.data.length - 1).toFixed(1) + ' ' + (padT + ih) + ' L' + padL + ' ' + (padT + ih) + ' Z';
      var gid = 'g' + Math.random().toString(36).slice(2, 8);
      pathS += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + s.color + '" stop-opacity=".28"/><stop offset="100%" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient></defs>';
      pathS += '<path d="' + area + '" fill="url(#' + gid + ')"/>';
      pathS += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
      s.data.forEach(function (v, i) { if (v > 0) pathS += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="3" fill="' + s.color + '"/>'; });
    });
    var leg = cfg.series.map(function (s) {
      return '<span class="legend"><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>';
    }).join('');
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto">' + pathS + g + '</svg><div class="chart-legend">' + leg + '</div></div>';
  }

  /* Vertical grouped bar chart: cfg={labels, series:[{name,data,color}]} */
  function bar(cfg) {
    var W = 640, H = cfg.height || 280, padL = 62, padR = 16, padT = 18, padB = 34;
    var iw = W - padL - padR, ih = H - padT - padB;
    var max = 0; cfg.series.forEach(function (s) { s.data.forEach(function (v) { if (v > max) max = v; }); });
    if (max === 0) max = 1; max *= 1.15;
    var n = cfg.labels.length, slot = iw / n, bw = slot * 0.62 / cfg.series.length;
    var g = '';
    for (var t = 0; t <= 4; t++) {
      var val = max * t / 4, y = padT + ih - ih * t / 4;
      g += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="' + C.grid + '" stroke-width="1"/>';
      g += '<text x="' + (padL - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="' + C.text + '">' + fmtShort(val) + '</text>';
    }
    cfg.labels.forEach(function (lb, i) {
      g += '<text x="' + (padL + slot * i + slot / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="' + C.text + '">' + esc(lb) + '</text>';
      cfg.series.forEach(function (s, si) {
        var v = s.data[i];
        var bh = (v / max) * ih;
        var x = padL + slot * i + slot / 2 - (bw * cfg.series.length) / 2 + si * bw;
        var y = padT + ih - bh;
        g += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.82).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4" fill="' + s.color + '" opacity=".92"><title>' + esc(lb + ': ' + s.name + ' ' + fmtShort(v)) + '</title></rect>';
      });
    });
    var leg = cfg.series.map(function (s) { return '<span class="legend"><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>'; }).join('');
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto">' + g + '</svg><div class="chart-legend">' + leg + '</div></div>';
  }

  /* Donut: cfg={items:[{label,value,color}], center} */
  function donut(cfg) {
    var W = 260, H = 240, cx = 130, cy = 118, r = 78, sw = 26;
    var Cc = 2 * Math.PI * r;
    var total = cfg.items.reduce(function (s, x) { return s + x.value; }, 0) || 1;
    var off = 0, g = '';
    cfg.items.forEach(function (it) {
      var len = it.value / total * Cc;
      g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + it.color + '" stroke-width="' + sw + '" stroke-dasharray="' + len.toFixed(1) + ' ' + (Cc - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"><title>' + esc(it.label + ' ' + fmtShort(it.value)) + '</title></circle>';
      off += len;
    });
    g += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="17" font-weight="700" fill="#e8ecf8">' + fmtShort(total) + '</text>';
    g += '<text x="' + cx + '" y="' + (cy + 18) + '" text-anchor="middle" font-size="11" fill="' + C.text + '">' + esc(cfg.center || 'Total') + '</text>';
    var leg = cfg.items.map(function (it) {
      return '<div class="donut-leg"><span class="legend"><i style="background:' + it.color + '"></i>' + esc(it.label) + '</span><b>' + fmtShort(it.value) + '</b></div>';
    }).join('');
    return '<div class="donut-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:250px;height:auto">' + g + '</svg><div class="donut-legend">' + leg + '</div></div>';
  }

  /* Horizontal progress bars */
  function hbars(items) {
    return '<div class="hbars">' + items.map(function (it) {
      var pct = Math.min(100, Math.round(it.pct || 0));
      var tone = it.tone || '';
      return '<div class="hbar"><div class="hbar-top"><span>' + esc(it.label) + '</span><b>' + esc(it.right != null ? it.right : fmtShort(it.value)) + '</b></div><div class="hbar-track"><div class="hbar-fill ' + tone + '" style="width:' + pct + '%"></div></div></div>';
    }).join('') + '</div>';
  }

  root.CH = { C: C, line: line, bar: bar, donut: donut, hbars: hbars, fmtShort: fmtShort };
  return root.CH;
})(typeof window !== 'undefined' ? window : globalThis);
