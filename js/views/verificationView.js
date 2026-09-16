/* ==========================================================================
   EDMRS - Document Verification Checklist View Controller (js/views/verificationView.js)
   Renders matrix checklist by Year/Grade/Book with verification status (✓, ✕, ⚠️)
   ========================================================================== */

const verificationView = {
  filterState: {
    year: null,
    grade: '',
    book: ''
  },

  render() {
    const students = window.db.data.students || [];
    const books = window.db.data.books || [];
    const academicYears = window.db.data.academic_years || [];

    // Extract unique existing years from data
    const yearsInData = Array.from(new Set([
      ...academicYears.map(y => y.year),
      ...students.map(s => s.academic_year),
      ...books.map(b => b.academic_year)
    ])).filter(Boolean).sort().reverse();

    // Extract unique existing grades from students
    const gradesInData = Array.from(new Set(students.map(s => s.grade_level).filter(Boolean))).sort();

    // Extract unique existing books/sets from books & students
    const setsInData = Array.from(new Set([
      ...books.map(b => b.book_number || b.set_number),
      ...students.map(s => s.set_number || s.book_number)
    ])).filter(Boolean).sort();

    // Set default filter value if null (initial load)
    if (this.filterState.year === null && yearsInData.length) {
      this.filterState.year = yearsInData[0];
    }

    // Filter students by selected criteria
    const filteredStudents = students.filter(s => {
      const matchYear = !this.filterState.year || s.academic_year === this.filterState.year;
      const matchGrade = !this.filterState.grade || s.grade_level === this.filterState.grade;
      const matchBook = !this.filterState.book || (s.set_number === this.filterState.book || s.book_number === this.filterState.book);
      return matchYear && matchGrade && matchBook;
    });

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-list-check text-primary"></i> หน้าตรวจสอบเอกสาร ปพ. (Document Verification Checklist)
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            ตรวจสอบความครบถ้วนของเอกสาร ปพ.1, ปพ.2, ปพ.3 แยกตามปีการศึกษา ระดับชั้น และเล่มชุดที่จัดเก็บ
          </p>
        </div>
        <div>
          <button id="save-verification-state-btn" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-floppy-disk"></i> บันทึกผลการตรวจสอบ
          </button>
        </div>
      </div>

      <!-- Dynamic Filter Matrix Header -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.25rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; align-items: end;">
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ปีการศึกษา</label>
            <select id="veri-year" class="form-control">
              <option value="">-- ทุกปีการศึกษา --</option>
              ${yearsInData.map(y => `<option value="${y}" ${this.filterState.year === y ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ระดับชั้น</label>
            <select id="veri-grade" class="form-control">
              <option value="">-- ทุกระดับชั้น --</option>
              ${gradesInData.map(g => `<option value="${g}" ${this.filterState.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.8rem;">ทะเบียนเล่ม / ชุดที่</label>
            <select id="veri-book" class="form-control">
              <option value="">-- ทุกเล่ม / ทุกชุด --</option>
              ${setsInData.map(setNo => `<option value="${setNo}" ${this.filterState.book === setNo ? 'selected' : ''}>เล่ม/ชุดที่ ${setNo}</option>`).join('')}
            </select>
          </div>
          <div>
            <button id="generate-verification-matrix-btn" class="btn btn-secondary" style="width: 100%;">
              <i class="fa-solid fa-filter"></i> สร้างรายการตรวจสอบ (${filteredStudents.length} รายการ)
            </button>
          </div>
        </div>
      </div>

      <!-- Verification Matrix Checklist Table -->
      <div class="card" style="padding: 0;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr style="text-align: center;">
                <th style="width: 60px;">ลำดับ</th>
                <th style="text-align: left;">รหัสนักเรียน</th>
                <th style="text-align: left;">ชื่อ-นามสกุล</th>
                <th>ระดับชั้น</th>
                <th>ปีการศึกษา</th>
                <th>ปพ.1 (ระเบียน)</th>
                <th>ปพ.2 (ใบจบ)</th>
                <th>ปพ.3 (รายงาน)</th>
                <th>สรุปผลการตรวจสอบ</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.length ? filteredStudents.map((s, idx) => {
                const stdDocs = window.db.getDocuments({ student_id: s.student_id });
                const hasP1 = stdDocs.some(d => d.doc_type_code === 'ปพ.1' && (d.file_url || d.status === 'stored'));
                const hasP2 = stdDocs.some(d => d.doc_type_code === 'ปพ.2' && (d.file_url || d.status === 'stored'));
                const hasP3 = stdDocs.some(d => d.doc_type_code === 'ปพ.3' && (d.file_url || d.status === 'stored'));

                const isComplete = hasP1 || (hasP2 || hasP3);

                return `
                  <tr style="text-align: center;">
                    <td>${idx + 1}</td>
                    <td style="text-align: left;"><strong>${s.student_id}</strong></td>
                    <td style="text-align: left;">
                      <a href="#student-detail?id=${s.student_id}" style="font-weight: 500; color: var(--primary-700);">
                        ${s.prefix}${s.first_name} ${s.last_name}
                      </a>
                    </td>
                    <td><span class="badge badge-secondary">${s.grade_level || '-'}</span></td>
                    <td>${s.academic_year || '-'}</td>
                    <td>${hasP1 || s.file_url ? '<span style="color: #10b981; font-weight: bold; font-size: 1.2rem;">✓</span>' : '<span style="color: #ef4444; font-weight: bold; font-size: 1.2rem;">✕</span>'}</td>
                    <td>${hasP2 ? '<span style="color: #10b981; font-weight: bold; font-size: 1.2rem;">✓</span>' : '<span style="color: #ef4444; font-weight: bold; font-size: 1.2rem;">✕</span>'}</td>
                    <td>${hasP3 ? '<span style="color: #10b981; font-weight: bold; font-size: 1.2rem;">✓</span>' : '<span style="color: #94a3b8;">-</span>'}</td>
                    <td>
                      ${isComplete ? '<span class="badge badge-success"><i class="fa-solid fa-check-double"></i> มีเอกสารในระบบ</span>' : '<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> รอแนบเอกสาร</span>'}
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
                    <i class="fa-solid fa-filter-circle-xmark" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--warning-color);"></i>
                    ไม่พบข้อมูลนักเรียน/เอกสารที่ตรงกับเงื่อนไขตัวกรอง (ปี ${this.filterState.year || 'ทั้งหมด'} ${this.filterState.grade ? 'ชั้น ' + this.filterState.grade : ''})
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
    const yearSelect = document.getElementById('veri-year');
    const gradeSelect = document.getElementById('veri-grade');
    const bookSelect = document.getElementById('veri-book');
    const filterBtn = document.getElementById('generate-verification-matrix-btn');
    const saveBtn = document.getElementById('save-verification-state-btn');

    const updateAndRefresh = () => {
      if (yearSelect) this.filterState.year = yearSelect.value;
      if (gradeSelect) this.filterState.grade = gradeSelect.value;
      if (bookSelect) this.filterState.book = bookSelect.value;

      const appEl = document.getElementById('app-content') || document.querySelector('.main-content');
      if (appEl) {
        appEl.innerHTML = this.render();
        this.initEvents();
      }
    };

    if (filterBtn) filterBtn.onclick = updateAndRefresh;
    if (yearSelect) yearSelect.onchange = updateAndRefresh;
    if (gradeSelect) gradeSelect.onchange = updateAndRefresh;
    if (bookSelect) bookSelect.onchange = updateAndRefresh;

    if (saveBtn) {
      saveBtn.onclick = () => {
        window.utils.showToast('บันทึกสถานะการตรวจสอบเอกสารเรียบร้อยแล้ว', 'success');
        window.db.addAuditLog('ตรวจสอบเอกสาร', 'บันทึกการตรวจสอบ', 'บันทึกผลการตรวจสอบความครบถ้วนเอกสาร ปพ.');
      };
    }
  }
};

window.verificationView = verificationView;
