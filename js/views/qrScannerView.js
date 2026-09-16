/* ==========================================================================
   EDMRS - QR Code & Barcode System View Controller (js/views/qrScannerView.js)
   Renders generator, live camera scanner modal, download QR & label printing
   ========================================================================== */

const qrScannerView = {
  render() {
    const students = window.db.data.students || [];
    const books = window.db.data.books || [];
    const locations = window.db.data.storage_locations || [];

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-qrcode text-primary"></i> ระบบ QR Code & Barcode ติดเอกสารและตู้จัดเก็บ
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            สร้าง พิมพ์สติกเกอร์ Label และสแกน QR Code / Barcode เพื่อเข้าถึงข้อมูลเอกสารฉับไว
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button id="open-camera-scanner-btn" class="btn btn-warning btn-sm">
            <i class="fa-solid fa-camera"></i> สแกนผ่านกล้อง
          </button>
          <button id="print-all-labels-btn" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-print"></i> พิมพ์ชุด Label สติกเกอร์
          </button>
        </div>
      </div>

      <!-- Generator Control Tabs -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fa-solid fa-gears"></i> เครื่องมือสร้าง QR / Barcode</h3>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <div class="form-group">
              <label class="form-label required">เลือกเป้าหมายที่ต้องการสร้าง QR Code</label>
              <select id="qr-target-type" class="form-control">
                <option value="student">นักเรียน (Student ID)</option>
                <option value="book">เล่มเอกสาร (Book Code)</option>
                <option value="location">ตำแหน่งสถานที่จัดเก็บ (Location Code)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">เลือกรายการ</label>
              <select id="qr-target-item" class="form-control">
                <!-- Populated dynamically -->
              </select>
            </div>

            <button id="generate-qr-btn" class="btn btn-primary" style="width: 100%;">
              <i class="fa-solid fa-wand-magic-sparkles"></i> สร้าง QR Code & Barcode
            </button>
          </div>

          <!-- Preview Block -->
          <div style="background: var(--bg-app); border-radius: var(--radius-lg); padding: 1.5rem; text-align: center; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 220px;">
            <h4 style="margin-bottom: 0.75rem; color: var(--primary-900);">ตัวอย่าง QR Code & Barcode</h4>
            
            <div id="qr-preview-wrapper" style="display: none; justify-content: center; align-items: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
              <div id="qr-code-preview" style="background: white; padding: 10px; border-radius: 8px; box-shadow: var(--shadow-sm);"></div>
              <div>
                <svg id="barcode-preview"></svg>
              </div>
            </div>

            <div id="qr-empty-placeholder" style="padding: 1.5rem; color: var(--text-muted);">
              <i class="fa-solid fa-qrcode" style="font-size: 2.5rem; color: var(--border-color); display: block; margin-bottom: 0.5rem;"></i>
              <span>กรุณาเลือกรายการและกดปุ่ม <b>"สร้าง QR Code & Barcode"</b> เพื่อสร้างและแสดงตัวอย่าง</span>
            </div>

            <div id="qr-actions-wrapper" style="margin-top: 1rem; display: none; justify-content: center; gap: 0.5rem;">
              <button id="download-qr-btn" class="btn btn-secondary btn-sm">
                <i class="fa-solid fa-download"></i> ดาวน์โหลด QR
              </button>
              <button id="print-single-label-btn" class="btn btn-light btn-sm">
                <i class="fa-solid fa-print"></i> พิมพ์ Label รายการนี้
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Printable Label Sheet Grid Container -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="fa-solid fa-tags"></i> แผ่นตัวอย่าง Label สติกเกอร์สำหรับพิมพ์แปะเล่ม/ตู้</h3>
        </div>

        <div class="label-print-sheet" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
          ${books.slice(0, 4).map(b => `
            <div style="border: 2px solid var(--primary-800); border-radius: 8px; padding: 1rem; background: white; text-align: center; position: relative;">
              <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--primary-900);">${(window.db && window.db.data && window.db.data.settings && window.db.data.settings.org_name_th) || 'โรงเรียนหนองเดิ่นศรีเจริญวิทยา'}</div>
              <strong style="font-size: 1.1rem; color: var(--primary-700); display: block; margin: 4px 0;">${b.book_code}</strong>
              <span style="font-size: 0.8rem; color: var(--text-muted);">ช่วงเลขที่: ${b.start_no} - ${b.end_no} (${b.academic_year})</span>
              <div style="margin: 0.5rem 0; display: flex; justify-content: center;" id="sheet-qr-${b.id}"></div>
              <code style="font-size: 0.85rem; font-weight: 700; background: var(--bg-app); padding: 2px 8px; border-radius: 4px;">${b.location_code}</code>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  initEvents() {
    const targetType = document.getElementById('qr-target-type');
    const targetItem = document.getElementById('qr-target-item');
    const generateBtn = document.getElementById('generate-qr-btn');

    const updateTargetItems = () => {
      const type = targetType.value;
      targetItem.innerHTML = '';

      if (type === 'student') {
        (window.db.data.students || []).forEach(s => {
          targetItem.innerHTML += `<option value="${s.student_id}">${s.student_id} - ${s.prefix}${s.first_name} ${s.last_name}</option>`;
        });
      } else if (type === 'book') {
        (window.db.data.books || []).forEach(b => {
          targetItem.innerHTML += `<option value="${b.book_code}">${b.book_code} (${b.doc_type_code})</option>`;
        });
      } else if (type === 'location') {
        (window.db.data.storage_locations || []).forEach(l => {
          targetItem.innerHTML += `<option value="${l.code}">${l.code} - ${l.building}</option>`;
        });
      }
    };

    if (targetType) {
      targetType.onchange = updateTargetItems;
      updateTargetItems();
    }

    if (generateBtn) {
      generateBtn.onclick = () => {
        const val = targetItem.value;
        if (!val) return;

        const emptyHolder = document.getElementById('qr-empty-placeholder');
        const previewWrap = document.getElementById('qr-preview-wrapper');
        const actionsWrap = document.getElementById('qr-actions-wrapper');

        if (emptyHolder) emptyHolder.style.display = 'none';
        if (previewWrap) previewWrap.style.display = 'flex';
        if (actionsWrap) actionsWrap.style.display = 'flex';

        window.utils.generateQRCode('qr-code-preview', val, 130, 130);
        window.utils.generateBarcode('barcode-preview', val);
        window.utils.showToast(`สร้าง QR Code สำหรับ: ${val} เรียบร้อย`, 'success');
      };
    }

    const downloadQrBtn = document.getElementById('download-qr-btn');
    if (downloadQrBtn) {
      downloadQrBtn.onclick = () => {
        const img = document.querySelector('#qr-code-preview img') || document.querySelector('#qr-code-preview canvas');
        if (!img) return;
        const src = img.src || (img.toDataURL ? img.toDataURL() : '');
        if (src) {
          const a = document.createElement('a');
          a.href = src;
          a.download = `QR_${targetItem.value || 'code'}.png`;
          a.click();
          window.utils.showToast('ดาวน์โหลดไฟล์ QR Code เรียบร้อยแล้ว', 'success');
        }
      };
    }

    const printSingleBtn = document.getElementById('print-single-label-btn');
    if (printSingleBtn) {
      printSingleBtn.onclick = () => window.print();
    }

    // Render static QRs in print sheet preview
    (window.db.data.books || []).slice(0, 4).forEach(b => {
      window.utils.generateQRCode(`sheet-qr-${b.id}`, b.book_code, 90, 90);
    });

    const openCameraBtn = document.getElementById('open-camera-scanner-btn');
    if (openCameraBtn) {
      openCameraBtn.onclick = () => {
        let activeStream = null;

        const bodyHtml = `
          <div style="text-align: center; padding: 0.5rem;">
            <div style="position: relative; width: 100%; max-width: 480px; height: 300px; background: #0f172a; border-radius: var(--radius-md); margin: 0 auto 1rem auto; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 2px solid var(--primary-600); box-shadow: var(--shadow-md);">
              <video id="qr-camera-feed" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>

              <!-- QR Scanner Reticle Overlay -->
              <div style="position: absolute; width: 200px; height: 200px; border: 2px solid #22c55e; border-radius: 12px; box-shadow: 0 0 0 4000px rgba(15, 23, 42, 0.65); pointer-events: none; display: flex; align-items: center; justify-content: center;">
                <div style="width: 100%; height: 2px; background: rgba(34, 197, 94, 0.85); box-shadow: 0 0 8px #22c55e; animation: scanLine 2s infinite linear;"></div>
              </div>

              <!-- Loading Spinner -->
              <div id="qr-camera-loader" style="position: absolute; inset: 0; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                <i class="fa-solid fa-spinner fa-spin text-warning" style="font-size: 2.5rem; margin-bottom: 0.75rem;"></i>
                <span style="font-size: 0.9rem;">กำลังเปิดกล้องสแกน QR Code / Barcode...</span>
              </div>
            </div>

            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              <i class="fa-solid fa-qrcode text-success"></i> วางสติกเกอร์ QR Code หรือ Barcode ให้ตรงกรอบสแกน
            </p>
            
            <div style="background: var(--bg-app); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color);">
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">หรือทดสอบสแกนโค้ดตัวอย่างในระบบ:</span>
              <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.5rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-light btn-sm sim-scan-btn" data-val="65001234"><i class="fa-solid fa-user"></i> สแกนนักเรียน 65001234</button>
                <button type="button" class="btn btn-light btn-sm sim-scan-btn" data-val="LOC-A01-01-01"><i class="fa-solid fa-location-dot"></i> สแกนพิกัด LOC-A01-01-01</button>
                <button type="button" class="btn btn-light btn-sm sim-scan-btn" data-val="BOOK-PP1-2565-01"><i class="fa-solid fa-book"></i> สแกนเล่ม BOOK-PP1-2565-01</button>
              </div>
            </div>
          </div>
        `;

        const stopQrStream = () => {
          if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
            activeStream = null;
          }
        };

        window.utils.openModal(
          `<i class="fa-solid fa-camera text-warning"></i> กล้องสแกน QR Code / Barcode (WebRTC Real Camera)`,
          bodyHtml,
          [{
            text: 'ปิดกล้อง',
            class: 'btn btn-secondary',
            onClick: () => stopQrStream()
          }]
        );

        setTimeout(() => {
          const videoEl = document.getElementById('qr-camera-feed');
          const loaderEl = document.getElementById('qr-camera-loader');

          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
              activeStream = stream;
              if (videoEl) {
                videoEl.srcObject = stream;
                videoEl.onloadedmetadata = () => {
                  if (loaderEl) loaderEl.style.display = 'none';
                };
              }
            })
            .catch(err => {
              navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                  activeStream = stream;
                  if (videoEl) {
                    videoEl.srcObject = stream;
                    if (loaderEl) loaderEl.style.display = 'none';
                  }
                })
                .catch(e => {
                  if (loaderEl) {
                    loaderEl.innerHTML = `
                      <i class="fa-solid fa-video-slash text-danger" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
                      <span style="color: var(--danger-color); font-weight: 600;">ไม่สามารถเข้าถึงกล้องได้</span>
                      <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 4px; padding: 0 1rem;">โปรดอนุญาตสิทธิ์ใช้งานกล้องในเบราว์เซอร์</small>
                    `;
                  }
                });
            });

          document.querySelectorAll('.sim-scan-btn').forEach(b => {
            b.onclick = () => {
              const val = b.getAttribute('data-val');
              stopQrStream();
              window.utils.closeModal();
              window.utils.showToast(`สแกนพบข้อมูลสำเร็จ: ${val}`, 'success');
              if (val.startsWith('LOC')) {
                window.location.hash = `#locations?search=${val}`;
              } else if (val.startsWith('BOOK')) {
                window.location.hash = `#books-management?search=${val}`;
              } else {
                window.location.hash = `#student-detail?id=${val}`;
              }
            };
          });
        }, 150);
      };
    }

    const printSheetBtn = document.getElementById('print-all-labels-btn');
    if (printSheetBtn) printSheetBtn.onclick = () => window.print();
  }
};

window.qrScannerView = qrScannerView;
