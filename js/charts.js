/**
 * FINORA × DAPIN — Charts (lightweight SVG-based)
 */
const Charts = {
  svg(w, h) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', w);
    s.setAttribute('height', h);
    s.setAttribute('viewBox', `0 0 ${w} ${h}`);
    return s;
  },

  donut(data, opts = {}) {
    const w = opts.w || 200, h = opts.h || 200, r = 70, cx = w/2, cy = h/2;
    const svg = Charts.svg(w, h);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#2a3548'); c.setAttribute('stroke-width', 24);
      svg.appendChild(c);
      return svg;
    }
    let angle = -Math.PI / 2;
    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];
    data.forEach((d, i) => {
      const frac = d.value / total;
      const end = angle + frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      const large = frac > 0.5 ? 1 : 0;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', colors[i % colors.length]);
      path.setAttribute('stroke-width', 24);
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
      angle = end;
    });
    // center text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx); text.setAttribute('y', cy + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#e2e8f0');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', '600');
    text.textContent = opts.centerLabel || '';
    svg.appendChild(text);
    // legend
    if (opts.legend) {
      const legend = UI.el('div', { class: 'chart-legend' });
      data.forEach((d, i) => {
        legend.appendChild(UI.el('div', { class: 'legend-item' }, [
          UI.el('span', { class: 'legend-dot', style: `background:${colors[i % colors.length]}` }),
          UI.el('span', {}, [`${d.label}: ${Logic.formatCurrency(d.value)}`]),
        ]));
      });
      const wrap = UI.el('div', { class: 'chart-with-legend' });
      wrap.appendChild(svg);
      wrap.appendChild(legend);
      return wrap;
    }
    return svg;
  },

  bar(data, opts = {}) {
    const w = opts.w || 400, h = opts.h || 200;
    const svg = Charts.svg(w, h);
    const padding = 30;
    const barW = (w - padding * 2) / data.length * 0.6;
    const gap = (w - padding * 2) / data.length;
    const max = Math.max(...data.map(d => d.value), 1);
    data.forEach((d, i) => {
      const bh = (d.value / max) * (h - padding * 2);
      const x = padding + i * gap + gap * 0.2;
      const y = h - padding - bh;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', barW); rect.setAttribute('height', bh);
      rect.setAttribute('rx', 4);
      rect.setAttribute('fill', d.color || '#6366f1');
      svg.appendChild(rect);
      // label
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', x + barW/2); lbl.setAttribute('y', h - padding + 14);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('fill', '#94a3b8');
      lbl.setAttribute('font-size', '10');
      lbl.textContent = d.label;
      svg.appendChild(lbl);
    });
    return svg;
  },

  line(data, opts = {}) {
    const w = opts.w || 400, h = opts.h || 200;
    const svg = Charts.svg(w, h);
    const padding = 30;
    const max = Math.max(...data.map(d => d.value), 1);
    const stepX = (w - padding * 2) / Math.max(1, data.length - 1);
    let pathD = '';
    data.forEach((d, i) => {
      const x = padding + i * stepX;
      const y = h - padding - (d.value / max) * (h - padding * 2);
      pathD += (i === 0 ? 'M' : 'L') + ` ${x} ${y} `;
    });
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#6366f1');
    path.setAttribute('stroke-width', 2);
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    // dots
    data.forEach((d, i) => {
      const x = padding + i * stepX;
      const y = h - padding - (d.value / max) * (h - padding * 2);
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 3);
      c.setAttribute('fill', '#6366f1');
      svg.appendChild(c);
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', x); lbl.setAttribute('y', h - padding + 14);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('fill', '#94a3b8');
      lbl.setAttribute('font-size', '9');
      lbl.textContent = d.label;
      svg.appendChild(lbl);
    });
    return svg;
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = Charts;
