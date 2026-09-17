/* ==========================================================================
   EDMRS - System Settings & Database Backup Controller (js/views/settingsView.js)
   Organization settings, logo update, code formats, database backup & restore
   ========================================================================== */

const settingsView = {
  render() {
    const s = (window.db && window.db.data && window.db.data.settings) ? window.db.data.settings : {};
    const defaultLogo = 'assets/logo.png';
    const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%231e3a8a'/%3E%3Ctext x='50' y='65' font-size='45' fill='white' text-anchor='middle' font-weight='bold' font-family='sans-serif'%3Eปพ.%3C/text%3E%3C/svg%3E";

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--primary-950);">
            <i class="fa-solid fa-gears text-primary"></i> ตั้งค่าระบบ & สำรองข้อมูล (System Settings)
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-muted);">
            ปรับแต่งชื่อสถานศึกษา, โลโก้, รูปแบบรหัสเอกสาร, ปีการศึกษา และการสำรอง-เรียกคืนฐานข้อมูล
          </p>
        </div>
      </div>

      <!-- Settings Tabs Container -->
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
              <div class="form-text">สามารถระบุ URL รูปภาพ หรือ Path ไฟล์รูปภาพใหม่</div>
            </div>
            <div style="width: 80px; text-align: center;">
              <img id="logo-preview-img" src="${s.logo_url || defaultLogo}" style="width: 54px; height: 54px; object-fit: contain; border-radius: 6px; border: 1px solid var(--border-color); padding: 2px;" onerror="this.src='${fallbackSvg}'">
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">
            <i class="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่าสถานศึกษา
          </button>
        </form>
      </div>

      <!-- Google Drive & Google Sheets Integration Configuration Card -->
      <div class="card" style="border-top: 4px solid #0284c7; margin-bottom: 1.5rem;">
        <div class="card-header">
          <h3 class="card-title"><i class="fa-brands fa-google-drive text-primary"></i> ตั้งค่าการเชื่อมต่อ Google Drive & Google Sheets (Cloud Storage & Sheets)</h3>
        </div>

        <form id="settings-cloud-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label font-weight-bold">Google Sheets Webhook URL / Web App URL</label>
              <input type="text" id="setting-sheets-url" class="form-control" value="${s.sheets_url || 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec'}" placeholder="https://script.google.com/macros/s/.../exec">
              <div class="form-text" style="color: #64748b;"><i class="fa-solid fa-link"></i> วาง URL สำหรับซิงก์ข้อมูลจาก Google Apps Script (ต้องลงท้ายด้วย <code>/exec</code>)</div>
            </div>
            <div class="form-group">
              <label class="form-label font-weight-bold">Google Drive Root Folder ID (คลังจัดเก็บไฟล์ดิจิทัล)</label>
              <input type="text" id="setting-drive-folder" class="form-control" value="${s.drive_folder || '1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv'}" placeholder="e.g. 1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv">
              <div class="form-text">ระบบจะสร้างโฟลเดอร์อัลบั้มประจำแต่ละทะเบียนเล่ม (<code>EDMRS_Vault/[BOOK_CODE]/</code>) ในไดร์ฟนี้โดยอัตโนมัติ</div>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.88rem;">
              <input type="checkbox" id="setting-auto-drive-album" checked> สร้างอัลบั้มโฟลเดอร์ใน Google Drive อัตโนมัติเมื่อเพิ่มเล่มใหม่
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.88rem;">
              <input type="checkbox" id="setting-auto-sheets-sync" checked> ซิงก์ข้อมูลลง Google Sheets อัตโนมัติเมื่อบันทึกเอกสาร
            </label>
          </div>

          <div style="margin-top: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button type="button" id="sync-from-sheets-btn" class="btn btn-warning" style="font-weight: 600;">
              <i class="fa-solid fa-cloud-arrow-down"></i> ⚡ ดึงฐานข้อมูลจาก Google Sheets ทันที (Fetch Real Data)
            </button>
            <button type="button" id="sync-to-sheets-btn" class="btn btn-success">
              <i class="fa-solid fa-cloud-arrow-up"></i> 📤 ส่งออกฐานข้อมูลไปที่ Google Sheets (Push All Data)
            </button>
            <button type="button" id="view-gas-code-btn" class="btn btn-secondary">
              <i class="fa-solid fa-code"></i> คัดลอกโค้ด Google Apps Script (Code.gs)
            </button>
            <button type="button" id="test-cloud-conn-btn" class="btn btn-secondary">
              <i class="fa-solid fa-plug"></i> ทดสอบการเชื่อมต่อ Google Service
            </button>
            <button type="button" id="save-cloud-config-btn" class="btn btn-primary">
              <i class="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่า Cloud & Drive
            </button>
          </div>
        </form>
      </div>

      <!-- Database Backup & Restore Control Panel Card -->
      <div class="card" style="border-top: 4px solid var(--warning-color);">
        <div class="card-header">
          <h3 class="card-title"><i class="fa-solid fa-database text-warning"></i> ระบบสำรองข้อมูล & เรียกคืนฐานข้อมูล (Database Backup & Restore)</h3>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div style="background: var(--bg-app); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 0.5rem; color: var(--primary-900);"><i class="fa-solid fa-download text-primary"></i> สำรองฐานข้อมูล (Backup Database)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
              ดาวน์โหลดโครงสร้างฐานข้อมูลและข้อมูลทั้งหมด (JSON Dump File) เพื่อเก็บสำรองกรณีฉุกเฉิน
            </p>
            <button id="download-db-backup-btn" class="btn btn-primary">
              <i class="fa-solid fa-file-arrow-down"></i> ดาวน์โหลดไฟล์สำรอง (.json)
            </button>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">สำรองข้อมูลล่าสุด: ${s.last_backup_date || '2026-09-16 15:45:00'}</div>
          </div>

          <div style="background: var(--bg-app); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 0.5rem; color: var(--danger-color);"><i class="fa-solid fa-upload text-danger"></i> เรียกคืนฐานข้อมูล (Restore Database)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
              เลือกไฟล์สำรอง (.json) เพื่อเขียนทับและกู้คืนฐานข้อมูลเดิม
            </p>
            <input type="file" id="restore-file-input" accept=".json" style="display: none;">
            <button id="trigger-restore-btn" class="btn btn-danger">
              <i class="fa-solid fa-arrow-rotate-left"></i> นำเข้าไฟล์ Restore Database
            </button>
          </div>
        </div>

        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-color);">

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <strong>ล้างข้อมูลสาธิต/ข้อมูลปลอมทั้งหมด (Clear Demo Mock Data)</strong>
            <div style="font-size: 0.8rem; color: var(--text-muted);">ลบข้อมูลตัวอย่างทั้งหมด เพื่อเตรียมรับเฉพาะข้อมูลจริงจาก Google Sheets</div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button id="clear-mock-data-btn" class="btn btn-danger btn-sm" style="font-weight: 600;">
              <i class="fa-solid fa-broom"></i> ล้างข้อมูลปลอมทั้งหมด
            </button>
            <button id="reset-to-seed-btn" class="btn btn-secondary btn-sm">
              <i class="fa-solid fa-arrow-rotate-left"></i> คืนค่า Seed Data
            </button>
          </div>
        </div>
      </div>
    `;
  },

  initEvents() {
    const form = document.getElementById('settings-org-form');
    const logoInput = document.getElementById('setting-logo-url');
    const logoPreview = document.getElementById('logo-preview-img');

    if (logoInput && logoPreview) {
      logoInput.oninput = () => {
        let val = logoInput.value.trim();
        if (window.utils && window.utils.isDriveUrl(val)) {
          val = window.utils.getDriveThumbnailUrl(val);
        }
        logoPreview.src = val || 'assets/logo.png';
      };
    }

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!window.db.data.settings) window.db.data.settings = {};
        
        let logoUrlVal = document.getElementById('setting-logo-url').value.trim();
        if (window.utils && window.utils.isDriveUrl(logoUrlVal)) {
          logoUrlVal = window.utils.getDriveThumbnailUrl(logoUrlVal);
        }

        window.db.data.settings = {
          ...window.db.data.settings,
          org_name_th: document.getElementById('setting-org-th').value.trim(),
          org_name_en: document.getElementById('setting-org-en').value.trim(),
          address: document.getElementById('setting-address').value.trim(),
          phone: document.getElementById('setting-phone').value.trim(),
          email: document.getElementById('setting-email').value.trim(),
          logo_url: logoUrlVal
        };
        window.db.addAuditLog('ตั้งค่าระบบ', 'แก้ไขตั้งค่าสถานศึกษา', 'อัปเดตชื่อสถานศึกษา โลโก้ และข้อมูลการติดต่อ (บันทึกลง Google Sheets)');
        window.db.save(true);
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('บันทึกการตั้งค่าระบบและซิงก์ลง Google Sheets เรียบร้อยแล้ว', 'success');
        }
        setTimeout(() => window.location.reload(), 600);
      };
    }

    const viewGasBtn = document.getElementById('view-gas-code-btn');
    if (viewGasBtn) {
      viewGasBtn.onclick = () => {
        const gasCodeSample = `/**
 * ==========================================================================
 * EDMRS - Google Apps Script (GAS) Connector (Code.gs)
 * ระบบเชื่อมต่อ Google Sheets & Google Drive Albums สำหรับ EDMRS
 * ==========================================================================
 * 
 * วิธีการติดตั้ง:
 * 1. เปิด Google Sheets ขึ้นมาใหม่ ตั้งชื่อว่า "EDMRS_Database_Master"
 * 2. ไปที่เมนู Extensions (ส่วนขยาย) -> Apps Script
 * 3. คัดลอกโค้ดทั้งหมดในไฟล์นี้ วางแทนที่ใน Code.gs
 * 4. เปลี่ยนค่า DRIVE_ROOT_FOLDER_ID ด้านล่างให้เป็น ID โฟลเดอร์ใน Google Drive ของท่าน
 * 5. กด Deploy (ทำให้ใช้งานได้) -> New Deployment -> Select Type: Web App
 *    - Execute as: Me (ฉัน)
 *    - Who has access: Anyone (ทุกคน)
 * 6. คัดลอก Web App URL ที่ได้ นำไปวางในหน้า "ตั้งค่าระบบ" ของ EDMRS
 */

var DRIVE_ROOT_FOLDER_ID = "1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv";

function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("📚 EDMRS Tools")
      .addItem("⚡ สร้างแท็บและคอลัมน์ทั้งหมดอัตโนมัติ (Auto Create Columns)", "initSheetsStructure")
      .addToUi();
  } catch (e) {}
  initSheetsStructure();
}

function initSheetsStructure() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var studentsSheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  if (studentsSheet.getLastRow() === 0) {
    studentsSheet.appendRow(["รหัสนักเรียน", "เลขบัตรประชาชน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "วันเกิด", "ระดับชั้น", "ห้อง", "ปีการศึกษา", "สถานะ"]);
    studentsSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
    studentsSheet.setFrozenRows(1);
  }

  var docsSheet = ss.getSheetByName("Documents") || ss.insertSheet("Documents");
  if (docsSheet.getLastRow() === 0) {
    docsSheet.appendRow(["รหัสเอกสาร", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code", "ชื่อไฟล์ดิจิทัล", "ลิงก์ Google Drive"]);
    docsSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    docsSheet.setFrozenRows(1);
  }

  var booksSheet = ss.getSheetByName("Books") || ss.insertSheet("Books");
  if (booksSheet.getLastRow() === 0) {
    booksSheet.appendRow(["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code", "Google Drive Album Path"]);
    booksSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
    booksSheet.setFrozenRows(1);
  }

  var loansSheet = ss.getSheetByName("Loans") || ss.insertSheet("Loans");
  if (loansSheet.getLastRow() === 0) {
    loansSheet.appendRow(["เลขรายการยืม", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท", "ผู้ยืม", "สังกัด", "วันที่ยืม", "กำหนดคืน", "สถานะ"]);
    loansSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff");
    loansSheet.setFrozenRows(1);
  }

  var locsSheet = ss.getSheetByName("Storage_Locations") || ss.insertSheet("Storage_Locations");
  if (locsSheet.getLastRow() === 0) {
    locsSheet.appendRow(["Location Code", "อาคาร", "ห้อง", "ตู้", "ชั้น", "แฟ้ม", "คำอธิบาย"]);
    locsSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#64748b").setFontColor("#ffffff");
    locsSheet.setFrozenRows(1);
  }
}

function doGet(e) {
  e = e || { parameter: {} };
  var parameter = e.parameter || {};
  var action = parameter.action || "ping";
  
  if (action === "ping") {
    initSheetsStructure();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "EDMRS Web App Active!" })).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "init_structure" || action === "setup") {
    initSheetsStructure();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Created columns!" })).setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "get_all") {
    var data = getAllSheetData();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    e = e || { postData: { contents: "{}" } };
    var postData = e.postData || {};
    var contents = postData.contents ? JSON.parse(postData.contents) : {};
    var action = contents.action || "sync_database";

    if (action === "sync_database") {
      initSheetsStructure();
      syncStudentsSheet(contents.students || []);
      syncDocumentsSheet(contents.documents || []);
      syncBooksSheet(contents.books || []);
      syncLoansSheet(contents.loans || []);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Synced to Sheets!" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "upload_file_to_album") {
      var bookCode = contents.book_code || "UNASSIGNED";
      var fileName = contents.file_name || "scan.pdf";
      var base64Data = contents.base64_data;
      var fileType = contents.file_type || "application/pdf";
      var fileUrl = saveFileToDriveAlbum(bookCode, fileName, base64Data, fileType);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", file_url: fileUrl })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateBookAlbumFolder(bookCode) {
  var rootFolder;
  try { rootFolder = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID); } catch (e) { rootFolder = DriveApp.getRootFolder(); }
  var vaultFolders = rootFolder.getFoldersByName("EDMRS_Drive_Vault");
  var vaultFolder = vaultFolders.hasNext() ? vaultFolders.next() : rootFolder.createFolder("EDMRS_Drive_Vault");
  try { vaultFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  var albumFolders = vaultFolder.getFoldersByName(bookCode);
  var targetFolder = albumFolders.hasNext() ? albumFolders.next() : vaultFolder.createFolder(bookCode);
  try { targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  return targetFolder;
}

function saveFileToDriveAlbum(bookCode, fileName, base64Data, fileType) {
  var albumFolder = getOrCreateBookAlbumFolder(bookCode);
  if (!base64Data) {
    var sampleBlob = Utilities.newBlob("EDMRS Scan Document: " + fileName, fileType, fileName);
    var file = albumFolder.createFile(sampleBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  }
  var decodedData = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decodedData, fileType, fileName);
  var createdFile = albumFolder.createFile(blob);
  createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return createdFile.getUrl();
}

function syncStudentsSheet(students) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  sheet.clear();
  sheet.appendRow(["รหัสนักเรียน", "เลขบัตรประชาชน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "วันเกิด", "ระดับชั้น", "ห้อง", "ปีการศึกษา", "สถานะ"]);
  sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  students.forEach(function(s) {
    sheet.appendRow([s.student_id, "'" + s.citizen_id, s.prefix, s.first_name, s.last_name, s.previous_name || "", s.birthdate || "", s.grade_level, s.room, s.academic_year, s.status]);
  });
}

function syncDocumentsSheet(documents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Documents") || ss.insertSheet("Documents");
  sheet.clear();
  sheet.appendRow(["รหัสเอกสาร", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code", "ชื่อไฟล์ดิจิทัล", "ลิงก์ Google Drive"]);
  sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  documents.forEach(function(d) {
    var driveUrl = d.file_url || "";
    var hyperlinkFormula = (driveUrl && driveUrl.indexOf("http") === 0) ? '=HYPERLINK("' + driveUrl + '", "เปิดไฟล์ใน Drive")' : (driveUrl || "");
    sheet.appendRow([d.doc_code, d.student_id, d.student_name, d.doc_type_code, d.academic_year, d.book_number || "", d.doc_number, d.status, d.location_code || "", d.file_name || "", hyperlinkFormula]);
  });
}

function syncBooksSheet(books) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Books") || ss.insertSheet("Books");
  sheet.clear();
  sheet.appendRow(["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code", "Google Drive Album Path"]);
  sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  books.forEach(function(b) {
    sheet.appendRow([b.book_code, b.doc_type_code, b.academic_year, b.book_number, b.start_no, b.end_no, b.item_count, b.location_code, "EDMRS_Drive_Vault/" + b.book_code + "/"]);
  });
}

function syncLoansSheet(loans) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Loans") || ss.insertSheet("Loans");
  sheet.clear();
  sheet.appendRow(["เลขรายการยืม", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท", "ผู้ยืม", "สังกัด", "วันที่ยืม", "กำหนดคืน", "สถานะ"]);
  sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  loans.forEach(function(l) {
    sheet.appendRow([l.loan_code, l.student_id, l.student_name, l.doc_type_code, l.borrower_name, l.borrower_dept || "", l.loan_date, l.return_due_date, l.status]);
  });
}

function getAllSheetData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};
  var sheets = ss.getSheets();
  sheets.forEach(function(sh) {
    result[sh.getName()] = sh.getDataRange().getValues();
  });
  return result;
}`;

        const modalBody = '<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.85rem;">' +
          'คัดลอกโค้ดด้านล่างนี้ นำไปวางใน Google Apps Script Editor (เปิดใน Google Sheets -> Extensions -> Apps Script) เพื่อรันระบบซิงก์ Google Sheets และสร้างอัลบั้มใน Google Drive อัตโนมัติ:' +
          '</div>' +
          '<div style="position: relative;">' +
          '<textarea id="gas-script-code-area" class="form-control" style="font-family: monospace; font-size: 0.78rem; height: 260px; background: #0f172a; color: #38bdf8;" readonly>' +
          gasCodeSample +
          '</textarea>' +
          '</div>' +
          '<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">' +
          '<i class="fa-solid fa-file-code"></i> หรือดูไฟล์ฉบับเต็มในโปรเจกต์ที่: <code>google-apps-script/Code.gs</code>' +
          '</div>';

        if (window.utils && window.utils.openModal) {
          window.utils.openModal(
            '<i class="fa-solid fa-code text-warning"></i> โค้ดต้นฉบับ Google Apps Script (Code.gs)',
            modalBody,
            [
              { text: 'ปิด', class: 'btn btn-secondary' },
              {
                text: '<i class="fa-solid fa-copy"></i> คัดลอกโค้ดทั้งหมด',
                class: 'btn btn-primary',
                onClick: () => {
                  const area = document.getElementById('gas-script-code-area');
                  if (area) {
                    area.select();
                    document.execCommand('copy');
                    window.utils.showToast('คัดลอกโค้ด Google Apps Script (Code.gs) เรียบร้อยแล้ว', 'success');
                  }
                }
              }
            ]
          );
        }
      };
    }

    const testCloudBtn = document.getElementById('test-cloud-conn-btn');
    if (testCloudBtn) {
      testCloudBtn.onclick = async () => {
        const url = document.getElementById('setting-sheets-url').value.trim();
        if (!url || !url.includes('script.google.com')) {
          window.utils.showToast('กรุณาระบุ Google Sheets Web App URL ในช่องให้ถูกต้องก่อนทดสอบ', 'warning');
          return;
        }
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('กำลังทดสอบเชื่อมต่อ Google Apps Script Web App...', 'info');
          try {
            const sep = url.includes('?') ? '&' : '?';
            const res = await fetch(`${url}${sep}action=ping&t=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP Error status: ${res.status}`);
            const json = await res.json();
            window.utils.showToast(`✅ เชื่อมต่อ Google Apps Script สำเร็จ! (${json.message || 'Active'})`, 'success', 5000);
          } catch (err) {
            window.utils.showToast(
              '❌ เชื่อมต่อไม่สำเร็จ (Failed to fetch)\n' +
              '📍 ตรวจสอบใน Apps Script: ตั้งค่า "Who has access" เป็น "Anyone" (ทุกคน) แล้วกด Deploy -> Manage Deployments -> New Version',
              'danger',
              8000
            );
          }
        }
      };
    }

    const syncFromBtn = document.getElementById('sync-from-sheets-btn');
    if (syncFromBtn) {
      syncFromBtn.onclick = async () => {
        const sheetsUrl = document.getElementById('setting-sheets-url').value.trim();
        try {
          window.utils.showToast('กำลังเชื่อมต่อดึงข้อมูลทั้งหมดจาก Google Sheets...', 'info');
          const counts = await window.db.syncFromGoogleSheets(sheetsUrl);
          window.utils.showToast(`ดึงฐานข้อมูลจาก Google Sheets สำเร็จ! (${counts.studentCount} นักเรียน, ${counts.docCount} เอกสาร, ${counts.bookCount} เล่ม)`, 'success', 5000);
          setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
          window.utils.showToast(`ดึงข้อมูลไม่สำเร็จ: ${err.message}`, 'danger', 5000);
        }
      };
    }

    const syncToBtn = document.getElementById('sync-to-sheets-btn');
    if (syncToBtn) {
      syncToBtn.onclick = async () => {
        const sheetsUrl = document.getElementById('setting-sheets-url').value.trim();
        try {
          window.utils.showToast('กำลังส่งออกข้อมูลทั้งหมดไปยัง Google Sheets...', 'info');
          await window.db.syncToGoogleSheets(sheetsUrl);
          window.utils.showToast('ส่งออกข้อมูลทั้งหมดไปที่ Google Sheets เรียบร้อยแล้ว!', 'success', 5000);
        } catch (err) {
          window.utils.showToast(`ส่งออกข้อมูลไม่สำเร็จ: ${err.message}`, 'danger', 5000);
        }
      };
    }

    const saveCloudBtn = document.getElementById('save-cloud-config-btn');
    if (saveCloudBtn) {
      saveCloudBtn.onclick = () => {
        const sheetsUrl = document.getElementById('setting-sheets-url').value.trim();
        const driveFolder = document.getElementById('setting-drive-folder').value.trim();
        if (!window.db.data.settings) window.db.data.settings = {};
        window.db.data.settings.sheets_url = sheetsUrl;
        window.db.data.settings.drive_folder = driveFolder;
        window.db.addAuditLog('ตั้งค่าระบบ', 'แก้ไขตั้งค่า Cloud', 'อัปเดตการตั้งค่า Google Drive & Google Sheets');
        window.db.save(true);
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('บันทึกการตั้งค่า Google Drive & Google Sheets และซิงก์เรียบร้อยแล้ว', 'success');
        }
      };
    }

    const backupBtn = document.getElementById('download-db-backup-btn');
    if (backupBtn) {
      backupBtn.onclick = () => {
        const jsonStr = JSON.stringify(window.db.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EDMRS_DB_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (window.utils && window.utils.showToast) {
          window.utils.showToast('ดาวน์โหลดไฟล์สำรองฐานข้อมูลสำเร็จ', 'success');
        }

        if (!window.db.data.settings) window.db.data.settings = {};
        window.db.data.settings.last_backup_date = new Date().toLocaleString('th-TH');
        window.db.save();
      };
    }

    const restoreInput = document.getElementById('restore-file-input');
    const triggerRestoreBtn = document.getElementById('trigger-restore-btn');
    if (triggerRestoreBtn && restoreInput) {
      triggerRestoreBtn.onclick = () => restoreInput.click();
      restoreInput.onchange = (e) => {
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            if (window.utils && window.utils.confirmDialog) {
              window.utils.confirmDialog(
                'ยืนยันการเรียกคืนฐานข้อมูล',
                'การกู้คืนจะเขียนทับข้อมูลปัจจุบันทั้งหมด คุณแน่ใจหรือไม่?',
                () => {
                  window.db.data = parsed;
                  window.db.save();
                  window.utils.showToast('กู้คืนฐานข้อมูลสำเร็จ!', 'success');
                  setTimeout(() => window.location.reload(), 500);
                }
              );
            }
          } catch (err) {
            if (window.utils && window.utils.showToast) {
              window.utils.showToast('ไฟล์ JSON ไม่ถูกต้อง', 'danger');
            }
          }
        };
        reader.readAsText(file);
      };
    }

    const clearMockBtn = document.getElementById('clear-mock-data-btn');
    if (clearMockBtn) {
      clearMockBtn.onclick = () => {
        if (window.utils && window.utils.confirmDialog) {
          window.utils.confirmDialog(
            'ยืนยันการล้างข้อมูลสาธิต/ข้อมูลปลอม',
            'ต้องการลบข้อมูลตัวอย่างทั้งหมด เพื่อเตรียมแสดงเฉพาะข้อมูลจริงจาก Google Sheets หรือไม่?',
            () => {
              window.db.clearMockData();
              window.utils.showToast('ล้างข้อมูลสาธิต/ปลอมเรียบร้อยแล้ว พร้อมรับข้อมูลจริงจาก Google Sheets', 'success');
              setTimeout(() => window.location.reload(), 500);
            }
          );
        }
      };
    }

    const resetSeedBtn = document.getElementById('reset-to-seed-btn');
    if (resetSeedBtn) {
      resetSeedBtn.onclick = () => {
        if (window.utils && window.utils.confirmDialog) {
          window.utils.confirmDialog(
            'ยืนยันการรีเซ็ตเป็น Seed Data',
            'ต้องการล้างข้อมูลและคืนค่า Seed Data ดั้งเดิมทั้งหมดหรือไม่?',
            () => {
              window.db.resetToSeed();
              window.utils.showToast('รีเซ็ตเป็น Seed Data สำเร็จ', 'success');
              setTimeout(() => window.location.reload(), 500);
            }
          );
        }
      };
    }
  }
};

window.settingsView = settingsView;
