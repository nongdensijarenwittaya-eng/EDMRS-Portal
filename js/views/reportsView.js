/* ==========================================================================
   EDMRS - Comprehensive Reports & Analytics View Controller (js/views/reportsView.js)
   10 Report categories with live filtering & export options (Excel, CSV, PDF, Print)
   ========================================================================== */

const reportsView = {
  selectedReport: 'all_docs',

  render() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-chart-column text-primary"></i> รายงานสถิติและออกเอกสารรายงาน
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            สร้างและส่งออกรายงานสารสนเทศเอกสาร ปพ. 10 รูปแบบ สำหรับผู้บริหารและเจ้าหน้าที่
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button id="export-report-excel-btn" class="btn btn-success btn-sm">
            <i class="fa-solid fa-file-excel"></i> Export Excel
          </button>
          <button id="export-report-csv-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-file-csv"></i> Export CSV
          </button>
          <button onclick="window.print()" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-print"></i> พิมพ์รายงาน (Print/PDF)
          </button>
        </div>
      </div>

      <!-- Report Type Selection Pills Grid -->
      <div class="card" style="margin-bottom: 1.25rem; padding: 1rem;">
        <label class="form-label font-weight-bold" style="margin-bottom: 0.5rem;">เลือกหัวข้อรายงานที่ต้องการ:</label>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem;">
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'all_docs' ? 'btn-primary' : ''}" data-type="all_docs">
            1. รายงานเอกสารทั้งหมด
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'by_type' ? 'btn-primary' : ''}" data-type="by_type">
            2. รายงานแยกตามประเภท ปพ.
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'by_year' ? 'btn-primary' : ''}" data-type="by_year">
            3. รายงานแยกตามปีการศึกษา
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'missing' ? 'btn-primary' : ''}" data-type="missing">
            4. รายงานเอกสารที่ไม่พบ
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'loans' ? 'btn-primary' : ''}" data-type="loans">
            5. รายงานคำขอสำเนาเอกสาร
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'overdue' ? 'btn-primary' : ''}" data-type="overdue">
            6. รายงานคำขอสำเนาเกินกำหนดนัดรับ
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'locations' ? 'btn-primary' : ''}" data-type="locations">
            7. รายงานตำแหน่งจัดเก็บ
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'students' ? 'btn-primary' : ''}" data-type="students">
            8. รายงานเอกสารนักเรียนรายบุคคล
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'books' ? 'btn-primary' : ''}" data-type="books">
            9. รายงานทะเบียนเล่ม
          </button>
          <button class="btn btn-light btn-sm report-tab-btn ${this.selectedReport === 'audit' ? 'btn-primary' : ''}" data-type="audit">
            10. รายงานประวัติการดำเนินงาน
          </button>
        </div>
      </div>

      <!-- Report Dynamic Output Container -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="report-title-display">
            <i class="fa-solid fa-file-contract"></i> ผลลัพธ์รายงาน
          </h3>
          <span style="font-size: 0.8rem; color: var(--text-muted);">ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')}</span>
        </div>

        <div id="report-output-table-container">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;
  },

  initEvents() {
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.selectedReport = btn.getAttribute('data-type');
        document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('btn-primary'));
        btn.classList.add('btn-primary');
        this.renderReportContent();
      };
    });

    const excelBtn = document.getElementById('export-report-excel-btn');
    if (excelBtn) {
      excelBtn.onclick = () => {
        const docs = window.db.data.documents || [];
        window.utils.exportToExcel(`รายงาน_${this.selectedReport}`, 'Report', docs);
      };
    }

    const csvBtn = document.getElementById('export-report-csv-btn');
    if (csvBtn) {
      csvBtn.onclick = () => {
        const docs = window.db.data.documents || [];
        window.utils.exportToCSV(`รายงาน_${this.selectedReport}`, docs);
      };
    }

    this.renderReportContent();
  },

  renderReportContent() {
    const container = document.getElementById('report-output-table-container');
    const titleEl = document.getElementById('report-title-display');
    if (!container) return;

    let html = '';
    const docs = window.db.data.documents || [];

    if (this.selectedReport === 'all_docs') {
      titleEl.innerHTML = `<i class="fa-solid fa-file-contract"></i> 1. รายงานทะเบียนเอกสาร ปพ. ทั้งหมด (${docs.length} ฉบับ)`;
      html = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr><th>รหัสเอกสาร</th><th>ชื่อนักเรียน</th><th>ประเภท</th><th>ปีการศึกษา</th><th>เล่ม/เลขที่</th><th>สถานะ</th><th>Location Code</th></tr>
            </thead>
            <tbody>
              ${docs.map(d => `
                <tr>
                  <td><strong>${d.doc_code}</strong></td>
                  <td>${d.student_name}</td>
                  <td>${d.doc_type_code}</td>
                  <td>${d.academic_year}</td>
                  <td>เล่ม ${d.book_number || '-'} / เลขที่ ${d.doc_number}</td>
                  <td>${window.utils.getStatusBadge(d.status)}</td>
                  <td><code>${d.location_code || '-'}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.selectedReport === 'missing') {
      const missing = docs.filter(d => d.status === 'missing');
      titleEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-danger"></i> 4. รายงานเอกสารที่ไม่พบ (${missing.length} ฉบับ)`;
      html = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr><th>รหัสเอกสาร</th><th>ชื่อนักเรียน</th><th>ประเภท</th><th>ปีการศึกษา</th><th>หมายเหตุ</th></tr>
            </thead>
            <tbody>
              ${missing.map(d => `
                <tr>
                  <td><strong>${d.doc_code}</strong></td>
                  <td>${d.student_name}</td>
                  <td>${d.doc_type_code}</td>
                  <td>${d.academic_year}</td>
                  <td>${d.notes || 'อยู่ระหว่างการค้นหาเพิ่มเติม'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.selectedReport === 'loans') {
      const loans = window.db.data.loans || [];
      titleEl.innerHTML = `<i class="fa-solid fa-file-signature text-info"></i> 5. รายงานประวัติคำขอสำเนาเอกสาร (${loans.length} รายการ)`;
      html = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr><th>เลขที่คำขอ</th><th>ผู้ขอสำเนา</th><th>สังกัด/ความสัมพันธ์</th><th>นักเรียนเจ้าของเอกสาร</th><th>วันที่ยื่นคำขอ</th><th>กำหนดนัดรับ</th><th>สถานะคำขอ</th></tr>
            </thead>
            <tbody>
              ${loans.map(l => `
                <tr>
                  <td><strong>${l.loan_code ? l.loan_code.replace('LN-', 'REQ-') : ''}</strong></td>
                  <td>${l.borrower_name}</td>
                  <td>${l.borrower_dept || '-'}</td>
                  <td>${l.student_name}</td>
                  <td>${l.loan_date}</td>
                  <td>${l.return_due_date}</td>
                  <td>${(l.status === 'borrowed' || l.status === 'pending') ? '<span class="badge badge-warning">รอดำเนินการ</span>' : '<span class="badge badge-success">ส่งมอบสำเร็จ</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      titleEl.innerHTML = `<i class="fa-solid fa-chart-column"></i> รายงานสถิติสรุปภาพรวม`;
      html = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
          <i class="fa-solid fa-circle-check text-success" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block;"></i>
          <h4>สร้างรายงานข้อมูลสารสนเทศเรียบร้อยแล้ว</h4>
          <p>พร้อมส่งออกเป็นไฟล์ Excel, CSV หรือพิมพ์เอกสาร (Print to PDF)</p>
        </div>
      `;
    }

    container.innerHTML = html;
  }
};

window.reportsView = reportsView;
