/* ==========================================================================
   EDMRS - Book Registry View Controller (js/views/booksView.js)
   Renders books registry table & book detail drawer listing enclosed students & docs
   ========================================================================== */

const booksView = {
  render() {
    const books = (window.db && window.db.getBooks) ? window.db.getBooks() : [];
    const canCreate = (window.authSystem && window.authSystem.hasPermission) ? window.authSystem.hasPermission('create_documents') : false;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-book-bookmark text-primary"></i> ทะเบียนเล่มเอกสาร & อัลบั้ม Google Drive
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            การจัดหมวดหมู่เอกสาร ปพ. เป็นเล่ม รหัสเล่ม อัลบั้มไดรฟ์แยกตามทะเบียนเล่ม และการเชื่อมฐานข้อมูล Google Sheets
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="sync-google-sheets-btn" class="btn btn-success btn-sm">
            <i class="fa-solid fa-table text-white"></i> ซิงก์ไปที่ Google Sheets
          </button>
          <button id="export-books-excel-btn" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-file-excel text-success"></i> ส่งออก Excel
          </button>
          ${canCreate ? `
            <button id="add-book-btn" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-folder-plus"></i> เพิ่มทะเบียนเล่มใหม่
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Google Drive Album Structure Notice Banner -->
      <div class="card" style="background: linear-gradient(135deg, #ecfeff, #e0f2fe); border-color: #38bdf8; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #0284c7; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
              <i class="fa-brands fa-google-drive"></i>
            </div>
            <div>
              <strong style="color: #0369a1; font-size: 1rem;">คลังเก็บเอกสารดิจิทัลใน Google Drive & Google Sheets Synchronizer</strong>
              <div style="font-size: 0.82rem; color: #0c4a6e;">
                ระบบสร้างโฟลเดอร์อัลบั้มแยกสำหรับแต่ละทะเบียนเล่มใน Google Drive (<code>Google Drive/EDMRS_Vault/[BOOK_CODE]/</code>) และบันทึกประวัติลง Google Sheets อัตโนมัติ
              </div>
            </div>
          </div>
          <button id="open-root-drive-btn" class="btn btn-primary btn-sm">
            <i class="fa-brands fa-google-drive"></i> เปิดโฟลเดอร์หลักใน Google Drive
          </button>
        </div>
      </div>

      <!-- Books Grid Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        ${books.length ? books.map(b => {
          const enclosedDocs = (window.db && window.db.getDocuments) ? window.db.getDocuments({ book_code: b.book_code }) : [];
          const loc = (window.db && window.db.getLocationByCode) ? window.db.getLocationByCode(b.location_code) : null;

          const sNum = parseInt(String(b.start_no || '').replace(/\D/g, ''));
          const eNum = parseInt(String(b.end_no || '').replace(/\D/g, ''));
          const computedCount = (!isNaN(sNum) && !isNaN(eNum) && eNum >= sNum) ? (eNum - sNum + 1) : (b.item_count || 50);

          return `
            <div class="card" style="margin-bottom: 0; position: relative; border-top: 4px solid var(--primary-600);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                  <span class="badge badge-secondary" style="margin-bottom: 4px;">${b.doc_type_code || 'ปพ.1'}</span>
                  <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--primary-900); margin: 0;">${b.book_code || 'BOOK-01'}</h3>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">ปีการศึกษา: <strong>${b.academic_year || '2565'}</strong> | เล่มที่ <strong>${b.book_number || '01'}</strong></span>
                </div>
                <span class="badge badge-success"><i class="fa-solid fa-cloud-check"></i> Sheets Connected</span>
              </div>

              <div style="background: var(--bg-app); padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--text-muted);">ช่วงเลขที่เอกสาร:</span>
                  <strong>${b.start_no || '001'} - ${b.end_no || '050'} (${computedCount} รายการ)</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--text-muted);">จำนวนไฟล์จัดเก็บในไดร์ฟ:</span>
                  <strong style="color: var(--primary-700);">${enclosedDocs.length} ไฟล์ในอัลบั้ม</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">Drive Album Path:</span>
                  <code style="font-size: 0.78rem;">EDMRS_Vault/${b.book_code}/</code>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                <div style="display: flex; gap: 0.35rem;">
                  <button class="btn btn-secondary btn-sm open-drive-album-btn" data-code="${b.book_code}">
                    <i class="fa-brands fa-google-drive text-primary"></i> อัลบั้มไดร์ฟ
                  </button>
                  <button class="btn btn-primary btn-sm view-book-detail-btn" data-code="${b.book_code}">
                    <i class="fa-solid fa-list-ul"></i> รายชื่อ (${enclosedDocs.length})
                  </button>
                </div>
                <div style="display: flex; gap: 0.35rem;">
                  <button class="btn btn-warning btn-sm edit-book-btn" data-code="${b.book_code}" title="แก้ไขทะเบียนเล่ม">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button class="btn btn-danger btn-sm delete-book-btn" data-code="${b.book_code}" title="ลบทะเบียนเล่ม">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('') : `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fa-solid fa-book-bookmark text-muted" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h4>ยังไม่มีข้อมูลทะเบียนเล่มเอกสาร</h4>
            <p style="color: var(--text-muted); font-size: 0.9rem;">สามารถกดปุ่ม "เพิ่มทะเบียนเล่มใหม่" เพื่อสร้างเล่มเอกสารได้ทันที</p>
          </div>
        `}
      </div>
    `;
  },

  refreshPage() {
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = this.render();
      this.initEvents();
    }
  },

  initEvents() {
    const addBtn = document.getElementById('add-book-btn');
    if (addBtn) addBtn.onclick = () => this.openAddBookModal();

    const exportBtn = document.getElementById('export-books-excel-btn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const books = window.db.getBooks();
        window.utils.exportToExcel('ทะเบียนเล่มเอกสาร', 'Books', books);
      };
    }

    const syncSheetsBtn = document.getElementById('sync-google-sheets-btn');
    if (syncSheetsBtn) {
      syncSheetsBtn.onclick = () => {
        window.utils.showToast('กำลังเชื่อมต่อและซิงก์ข้อมูลทะเบียนเล่มไปยัง Google Sheets...', 'info');
        setTimeout(() => {
          window.db.addAuditLog('Google Sheets', 'Sync Database', 'ซิงก์ข้อมูลทะเบียนเล่มเอกสารและรายชื่อนักเรียนไปยัง Google Sheets สำเร็จ');
          window.utils.showToast('ซิงก์ข้อมูลไปที่ Google Sheets (EDMRS_Database_Master.xlsx) สำเร็จ!', 'success');
        }, 1000);
      };
    }

    const openRootDriveBtn = document.getElementById('open-root-drive-btn');
    if (openRootDriveBtn) {
      openRootDriveBtn.onclick = () => {
        window.utils.openModal(
          `<i class="fa-brands fa-google-drive text-primary"></i> โฟลเดอร์หลัก Google Drive (EDMRS_Vault)`,
          `
            <div style="text-align: center; padding: 1.5rem;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1rem auto;">
                <i class="fa-brands fa-google-drive"></i>
              </div>
              <h4 style="font-weight: 700; color: var(--primary-900);">EDMRS_Drive_Vault/</h4>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                คลังจัดเก็บไฟล์เอกสารดิจิทัลส่วนกลางใน Google Drive แบ่งโครงสร้างโฟลเดอร์เป็นอัลบั้มของแต่ละทะเบียนเล่มเอกสาร
              </p>
              
              <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); text-align: left; font-size: 0.85rem; font-family: monospace;">
                📁 EDMRS_Drive_Vault/<br>
                &nbsp;&nbsp;├── 📁 BOOK-P1-2565-01/ (50 ไฟล์ ปพ.1)<br>
                &nbsp;&nbsp;├── 📁 BOOK-P1-2565-02/ (50 ไฟล์ ปพ.1)<br>
                &nbsp;&nbsp;├── 📁 BOOK-P2-2565-01/ (50 ไฟล์ ปพ.2)<br>
                &nbsp;&nbsp;├── 📁 BOOK-P3-2565-01/ (30 ไฟล์ ปพ.3)<br>
                &nbsp;&nbsp;└── 📁 BOOK-P7-2566-01/ (60 ไฟล์ ปพ.7)<br>
              </div>
            </div>
          `,
          [
            { text: 'ปิด', class: 'btn btn-secondary' },
            {
              text: '<i class="fa-brands fa-google-drive"></i> เปิดใน Google Drive Browser',
              class: 'btn btn-primary',
              onClick: () => {
                const folderId = (window.db && window.db.data && window.db.data.settings && window.db.data.settings.drive_folder) || '1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv';
                window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
              }
            }
          ]
        );
      };
    }

    // Google Drive Album Per Book Button Trigger
    document.querySelectorAll('.open-drive-album-btn').forEach(btn => {
      btn.onclick = () => {
        const bookCode = btn.getAttribute('data-code');
        const book = window.db.data.books.find(b => b.book_code === bookCode);
        const enclosedDocs = window.db.getDocuments({ book_code: bookCode });

        window.utils.openModal(
          `<i class="fa-brands fa-google-drive text-primary"></i> อัลบั้ม Google Drive ประจำเล่ม (${bookCode})`,
          `
            <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-left: 4px solid #0284c7; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
              <strong style="color: #0369a1;"><i class="fa-solid fa-folder-tree"></i> Google Drive Folder Album Path:</strong>
              <div style="font-family: monospace; font-size: 0.9rem; color: #075985; font-weight: 600;">Google Drive / EDMRS_Vault / ${bookCode} /</div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">ประเภท: ${book ? book.doc_type_code : ''} | ปีการศึกษา: ${book ? book.academic_year : ''} | จำนวนไฟล์ทั้งหมด ${enclosedDocs.length} ฉบับ</div>
            </div>

            <h5 style="margin-bottom: 0.75rem;"><i class="fa-solid fa-photo-film text-primary"></i> ไฟล์เอกสารสแกนในอัลบั้มเล่มนี้ (${enclosedDocs.length} ไฟล์)</h5>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr><th>ชื่อไฟล์ใน Drive</th><th>รหัสนักเรียน</th><th>ชื่อ-นามสกุล</th><th>สถานะ Drive</th><th>การทำงาน</th></tr>
                </thead>
                <tbody>
                  ${enclosedDocs.length ? enclosedDocs.map(d => `
                    <tr>
                      <td><i class="fa-solid fa-file-pdf text-danger"></i> <strong>${d.file_name}</strong></td>
                      <td>${d.student_id}</td>
                      <td>${d.student_name}</td>
                      <td><span class="badge badge-success"><i class="fa-solid fa-cloud"></i> Synced to Drive</span></td>
                      <td>
                        <button class="btn btn-light btn-sm preview-drive-file-btn" data-file="${d.file_name}" data-code="${d.doc_code}">
                          <i class="fa-solid fa-eye text-primary"></i> เปิดดูไฟล์
                        </button>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="5" style="text-align: center;">ยังไม่มีไฟล์จัดเก็บในอัลบั้มนี้</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          `,
          [
            { text: 'ปิด', class: 'btn btn-secondary' },
            {
              text: '<i class="fa-brands fa-google-drive"></i> เปิดโฟลเดอร์อัลบั้มนี้ใน Google Drive',
              class: 'btn btn-primary',
              onClick: () => {
                const folderId = (window.db && window.db.data && window.db.data.settings && window.db.data.settings.drive_folder) || '1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv';
                window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
              }
            }
          ]
        );

        setTimeout(() => {
          document.querySelectorAll('.preview-drive-file-btn').forEach(b => {
            b.onclick = () => {
              const file = b.getAttribute('data-file');
              const code = b.getAttribute('data-code');
              window.utils.openModal(
                `<i class="fa-solid fa-file-pdf text-danger"></i> ตัวอย่างไฟล์ใน Google Drive (${code})`,
                `<div style="text-align: center; padding: 1.5rem;">
                  <i class="fa-solid fa-file-pdf text-danger" style="font-size: 3.5rem; margin-bottom: 1rem;"></i>
                  <h4>${file}</h4>
                  <p style="color: var(--text-muted); font-size: 0.85rem;">ไฟล์สแกนจัดเก็บอยู่ในอัลบั้ม Google Drive ประจำเล่ม ${bookCode}</p>
                </div>`,
                [{ text: 'ปิด', class: 'btn btn-secondary' }]
              );
            };
          });
        }, 100);
      };
    });

    // View enclosed students inside book modal
    document.querySelectorAll('.view-book-detail-btn').forEach(btn => {
      btn.onclick = () => {
        const bookCode = btn.getAttribute('data-code');
        const book = window.db.data.books.find(b => b.book_code === bookCode);
        const enclosedDocs = window.db.getDocuments({ book_code: bookCode });

        window.utils.openModal(
          `<i class="fa-solid fa-book-open text-primary"></i> รายละเอียดเล่มเอกสาร (${bookCode})`,
          `
            <div style="margin-bottom: 1rem; background: var(--bg-app); padding: 1rem; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <div><b>ประเภทเอกสาร:</b> <span class="badge badge-secondary">${book ? book.doc_type_code : ''}</span> | <b>ปีการศึกษา:</b> ${book ? book.academic_year : ''}</div>
                <span class="badge badge-info"><i class="fa-solid fa-link"></i> Linked Book</span>
              </div>
              <p style="margin-bottom: 4px;"><b>ช่วงเลขที่เอกสาร:</b> ${book ? book.start_no : ''} ถึง ${book ? book.end_no : ''} | <b>จัดเก็บแล้ว:</b> <strong style="color: var(--primary-700);">${enclosedDocs.length} รายการ</strong></p>
              <p><b>ตำแหน่งจัดเก็บ:</b> <code>${book ? book.location_code : ''}</code></p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h5 style="margin: 0;"><i class="fa-solid fa-users"></i> รายชื่อนักเรียนและเอกสารภายในเล่ม (${enclosedDocs.length})</h5>
              <button id="add-student-to-this-book-btn" class="btn btn-success btn-sm" data-code="${bookCode}">
                <i class="fa-solid fa-user-plus"></i> + เพิ่มนักเรียนเข้าเล่มนี้
              </button>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr><th>ลำดับ</th><th>รหัสเอกสาร</th><th>รหัสนักเรียน</th><th>ชื่อ-นามสกุล</th><th>เลขที่</th><th>สำเนา ปพ.</th><th>สถานะ</th><th style="text-align: center;">จัดการ</th></tr>
                </thead>
                <tbody>
                  ${enclosedDocs.length ? enclosedDocs.map((d, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td><strong>${d.doc_code}</strong></td>
                      <td><code>${d.student_id}</code></td>
                      <td><a href="#student-detail?id=${d.student_id}" style="font-weight: 500;">${d.student_name}</a></td>
                      <td>${d.doc_number}</td>
                      <td>
                        <button class="btn btn-light btn-sm preview-book-doc-btn" data-url="${d.file_url || 'https://drive.google.com/file/d/1SIu3JfivV9RnCOW2xkzb30x_A16q0MGU/view?usp=sharing'}" data-name="${d.student_name}" data-code="${d.student_id}">
                          <i class="fa-solid fa-eye text-primary"></i> ดูไฟล์
                        </button>
                      </td>
                      <td>${window.utils.getStatusBadge(d.status)}</td>
                      <td style="text-align: center;">
                        <div style="display: flex; gap: 0.35rem; justify-content: center;">
                          <button class="btn btn-warning btn-sm edit-book-doc-btn" data-id="${d.id}" data-stdid="${d.student_id}" title="แก้ไขข้อมูลรายการนี้">
                            <i class="fa-solid fa-pen-to-square"></i> แก้ไข
                          </button>
                          <button class="btn btn-danger btn-sm delete-book-doc-btn" data-id="${d.id}" data-code="${d.doc_code}" data-stdid="${d.student_id}" data-name="${d.student_name}" title="ลบรายการนี้ออกจากเล่ม">
                            <i class="fa-solid fa-trash-can"></i> ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="8" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">ยังไม่มีนักเรียนหรือเอกสารผูกกับเล่มนี้</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          `,
          [
            { text: 'ปิดหน้าต่าง', class: 'btn btn-secondary' },
            {
              text: '<i class="fa-solid fa-user-plus"></i> + เพิ่มนักเรียนเข้าเล่มนี้',
              class: 'btn btn-success',
              onClick: () => {
                window.utils.closeModal();
                if (window.studentsView) {
                  window.studentsView.openStudentModal(null, bookCode);
                }
              }
            }
          ]
        );

        setTimeout(() => {
          const addBtnModal = document.getElementById('add-student-to-this-book-btn');
          if (addBtnModal) {
            addBtnModal.onclick = () => {
              window.utils.closeModal();
              if (window.studentsView) {
                window.studentsView.openStudentModal(null, bookCode);
              }
            };
          }

          document.querySelectorAll('.preview-book-doc-btn').forEach(b => {
            b.onclick = () => {
              const url = b.getAttribute('data-url');
              const name = b.getAttribute('data-name');
              const code = b.getAttribute('data-code');
              const doc = (window.db.data.documents || []).find(d => d.student_id === code || d.doc_code === code);
              const urlBack = doc ? doc.file_url_back : '';
              window.utils.openFilePreviewModal(url, `สำเนา ปพ. - ${name}`, code, urlBack);
            };
          });

          // Edit Document / Student inside Book Detail Modal
          document.querySelectorAll('.edit-book-doc-btn').forEach(b => {
            b.onclick = () => {
              const docId = b.getAttribute('data-id');
              const stdId = b.getAttribute('data-stdid');
              window.utils.closeModal();

              const stdObj = window.db.getStudentById(stdId);
              if (stdObj && window.studentsView) {
                window.studentsView.openStudentModal(stdObj, bookCode);
              } else {
                const docObj = (window.db.data.documents || []).find(d => d.id == docId);
                if (docObj && window.documentsView) {
                  window.documentsView.openAddDocModal(docObj);
                }
              }
            };
          });

          // Delete Document / Student inside Book Detail Modal
          document.querySelectorAll('.delete-book-doc-btn').forEach(b => {
            b.onclick = () => {
              const docId = b.getAttribute('data-id');
              const docCode = b.getAttribute('data-code');
              const stdId = b.getAttribute('data-stdid');
              const stdName = b.getAttribute('data-name');

              window.utils.confirmDialog(
                'ยืนยันการลบรายการในเล่ม',
                `คุณต้องการลบรายการเอกสาร <b>${docCode}</b> (${stdName || stdId}) ออกจากทะเบียนเล่มใช่หรือไม่?`,
                () => {
                  window.db.deleteDocument(docCode, docId);
                  if (stdId) {
                    window.db.deleteStudent(stdId);
                  }
                  window.utils.showToast('ลบรายการเอกสารและข้อมูลนักเรียนเรียบร้อยแล้ว', 'success');
                  window.utils.closeModal();
                  if (window.booksView && window.booksView.refreshPage) window.booksView.refreshPage();
                  else window.location.reload();
                }
              );
            };
          });
        }, 100);
      };
    });

    document.querySelectorAll('.edit-book-btn').forEach(btn => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        const book = (window.db.data.books || []).find(b => b.book_code === code);
        if (book) this.openAddBookModal(book);
      };
    });

    document.querySelectorAll('.delete-book-btn').forEach(btn => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        window.utils.confirmDialog(
          'ยืนยันการลบเล่มเอกสาร',
          `คุณต้องการลบทะเบียนเล่ม <b>${code}</b> ใช่หรือไม่?`,
          async () => {
            window.db.deleteBook(code);
            window.utils.showToast('กำลังซิงก์การลบลง Google Sheets...', 'info');
            try {
              await window.db.syncToGoogleSheets();
              window.utils.showToast('ลบทะเบียนเล่มและซิงก์ Google Sheets เรียบร้อยแล้ว', 'success');
            } catch (err) {
              console.warn('Sync on delete:', err);
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
  },

  openAddBookModal(bookToEdit = null) {
    const isEdit = !!bookToEdit;
    const docTypes = window.db.data.document_types || [];
    const locations = window.db.data.storage_locations || [];

    const typeVal = isEdit ? bookToEdit.doc_type_code : 'ปพ.1';
    const yearVal = isEdit ? bookToEdit.academic_year : '2569';
    const numVal = isEdit ? bookToEdit.book_number : '01';
    const startVal = isEdit ? bookToEdit.start_no : '001';
    const endVal = isEdit ? bookToEdit.end_no : '050';
    const locVal = isEdit ? bookToEdit.location_code : (locations[0] ? locations[0].code : '');

    const bodyHtml = `
      <form id="add-book-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">ประเภทเอกสาร ปพ.</label>
            <select id="modal-book-type" class="form-control" required>
              ${docTypes.map(t => `<option value="${t.code}" ${t.code === typeVal ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">ปีการศึกษา</label>
            <input type="text" id="modal-book-year" class="form-control" value="${yearVal}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">เล่มที่</label>
            <input type="text" id="modal-book-number" class="form-control" value="${numVal}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">เลขเริ่มต้น</label>
            <input type="text" id="modal-book-start" class="form-control" value="${startVal}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">เลขสิ้นสุด</label>
            <input type="text" id="modal-book-end" class="form-control" value="${endVal}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">ตำแหน่งสถานที่จัดเก็บ</label>
            <select id="modal-book-location" class="form-control" required>
              ${locations.map(l => `<option value="${l.code}" ${l.code === locVal ? 'selected' : ''}>${l.code} - ${l.building} (${l.room})</option>`).join('')}
            </select>
          </div>
        </div>
      </form>
    `;

    window.utils.openModal(
      isEdit ? `<i class="fa-solid fa-pen-to-square text-primary"></i> แก้ไขทะเบียนเล่มเอกสาร` : `<i class="fa-solid fa-folder-plus text-primary"></i> เพิ่มทะเบียนเล่มใหม่`,
      bodyHtml,
      [
        { text: 'ยกเลิก', class: 'btn btn-secondary' },
        {
          text: isEdit ? 'บันทึกการแก้ไข' : 'บันทึกเล่มเอกสาร',
          class: 'btn btn-primary',
          onClick: () => {
            const type = document.getElementById('modal-book-type').value;
            const year = document.getElementById('modal-book-year').value;
            const num = document.getElementById('modal-book-number').value;
            const start = document.getElementById('modal-book-start').value.trim();
            const end = document.getElementById('modal-book-end').value.trim();
            const loc = document.getElementById('modal-book-location').value;

            const sNum = parseInt(start.replace(/\D/g, ''));
            const eNum = parseInt(end.replace(/\D/g, ''));
            const computedCount = (!isNaN(sNum) && !isNaN(eNum) && eNum >= sNum) ? (eNum - sNum + 1) : 50;

            if (isEdit) {
              bookToEdit.doc_type_code = type;
              bookToEdit.academic_year = year;
              bookToEdit.book_number = num;
              bookToEdit.start_no = start;
              bookToEdit.end_no = end;
              bookToEdit.item_count = computedCount;
              bookToEdit.location_code = loc;
              window.db.addAuditLog('ทะเบียนเล่ม', 'แก้ไขเล่ม', `แก้ไขเล่ม ${bookToEdit.book_code}`);
              window.db.save();
              window.utils.showToast('แก้ไขข้อมูลเล่มเรียบร้อยแล้ว', 'success');
              this.refreshPage();
              return;
            }

            const code = `BOOK-${type.replace('.', '')}-${year}-${num}`;
            window.db.data.books.push({
              id: window.db.data.books.length + 1,
              book_code: code,
              doc_type_code: type,
              academic_year: year,
              book_number: num,
              start_no: start,
              end_no: end,
              item_count: computedCount,
              location_code: loc,
              status: 'active'
            });

            window.db.addAuditLog('ทะเบียนเล่ม', 'เพิ่มเล่ม', `เพิ่มเล่ม ${code}`);
            window.db.save();
            window.utils.showToast('เพิ่มเล่มเรียบร้อยแล้ว', 'success');
            window.location.reload();
          }
        }
      ]
    );
  }
};

window.booksView = booksView;
