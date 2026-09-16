/* ==========================================================================
   EDMRS - Student Management View Controller (js/views/studentsView.js)
   CRUD for student records, search, filters, pagination, export & print
   ========================================================================== */

const studentsView = {
  currentPage: 1,
  pageSize: 10,
  filterState: {
    search: '',
    academic_year: '',
    grade_level: '',
    room: ''
  },

  render() {
    const students = (window.db && window.db.getStudents) ? window.db.getStudents(this.filterState) : [];
    const totalStudents = students.length;
    const totalPages = Math.ceil(totalStudents / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pagedStudents = students.slice(startIndex, startIndex + this.pageSize);

    const canCreate = window.authSystem.hasPermission('create_students');
    const canEdit = window.authSystem.hasPermission('edit_students');
    const canDelete = window.authSystem.hasPermission('delete_students');

    const allStudentsData = (window.db && window.db.data && window.db.data.students) ? window.db.data.students : [];
    const academicYearsList = (window.db && window.db.data && window.db.data.academic_years) ? window.db.data.academic_years : [];

    // Extract unique existing years from database
    const yearsInData = Array.from(new Set([
      ...academicYearsList.map(y => y.year),
      ...allStudentsData.map(s => s.academic_year)
    ])).filter(Boolean).sort().reverse();

    // Extract unique existing grades from database
    const gradesInData = Array.from(new Set(allStudentsData.map(s => s.grade_level).filter(Boolean))).sort();

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-user-graduate text-primary"></i> ระบบข้อมูลนักเรียน
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            จัดการทะเบียนประวัตินักเรียน ค้นหา กรองข้อมูล นำเข้า และส่งออกรายงาน
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="scan-ocr-student-btn" class="btn btn-warning btn-sm">
            <i class="fa-solid fa-wand-magic-sparkles"></i> ⚡ สแกนอ่านไฟล์ ปพ. (6 รายการ)
          </button>
          <button id="export-students-excel-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-file-excel text-success"></i> ส่งออก Excel
          </button>
          <button id="print-students-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-print"></i> พิมพ์ข้อมูล
          </button>
          ${canCreate ? `
            <button id="add-student-btn" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-user-plus"></i> เพิ่มนักเรียนใหม่
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter Controls Card -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.25rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; align-items: end;">
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ค้นหา (ชื่อ/รหัส/เลขบัตร)</label>
            <input type="text" id="student-search-input" class="form-control" placeholder="พิมพ์คำค้นหา..." value="${this.filterState.search}">
          </div>
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ปีการศึกษา</label>
            <select id="student-filter-year" class="form-control">
              <option value="">-- ทุกปีการศึกษา --</option>
              ${yearsInData.map(y => `<option value="${y}" ${this.filterState.academic_year === y ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ระดับชั้น</label>
            <select id="student-filter-grade" class="form-control">
              <option value="">-- ทุกระดับชั้น --</option>
              ${gradesInData.map(g => `<option value="${g}" ${this.filterState.grade_level === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>
          <div>
            <button id="reset-student-filters-btn" class="btn btn-light" style="width: 100%;">
              <i class="fa-solid fa-rotate-left"></i> ล้างตัวกรอง
            </button>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="card" style="padding: 0;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>เลขที่ (ใบปพ.)</th>
                <th>ชุดที่</th>
                <th>รหัสนักเรียน</th>
                <th>(คำนำหน้า) ชื่อ-สกุล</th>
                <th>ระดับชั้น</th>
                <th>ปีที่สำเร็จการศึกษา</th>
                <th>สำเนา ปพ.</th>
                <th style="text-align: center;">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${pagedStudents.length ? pagedStudents.map((s, idx) => `
                <tr>
                  <td><strong>${s.doc_number || String(startIndex + idx + 1).padStart(3, '0')}</strong></td>
                  <td>${s.set_number || s.book_number || '01'}</td>
                  <td><code>${s.student_id}</code></td>
                  <td>
                    <a href="#student-detail?id=${s.student_id}" style="font-weight: 500; color: var(--primary-700);">
                      ${s.prefix}${s.first_name} ${s.last_name}
                    </a>
                  </td>
                  <td><span class="badge badge-secondary">${s.grade_level || '-'}</span></td>
                  <td>${s.academic_year || '-'}</td>
                  <td>
                    <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                      <button class="btn btn-light btn-sm view-student-file-btn" data-url="${s.file_url || 'assets/sample_porpor.pdf'}" data-name="${s.prefix}${s.first_name} ${s.last_name} (ด้านหน้า)" data-code="${s.student_id}" title="คลิกดูไฟล์ ปพ. ด้านหน้า">
                        ${window.utils.isDriveUrl(s.file_url) ? '<i class="fa-brands fa-google-drive text-success"></i> เปิดด้านหน้า' : '<i class="fa-solid fa-file-pdf text-danger"></i> ด้านหน้า'}
                      </button>
                      ${s.file_url_back ? `
                        <button class="btn btn-light btn-sm view-student-file-btn" data-url="${s.file_url_back}" data-name="${s.prefix}${s.first_name} ${s.last_name} (ด้านหลัง)" data-code="${s.student_id}" title="คลิกดูไฟล์ ปพ. ด้านหลัง">
                          ${window.utils.isDriveUrl(s.file_url_back) ? '<i class="fa-brands fa-google-drive text-success"></i> เปิดด้านหลัง' : '<i class="fa-solid fa-file-pdf text-info"></i> ด้านหลัง'}
                        </button>
                      ` : ''}
                    </div>
                  </td>
                  <td style="text-align: center;">
                    <div style="display: flex; gap: 0.35rem; justify-content: center;">
                      <a href="#student-detail?id=${s.student_id}" class="btn btn-secondary btn-sm" title="ดูรายละเอียดเอกสาร">
                        <i class="fa-solid fa-id-card"></i>
                      </a>
                      ${canEdit ? `
                        <button class="btn btn-light btn-sm edit-student-btn" data-id="${s.student_id}" title="แก้ไขข้อมูล">
                          <i class="fa-solid fa-pen-to-square text-primary"></i>
                        </button>
                      ` : ''}
                      ${canDelete ? `
                        <button class="btn btn-light btn-sm delete-student-btn" data-id="${s.student_id}" data-name="${s.prefix}${s.first_name} ${s.last_name}" title="ลบข้อมูล">
                          <i class="fa-solid fa-trash text-danger"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-container" style="padding: 1rem 1.25rem;">
          <span>แสดง ${totalStudents ? startIndex + 1 : 0} ถึง ${Math.min(startIndex + this.pageSize, totalStudents)} จากทั้งหมด ${totalStudents} รายการ</span>
          <div class="pagination-controls">
            <button class="page-btn" id="prev-page-btn" ${this.currentPage === 1 ? 'disabled' : ''}>
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span style="font-size: 0.85rem; padding: 0 0.5rem;">หน้า ${this.currentPage} / ${totalPages}</span>
            <button class="page-btn" id="next-page-btn" ${this.currentPage === totalPages ? 'disabled' : ''}>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  initEvents() {
    const searchInput = document.getElementById('student-search-input');
    const filterYear = document.getElementById('student-filter-year');
    const filterGrade = document.getElementById('student-filter-grade');
    const resetBtn = document.getElementById('reset-student-filters-btn');

    if (searchInput) {
      searchInput.oninput = (e) => {
        this.filterState.search = e.target.value;
        this.currentPage = 1;
        this.refreshTable();
      };
    }

    if (filterYear) {
      filterYear.onchange = (e) => {
        this.filterState.academic_year = e.target.value;
        this.currentPage = 1;
        this.refreshTable();
      };
    }

    if (filterGrade) {
      filterGrade.onchange = (e) => {
        this.filterState.grade_level = e.target.value;
        this.currentPage = 1;
        this.refreshTable();
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        this.filterState = { search: '', academic_year: '', grade_level: '', room: '' };
        this.currentPage = 1;
        this.refreshTable();
      };
    }

    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

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

    // Add Student Modal Event
    const addBtn = document.getElementById('add-student-btn');
    if (addBtn) addBtn.onclick = () => this.openStudentModal();

    const ocrBtn = document.getElementById('scan-ocr-student-btn');
    if (ocrBtn) {
      ocrBtn.onclick = () => {
        if (window.documentsView) window.documentsView.openAddDocModal();
      };
    }

    // View Student Document File Button Delegates
    document.querySelectorAll('.view-student-file-btn').forEach(btn => {
      btn.onclick = () => {
        const url = btn.getAttribute('data-url');
        const name = btn.getAttribute('data-name');
        const code = btn.getAttribute('data-code');
        const std = window.db.getStudentById(code);
        const urlBack = (std && std.file_url_back) ? std.file_url_back : (btn.getAttribute('data-url-back') || '');
        window.utils.openFilePreviewModal(url, `สำเนา ปพ. - ${name}`, code, urlBack);
      };
    });

    // Edit & Delete Event Delegates
    document.querySelectorAll('.edit-student-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const student = window.db.getStudentById(id);
        if (student) this.openStudentModal(student);
      };
    });

    document.querySelectorAll('.delete-student-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        window.utils.confirmDialog(
          'ยืนยันการลบนักเรียน',
          `คุณต้องการลบข้อมูลนักเรียน <b>${name} (${id})</b> หรือไม่? การลบนี้จะส่งผลต่อประวัติเอกสาร`,
          async () => {
            window.db.data.students = window.db.data.students.filter(s => s.student_id !== id);
            window.db.addAuditLog('ข้อมูลนักเรียน', 'ลบข้อมูล', `ลบข้อมูลนักเรียน ${name} (${id})`);
            window.db.save(false);
            window.utils.showToast('กำลังซิงก์การลบลง Google Sheets...', 'info');
            try {
              await window.db.syncToGoogleSheets();
              window.utils.showToast(`ลบข้อมูลนักเรียนและซิงก์ Google Sheets เรียบร้อยแล้ว`, 'success');
            } catch (err) {
              console.warn('Sync on delete:', err);
              window.utils.showToast(`ลบข้อมูลนักเรียนในเครื่องเรียบร้อยแล้ว`, 'warning');
            }
            this.refreshTable();
          }
        );
      };
    });

    // Export Excel & Print
    const exportBtn = document.getElementById('export-students-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const list = (window.db && window.db.getStudents) ? window.db.getStudents(this.filterState) : [];
        const exportData = list.map((s, idx) => ({
          'เลขที่ (ใบปพ.)': s.doc_number || String(idx + 1).padStart(3, '0'),
          'ชุดที่': s.set_number || s.book_number || '01',
          'รหัสนักเรียน': s.student_id,
          'คำนำหน้า': s.prefix,
          'ชื่อ': s.first_name,
          'นามสกุล': s.last_name,
          'ระดับชั้น': s.grade_level,
          'ปีที่สำเร็จการศึกษา': s.academic_year,
          'สำเนา ปพ. Link': s.file_url || ''
        }));
        window.utils.exportToExcel('รายการนักเรียน', 'Students', exportData);
      };
    }

    const printBtn = document.getElementById('print-students-btn');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
  },

  refreshTable() {
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = this.render();
      this.initEvents();
    }
  },

  openStudentModal(student = null, defaultBookCode = null) {
    const isEdit = !!student;
    const title = isEdit ? `<i class="fa-solid fa-pen-to-square text-primary"></i> แก้ไขข้อมูลนักเรียน` : `<i class="fa-solid fa-user-plus text-success"></i> เพิ่มนักเรียนใหม่ (เชื่อมโยงทะเบียนเล่ม)`;
    const books = window.db.data.books || [];
    const currentBookCode = student ? (student.book_code || '') : (defaultBookCode || '');

    const bodyHtml = `
      <form id="student-form">
        <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-left: 4px solid var(--primary-600); padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          <label class="form-label required" style="color: var(--primary-900); font-weight: 600; margin-bottom: 4px;">
            <i class="fa-solid fa-link text-primary"></i> เลือกทะเบียนเล่มเอกสาร (ชุดที่) ที่ต้องการเชื่อมโยง
          </label>
          <select id="modal-book-code" class="form-control" style="border-color: var(--primary-300); font-weight: 500;">
            <option value="">-- เลือกทะเบียนเล่มเอกสารจากคลัง --</option>
            ${books.map(b => `
              <option value="${b.book_code}" data-year="${b.academic_year}" data-num="${b.book_number}" data-type="${b.doc_type_code}" ${(currentBookCode === b.book_code || (student && student.set_number === b.book_number)) ? 'selected' : ''}>
                ${b.book_code} (${b.doc_type_code} - ปี ${b.academic_year} | เล่มที่/ชุดที่ ${b.book_number})
              </option>
            `).join('')}
            <option value="CUSTOM" ${!currentBookCode && student ? 'selected' : ''}>+ กรอกชุดที่ / เล่มที่ เอง...</option>
          </select>
          <div id="book-link-info" style="margin-top: 6px; font-size: 0.8rem; color: var(--primary-800);">
            <i class="fa-solid fa-circle-check text-success"></i> ระบบจะเชื่อมโยงข้อมูลนักเรียนและเอกสารไปยังทะเบียนเล่มที่เลือกโดยอัตโนมัติ
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">1. เลขที่ (ใบปพ.)</label>
            <input type="text" id="modal-doc-number" class="form-control" placeholder="เช่น 001, 123" value="${student ? (student.doc_number || '') : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">2. ชุดที่</label>
            <input type="text" id="modal-set-number" class="form-control" placeholder="เช่น 01, 1" value="${student ? (student.set_number || student.book_number || '01') : '01'}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">3. รหัสนักเรียน</label>
            <input type="text" id="modal-student-id" class="form-control" placeholder="เช่น 65001234" value="${student ? student.student_id : ''}" ${isEdit ? 'readonly' : 'required'}>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex: 0 0 130px;">
            <label class="form-label required">คำนำหน้า</label>
            <select id="modal-prefix" class="form-control" required>
              <option value="นาย" ${student && student.prefix === 'นาย' ? 'selected' : ''}>นาย</option>
              <option value="นางสาว" ${student && student.prefix === 'นางสาว' ? 'selected' : ''}>นางสาว</option>
              <option value="เด็กชาย" ${student && student.prefix === 'เด็กชาย' ? 'selected' : ''}>เด็กชาย</option>
              <option value="เด็กหญิง" ${student && student.prefix === 'เด็กหญิง' ? 'selected' : ''}>เด็กหญิง</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label required">4. ชื่อ - สกุล</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <input type="text" id="modal-first-name" class="form-control" placeholder="ชื่อ" value="${student ? student.first_name : ''}" required>
              <input type="text" id="modal-last-name" class="form-control" placeholder="นามสกุล" value="${student ? student.last_name : ''}" required>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">5. ระดับชั้น (ป.1 - ม.6)</label>
            <select id="modal-grade-level" class="form-control" required>
              <option value="ป.1" ${student && student.grade_level === 'ป.1' ? 'selected' : ''}>ป.1</option>
              <option value="ป.2" ${student && student.grade_level === 'ป.2' ? 'selected' : ''}>ป.2</option>
              <option value="ป.3" ${student && student.grade_level === 'ป.3' ? 'selected' : ''}>ป.3</option>
              <option value="ป.4" ${student && student.grade_level === 'ป.4' ? 'selected' : ''}>ป.4</option>
              <option value="ป.5" ${student && student.grade_level === 'ป.5' ? 'selected' : ''}>ป.5</option>
              <option value="ป.6" ${student && student.grade_level === 'ป.6' ? 'selected' : ''}>ป.6</option>
              <option value="ม.1" ${student && student.grade_level === 'ม.1' ? 'selected' : ''}>ม.1</option>
              <option value="ม.2" ${student && student.grade_level === 'ม.2' ? 'selected' : ''}>ม.2</option>
              <option value="ม.3" ${student && student.grade_level === 'ม.3' ? 'selected' : ''}>ม.3</option>
              <option value="ม.4" ${student && student.grade_level === 'ม.4' ? 'selected' : ''}>ม.4</option>
              <option value="ม.5" ${student && student.grade_level === 'ม.5' ? 'selected' : ''}>ม.5</option>
              <option value="ม.6" ${student && (student.grade_level === 'ม.6' || !student.grade_level) ? 'selected' : ''}>ม.6</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">6. ปีที่สำเร็จการศึกษา</label>
            <input type="text" id="modal-academic-year" class="form-control" placeholder="เช่น 2569" value="${student ? student.academic_year : '2569'}" required>
          </div>
        </div>

        <div class="form-group" style="margin-top: 0.5rem;">
          <label class="form-label">7. สำเนา ปพ. ด้านหน้า (เลือกไฟล์จากเครื่อง หรือวางลิงก์ Drive)</label>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <input type="text" id="modal-file-url" class="form-control" style="flex: 1; min-width: 220px;" placeholder="วางลิงก์ Google Drive ด้านหน้า หรือเลือกไฟล์จากเครื่อง..." value="${student ? (student.file_url || '') : ''}">
            
            <input type="file" id="modal-local-file-input" accept=".pdf,.jpg,.jpeg,.png" style="display: none;">
            
            <button type="button" id="upload-local-file-btn" class="btn btn-primary" style="white-space: nowrap;">
              <i class="fa-solid fa-cloud-arrow-up"></i> เลือกไฟล์จากเครื่อง
            </button>
            <button type="button" id="scan-camera-modal-btn" class="btn btn-warning" style="white-space: nowrap;">
              <i class="fa-solid fa-camera"></i> สแกน/ถ่ายภาพ
            </button>
            <button type="button" id="preview-file-modal-btn" class="btn btn-info" style="white-space: nowrap;">
              <i class="fa-solid fa-eye"></i> ดูไฟล์ด้านหน้า
            </button>
          </div>
          <small style="color: var(--text-muted); display: block; margin-top: 4px;">
            <i class="fa-solid fa-cloud-arrow-up text-primary"></i> รองรับไฟล์ PDF, JPG, PNG — เลือกไฟล์จากเครื่องแล้วระบบจะอัปโหลดขึ้น Google Drive อัตโนมัติ
          </small>
        </div>

        <div class="form-group" style="margin-top: 1rem;">
          <label class="form-label">8. สำเนา ปพ. ด้านหลัง (ถ้ามี — เลือกไฟล์จากเครื่อง หรือวางลิงก์ Drive)</label>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <input type="text" id="modal-file-url-back" class="form-control" style="flex: 1; min-width: 220px;" placeholder="วางลิงก์ Google Drive ด้านหลัง (ถ้ามี)..." value="${student ? (student.file_url_back || '') : ''}">
            
            <input type="file" id="modal-local-file-input-back" accept=".pdf,.jpg,.jpeg,.png" style="display: none;">
            
            <button type="button" id="upload-local-file-back-btn" class="btn btn-outline-primary" style="white-space: nowrap;">
              <i class="fa-solid fa-cloud-arrow-up"></i> เลือกไฟล์ด้านหลัง
            </button>
            <button type="button" id="scan-camera-modal-back-btn" class="btn btn-outline-warning" style="white-space: nowrap;">
              <i class="fa-solid fa-camera"></i> สแกน/ถ่ายภาพ
            </button>
            <button type="button" id="preview-file-back-modal-btn" class="btn btn-outline-info" style="white-space: nowrap;">
              <i class="fa-solid fa-eye"></i> ดูไฟล์ด้านหลัง
            </button>
          </div>
          <small style="color: var(--text-muted); display: block; margin-top: 4px;">
            <i class="fa-solid fa-circle-info text-info"></i> หากมีเอกสาร ปพ. ด้านหลัง สามารถสแกน/เลือกไฟล์เพิ่มได้ (ถ้าไม่มีปล่อยว่างได้)
          </small>
        </div>
      </form>
    `;

    window.utils.openModal(title, bodyHtml, [
      { text: 'ยกเลิก', class: 'btn btn-secondary' },
      {
        text: 'บันทึกข้อมูล',
        class: 'btn btn-primary',
        onClick: () => {
          const bookCodeSelect = document.getElementById('modal-book-code').value;
          const docNumber = document.getElementById('modal-doc-number').value.trim();
          const setNumber = document.getElementById('modal-set-number').value.trim();
          const studentId = document.getElementById('modal-student-id').value.trim();
          const prefix = document.getElementById('modal-prefix').value;
          const firstName = document.getElementById('modal-first-name').value.trim();
          const lastName = document.getElementById('modal-last-name').value.trim();
          const gradeLevel = document.getElementById('modal-grade-level').value;
          const academicYear = document.getElementById('modal-academic-year').value.trim();
          const fileUrl = document.getElementById('modal-file-url').value.trim() || 'assets/sample_porpor.pdf';
          const fileUrlBack = document.getElementById('modal-file-url-back') ? document.getElementById('modal-file-url-back').value.trim() : '';

          if (!docNumber || !setNumber || !studentId || !firstName || !lastName) {
            window.utils.showToast('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน', 'danger');
            return false;
          }

          const selectedBookObj = books.find(b => b.book_code === bookCodeSelect);
          const finalBookCode = selectedBookObj ? selectedBookObj.book_code : (bookCodeSelect && bookCodeSelect !== 'CUSTOM' ? bookCodeSelect : `BOOK-P1-${academicYear}-${setNumber}`);

          if (isEdit) {
            const idx = window.db.data.students.findIndex(s => s.student_id === studentId);
            if (idx !== -1) {
              window.db.data.students[idx] = {
                ...window.db.data.students[idx],
                doc_number: docNumber,
                set_number: setNumber,
                book_number: setNumber,
                book_code: finalBookCode,
                prefix: prefix,
                first_name: firstName,
                last_name: lastName,
                grade_level: gradeLevel,
                academic_year: academicYear,
                file_url: fileUrl,
                file_url_back: fileUrlBack
              };
              window.db.addAuditLog('ข้อมูลนักเรียน', 'แก้ไขข้อมูล', `แก้ไขข้อมูลนักเรียน ${prefix}${firstName} ${lastName} (${studentId}) [เชื่อมเล่ม ${finalBookCode}]`);
            }
          } else {
            const newObj = {
              id: window.db.data.students.length + 1,
              doc_number: docNumber,
              set_number: setNumber,
              book_number: setNumber,
              book_code: finalBookCode,
              student_id: studentId,
              citizen_id: `1100${Math.floor(100000000 + Math.random() * 900000000)}`,
              prefix: prefix,
              first_name: firstName,
              last_name: lastName,
              previous_name: '',
              birthdate: '2550-01-01',
              grade_level: gradeLevel,
              room: '1',
              academic_year: academicYear,
              status: 'graduated',
              file_url: fileUrl,
              file_url_back: fileUrlBack
            };
            window.db.data.students.unshift(newObj);
            window.db.addAuditLog('ข้อมูลนักเรียน', 'เพิ่มข้อมูล', `เพิ่มนักเรียนใหม่ ${prefix}${firstName} ${lastName} (${studentId}) [เชื่อมเล่ม ${finalBookCode}]`);
          }

          // Relational Linkage: Ensure a corresponding document entry exists/is updated in window.db.data.documents linked to this book!
          const docCode = `DOC-P1-${studentId}`;
          const docIdx = (window.db.data.documents || []).findIndex(d => d.student_id === studentId || d.doc_code === docCode);
          const docObj = {
            id: docIdx !== -1 ? window.db.data.documents[docIdx].id : window.db.data.documents.length + 1,
            doc_code: docCode,
            student_id: studentId,
            student_name: `${prefix}${firstName} ${lastName}`,
            doc_type_code: selectedBookObj ? selectedBookObj.doc_type_code : 'ปพ.1',
            academic_year: academicYear,
            book_number: setNumber,
            doc_number: docNumber,
            book_code: finalBookCode,
            status: 'stored',
            location_code: selectedBookObj ? selectedBookObj.location_code : 'LOC-A01-01-01',
            file_name: `ปพ1_${studentId}.pdf`,
            file_url: fileUrl,
            file_url_back: fileUrlBack
          };

          if (docIdx !== -1) {
            window.db.data.documents[docIdx] = { ...window.db.data.documents[docIdx], ...docObj };
          } else {
            window.db.data.documents.unshift(docObj);
          }

          if (selectedBookObj) {
            const count = window.db.getDocuments({ book_code: selectedBookObj.book_code }).length;
            selectedBookObj.item_count = count;
          }

          window.db.save();
          window.utils.showToast(`บันทึกและเชื่อมโยงนักเรียนกับเล่มเอกสาร ${finalBookCode} เรียบร้อยแล้ว`, 'success');
          this.refreshTable();
        }
      }
    ]);

    setTimeout(() => {
      const bookSelect = document.getElementById('modal-book-code');
      if (bookSelect) {
        bookSelect.onchange = () => {
          const selectedVal = bookSelect.value;
          const selectedOption = bookSelect.options[bookSelect.selectedIndex];
          if (selectedVal && selectedVal !== 'CUSTOM') {
            const year = selectedOption.getAttribute('data-year');
            const num = selectedOption.getAttribute('data-num');
            const type = selectedOption.getAttribute('data-type');

            if (year) document.getElementById('modal-academic-year').value = year;
            if (num) document.getElementById('modal-set-number').value = num;

            // Auto-calculate next document number for this book if adding new student
            if (!student) {
              const enclosedDocs = window.db.getDocuments({ book_code: selectedVal });
              const nextNum = String(enclosedDocs.length + 1).padStart(3, '0');
              document.getElementById('modal-doc-number').value = nextNum;
            }

            const infoEl = document.getElementById('book-link-info');
            if (infoEl) {
              infoEl.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> เชื่อมโยงกับทะเบียนเล่ม <b>${selectedVal}</b> (${type} ปี ${year}) เรียบร้อยแล้ว`;
            }
          }
        };
        if (bookSelect.value) bookSelect.onchange();
      }

      const prevBtn = document.getElementById('preview-file-modal-btn');
      if (prevBtn) {
        prevBtn.onclick = () => {
          const url = document.getElementById('modal-file-url').value.trim() || 'assets/sample_porpor.pdf';
          const stdId = document.getElementById('modal-student-id').value.trim() || 'NEW';
          const stdName = document.getElementById('modal-first-name').value.trim();
          window.utils.openFilePreviewModal(url, `สำเนา ปพ. (ด้านหน้า) - ${stdName}`, stdId);
        };
      }

      const prevBackBtn = document.getElementById('preview-file-back-modal-btn');
      if (prevBackBtn) {
        prevBackBtn.onclick = () => {
          const url = document.getElementById('modal-file-url-back').value.trim();
          if (!url) {
            window.utils.showToast('ยังไม่ได้แนบไฟล์สำเนา ปพ. ด้านหลัง', 'warning');
            return;
          }
          const stdId = document.getElementById('modal-student-id').value.trim() || 'NEW';
          const stdName = document.getElementById('modal-first-name').value.trim();
          window.utils.openFilePreviewModal(url, `สำเนา ปพ. (ด้านหลัง) - ${stdName}`, stdId);
        };
      }

      const uploadLocalBtn = document.getElementById('upload-local-file-btn');
      const localFileInput = document.getElementById('modal-local-file-input');

      const uploadLocalBackBtn = document.getElementById('upload-local-file-back-btn');
      const localFileInputBack = document.getElementById('modal-local-file-input-back');

      const getResolvedBookCode = () => {
        const bookSelect = document.getElementById('modal-book-code');
        const selectedVal = bookSelect ? bookSelect.value : '';
        if (selectedVal && selectedVal !== 'CUSTOM') {
          return selectedVal;
        }
        const setNumber = (document.getElementById('modal-set-number') ? document.getElementById('modal-set-number').value.trim() : '') || '01';
        const academicYear = (document.getElementById('modal-academic-year') ? document.getElementById('modal-academic-year').value.trim() : '') || '2569';
        return `BOOK-ปพ1-${academicYear}-${setNumber}`;
      };

      if (uploadLocalBtn && localFileInput) {
        uploadLocalBtn.onclick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          localFileInput.click();
        };

        localFileInput.onchange = async () => {
          const file = localFileInput.files[0];
          if (!file) return;

          const inputEl = document.getElementById('modal-file-url');
          const blobUrl = URL.createObjectURL(file);
          if (inputEl) inputEl.value = blobUrl;

          const bookCodeForUpload = getResolvedBookCode();
          const stdId = document.getElementById('modal-student-id') ? document.getElementById('modal-student-id').value.trim() : 'STUDENT';

          window.utils.showToast(`กำลังอัปโหลดไฟล์ด้านหน้า ${file.name} ลง Google Drive โฟลเดอร์ "${bookCodeForUpload}"...`, 'info');

          try {
            const driveUrl = await window.db.uploadScanFileToDrive(file, file.name, bookCodeForUpload);
            if (driveUrl && inputEl) {
              inputEl.value = driveUrl;
              window.utils.showToast(`อัปโหลดไฟล์ด้านหน้า ${file.name} ลงโฟลเดอร์ "${bookCodeForUpload}" สำเร็จ!`, 'success');
            } else {
              window.utils.showToast(`แนบไฟล์ด้านหน้า ${file.name} เรียบร้อยแล้ว`, 'success');
            }
          } catch (err) {
            console.warn('Upload file error:', err);
            window.utils.showToast(`แนบไฟล์ ${file.name} สำเร็จ`, 'success');
          }
        };
      }

      if (uploadLocalBackBtn && localFileInputBack) {
        uploadLocalBackBtn.onclick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          localFileInputBack.click();
        };

        localFileInputBack.onchange = async () => {
          const file = localFileInputBack.files[0];
          if (!file) return;

          const inputElBack = document.getElementById('modal-file-url-back');
          const blobUrl = URL.createObjectURL(file);
          if (inputElBack) inputElBack.value = blobUrl;

          const bookCodeForUpload = getResolvedBookCode();
          const stdId = document.getElementById('modal-student-id') ? document.getElementById('modal-student-id').value.trim() : 'STUDENT';

          window.utils.showToast(`กำลังอัปโหลดไฟล์ด้านหลัง ${file.name} ลง Google Drive โฟลเดอร์ "${bookCodeForUpload}"...`, 'info');

          try {
            const driveUrl = await window.db.uploadScanFileToDrive(file, `Back_${file.name}`, bookCodeForUpload);
            if (driveUrl && inputElBack) {
              inputElBack.value = driveUrl;
              window.utils.showToast(`อัปโหลดไฟล์ด้านหลัง ${file.name} ลงโฟลเดอร์ "${bookCodeForUpload}" สำเร็จ!`, 'success');
            } else {
              window.utils.showToast(`แนบไฟล์ด้านหลัง ${file.name} เรียบร้อยแล้ว`, 'success');
            }
          } catch (err) {
            console.warn('Upload back file error:', err);
            window.utils.showToast(`แนบไฟล์ด้านหลัง ${file.name} สำเร็จ`, 'success');
          }
        };
      }

      const camBtn = document.getElementById('scan-camera-modal-btn');
      if (camBtn) {
        camBtn.onclick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          window.utils.openLiveCameraModal(async (capturedFile) => {
            const blobUrl = URL.createObjectURL(capturedFile);
            const inputEl = document.getElementById('modal-file-url');
            if (inputEl) inputEl.value = blobUrl;

            const bookCodeForUpload = getResolvedBookCode();
            const stdId = document.getElementById('modal-student-id') ? document.getElementById('modal-student-id').value.trim() : 'STUDENT';
            
            window.utils.showToast(`กำลังอัปโหลดรูปถ่ายด้านหน้าลง Google Drive โฟลเดอร์ "${bookCodeForUpload}"...`, 'info');
            const driveUrl = await window.db.uploadScanFileToDrive(capturedFile, `Scan_Camera_Front_${stdId}_${Date.now()}.png`, bookCodeForUpload);
            if (driveUrl && inputEl) {
              inputEl.value = driveUrl;
              window.utils.showToast(`อัปโหลดรูปถ่ายด้านหน้าลงโฟลเดอร์ "${bookCodeForUpload}" สำเร็จ!`, 'success');
            } else {
              window.utils.showToast('สแกน/แนบไฟล์ภาพถ่ายเรียบร้อยแล้ว', 'success');
            }
          });
        };
      }

      const camBackBtn = document.getElementById('scan-camera-modal-back-btn');
      if (camBackBtn) {
        camBackBtn.onclick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          window.utils.openLiveCameraModal(async (capturedFile) => {
            const blobUrl = URL.createObjectURL(capturedFile);
            const inputElBack = document.getElementById('modal-file-url-back');
            if (inputElBack) inputElBack.value = blobUrl;

            const bookCodeForUpload = getResolvedBookCode();
            const stdId = document.getElementById('modal-student-id') ? document.getElementById('modal-student-id').value.trim() : 'STUDENT';
            
            window.utils.showToast(`กำลังอัปโหลดรูปถ่ายด้านหลังลง Google Drive โฟลเดอร์ "${bookCodeForUpload}"...`, 'info');
            const driveUrl = await window.db.uploadScanFileToDrive(capturedFile, `Scan_Camera_Back_${stdId}_${Date.now()}.png`, bookCodeForUpload);
            if (driveUrl && inputElBack) {
              inputElBack.value = driveUrl;
              window.utils.showToast(`อัปโหลดรูปถ่ายด้านหลังลงโฟลเดอร์ "${bookCodeForUpload}" เรียบร้อย!`, 'success');
            } else {
              window.utils.showToast('สแกน/แนบไฟล์ภาพถ่ายด้านหลังเรียบร้อยแล้ว', 'success');
            }
          });
        };
      }
    }, 100);
  }
};

window.studentsView = studentsView;
