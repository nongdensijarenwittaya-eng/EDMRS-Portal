/* ==========================================================================
   EDMRS - Student Profile & Complete Document Vault View Controller (js/views/studentDetailView.js)
   ========================================================================== */

const studentDetailView = {
  render(params = {}) {
    const studentId = params.id || '65001234';
    const student = window.db.getStudentById(studentId);

    if (!student) {
      return `
        <div class="card text-center" style="padding: 3rem;">
          <i class="fa-solid fa-user-slash text-danger" style="font-size: 3rem; margin-bottom: 1rem;"></i>
          <h3>ไม่พบข้อมูลนักเรียนรหัส "${studentId}"</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">โปรดตรวจสอบรหัสนักเรียนอีกครั้ง</p>
          <a href="#students" class="btn btn-primary"><i class="fa-solid fa-arrow-left"></i> กลับไปหน้ารายชื่อนักเรียน</a>
        </div>
      `;
    }

    const studentDocs = window.db.getDocuments({ student_id: student.student_id });

    return `
      <!-- Back Navigation Bar -->
      <div style="margin-bottom: 1rem;">
        <a href="#students" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-arrow-left"></i> ย้อนกลับไปหน้ารายชื่อนักเรียน
        </a>
      </div>

      <!-- Student Profile Master Header Card -->
      <div class="card" style="background: linear-gradient(135deg, #ffffff, #f8fafc); border-left: 6px solid var(--primary-600); margin-bottom: 1.5rem;">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <div style="width: 72px; height: 72px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--primary-600), var(--primary-900)); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; box-shadow: var(--shadow-md);">
              ${student.first_name.charAt(0)}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--primary-950); margin: 0;">
                  ${student.prefix}${student.first_name} ${student.last_name}
                </h2>
                ${window.utils.getStatusBadge(student.status)}
              </div>
              <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 2px;">
                รหัสนักเรียน: <strong>${student.student_id}</strong>
              </p>
              ${student.previous_name ? `<span style="font-size: 0.8rem; color: var(--primary-600);"><i class="fa-solid fa-info-circle"></i> ชื่อเดิม: ${student.previous_name}</span>` : ''}
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
            <div style="background: white; border: 1px solid var(--border-color); padding: 0.6rem 1rem; border-radius: var(--radius-md); text-align: center;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ระดับชั้น</span>
              <strong style="font-size: 1.1rem; color: var(--primary-800);">${student.grade_level || '-'}</strong>
            </div>
            <div style="background: white; border: 1px solid var(--border-color); padding: 0.6rem 1rem; border-radius: var(--radius-md); text-align: center;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">ปีการศึกษา</span>
              <strong style="font-size: 1.1rem; color: var(--primary-800);">${student.academic_year}</strong>
            </div>
            <div style="background: white; border: 1px solid var(--border-color); padding: 0.6rem 1rem; border-radius: var(--radius-md); text-align: center;">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">เอกสารที่มีในระบบ</span>
              <strong style="font-size: 1.1rem; color: var(--success-color);">${studentDocs.length} ฉบับ</strong>
            </div>
            <button id="edit-student-profile-btn" class="btn btn-warning btn-sm" title="แก้ไขข้อมูลนักเรียน">
              <i class="fa-solid fa-pen-to-square"></i> แก้ไขข้อมูล
            </button>
            <button id="delete-student-profile-btn" class="btn btn-danger btn-sm" title="ลบข้อมูลนักเรียน">
              <i class="fa-solid fa-trash-can"></i> ลบนักเรียน
            </button>
          </div>
        </div>
      </div>

      <!-- Complete Student Documents Table with Storage Hierarchy & Actions -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fa-solid fa-folder-closed"></i> ทะเบียนเอกสาร ปพ. ทั้งหมดของนักเรียน (${studentDocs.length} รายการ)
          </h3>
          <div class="card-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button id="add-student-doc-btn" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-file-circle-plus"></i> + เพิ่มเอกสาร ปพ. ใหม่
            </button>
            <button id="print-student-profile-btn" class="btn btn-secondary btn-sm">
              <i class="fa-solid fa-print"></i> พิมพ์ประวัติเอกสาร
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ประเภทเอกสาร</th>
                <th>รหัสเอกสาร</th>
                <th>เล่มที่ / เลขที่</th>
                <th>วันที่จัดทำ</th>
                <th>สถานะเอกสาร</th>
                <th>ตำแหน่งจัดเก็บปัจจุบัน</th>
                <th style="text-align: center;">จัดการข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              ${studentDocs.length ? studentDocs.map(d => {
                const loc = window.db.getLocationByCode(d.location_code);
                const locDesc = loc ? `${loc.building} → ${loc.room} → ${loc.cabinet} → ${loc.shelf} → ${loc.folder}` : '-';

                return `
                  <tr>
                    <td><strong style="color: var(--primary-700);">${d.doc_type_code}</strong></td>
                    <td><strong>${d.doc_code}</strong></td>
                    <td>เล่ม ${d.book_number || '-'} / เลขที่ ${d.doc_number}</td>
                    <td>${window.utils.formatThaiDate(d.date_created)}</td>
                    <td>${window.utils.getStatusBadge(d.status)}</td>
                    <td>
                      <div>
                        <code style="font-weight: 600; color: var(--primary-800);">${d.location_code || '-'}</code>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${locDesc}</div>
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
                        <a href="#locations" class="btn btn-secondary btn-sm" title="ดูสถานที่จัดเก็บ">
                          <i class="fa-solid fa-boxes-stacked"></i> ดูสถานที่
                        </a>
                        <button class="btn btn-warning btn-sm edit-doc-detail-btn" data-id="${d.id}" title="แก้ไขเอกสาร">
                          <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-doc-detail-btn" data-id="${d.id}" data-code="${d.doc_code}" title="ลบเอกสาร">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
                    <div style="max-width: 450px; margin: 0 auto; text-align: center;">
                      <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--primary-50); color: var(--primary-600); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 0.75rem auto;">
                        <i class="fa-solid fa-folder-open"></i>
                      </div>
                      <h4 style="font-weight: 700; color: var(--primary-950); margin-bottom: 0.35rem;">ยังไม่มีรายการเอกสาร ปพ. สำหรับนักเรียนคนนี้</h4>
                      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                        สามารถกดปุ่มเพิ่มเอกสารด้านล่าง เพื่อบันทึก หรือเพิ่มทะเบียนเอกสาร ปพ.1 - ปพ.9 ให้นักเรียน (${student.prefix}${student.first_name} ${student.last_name}) ได้ทันที
                      </p>
                      <button id="add-student-doc-empty-btn" class="btn btn-primary">
                        <i class="fa-solid fa-file-circle-plus"></i> + เพิ่มเอกสาร ปพ. ใหม่ให้นักเรียนคนนี้
                      </button>
                    </div>
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
    const triggerAddDoc = () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const id = params.get('id');
      const student = window.db.getStudentById(id);
      if (student && window.documentsView) {
        const templateDoc = {
          student_id: student.student_id,
          student_name: `${student.prefix}${student.first_name} ${student.last_name}`,
          academic_year: student.academic_year || '2569',
          book_number: student.set_number || student.book_number || '01',
          doc_number: student.doc_number || '001',
          file_url: student.file_url || ''
        };
        window.documentsView.openAddDocModal(templateDoc);
      }
    };

    const addDocBtn = document.getElementById('add-student-doc-btn');
    if (addDocBtn) addDocBtn.onclick = triggerAddDoc;

    const addDocEmptyBtn = document.getElementById('add-student-doc-empty-btn');
    if (addDocEmptyBtn) addDocEmptyBtn.onclick = triggerAddDoc;

    const printBtn = document.getElementById('print-student-profile-btn');
    if (printBtn) printBtn.onclick = () => window.print();

    const editStdBtn = document.getElementById('edit-student-profile-btn');
    if (editStdBtn) {
      editStdBtn.onclick = () => {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const id = params.get('id');
        const student = window.db.getStudentById(id);
        if (student && window.studentsView) {
          window.studentsView.openStudentModal(student);
        }
      };
    }

    const delStdBtn = document.getElementById('delete-student-profile-btn');
    if (delStdBtn) {
      delStdBtn.onclick = () => {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const id = params.get('id');
        const student = window.db.getStudentById(id);
        if (student) {
          window.utils.confirmDialog(
            'ยืนยันการลบนักเรียน',
            `คุณต้องการลบข้อมูลนักเรียน <b>${student.prefix}${student.first_name} ${student.last_name} (${student.student_id})</b> ใช่หรือไม่?`,
            () => {
              window.db.deleteStudent(student.student_id);
              window.utils.showToast('ลบข้อมูลนักเรียนเรียบร้อยแล้ว', 'success');
              window.location.hash = '#students';
            }
          );
        }
      };
    }

    document.querySelectorAll('.edit-doc-detail-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const doc = (window.db.data.documents || []).find(d => d.id == id);
        if (doc && window.documentsView) {
          window.documentsView.openAddDocModal(doc);
        }
      };
    });

    document.querySelectorAll('.delete-doc-detail-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const code = btn.getAttribute('data-code');
        window.utils.confirmDialog(
          'ยืนยันการลบเอกสาร',
          `คุณต้องการลบเอกสารรหัส <b>${code}</b> ใช่หรือไม่?`,
          () => {
            window.db.deleteDocument(code, id);
            window.utils.showToast('ลบเอกสารเรียบร้อยแล้ว', 'success');
            window.location.reload();
          }
        );
      };
    });


  }
};

window.studentDetailView = studentDetailView;
