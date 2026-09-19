/**
 * ==========================================================================
 * EDMRS - Google Apps Script (GAS) Web App Backend (Code.gs)
 * Pure Database CRUD Connector for Google Sheets (Source of Truth)
 * ==========================================================================
 */

/**
 * Menu shortcut in Google Sheets UI
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("📚 EDMRS Tools")
      .addItem("⚡ สร้างแท็บและคอลัมน์ทั้งหมดอัตโนมัติ (Init Structure)", "initSheetsStructure")
      .addItem("🔄 ซิงค์และเชื่อมโยงข้อมูลทุกแท็บ (Auto Cross-Link All Sheets)", "menuAutoCrossLink")
      .addToUi();
  } catch (e) {}
  initSheetsStructure();
}

/**
 * Menu handler to manually trigger full 3-way cross-linking across all sheets
 */
function menuAutoCrossLink() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  autoCrossLinkSheets(ss);
  SpreadsheetApp.flush();
  try {
    SpreadsheetApp.getUi().alert("✅ ซิงค์และเชื่อมโยงข้อมูลทุกชีท (Students, Documents, Books) เรียบร้อยแล้ว!");
  } catch(e) {}
}

/**
 * Initialize Google Sheets Structure & Column Headers
 */
function initSheetsStructure(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tab: Students
  var studentsSheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  if (studentsSheet.getLastRow() === 0) {
    studentsSheet.appendRow(["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "ระดับชั้น", "ปีการศึกษา", "เลขที่ใบปพ.", "ชุดที่", "สถานะ", "Updated At"]);
    studentsSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
    studentsSheet.setFrozenRows(1);
  }

  // 2. Tab: Documents
  var docsSheet = ss.getSheetByName("Documents") || ss.insertSheet("Documents");
  if (docsSheet.getLastRow() === 0) {
    docsSheet.appendRow(["รหัสเอกสาร", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code", "Updated At"]);
    docsSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
    docsSheet.setFrozenRows(1);
  }

  // 3. Tab: Books
  var booksSheet = ss.getSheetByName("Books") || ss.insertSheet("Books");
  if (booksSheet.getLastRow() === 0) {
    booksSheet.appendRow(["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code", "Updated At"]);
    booksSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
    booksSheet.setFrozenRows(1);
  }

  // 4. Tab: Loans
  var loansSheet = ss.getSheetByName("Loans") || ss.insertSheet("Loans");
  if (loansSheet.getLastRow() === 0) {
    loansSheet.appendRow(["เลขที่คำขอ", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ผู้ขอสำเนา/ผู้ยื่นเรื่อง", "สังกัด/ความสัมพันธ์", "วันที่ยื่นคำขอ", "วันที่กำหนดรับ", "วัตถุประสงค์ในการขอ", "สถานะคำขอ", "Updated At"]);
    loansSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff");
    loansSheet.setFrozenRows(1);
  }

  // 5. Tab: Storage_Locations
  var locsSheet = ss.getSheetByName("Storage_Locations") || ss.insertSheet("Storage_Locations");
  if (locsSheet.getLastRow() === 0) {
    locsSheet.appendRow(["Location Code", "อาคาร", "ห้อง", "ตู้", "ชั้น", "แฟ้ม", "คำอธิบาย", "Updated At"]);
    locsSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#64748b").setFontColor("#ffffff");
    locsSheet.setFrozenRows(1);
  }

  // 6. Tab: Users
  var usersSheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(["ชื่อผู้ใช้งาน (Username)", "คำนำหน้า", "ชื่อ", "นามสกุล", "บทบาทหน้าที่ (Role)", "อีเมล", "วันที่สร้าง", "Password Hash", "Updated At"]);
    usersSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#ef4444").setFontColor("#ffffff");
    usersSheet.setFrozenRows(1);
  }

  // 7. Tab: Settings
  var settingsSheet = ss.getSheetByName("Settings") || ss.insertSheet("Settings");
  if (settingsSheet.getLastRow() === 0) {
    settingsSheet.appendRow(["Setting Key", "Value", "Description"]);
    settingsSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
    settingsSheet.setFrozenRows(1);
  }

  // 8. Tab: Deleted_Keys
  var delSheet = ss.getSheetByName("Deleted_Keys") || ss.insertSheet("Deleted_Keys");
  if (delSheet.getLastRow() === 0) {
    delSheet.appendRow(["Category", "Deleted Key", "Deleted Timestamp"]);
    delSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#475569").setFontColor("#ffffff");
    delSheet.setFrozenRows(1);
  }
}

/**
 * Get cached list of deleted keys
 */
function getStoredDeletedKeys(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Deleted_Keys");
  var result = { users: {}, students: {}, documents: {}, books: {}, loans: {}, storage_locations: {} };
  if (!sheet || sheet.getLastRow() <= 1 || sheet.getLastColumn() < 2) return result;

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var cat = String(row[0] || "").trim().toLowerCase();
    var key = String(row[1] || "").trim().toLowerCase();
    if (cat && key && result[cat]) {
      result[cat][key] = true;
    }
  }

  return result;
}

/**
 * Permanently record deleted record keys
 */
function recordDeletedKeys(ss, deletedKeysObj, existingMap) {
  if (!deletedKeysObj || typeof deletedKeysObj !== "object") return;
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Deleted_Keys") || ss.insertSheet("Deleted_Keys");

  existingMap = existingMap || getStoredDeletedKeys(ss);
  var newRows = [];
  var timestamp = new Date().toISOString();

  var categories = Object.keys(deletedKeysObj);
  for (var c = 0; c < categories.length; c++) {
    var cat = categories[c];
    var catLower = String(cat).toLowerCase();
    var list = deletedKeysObj[cat];
    if (Array.isArray(list)) {
      for (var k = 0; k < list.length; k++) {
        var keyLower = String(list[k] || "").trim().toLowerCase();
        if (keyLower && existingMap[catLower] && !existingMap[catLower][keyLower]) {
          existingMap[catLower][keyLower] = true;
          newRows.push([catLower, keyLower, timestamp]);
        }
      }
    }
  }

  if (newRows.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, newRows.length, 3).setValues(newRows);
  }
}

/**
 * Remove active record keys from Deleted_Keys sheet when re-saved or active
 */
function unrecordDeletedKeys(ss, activeItemsObj) {
  if (!activeItemsObj || typeof activeItemsObj !== "object") return;
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Deleted_Keys");
  if (!sheet || sheet.getLastRow() <= 1) return;

  var activeMap = {};
  var categories = Object.keys(activeItemsObj);
  for (var c = 0; c < categories.length; c++) {
    var cat = categories[c];
    var catLower = String(cat).toLowerCase();
    var list = activeItemsObj[cat];
    if (Array.isArray(list)) {
      activeMap[catLower] = {};
      for (var k = 0; k < list.length; k++) {
        var item = list[k];
        var key = item ? (item.student_id || item.doc_code || item.book_code || item.loan_code || item.username || item.location_code || "") : "";
        var keyLower = String(key).trim().toLowerCase();
        if (keyLower) activeMap[catLower][keyLower] = true;
      }
    }
  }

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  var keptRows = [];
  var hasRemoved = false;

  for (var i = 0; i < values.length; i++) {
    var cat = String(values[i][0] || "").trim().toLowerCase();
    var key = String(values[i][1] || "").trim().toLowerCase();
    if (cat && key && activeMap[cat] && activeMap[cat][key]) {
      hasRemoved = true;
    } else {
      keptRows.push(values[i]);
    }
  }

  if (hasRemoved) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).clearContent();
    if (keptRows.length > 0) {
      sheet.getRange(2, 1, keptRows.length, 3).setValues(keptRows);
    }
  }
}

/**
 * HTTP GET Request Handler - อ่านข้อมูลจาก Google Sheets (NO LOCK SERVICE FOR READS)
 */
function doGet(e) {
  try {
    e = e || { parameter: {} };
    var parameter = e.parameter || {};
    var action = parameter.action || "getData";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "EDMRS Web App API is active",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "getData" || action === "get_all") {
      var data = getAllSheetData(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: data,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Invalid action"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTTP POST Request Handler - เขียนข้อมูล (Create / Update / Delete / Sync)
 * ใช้ LockService เฉพาะ WRITE operations
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    // Wait up to 10 seconds for write lock
    lock.waitLock(10000);
    hasLock = true;
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: "LOCK_TIMEOUT",
      message: "ระบบกำลังมีการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    e = e || { postData: { contents: "{}" } };
    var postData = e.postData || {};
    var contents = {};
    if (postData.contents) {
      try { contents = JSON.parse(postData.contents); } catch(pErr) { contents = {}; }
    }

    var action = contents.action || "sync_database";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "sync_database" || action === "create" || action === "update" || action === "delete") {
      var deletedKeys = contents.deleted_keys || {};

      // Unrecord active items from Deleted_Keys tab FIRST so active items are never blacklisted
      unrecordDeletedKeys(ss, {
        students: contents.students,
        documents: contents.documents,
        books: contents.books,
        loans: contents.loans,
        users: contents.users,
        storage_locations: contents.storage_locations
      });

      var masterDeletedKeys = getStoredDeletedKeys(ss);

      if (action === "delete") {
        recordDeletedKeys(ss, deletedKeys, masterDeletedKeys);
        masterDeletedKeys = getStoredDeletedKeys(ss);
      }

      var currentDeleted = (action === "delete") ? deletedKeys : {};

      if (contents.users !== undefined) syncUsersSheet(ss, contents.users || [], currentDeleted.users || [], masterDeletedKeys.users || {});
      if (contents.students !== undefined) syncStudentsSheet(ss, contents.students || [], currentDeleted.students || [], masterDeletedKeys.students || {});
      if (contents.documents !== undefined) syncDocumentsSheet(ss, contents.documents || [], currentDeleted.documents || [], masterDeletedKeys.documents || {});
      if (contents.books !== undefined) syncBooksSheet(ss, contents.books || [], currentDeleted.books || [], masterDeletedKeys.books || {});
      if (contents.loans !== undefined) syncLoansSheet(ss, contents.loans || [], currentDeleted.loans || [], masterDeletedKeys.loans || {});
      if (contents.storage_locations !== undefined) syncStorageLocationsSheet(ss, contents.storage_locations || [], currentDeleted.storage_locations || [], masterDeletedKeys.storage_locations || {});
      if (contents.settings !== undefined) syncSettingsSheet(ss, contents.settings || {});

      autoCrossLinkSheets(ss);
      SpreadsheetApp.flush();
      var mergedData = getAllSheetData(ss);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: action,
        message: "Data saved successfully to Google Sheets",
        data: mergedData,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);

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
 * Helper to safely parse any date/time format (Date object, ISO string, etc.) into epoch milliseconds
 */
function parseTime(val) {
  if (!val) return 0;
  if (val instanceof Date) return val.getTime();
  var p = Date.parse(val);
  if (!isNaN(p)) return p;
  return 0;
}

/**
 * Sync Students Sheet
 */
function syncStudentsSheet(ss, students, deletedKeys, masterDeletedMap) {
  var sheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  masterDeletedMap = masterDeletedMap || {};
  var currentDeletedMap = {};
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) {
        var kLower = String(deletedKeys[i]).trim().toLowerCase();
        masterDeletedMap[kLower] = true;
        currentDeletedMap[kLower] = true;
      }
    }
  }

  var studentMap = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1 && sheet.getLastColumn() > 0) {
    var cols = Math.max(sheet.getLastColumn(), 11);
    var existingValues = sheet.getRange(2, 1, lastRow - 1, cols).getValues();
    for (var r = 0; r < existingValues.length; r++) {
      var row = existingValues[r];
      var sid = String(row[0] || "").trim();
      if (sid && sid.toLowerCase() !== "รหัสนักเรียน" && !currentDeletedMap[sid.toLowerCase()]) {
        var timeVal = row[10];
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
          status: String(row[9] || "ปกติ"),
          updated_at: timeVal ? (timeVal instanceof Date ? timeVal.toISOString() : String(timeVal)) : ""
        };
      }
    }
  }

  if (Array.isArray(students)) {
    for (var sIdx = 0; sIdx < students.length; sIdx++) {
      var s = students[sIdx];
      var sid = String(s.student_id || "").trim();
      if (sid) {
        var key = sid.toLowerCase();
        var incomingTimeStr = s.updated_at || new Date().toISOString();
        var incomingTime = parseTime(incomingTimeStr);
        var existing = studentMap[key];
        var existingTime = existing ? parseTime(existing.updated_at) : 0;

        if (!existing || incomingTime >= existingTime) {
          studentMap[key] = {
            student_id: sid,
            prefix: String(s.prefix || (existing ? existing.prefix : "")),
            first_name: String(s.first_name || (existing ? existing.first_name : "")),
            last_name: String(s.last_name || (existing ? existing.last_name : "")),
            previous_name: String(s.previous_name || (existing ? existing.previous_name : "")),
            grade_level: String(s.grade_level || (existing ? existing.grade_level : "")),
            academic_year: String(s.academic_year || (existing ? existing.academic_year : "")),
            doc_number: String(s.doc_number || (existing ? existing.doc_number : "")),
            set_number: String(s.set_number || s.book_number || (existing ? existing.set_number : "")),
            status: String(s.status || (existing ? existing.status : "ปกติ")),
            updated_at: incomingTimeStr
          };
        }
      }
    }
  }

  var rows = [["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "ระดับชั้น", "ปีการศึกษา", "เลขที่ใบปพ.", "ชุดที่", "สถานะ", "Updated At"]];
  var keys = Object.keys(studentMap);
  for (var k = 0; k < keys.length; k++) {
    var st = studentMap[keys[k]];
    rows.push([st.student_id, st.prefix, st.first_name, st.last_name, st.previous_name, st.grade_level, st.academic_year, st.doc_number, st.set_number, st.status, st.updated_at]);
  }

  if (lastRow > 0) {
    sheet.getRange(1, 1, Math.max(lastRow, 1), 11).clearContent();
  }
  sheet.getRange(1, 1, rows.length, 11).setValues(rows);
}

/**
 * Sync Documents Sheet
 */
function syncDocumentsSheet(ss, documents, deletedKeys, masterDeletedMap) {
  var sheet = ss.getSheetByName("Documents") || ss.insertSheet("Documents");
  masterDeletedMap = masterDeletedMap || {};
  var currentDeletedMap = {};
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) {
        var kLower = String(deletedKeys[i]).trim().toLowerCase();
        masterDeletedMap[kLower] = true;
        currentDeletedMap[kLower] = true;
      }
    }
  }

  var docMap = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1 && sheet.getLastColumn() > 0) {
    var cols = Math.max(sheet.getLastColumn(), 10);
    var existingValues = sheet.getRange(2, 1, lastRow - 1, cols).getValues();
    for (var r = 0; r < existingValues.length; r++) {
      var row = existingValues[r];
      var dcode = String(row[0] || "").trim();
      if (dcode && dcode.toLowerCase() !== "รหัสเอกสาร" && !currentDeletedMap[dcode.toLowerCase()]) {
        var timeVal = row[9];
        docMap[dcode.toLowerCase()] = {
          doc_code: dcode,
          student_id: String(row[1] || ""),
          student_name: String(row[2] || ""),
          doc_type_code: String(row[3] || "ปพ.1"),
          academic_year: String(row[4] || ""),
          book_number: String(row[5] || ""),
          doc_number: String(row[6] || ""),
          status: String(row[7] || ""),
          location_code: String(row[8] || ""),
          updated_at: timeVal ? (timeVal instanceof Date ? timeVal.toISOString() : String(timeVal)) : ""
        };
      }
    }
  }

  if (Array.isArray(documents)) {
    for (var dIdx = 0; dIdx < documents.length; dIdx++) {
      var d = documents[dIdx];
      var dcode = String(d.doc_code || "").trim();
      if (!dcode && d.doc_number) {
        dcode = "DOC-" + (d.doc_type_code || "ปพ.1").replace('.', '') + "-" + (d.academic_year || "2565") + "-" + (d.book_number || "01") + "-" + d.doc_number;
      }
      if (dcode) {
        var key = dcode.toLowerCase();
        var incomingTimeStr = d.updated_at || new Date().toISOString();
        var incomingTime = parseTime(incomingTimeStr);
        var existing = docMap[key];
        var existingTime = existing ? parseTime(existing.updated_at) : 0;

        if (!existing || incomingTime >= existingTime) {
          docMap[key] = {
            doc_code: dcode,
            student_id: String(d.student_id || (existing ? existing.student_id : "")),
            student_name: String(d.student_name || (existing ? existing.student_name : "")),
            doc_type_code: String(d.doc_type_code || (existing ? existing.doc_type_code : "ปพ.1")),
            academic_year: String(d.academic_year || (existing ? existing.academic_year : "")),
            book_number: String(d.book_number || (existing ? existing.book_number : "")),
            doc_number: String(d.doc_number || (existing ? existing.doc_number : "")),
            status: String(d.status || (existing ? existing.status : "")),
            location_code: String(d.location_code || (existing ? existing.location_code : "")),
            updated_at: incomingTimeStr
          };
        }
      }
    }
  }

  var rows = [["รหัสเอกสาร", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code", "Updated At"]];
  var keys = Object.keys(docMap);
  for (var k = 0; k < keys.length; k++) {
    var dc = docMap[keys[k]];
    rows.push([dc.doc_code, dc.student_id, dc.student_name, dc.doc_type_code, dc.academic_year, dc.book_number, dc.doc_number, dc.status, dc.location_code, dc.updated_at]);
  }

  if (lastRow > 0) {
    sheet.getRange(1, 1, Math.max(lastRow, 1), 10).clearContent();
  }
  sheet.getRange(1, 1, rows.length, 10).setValues(rows);
}

/**
 * Sync Books Sheet
 */
function syncBooksSheet(ss, books, deletedKeys, masterDeletedMap) {
  var sheet = ss.getSheetByName("Books") || ss.insertSheet("Books");
  masterDeletedMap = masterDeletedMap || {};
  var currentDeletedMap = {};
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) {
        var kLower = String(deletedKeys[i]).trim().toLowerCase();
        masterDeletedMap[kLower] = true;
        currentDeletedMap[kLower] = true;
      }
    }
  }

  var bookMap = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1 && sheet.getLastColumn() > 0) {
    var cols = Math.max(sheet.getLastColumn(), 9);
    var existingValues = sheet.getRange(2, 1, lastRow - 1, cols).getValues();
    for (var r = 0; r < existingValues.length; r++) {
      var row = existingValues[r];
      var bcode = String(row[0] || "").trim();
      if (bcode && bcode.toLowerCase() !== "รหัสเล่ม" && !currentDeletedMap[bcode.toLowerCase()]) {
        var timeVal = row[8];
        bookMap[bcode.toLowerCase()] = {
          book_code: bcode,
          doc_type_code: String(row[1] || ""),
          academic_year: String(row[2] || ""),
          book_number: String(row[3] || ""),
          start_no: String(row[4] || ""),
          end_no: String(row[5] || ""),
          item_count: Number(row[6] || 0),
          location_code: String(row[7] || ""),
          updated_at: timeVal ? (timeVal instanceof Date ? timeVal.toISOString() : String(timeVal)) : ""
        };
      }
    }
  }

  if (Array.isArray(books)) {
    for (var bIdx = 0; bIdx < books.length; bIdx++) {
      var b = books[bIdx];
      var bcode = String(b.book_code || "").trim();
      if (bcode) {
        var key = bcode.toLowerCase();
        var incomingTimeStr = b.updated_at || new Date().toISOString();
        var incomingTime = parseTime(incomingTimeStr);
        var existing = bookMap[key];
        var existingTime = existing ? parseTime(existing.updated_at) : 0;

        if (!existing || incomingTime >= existingTime) {
          bookMap[key] = {
            book_code: bcode,
            doc_type_code: String(b.doc_type_code || (existing ? existing.doc_type_code : "")),
            academic_year: String(b.academic_year || (existing ? existing.academic_year : "")),
            book_number: String(b.book_number || (existing ? existing.book_number : "")),
            start_no: String(b.start_no || (existing ? existing.start_no : "")),
            end_no: String(b.end_no || (existing ? existing.end_no : "")),
            item_count: Number(b.item_count !== undefined ? b.item_count : (existing ? existing.item_count : 0)),
            location_code: String(b.location_code || (existing ? existing.location_code : "")),
            updated_at: incomingTimeStr
          };
        }
      }
    }
  }

  var rows = [["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code", "Updated At"]];
  var keys = Object.keys(bookMap);
  for (var k = 0; k < keys.length; k++) {
    var bk = bookMap[keys[k]];
    rows.push([bk.book_code, bk.doc_type_code, bk.academic_year, bk.book_number, bk.start_no, bk.end_no, bk.item_count, bk.location_code, bk.updated_at]);
  }

  if (lastRow > 0) {
    sheet.getRange(1, 1, Math.max(lastRow, 1), 9).clearContent();
  }
  sheet.getRange(1, 1, rows.length, 9).setValues(rows);
}

/**
 * Sync Loans Sheet
 */
function syncLoansSheet(ss, loans, deletedKeys, masterDeletedMap) {
  var sheet = ss.getSheetByName("Loans") || ss.insertSheet("Loans");
  masterDeletedMap = masterDeletedMap || {};
  var currentDeletedMap = {};
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) {
        var kLower = String(deletedKeys[i]).trim().toLowerCase();
        masterDeletedMap[kLower] = true;
        currentDeletedMap[kLower] = true;
      }
    }
  }

  var loanMap = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1 && sheet.getLastColumn() > 0) {
    var cols = Math.max(sheet.getLastColumn(), 11);
    var existingValues = sheet.getRange(2, 1, lastRow - 1, cols).getValues();
    for (var r = 0; r < existingValues.length; r++) {
      var row = existingValues[r];
      var lcode = String(row[0] || "").trim();
      if (lcode && lcode.toLowerCase() !== "เลขที่คำขอ" && !currentDeletedMap[lcode.toLowerCase()]) {
        var timeVal = row[10];
        loanMap[lcode.toLowerCase()] = {
          loan_code: lcode,
          student_id: String(row[1] || ""),
          student_name: String(row[2] || ""),
          doc_type_code: String(row[3] || "ปพ.1"),
          borrower_name: String(row[4] || ""),
          borrower_dept: String(row[5] || ""),
          loan_date: String(row[6] || ""),
          return_due_date: String(row[7] || ""),
          reason: String(row[8] || ""),
          status_text: String(row[9] || ""),
          updated_at: timeVal ? (timeVal instanceof Date ? timeVal.toISOString() : String(timeVal)) : ""
        };
      }
    }
  }

  if (Array.isArray(loans)) {
    for (var lIdx = 0; lIdx < loans.length; lIdx++) {
      var l = loans[lIdx];
      var lcode = String(l.loan_code || "").trim();
      if (lcode) {
        var key = lcode.toLowerCase();
        var statusText = (l.status === 'returned' || l.status === 'completed') ? 'รับเอกสารแล้ว' : 'รอดำเนินการออกสำเนา';
        var incomingTimeStr = l.updated_at || new Date().toISOString();
        var incomingTime = parseTime(incomingTimeStr);
        var existing = loanMap[key];
        var existingTime = existing ? parseTime(existing.updated_at) : 0;

        if (!existing || incomingTime >= existingTime) {
          loanMap[key] = {
            loan_code: lcode.replace('LN-', 'REQ-'),
            student_id: String(l.student_id || (existing ? existing.student_id : "")),
            student_name: String(l.student_name || (existing ? existing.student_name : "")),
            doc_type_code: String(l.doc_type_code || (existing ? existing.doc_type_code : "ปพ.1")),
            borrower_name: String(l.borrower_name || (existing ? existing.borrower_name : "")),
            borrower_dept: String(l.borrower_dept || (existing ? existing.borrower_dept : "")),
            loan_date: String(l.loan_date || (existing ? existing.loan_date : "")),
            return_due_date: String(l.return_due_date || (existing ? existing.return_due_date : "")),
            reason: String(l.reason || (existing ? existing.reason : "")),
            status_text: statusText,
            updated_at: incomingTimeStr
          };
        }
      }
    }
  }

  var rows = [["เลขที่คำขอ", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ผู้ขอสำเนา/ผู้ยื่นเรื่อง", "สังกัด/ความสัมพันธ์", "วันที่ยื่นคำขอ", "วันที่กำหนดรับ", "วัตถุประสงค์ในการขอ", "สถานะคำขอ", "Updated At"]];
  var keys = Object.keys(loanMap);
  for (var k = 0; k < keys.length; k++) {
    var ln = loanMap[keys[k]];
    rows.push([ln.loan_code, ln.student_id, ln.student_name, ln.doc_type_code, ln.borrower_name, ln.borrower_dept, ln.loan_date, ln.return_due_date, ln.reason, ln.status_text, ln.updated_at]);
  }

  if (lastRow > 0) {
    sheet.getRange(1, 1, Math.max(lastRow, 1), 11).clearContent();
  }
  sheet.getRange(1, 1, rows.length, 11).setValues(rows);
}

/**
 * Sync Storage_Locations Sheet
 */
function syncStorageLocationsSheet(ss, locations, deletedKeys, masterDeletedMap) {
  var sheet = ss.getSheetByName("Storage_Locations") || ss.insertSheet("Storage_Locations");
  masterDeletedMap = masterDeletedMap || {};
  var currentDeletedMap = {};
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) {
        var kLower = String(deletedKeys[i]).trim().toLowerCase();
        masterDeletedMap[kLower] = true;
        currentDeletedMap[kLower] = true;
      }
    }
  }

  var locMap = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1 && sheet.getLastColumn() > 0) {
    var cols = Math.max(sheet.getLastColumn(), 8);
    var existingValues = sheet.getRange(2, 1, lastRow - 1, cols).getValues();
    for (var r = 0; r < existingValues.length; r++) {
      var row = existingValues[r];
      var code = String(row[0] || "").trim();
      if (code && code.toLowerCase() !== "location code" && !currentDeletedMap[code.toLowerCase()]) {
        var timeVal = row[7];
        locMap[code.toLowerCase()] = {
          code: code,
          building: String(row[1] || ""),
          room: String(row[2] || ""),
          cabinet: String(row[3] || ""),
          shelf: String(row[4] || ""),
          folder: String(row[5] || ""),
          description: String(row[6] || ""),
          updated_at: timeVal ? (timeVal instanceof Date ? timeVal.toISOString() : String(timeVal)) : ""
        };
      }
    }
  }

  if (Array.isArray(locations)) {
    for (var locIdx = 0; locIdx < locations.length; locIdx++) {
      var l = locations[locIdx];
      var code = String(l.code || "").trim();
      if (code) {
        var key = code.toLowerCase();
        if (currentDeletedMap[key]) continue;

        var incomingTimeStr = l.updated_at || new Date().toISOString();
        var incomingTime = parseTime(incomingTimeStr);
        var existing = locMap[key];
        var existingTime = existing ? parseTime(existing.updated_at) : 0;

        if (!existing || incomingTime >= existingTime) {
          locMap[key] = {
            code: code,
            building: String(l.building || (existing ? existing.building : "")),
            room: String(l.room || (existing ? existing.room : "")),
            cabinet: String(l.cabinet || (existing ? existing.cabinet : "")),
            shelf: String(l.shelf || (existing ? existing.shelf : "")),
            folder: String(l.folder || (existing ? existing.folder : "")),
            description: String(l.description || (existing ? existing.description : "")),
            updated_at: incomingTimeStr
          };
        }
      }
    }
  }

  var rows = [["Location Code", "อาคาร", "ห้อง", "ตู้", "ชั้น", "แฟ้ม", "คำอธิบาย", "Updated At"]];
  var keys = Object.keys(locMap);
  for (var k = 0; k < keys.length; k++) {
    var lc = locMap[keys[k]];
    rows.push([lc.code, lc.building, lc.room, lc.cabinet, lc.shelf, lc.folder, lc.description, lc.updated_at]);
  }

  if (lastRow > 0) {
    sheet.getRange(1, 1, Math.max(lastRow, 1), 8).clearContent();
  }
  sheet.getRange(1, 1, rows.length, 8).setValues(rows);
}

/**
 * Sync Users Sheet
 */
function syncUsersSheet(ss, users, deletedKeys, masterDeletedMap) {
  var sheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
  masterDeletedMap = masterDeletedMap || {};
  var currentDeletedMap = {};
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) {
        var kLower = String(deletedKeys[i]).trim().toLowerCase();
        masterDeletedMap[kLower] = true;
        currentDeletedMap[kLower] = true;
      }
    }
  }

  var userMap = {};
  var lastRow = sheet.getLastRow();
  if (lastRow > 1 && sheet.getLastColumn() > 0) {
    var cols = Math.max(sheet.getLastColumn(), 9);
    var existingValues = sheet.getRange(2, 1, lastRow - 1, cols).getValues();
    for (var r = 0; r < existingValues.length; r++) {
      var row = existingValues[r];
      var uname = String(row[0] || "").trim();
      if (uname && uname.toLowerCase() !== "ชื่อผู้ใช้งาน (username)" && !currentDeletedMap[uname.toLowerCase()]) {
        var timeVal = row[8];
        userMap[uname.toLowerCase()] = {
          username: uname,
          title: String(row[1] || ""),
          first_name: String(row[2] || ""),
          last_name: String(row[3] || ""),
          role_code: String(row[4] || "staff"),
          email: String(row[5] || ""),
          created_at: String(row[6] || ""),
          password_hash: String(row[7] || "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"),
          updated_at: timeVal ? (timeVal instanceof Date ? timeVal.toISOString() : String(timeVal)) : ""
        };
      }
    }
  }

  if (Array.isArray(users)) {
    for (var uIdx = 0; uIdx < users.length; uIdx++) {
      var u = users[uIdx];
      var uname = String(u.username || "").trim();
      if (uname) {
        var key = uname.toLowerCase();
        var incomingTimeStr = u.updated_at || new Date().toISOString();
        var incomingTime = parseTime(incomingTimeStr);
        var existing = userMap[key];
        var existingTime = existing ? parseTime(existing.updated_at) : 0;

        if (!existing || incomingTime >= existingTime) {
          userMap[key] = {
            username: uname,
            title: String(u.title || (existing ? existing.title : "")),
            first_name: String(u.first_name || (existing ? existing.first_name : "")),
            last_name: String(u.last_name || (existing ? existing.last_name : "")),
            role_code: String(u.role_code || (existing ? existing.role_code : "staff")),
            email: String(u.email || (existing ? existing.email : "")),
            created_at: String(u.created_at || (existing ? existing.created_at : "")),
            password_hash: String(u.password_hash || (existing ? existing.password_hash : "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918")),
            updated_at: incomingTimeStr
          };
        }
      }
    }
  }

  var rows = [["ชื่อผู้ใช้งาน (Username)", "คำนำหน้า", "ชื่อ", "นามสกุล", "บทบาทหน้าที่ (Role)", "อีเมล", "วันที่สร้าง", "Password Hash", "Updated At"]];
  var keys = Object.keys(userMap);
  for (var k = 0; k < keys.length; k++) {
    var usr = userMap[keys[k]];
    rows.push([usr.username, usr.title, usr.first_name, usr.last_name, usr.role_code, usr.email, usr.created_at, usr.password_hash, usr.updated_at]);
  }

  if (lastRow > 0) {
    sheet.getRange(1, 1, Math.max(lastRow, 1), 9).clearContent();
  }
  sheet.getRange(1, 1, rows.length, 9).setValues(rows);
}

/**
 * Sync Settings Sheet
 */
function syncSettingsSheet(ss, settings) {
  var sheet = ss.getSheetByName("Settings") || ss.insertSheet("Settings");
  var lastRow = sheet.getLastRow();

  var rows = [["Setting Key", "Value", "Description"]];
  if (settings && typeof settings === "object") {
    var keys = Object.keys(settings);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      rows.push([key, String(settings[key] || ""), "ตั้งค่าระบบ EDMRS"]);
    }
  }
  if (lastRow > 0) {
    sheet.getRange(1, 1, Math.max(lastRow, 1), 3).clearContent();
  }
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
}

/**
 * Automatically cross-link Documents & Books to Students (หน้าแรก).
 * If a document is added in Documents tab with a student_id, ensure that student exists in Students (หน้าแรก).
 * Reuse existing books and deduplicate duplicate book codes.
 */
function autoCrossLinkSheets(ss) {
  try {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    var masterDeletedKeys = getStoredDeletedKeys(ss);

    var studentsSheet = ss.getSheetByName("Students");
    var docsSheet = ss.getSheetByName("Documents");
    var booksSheet = ss.getSheetByName("Books");

    if (!studentsSheet || !docsSheet || !booksSheet) return;

    var studentMap = {};
    var docMap = {};
    var bookMap = {};
    var bookByNumberYear = {};

    function cleanDocTypeGAS(type) {
      var t = String(type || 'ปพ.1').trim();
      if (/^(p1|uw1|uw\.1|ปพ1|ปพ\.1)$/i.test(t)) return { code: 'ปพ1', name: 'ปพ.1' };
      if (/^(p2|uw2|uw\.2|ปพ2|ปพ\.2)$/i.test(t)) return { code: 'ปพ2', name: 'ปพ.2' };
      if (/^(p3|uw3|uw\.3|ปพ3|ปพ\.3)$/i.test(t)) return { code: 'ปพ3', name: 'ปพ.3' };
      if (/^(p7|uw7|uw\.7|ปพ7|ปพ\.7)$/i.test(t)) return { code: 'ปพ7', name: 'ปพ.7' };
      if (/^(p9|uw9|uw\.9|ปพ9|ปพ\.9)$/i.test(t)) return { code: 'ปพ9', name: 'ปพ.9' };
      var clean = t.replace(/[\.\_\-\s]/g, '').toUpperCase();
      return { code: clean || 'ปพ1', name: t || 'ปพ.1' };
    }

    // 1. Read Students Sheet
    var stLastRow = studentsSheet.getLastRow();
    if (stLastRow > 1) {
      var stCols = Math.max(studentsSheet.getLastColumn(), 11);
      var stVals = studentsSheet.getRange(2, 1, stLastRow - 1, stCols).getValues();
      for (var r = 0; r < stVals.length; r++) {
        var sid = String(stVals[r][0] || "").trim();
        if (sid && sid.toLowerCase() !== "รหัสนักเรียน") {
          studentMap[sid.toLowerCase()] = {
            student_id: sid,
            prefix: String(stVals[r][1] || ""),
            first_name: String(stVals[r][2] || ""),
            last_name: String(stVals[r][3] || ""),
            previous_name: String(stVals[r][4] || ""),
            grade_level: String(stVals[r][5] || ""),
            academic_year: String(stVals[r][6] || ""),
            doc_number: String(stVals[r][7] || ""),
            set_number: String(stVals[r][8] || ""),
            status: String(stVals[r][9] || "ปกติ"),
            updated_at: String(stVals[r][10] || "")
          };
        }
      }
    }

    // 2. Read Documents Sheet
    var docLastRow = docsSheet.getLastRow();
    if (docLastRow > 1) {
      var docCols = Math.max(docsSheet.getLastColumn(), 10);
      var docVals = docsSheet.getRange(2, 1, docLastRow - 1, docCols).getValues();
      for (var r2 = 0; r2 < docVals.length; r2++) {
        var dcode = String(docVals[r2][0] || "").trim();
        if (dcode && dcode.toLowerCase() !== "รหัสเอกสาร") {
          docMap[dcode.toLowerCase()] = {
            doc_code: dcode,
            student_id: String(docVals[r2][1] || "").trim(),
            student_name: String(docVals[r2][2] || "").trim(),
            doc_type_code: String(docVals[r2][3] || "ปพ.1").trim(),
            academic_year: String(docVals[r2][4] || "").trim(),
            book_number: String(docVals[r2][5] || "").trim(),
            doc_number: String(docVals[r2][6] || "").trim(),
            status: String(docVals[r2][7] || "stored").trim(),
            location_code: String(docVals[r2][8] || "").trim(),
            updated_at: String(docVals[r2][9] || "")
          };
        }
      }
    }

    // 3. Read Books Sheet (deduplicating by book_number + academic_year)
    var bkLastRow = booksSheet.getLastRow();
    if (bkLastRow > 1) {
      var bkCols = Math.max(booksSheet.getLastColumn(), 9);
      var bkVals = booksSheet.getRange(2, 1, bkLastRow - 1, bkCols).getValues();
      for (var r3 = 0; r3 < bkVals.length; r3++) {
        var bcode = String(bkVals[r3][0] || "").trim();
        if (bcode && bcode.toLowerCase() !== "รหัสเล่ม") {
          var bItem = {
            book_code: bcode,
            doc_type_code: String(bkVals[r3][1] || ""),
            academic_year: String(bkVals[r3][2] || ""),
            book_number: String(bkVals[r3][3] || ""),
            start_no: String(bkVals[r3][4] || ""),
            end_no: String(bkVals[r3][5] || ""),
            item_count: Number(bkVals[r3][6] || 0),
            location_code: String(bkVals[r3][7] || ""),
            updated_at: String(bkVals[r3][8] || "")
          };

          var nyKey = (String(bItem.book_number).trim() + "_" + String(bItem.academic_year).trim()).toLowerCase();
          if (!bookByNumberYear[nyKey]) {
            bookMap[bcode.toLowerCase()] = bItem;
            bookByNumberYear[nyKey] = bItem;
          }
        }
      }
    }

    var timestamp = new Date().toISOString();
    var hasStudentsAdded = false;
    var hasDocsAddedOrChanged = false;
    var hasBooksAdded = false;

    // Cross-link 1: From Students (หน้าแรก) -> Auto add/sync missing Documents (หน้าสอง) & Books (หน้าสาม)
    var stKeys = Object.keys(studentMap);
    for (var s = 0; s < stKeys.length; s++) {
      var stObj = studentMap[stKeys[s]];
      var sid = String(stObj.student_id || "").trim();
      var sKey = sid.toLowerCase();
      if (!sid) continue;

      var fullName = (stObj.prefix || "") + (stObj.first_name || "") + " " + (stObj.last_name || "");
      fullName = fullName.trim();
      var setNum = String(stObj.set_number || "01").trim();
      var docNum = String(stObj.doc_number || "001").trim();
      var year = String(stObj.academic_year || "2569").trim();

      var typeObj = cleanDocTypeGAS("ปพ.1");
      var dCode = "DOC-" + typeObj.code + "-" + sid;
      var dKey = dCode.toLowerCase();

      var docFound = null;
      for (var dk in docMap) {
        if (docMap[dk] && String(docMap[dk].student_id || "").trim().toLowerCase() === sKey) {
          docFound = docMap[dk];
          break;
        }
      }

      if (docFound) {
        if (docFound.student_name !== fullName || docFound.doc_number !== docNum || docFound.book_number !== setNum || docFound.academic_year !== year) {
          docFound.student_name = fullName;
          docFound.doc_number = docNum;
          docFound.book_number = setNum;
          docFound.academic_year = year;
          docFound.updated_at = timestamp;
          hasDocsAddedOrChanged = true;
        }
      } else {
        docMap[dKey] = {
          doc_code: dCode,
          student_id: sid,
          student_name: fullName,
          doc_type_code: "ปพ.1",
          academic_year: year,
          book_number: setNum,
          doc_number: docNum,
          status: "stored",
          location_code: "LOC-A01-01-01",
          updated_at: timestamp
        };
        hasDocsAddedOrChanged = true;
      }

      var bCode = "BOOK-" + typeObj.code + "-" + year + "-" + setNum;
      var bKey = bCode.toLowerCase();
      var nyKey = (setNum + "_" + year).toLowerCase();

      if (!bookMap[bKey] && !bookByNumberYear[nyKey]) {
        var newBk = {
          book_code: bCode,
          doc_type_code: typeObj.name,
          academic_year: year,
          book_number: setNum,
          start_no: "001",
          end_no: "050",
          item_count: 50,
          location_code: "LOC-A01-01-01",
          updated_at: timestamp
        };
        bookMap[bKey] = newBk;
        bookByNumberYear[nyKey] = newBk;
        hasBooksAdded = true;
      }
    }

    // Cross-link 2: From Documents -> Auto add missing Students to Students tab (หน้าแรก) & missing Books to Books tab (หน้าสาม)
    var docKeys = Object.keys(docMap);
    for (var d = 0; d < docKeys.length; d++) {
      var docObj = docMap[docKeys[d]];
      var sid = String(docObj.student_id || "").trim();
      var sKey = sid.toLowerCase();

      if (sid && !studentMap[sKey]) {
        var full = docObj.student_name || "";
        var prefix = "";
        var firstName = full;
        var lastName = "";

        if (full.indexOf("นาย") === 0) { prefix = "นาย"; firstName = full.substring(3).trim(); }
        else if (full.indexOf("นางสาว") === 0) { prefix = "นางสาว"; firstName = full.substring(6).trim(); }
        else if (full.indexOf("นาง") === 0) { prefix = "นาง"; firstName = full.substring(3).trim(); }
        else if (full.indexOf("เด็กชาย") === 0) { prefix = "เด็กชาย"; firstName = full.substring(7).trim(); }
        else if (full.indexOf("เด็กหญิง") === 0) { prefix = "เด็กหญิง"; firstName = full.substring(8).trim(); }

        var parts = firstName.split(/\s+/);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        }

        studentMap[sKey] = {
          student_id: sid,
          prefix: prefix,
          first_name: firstName || full || "นักเรียน",
          last_name: lastName,
          previous_name: "",
          grade_level: "ม.1",
          academic_year: docObj.academic_year || "2569",
          doc_number: docObj.doc_number || "001",
          set_number: docObj.book_number || "01",
          status: "ปกติ",
          updated_at: timestamp
        };
        hasStudentsAdded = true;
      }

      var bNum = String(docObj.book_number || "01").trim();
      var aYear = String(docObj.academic_year || "2569").trim();
      var typeObj = cleanDocTypeGAS(docObj.doc_type_code || "ปพ.1");
      var bCode = "BOOK-" + typeObj.code + "-" + aYear + "-" + bNum;
      var bKey = bCode.toLowerCase();
      var nyKey = (bNum + "_" + aYear).toLowerCase();

      if (!bookMap[bKey] && !bookByNumberYear[nyKey]) {
        var newBk = {
          book_code: bCode,
          doc_type_code: typeObj.name,
          academic_year: aYear,
          book_number: bNum,
          start_no: "001",
          end_no: "050",
          item_count: 50,
          location_code: docObj.location_code || "LOC-A01-01-01",
          updated_at: timestamp
        };
        bookMap[bKey] = newBk;
        bookByNumberYear[nyKey] = newBk;
        hasBooksAdded = true;
      }
    }

    // Always write back Documents, Students, and Books to keep all 3 tabs 100% in sync
    var dcRows = [["รหัสเอกสาร", "รหัสนักเรียน", "ชื่อนักเรียน", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขที่เอกสาร", "สถานะ", "Location Code", "Updated At"]];
    for (var dk in docMap) {
      var dItem = docMap[dk];
      dcRows.push([dItem.doc_code, dItem.student_id, dItem.student_name, dItem.doc_type_code, dItem.academic_year, dItem.book_number, dItem.doc_number, dItem.status, dItem.location_code, dItem.updated_at]);
    }
    var dLastRow = docsSheet.getLastRow();
    if (dLastRow > 0) {
      docsSheet.getRange(1, 1, Math.max(dLastRow, 1), 10).clearContent();
    }
    docsSheet.getRange(1, 1, dcRows.length, 10).setValues(dcRows);

    var stRows = [["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเดิม", "ระดับชั้น", "ปีการศึกษา", "เลขที่ใบปพ.", "ชุดที่", "สถานะ", "Updated At"]];
    for (var sk in studentMap) {
      var sItem = studentMap[sk];
      stRows.push([sItem.student_id, sItem.prefix, sItem.first_name, sItem.last_name, sItem.previous_name, sItem.grade_level, sItem.academic_year, sItem.doc_number, sItem.set_number, sItem.status, sItem.updated_at]);
    }
    var sLastRow = studentsSheet.getLastRow();
    if (sLastRow > 0) {
      studentsSheet.getRange(1, 1, Math.max(sLastRow, 1), 11).clearContent();
    }
    studentsSheet.getRange(1, 1, stRows.length, 11).setValues(stRows);

    var bkRows = [["รหัสเล่ม", "ประเภท ปพ.", "ปีการศึกษา", "เล่มที่", "เลขเริ่มต้น", "เลขสิ้นสุด", "จำนวนรายการ", "Location Code", "Updated At"]];
    for (var bk in bookMap) {
      var bItem = bookMap[bk];
      bkRows.push([bItem.book_code, bItem.doc_type_code, bItem.academic_year, bItem.book_number, bItem.start_no, bItem.end_no, bItem.item_count, bItem.location_code, bItem.updated_at]);
    }
    var bLastRow = booksSheet.getLastRow();
    if (bLastRow > 0) {
      booksSheet.getRange(1, 1, Math.max(bLastRow, 1), 9).clearContent();
    }
    booksSheet.getRange(1, 1, bkRows.length, 9).setValues(bkRows);

  } catch (err) {
    Logger.log("autoCrossLinkSheets error: " + err.toString());
  }
}

/**
 * Batch Read All Sheet Data (High-Performance Targeted Fetch)
 */
function getAllSheetData(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var result = {};
  var targetSheets = ["Students", "Documents", "Books", "Loans", "Storage_Locations", "Users", "Settings"];
  
  for (var i = 0; i < targetSheets.length; i++) {
    var name = targetSheets[i];
    var sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() > 0) {
      result[name] = sh.getDataRange().getValues();
    } else {
      result[name] = [];
    }
  }
  return result;
}

