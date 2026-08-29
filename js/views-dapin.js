/**
 * FINORA × DAPIN — DAPIN Views
 * Admin: members, savings, loans, ledger (full management)
 * Anggota: dashboard, loans, pay, apply, savings, profile (bayar & pinjam only)
 */
const ViewsDapin = {
  // ==================== ADMIN: MEMBERS ====================
  members() {
    const frag = UI.el('div', { class: 'page' });
    const toolbar = UI.el('div', { class: 'page-toolbar' });
    toolbar.appendChild(UI.btn('➕ Tambah Anggota', () => showMemberForm(), { color: 'primary' }));
    frag.appendChild(toolbar);

    const members = Store.getMembers();
    const rows = members.map(m => {
      const totalSavings = Logic.totalSavingsByMember(m.id);
      const totalLoans = Logic.totalLoansByMember(m.id);
      return [
        m.id,
        UI.el('strong', {}, [m.name]),
        m.email,
        m.phone,
        Logic.formatCurrency(totalSavings),
        Logic.formatCurrency(totalLoans),
        UI.badge(m.status, m.status === 'active' ? 'success' : 'danger'),
        UI.actionCell([
          { label: 'Detail', onClick: () => showMemberDetail(m), color: 'primary' },
          { label: 'Hapus', onClick: () => { Store.deleteMember(m.id); UI.toast('Anggota dihapus.', 'info'); App.render(); }, color: 'danger' },
        ]),
      ];
    });
    frag.appendChild(UI.card('Daftar Anggota', UI.table(['ID','Nama','Email','Phone','Simpanan','Pinjaman','Status','Aksi'], rows)));
    return frag;

    function showMemberForm() {
      const nameI = UI.input('text', { placeholder: 'Nama lengkap' });
      const emailI = UI.input('email', { placeholder: 'Email' });
      const phoneI = UI.input('text', { placeholder: 'No. telepon' });
      const form = UI.el('div', { class: 'form-grid' });
      form.appendChild(UI.formField('Nama', nameI));
      form.appendChild(UI.formField('Email', emailI));
      form.appendChild(UI.formField('Telepon', phoneI));
      const m = UI.modal('Tambah Anggota', form, () => App.render());
      m.querySelector('.modal').appendChild(UI.el('div', { class: 'modal-footer' }, [
        UI.btn('Simpan', () => {
          if (!nameI.value || !emailI.value) { UI.toast('Nama dan email wajib.', 'error'); return; }
          const mem = Store.addMember({ name: nameI.value, email: emailI.value, phone: phoneI.value });
          // auto-create login for member
          const db = Store.load();
          db.users.push({ id: 'U_' + mem.id, name: mem.name, email: mem.email, password: 'member123', role: 'member', memberId: mem.id });
          Store.save();
          m.remove(); UI.toast(`Anggota ditambahkan. Login: ${mem.email} / member123`, 'success'); App.render();
        }, { color: 'primary' }),
      ]));
    }

    function showMemberDetail(m) {
      const savings = Store.getSavingsByMember(m.id);
      const loans = Store.getLoansByMember(m.id);
      const payments = Store.getPaymentsByMember(m.id);
      let html = `
        <div class="detail-grid">
          <div><strong>Nama:</strong> ${m.name}</div>
          <div><strong>Email:</strong> ${m.email}</div>
          <div><strong>Telepon:</strong> ${m.phone}</div>
          <div><strong>Bergabung:</strong> ${Logic.formatDate(m.joinedDate)}</div>
          <div><strong>Total Simpanan:</strong> ${Logic.formatCurrency(Logic.totalSavingsByMember(m.id))}</div>
          <div><strong>Total Pinjaman:</strong> ${Logic.formatCurrency(Logic.totalLoansByMember(m.id))}</div>
        </div>
        <h4>Simpanan</h4>
      `;
      const sRows = savings.map(s => [s.type, Logic.formatCurrency(s.amount), Logic.formatDate(s.date)]);
      html += '<div id="detail-savings"></div>';
      let content = UI.el('div', { html });
      const m_modal = UI.modal(`Detail: ${m.name}`, content, () => App.render());
      const sTarget = m_modal.querySelector('#detail-savings');
      sTarget.appendChild(UI.table(['Jenis','Jumlah','Tanggal'], sRows.length ? sRows : [['','','']]));
      // loans
      const loansTitle = UI.el('h4', {}, ['Pinjaman']);
      m_modal.querySelector('.modal-body').appendChild(loansTitle);
      const lRows = loans.map(l => [
        l.id, Logic.formatCurrency(l.principal), l.type, l.term + ' bln',
        Logic.formatCurrency(l.remaining_balance), UI.badge(l.status, l.status === 'active' ? 'warning' : 'success'),
      ]);
      m_modal.querySelector('.modal-body').appendChild(UI.table(['ID','Pokok','Tipe','Tenor','Sisa','Status'], lRows.length ? lRows : [['','','','','','']]));
    }
  },

  // ==================== ADMIN: SAVINGS ====================
  savings() {
    const frag = UI.el('div', { class: 'page' });
    const toolbar = UI.el('div', { class: 'page-toolbar' });
    toolbar.appendChild(UI.btn('➕ Catat Simpanan', () => showSavingForm(), { color: 'primary' }));
    frag.appendChild(toolbar);

    const all = Store.getSavings().slice().reverse();
    const rows = all.map(s => {
      const m = Store.getMember(s.memberId);
      return [
        Logic.formatDate(s.date),
        m?.name || '-',
        UI.badge(s.type, s.type === 'pokok' ? 'primary' : s.type === 'wajib' ? 'info' : 'success'),
        Logic.formatCurrency(s.amount),
        UI.actionCell([{ label: 'Hapus', onClick: () => { Store.deleteSaving(s.id); UI.toast('Simpanan dihapus.', 'info'); App.render(); }, color: 'danger' }]),
      ];
    });
    frag.appendChild(UI.card('Semua Simpanan', UI.table(['Tanggal','Anggota','Jenis','Jumlah','Aksi'], rows)));
    return frag;

    function showSavingForm() {
      const memSel = UI.select(Store.getMembers().map(m => ({ value: m.id, label: m.name })));
      const typeSel = UI.select([
        { value: 'pokok', label: 'Simpanan Pokok' },
        { value: 'wajib', label: 'Simpanan Wajib' },
        { value: 'sukarela', label: 'Simpanan Sukarela' },
      ]);
      const amtI = UI.input('number', { placeholder: 'Jumlah (Rp)' });
      const form = UI.el('div', { class: 'form-grid' });
      form.appendChild(UI.formField('Anggota', memSel));
      form.appendChild(UI.formField('Jenis', typeSel));
      form.appendChild(UI.formField('Jumlah', amtI));
      const m = UI.modal('Catat Simpanan', form, () => App.render());
      m.querySelector('.modal').appendChild(UI.el('div', { class: 'modal-footer' }, [
        UI.btn('Simpan', () => {
          if (!amtI.value) { UI.toast('Jumlah wajib.', 'error'); return; }
          Store.addSaving({ memberId: memSel.value, type: typeSel.value, amount: parseInt(amtI.value) });
          m.remove(); UI.toast('Simpanan tercatat.', 'success'); App.render();
        }, { color: 'primary' }),
      ]));
    }
  },

  // ==================== ADMIN: LOANS ====================
  loans() {
    const frag = UI.el('div', { class: 'page' });
    const toolbar = UI.el('div', { class: 'page-toolbar' });
    toolbar.appendChild(UI.btn('➕ Buat Pinjaman', () => showLoanForm(), { color: 'primary' }));
    frag.appendChild(toolbar);

    const all = Store.getLoans().slice().reverse();
    const rows = all.map(l => {
      const m = Store.getMember(l.memberId);
      const pct = l.principal > 0 ? (l.paid_amount / l.principal * 100) : 0;
      return [
        l.id,
        m?.name || '-',
        Logic.formatCurrency(l.principal),
        l.interestRate + '%',
        l.type,
        l.term + ' bln',
        UI.el('div', {}, [UI.progress(pct), UI.el('span', { class: 'progress-text' }, [Math.round(pct) + '%'])]),
        Logic.formatCurrency(l.remaining_balance),
        UI.badge(l.status, l.status === 'active' ? 'warning' : 'success'),
        UI.actionCell([
          { label: 'Detail', onClick: () => showLoanDetail(l), color: 'primary' },
          { label: 'Hapus', onClick: () => { Store.deleteLoan(l.id); UI.toast('Pinjaman dihapus.', 'info'); App.render(); }, color: 'danger' },
        ]),
      ];
    });
    frag.appendChild(UI.card('Semua Pinjaman', UI.table(['ID','Anggota','Pokok','Bunga','Tipe','Tenor','Progress','Sisa','Status','Aksi'], rows)));
    return frag;

    function showLoanForm() {
      const memSel = UI.select(Store.getMembers().map(m => ({ value: m.id, label: m.name })));
      const prinI = UI.input('number', { placeholder: 'Pokok pinjaman (Rp)' });
      const rateI = UI.input('number', { placeholder: 'Bunga %/tahun', value: '12' });
      const termI = UI.input('number', { placeholder: 'Tenor (bulan)' });
      const typeSel = UI.select([{ value: 'anuitas', label: 'Anuitas' }, { value: 'flat', label: 'Flat' }]);
      const form = UI.el('div', { class: 'form-grid' });
      form.appendChild(UI.formField('Anggota', memSel));
      form.appendChild(UI.formField('Pokok', prinI));
      form.appendChild(UI.formField('Bunga (%/thn)', rateI));
      form.appendChild(UI.formField('Tenor (bulan)', termI));
      form.appendChild(UI.formField('Tipe', typeSel));
      const m = UI.modal('Buat Pinjaman', form, () => App.render());
      m.querySelector('.modal').appendChild(UI.el('div', { class: 'modal-footer' }, [
        UI.btn('Simpan', () => {
          if (!prinI.value || !termI.value) { UI.toast('Pokok dan tenor wajib.', 'error'); return; }
          Store.addLoan({
            memberId: memSel.value,
            principal: parseInt(prinI.value),
            interestRate: parseFloat(rateI.value) || 0,
            term: parseInt(termI.value),
            type: typeSel.value,
          });
          m.remove(); UI.toast('Pinjaman dibuat & dicairkan.', 'success'); App.render();
        }, { color: 'primary' }),
      ]));
    }

    function showLoanDetail(l) {
      const m = Store.getMember(l.memberId);
      const payments = Store.getPaymentsByLoan(l.id);
      const instRows = (l.installments || []).map(i => [
        i.number,
        Logic.formatCurrency(i.principal),
        Logic.formatCurrency(i.interest),
        Logic.formatCurrency(i.payment),
        Logic.formatDate(i.dueDate),
        Logic.formatCurrency(i.balance),
        i.status === 'paid' ? UI.badge('Lunas', 'success') : UI.badge('Pending', 'warning'),
      ]);
      const payRows = payments.map(p => [p.installmentNumber, Logic.formatCurrency(p.amount), Logic.formatDate(p.date)]);
      const content = UI.el('div', { html: `
        <div class="detail-grid">
          <div><strong>Anggota:</strong> ${m?.name || '-'}</div>
          <div><strong>Pokok:</strong> ${Logic.formatCurrency(l.principal)}</div>
          <div><strong>Bunga:</strong> ${l.interestRate}%/tahun</div>
          <div><strong>Tipe:</strong> ${l.type}</div>
          <div><strong>Tenor:</strong> ${l.term} bulan</div>
          <div><strong>Sisa:</strong> ${Logic.formatCurrency(l.remaining_balance)}</div>
          <div><strong>Dibayar:</strong> ${Logic.formatCurrency(l.paid_amount)}</div>
          <div><strong>Status:</strong> ${l.status}</div>
        </div>
      ` });
      const m_modal = UI.modal(`Pinjaman ${l.id}`, content, () => App.render());
      m_modal.querySelector('.modal-body').appendChild(UI.el('h4', {}, ['Jadwal Angsuran']));
      m_modal.querySelector('.modal-body').appendChild(UI.table(['#','Pokok','Bunga','Cicilan','Jatuh Tempo','Sisa','Status'], instRows));
      if (payRows.length) {
        m_modal.querySelector('.modal-body').appendChild(UI.el('h4', {}, ['Riwayat Pembayaran']));
        m_modal.querySelector('.modal-body').appendChild(UI.table(['Cicilan #','Jumlah','Tanggal'], payRows));
      }
    }
  },

  // ==================== ADMIN: LEDGER ====================
  ledger() {
    const frag = UI.el('div', { class: 'page' });
    const allPayments = Store.getPayments().slice().reverse();
    const rows = allPayments.map(p => {
      const m = Store.getMember(p.memberId);
      const l = Store.getLoan(p.loanId);
      return [
        Logic.formatDate(p.date),
        p.id,
        m?.name || '-',
        l?.id || '-',
        'Cicilan #' + p.installmentNumber,
        Logic.formatCurrency(p.amount),
      ];
    });
    frag.appendChild(UI.card('Buku Besar — Pembayaran Angsuran', UI.table(['Tanggal','ID Bayar','Anggota','Pinjaman','Keterangan','Jumlah'], rows)));

    // all transactions
    const txRows = Store.getTransactions().slice().reverse().map(t => [
      Logic.formatDate(t.date),
      t.id.slice(0,12),
      t.type === 'income' ? UI.badge('Masuk', 'success') : UI.badge('Keluar', 'danger'),
      t.category,
      Logic.formatCurrency(t.amount),
    ]);
    frag.appendChild(UI.card('Buku Besar — Transaksi FINORA', UI.table(['Tanggal','ID','Tipe','Kategori','Jumlah'], txRows)));
    return frag;
  },

  // ==================== ANGGOTA: DASHBOARD ====================
  memberDashboard() {
    const s = Auth.current();
    const memberId = s.memberId;
    const member = Store.getMember(memberId);
    const frag = UI.el('div', { class: 'page' });
    frag.appendChild(UI.el('div', { class: 'welcome-banner' }, [
      UI.el('h2', {}, [`Selamat datang, ${member?.name || s.name} 👋`]),
      UI.el('p', {}, ['Panel Anggota — Anda dapat meminjam dan membayar angsuran.']),
    ]));

    const stats = UI.el('div', { class: 'stat-grid' });
    stats.appendChild(UI.statCard('Simpanan Saya', Logic.formatCurrency(Logic.totalSavingsByMember(memberId)), '🏦', 'success'));
    stats.appendChild(UI.statCard('Pinjaman Aktif', Logic.formatCurrency(Logic.totalLoansByMember(memberId)), '📋', 'warning'));
    stats.appendChild(UI.statCard('Total Dibayar', Logic.formatCurrency(Logic.totalPaymentsByMember(memberId)), '✅', 'primary'));
    const upcoming = Logic.upcomingInstallments(memberId);
    stats.appendChild(UI.statCard('Angsuran Jatuh Tempo', String(upcoming.length), '⏰', upcoming.length > 0 ? 'danger' : 'info'));
    frag.appendChild(stats);

    // quick actions
    const actions = UI.el('div', { class: 'quick-actions' });
    actions.appendChild(UI.btn('💳 Bayar Angsuran', () => App.go('member-pay'), { color: 'primary' }));
    actions.appendChild(UI.btn('📝 Ajukan Pinjaman', () => App.go('member-apply'), { color: 'success' }));
    actions.appendChild(UI.btn('📋 Lihat Pinjaman', () => App.go('member-loans'), { color: 'info' }));
    frag.appendChild(UI.card('Aksi Cepat', actions));

    // upcoming installments
    if (upcoming.length > 0) {
      const upRows = upcoming.slice(0, 5).map(u => [
        'Cicilan #' + u.number,
        Logic.formatDate(u.dueDate),
        Logic.formatCurrency(u.payment),
        UI.badge('Belum Dibayar', 'warning'),
      ]);
      frag.appendChild(UI.card('Angsuran Jatuh Tempo Berikutnya', UI.table(['Cicilan','Jatuh Tempo','Jumlah','Status'], upRows)));
    } else {
      frag.appendChild(UI.emptyState('Tidak ada angsuran jatuh tempo. Semua lunas! 🎉', '✅'));
    }
    return frag;
  },

  // ==================== ANGGOTA: MY LOANS ====================
  memberLoans() {
    const s = Auth.current();
    const memberId = s.memberId;
    const frag = UI.el('div', { class: 'page' });
    const loans = Store.getLoansByMember(memberId);

    if (loans.length === 0) {
      frag.appendChild(UI.emptyState('Anda belum memiliki pinjaman.', '📋'));
      frag.appendChild(UI.btn('📝 Ajukan Pinjaman Baru', () => App.go('member-apply'), { color: 'success' }));
      return frag;
    }

    const rows = loans.map(l => {
      const pct = l.principal > 0 ? (l.paid_amount / l.principal * 100) : 0;
      return [
        l.id,
        Logic.formatCurrency(l.principal),
        l.interestRate + '%',
        l.type,
        l.term + ' bln',
        UI.el('div', {}, [UI.progress(pct), UI.el('span', { class: 'progress-text' }, [Math.round(pct) + '%'])]),
        Logic.formatCurrency(l.remaining_balance),
        UI.badge(l.status, l.status === 'active' ? 'warning' : 'success'),
        UI.actionCell([{ label: 'Detail', onClick: () => showMyLoanDetail(l), color: 'primary' }]),
      ];
    });
    frag.appendChild(UI.card('Pinjaman Saya', UI.table(['ID','Pokok','Bunga','Tipe','Tenor','Progress','Sisa','Status','Aksi'], rows)));
    return frag;

    function showMyLoanDetail(l) {
      const instRows = (l.installments || []).map(i => [
        i.number,
        Logic.formatCurrency(i.payment),
        Logic.formatDate(i.dueDate),
        i.status === 'paid' ? UI.badge('Lunas', 'success') : UI.badge('Pending', 'warning'),
      ]);
      const content = UI.el('div', { html: `
        <div class="detail-grid">
          <div><strong>Pokok:</strong> ${Logic.formatCurrency(l.principal)}</div>
          <div><strong>Bunga:</strong> ${l.interestRate}%/tahun</div>
          <div><strong>Tipe:</strong> ${l.type}</div>
          <div><strong>Tenor:</strong> ${l.term} bulan</div>
          <div><strong>Sisa:</strong> ${Logic.formatCurrency(l.remaining_balance)}</div>
          <div><strong>Dibayar:</strong> ${Logic.formatCurrency(l.paid_amount)}</div>
        </div>
      ` });
      const m_modal = UI.modal(`Pinjaman ${l.id}`, content, () => App.render());
      m_modal.querySelector('.modal-body').appendChild(UI.el('h4', {}, ['Jadwal Angsuran']));
      m_modal.querySelector('.modal-body').appendChild(UI.table(['#','Cicilan','Jatuh Tempo','Status'], instRows));
      if (l.status === 'active') {
        m_modal.querySelector('.modal').appendChild(UI.el('div', { class: 'modal-footer' }, [
          UI.btn('💳 Bayar Cicilan Berikutnya', () => { m_modal.remove(); App.go('member-pay'); }, { color: 'primary' }),
        ]));
      }
    }
  },

  // ==================== ANGGOTA: PAY INSTALLMENT ====================
  memberPay() {
    const s = Auth.current();
    const memberId = s.memberId;
    const frag = UI.el('div', { class: 'page' });
    frag.appendChild(UI.el('h2', { class: 'page-title' }, ['💳 Bayar Angsuran']));

    const activeLoans = Logic.activeLoansByMember(memberId);
    if (activeLoans.length === 0) {
      frag.appendChild(UI.emptyState('Tidak ada pinjaman aktif. Tidak ada angsuran untuk dibayar.', '✅'));
      frag.appendChild(UI.btn('📝 Ajukan Pinjaman', () => App.go('member-apply'), { color: 'success' }));
      return frag;
    }

    // list unpaid installments
    const items = [];
    activeLoans.forEach(l => {
      (l.installments || []).forEach(i => {
        if (i.status !== 'paid') {
          items.push({ loan: l, installment: i });
        }
      });
    });

    if (items.length === 0) {
      frag.appendChild(UI.emptyState('Semua angsuran sudah lunas! 🎉', '✅'));
      return frag;
    }

    const rows = items.map(item => [
      item.loan.id,
      'Cicilan #' + item.installment.number,
      Logic.formatCurrency(item.installment.payment),
      Logic.formatDate(item.installment.dueDate),
      UI.badge('Belum Dibayar', 'warning'),
      UI.actionCell([{ label: 'Bayar Sekarang', onClick: () => doPay(item), color: 'success' }]),
    ]);
    frag.appendChild(UI.card('Angsuran Belum Dibayar', UI.table(['Pinjaman','Cicilan','Jumlah','Jatuh Tempo','Status','Aksi'], rows)));
    return frag;

    function doPay(item) {
      const confirmContent = UI.el('div', { class: 'pay-confirm' }, [
        UI.el('p', {}, [`Anda akan membayar cicilan #${item.installment.number} untuk pinjaman ${item.loan.id}.`]),
        UI.el('div', { class: 'pay-amount' }, [Logic.formatCurrency(item.installment.payment)]),
        UI.el('p', { class: 'pay-note' }, ['Pembayaran akan langsung mengurangi saldo pinjaman Anda.']),
      ]);
      const m = UI.modal('Konfirmasi Pembayaran', confirmContent, () => App.render());
      m.querySelector('.modal').appendChild(UI.el('div', { class: 'modal-footer' }, [
        UI.btn('✅ Konfirmasi Bayar', () => {
          Store.addPayment({
            loanId: item.loan.id,
            memberId,
            amount: item.installment.payment,
            installmentNumber: item.installment.number,
          });
          Store.addNotification({ type: 'success', title: 'Pembayaran berhasil', message: `Cicilan #${item.installment.number} pinjaman ${item.loan.id} telah dibayar.` });
          m.remove(); UI.toast('Pembayaran berhasil! ✅', 'success'); App.render();
        }, { color: 'success' }),
      ]));
    }
  },

  // ==================== ANGGOTA: APPLY FOR LOAN ====================
  memberApply() {
    const s = Auth.current();
    const memberId = s.memberId;
    const frag = UI.el('div', { class: 'page' });
    frag.appendChild(UI.el('h2', { class: 'page-title' }, ['📝 Ajukan Pinjaman']));

    // check active loans limit
    const activeLoans = Logic.activeLoansByMember(memberId);
    if (activeLoans.length >= 3) {
      frag.appendChild(UI.el('div', { class: 'alert alert-warning' }, [
        '⚠️ Anda sudah memiliki 3 pinjaman aktif. Selesaikan salah satu sebelum mengajukan lagi.',
      ]));
      return frag;
    }

    const prinI = UI.input('number', { placeholder: 'Jumlah pinjaman (Rp)' });
    const rateI = UI.input('number', { value: '12', placeholder: 'Bunga %/tahun' });
    const termI = UI.input('number', { placeholder: 'Tenor (bulan)' });
    const typeSel = UI.select([{ value: 'anuitas', label: 'Anuitas' }, { value: 'flat', label: 'Flat' }]);

    const form = UI.el('div', { class: 'form-grid form-wide' });
    form.appendChild(UI.formField('Jumlah Pinjaman', prinI));
    form.appendChild(UI.formField('Bunga (%/tahun)', rateI));
    form.appendChild(UI.formField('Tenor (bulan)', termI));
    form.appendChild(UI.formField('Tipe Bunga', typeSel));

    // live preview
    const previewDiv = UI.el('div', { class: 'loan-preview', id: 'loan-preview' });
    function updatePreview() {
      const p = parseInt(prinI.value) || 0;
      const r = parseFloat(rateI.value) || 0;
      const t = parseInt(termI.value) || 0;
      if (p > 0 && t > 0) {
        const schedule = Logic.generateSchedule(p, r, t, typeSel.value);
        const monthly = schedule[0]?.payment || 0;
        const total = schedule.reduce((s, i) => s + i.payment, 0);
        const interest = total - p;
        previewDiv.innerHTML = `
          <div class="preview-grid">
            <div><strong>Cicilan/bulan:</strong> ${Logic.formatCurrency(monthly)}</div>
            <div><strong>Total bunga:</strong> ${Logic.formatCurrency(interest)}</div>
            <div><strong>Total bayar:</strong> ${Logic.formatCurrency(total)}</div>
            <div><strong>Jumlah cicilan:</strong> ${t}x</div>
          </div>
        `;
      } else {
        previewDiv.innerHTML = '<p class="muted">Isi form untuk melihat preview.</p>';
      }
    }
    [prinI, rateI, termI].forEach(i => i.addEventListener('input', updatePreview));
    typeSel.addEventListener('change', updatePreview);

    const submitBtn = UI.btn('📤 Ajukan Pinjaman', () => {
      if (!prinI.value || !termI.value) { UI.toast('Jumlah dan tenor wajib diisi.', 'error'); return; }
      const principal = parseInt(prinI.value);
      if (principal < 100000) { UI.toast('Minimal pinjaman Rp 100.000.', 'error'); return; }
      Store.addLoan({
        memberId,
        principal,
        interestRate: parseFloat(rateI.value) || 0,
        term: parseInt(termI.value),
        type: typeSel.value,
      });
      Store.addNotification({ type: 'info', title: 'Pinjaman diajukan & disetujui', message: `Pinjaman ${Logic.formatCurrency(principal)} telah dicairkan ke akun Anda.` });
      UI.toast('Pinjaman diajukan & langsung disetujui! ✅', 'success');
      App.go('member-loans');
    }, { color: 'success' });

    frag.appendChild(UI.card('Form Pengajuan Pinjaman', [form, previewDiv, UI.el('div', { class: 'form-actions' }, [submitBtn])]));
    return frag;
  },

  // ==================== ANGGOTA: MY SAVINGS ====================
  memberSavings() {
    const s = Auth.current();
    const memberId = s.memberId;
    const frag = UI.el('div', { class: 'page' });
    const savings = Store.getSavingsByMember(memberId);
    const total = Logic.totalSavingsByMember(memberId);

    frag.appendChild(UI.statCard('Total Simpanan Saya', Logic.formatCurrency(total), '🏦', 'success'));

    if (savings.length === 0) {
      frag.appendChild(UI.emptyState('Belum ada simpanan tercatat.', '🏦'));
      return frag;
    }

    // breakdown by type
    const byType = {};
    savings.forEach(s => { byType[s.type] = (byType[s.type] || 0) + s.amount; });
    const donutData = Object.entries(byType).map(([type, val]) => ({
      label: type === 'pokok' ? 'Pokok' : type === 'wajib' ? 'Wajib' : 'Sukarela',
      value: val,
    }));
    frag.appendChild(UI.card('Komposisi Simpanan', Charts.donut(donutData, { legend: true, centerLabel: Logic.formatCurrency(total) })));

    const rows = savings.map(s => [
      Logic.formatDate(s.date),
      UI.badge(s.type, s.type === 'pokok' ? 'primary' : s.type === 'wajib' ? 'info' : 'success'),
      Logic.formatCurrency(s.amount),
    ]);
    frag.appendChild(UI.card('Riwayat Simpanan', UI.table(['Tanggal','Jenis','Jumlah'], rows)));
    return frag;
  },

  // ==================== ANGGOTA: PROFILE ====================
  memberProfile() {
    const s = Auth.current();
    const member = Store.getMember(s.memberId);
    const frag = UI.el('div', { class: 'page' });
    if (!member) {
      frag.appendChild(UI.emptyState('Data anggota tidak ditemukan.'));
      return frag;
    }

    const info = UI.el('div', { class: 'detail-grid detail-wide' });
    info.appendChild(UI.el('div', {}, [UI.el('strong', {}, ['Nama: ']), member.name]));
    info.appendChild(UI.el('div', {}, [UI.el('strong', {}, ['Email: ']), member.email]));
    info.appendChild(UI.el('div', {}, [UI.el('strong', {}, ['Telepon: ']), member.phone]));
    info.appendChild(UI.el('div', {}, [UI.el('strong', {}, ['Bergabung: ']), Logic.formatDate(member.joinedDate)]));
    info.appendChild(UI.el('div', {}, [UI.el('strong', {}, ['Status: ']), UI.badge(member.status, 'success')]));
    frag.appendChild(UI.card('Profil Anggota', info));

    // notifications
    const notifs = Store.getNotifications().slice(0, 10);
    const nRows = notifs.map(n => [
      Logic.formatDate(n.date),
      UI.badge(n.type, n.type === 'success' ? 'success' : n.type === 'info' ? 'info' : 'warning'),
      n.title + ' — ' + n.message,
    ]);
    frag.appendChild(UI.card('Notifikasi Terbaru', UI.table(['Tanggal','Tipe','Pesan'], nRows)));
    return frag;
  },
};
