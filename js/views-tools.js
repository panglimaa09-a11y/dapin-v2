/**
 * FINORA × DAPIN — Tools (Kalkulator)
 */
const ViewsTools = {
  calc() {
    const frag = UI.el('div', { class: 'page' });
    frag.appendChild(UI.el('h2', { class: 'page-title' }, ['🧮 Kalkulator Pinjaman']));

    const prinI = UI.input('number', { placeholder: 'Pokok (Rp)', value: '5000000' });
    const rateI = UI.input('number', { placeholder: 'Bunga %/tahun', value: '12' });
    const termI = UI.input('number', { placeholder: 'Tenor (bulan)', value: '10' });
    const typeSel = UI.select([{ value: 'anuitas', label: 'Anuitas' }, { value: 'flat', label: 'Flat' }]);

    const form = UI.el('div', { class: 'form-grid form-wide' });
    form.appendChild(UI.formField('Pokok Pinjaman', prinI));
    form.appendChild(UI.formField('Bunga (%/tahun)', rateI));
    form.appendChild(UI.formField('Tenor (bulan)', termI));
    form.appendChild(UI.formField('Tipe Bunga', typeSel));
    frag.appendChild(UI.card('Input', form));

    const resultDiv = UI.el('div', { id: 'calc-result' });
    frag.appendChild(resultDiv);

    function calculate() {
      const p = parseInt(prinI.value) || 0;
      const r = parseFloat(rateI.value) || 0;
      const t = parseInt(termI.value) || 0;
      if (p <= 0 || t <= 0) { resultDiv.innerHTML = ''; return; }
      const schedule = Logic.generateSchedule(p, r, t, typeSel.value);
      const monthly = schedule[0]?.payment || 0;
      const total = schedule.reduce((s, i) => s + i.payment, 0);
      const interest = total - p;

      const summary = UI.el('div', { class: 'stat-grid stat-grid-4' });
      summary.appendChild(UI.statCard('Cicilan/Bonth', Logic.formatCurrency(monthly), '💰', 'primary'));
      summary.appendChild(UI.statCard('Total Bunga', Logic.formatCurrency(interest), '📈', 'warning'));
      summary.appendChild(UI.statCard('Total Bayar', Logic.formatCurrency(total), '🔢', 'info'));
      summary.appendChild(UI.statCard('Pokok', Logic.formatCurrency(p), '🏛️', 'success'));

      const rows = schedule.map(i => [
        i.number,
        Logic.formatCurrency(i.principal),
        Logic.formatCurrency(i.interest),
        Logic.formatCurrency(i.payment),
        Logic.formatDate(i.dueDate),
        Logic.formatCurrency(i.balance),
      ]);
      resultDiv.innerHTML = '';
      resultDiv.appendChild(summary);
      resultDiv.appendChild(UI.card('Jadwal Angsuran', UI.table(['#','Pokok','Bunga','Cicilan','Jatuh Tempo','Sisa Pokok'], rows)));
    }
    [prinI, rateI, termI].forEach(i => i.addEventListener('input', calculate));
    typeSel.addEventListener('change', calculate);
    calculate();
    return frag;
  },
};
