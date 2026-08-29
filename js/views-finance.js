/**
 * FINORA × DAPIN — Finance Views (ADMIN ONLY)
 * Dashboard, Finance/Transactions, Wallet
 */
const ViewsFinance = {
  dashboard() {
    const frag = UI.el('div', { class: 'page' });
    // stat cards
    const stats = UI.el('div', { class: 'stat-grid' });
    stats.appendChild(UI.statCard('Saldo Total', Logic.formatCurrency(Logic.totalWalletBalance()), '👛', 'primary'));
    stats.appendChild(UI.statCard('Pinjaman Aktif', Logic.formatCurrency(Logic.totalOutstandingLoans()), '📋', 'warning'));
    stats.appendChild(UI.statCard('Total Simpanan', Logic.formatCurrency(Logic.totalSavingsAll()), '🏦', 'success'));
    stats.appendChild(UI.statCard('Jumlah Anggota', String(Logic.totalMembers()), '👥', 'info'));
    frag.appendChild(stats);

    // monthly summary
    const ms = Logic.monthlySummary();
    const msCard = UI.card('Ringkasan Bulan Ini', [
      UI.el('div', { class: 'stat-grid stat-grid-3' }, [
        UI.statCard('Pemasukan', Logic.formatCurrency(ms.income), '📈', 'success'),
        UI.statCard('Pengeluaran', Logic.formatCurrency(ms.expense), '📉', 'danger'),
        UI.statCard('Net', Logic.formatCurrency(ms.net), '⚖️', ms.net >= 0 ? 'primary' : 'danger'),
      ]),
    ]);
    frag.appendChild(msCard);

    // charts row
    const chartRow = UI.el('div', { class: 'chart-row' });
    // loan status donut
    const activeLoans = Logic.activeLoanCount();
    const paidLoans = Store.getLoans().filter(l => l.status === 'paid_off').length;
    chartRow.appendChild(UI.card('Status Pinjaman', Charts.donut([
      { label: 'Aktif', value: activeLoans },
      { label: 'Lunas', value: paidLoans },
    ], { legend: true, centerLabel: Store.getLoans().length + ' total' })));
    // recent transactions bar
    const recent = Store.getTransactions().slice(-6).reverse();
    chartRow.appendChild(UI.card('Transaksi Terbaru', Charts.bar(recent.map(t => ({
      label: t.date.slice(5),
      value: t.amount,
      color: t.type === 'income' ? '#22c55e' : '#ef4444',
    })), { w: 380 })));
    frag.appendChild(chartRow);

    // recent transactions table
    const txRows = Store.getTransactions().slice(-8).reverse().map(t => [
      Logic.formatDate(t.date),
      t.category,
      t.description,
      UI.el('span', { class: t.type === 'income' ? 'text-success' : 'text-danger' },
        [t.type === 'income' ? '+' : '−' + Logic.formatCurrency(t.amount)]),
    ]);
    frag.appendChild(UI.card('Transaksi Terbaru', UI.table(['Tanggal','Kategori','Deskripsi','Jumlah'], txRows)));
    return frag;
  },

  finance() {
    const frag = UI.el('div', { class: 'page' });
    // add transaction button
    const toolbar = UI.el('div', { class: 'page-toolbar' });
    toolbar.appendChild(UI.btn('➕ Tambah Transaksi', () => showTxForm(), { color: 'primary' }));
    frag.appendChild(toolbar);

    const txns = Store.getTransactions().slice().reverse();
    const rows = txns.map(t => [
      Logic.formatDate(t.date),
      t.type === 'income' ? UI.badge('Pemasukan', 'success') : UI.badge('Pengeluaran', 'danger'),
      t.category,
      t.description,
      Logic.formatCurrency(t.amount),
      UI.actionCell([
        { label: 'Hapus', onClick: () => { Store.deleteTransaction(t.id); UI.toast('Transaksi dihapus.', 'info'); App.render(); }, color: 'danger' },
      ]),
    ]);
    frag.appendChild(UI.card('Semua Transaksi', UI.table(['Tanggal','Tipe','Kategori','Deskripsi','Jumlah','Aksi'], rows)));
    return frag;

    function showTxForm() {
      const typeSel = UI.select([
        { value: 'income', label: 'Pemasukan' },
        { value: 'expense', label: 'Pengeluaran' },
      ]);
      const catInput = UI.input('text', { placeholder: 'Kategori' });
      const descInput = UI.input('text', { placeholder: 'Deskripsi' });
      const amtInput = UI.input('number', { placeholder: 'Jumlah (Rp)' });
      const walletSel = UI.select(Store.getWallets().map(w => ({ value: w.id, label: w.name })));
      const form = UI.el('div', { class: 'form-grid' });
      form.appendChild(UI.formField('Tipe', typeSel));
      form.appendChild(UI.formField('Kategori', catInput));
      form.appendChild(UI.formField('Deskripsi', descInput));
      form.appendChild(UI.formField('Jumlah', amtInput));
      form.appendChild(UI.formField('Wallet', walletSel));
      const m = UI.modal('Tambah Transaksi', form, () => App.render());
      m.querySelector('.modal').appendChild(UI.el('div', { class: 'modal-footer' }, [
        UI.btn('Simpan', () => {
          if (!catInput.value || !amtInput.value) { UI.toast('Lengkapi data.', 'error'); return; }
          Store.addTransaction({
            type: typeSel.value, category: catInput.value, description: descInput.value,
            amount: parseInt(amtInput.value), walletId: walletSel.value,
          });
          m.remove(); UI.toast('Transaksi ditambahkan.', 'success'); App.render();
        }, { color: 'primary' }),
      ]));
    }
  },

  wallet() {
    const frag = UI.el('div', { class: 'page' });
    const wallets = Store.getWallets();
    const grid = UI.el('div', { class: 'wallet-grid' });
    wallets.forEach(w => {
      const card = UI.el('div', { class: 'wallet-card' }, [
        UI.el('div', { class: 'wallet-icon' }, [w.type === 'bank' ? '🏦' : '💵']),
        UI.el('div', { class: 'wallet-name' }, [w.name]),
        UI.el('div', { class: 'wallet-balance' }, [Logic.formatCurrency(w.balance)]),
        UI.el('div', { class: 'wallet-type' }, [w.type.toUpperCase()]),
      ]);
      grid.appendChild(card);
    });
    frag.appendChild(grid);

    // transactions per wallet
    const txRows = Store.getTransactions().slice().reverse().map(t => [
      Logic.formatDate(t.date),
      Store.getWallet(t.walletId)?.name || '-',
      t.description,
      UI.el('span', { class: t.type === 'income' ? 'text-success' : 'text-danger' },
        [t.type === 'income' ? '+' : '−' + Logic.formatCurrency(t.amount)]),
    ]);
    frag.appendChild(UI.card('Mutasi Wallet', UI.table(['Tanggal','Wallet','Deskripsi','Jumlah'], txRows)));
    return frag;
  },
};
