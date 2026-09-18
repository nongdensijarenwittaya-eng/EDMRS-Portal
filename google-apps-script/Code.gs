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
      .addToUi();
  } catch (e) {}
  initSheetsStructure();
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
      var masterDeletedKeys = getStoredDeletedKeys(ss);
      recordDeletedKeys(ss, deletedKeys, masterDeletedKeys);

      if (contents.users !== undefined) syncUsersSheet(ss, contents.users || [], deletedKeys.users || [], masterDeletedKeys.users || {});
      if (contents.students !== undefined) syncStudentsSheet(ss, contents.students || [], deletedKeys.students || [], masterDeletedKeys.students || {});
      if (contents.documents !== undefined) syncDocumentsSheet(ss, contents.documents || [], deletedKeys.documents || [], masterDeletedKeys.documents || {});
      if (contents.books !== undefined) syncBooksSheet(ss, contents.books || [], deletedKeys.books || [], masterDeletedKeys.books || {});
      if (contents.loans !== undefined) syncLoansSheet(ss, contents.loans || [], deletedKeys.loans || [], masterDeletedKeys.loans || {});
      if (contents.storage_locations !== undefined) syncStorageLocationsSheet(ss, contents.storage_locations || [], deletedKeys.storage_locations || [], masterDeletedKeys.storage_locations || {});
      if (contents.settings !== undefined) syncSettingsSheet(ss, contents.settings || {});

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
 * Sync Students Sheet
 */
function syncStudentsSheet(ss, students, deletedKeys, masterDeletedMap) {
  var sheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  masterDeletedMap = masterDeletedMap || {};
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) masterDeletedMap[String(deletedKeys[i]).trim().toLowerCase()] = true;
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
      if (sid && sid.toLowerCase() !== "รหัสนักเรียน" && !masterDeletedMap[sid.toLowerCase()]) {
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
          updated_at: String(row[10] || "")
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
        if (masterDeletedMap[key] && (!s.updated_at || !studentMap[key])) continue;

        var incomingTime = s.updated_at || new Date().toISOString();
        var existing = studentMap[key];

        if (!existing || !existing.updated_at || incomingTime >= existing.updated_at) {
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
            updated_at: incomingTime
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
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) masterDeletedMap[String(deletedKeys[i]).trim().toLowerCase()] = true;
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
      if (dcode && dcode.toLowerCase() !== "รหัสเอกสาร" && !masterDeletedMap[dcode.toLowerCase()]) {
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
          updated_at: String(row[9] || "")
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
        if (masterDeletedMap[key] && (!d.updated_at || !docMap[key])) continue;

        var incomingTime = d.updated_at || new Date().toISOString();
        var existing = docMap[key];

        if (!existing || !existing.updated_at || incomingTime >= existing.updated_at) {
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
            updated_at: incomingTime
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
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) masterDeletedMap[String(deletedKeys[i]).trim().toLowerCase()] = true;
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
      if (bcode && bcode.toLowerCase() !== "รหัสเล่ม" && !masterDeletedMap[bcode.toLowerCase()]) {
        bookMap[bcode.toLowerCase()] = {
          book_code: bcode,
          doc_type_code: String(row[1] || ""),
          academic_year: String(row[2] || ""),
          book_number: String(row[3] || ""),
          start_no: String(row[4] || ""),
          end_no: String(row[5] || ""),
          item_count: Number(row[6] || 0),
          location_code: String(row[7] || ""),
          updated_at: String(row[8] || "")
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
        if (masterDeletedMap[key] && (!b.updated_at || !bookMap[key])) continue;

        var incomingTime = b.updated_at || new Date().toISOString();
        var existing = bookMap[key];

        if (!existing || !existing.updated_at || incomingTime >= existing.updated_at) {
          bookMap[key] = {
            book_code: bcode,
            doc_type_code: String(b.doc_type_code || (existing ? existing.doc_type_code : "")),
            academic_year: String(b.academic_year || (existing ? existing.academic_year : "")),
            book_number: String(b.book_number || (existing ? existing.book_number : "")),
            start_no: String(b.start_no || (existing ? existing.start_no : "")),
            end_no: String(b.end_no || (existing ? existing.end_no : "")),
            item_count: Number(b.item_count !== undefined ? b.item_count : (existing ? existing.item_count : 0)),
            location_code: String(b.location_code || (existing ? existing.location_code : "")),
            updated_at: incomingTime
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
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) masterDeletedMap[String(deletedKeys[i]).trim().toLowerCase()] = true;
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
      if (lcode && lcode.toLowerCase() !== "เลขที่คำขอ" && !masterDeletedMap[lcode.toLowerCase()]) {
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
          updated_at: String(row[10] || "")
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
        if (masterDeletedMap[key] && (!l.updated_at || !loanMap[key])) continue;

        var statusText = (l.status === 'returned' || l.status === 'completed') ? 'รับเอกสารแล้ว' : 'รอดำเนินการออกสำเนา';
        var incomingTime = l.updated_at || new Date().toISOString();
        var existing = loanMap[key];

        if (!existing || !existing.updated_at || incomingTime >= existing.updated_at) {
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
            updated_at: incomingTime
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
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) masterDeletedMap[String(deletedKeys[i]).trim().toLowerCase()] = true;
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
      if (code && code.toLowerCase() !== "location code" && !masterDeletedMap[code.toLowerCase()]) {
        locMap[code.toLowerCase()] = {
          code: code,
          building: String(row[1] || ""),
          room: String(row[2] || ""),
          cabinet: String(row[3] || ""),
          shelf: String(row[4] || ""),
          folder: String(row[5] || ""),
          description: String(row[6] || ""),
          updated_at: String(row[7] || "")
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
        if (masterDeletedMap[key] && (!l.updated_at || !locMap[key])) continue;

        var incomingTime = l.updated_at || new Date().toISOString();
        var existing = locMap[key];

        if (!existing || !existing.updated_at || incomingTime >= existing.updated_at) {
          locMap[key] = {
            code: code,
            building: String(l.building || (existing ? existing.building : "")),
            room: String(l.room || (existing ? existing.room : "")),
            cabinet: String(l.cabinet || (existing ? existing.cabinet : "")),
            shelf: String(l.shelf || (existing ? existing.shelf : "")),
            folder: String(l.folder || (existing ? existing.folder : "")),
            description: String(l.description || (existing ? existing.description : "")),
            updated_at: incomingTime
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
  if (Array.isArray(deletedKeys)) {
    for (var i = 0; i < deletedKeys.length; i++) {
      if (deletedKeys[i]) masterDeletedMap[String(deletedKeys[i]).trim().toLowerCase()] = true;
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
      if (uname && uname.toLowerCase() !== "ชื่อผู้ใช้งาน (username)" && !masterDeletedMap[uname.toLowerCase()]) {
        userMap[uname.toLowerCase()] = {
          username: uname,
          title: String(row[1] || ""),
          first_name: String(row[2] || ""),
          last_name: String(row[3] || ""),
          role_code: String(row[4] || "staff"),
          email: String(row[5] || ""),
          created_at: String(row[6] || ""),
          password_hash: String(row[7] || "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"),
          updated_at: String(row[8] || "")
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
        if (masterDeletedMap[key] && (!u.updated_at || !userMap[key])) continue;

        var incomingTime = u.updated_at || new Date().toISOString();
        var existing = userMap[key];

        if (!existing || !existing.updated_at || incomingTime >= existing.updated_at) {
          userMap[key] = {
            username: uname,
            title: String(u.title || (existing ? existing.title : "")),
            first_name: String(u.first_name || (existing ? existing.first_name : "")),
            last_name: String(u.last_name || (existing ? existing.last_name : "")),
            role_code: String(u.role_code || (existing ? existing.role_code : "staff")),
            email: String(u.email || (existing ? existing.email : "")),
            created_at: String(u.created_at || (existing ? existing.created_at : "")),
            password_hash: String(u.password_hash || (existing ? existing.password_hash : "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918")),
            updated_at: incomingTime
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
