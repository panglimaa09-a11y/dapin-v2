/**
 * FINORA × DAPIN — System/Settings (ADMIN)
 */
const ViewsSystem = {
  settings() {
    const frag = UI.el('div', { class: 'page' });
    frag.appendChild(UI.el('h2', { class: 'page-title' }, ['⚙️ Pengaturan Sistem']));

    // data management
    const dataCard = UI.el('div', { class: 'settings-section' });
    dataCard.appendChild(UI.el('h3', {}, ['Manajemen Data']));
    dataCard.appendChild(UI.el('p', { class: 'muted' }, ['Reset semua data ke kondisi awal (data demo). Tindakan ini tidak dapat dibatalkan.']));
    dataCard.appendChild(UI.btn('🔄 Reset Data Demo', () => {
      if (confirm('Yakin reset semua data ke demo? Semua perubahan akan hilang.')) {
        Store.reset();
        Store.addNotification({ type: 'info', title: 'Data direset', message: 'Semua data dikembalikan ke kondisi demo.' });
        UI.toast('Data direset ke demo.', 'success');
        App.render();
      }
    }, { color: 'warning' }));
    frag.appendChild(UI.card('Manajemen Data', dataCard));

    // notifications
    const notifs = Store.getNotifications();
    const nRows = notifs.map(n => [
      Logic.formatDate(n.date),
      UI.badge(n.type, n.type === 'success' ? 'success' : n.type === 'info' ? 'info' : 'warning'),
      n.title + ' — ' + n.message,
      n.read ? UI.badge('Dibaca', 'info') : UI.badge('Baru', 'danger'),
    ]);
    frag.appendChild(UI.card('Notifikasi', [UI.table(['Tanggal','Tipe','Pesan','Status'], nRows),
      UI.btn('🗑️ Hapus Semua Notifikasi', () => { Store.clearNotifications(); UI.toast('Notifikasi dibersihkan.', 'info'); App.render(); }, { color: 'danger', size: 'sm' }),
    ]));

    // account info
    const s = Auth.current();
    const info = UI.el('div', { class: 'detail-grid' });
    info.appendChild(UI.el('div', {}, [UI.el('strong', {}, ['Nama: ']), s.name]));
    info.appendChild(UI.el('div', {}, [UI.el('strong', {}, ['Email: ']), s.email]));
    info.appendChild(UI.el('div', {}, [UI.el('strong', {}, ['Role: ']), UI.badge('Administrator', 'admin')]));
    frag.appendChild(UI.card('Informasi Akun', info));

    // system stats
    const sysStats = UI.el('div', { class: 'stat-grid stat-grid-4' });
    sysStats.appendChild(UI.statCard('Total Anggota', String(Logic.totalMembers()), '👥', 'info'));
    sysStats.appendChild(UI.statCard('Pinjaman Aktif', String(Logic.activeLoanCount()), '📋', 'warning'));
    sysStats.appendChild(UI.statCard('Total Transaksi', String(Store.getTransactions().length), '💰', 'primary'));
    sysStats.appendChild(UI.statCard('Total Pembayaran', String(Store.getPayments().length), '💳', 'success'));
    frag.appendChild(UI.card('Statistik Sistem', sysStats));

    return frag;
  },
};
