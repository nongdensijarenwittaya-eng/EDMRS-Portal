/**
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

// CONFIGURATION: กำหนด ID ของโฟลเดอร์หลักใน Google Drive
var DRIVE_ROOT_FOLDER_ID = "1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv";

/**
 * เมนูลัดอัตโนมัติในแถบเมนู Google Sheets
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("📚 EDMRS Tools")
      .addItem("⚡ สร้างแท็บและคอลัมน์ทั้งหมดอัตโนมัติ (Auto Create Columns)", "initSheetsStructure")
      .addToUi();
  } catch (e) {
    // Suppress if run outside Spreadsheet UI context
  }
  
  // สร้างโครงสร้างแท็บและคอลัมน์อัตโนมัติทันที
  initSheetsStructure();
}

/**
 * ฟังก์ชันสร้างชีทและคอลัมน์หัวตารางทั้งหมดโดยอัตโนมัติ
 */
function initSheetsStructure() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tab: Students (ข้อมูลนักเรียน - 10 คอลัมน์)
  var studentsSheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  if (studentsSheet.getLastRow() === 0) {
    studentsSheet.appendRow(["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "ระดับชั้น", "ปีการศึกษา", "เลขที่ใบปพ.", "ชุดที่", "สถานะ"]);
    studentsSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
    studentsSheet.setFrozenRows(1);
  }

  // 2. Tab: Documents (ทะเบียนเอกสาร ปพ. - 9 คอลัมน์)
  var docsSheet = ss.getSheetByName("Documents") || ss.insertSheet("Documents");
  if (docsSheet.getLastRow() === 0) {
    docsSheet.appendRow(["รหัสเอกสาร", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code"]);
    docsSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    docsSheet.setFrozenRows(1);
  }

  // 3. Tab: Books (ทะเบียนเล่มเอกสาร - 8 คอลัมน์)
  var booksSheet = ss.getSheetByName("Books") || ss.insertSheet("Books");
  if (booksSheet.getLastRow() === 0) {
    booksSheet.appendRow(["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code"]);
    booksSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
    booksSheet.setFrozenRows(1);
  }

  // 4. Tab: Loans / Doc_Requests (ประวัติคำขอสำเนาเอกสาร - 10 คอลัมน์)
  var loansSheet = ss.getSheetByName("Loans") || ss.insertSheet("Loans");
  if (loansSheet.getLastRow() === 0) {
    loansSheet.appendRow(["เลขที่คำขอ", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ผู้ขอสำเนา/ผู้ยื่นเรื่อง", "สังกัด/ความสัมพันธ์", "วันที่ยื่นคำขอ", "วันที่กำหนดรับ", "วัตถุประสงค์ในการขอ", "สถานะคำขอ"]);
    loansSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff");
    loansSheet.setFrozenRows(1);
  }

  // 5. Tab: Storage_Locations (สถานที่จัดเก็บ - 7 คอลัมน์)
  var locsSheet = ss.getSheetByName("Storage_Locations") || ss.insertSheet("Storage_Locations");
  if (locsSheet.getLastRow() === 0) {
    locsSheet.appendRow(["Location Code", "อาคาร", "ห้อง", "ตู้", "ชั้น", "แฟ้ม", "คำอธิบาย"]);
    locsSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#64748b").setFontColor("#ffffff");
    locsSheet.setFrozenRows(1);
  }

  // 6. Tab: Users (บัญชีผู้ใช้งานระบบ - 7 คอลัมน์)
  var usersSheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(["ชื่อผู้ใช้งาน (Username)", "คำนำหน้า", "ชื่อ", "นามสกุล", "บทบาทหน้าที่ (Role)", "อีเมล", "วันที่สร้าง"]);
    usersSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#ef4444").setFontColor("#ffffff");
    usersSheet.setFrozenRows(1);
  }

  // 7. Tab: Settings (ตั้งค่าระบบ - 3 คอลัมน์)
  var settingsSheet = ss.getSheetByName("Settings") || ss.insertSheet("Settings");
  if (settingsSheet.getLastRow() === 0) {
    settingsSheet.appendRow(["Setting Key", "Value", "Description"]);
    settingsSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
    settingsSheet.setFrozenRows(1);
  }
}

/**
 * HTTP GET Request Handler - สำหรับดึงข้อมูลจาก Google Sheets
 */
function doGet(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  try {
    hasLock = lock.waitLock(15000); // 15-second lock for safe concurrent reads
  } catch (lErr) {
    console.warn("Read lock wait warning:", lErr);
  }

  try {
    e = e || { parameter: {} };
    var parameter = e.parameter || {};
    var action = parameter.action || "ping";
    
    if (action === "ping") {
      initSheetsStructure();
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "EDMRS Google Apps Script Web App API is Active & Lock Protected!",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "init_structure" || action === "setup") {
      initSheetsStructure();
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Created all Google Sheets tabs & columns automatically!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_all") {
      SpreadsheetApp.flush();
      var data = getAllSheetData();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: data,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

/**
 * HTTP POST Request Handler - สำหรับบันทึก/ซิงก์ข้อมูล และอัปโหลดไฟล์ไปที่ Google Drive Albums
 * พร้อมระบบ Script Lock ป้องกันการเขียนทับข้อมูลเมื่อใช้งานหลายเครื่องพร้อมกัน
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  try {
    // รอรับสิทธิ์ล็อกสูงสุด 30 วินาที เพื่อป้องกันการบันทึกชนกันจากหลายอุปกรณ์พร้อมกัน
    hasLock = lock.waitLock(30000);
    if (!hasLock) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "ขณะนี้มีอุปกรณ์อื่นกำลังบันทึกข้อมูลอยู่ โปรดลองใหม่อีกครั้งในอีกสักครู่ (Lock Timeout)"
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (lockErr) {
    console.warn("Write lock acquire warning:", lockErr);
  }

  try {
    e = e || { postData: { contents: "{}" } };
    var postData = e.postData || {};
    var contents = {};
    if (postData.contents) {
      try { contents = JSON.parse(postData.contents); } catch(pErr) { contents = {}; }
    }
    var action = contents.action || "sync_database";

    if (action === "init_structure" || action === "setup") {
      initSheetsStructure();
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Created all Google Sheets tabs & columns automatically!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "sync_database") {
      // 1. ตรวจสอบโครงสร้างตาราง
      initSheetsStructure();

      // 2. ซิงก์ข้อมูลรวมแบบ Differential Concurrency Merge ป้องกันข้อมูลหาย
      var deletedKeys = contents.deleted_keys || {};
      syncUsersSheet(contents.users || [], deletedKeys.users || []);
      syncStudentsSheet(contents.students || [], deletedKeys.students || []);
      syncDocumentsSheet(contents.documents || [], deletedKeys.documents || []);
      syncBooksSheet(contents.books || [], deletedKeys.books || []);
      syncLoansSheet(contents.loans || [], deletedKeys.loans || []);
      syncStorageLocationsSheet(contents.storage_locations || [], deletedKeys.storage_locations || []);
      syncSettingsSheet(contents.settings || {});
      
      // 3. บังคับบันทึกการเปลี่ยนแปลงลง Google Sheets ทันที
      SpreadsheetApp.flush();

      // 4. อ่านฐานข้อมูลฉบับสมบูรณ์ล่าสุดส่งกลับไปยังเครื่องที่บันทึก
      var updatedData = getAllSheetData();

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Synchronized database with Lock Protection & Smart Differential Merge successfully!",
        data: updatedData,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "upload_file_to_album") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "disabled",
        file_url: "",
        message: "การเก็บไฟล์และเอกสารรูปภาพบน Google Drive ถูกปิดใช้งานแล้ว"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

/**
 * ฟังก์ชันสร้าง/ค้นหา โฟลเดอร์อัลบั้มประจำเล่มเอกสารใน Google Drive
 */
function getOrCreateBookAlbumFolder(bookCode) {
  var rootFolder;
  try {
    rootFolder = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
  } catch (err) {
    rootFolder = DriveApp.getRootFolder();
  }

  var vaultFolders = rootFolder.getFoldersByName("EDMRS_Drive_Vault");
  var vaultFolder = vaultFolders.hasNext() ? vaultFolders.next() : rootFolder.createFolder("EDMRS_Drive_Vault");
  try {
    vaultFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  var cleanFolderTitle = String(bookCode || "UNASSIGNED").trim();
  if (!cleanFolderTitle || cleanFolderTitle === "undefined" || cleanFolderTitle === "null") {
    cleanFolderTitle = "UNASSIGNED";
  }

  var albumFolders = vaultFolder.getFoldersByName(cleanFolderTitle);
  var targetFolder = albumFolders.hasNext() ? albumFolders.next() : vaultFolder.createFolder(cleanFolderTitle);
  try {
    targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  return targetFolder;
}

/**
 * ฟังก์ชันบันทึกไฟล์สแกนดิจิทัลลงในอัลบั้ม Google Drive ประจำเล่ม
 */
function saveFileToDriveAlbum(bookCode, fileName, base64Data, fileType) {
  var albumFolder = getOrCreateBookAlbumFolder(bookCode);
  
  if (!base64Data) {
    var sampleBlob = Utilities.newBlob("EDMRS Digital PorPor Scan Document: " + fileName, fileType, fileName);
    var file = albumFolder.createFile(sampleBlob);
    return file.getUrl();
  }
  
  var decodedData = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decodedData, fileType, fileName);
  var createdFile = albumFolder.createFile(blob);
  createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return createdFile.getUrl();
}

/**
 * ฟังก์ชันซิงก์ข้อมูลนักเรียนลงชีท "Students" (พร้อมระบบ Smart Differential Concurrency Merge)
 */
function syncStudentsSheet(students, deletedKeys) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  
  var deletedMap = {};
  if (Array.isArray(deletedKeys)) {
    deletedKeys.forEach(function(k) {
      if (k) deletedMap[String(k).trim().toLowerCase()] = true;
    });
  }

  var studentMap = {};
  if (sheet.getLastRow() > 1) {
    var cols = Math.min(sheet.getLastColumn(), 10);
    var existingValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, cols).getValues();
    existingValues.forEach(function(row) {
      var sid = String(row[0] || "").trim();
      if (sid && !deletedMap[sid.toLowerCase()]) {
        studentMap[sid.toLowerCase()] = {
          student_id: sid,
          prefix: String(row[1] || ""),
          first_name: String(row[2] || ""),
          last_name: String(row[3] || ""),
          previous_name: String(row[4] || ""),
          grade_level: String(row[5] || ""),
          academic_year: String(row[6] || ""),
          doc_number: String(row[7] || ""),
          set_number: String(row[8] || ""),
          status: String(row[9] || "ปกติ")
        };
      }
    });
  }

  if (Array.isArray(students)) {
    students.forEach(function(s) {
      var sid = String(s.student_id || "").trim();
      if (sid && !deletedMap[sid.toLowerCase()]) {
        studentMap[sid.toLowerCase()] = {
          student_id: sid,
          prefix: String(s.prefix || ""),
          first_name: String(s.first_name || ""),
          last_name: String(s.last_name || ""),
          previous_name: String(s.previous_name || ""),
          grade_level: String(s.grade_level || ""),
          academic_year: String(s.academic_year || ""),
          doc_number: String(s.doc_number || ""),
          set_number: String(s.set_number || s.book_number || ""),
          status: String(s.status || "ปกติ")
        };
      }
    });
  }

  sheet.clearContents();
  var rows = [];
  rows.push(["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "ระดับชั้น", "ปีการศึกษา", "เลขที่ใบปพ.", "ชุดที่", "สถานะ"]);

  Object.keys(studentMap).forEach(function(key) {
    var s = studentMap[key];
    rows.push([
      s.student_id,
      s.prefix,
      s.first_name,
      s.last_name,
      s.previous_name,
      s.grade_level,
      s.academic_year,
      s.doc_number,
      s.set_number,
      s.status
    ]);
  });

  sheet.getRange(1, 1, rows.length, 10).setValues(rows);
  sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

/**
 * ฟังก์ชันซิงก์ข้อมูลเอกสาร ปพ. ลงชีท "Documents" (พร้อมระบบ Smart Differential Concurrency Merge)
 */
function syncDocumentsSheet(documents, deletedKeys) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Documents") || ss.insertSheet("Documents");
  
  var deletedMap = {};
  if (Array.isArray(deletedKeys)) {
    deletedKeys.forEach(function(k) {
      if (k) deletedMap[String(k).trim().toLowerCase()] = true;
    });
  }

  var isJunk = function(str) {
    if (!str) return true;
    var s = String(str).toLowerCase();
    return s.indexOf("blob:") !== -1 || s.indexOf("uw_") !== -1 || s.indexOf("http://") !== -1 || s.indexOf("https://") !== -1;
  };

  var docMap = {};
  if (sheet.getLastRow() > 1) {
    var cols = Math.min(sheet.getLastColumn(), 9);
    var existingValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, cols).getValues();
    existingValues.forEach(function(row) {
      var dcode = String(row[0] || "").trim();
      if (dcode && !deletedMap[dcode.toLowerCase()]) {
        var stdId = String(row[1] || "");
        var stdName = String(row[2] || "");
        var docTypeCode = String(row[3] || "ปพ.1");

        if (isJunk(stdId)) stdId = "";
        if (isJunk(stdName)) stdName = "";
        if (isJunk(docTypeCode)) docTypeCode = "ปพ.1";

        docMap[dcode.toLowerCase()] = {
          doc_code: dcode,
          student_id: stdId,
          student_name: stdName,
          doc_type_code: docTypeCode,
          academic_year: String(row[4] || ""),
          book_number: String(row[5] || ""),
          doc_number: String(row[6] || ""),
          status: String(row[7] || ""),
          location_code: String(row[8] || "")
        };
      }
    });
  }

  if (Array.isArray(documents)) {
    documents.forEach(function(d) {
      var dcode = String(d.doc_code || "").trim();
      if (!dcode && d.doc_number) {
        dcode = "DOC-" + (d.doc_type_code || "ปพ.1").replace('.', '') + "-" + (d.academic_year || "2565") + "-" + (d.book_number || "01") + "-" + d.doc_number;
      }
      if (dcode && !deletedMap[dcode.toLowerCase()]) {
        var stdId = String(d.student_id || "");
        var stdName = String(d.student_name || "");
        var docTypeCode = String(d.doc_type_code || "ปพ.1");

        if (isJunk(stdId)) stdId = "";
        if (isJunk(stdName)) stdName = "";
        if (isJunk(docTypeCode)) docTypeCode = "ปพ.1";

        docMap[dcode.toLowerCase()] = {
          doc_code: dcode,
          student_id: stdId,
          student_name: stdName,
          doc_type_code: docTypeCode,
          academic_year: String(d.academic_year || ""),
          book_number: String(d.book_number || ""),
          doc_number: String(d.doc_number || ""),
          status: String(d.status || ""),
          location_code: String(d.location_code || "")
        };
      }
    });
  }

  sheet.clearContents();
  var rows = [];
  rows.push(["รหัสเอกสาร", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code"]);

  Object.keys(docMap).forEach(function(key) {
    var d = docMap[key];
    rows.push([
      d.doc_code,
      d.student_id,
      d.student_name,
      d.doc_type_code,
      d.academic_year,
      d.book_number,
      d.doc_number,
      d.status,
      d.location_code
    ]);
  });

  sheet.getRange(1, 1, rows.length, 9).setValues(rows);
  sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

/**
 * ฟังก์ชันซิงก์ข้อมูลทะเบียนเล่มลงชีท "Books" (พร้อมระบบ Smart Differential Concurrency Merge)
 */
function syncBooksSheet(books, deletedKeys) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Books") || ss.insertSheet("Books");
  
  var deletedMap = {};
  if (Array.isArray(deletedKeys)) {
    deletedKeys.forEach(function(k) {
      if (k) deletedMap[String(k).trim().toLowerCase()] = true;
    });
  }

  var bookMap = {};
  if (sheet.getLastRow() > 1) {
    var cols = Math.min(sheet.getLastColumn(), 8);
    var existingValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, cols).getValues();
    existingValues.forEach(function(row) {
      var bcode = String(row[0] || "").trim();
      if (bcode && !deletedMap[bcode.toLowerCase()]) {
        bookMap[bcode.toLowerCase()] = {
          book_code: bcode,
          doc_type_code: String(row[1] || ""),
          academic_year: String(row[2] || ""),
          book_number: String(row[3] || ""),
          start_no: String(row[4] || ""),
          end_no: String(row[5] || ""),
          item_count: Number(row[6] || 0),
          location_code: String(row[7] || "")
        };
      }
    });
  }

  if (Array.isArray(books)) {
    books.forEach(function(b) {
      var bcode = String(b.book_code || "").trim();
      if (bcode && !deletedMap[bcode.toLowerCase()]) {
        bookMap[bcode.toLowerCase()] = {
          book_code: bcode,
          doc_type_code: String(b.doc_type_code || ""),
          academic_year: String(b.academic_year || ""),
          book_number: String(b.book_number || ""),
          start_no: String(b.start_no || ""),
          end_no: String(b.end_no || ""),
          item_count: Number(b.item_count || 0),
          location_code: String(b.location_code || "")
        };
      }
    });
  }

  sheet.clearContents();
  var rows = [];
  rows.push(["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code"]);

  Object.keys(bookMap).forEach(function(key) {
    var b = bookMap[key];
    rows.push([
      b.book_code,
      b.doc_type_code,
      b.academic_year,
      b.book_number,
      b.start_no,
      b.end_no,
      b.item_count,
      b.location_code
    ]);
  });

  sheet.getRange(1, 1, rows.length, 8).setValues(rows);
  sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

/**
 * ฟังก์ชันซิงก์ประวัติคำขอสำเนาเอกสารลงชีท "Loans" (Doc_Requests) (พร้อมระบบ Smart Differential Concurrency Merge)
 */
function syncLoansSheet(loans, deletedKeys) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Loans") || ss.insertSheet("Loans");
  
  var deletedMap = {};
  if (Array.isArray(deletedKeys)) {
    deletedKeys.forEach(function(k) {
      if (k) deletedMap[String(k).trim().toLowerCase()] = true;
    });
  }

  var isJunk = function(str) {
    if (!str) return true;
    var s = String(str).toLowerCase();
    return s.indexOf("blob:") !== -1 || s.indexOf("uw_") !== -1 || s.indexOf("http://") !== -1 || s.indexOf("https://") !== -1 || s.indexOf(".pdf") !== -1;
  };

  var loanMap = {};
  if (sheet.getLastRow() > 1) {
    var existingValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
    existingValues.forEach(function(row) {
      var lcode = String(row[0] || "").trim();
      if (lcode && !deletedMap[lcode.toLowerCase()]) {
        var stdId = String(row[1] || "");
        var stdName = String(row[2] || "");
        var docTypeCode = String(row[3] || "ปพ.1");

        if (isJunk(stdId)) stdId = "";
        if (isJunk(stdName)) stdName = "";
        if (isJunk(docTypeCode)) docTypeCode = "ปพ.1";

        loanMap[lcode.toLowerCase()] = {
          loan_code: lcode,
          student_id: stdId,
          student_name: stdName,
          doc_type_code: docTypeCode,
          borrower_name: String(row[4] || ""),
          borrower_dept: String(row[5] || ""),
          loan_date: String(row[6] || ""),
          return_due_date: String(row[7] || ""),
          reason: String(row[8] || ""),
          status_text: String(row[9] || "")
        };
      }
    });
  }

  if (Array.isArray(loans)) {
    loans.forEach(function(l) {
      var lcode = String(l.loan_code || "").trim();
      if (lcode && !deletedMap[lcode.toLowerCase()]) {
        var statusText = (l.status === 'returned' || l.status === 'completed') ? 'รับเอกสารแล้ว' : 'รอดำเนินการออกสำเนา';
        var stdId = String(l.student_id || "");
        var stdName = String(l.student_name || "");
        var docTypeCode = String(l.doc_type_code || "ปพ.1");

        if (isJunk(stdId)) stdId = "";
        if (isJunk(stdName)) stdName = "";
        if (isJunk(docTypeCode)) docTypeCode = "ปพ.1";

        loanMap[lcode.toLowerCase()] = {
          loan_code: lcode.replace('LN-', 'REQ-'),
          student_id: stdId,
          student_name: stdName,
          doc_type_code: docTypeCode,
          borrower_name: String(l.borrower_name || ""),
          borrower_dept: String(l.borrower_dept || ""),
          loan_date: String(l.loan_date || ""),
          return_due_date: String(l.return_due_date || ""),
          reason: String(l.reason || ""),
          status_text: statusText
        };
      }
    });
  }

  sheet.clearContents();
  var rows = [];
  rows.push(["เลขที่คำขอ", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ผู้ขอสำเนา/ผู้ยื่นเรื่อง", "สังกัด/ความสัมพันธ์", "วันที่ยื่นคำขอ", "วันที่กำหนดรับ", "วัตถุประสงค์ในการขอ", "สถานะคำขอ"]);

  Object.keys(loanMap).forEach(function(key) {
    var l = loanMap[key];
    rows.push([
      l.loan_code,
      l.student_id,
      l.student_name,
      l.doc_type_code,
      l.borrower_name,
      l.borrower_dept,
      l.loan_date,
      l.return_due_date,
      l.reason,
      l.status_text
    ]);
  });

  sheet.getRange(1, 1, rows.length, 10).setValues(rows);
  sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

/**
 * ฟังก์ชันซิงก์ข้อมูลสถานที่จัดเก็บลงชีท "Storage_Locations" (พร้อมระบบ Smart Differential Concurrency Merge)
 */
function syncStorageLocationsSheet(locations, deletedKeys) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Storage_Locations") || ss.insertSheet("Storage_Locations");
  
  var deletedMap = {};
  if (Array.isArray(deletedKeys)) {
    deletedKeys.forEach(function(k) {
      if (k) deletedMap[String(k).trim().toLowerCase()] = true;
    });
  }

  var locMap = {};
  if (sheet.getLastRow() > 1) {
    var existingValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
    existingValues.forEach(function(row) {
      var code = String(row[0] || "").trim();
      if (code && !deletedMap[code.toLowerCase()]) {
        locMap[code.toLowerCase()] = {
          code: code,
          building: String(row[1] || ""),
          room: String(row[2] || ""),
          cabinet: String(row[3] || ""),
          shelf: String(row[4] || ""),
          folder: String(row[5] || ""),
          description: String(row[6] || "")
        };
      }
    });
  }

  if (Array.isArray(locations)) {
    locations.forEach(function(l) {
      var code = String(l.code || "").trim();
      if (code && !deletedMap[code.toLowerCase()]) {
        locMap[code.toLowerCase()] = {
          code: code,
          building: String(l.building || ""),
          room: String(l.room || ""),
          cabinet: String(l.cabinet || ""),
          shelf: String(l.shelf || ""),
          folder: String(l.folder || ""),
          description: String(l.description || "")
        };
      }
    });
  }

  sheet.clearContents();
  var rows = [];
  rows.push(["Location Code", "อาคาร", "ห้อง", "ตู้", "ชั้น", "แฟ้ม", "คำอธิบาย"]);

  Object.keys(locMap).forEach(function(key) {
    var l = locMap[key];
    rows.push([
      l.code,
      l.building,
      l.room,
      l.cabinet,
      l.shelf,
      l.folder,
      l.description
    ]);
  });

  sheet.getRange(1, 1, rows.length, 7).setValues(rows);
  sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#64748b").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

/**
 * ฟังก์ชันซิงก์ข้อมูลบัญชีผู้ใช้งานลงชีท "Users" (พร้อมระบบ Smart Differential Concurrency Merge)
 */
function syncUsersSheet(users, deletedKeys) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  
  var deletedMap = {};
  if (Array.isArray(deletedKeys)) {
    deletedKeys.forEach(function(k) {
      if (k) deletedMap[String(k).trim().toLowerCase()] = true;
    });
  }

  var userMap = {};
  if (sheet.getLastRow() > 1) {
    var existingValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
    existingValues.forEach(function(row) {
      var uname = String(row[0] || "").trim();
      if (uname && !deletedMap[uname.toLowerCase()]) {
        userMap[uname.toLowerCase()] = {
          username: uname,
          title: String(row[1] || ""),
          first_name: String(row[2] || ""),
          last_name: String(row[3] || ""),
          role_code: String(row[4] || "staff"),
          email: String(row[5] || ""),
          created_at: String(row[6] || "")
        };
      }
    });
  }

  if (Array.isArray(users)) {
    users.forEach(function(u) {
      var uname = String(u.username || "").trim();
      if (uname && !deletedMap[uname.toLowerCase()]) {
        userMap[uname.toLowerCase()] = {
          username: uname,
          title: String(u.title || ""),
          first_name: String(u.first_name || ""),
          last_name: String(u.last_name || ""),
          role_code: String(u.role_code || "staff"),
          email: String(u.email || ""),
          created_at: String(u.created_at || "")
        };
      }
    });
  }

  sheet.clearContents();
  var rows = [];
  rows.push(["ชื่อผู้ใช้งาน (Username)", "คำนำหน้า", "ชื่อ", "นามสกุล", "บทบาทหน้าที่ (Role)", "อีเมล", "วันที่สร้าง"]);

  Object.keys(userMap).forEach(function(key) {
    var u = userMap[key];
    rows.push([
      u.username,
      u.title,
      u.first_name,
      u.last_name,
      u.role_code,
      u.email,
      u.created_at
    ]);
  });

  sheet.getRange(1, 1, rows.length, 7).setValues(rows);
  sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#ef4444").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

/**
 * ฟังก์ชันซิงก์ข้อมูลตั้งค่าระบบลงชีท "Settings"
 */
function syncSettingsSheet(settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings") || ss.insertSheet("Settings");
  sheet.clearContents();
  
  var rows = [];
  rows.push(["Setting Key", "Value", "Description"]);
  
  if (settings && typeof settings === "object") {
    var keys = Object.keys(settings);
    keys.forEach(function(key) {
      rows.push([
        key,
        String(settings[key] || ""),
        "ตั้งค่าระบบ EDMRS"
      ]);
    });
  }
  
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

/**
 * อ่านข้อมูลทั้งหมดจาก Google Sheets เพื่อส่งกลับไปยัง EDMRS
 */
function getAllSheetData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};
  var sheets = ss.getSheets();
  
  sheets.forEach(function(sh) {
    var name = sh.getName();
    var values = sh.getDataRange().getValues();
    var formulas = sh.getDataRange().getFormulas();
    
    for (var r = 0; r < values.length; r++) {
      for (var c = 0; c < values[r].length; c++) {
        if (formulas[r] && formulas[r][c] && formulas[r][c].indexOf("HYPERLINK") !== -1) {
          values[r][c] = formulas[r][c];
        }
      }
    }
    result[name] = values;
  });
  
  return result;
}

/**
 * ฟังก์ชันสำหรับกด "Run" ทดสอบใน Apps Script Editor เพื่อป้องกัน TypeError
 */
function testDoGet() {
  var res = doGet({ parameter: { action: "ping" } });
  Logger.log(res.getContent());
}

function testDoPost() {
  var res = doPost({ postData: { contents: JSON.stringify({ action: "ping" }) } });
  Logger.log(res.getContent());
}
