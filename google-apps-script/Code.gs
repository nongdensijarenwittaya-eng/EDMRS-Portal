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

  // 1. Tab: Students (ข้อมูลนักเรียน - 12 คอลัมน์)
  var studentsSheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  if (studentsSheet.getLastRow() === 0) {
    studentsSheet.appendRow(["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "ระดับชั้น", "ปีการศึกษา", "เลขที่ใบปพ.", "ชุดที่", "สำเนาปพ. ด้านหน้า", "สำเนาปพ. ด้านหลัง", "สถานะ"]);
    studentsSheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
    studentsSheet.setFrozenRows(1);
  }

  // 2. Tab: Documents (ทะเบียนเอกสาร ปพ. - 9 คอลัมน์)
  var docsSheet = ss.getSheetByName("Documents") || ss.insertSheet("Documents");
  if (docsSheet.getLastRow() === 0) {
    docsSheet.appendRow(["รหัสเอกสาร", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code", "ชื่อไฟล์ดิจิทัล", "ลิงก์ Google Drive"]);
    docsSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    docsSheet.setFrozenRows(1);
  }

  // 3. Tab: Books (ทะเบียนเล่มเอกสาร - 9 คอลัมน์)
  var booksSheet = ss.getSheetByName("Books") || ss.insertSheet("Books");
  if (booksSheet.getLastRow() === 0) {
    booksSheet.appendRow(["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code", "Google Drive Album Path"]);
    booksSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
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
  try {
    e = e || { parameter: {} };
    var parameter = e.parameter || {};
    var action = parameter.action || "ping";
    
    if (action === "ping") {
      // สร้างแท็บและคอลัมน์อัตโนมัติเมื่อมีการทดสอบเชื่อมต่อ
      initSheetsStructure();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "EDMRS Google Apps Script Web App API is Active & Columns Initialized!",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "init_structure" || action === "setup") {
      initSheetsStructure();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Created all Google Sheets tabs & columns automatically!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_all") {
      var data = getAllSheetData();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: data
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTTP POST Request Handler - สำหรับบันทึก/ซิงก์ข้อมูล และอัปโหลดไฟล์ไปที่ Google Drive Albums
 */
function doPost(e) {
  try {
    e = e || { postData: { contents: "{}" } };
    var postData = e.postData || {};
    var contents = postData.contents ? JSON.parse(postData.contents) : {};
    var action = contents.action || "sync_database";

    if (action === "init_structure" || action === "setup") {
      initSheetsStructure();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Created all Google Sheets tabs & columns automatically!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "sync_database") {
      // ซิงก์ข้อมูลตารางทั้งหมดลง Google Sheets (ผู้ใช้, นักเรียน, เอกสาร, เล่ม, ยืม-คืน, สถานที่จัดเก็บ, ตั้งค่าระบบ)
      initSheetsStructure();
      syncUsersSheet(contents.users || []);
      syncStudentsSheet(contents.students || []);
      syncDocumentsSheet(contents.documents || []);
      syncBooksSheet(contents.books || []);
      syncLoansSheet(contents.loans || []);
      syncStorageLocationsSheet(contents.storage_locations || []);
      syncSettingsSheet(contents.settings || {});
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Synchronized database (including Users, Storage_Locations & Settings) to Google Sheets successfully!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "upload_file_to_album") {
      // อัปโหลดไฟล์สแกน (PDF/JPG/PNG) ไปเก็บไว้ในอัลบั้ม Google Drive ประจำเล่ม
      var bookCode = contents.book_code || "UNASSIGNED";
      var fileName = contents.file_name || "scan.pdf";
      var base64Data = contents.base64_data;
      var fileType = contents.file_type || "application/pdf";
      
      var fileUrl = saveFileToDriveAlbum(bookCode, fileName, base64Data, fileType);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        file_url: fileUrl,
        message: "Saved file to Google Drive Album: " + bookCode
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
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
 * ฟังก์ชันซิงก์ข้อมูลนักเรียนลงชีท "Students"
 */
function syncStudentsSheet(students) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  sheet.clear();
  
  sheet.appendRow(["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "ระดับชั้น", "ปีการศึกษา", "เลขที่ใบปพ.", "ชุดที่", "สำเนาปพ. ด้านหน้า", "สำเนาปพ. ด้านหลัง", "สถานะ"]);
  sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  students.forEach(function(s) {
    var driveUrlFront = s.file_url || "";
    var driveUrlBack = s.file_url_back || "";
    var hyperlinkFront = (driveUrlFront && driveUrlFront.indexOf("http") === 0) ? '=HYPERLINK("' + driveUrlFront + '", "เปิดไฟล์ด้านหน้า")' : (driveUrlFront || "");
    var hyperlinkBack = (driveUrlBack && driveUrlBack.indexOf("http") === 0) ? '=HYPERLINK("' + driveUrlBack + '", "เปิดไฟล์ด้านหลัง")' : (driveUrlBack || "");

    sheet.appendRow([
      s.student_id,
      s.prefix || "",
      s.first_name || "",
      s.last_name || "",
      s.previous_name || "",
      s.grade_level || "",
      s.academic_year || "",
      s.doc_number || "",
      s.set_number || s.book_number || "",
      hyperlinkFront,
      hyperlinkBack,
      s.status || "ปกติ"
    ]);
  });
}

/**
 * ฟังก์ชันซิงก์ข้อมูลเอกสาร ปพ. ลงชีท "Documents"
 */
function syncDocumentsSheet(documents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Documents") || ss.insertSheet("Documents");
  sheet.clear();
  
  sheet.appendRow(["รหัสเอกสาร", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code", "ชื่อไฟล์ดิจิทัล", "ลิงก์ Google Drive (หน้า)", "ลิงก์ Google Drive (หลัง)"]);
  sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  documents.forEach(function(d) {
    var driveUrlFront = d.file_url || "";
    var driveUrlBack = d.file_url_back || "";
    var hyperlinkFront = (driveUrlFront && driveUrlFront.indexOf("http") === 0) ? '=HYPERLINK("' + driveUrlFront + '", "เปิดไฟล์ด้านหน้า")' : (driveUrlFront || "");
    var hyperlinkBack = (driveUrlBack && driveUrlBack.indexOf("http") === 0) ? '=HYPERLINK("' + driveUrlBack + '", "เปิดไฟล์ด้านหลัง")' : (driveUrlBack || "");

    sheet.appendRow([
      d.doc_code || "",
      d.doc_type_code || "",
      d.academic_year || "",
      d.book_number || "",
      d.doc_number || "",
      d.status || "",
      d.location_code || "",
      d.file_name || "",
      hyperlinkFront,
      hyperlinkBack
    ]);
  });
}

/**
 * ฟังก์ชันซิงก์ข้อมูลทะเบียนเล่มลงชีท "Books"
 */
function syncBooksSheet(books) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Books") || ss.insertSheet("Books");
  sheet.clear();
  
  sheet.appendRow(["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code", "Google Drive Album Path"]);
  sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  books.forEach(function(b) {
    sheet.appendRow([
      b.book_code,
      b.doc_type_code,
      b.academic_year,
      b.book_number,
      b.start_no,
      b.end_no,
      b.item_count,
      b.location_code,
      "EDMRS_Drive_Vault/" + b.book_code + "/"
    ]);
  });
}

/**
 * ฟังก์ชันซิงก์ประวัติคำขอสำเนาเอกสารลงชีท "Loans" (Doc_Requests)
 */
function syncLoansSheet(loans) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Loans") || ss.insertSheet("Loans");
  sheet.clear();
  
  sheet.appendRow(["เลขที่คำขอ", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ผู้ขอสำเนา/ผู้ยื่นเรื่อง", "สังกัด/ความสัมพันธ์", "วันที่ยื่นคำขอ", "วันที่กำหนดรับ", "วัตถุประสงค์ในการขอ", "สถานะคำขอ"]);
  sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  loans.forEach(function(l) {
    sheet.appendRow([
      l.loan_code ? l.loan_code.replace('LN-', 'REQ-') : "",
      l.student_id || "",
      l.student_name || "",
      l.doc_type_code || "ปพ.1",
      l.borrower_name || "",
      l.borrower_dept || "",
      l.loan_date || "",
      l.return_due_date || "",
      l.reason || "",
      (l.status === 'returned' || l.status === 'completed') ? 'รับเอกสารแล้ว' : 'รอดำเนินการออกสำเนา'
    ]);
  });
}

/**
 * ฟังก์ชันซิงก์ข้อมูลสถานที่จัดเก็บลงชีท "Storage_Locations"
 */
function syncStorageLocationsSheet(locations) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Storage_Locations") || ss.insertSheet("Storage_Locations");
  sheet.clear();
  
  sheet.appendRow(["Location Code", "อาคาร", "ห้อง", "ตู้", "ชั้น", "แฟ้ม", "คำอธิบาย"]);
  sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#64748b").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  locations.forEach(function(l) {
    sheet.appendRow([
      l.code || "",
      l.building || "",
      l.room || "",
      l.cabinet || "",
      l.shelf || "",
      l.folder || "",
      l.description || ""
    ]);
  });
}

/**
 * ฟังก์ชันซิงก์ข้อมูลบัญชีผู้ใช้งานลงชีท "Users"
 */
function syncUsersSheet(users) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  sheet.clear();
  
  sheet.appendRow(["ชื่อผู้ใช้งาน (Username)", "คำนำหน้า", "ชื่อ", "นามสกุล", "บทบาทหน้าที่ (Role)", "อีเมล", "วันที่สร้าง"]);
  sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#ef4444").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  users.forEach(function(u) {
    sheet.appendRow([
      u.username || "",
      u.title || "",
      u.first_name || "",
      u.last_name || "",
      u.role_code || "",
      u.email || "",
      u.created_at || ""
    ]);
  });
}

/**
 * ฟังก์ชันซิงก์ข้อมูลตั้งค่าระบบลงชีท "Settings"
 */
function syncSettingsSheet(settings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings") || ss.insertSheet("Settings");
  sheet.clear();
  
  sheet.appendRow(["Setting Key", "Value", "Description"]);
  sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  if (settings && typeof settings === "object") {
    var keys = Object.keys(settings);
    keys.forEach(function(key) {
      sheet.appendRow([
        key,
        String(settings[key] || ""),
        "ตั้งค่าระบบ EDMRS"
      ]);
    });
  }
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
