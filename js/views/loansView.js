/* ==========================================================================
   EDMRS - Educational Document Copy Request System View Controller (js/views/loansView.js)
   Manages requests for official document copies (ปพ.1 - ปพ.9) & tracks issuance status
   ========================================================================== */

const loansView = {
  currentFilter: 'all',

  render() {
    const loans = window.db.data.loans || [];
    const canManage = window.authSystem.hasPermission('manage_loans');

    const totalCount = loans.length;
    const pendingCount = loans.filter(l => l.status === 'borrowed' || l.status === 'pending').length;
    const completedCount = loans.filter(l => l.status === 'returned' || l.status === 'completed').length;

    // Filtered loans based on current active tab filter
    const filteredLoans = loans.filter(l => {
      if (this.currentFilter === 'pending') return l.status === 'borrowed' || l.status === 'pending';
      if (this.currentFilter === 'completed') return l.status === 'returned' || l.status === 'completed';
      return true;
    });

    return `
      <!-- Header Bar -->
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; min-width: 0;">
        <div style="flex: 1; min-width: 240px;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; box-shadow: 0 4px 10px rgba(30, 58, 138, 0.2); flex-shrink: 0;">
              <i class="fa-solid fa-file-signature"></i>
            </div>
            <div style="min-width: 0;">
              <h2 style="font-size: 1.2rem; font-weight: 700; color: var(--primary-950); margin: 0; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ระบบบริการคำขอสำเนาเอกสารทางการศึกษา (ปพ.)
              </h2>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.15rem 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ยื่นคำขอสำเนาเอกสาร ปพ. ติดตามสถานะการออกเอกสาร และบันทึกประวัติการรับเอกสาร
              </p>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center;">
          <button id="sync-loans-sheets-btn" class="btn btn-success btn-sm" style="font-weight: 600; font-size: 0.82rem; padding: 0.4rem 0.75rem;">
            <i class="fa-solid fa-table"></i> ซิงก์ Sheets
          </button>
          <button id="export-loans-excel-btn" class="btn btn-secondary btn-sm" style="font-size: 0.82rem; padding: 0.4rem 0.75rem;">
            <i class="fa-solid fa-file-excel text-success"></i> Excel
          </button>
          ${canManage ? `
            <button id="add-loan-btn" class="btn btn-primary btn-sm" style="font-weight: 600; font-size: 0.82rem; padding: 0.4rem 0.75rem;">
              <i class="fa-solid fa-plus"></i> ยื่นคำขอใหม่
            </button>
          ` : ''}
        </div>
      </div>

      <!-- KPI Overview Cards & Status Filter -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem;">
        <div class="kpi-card ${this.currentFilter === 'all' ? 'active-filter' : ''}" id="filter-all-btn" style="cursor: pointer; padding: 0.85rem 1rem; transition: all 0.2s ease;">
          <div class="kpi-icon blue" style="width: 38px; height: 38px; font-size: 1.1rem;"><i class="fa-solid fa-folder-open"></i></div>
          <div class="kpi-info" style="min-width: 0;">
            <span class="kpi-label" style="font-size: 0.78rem;">คำขอทั้งหมด</span>
            <span class="kpi-value" style="font-size: 1.35rem;">${totalCount}</span>
            <span class="kpi-subtext" style="font-size: 0.72rem;">คลิกเพื่อดูทั้งหมด</span>
          </div>
        </div>

        <div class="kpi-card ${this.currentFilter === 'pending' ? 'active-filter' : ''}" id="filter-pending-btn" style="cursor: pointer; padding: 0.85rem 1rem; transition: all 0.2s ease;">
          <div class="kpi-icon orange" style="width: 38px; height: 38px; font-size: 1.1rem;"><i class="fa-solid fa-hourglass-half"></i></div>
          <div class="kpi-info" style="min-width: 0;">
            <span class="kpi-label" style="font-size: 0.78rem;">รอดำเนินการออกสำเนา</span>
            <span class="kpi-value" style="color: #d97706; font-size: 1.35rem;">${pendingCount}</span>
            <span class="kpi-subtext" style="font-size: 0.72rem;">คลิกเพื่อกรองรอดำเนินการ</span>
          </div>
        </div>

        <div class="kpi-card ${this.currentFilter === 'completed' ? 'active-filter' : ''}" id="filter-completed-btn" style="cursor: pointer; padding: 0.85rem 1rem; transition: all 0.2s ease;">
          <div class="kpi-icon emerald" style="width: 38px; height: 38px; font-size: 1.1rem;"><i class="fa-solid fa-circle-check"></i></div>
          <div class="kpi-info" style="min-width: 0;">
            <span class="kpi-label" style="font-size: 0.78rem;">ส่งมอบสำเร็จ / รับแล้ว</span>
            <span class="kpi-value" style="color: #059669; font-size: 1.35rem;">${completedCount}</span>
            <span class="kpi-subtext" style="font-size: 0.72rem;">คลิกเพื่อกรองที่รับแล้ว</span>
          </div>
        </div>
      </div>

      <!-- Alert Banner if Pending items exist -->
      ${pendingCount > 0 ? `
        <div class="card" style="background: #fffbe6; border: 1px solid #fef08a; border-left: 4px solid #f59e0b; margin-bottom: 1.25rem; padding: 0.85rem 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; color: #92400e;">
            <i class="fa-solid fa-bell-concierge" style="font-size: 1.2rem; color: #d97706;"></i>
            <div>
              <strong style="font-size: 0.9rem;">มีรายการคำขอสำเนาเอกสารอยู่ระหว่างดำเนินการ ${pendingCount} รายการ</strong>
              <div style="font-size: 0.78rem; color: #b45309; margin-top: 1px;">โปรดตรวจสอบและดำเนินการพิมพ์ออกสำเนาเอกสารตามกำหนดวันนัดหมายรับของนักเรียน/ผู้ยื่นคำขอ</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Document Requests Table Card -->
      <div class="card" style="padding: 0; min-width: 0;">
        <div style="padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background: var(--bg-surface);">
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--primary-950); display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-list-check text-primary"></i> 
            ตารางรายการคำขอสำเนาเอกสาร
            <span class="badge badge-secondary" style="font-size: 0.75rem;">${filteredLoans.length} รายการ</span>
          </div>

          <div style="display: flex; gap: 0.5rem; max-width: 100%;">
            <input type="text" id="loans-table-search" class="form-control form-control-sm" placeholder="🔍 ค้นหาคำขอ / ชื่อนักเรียน..." style="width: 200px; max-width: 100%; font-size: 0.8rem;">
          </div>
        </div>

        <div class="table-responsive" style="overflow-x: auto; width: 100%;">
          <table class="data-table" id="loans-table" style="width: 100%;">
            <thead>
              <tr>
                <th>เลขที่คำขอ</th>
                <th>นักเรียนเจ้าของเอกสาร</th>
                <th>ประเภท ปพ.</th>
                <th>ผู้ขอสำเนา / สังกัดความสัมพันธ์</th>
                <th>วันที่ยื่น / กำหนดนัดรับ</th>
                <th>วัตถุประสงค์ในการขอ</th>
                <th>สถานะคำขอ</th>
                <th style="text-align: center;">จัดการคำขอ / ส่งมอบ</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLoans.length ? filteredLoans.map(l => `
                <tr class="loan-row">
                  <td>
                    <code style="font-weight: 700; font-size: 0.85rem; color: var(--primary-800);">${l.loan_code ? l.loan_code.replace('LN-', 'REQ-') : ''}</code>
                  </td>
                  <td>
                    <div style="font-weight: 600; color: var(--primary-950); font-size: 0.88rem;">${l.student_name || '-'}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-solid fa-id-badge"></i> ID: ${l.student_id || '-'}</div>
                  </td>
                  <td>
                    <span class="badge badge-info" style="font-weight: 600; font-size: 0.78rem;">${l.doc_type_code || 'ปพ.1'}</span>
                    ${l.doc_number ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">เลขที่ ${l.doc_number}</div>` : ''}
                  </td>
                  <td>
                    <div style="font-weight: 600; color: var(--primary-900); font-size: 0.85rem;">${l.borrower_name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-solid fa-users"></i> ${l.borrower_dept || 'ผู้ขอสำเนา'}</div>
                  </td>
                  <td>
                    <div style="font-size: 0.78rem;"><i class="fa-regular fa-calendar"></i> ยื่น: ${window.utils.formatThaiDate(l.loan_date)}</div>
                    <div style="font-size: 0.75rem; color: var(--primary-700); font-weight: 600; margin-top: 2px;">
                      <i class="fa-regular fa-calendar-check"></i> นัดรับ: ${window.utils.formatThaiDate(l.return_due_date)}
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 0.82rem; max-width: 180px; white-space: normal; line-height: 1.3;">${l.reason}</div>
                  </td>
                  <td>
                    ${(l.status === 'borrowed' || l.status === 'pending')
                      ? '<span class="badge badge-warning" style="font-size: 0.75rem; padding: 0.3rem 0.5rem;"><i class="fa-solid fa-hourglass-half"></i> รอดำเนินการ</span>'
                      : '<span class="badge badge-success" style="font-size: 0.75rem; padding: 0.3rem 0.5rem;"><i class="fa-solid fa-circle-check"></i> ส่งมอบสำเร็จ</span>'}
                  </td>
                  <td style="text-align: center;">
                    <div style="display: flex; gap: 0.3rem; justify-content: center; align-items: center;">
                      ${(l.status === 'borrowed' || l.status === 'pending') && canManage ? `
                        <button class="btn btn-success btn-sm return-doc-btn" data-id="${l.id}" data-docid="${l.doc_id}" title="บันทึกการส่งมอบสำเนาเอกสารสำเร็จ" style="font-size: 0.78rem; padding: 0.25rem 0.5rem;">
                          <i class="fa-solid fa-check-double"></i> ส่งมอบ
                        </button>
                      ` : ''}
                      <button class="btn btn-warning btn-sm edit-loan-btn" data-id="${l.id}" title="แก้ไขข้อมูลคำขอ" style="font-size: 0.78rem; padding: 0.25rem 0.45rem;">
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button class="btn btn-danger btn-sm delete-loan-btn" data-id="${l.id}" data-code="${l.loan_code}" title="ลบรายการคำขอ" style="font-size: 0.78rem; padding: 0.25rem 0.45rem;">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                  <i class="fa-solid fa-inbox" style="font-size: 2.2rem; color: var(--border-color); display: block; margin-bottom: 0.5rem;"></i>
                  ไม่พบรายการคำขอสำเนาเอกสารทางการศึกษาที่ตรงกับเงื่อนไข
                </td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  initEvents() {
    const addBtn = document.getElementById('add-loan-btn');
    if (addBtn) addBtn.onclick = () => this.openAddLoanModal();

    // Filter Buttons
    const filterAllBtn = document.getElementById('filter-all-btn');
    const filterPendingBtn = document.getElementById('filter-pending-btn');
    const filterCompletedBtn = document.getElementById('filter-completed-btn');

    if (filterAllBtn) {
      filterAllBtn.onclick = () => {
        this.currentFilter = 'all';
        window.location.reload();
      };
    }
    if (filterPendingBtn) {
      filterPendingBtn.onclick = () => {
        this.currentFilter = 'pending';
        window.location.reload();
      };
    }
    if (filterCompletedBtn) {
      filterCompletedBtn.onclick = () => {
        this.currentFilter = 'completed';
        window.location.reload();
      };
    }

    // In-table quick search
    const tableSearch = document.getElementById('loans-table-search');
    if (tableSearch) {
      tableSearch.onkeyup = () => {
        const term = tableSearch.value.toLowerCase();
        const rows = document.querySelectorAll('.loan-row');
        rows.forEach(row => {
          const text = row.innerText.toLowerCase();
          row.style.display = text.includes(term) ? '' : 'none';
        });
      };
    }

    const syncBtn = document.getElementById('sync-loans-sheets-btn');
    if (syncBtn) {
      syncBtn.onclick = () => {
        window.utils.showToast('กำลังซิงก์ประวัติคำขอสำเนาเอกสารลง Google Sheets...', 'info');
        window.db.syncToGoogleSheets().then(() => {
          window.utils.showToast('ซิงก์ข้อมูลคำขอสำเนาเอกสารลง Google Sheets (Loans/Doc_Requests) สำเร็จ!', 'success');
        }).catch(err => {
          window.utils.showToast(`ซิงก์ไม่สำเร็จ: ${err.message}`, 'danger');
        });
      };
    }

    const exportBtn = document.getElementById('export-loans-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const loans = window.db.data.loans || [];
        const exportData = loans.map(l => ({
          'เลขที่คำขอ': l.loan_code ? l.loan_code.replace('LN-', 'REQ-') : '',
          'รหัสนักเรียน': l.student_id,
          'ชื่อนักเรียน': l.student_name,
          'ประเภทเอกสาร': l.doc_type_code,
          'ผู้ขอสำเนา': l.borrower_name,
          'สังกัด/ความสัมพันธ์': l.borrower_dept || '',
          'วันที่ยื่นคำขอ': l.loan_date,
          'วันที่กำหนดรับ': l.return_due_date,
          'วัตถุประสงค์ในการขอ': l.reason,
          'สถานะคำขอ': (l.status === 'borrowed' || l.status === 'pending') ? 'รอดำเนินการออกสำเนา' : 'รับเอกสารแล้ว'
        }));
        window.utils.exportToExcel('รายการคำขอสำเนาเอกสาร_ปพ', 'Doc_Requests', exportData);
      };
    }

    document.querySelectorAll('.edit-loan-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const loan = (window.db.data.loans || []).find(l => l.id == id);
        if (loan) this.openAddLoanModal(loan);
      };
    });

    document.querySelectorAll('.delete-loan-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const code = btn.getAttribute('data-code');
        const displayCode = code ? code.replace('LN-', 'REQ-') : '';
        window.utils.confirmDialog(
          'ยืนยันการลบรายการคำขอ',
          `คุณต้องการลบประวัติคำขอสำเนา <b>${displayCode}</b> ใช่หรือไม่?`,
          async () => {
            window.db.data.loans = window.db.data.loans.filter(l => l.id != id);
            window.db.addAuditLog('คำขอสำเนาเอกสาร', 'ลบคำขอ', `ลบคำขอสำเนา ${displayCode}`);
            window.db.save(false);
            window.utils.showToast('กำลังซิงก์การลบลง Google Sheets...', 'info');
            try {
              await window.db.syncToGoogleSheets();
              window.utils.showToast('ลบรายการคำขอและซิงก์ Google Sheets เรียบร้อยแล้ว', 'success');
            } catch (err) {
              console.warn('Sync on delete loan:', err);
              window.utils.showToast('ลบข้อมูลในเครื่องเรียบร้อยแล้ว', 'warning');
            }
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
              mainContent.innerHTML = this.render();
              this.initEvents();
            }
          }
        );
      };
    });

    document.querySelectorAll('.return-doc-btn').forEach(btn => {
      btn.onclick = () => {
        const loanId = btn.getAttribute('data-id');

        window.utils.confirmDialog(
          'ยืนยันการส่งมอบสำเนาเอกสาร',
          'ต้องการบันทึกว่าได้จัดพิมพ์และส่งมอบฉบับสำเนา/ฉบับจริงให้ผู้ขอเรียบร้อยแล้วหรือไม่?',
          () => {
            const loan = window.db.data.loans.find(l => l.id == loanId);
            if (loan) {
              loan.status = 'returned';
              loan.return_date = new Date().toISOString().slice(0, 10);
              loan.receiver_name = window.authSystem.getCurrentUser() ? window.authSystem.getCurrentUser().first_name : 'เจ้าหน้าที่';
            }

            const reqCodeDisplay = loan && loan.loan_code ? loan.loan_code.replace('LN-', 'REQ-') : '';
            window.db.addAuditLog('คำขอสำเนาเอกสาร', 'ส่งมอบเอกสาร', `อนุมัติและส่งมอบสำเนาเอกสารคำขอ ${reqCodeDisplay} เรียบร้อยแล้ว`);
            window.db.save();
            window.db.syncToGoogleSheets().catch(err => console.warn('Sync on deliver copy:', err));
            window.utils.showToast('บันทึกการส่งมอบสำเนาเอกสารสำเร็จ', 'success');
            window.location.reload();
          }
        );
      };
    });
  },

  openAddLoanModal(loanToEdit = null) {
    const isEdit = !!loanToEdit;
    const docs = window.db.data.documents || [];

    const borrowerVal = isEdit ? loanToEdit.borrower_name : '';
    const deptVal = isEdit ? (loanToEdit.borrower_dept || '') : '';
    const loanDateVal = isEdit ? loanToEdit.loan_date : new Date().toISOString().slice(0, 10);
    const dueDateVal = isEdit ? loanToEdit.return_due_date : new Date(Date.now() + 3*24*60*60*1000).toISOString().slice(0, 10);
    const reasonVal = isEdit ? (loanToEdit.reason || '') : '';

    const bodyHtml = `
      <form id="add-loan-form">
        <div class="form-group">
          <label class="form-label required">เลือกเอกสาร ปพ. / นักเรียนที่ต้องการขอสำเนา</label>
          <div style="position: relative;" id="searchable-doc-wrapper">
            <input type="text" id="modal-loan-doc-search" class="form-control" placeholder="🔍 พิมพ์เพื่อค้นหาชื่อนักเรียน, รหัสนักเรียน หรือเลขที่เอกสาร..." autocomplete="off" ${isEdit ? 'disabled' : ''}>
            <input type="hidden" id="modal-loan-doc" value="${isEdit ? loanToEdit.doc_id : (docs.length ? docs[0].id : '')}">
            
            <div id="searchable-doc-list" style="position: absolute; top: 100%; left: 0; right: 0; max-height: 220px; overflow-y: auto; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; display: none; margin-top: 4px;">
            </div>
          </div>
          <small style="color: var(--text-muted); display: block; margin-top: 4px;">
            <i class="fa-solid fa-magnifying-glass text-primary"></i> สามารถพิมพ์ชื่อ-นามสกุล รหัสนักเรียน หรือประเภทเอกสาร เพื่อค้นหาและเลือกรายการได้ทันที
          </small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">ชื่อผู้ยื่นคำขอสำเนา</label>
            <input type="text" id="modal-loan-borrower" class="form-control" value="${borrowerVal}" placeholder="เช่น นายสมชาย (นักเรียน/ผู้ปกครอง)" required>
          </div>
          <div class="form-group">
            <label class="form-label">ความสัมพันธ์ / สังกัด / เบอร์โทรศัพท์</label>
            <input type="text" id="modal-loan-dept" class="form-control" value="${deptVal}" placeholder="เช่น บิดา / นักเรียนศิษย์เก่า / โทร 081-234-5678">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">วันที่ยื่นคำขอ</label>
            <input type="date" id="modal-loan-date" class="form-control" value="${loanDateVal}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">กำหนดวันนัดหมายรับเอกสาร</label>
            <input type="date" id="modal-loan-due" class="form-control" value="${dueDateVal}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">วัตถุประสงค์ในการขอสำเนาเอกสาร</label>
          <textarea id="modal-loan-reason" class="form-control" required placeholder="เช่น ใช้เป็นหลักฐานประกอบการสมัครเข้าศึกษาต่อในระดับมหาวิทยาลัย / สมัครงาน">${reasonVal}</textarea>
        </div>
      </form>
    `;

    window.utils.openModal(
      isEdit ? `<i class="fa-solid fa-pen-to-square text-primary"></i> แก้ไขคำขอสำเนาเอกสาร` : `<i class="fa-solid fa-file-signature text-primary"></i> ยื่นคำขอสำเนาเอกสารทางการศึกษา (ปพ.)`,
      bodyHtml,
      [
        { text: 'ยกเลิก', class: 'btn btn-secondary' },
        {
          text: isEdit ? 'บันทึกการแก้ไข' : 'บันทึกคำขอสำเนาเอกสาร',
          class: 'btn btn-primary',
          onClick: () => {
            const borrower = document.getElementById('modal-loan-borrower').value.trim();
            const dept = document.getElementById('modal-loan-dept').value.trim();
            const loanDate = document.getElementById('modal-loan-date').value;
            const dueDate = document.getElementById('modal-loan-due').value;
            const reason = document.getElementById('modal-loan-reason').value.trim();

            if (!borrower || !reason) {
              window.utils.showToast('กรุณากรอกชื่อผู้ขอสำเนาและวัตถุประสงค์', 'danger');
              return false;
            }

            if (isEdit) {
              loanToEdit.borrower_name = borrower;
              loanToEdit.borrower_dept = dept;
              loanToEdit.loan_date = loanDate;
              loanToEdit.return_due_date = dueDate;
              loanToEdit.reason = reason;
              window.db.addAuditLog('คำขอสำเนาเอกสาร', 'แก้ไขคำขอ', `แก้ไขข้อมูลคำขอ ${loanToEdit.loan_code ? loanToEdit.loan_code.replace('LN-', 'REQ-') : ''}`);
              window.db.save();
              window.db.syncToGoogleSheets().catch(err => console.warn('Sync loans:', err));
              window.utils.showToast('แก้ไขข้อมูลคำขอสำเนาเรียบร้อยแล้ว', 'success');
              window.location.reload();
              return;
            }

            const docSelect = document.getElementById('modal-loan-doc');
            const docId = docSelect ? docSelect.value : '';
            const docObj = window.db.data.documents.find(d => d.id == docId);
            if (!docObj) {
              window.utils.showToast('กรุณาเลือกเอกสาร ปพ. / นักเรียนที่ต้องการขอสำเนา', 'warning');
              return false;
            }

            const reqNum = String(window.db.data.loans.length + 1).padStart(3, '0');
            const loanCode = `REQ-${new Date().getFullYear()}-${reqNum}`;
            window.db.data.loans.unshift({
              id: window.db.data.loans.length + 1,
              loan_code: loanCode,
              doc_id: docObj.id,
              student_id: docObj.student_id,
              student_name: docObj.student_name,
              doc_type_code: docObj.doc_type_code,
              doc_number: docObj.doc_number,
              borrower_name: borrower,
              borrower_dept: dept,
              loan_date: loanDate,
              loan_time: new Date().toLocaleTimeString('th-TH').slice(0, 5),
              reason: reason,
              return_due_date: dueDate,
              status: 'pending'
            });

            window.db.addAuditLog('คำขอสำเนาเอกสาร', 'เพิ่มคำขอสำเนา', `บันทึกคำขอสำเนาเอกสาร ${docObj.doc_code} โดย ${borrower}`);
            window.db.save();
            window.db.syncToGoogleSheets().catch(err => console.warn('Sync loans:', err));
            window.utils.showToast(`บันทึกคำขอสำเนาเอกสาร ${docObj.doc_code} เรียบร้อยแล้ว`, 'success');
            window.location.reload();
          }
        }
      ]
    );

    setTimeout(() => {
      const searchInput = document.getElementById('modal-loan-doc-search');
      const hiddenInput = document.getElementById('modal-loan-doc');
      const listContainer = document.getElementById('searchable-doc-list');

      if (searchInput && hiddenInput && listContainer) {
        const currentDocId = hiddenInput.value;
        const currentDoc = docs.find(d => d.id == currentDocId);
        if (currentDoc) {
          searchInput.value = `${currentDoc.doc_code} (${currentDoc.doc_type_code}) - ${currentDoc.student_name}`;
        }

        const renderList = (filterText = '') => {
          const q = filterText.toLowerCase().trim();
          const filtered = docs.filter(d => 
            !q || 
            (d.student_name || '').toLowerCase().includes(q) || 
            (d.doc_code || '').toLowerCase().includes(q) || 
            (d.student_id || '').toLowerCase().includes(q) || 
            (d.doc_type_code || '').toLowerCase().includes(q)
          );

          if (!filtered.length) {
            listContainer.innerHTML = `<div style="padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;"><i class="fa-solid fa-circle-exclamation text-warning"></i> ไม่พบเอกสารนักเรียนที่ตรงกับคำค้นหา</div>`;
          } else {
            listContainer.innerHTML = filtered.map(d => `
              <div class="searchable-doc-item" data-id="${d.id}" data-text="${d.doc_code} (${d.doc_type_code}) - ${d.student_name}" style="padding: 0.65rem 1rem; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; transition: background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
                <strong style="color: var(--primary-800);">${d.doc_code}</strong> <span class="badge badge-secondary">${d.doc_type_code}</span> — <span>${d.student_name}</span> (รหัส: ${d.student_id})
              </div>
            `).join('');

            listContainer.querySelectorAll('.searchable-doc-item').forEach(item => {
              item.onclick = () => {
                const id = item.getAttribute('data-id');
                const text = item.getAttribute('data-text');
                hiddenInput.value = id;
                searchInput.value = text;
                listContainer.style.display = 'none';
              };
            });
          }
        };

        if (!isEdit) {
          searchInput.onfocus = () => {
            renderList(searchInput.value);
            listContainer.style.display = 'block';
          };

          searchInput.oninput = () => {
            renderList(searchInput.value);
            listContainer.style.display = 'block';
          };

          document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('searchable-doc-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
              listContainer.style.display = 'none';
            }
          });
        }
      }
    }, 100);
  }
};

window.loansView = loansView;
