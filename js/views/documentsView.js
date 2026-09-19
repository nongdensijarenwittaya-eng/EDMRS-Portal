/* ==========================================================================
   EDMRS - Por.Por. Document Registry View Controller (js/views/documentsView.js)
   Pure CRUD for Documents (Google Sheets Backend)
   ========================================================================== */

const documentsView = {
  currentPage: 1,
  pageSize: 10,
  filterState: {
    search: '',
    doc_type_code: '',
    academic_year: '',
    status: ''
  },

  render(params = {}) {
    if (params && Object.keys(params).length > 0) {
      if (params.doc_type_code !== undefined) this.filterState.doc_type_code = params.doc_type_code;
      if (params.status !== undefined) this.filterState.status = params.status;
      if (params.academic_year !== undefined) this.filterState.academic_year = params.academic_year;
      if (params.search !== undefined) this.filterState.search = params.search;
    } else if (window.location.hash === '#documents') {
      this.filterState.doc_type_code = '';
      this.filterState.status = '';
      this.filterState.academic_year = '';
      this.filterState.search = '';
    }

    const allFilteredDocs = this.getFilteredDocuments();
    const totalDocs = allFilteredDocs.length;
    const totalPages = Math.ceil(totalDocs / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const docs = allFilteredDocs.slice(startIndex, startIndex + this.pageSize);

    const docTypes = window.db.data.document_types || [];
    const allDocsData = (window.db && window.db.data && window.db.data.documents) ? window.db.data.documents : [];
    const academicYearsList = (window.db && window.db.data && window.db.data.academic_years) ? window.db.data.academic_years : [];

    const yearsInData = Array.from(new Set([
      ...academicYearsList.map(y => y.year),
      ...allDocsData.map(d => d.academic_year)
    ])).filter(Boolean).sort().reverse();

    const canCreate = window.authSystem.hasPermission('create_documents');
    const canEdit = window.authSystem.hasPermission('edit_documents');
    const canDelete = window.authSystem.hasPermission('delete_documents');

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-file-invoice text-primary"></i> ทะเบียนเอกสาร ปพ.
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            บริหารจัดการทะเบียนจัดเก็บเอกสาร ปพ.1 ถึง ปพ.9 และเชื่อมโยงตำแหน่งจัดเก็บ
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="batch-delete-docs-btn" class="btn btn-danger btn-sm" style="display: none;">
            <i class="fa-solid fa-trash-can"></i> ลบรายการที่เลือก (<span id="selected-doc-count">0</span>)
          </button>
          <button id="export-docs-excel-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-file-excel text-success"></i> ส่งออก Excel
          </button>
          ${canCreate ? `
            <button id="add-doc-btn" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-plus"></i> เพิ่มทะเบียนเอกสารใหม่
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.25rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; align-items: end;">
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ค้นหา (รหัสเอกสาร/เล่ม/เลขที่/Location)</label>
            <input type="text" id="doc-search-input" class="form-control" placeholder="พิมพ์คำค้นหา..." value="${this.filterState.search}">
          </div>
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ประเภท ปพ.</label>
            <select id="doc-filter-type" class="form-control">
              <option value="">-- ทุกประเภท ปพ. --</option>
              ${docTypes.map(t => `<option value="${t.code}" ${this.filterState.doc_type_code === t.code ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ปีการศึกษา</label>
            <select id="doc-filter-year" class="form-control">
              <option value="">-- ทุกปีการศึกษา --</option>
              ${yearsInData.map(y => `<option value="${y}" ${this.filterState.academic_year === y ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.8rem;">สถานะเอกสาร</label>
            <select id="doc-filter-status" class="form-control">
              <option value="">-- ทุกสถานะ --</option>
              <option value="stored" ${this.filterState.status === 'stored' ? 'selected' : ''}>จัดเก็บแล้ว</option>
              <option value="pending" ${this.filterState.status === 'pending' ? 'selected' : ''}>รอตรวจสอบ</option>
              <option value="missing" ${this.filterState.status === 'missing' ? 'selected' : ''}>ไม่พบเอกสาร</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Documents Data Table -->
      <div class="card" style="padding: 0;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 36px; text-align: center;"><input type="checkbox" id="select-all-docs-cb" style="cursor: pointer;"></th>
                <th>รหัสเอกสาร</th>
                <th>ประเภท</th>
                <th>ปีการศึกษา</th>
                <th>เล่มที่ / เลขที่</th>
                <th>สถานะ</th>
                <th>Location Code</th>
                <th style="text-align: center;">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${docs.length ? docs.map(d => `
                <tr>
                  <td style="text-align: center;"><input type="checkbox" class="doc-row-cb" value="${d.doc_code}" style="cursor: pointer;"></td>
                  <td><strong>${d.doc_code}</strong></td>
                  <td><span class="badge badge-secondary">${d.doc_type_code}</span></td>
                  <td>${d.academic_year}</td>
                  <td>เล่ม ${d.book_number || '-'} / เลขที่ ${d.doc_number}</td>
                  <td>${window.utils.getStatusBadge(d.status)}</td>
                  <td><code style="font-weight: 600; color: var(--primary-800);">${d.location_code || '-'}</code></td>
                  <td style="text-align: center;">
                    <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
                      <a href="#locations" class="btn btn-secondary btn-sm" title="สถานที่จัดเก็บ">
                        <i class="fa-solid fa-boxes-stacked"></i>
                      </a>
                      ${canEdit ? `
                        <button class="btn btn-warning btn-sm edit-doc-btn" data-id="${d.id}" title="แก้ไขเอกสาร">
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                      ` : ''}
                      ${canDelete ? `
                        <button class="btn btn-danger btn-sm delete-doc-btn" data-id="${d.id}" data-code="${d.doc_code}" title="ลบเอกสาร">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    ไม่พบรายการเอกสาร ปพ. ตามเงื่อนไข
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-container" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>แสดง ${totalDocs ? startIndex + 1 : 0} ถึง ${Math.min(startIndex + this.pageSize, totalDocs)} จากทั้งหมด ${totalDocs} รายการ</span>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; margin-left: 1rem;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">จำนวนต่อหน้า:</span>
              <select id="doc-page-size-select" class="form-control" style="width: auto; padding: 0.2rem 0.5rem; font-size: 0.85rem; height: auto;">
                <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10 รายการ</option>
                <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25 รายการ</option>
                <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50 รายการ</option>
                <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100 รายการ</option>
                <option value="500" ${this.pageSize === 500 ? 'selected' : ''}>500 รายการ</option>
                <option value="1000" ${this.pageSize === 1000 ? 'selected' : ''}>1,000 รายการ</option>
                <option value="999999" ${this.pageSize >= 999999 ? 'selected' : ''}>♾️ แสดงทั้งหมด (ไม่จำกัด)</option>
              </select>
            </div>
          </div>
          <div class="pagination-controls">
            <button class="page-btn" id="prev-doc-page-btn" ${this.currentPage === 1 ? 'disabled' : ''}>
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span style="font-size: 0.85rem; padding: 0 0.5rem;">หน้า ${this.currentPage} / ${totalPages}</span>
            <button class="page-btn" id="next-doc-page-btn" ${this.currentPage === totalPages ? 'disabled' : ''}>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  getFilteredDocuments() {
    let docs = window.db.getDocuments();
    if (this.filterState.search) {
      const q = String(this.filterState.search).toLowerCase().trim();
      docs = docs.filter(d =>
        d && (
          String(d.doc_code || '').toLowerCase().includes(q) ||
          String(d.student_id || '').toLowerCase().includes(q) ||
          String(d.student_name || '').toLowerCase().includes(q) ||
          String(d.doc_number || '').toLowerCase().includes(q) ||
          String(d.location_code || '').toLowerCase().includes(q)
        )
      );
    }
    if (this.filterState.doc_type_code) {
      docs = docs.filter(d => d.doc_type_code === this.filterState.doc_type_code);
    }
    if (this.filterState.academic_year) {
      docs = docs.filter(d => String(d.academic_year) === String(this.filterState.academic_year));
    }
    if (this.filterState.status) {
      docs = docs.filter(d => d.status === this.filterState.status);
    }
    return docs;
  },

  initEvents() {
    const searchInput = document.getElementById('doc-search-input');
    const filterType = document.getElementById('doc-filter-type');
    const filterYear = document.getElementById('doc-filter-year');
    const filterStatus = document.getElementById('doc-filter-status');
    const pageSizeSelect = document.getElementById('doc-page-size-select');
    const prevBtn = document.getElementById('prev-doc-page-btn');
    const nextBtn = document.getElementById('next-doc-page-btn');

    const updateFilters = () => {
      this.filterState.search = searchInput ? searchInput.value : '';
      this.filterState.doc_type_code = filterType ? filterType.value : '';
      this.filterState.academic_year = filterYear ? filterYear.value : '';
      this.filterState.status = filterStatus ? filterStatus.value : '';
      this.currentPage = 1;
      this.refreshTable();
    };

    if (pageSizeSelect) {
      pageSizeSelect.onchange = (e) => {
        this.pageSize = parseInt(e.target.value, 10) || 10;
        this.currentPage = 1;
        this.refreshTable();
      };
    }

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.refreshTable();
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        this.currentPage++;
        this.refreshTable();
      };
    }

    if (searchInput) searchInput.oninput = updateFilters;
    if (filterType) filterType.onchange = updateFilters;
    if (filterYear) filterYear.onchange = updateFilters;
    if (filterStatus) filterStatus.onchange = updateFilters;

    const addBtn = document.getElementById('add-doc-btn');
    if (addBtn) addBtn.onclick = () => this.openAddDocModal();

    const exportBtn = document.getElementById('export-docs-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const docs = this.getFilteredDocuments();
        const exportData = docs.map(d => ({
          'รหัสเอกสาร': d.doc_code,
          'รหัสนักเรียน': d.student_id,
          'ชื่อนักเรียน': d.student_name,
          'ประเภท': d.doc_type_code,
          'ปีการศึกษา': d.academic_year,
          'เล่มที่': d.book_number,
          'เลขที่เอกสาร': d.doc_number,
          'สถานะ': d.status === 'stored' ? 'จัดเก็บแล้ว' : d.status === 'pending' ? 'รอตรวจสอบ' : 'ไม่พบเอกสาร',
          'Location Code': d.location_code
        }));
        window.utils.exportToExcel('Document_Registry', 'Documents', exportData);
      };
    }

    document.querySelectorAll('.edit-doc-btn').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const docToEdit = (window.db.data.documents || []).find(d => d.id == id);
        if (docToEdit) this.openAddDocModal(docToEdit);
      };
    });

    document.querySelectorAll('.delete-doc-btn').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const docCode = e.currentTarget.getAttribute('data-code');
        const docObj = (window.db.data.documents || []).find(d => d.id == id || d.doc_code === docCode);

        window.utils.confirmDialog(
          'ยืนยันการลบรายการเอกสาร',
          `คุณต้องการลบรายการเอกสาร <b>${docCode || (docObj ? docObj.doc_number : '')}</b> ออกจากระบบใช่หรือไม่?`,
          async () => {
            if (!window.db.data.deleted_keys) window.db.data.deleted_keys = {};
            if (!window.db.data.deleted_keys.documents) window.db.data.deleted_keys.documents = [];
            const keyToDelete = docCode || (docObj ? docObj.doc_code : '');
            if (keyToDelete && !window.db.data.deleted_keys.documents.includes(keyToDelete)) {
              window.db.data.deleted_keys.documents.push(keyToDelete);
            }

            window.db.data.documents = (window.db.data.documents || []).filter(d => d.id != id && d.doc_code !== docCode);
            window.db.addAuditLog('เอกสาร ปพ.', 'ลบเอกสาร', `ลบเอกสาร ${docCode}`);
            window.db.saveLocal();

            window.utils.showToast('กำลังลบข้อมูลออกจาก Google Sheets...', 'info');
            try {
              await window.db.syncToGoogleSheets(null, 'delete');
              window.utils.showToast('ลบรายการเอกสารสำเร็จ!', 'success');
            } catch (err) {
              window.utils.showToast(`บันทึกในเครื่องแล้ว (พบปัญหาซิงก์ Cloud: ${err.message})`, 'warning');
            }
            this.refreshTable();
          }
        );
      };
    });

    const selectAllCb = document.getElementById('select-all-docs-cb');
    const rowCbs = document.querySelectorAll('.doc-row-cb');
    const batchDelBtn = document.getElementById('batch-delete-docs-btn');
    const selectedCountSpan = document.getElementById('selected-doc-count');

    const updateBatchBtn = () => {
      const selected = Array.from(document.querySelectorAll('.doc-row-cb:checked')).map(cb => cb.value);
      if (batchDelBtn && selectedCountSpan) {
        selectedCountSpan.textContent = selected.length;
        batchDelBtn.style.display = selected.length > 0 ? 'inline-flex' : 'none';
      }
    };

    if (selectAllCb) {
      selectAllCb.onchange = () => {
        rowCbs.forEach(cb => cb.checked = selectAllCb.checked);
        updateBatchBtn();
      };
    }

    rowCbs.forEach(cb => cb.onchange = updateBatchBtn);

    if (batchDelBtn) {
      batchDelBtn.onclick = () => {
        const selectedCodes = Array.from(document.querySelectorAll('.doc-row-cb:checked')).map(cb => cb.value);
        if (selectedCodes.length === 0) return;

        window.utils.confirmDialog(
          'ยืนยันการลบเอกสารกลุ่ม',
          `คุณต้องการลบรายการเอกสารที่เลือกทั้งหมด <b>${selectedCodes.length} รายการ</b> ออกจากระบบใช่หรือไม่?`,
          async () => {
            batchDelBtn.disabled = true;
            batchDelBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังลบ...';
            try {
              await window.db.deleteDocumentsBatch(selectedCodes);
              window.utils.showToast(`ลบรายการเอกสาร ${selectedCodes.length} รายการ เรียบร้อยแล้ว`, 'success');
              this.refreshTable();
            } catch (err) {
              window.utils.showToast(`เกิดข้อผิดพลาดในการลบกลุ่ม: ${err.message}`, 'danger');
              batchDelBtn.disabled = false;
            }
          }
        );
      };
    }
  },

  refreshTable() {
    const searchEl = document.getElementById('doc-search-input');
    const cursorPos = searchEl ? searchEl.selectionStart : null;
    const isFocused = searchEl && document.activeElement === searchEl;

    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = this.render();
      this.initEvents();

      if (isFocused) {
        const newSearchEl = document.getElementById('doc-search-input');
        if (newSearchEl) {
          newSearchEl.focus();
          if (cursorPos !== null) newSearchEl.setSelectionRange(cursorPos, cursorPos);
        }
      }
    }
  },

  openAddDocModal(docToEdit = null) {
    const isEdit = !!docToEdit;
    const docTypes = window.db.data.document_types || [];
    const locations = window.db.data.storage_locations || [];

    const docTypeVal = docToEdit ? docToEdit.doc_type_code : (docTypes[0] ? docTypes[0].code : 'ปพ.1');
    const gradYearVal = docToEdit ? docToEdit.academic_year : '2569';
    const setNoVal = docToEdit ? docToEdit.book_number : '01';
    const docNumVal = docToEdit ? docToEdit.doc_number : '001';
    const locVal = docToEdit ? docToEdit.location_code : (locations[0] ? locations[0].code : '');
    const statusVal = docToEdit ? docToEdit.status : 'stored';
    const studentIdVal = docToEdit ? docToEdit.student_id : '';
    const studentNameVal = docToEdit ? docToEdit.student_name : '';

    const bodyHtml = `
      <form id="doc-modal-form">
        <div class="card" style="padding: 1rem; background: var(--bg-app); border: 1px solid var(--border-color); margin-bottom: 1rem;">
          <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--primary-900); margin-bottom: 0.75rem;">
            <i class="fa-solid fa-user-graduate text-primary"></i> ข้อมูลนักเรียนผู้ครอบครองเอกสาร
          </h5>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">รหัสนักเรียน (ถ้ามี)</label>
              <input type="text" id="modal-doc-student-id" class="form-control" placeholder="เช่น 65001" value="${studentIdVal}">
            </div>
            <div class="form-group">
              <label class="form-label">ชื่อ-นามสกุล นักเรียน</label>
              <input type="text" id="modal-doc-student-name" class="form-control" placeholder="เช่น นายสมชาย ใจดี" value="${studentNameVal}">
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">ประเภทเอกสาร ปพ.</label>
            <select id="modal-doc-type" class="form-control" required>
              ${docTypes.map(t => `<option value="${t.code}" ${t.code === docTypeVal ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">ปีการศึกษา (พ.ศ.)</label>
            <input type="text" id="modal-doc-grad-year" class="form-control" placeholder="เช่น 2569" value="${gradYearVal}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">เล่มชุดที่ (Book No.)</label>
            <input type="text" id="modal-doc-set-no" class="form-control" placeholder="เช่น 01" value="${setNoVal}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">เลขที่เอกสาร (Doc No.)</label>
            <input type="text" id="modal-doc-number" class="form-control" placeholder="เช่น 001" value="${docNumVal}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">ตำแหน่งสถานที่จัดเก็บ (Location Code)</label>
            <select id="modal-doc-location" class="form-control" required>
              ${locations.map(l => `<option value="${l.code}" ${l.code === locVal ? 'selected' : ''}>${l.code} - ${l.building} (${l.cabinet}/${l.shelf})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">สถานะเอกสาร</label>
            <select id="modal-doc-status" class="form-control" required>
              <option value="stored" ${statusVal === 'stored' ? 'selected' : ''}>จัดเก็บแล้ว</option>
              <option value="pending" ${statusVal === 'pending' ? 'selected' : ''}>รอตรวจสอบ</option>
              <option value="missing" ${statusVal === 'missing' ? 'selected' : ''}>ไม่พบเอกสาร</option>
            </select>
          </div>
        </div>
      </form>
    `;

    window.utils.openModal(
      isEdit ? `<i class="fa-solid fa-pen-to-square text-primary"></i> แก้ไขข้อมูลเอกสาร ปพ.` : `<i class="fa-solid fa-plus text-primary"></i> เพิ่มทะเบียนเอกสาร ปพ. ใหม่`,
      bodyHtml,
      [
        { text: 'ยกเลิก', class: 'btn btn-secondary' },
        {
          text: isEdit ? '<i class="fa-solid fa-floppy-disk"></i> บันทึกการแก้ไข' : '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูล',
          class: 'btn btn-primary',
          id: 'save-doc-submit-btn',
          onClick: async () => {
            const saveBtn = document.getElementById('save-doc-submit-btn');
            let studentId = document.getElementById('modal-doc-student-id').value.trim();
            let studentName = document.getElementById('modal-doc-student-name').value.trim();
            let gradYear = document.getElementById('modal-doc-grad-year').value.trim() || '2569';
            let setNo = document.getElementById('modal-doc-set-no').value.trim() || '01';
            let docNum = document.getElementById('modal-doc-number').value.trim() || String(Date.now()).slice(-4);
            let docTypeCode = document.getElementById('modal-doc-type').value;
            let locationCode = document.getElementById('modal-doc-location').value;
            let status = document.getElementById('modal-doc-status').value;

            if (saveBtn) {
              saveBtn.disabled = true;
              saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
            }

            const typeInfo = window.db ? window.db.normalizeDocType(docTypeCode) : { code: docTypeCode.replace('.', ''), name: docTypeCode };
            const docCode = isEdit ? docToEdit.doc_code : `DOC-${typeInfo.code}-${gradYear}-${setNo}-${docNum}`;

            try {
              if (isEdit) {
                docToEdit.student_id = studentId;
                docToEdit.student_name = studentName;
                docToEdit.academic_year = gradYear;
                docToEdit.book_number = setNo;
                docToEdit.doc_number = docNum;
                docToEdit.doc_type_code = docTypeCode;
                docToEdit.location_code = locationCode;
                docToEdit.status = status;
                docToEdit.updated_at = new Date().toISOString();
                window.db.addAuditLog('เอกสาร ปพ.', 'แก้ไขเอกสาร', `แก้ไขเอกสาร ${docCode}`);
              } else {
                const newDoc = {
                  id: (window.db.data.documents || []).length + 1,
                  doc_code: docCode,
                  student_id: studentId,
                  student_name: studentName,
                  doc_type_code: docTypeCode,
                  academic_year: gradYear,
                  book_number: setNo,
                  doc_number: docNum,
                  status: status,
                  location_code: locationCode,
                  updated_at: new Date().toISOString()
                };
                if (!window.db.data.documents) window.db.data.documents = [];
                window.db.data.documents.unshift(newDoc);
                window.db.addAuditLog('เอกสาร ปพ.', 'เพิ่มเอกสาร', `เพิ่มเอกสารใหม่ ${docCode}`);
              }

              window.db.saveLocal();
              window.utils.showToast('กำลังส่งข้อมูลลง Google Sheets...', 'info');
              await window.db.syncToGoogleSheets(null, isEdit ? 'update' : 'create');
              window.utils.showToast('บันทึกข้อมูลเอกสาร ปพ. สำเร็จ!', 'success');
              window.utils.closeModal();
              this.refreshTable();
            } catch (err) {
              window.utils.showToast(`บันทึกในเครื่องแล้ว (พบปัญหา Cloud: ${err.message})`, 'warning');
              window.utils.closeModal();
              this.refreshTable();
            } finally {
              if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = isEdit ? '<i class="fa-solid fa-floppy-disk"></i> บันทึกการแก้ไข' : '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูล';
              }
            }
          }
        }
      ]
    );
  }
};

window.documentsView = documentsView;
