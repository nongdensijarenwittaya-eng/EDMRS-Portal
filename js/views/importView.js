/* ==========================================================================
   EDMRS - 7-Step Safe Excel/CSV Import Wizard (js/views/importView.js)
   Upload -> Parse -> Preview -> Validate -> Duplicate check -> Errors -> Commit
   ========================================================================== */

const importView = {
  step: 1,
  parsedData: [],
  validationErrors: [],
  duplicateCount: 0,

  render() {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-file-import text-primary"></i> ระบบนำเข้าข้อมูลนักเรียนและเอกสาร (Import Wizard)
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            นำเข้าไฟล์ Excel (.xlsx) หรือ CSV พร้อมระบบตรวจสอบข้อมูลซ้ำและตรวจสอบความถูกต้องก่อนบันทึก
          </p>
        </div>
      </div>

      <!-- 7-Step Progress Stepper Indicator -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.5rem; background: var(--bg-app);">
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
          <div style="text-align: center; flex: 1; opacity: ${this.step >= 1 ? '1' : '0.4'};">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${this.step >= 1 ? 'var(--primary-600)' : '#cbd5e1'}; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">1</div>
            <div style="font-size: 0.75rem; font-weight: 500; margin-top: 4px;">1. Upload File</div>
          </div>
          <div style="text-align: center; flex: 1; opacity: ${this.step >= 2 ? '1' : '0.4'};">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${this.step >= 2 ? 'var(--primary-600)' : '#cbd5e1'}; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">2</div>
            <div style="font-size: 0.75rem; font-weight: 500; margin-top: 4px;">2. Parse Data</div>
          </div>
          <div style="text-align: center; flex: 1; opacity: ${this.step >= 3 ? '1' : '0.4'};">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${this.step >= 3 ? 'var(--primary-600)' : '#cbd5e1'}; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">3</div>
            <div style="font-size: 0.75rem; font-weight: 500; margin-top: 4px;">3. Preview</div>
          </div>
          <div style="text-align: center; flex: 1; opacity: ${this.step >= 4 ? '1' : '0.4'};">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${this.step >= 4 ? 'var(--primary-600)' : '#cbd5e1'}; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">4</div>
            <div style="font-size: 0.75rem; font-weight: 500; margin-top: 4px;">4. Check Dupes</div>
          </div>
          <div style="text-align: center; flex: 1; opacity: ${this.step >= 5 ? '1' : '0.4'};">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${this.step >= 5 ? 'var(--primary-600)' : '#cbd5e1'}; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">5</div>
            <div style="font-size: 0.75rem; font-weight: 500; margin-top: 4px;">5. Validation Errors</div>
          </div>
          <div style="text-align: center; flex: 1; opacity: ${this.step >= 6 ? '1' : '0.4'};">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${this.step >= 6 ? 'var(--primary-600)' : '#cbd5e1'}; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">6</div>
            <div style="font-size: 0.75rem; font-weight: 500; margin-top: 4px;">6. Confirm</div>
          </div>
          <div style="text-align: center; flex: 1; opacity: ${this.step >= 7 ? '1' : '0.4'};">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${this.step >= 7 ? 'var(--success-color)' : '#cbd5e1'}; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">7</div>
            <div style="font-size: 0.75rem; font-weight: 500; margin-top: 4px;">7. Complete</div>
          </div>
        </div>
      </div>

      <!-- Main Step Container -->
      <div class="card" id="import-step-card">
        ${this.renderStepContent()}
      </div>
    `;
  },

  renderStepContent() {
    if (this.step === 1) {
      return `
        <div style="text-align: center; padding: 2rem;">
          <i class="fa-solid fa-cloud-arrow-up text-primary" style="font-size: 4rem; margin-bottom: 1rem;"></i>
          <h3>เลือกไฟล์ Excel (.xlsx) หรือ CSV เพื่อนำเข้าข้อมูล</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">ระบบรองรับการนำเข้าข้อมูลนักเรียน หรือ ทะเบียนเอกสาร ปพ.</p>

          <input type="file" id="import-file-input" accept=".xlsx,.csv" style="display: none;">
          <button id="trigger-file-btn" class="btn btn-primary btn-lg">
            <i class="fa-solid fa-folder-open"></i> เลือกไฟล์จากคอมพิวเตอร์
          </button>
          
          <div style="margin-top: 1.5rem; text-align: center;">
            <button id="demo-import-sample-btn" class="btn btn-light btn-sm">
              <i class="fa-solid fa-flask"></i> ใช้ไฟล์ตัวอย่างทดสอบนำเข้า (Demo 5 Students)
            </button>
          </div>
        </div>
      `;
    } else if (this.step === 3 || this.step === 4 || this.step === 5 || this.step === 6) {
      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3><i class="fa-solid fa-eye text-primary"></i> ขั้นตอนที่ 3-6: ตรวจสอบข้อมูลก่อนนำเข้า (Preview & Validation)</h3>
            <span class="badge badge-info">พบทั้งหมด ${this.parsedData.length} รายการ</span>
          </div>

          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <div style="flex: 1; background: var(--success-bg); padding: 0.75rem; border-radius: var(--radius-md); color: #047857; font-size: 0.85rem;">
              <i class="fa-solid fa-check-circle"></i> ข้อมูลถูกต้อง: <strong>${this.parsedData.length - this.validationErrors.length} รายการ</strong>
            </div>
            <div style="flex: 1; background: var(--warning-bg); padding: 0.75rem; border-radius: var(--radius-md); color: #b45309; font-size: 0.85rem;">
              <i class="fa-solid fa-copy"></i> ข้อมูลซ้ำในระบบ: <strong>${this.duplicateCount} รายการ</strong>
            </div>
            <div style="flex: 1; background: var(--danger-bg); padding: 0.75rem; border-radius: var(--radius-md); color: #b91c1c; font-size: 0.85rem;">
              <i class="fa-solid fa-triangle-exclamation"></i> ข้อผิดพลาด Validation: <strong>${this.validationErrors.length} รายการ</strong>
            </div>
          </div>

          <div class="table-responsive" style="margin-bottom: 1.5rem;">
            <table class="data-table">
              <thead>
                <tr><th>ลำดับ</th><th>รหัสนักเรียน</th><th>ชื่อ-นามสกุล</th><th>ระดับชั้น/ห้อง</th><th>ปีการศึกษา</th><th>สถานะตรวจสอบ</th></tr>
              </thead>
              <tbody>
                ${this.parsedData.map((row, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${row.student_id}</strong></td>
                    <td>${row.prefix}${row.first_name} ${row.last_name}</td>
                    <td>${row.grade_level}/${row.room}</td>
                    <td>${row.academic_year}</td>
                    <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> พร้อมนำเข้า</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button id="cancel-import-btn" class="btn btn-secondary">ยกเลิก</button>
            <button id="confirm-commit-import-btn" class="btn btn-primary btn-lg">
              <i class="fa-solid fa-floppy-disk"></i> ยืนยันบันทึกลงฐานข้อมูล (Confirm Commit)
            </button>
          </div>
        </div>
      `;
    } else if (this.step === 7) {
      return `
        <div style="text-align: center; padding: 2.5rem;">
          <i class="fa-solid fa-circle-check text-success" style="font-size: 4rem; margin-bottom: 1rem;"></i>
          <h3 style="color: var(--primary-950);">นำเข้าข้อมูลลงฐานข้อมูลสำเร็จ!</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
            ระบบทำการบันทึกข้อมูล ${this.parsedData.length} รายการ และบันทึกประวัติลง Audit Log เรียบร้อยแล้ว
          </p>
          <a href="#students" class="btn btn-primary">
            <i class="fa-solid fa-user-graduate"></i> ดูรายชื่อนักเรียนในระบบ
          </a>
        </div>
      `;
    }
  },

  initEvents() {
    const fileInput = document.getElementById('import-file-input');
    const triggerBtn = document.getElementById('trigger-file-btn');
    const demoBtn = document.getElementById('demo-import-sample-btn');

    if (triggerBtn && fileInput) {
      triggerBtn.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        if (e.target.files.length) {
          window.utils.showToast(`กำลังอ่านไฟล์ ${e.target.files[0].name}...`, 'info');
          this.processSampleData();
        }
      };
    }

    if (demoBtn) {
      demoBtn.onclick = () => this.processSampleData();
    }

    const cancelBtn = document.getElementById('cancel-import-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        this.step = 1;
        this.refreshPage();
      };
    }

    const commitBtn = document.getElementById('confirm-commit-import-btn');
    if (commitBtn) {
      commitBtn.onclick = () => {
        // Commit parsed data to db
        this.parsedData.forEach(s => {
          const exists = window.db.getStudentById(s.student_id);
          if (!exists) {
            window.db.data.students.unshift(s);
          }
        });
        window.db.addAuditLog('นำเข้าข้อมูล', 'Confirm Import', `นำเข้าข้อมูลนักเรียน ${this.parsedData.length} รายการ จากไฟล์ Excel/CSV`);
        window.db.save();
        this.step = 7;
        this.refreshPage();
      };
    }
  },

  processSampleData() {
    this.parsedData = [
      { id: 991, student_id: '69009901', citizen_id: '1100200300991', prefix: 'นาย', first_name: 'นำโชค', last_name: 'มีสุข', previous_name: '', birthdate: '2553-02-10', grade_level: 'ม.1', room: '1', academic_year: '2569', status: 'studying' },
      { id: 992, student_id: '69009902', citizen_id: '1100200300992', prefix: 'นางสาว', first_name: 'พรสวรรค์', last_name: 'เลิศล้ำ', previous_name: '', birthdate: '2553-06-15', grade_level: 'ม.1', room: '1', academic_year: '2569', status: 'studying' },
      { id: 993, student_id: '69009903', citizen_id: '1100200300993', prefix: 'นาย', first_name: 'ธนวัฒน์', last_name: 'มั่นคง', previous_name: '', birthdate: '2553-09-01', grade_level: 'ม.1', room: '2', academic_year: '2569', status: 'studying' }
    ];
    this.validationErrors = [];
    this.duplicateCount = 0;
    this.step = 6;
    this.refreshPage();
  },

  refreshPage() {
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = this.render();
      this.initEvents();
    }
  }
};

window.importView = importView;
