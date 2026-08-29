/**
 * FINORA × DAPIN — UI Component Library
 */
const UI = {
  el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => e.dataset[dk] = dv);
      else e.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else e.appendChild(c);
    });
    return e;
  },

  card(title, content, opts = {}) {
    const card = UI.el('div', { class: 'card' + (opts.class ? ' ' + opts.class : '') });
    if (title) card.appendChild(UI.el('div', { class: 'card-header' }, [UI.el('h3', {}, [title])]));
    const body = UI.el('div', { class: 'card-body' });
    if (typeof content === 'string') body.innerHTML = content;
    else if (Array.isArray(content)) content.forEach(c => { if (c) body.appendChild(c); });
    else if (content) body.appendChild(content);
    card.appendChild(body);
    return card;
  },

  statCard(label, value, icon, color = 'primary') {
    return UI.el('div', { class: `stat-card stat-${color}` }, [
      UI.el('div', { class: 'stat-icon' }, [icon || '📊']),
      UI.el('div', { class: 'stat-info' }, [
        UI.el('div', { class: 'stat-value' }, [value]),
        UI.el('div', { class: 'stat-label' }, [label]),
      ]),
    ]);
  },

  btn(label, onClick, opts = {}) {
    const b = UI.el('button', {
      class: 'btn btn-' + (opts.color || 'primary') + (opts.size ? ' btn-' + opts.size : ''),
      onclick: onClick,
    }, [label]);
    if (opts.icon) b.prepend(document.createTextNode(opts.icon + ' '));
    return b;
  },

  table(headers, rows, opts = {}) {
    const wrap = UI.el('div', { class: 'table-wrap' });
    const table = UI.el('table', { class: 'data-table' });
    const thead = UI.el('thead', {}, [UI.el('tr', {}, headers.map(h => UI.el('th', {}, [h])))]);
    table.appendChild(thead);
    const tbody = UI.el('tbody');
    if (rows.length === 0) {
      tbody.appendChild(UI.el('tr', {}, [UI.el('td', { class: 'empty-row', colspan: headers.length }, ['Tidak ada data.'])]));
    } else {
      rows.forEach(row => {
        const tr = UI.el('tr', {});
        row.forEach(cell => {
          if (cell && cell.__action) {
            const td = UI.el('td', { class: 'action-cell' });
            cell.__action.forEach(a => td.appendChild(UI.btn(a.label, a.onClick, { color: a.color || 'primary', size: 'sm' })));
            tr.appendChild(td);
          } else {
            tr.appendChild(UI.el('td', {}, [cell == null ? '' : cell]));
          }
        });
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  },

  actionCell(actions) {
    return { __action: actions };
  },

  formField(label, inputEl, opts = {}) {
    const field = UI.el('div', { class: 'form-field' + (opts.full ? ' form-full' : '') });
    if (label) field.appendChild(UI.el('label', {}, [label]));
    field.appendChild(inputEl);
    return field;
  },

  input(type = 'text', opts = {}) {
    const i = UI.el('input', { type, class: 'form-input' });
    if (opts.value) i.value = opts.value;
    if (opts.placeholder) i.placeholder = opts.placeholder;
    if (opts.id) i.id = opts.id;
    return i;
  },

  select(options, opts = {}) {
    const s = UI.el('select', { class: 'form-input' });
    options.forEach(o => {
      const opt = UI.el('option', { value: o.value }, [o.label]);
      s.appendChild(opt);
    });
    if (opts.value) s.value = opts.value;
    return s;
  },

  modal(title, content, onClose) {
    const overlay = UI.el('div', { class: 'modal-overlay' });
    const modal = UI.el('div', { class: 'modal' });
    modal.appendChild(UI.el('div', { class: 'modal-header' }, [
      UI.el('h3', {}, [title]),
      UI.el('button', { class: 'modal-close', onclick: () => { overlay.remove(); if (onClose) onClose(); } }, ['×']),
    ]));
    const body = UI.el('div', { class: 'modal-body' });
    if (typeof content === 'string') body.innerHTML = content;
    else body.appendChild(content);
    modal.appendChild(body);
    overlay.appendChild(modal);
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); if (onClose) onClose(); } });
    return overlay;
  },

  toast(message, type = 'info') {
    const t = UI.el('div', { class: `toast toast-${type}` }, [message]);
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  emptyState(message, icon = '📭') {
    return UI.el('div', { class: 'empty-state' }, [
      UI.el('div', { class: 'empty-icon' }, [icon]),
      UI.el('p', {}, [message]),
    ]);
  },

  badge(text, color = 'primary') {
    return UI.el('span', { class: `badge badge-${color}` }, [text]);
  },

  progress(percent) {
    const wrap = UI.el('div', { class: 'progress-bar' });
    const fill = UI.el('div', { class: 'progress-fill', style: `width:${Math.min(100, Math.max(0, percent))}%` });
    wrap.appendChild(fill);
    return wrap;
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = UI;
