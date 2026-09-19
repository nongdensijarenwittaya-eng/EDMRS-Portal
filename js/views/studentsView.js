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

    const canCreate = window.authSystem ? window.authSystem.hasPermission('create_students') : true;
    const canEdit = window.authSystem ? window.authSystem.hasPermission('edit_students') : true;
    const canDelete = window.authSystem ? window.authSystem.hasPermission('delete_students') : true;

    const allStudentsData = (window.db && window.db.data && window.db.data.students) ? window.db.data.students : [];
    const academicYearsList = (window.db && window.db.data && window.db.data.academic_years) ? window.db.data.academic_years : [];

    const yearsInData = Array.from(new Set([
      ...academicYearsList.map(y => y.year),
      ...allStudentsData.map(s => s.academic_year)
    ])).filter(Boolean).sort().reverse();

    const gradesInData = Array.from(new Set(allStudentsData.map(s => s.grade_level).filter(Boolean))).sort();

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-user-graduate text-primary"></i> ระบบข้อมูลนักเรียน
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            จัดการทะเบียนประวัตินักเรียน ค้นหา กรองข้อมูล และส่งออกรายงาน
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="batch-delete-students-btn" class="btn btn-danger btn-sm" style="display: none;">
            <i class="fa-solid fa-trash-can"></i> ลบรายการที่เลือก (<span id="selected-student-count">0</span>)
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
                <th style="width: 36px; text-align: center;"><input type="checkbox" id="select-all-students-cb" style="cursor: pointer;"></th>
                <th>เลขที่ (ใบปพ.)</th>
                <th>ชุดที่</th>
                <th>รหัสนักเรียน</th>
                <th>(คำนำหน้า) ชื่อ-สกุล</th>
                <th>ระดับชั้น</th>
                <th>ปีที่สำเร็จการศึกษา</th>
                <th style="text-align: center;">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${pagedStudents.length ? pagedStudents.map((s, idx) => `
                <tr>
                  <td style="text-align: center;"><input type="checkbox" class="student-row-cb" value="${s.student_id}" style="cursor: pointer;"></td>
                  <td><strong>${s.doc_number || String(startIndex + idx + 1).padStart(3, '0')}</strong></td>
                  <td>${s.set_number || s.book_number || '01'}</td>
                  <td><code>${s.student_id}</code></td>
                  <td>
                    <a href="#student-detail?id=${s.student_id}" style="font-weight: 500; color: var(--primary-700);">
                      ${s.prefix || ''}${s.first_name || ''} ${s.last_name || ''}
                    </a>
                  </td>
                  <td><span class="badge badge-secondary">${s.grade_level || '-'}</span></td>
                  <td>${s.academic_year || '-'}</td>
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
                        <button class="btn btn-light btn-sm delete-student-btn" data-id="${s.student_id}" data-name="${s.prefix || ''}${s.first_name || ''} ${s.last_name || ''}" title="ลบข้อมูล">
                          <i class="fa-solid fa-trash text-danger"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-container" style="padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>แสดง ${totalStudents ? startIndex + 1 : 0} ถึง ${Math.min(startIndex + this.pageSize, totalStudents)} จากทั้งหมด ${totalStudents} รายการ</span>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; margin-left: 1rem;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">จำนวนต่อหน้า:</span>
              <select id="student-page-size-select" class="form-control" style="width: auto; padding: 0.2rem 0.5rem; font-size: 0.85rem; height: auto;">
                <option value="10" ${this.pageSize === 10 ? 'selected' : ''}>10 รายการ</option>
                <option value="15" ${this.pageSize === 15 ? 'selected' : ''}>15 รายการ</option>
                <option value="25" ${this.pageSize === 25 ? 'selected' : ''}>25 รายการ</option>
                <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50 รายการ</option>
                <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100 รายการ</option>
              </select>
            </div>
          </div>
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
    const pageSizeSelect = document.getElementById('student-page-size-select');

    if (pageSizeSelect) {
      pageSizeSelect.onchange = (e) => {
        this.pageSize = parseInt(e.target.value, 10) || 10;
        this.currentPage = 1;
        this.refreshTable();
      };
    }

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

    const addBtn = document.getElementById('add-student-btn');
    if (addBtn) addBtn.onclick = () => this.openStudentModal();

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
          `คุณต้องการลบข้อมูลนักเรียน <b>${name} (${id})</b> หรือไม่?`,
          async () => {
            btn.disabled = true;
            try {
              await window.db.deleteStudent(id);
              window.utils.showToast(`ลบข้อมูลนักเรียนเรียบร้อยแล้ว`, 'success');
              this.refreshTable();
            } catch (err) {
              window.utils.showToast(`เกิดข้อผิดพลาดในการลบ: ${err.message}`, 'danger');
            }
          }
        );
      };
    });

    const selectAllCb = document.getElementById('select-all-students-cb');
    const rowCbs = document.querySelectorAll('.student-row-cb');
    const batchDelBtn = document.getElementById('batch-delete-students-btn');
    const selectedCountSpan = document.getElementById('selected-student-count');

    const updateBatchBtn = () => {
      const selected = Array.from(document.querySelectorAll('.student-row-cb:checked')).map(cb => cb.value);
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
        const selectedIds = Array.from(document.querySelectorAll('.student-row-cb:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) return;

        window.utils.confirmDialog(
          'ยืนยันการลบนักเรียนกลุ่ม',
          `คุณต้องการลบข้อมูลนักเรียนที่เลือกทั้งหมด <b>${selectedIds.length} รายการ</b> หรือไม่? (เอกสาร ปพ. ที่เชื่อมโยงจะถูกลบออกด้วย)`,
          async () => {
            batchDelBtn.disabled = true;
            batchDelBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังลบ...';
            try {
              await window.db.deleteStudentsBatch(selectedIds);
              window.utils.showToast(`ลบข้อมูลนักเรียน ${selectedIds.length} รายการ เรียบร้อยแล้ว`, 'success');
              this.refreshTable();
            } catch (err) {
              window.utils.showToast(`เกิดข้อผิดพลาดในการลบกลุ่ม: ${err.message}`, 'danger');
              batchDelBtn.disabled = false;
            }
          }
        );
      };
    }

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
          'ปีที่สำเร็จการศึกษา': s.academic_year
        }));
        window.utils.exportToExcel('รายการนักเรียน', 'Students', exportData);
      };
    }

    const printBtn = document.getElementById('print-students-btn');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
  },

  refreshTable(focusSearch = false) {
    const searchEl = document.getElementById('student-search-input');
    const cursorPos = searchEl ? searchEl.selectionStart : null;
    const isFocused = searchEl && document.activeElement === searchEl;

    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = this.render();
      this.initEvents();

      if (isFocused || focusSearch) {
        const newSearchEl = document.getElementById('student-search-input');
        if (newSearchEl) {
          newSearchEl.focus();
          if (cursorPos !== null) {
            newSearchEl.setSelectionRange(cursorPos, cursorPos);
          }
        }
      }
    }
  },

  openStudentModal(student = null, defaultBookCode = null) {
    const isEdit = !!student;
    const title = isEdit ? `<i class="fa-solid fa-pen-to-square text-primary"></i> แก้ไขข้อมูลนักเรียน` : `<i class="fa-solid fa-user-plus text-success"></i> เพิ่มนักเรียนใหม่`;
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
            ${books.map(b => {
              const isSelected = currentBookCode && b.book_code === currentBookCode;
              return `
              <option value="${b.book_code}" data-year="${b.academic_year}" data-num="${b.book_number}" data-type="${b.doc_type_code}" ${isSelected ? 'selected' : ''}>
                ${b.book_code} (${b.doc_type_code} - ปี ${b.academic_year} | เล่มที่/ชุดที่ ${b.book_number})
              </option>`;
            }).join('')}
          </select>
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
      </form>
    `;

    window.utils.openModal(title, bodyHtml, [
      { text: 'ยกเลิก', class: 'btn btn-secondary' },
      {
        text: 'บันทึกข้อมูล',
        class: 'btn btn-primary',
        onClick: async () => {
          const bookCodeSelect = document.getElementById('modal-book-code').value;
          const docNumber = document.getElementById('modal-doc-number').value.trim();
          const setNumber = document.getElementById('modal-set-number').value.trim();
          const studentId = document.getElementById('modal-student-id').value.trim();
          const prefix = document.getElementById('modal-prefix').value;
          const firstName = document.getElementById('modal-first-name').value.trim();
          const lastName = document.getElementById('modal-last-name').value.trim();
          const gradeLevel = document.getElementById('modal-grade-level').value;
          const academicYear = document.getElementById('modal-academic-year').value.trim();

          if (!docNumber || !setNumber || !studentId || !firstName || !lastName) {
            window.utils.showToast('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน', 'danger');
            return false;
          }

          const modalSubmitBtn = document.querySelector('.modal-footer .btn-primary');
          if (modalSubmitBtn) { modalSubmitBtn.disabled = true; modalSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...'; }

          try {
            const studentData = {
              doc_number: docNumber,
              set_number: setNumber,
              book_number: setNumber,
              book_code: bookCodeSelect,
              student_id: studentId,
              prefix: prefix,
              first_name: firstName,
              last_name: lastName,
              grade_level: gradeLevel,
              academic_year: academicYear,
              status: 'graduated'
            };

            if (isEdit) {
              await window.db.updateStudent(studentId, studentData);
              window.utils.showToast(`บันทึกข้อมูลนักเรียน ${studentId} เรียบร้อยแล้ว`, 'success');
            } else {
              await window.db.addStudent(studentData);
              window.utils.showToast(`เพิ่มนักเรียน ${studentId} เรียบร้อยแล้ว`, 'success');
            }

            window.utils.closeModal();
            this.refreshTable();
          } catch (err) {
            window.utils.showToast(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'danger');
            if (modalSubmitBtn) { modalSubmitBtn.disabled = false; modalSubmitBtn.innerHTML = 'บันทึกข้อมูล'; }
          }
        }
      }
    ]);
  }
};

window.studentsView = studentsView;
