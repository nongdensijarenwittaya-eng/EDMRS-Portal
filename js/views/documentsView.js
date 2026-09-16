/* ==========================================================================
   EDMRS - Por.Por. Document Registry View Controller (js/views/documentsView.js)
   CRUD for documents, file uploads, document type manager & storage linking
   ========================================================================== */

const documentsView = {
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

    const docs = window.db.getDocuments(this.filterState);
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
    const canManageTypes = window.authSystem.hasPermission('manage_settings');

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-file-invoice text-primary"></i> ทะเบียนเอกสาร ปพ.
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            ทะเบียนจัดเก็บเอกสาร ปพ.1 ถึง ปพ.9 เอกสารดิจิทัล และตำแหน่งสถานที่จัดเก็บ
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="add-ocr-scan-btn" class="btn btn-warning btn-sm" style="font-weight: 600;">
            <i class="fa-solid fa-wand-magic-sparkles"></i> ⚡ สแกนอ่านไฟล์ ปพ.
          </button>
          ${canManageTypes ? `
            <button id="manage-doc-types-btn" class="btn btn-secondary btn-sm">
              <i class="fa-solid fa-sliders text-warning"></i> จัดการประเภทเอกสาร
            </button>
          ` : ''}
          <button id="export-docs-excel-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-file-excel text-success"></i> ส่งออก Excel
          </button>
          ${canCreate ? `
            <button id="add-doc-btn" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-plus"></i> เพิ่มทะเบียนเอกสาร
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
              <option value="borrowed" ${this.filterState.status === 'borrowed' ? 'selected' : ''}>มีคำขอสำเนา</option>
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
                <th>รหัสเอกสาร</th>
                <th>ประเภท</th>
                <th>ปีการศึกษา</th>
                <th>เล่มที่ / เลขที่</th>
                <th>สถานะ</th>
                <th>Location Code</th>
                <th style="text-align: center;">จัดการ / ไฟล์</th>
              </tr>
            </thead>
            <tbody>
              ${docs.length ? docs.map(d => `
                <tr>
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
                      <button class="btn btn-light btn-sm preview-doc-pdf-btn" data-file="${d.file_name}" data-code="${d.doc_code}" data-url="${d.file_url || ''}" title="ดูไฟล์ดิจิทัล (Drive/PDF/JPG)">
                        ${window.utils.isDriveUrl(d.file_url) ? '<i class="fa-brands fa-google-drive text-success" style="font-size: 1.1rem;"></i>' : '<i class="fa-solid fa-file-pdf text-danger"></i>'}
                      </button>
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
      </div>
    `;
  },

  initEvents() {
    const searchInput = document.getElementById('doc-search-input');
    const filterType = document.getElementById('doc-filter-type');
    const filterYear = document.getElementById('doc-filter-year');
    const filterStatus = document.getElementById('doc-filter-status');

    const updateFilters = () => {
      this.filterState.search = searchInput.value;
      this.filterState.doc_type_code = filterType.value;
      this.filterState.academic_year = filterYear.value;
      this.filterState.status = filterStatus.value;
      this.refreshTable();
    };

    if (searchInput) searchInput.oninput = updateFilters;
    if (filterType) filterType.onchange = updateFilters;
    if (filterYear) filterYear.onchange = updateFilters;
    if (filterStatus) filterStatus.onchange = updateFilters;

    const addBtn = document.getElementById('add-doc-btn');
    if (addBtn) addBtn.onclick = () => this.openAddDocModal();

    const ocrScanBtn = document.getElementById('add-ocr-scan-btn');
    if (ocrScanBtn) ocrScanBtn.onclick = () => this.openAddDocModal();

    const manageTypesBtn = document.getElementById('manage-doc-types-btn');
    if (manageTypesBtn) manageTypesBtn.onclick = () => this.openManageDocTypesModal();

    const exportBtn = document.getElementById('export-docs-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const docs = window.db.getDocuments(this.filterState);
        const exportData = docs.map(d => ({
          'รหัสเอกสาร': d.doc_code,
          'รหัสนักเรียน': d.student_id,
          'ชื่อนักเรียน': d.student_name,
          'ประเภท': d.doc_type_code,
          'ปีการศึกษา': d.academic_year,
          'เล่มที่': d.book_number,
          'เลขที่': d.doc_number,
          'สถานะ': d.status,
          'Location Code': d.location_code,
          'Google Drive Link': d.file_url || ''
        }));
        window.utils.exportToExcel('ทะเบียนเอกสาร_ปพ', 'Documents', exportData);
      };
    }

    document.querySelectorAll('.preview-doc-pdf-btn').forEach(btn => {
      btn.onclick = () => {
        const file = btn.getAttribute('data-file');
        const code = btn.getAttribute('data-code');
        const url = btn.getAttribute('data-url');
        const doc = (window.db.data.documents || []).find(d => d.doc_code === code);
        const urlBack = doc ? doc.file_url_back : '';
        window.utils.openFilePreviewModal(url, file, code, urlBack);
      };
    });

    document.querySelectorAll('.edit-doc-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const doc = (window.db.data.documents || []).find(d => d.id == id);
        if (doc) this.openAddDocModal(doc);
      };
    });

    document.querySelectorAll('.delete-doc-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const code = btn.getAttribute('data-code');
        window.utils.confirmDialog(
          'ยืนยันการลบเอกสาร',
          `คุณต้องการลบเอกสารรหัส <b>${code}</b> ใช่หรือไม่?`,
          async () => {
            window.db.deleteDocument(code, id);
            window.utils.showToast('กำลังซิงก์การลบลง Google Sheets...', 'info');
            try {
              await window.db.syncToGoogleSheets();
              window.utils.showToast('ลบเอกสารและซิงก์ Google Sheets เรียบร้อยแล้ว', 'success');
            } catch (err) {
              console.warn('Sync on delete:', err);
              window.utils.showToast('ลบข้อมูลในเครื่องเรียบร้อยแล้ว', 'warning');
            }
            this.refreshTable();
          }
        );
      };
    });
  },

  refreshTable() {
    if (window.location.hash.includes('#student-detail')) {
      const main = document.getElementById('main-content');
      if (main && window.studentDetailView) {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        main.innerHTML = window.studentDetailView.render({ id: params.get('id') });
        window.studentDetailView.initEvents();
      }
      return;
    }
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = this.render();
      this.initEvents();
    }
  },

  openAddDocModal(docToEdit = null) {
    const isEdit = !!(docToEdit && docToEdit.id);
    const students = window.db.data.students || [];
    const docTypes = window.db.data.document_types || [];
    const locations = window.db.data.storage_locations || [];
    const books = window.db.data.books || [];

    const stdIdVal = docToEdit ? docToEdit.student_id : '';
    const stdNameVal = docToEdit ? docToEdit.student_name : '';
    const gradYearVal = docToEdit ? docToEdit.academic_year : '';
    const setNoVal = docToEdit ? (docToEdit.book_number || '') : '';
    const docNumVal = docToEdit ? docToEdit.doc_number : '';
    const docTypeVal = isEdit ? docToEdit.doc_type_code : (docTypes[0] ? docTypes[0].code : 'ปพ.1');
    const locVal = isEdit ? docToEdit.location_code : (locations[0] ? locations[0].code : '');
    const statusVal = isEdit ? docToEdit.status : 'stored';
    const driveUrlValInit = docToEdit ? (docToEdit.file_url || '') : '';

    const bodyHtml = `
      <form id="add-doc-form">
        <!-- AI OCR Smart Scan & File Reader Header Card -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%); color: white; padding: 1rem 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.5rem; color: #ffffff;">
            <i class="fa-solid fa-wand-magic-sparkles text-warning"></i> อัปโหลดไฟล์เอกสาร ปพ. (ระบบอ่านไฟล์สแกนอัตโนมัติ ด้วย AI OCR)
          </h4>
          <p style="font-size: 0.8rem; color: #e0f2fe; margin-bottom: 0.75rem;">
            เลือกไฟล์สแกน (PDF, JPG, PNG) หรือถ่ายภาพจากกล้อง เพื่อให้ระบบดึงข้อมูล 1. ปีที่สำเร็จการศึกษา 2. ชุดที่ และ 3. เลขที่ ลงในแบบฟอร์มโดยอัตโนมัติ
          </p>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
            <button type="button" id="scan-mode-upload-btn" class="btn btn-warning btn-sm" style="font-weight: 600;">
              <i class="fa-solid fa-folder-open"></i> เลือกไฟล์สแกน (PDF / JPG / PNG)
            </button>
            <button type="button" id="scan-mode-drive-btn" class="btn btn-info btn-sm">
              <i class="fa-brands fa-google-drive"></i> วางลิงก์จาก Google Drive
            </button>
            <button type="button" id="scan-mode-camera-btn" class="btn btn-light btn-sm">
              <i class="fa-solid fa-camera"></i> ถ่ายสแกนด้วยกล้อง
            </button>
            <button type="button" id="scan-mode-device-btn" class="btn btn-light btn-sm">
              <i class="fa-solid fa-print"></i> ดึงจากเครื่องสแกนเนอร์
            </button>
          </div>

          <input type="file" id="modal-doc-file" class="form-control" accept=".pdf,.jpg,.jpeg,.png" style="display: none;">

          <div id="drive-link-input-box" style="display: none; background: rgba(255,255,255,0.15); padding: 0.75rem 0.85rem; border-radius: 6px; margin-top: 0.5rem;">
            <label style="font-size: 0.8rem; color: #ffffff; display: block; margin-bottom: 0.35rem; font-weight: 500;">
              <i class="fa-brands fa-google-drive text-warning"></i> วาง URL/ลิงก์ไฟล์หรือรูปภาพจาก Google Drive:
            </label>
            <div style="display: flex; gap: 0.5rem;">
              <input type="url" id="modal-doc-drive-url" class="form-control" placeholder="https://drive.google.com/file/d/.../view หรือ https://drive.google.com/open?id=..." style="background: white; color: #0f172a; font-size: 0.85rem;">
              <button type="button" id="apply-drive-url-btn" class="btn btn-warning btn-sm" style="white-space: nowrap; font-weight: 600;">
                <i class="fa-solid fa-check"></i> ใช้งานลิงก์นี้
              </button>
            </div>
          </div>

          <div id="ocr-status-progress" style="display: none; background: rgba(255,255,255,0.15); padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 0.8rem; margin-top: 0.5rem; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-spinner fa-spin text-warning"></i>
            <span id="ocr-status-text">กำลังสแกนและอ่านข้อมูลจากไฟล์เอกสาร ปพ.ด้วย AI OCR...</span>
          </div>
        </div>

        <!-- Document Form Grid (Year, Set, Doc Number) -->
        <div class="card" style="padding: 1rem; border: 1px solid var(--primary-200); background: #f8fafc; margin-bottom: 1rem;">
          <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--primary-900); margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
            <span><i class="fa-solid fa-clipboard-check text-primary"></i> ข้อมูลบันทึกรายการหลัก (ปีการศึกษา / เล่มชุดที่ / เลขที่)</span>
            <span id="ocr-result-badge" class="badge badge-success" style="display: none;"><i class="fa-solid fa-circle-check"></i> ดึงข้อมูลอัตโนมัติสำเร็จ</span>
          </h5>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">1. ปีที่สำเร็จการศึกษา</label>
              <input type="text" id="modal-doc-grad-year" class="form-control" placeholder="ปีการศึกษา (พ.ศ.)" value="${gradYearVal}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">2. ชุดที่ (เล่มชุดที่)</label>
              <input type="text" id="modal-doc-set-no" class="form-control" placeholder="ชุดที่" value="${setNoVal}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">3. เลขที่</label>
              <input type="text" id="modal-doc-number" class="form-control" placeholder="เลขที่" value="${docNumVal}" required>
            </div>
          </div>
        </div>

        <!-- Additional Registry Storage Info -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">ประเภทเอกสาร ปพ.</label>
            <select id="modal-doc-type" class="form-control" required>
              ${docTypes.map(t => `<option value="${t.code}" ${t.code === docTypeVal ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">ตำแหน่งสถานที่จัดเก็บ (Location)</label>
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

        <div id="file-scan-preview-box" style="display: none; background: white; padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); align-items: center; justify-content: space-between; margin-top: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-file-pdf text-danger" style="font-size: 2rem;" id="preview-file-icon"></i>
            <div>
              <strong id="preview-file-name" style="font-size: 0.9rem; color: var(--primary-900);">doc.pdf</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);" id="preview-file-size">1.2 MB | อ่านข้อมูลสำเร็จ</div>
            </div>
          </div>
          <span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> พร้อมบันทึก</span>
        </div>
      </form>
    `;

    window.utils.openModal(
      isEdit ? `<i class="fa-solid fa-pen-to-square text-primary"></i> แก้ไขข้อมูลเอกสาร ปพ.` : `<i class="fa-solid fa-file-circle-plus text-primary"></i> ระบบจัดเก็บข้อมูลเอกสารและไฟล์สแกนใบ ปพ.`,
      bodyHtml,
      [
        { text: 'ยกเลิก', class: 'btn btn-secondary' },
        {
          text: isEdit ? '<i class="fa-solid fa-floppy-disk"></i> บันทึกการแก้ไข' : '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูลและไฟล์สแกน',
          class: 'btn btn-primary',
          onClick: async () => {
            const stdIdEl = document.getElementById('modal-doc-student-id');
            const stdNameEl = document.getElementById('modal-doc-student-name');
            const studentId = stdIdEl ? stdIdEl.value.trim() : '';
            const studentName = stdNameEl ? stdNameEl.value.trim() : '';
            const gradYear = document.getElementById('modal-doc-grad-year').value.trim();
            const setNo = document.getElementById('modal-doc-set-no').value.trim();
            const docNum = document.getElementById('modal-doc-number').value.trim();
            const docTypeCode = document.getElementById('modal-doc-type').value;
            const locationCode = document.getElementById('modal-doc-location').value;
            const status = document.getElementById('modal-doc-status').value;
            const fileInput = document.getElementById('modal-doc-file');

            if (!gradYear || !setNo || !docNum) {
              window.utils.showToast('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (ปีการศึกษา, ชุดที่, เลขที่)', 'danger');
              return false;
            }

            const driveUrlInput = document.getElementById('modal-doc-drive-url');
            const driveUrlVal = driveUrlInput ? driveUrlInput.value.trim() : driveUrlValInit;

            let fileName = isEdit ? docToEdit.file_name : `ปพ_${gradYear}_${setNo}_${docNum}.pdf`;
            let fileUrl = isEdit ? (docToEdit.file_url || 'assets/sample_porpor.pdf') : 'assets/sample_porpor.pdf';

            if (driveUrlVal) {
              fileUrl = driveUrlVal;
              const driveId = window.utils.getDriveFileId(driveUrlVal);
              fileName = `GoogleDrive_${gradYear}_${driveId ? driveId.slice(0, 6) : docNum}.pdf`;
            } else if (fileInput && fileInput.files && fileInput.files[0]) {
              const fileObj = fileInput.files[0];
              fileName = fileObj.name;
              window.utils.showToast('กำลังอัปโหลดไฟล์สแกนลง Google Drive...', 'info');
              const bookCode = `BOOK-${docTypeCode.replace('.', '')}-${gradYear}-${setNo}`;
              const driveUrl = await window.db.uploadScanFileToDrive(fileObj, fileName, bookCode);
              if (driveUrl) {
                fileUrl = driveUrl;
                window.utils.showToast('อัปโหลดไฟล์ลง Google Drive และแปลงลิงก์สำเร็จ!', 'success');
              } else {
                fileUrl = URL.createObjectURL(fileObj);
              }
            }

            if (isEdit) {
              docToEdit.student_id = studentId;
              docToEdit.student_name = studentName;
              docToEdit.academic_year = gradYear;
              docToEdit.book_number = setNo;
              docToEdit.doc_number = docNum;
              docToEdit.doc_type_code = docTypeCode;
              docToEdit.location_code = locationCode;
              docToEdit.status = status;
              docToEdit.file_name = fileName;
              docToEdit.file_url = fileUrl;

              // 2-Way Sync: Update matching student record if present
              if (studentId) {
                const stdIdx = window.db.data.students.findIndex(s => s.student_id === studentId);
                if (stdIdx !== -1) {
                  window.db.data.students[stdIdx].file_url = fileUrl;
                  window.db.data.students[stdIdx].doc_number = docNum;
                  window.db.data.students[stdIdx].set_number = setNo;
                }
              }

              window.db.addAuditLog('ทะเบียนเอกสาร', 'แก้ไขเอกสาร', `แก้ไขข้อมูลเอกสาร ปพ. เล่ม ${setNo} เลขที่ ${docNum}`);
              window.db.save();
              window.utils.showToast(`แก้ไขข้อมูลเอกสารเรียบร้อยแล้ว`, 'success');
              this.refreshTable();
              return;
            }

            const docCode = `DOC-${docTypeCode.replace('.', '')}-${gradYear}-${setNo}-${docNum}`;
            const newDoc = {
              id: window.db.data.documents.length + 1,
              doc_code: docCode,
              student_id: studentId,
              student_name: studentName,
              doc_type_code: docTypeCode,
              academic_year: gradYear,
              doc_number: docNum,
              book_code: `BOOK-${docTypeCode.replace('.', '')}-${gradYear}-${setNo}`,
              book_number: setNo,
              page_number: docNum,
              date_created: new Date().toISOString().slice(0, 10),
              status: status,
              location_code: locationCode,
              file_name: fileName,
              file_url: fileUrl,
              file_size: driveUrlVal ? 'Google Drive' : '1.5 MB'
            };

            // 2-Way Sync: Update matching student record if present
            if (studentId) {
              const stdIdx = window.db.data.students.findIndex(s => s.student_id === studentId);
              if (stdIdx !== -1) {
                window.db.data.students[stdIdx].file_url = fileUrl;
                window.db.data.students[stdIdx].doc_number = docNum;
                window.db.data.students[stdIdx].set_number = setNo;
              }
            }

            window.db.data.documents.unshift(newDoc);
            window.db.addAuditLog('ทะเบียนเอกสาร', 'เพิ่มเอกสารสแกน', `บันทึกข้อมูลและไฟล์สแกน ปพ. เล่ม ${setNo} เลขที่ ${docNum} ปี ${gradYear}`);
            window.db.save();
            window.utils.showToast(`บันทึกข้อมูลและไฟล์สแกน ปพ. เล่ม ${setNo} เลขที่ ${docNum} เรียบร้อยแล้ว`, 'success');
            this.refreshTable();
          }
        }
      ]
    );

    // Bind Multi-source file scanning & OCR Reader events
    setTimeout(() => {
      const fileInput = document.getElementById('modal-doc-file');
      const uploadBtn = document.getElementById('scan-mode-upload-btn');
      const driveBtn = document.getElementById('scan-mode-drive-btn');
      const driveBox = document.getElementById('drive-link-input-box');
      const driveInput = document.getElementById('modal-doc-drive-url');
      const applyDriveBtn = document.getElementById('apply-drive-url-btn');

      const cameraBtn = document.getElementById('scan-mode-camera-btn');
      const deviceBtn = document.getElementById('scan-mode-device-btn');
      const previewBox = document.getElementById('file-scan-preview-box');
      const fileNameEl = document.getElementById('preview-file-name');
      const fileSizeEl = document.getElementById('preview-file-size');
      const fileIconEl = document.getElementById('preview-file-icon');

      const ocrProgressBox = document.getElementById('ocr-status-progress');
      const ocrStatusText = document.getElementById('ocr-status-text');
      const ocrBadge = document.getElementById('ocr-result-badge');

      const inputStdId = document.getElementById('modal-doc-student-id');
      const inputStdName = document.getElementById('modal-doc-student-name');
      const inputGradYear = document.getElementById('modal-doc-grad-year');
      const inputSetNo = document.getElementById('modal-doc-set-no');
      const inputDocNum = document.getElementById('modal-doc-number');

      if (inputStdId) {
        inputStdId.oninput = () => {
          const id = inputStdId.value.trim();
          if (id && window.db) {
            const std = window.db.getStudentById(id);
            if (std) {
              if (inputStdName) inputStdName.value = `${std.prefix}${std.first_name} ${std.last_name}`;
              if (inputGradYear && std.academic_year) inputGradYear.value = std.academic_year;
            }
          }
        };
      }

      const processFileWithOCR = (file) => {
        if (ocrProgressBox) ocrProgressBox.style.display = 'flex';
        if (ocrStatusText) ocrStatusText.textContent = `กำลังสแกนและอ่านข้อมูลจากไฟล์ ${file.name || 'สแกน'} ด้วย AI OCR...`;

        window.utils.scanAndExtractPorPorDocument(file, async (extracted) => {
          if (ocrProgressBox) ocrProgressBox.style.display = 'none';
          if (ocrBadge) {
            ocrBadge.style.display = 'inline-flex';
            ocrBadge.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ดึงข้อมูลจากไฟล์สแกนสำเร็จ (${extracted.confidence}%)`;
          }

          if (inputStdId && extracted.student_id) inputStdId.value = extracted.student_id;
          if (inputStdName && extracted.student_name) inputStdName.value = extracted.student_name;
          if (inputGradYear && extracted.graduation_year) inputGradYear.value = extracted.graduation_year;
          if (inputSetNo && extracted.set_number) inputSetNo.value = extracted.set_number;
          if (inputDocNum && extracted.doc_number) inputDocNum.value = extracted.doc_number;

          const ext = (extracted.file_name || '').split('.').pop().toLowerCase();
          fileNameEl.textContent = extracted.file_name;
          fileSizeEl.textContent = `${extracted.file_size} | อ่านข้อมูลเรียบร้อยแล้ว`;
          fileIconEl.className = ext === 'pdf' ? 'fa-solid fa-file-pdf text-danger' : 'fa-solid fa-file-image text-primary';
          previewBox.style.display = 'flex';

          // Upload camera/scanner image to Google Drive if file is Blob/File or string
          const docTypeSelect = document.getElementById('modal-doc-type');
          const docTypeCode = docTypeSelect ? docTypeSelect.value : 'ปพ.1';
          const setNo = extracted.set_number || '01';
          const gradYear = extracted.graduation_year || '2569';
          const bookCode = `BOOK-${docTypeCode.replace('.', '')}-${gradYear}-${setNo}`;

          if (file instanceof File || file instanceof Blob) {
            window.utils.showToast('กำลังอัปโหลดไฟล์สแกนลง Google Drive...', 'info');
            const driveUrl = await window.db.uploadScanFileToDrive(file, file.name || `Scan_${Date.now()}.png`, bookCode);
            if (driveUrl) {
              if (driveInput) driveInput.value = driveUrl;
              fileSizeEl.textContent = `Google Drive Link | เชื่อมโยงพร้อมบันทึกใน Google Sheets`;
              fileIconEl.className = 'fa-brands fa-google-drive text-success';
              window.utils.showToast('อัปโหลดไฟล์ไป Google Drive และเตรียมบันทึกลงชีทเรียบร้อยแล้ว!', 'success');
            }
          }

          window.utils.showToast(`อ่านข้อมูลจากไฟล์สแกนสำเร็จ: เล่ม ${extracted.set_number || '-'} เลขที่ ${extracted.doc_number || '-'}`, 'success');
        });
      };

      if (driveBtn && driveBox) {
        driveBtn.onclick = () => {
          const isHidden = driveBox.style.display === 'none';
          driveBox.style.display = isHidden ? 'block' : 'none';
          if (isHidden && driveInput) driveInput.focus();
        };
      }

      if (applyDriveBtn && driveInput) {
        applyDriveBtn.onclick = () => {
          const urlVal = driveInput.value.trim();
          if (!urlVal) {
            window.utils.showToast('กรุณาวาง URL หรือลิงก์จาก Google Drive', 'danger');
            return;
          }
          if (!window.utils.isDriveUrl(urlVal)) {
            window.utils.showToast('รูปแบบลิงก์ Google Drive ไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง', 'warning');
          }
          const driveId = window.utils.getDriveFileId(urlVal);
          fileNameEl.textContent = `Google Drive File (${driveId ? driveId.slice(0, 10) + '...' : 'Shared Link'})`;
          fileSizeEl.textContent = `Google Drive Link | เชื่อมโยงพร้อมใช้งาน`;
          fileIconEl.className = 'fa-brands fa-google-drive text-success';
          previewBox.style.display = 'flex';
          window.utils.showToast('เชื่อมโยงลิงก์ Google Drive เรียบร้อยแล้ว', 'success');
        };
      }

      if (uploadBtn && fileInput) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
          if (e.target.files.length) {
            const f = e.target.files[0];
            const ext = f.name.split('.').pop().toLowerCase();
            if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
              window.utils.showToast('รองรับเฉพาะไฟล์ PDF, JPG, JPEG, PNG เท่านั้น', 'danger');
              return;
            }
            processFileWithOCR(f);
          }
        };
      }

      if (cameraBtn) {
        cameraBtn.onclick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          window.utils.openLiveCameraModal((capturedFile) => {
            processFileWithOCR(capturedFile);
          });
        };
      }

      if (deviceBtn) {
        deviceBtn.onclick = () => {
          window.utils.showToast('กำลังรับภาพจากเครื่องปริ้นสแกนเนอร์...', 'info');
          setTimeout(() => {
            const scanName = `Scan_Device_65001235_2565.pdf`;
            window.lastCapturedScanName = scanName;
            processFileWithOCR({ name: scanName, size: 1800000 });
          }, 600);
        };
      }
    }, 150);
  },

  openManageDocTypesModal() {
    const docTypes = window.db.data.document_types || [];

    const bodyHtml = `
      <div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          ผู้ดูแลระบบสามารถ เพิ่ม แก้ไข หรือลบประเภทเอกสาร ปพ. ได้ตามความต้องการของสถานศึกษา (ไม่ Hard-code)
        </p>
        <div class="table-responsive" style="margin-bottom: 1rem;">
          <table class="data-table">
            <thead>
              <tr><th>รหัสประเภท</th><th>ชื่อเอกสาร</th><th>คำอธิบาย</th></tr>
            </thead>
            <tbody>
              ${docTypes.map(t => `
                <tr>
                  <td><strong>${t.code}</strong></td>
                  <td>${t.name}</td>
                  <td>${t.description || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h5 style="margin-bottom: 0.5rem;"><i class="fa-solid fa-plus"></i> เพิ่มประเภทเอกสารใหม่</h5>
        <div class="form-row">
          <input type="text" id="new-type-code" class="form-control" placeholder="เช่น ปพ.10">
          <input type="text" id="new-type-name" class="form-control" placeholder="ชื่อเอกสาร">
        </div>
      </div>
    `;

    window.utils.openModal(
      `<i class="fa-solid fa-sliders text-warning"></i> จัดการประเภทเอกสาร ปพ.`,
      bodyHtml,
      [
        { text: 'ปิด', class: 'btn btn-secondary' },
        {
          text: 'เพิ่มประเภทเอกสาร',
          class: 'btn btn-success',
          closeOnClick: false,
          onClick: () => {
            const code = document.getElementById('new-type-code').value.trim();
            const name = document.getElementById('new-type-name').value.trim();

            if (!code || !name) {
              window.utils.showToast('กรุณากรอกรหัสและชื่อประเภทเอกสาร', 'danger');
              return;
            }

            window.db.data.document_types.push({
              id: window.db.data.document_types.length + 1,
              code: code,
              name: name,
              description: 'ประเภทเอกสารที่เพิ่มโดยผู้ดูแลระบบ',
              is_system: false
            });

            window.db.addAuditLog('ตั้งค่าระบบ', 'เพิ่มประเภทเอกสาร', `เพิ่มประเภทเอกสาร ${code} (${name})`);
            window.db.save();
            window.utils.showToast(`เพิ่มประเภทเอกสาร ${code} เรียบร้อยแล้ว`, 'success');
            window.utils.closeModal();
            this.refreshTable();
          }
        }
      ]
    );
  }
};

window.documentsView = documentsView;
