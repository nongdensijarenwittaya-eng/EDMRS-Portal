/* ==========================================================================
   EDMRS - System Settings Controller (js/views/settingsView.js)
   Organization settings & Google Sheets Connection configuration
   ========================================================================== */

const settingsView = {
  render() {
    const s = (window.db && window.db.data && window.db.data.settings) ? window.db.data.settings : {};
    const defaultLogo = 'assets/logo.png';
    const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%231e3a8a'/%3E%3Ctext x='50' y='65' font-size='45' fill='white' text-anchor='middle' font-weight='bold' font-family='sans-serif'%3Eปพ.%3C/text%3E%3C/svg%3E";
    const webAppUrl = (window.CONFIG ? window.CONFIG.getWebAppUrl() : 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec');

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-gears text-primary"></i> ตั้งค่าระบบ & เชื่อมต่อ Google Sheets
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            ปรับแต่งชื่อสถานศึกษา โลโก้ และตรวจสอบสถานะ Web App URL สำหรับการเชื่อมต่อฐานข้อมูล Google Sheets
          </p>
        </div>
      </div>

      <!-- Settings Tab 1: Organization Info -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <h3 class="card-title"><i class="fa-solid fa-building-columns"></i> ข้อมูลสถานศึกษา & โลโก้</h3>
        </div>

        <form id="settings-org-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">ชื่อหน่วยงาน/สถานศึกษา (ภาษาไทย)</label>
              <input type="text" id="setting-org-th" class="form-control" value="${s.org_name_th || 'โรงเรียนหนองเดิ่นศรีเจริญวิทยา'}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Official English Name</label>
              <input type="text" id="setting-org-en" class="form-control" value="${s.org_name_en || 'Nongdoensricharoenwittaya School'}" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">ที่อยู่สถานศึกษา</label>
              <input type="text" id="setting-address" class="form-control" value="${s.address || 'ตำบลหนองเดิ่น อำเภอบุ่งคล้า จังหวัดบึงกาฬ 38000'}">
            </div>
            <div class="form-group">
              <label class="form-label">เบอร์โทรศัพท์</label>
              <input type="text" id="setting-phone" class="form-control" value="${s.phone || '02-555-1234'}">
            </div>
            <div class="form-group">
              <label class="form-label">อีเมลติดต่อ</label>
              <input type="email" id="setting-email" class="form-control" value="${s.email || 'info@school.ac.th'}">
            </div>
          </div>

          <div class="form-row" style="align-items: center; margin-top: 0.5rem;">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">URL รูปตราสัญลักษณ์ / Logo</label>
              <input type="text" id="setting-logo-url" class="form-control" value="${s.logo_url || defaultLogo}">
              <div class="form-text">ระบุ URL รูปภาพโลโก้หน่วยงาน</div>
            </div>
            <div style="width: 80px; text-align: center;">
              <img id="logo-preview-img" src="${s.logo_url || defaultLogo}" style="width: 54px; height: 54px; object-fit: contain; border-radius: 6px; border: 1px solid var(--border-color); padding: 2px;" onerror="this.src='${fallbackSvg}'">
            </div>
          </div>

          <button type="submit" id="save-org-settings-btn" class="btn btn-primary" style="margin-top: 1rem;">
            <i class="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่าสถานศึกษา
          </button>
        </form>
      </div>

      <!-- Settings Tab 2: Google Sheets Connection -->
      <div class="card" style="border-top: 4px solid #0284c7; margin-bottom: 1.5rem;">
        <div class="card-header">
          <h3 class="card-title"><i class="fa-solid fa-table text-primary"></i> สถานะการเชื่อมต่อ Google Sheets Web App</h3>
        </div>

        <form id="settings-cloud-form" onsubmit="return false;">
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label font-weight-bold">Google Sheets Web App URL (ฝังถาวรในระบบ)</label>
              <div style="background: #f8fafc; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-family: monospace; font-size: 0.88rem; word-break: break-all; color: var(--primary-900);">
                <i class="fa-solid fa-lock text-success" style="margin-right: 6px;"></i> ${webAppUrl}
              </div>
              <div class="form-text" style="color: #64748b; margin-top: 6px;">
                <i class="fa-solid fa-shield-halved text-success"></i> Web App URL ถูกฝังไว้ในซอร์สโค้ดของระบบแล้ว ป้องกันการแก้ไขหลุดหรือตั้งค่าผิดพลาดโดยไม่ตั้งใจ
              </div>
            </div>
          </div>

          <div style="margin-top: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button type="button" id="test-cloud-conn-btn" class="btn btn-secondary">
              <i class="fa-solid fa-plug"></i> ทดสอบการเชื่อมต่อ Google Sheets
            </button>
            <button type="button" id="sync-from-sheets-btn" class="btn btn-warning" style="font-weight: 600;">
              <i class="fa-solid fa-arrows-rotate"></i> ⚡ รีเฟรชดึงข้อมูลจาก Google Sheets ทันที
            </button>
          </div>
        </form>
      </div>
    `;
  },

  initEvents() {
    const form = document.getElementById('settings-org-form');
    const logoInput = document.getElementById('setting-logo-url');
    const logoPreview = document.getElementById('logo-preview-img');

    if (logoInput && logoPreview) {
      logoInput.oninput = () => {
        logoPreview.src = logoInput.value.trim() || 'assets/logo.png';
      };
    }

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-org-settings-btn');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...'; }

        try {
          if (!window.db.data.settings) window.db.data.settings = {};
          window.db.data.settings = {
            ...window.db.data.settings,
            org_name_th: document.getElementById('setting-org-th').value.trim(),
            org_name_en: document.getElementById('setting-org-en').value.trim(),
            address: document.getElementById('setting-address').value.trim(),
            phone: document.getElementById('setting-phone').value.trim(),
            email: document.getElementById('setting-email').value.trim(),
            logo_url: document.getElementById('setting-logo-url').value.trim()
          };
          window.db.addAuditLog('ตั้งค่าระบบ', 'แก้ไขตั้งค่าสถานศึกษา', 'อัปเดตชื่อสถานศึกษาและข้อมูลการติดต่อ');
          window.db.save();
          if (window.utils && window.utils.showToast) {
            window.utils.showToast('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว', 'success');
          }
          if (window.app && typeof window.app.updateHeaderInfo === 'function') {
            window.app.updateHeaderInfo();
          }
        } finally {
          if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่าสถานศึกษา'; }
        }
      };
    }

    const testCloudBtn = document.getElementById('test-cloud-conn-btn');
    if (testCloudBtn) {
      testCloudBtn.onclick = async () => {
        const url = window.CONFIG ? window.CONFIG.getWebAppUrl() : 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec';
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('กำลังทดสอบเชื่อมต่อ Google Apps Script Web App...', 'info');
        }
        const result = await window.db.testGoogleSheetsConnection(url);
        if (result.success) {
          if (window.utils && window.utils.showToast) {
            window.utils.showToast(`✅ ${result.message}`, 'success', 5000);
          }
        } else {
          if (window.utils && window.utils.showToast) {
            window.utils.showToast(`❌ ${result.message}`, 'danger', 8000);
          }
        }
      };
    }

    const syncFromBtn = document.getElementById('sync-from-sheets-btn');
    if (syncFromBtn) {
      syncFromBtn.onclick = async () => {
        syncFromBtn.disabled = true;
        syncFromBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังดึงข้อมูล...';
        try {
          if (window.utils && window.utils.showToast) {
            window.utils.showToast('กำลังดึงข้อมูลล่าสุดจาก Google Sheets...', 'info');
          }
          await window.db.syncFromGoogleSheets();
          if (window.utils && window.utils.showToast) {
            window.utils.showToast('ดึงฐานข้อมูลจาก Google Sheets สำเร็จ!', 'success', 5000);
          }
          if (window.router && typeof window.router.handleRoute === 'function') window.router.handleRoute();
        } catch (err) {
          if (window.utils && window.utils.showToast) {
            window.utils.showToast(`ดึงข้อมูลไม่สำเร็จ: ${err.message}`, 'danger', 5000);
          }
        } finally {
          syncFromBtn.disabled = false;
          syncFromBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> ⚡ รีเฟรชดึงข้อมูลจาก Google Sheets ทันที';
        }
      };
    }
  }
};

window.settingsView = settingsView;
