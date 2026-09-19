/* ==========================================================================
   EDMRS - Central Database Engine & API Connector (js/db.js)
   Source of Truth: Google Sheets
   Cache / Fallback: LocalStorage
   ========================================================================== */

const DB_STORAGE_KEY = 'EDMRS_RELATIONAL_DB_V3.0';

class RelationalDatabase {
  constructor() {
    this.googleSyncDisabled = false;
    this.DATA_SOURCE = {
      LOCAL: 'local',
      GOOGLE: 'google',
      USER: 'user'
    };
    this.currentSource = this.DATA_SOURCE.LOCAL;

    this.DB_STATE = {
      initialized: false,
      initializing: false,
      fetching: false,
      saving: false,
      lastFetchAt: null,
      lastSaveAt: null,
      lastSyncStatus: 'idle',
      syncMessage: '🟢 เชื่อมต่อแล้ว'
    };

    // Single Flight Promises
    this.fetchPromise = null;
    this.savePromise = null;
    this.initializationPromise = null;

    console.log('[DB][INIT] Initializing database engine...');

    this.data = {
      users: [],
      roles: [],
      permissions: [],
      role_permissions: [],
      students: [],
      document_types: [],
      documents: [],
      books: [],
      storage_locations: [],
      loans: [],
      audit_logs: [],
      academic_years: [],
      settings: {},
      notifications: [],
      deleted_keys: {
        users: [],
        students: [],
        documents: [],
        books: [],
        loans: [],
        storage_locations: []
      }
    };

    this.initLocalCache();
  }

  /**
   * Load initial structure from local cache to prevent blank UI while fetching
   */
  initLocalCache() {
    const defaultUrl = window.CONFIG ? window.CONFIG.getWebAppUrl() : '';
    const local = localStorage.getItem(DB_STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') {
          this.data = { ...this.data, ...parsed };
        }
      } catch (e) {
        console.warn('[DB][INIT] Failed to parse local storage cache:', e);
      }
    }

    if (!this.data.settings) this.data.settings = {};
    if (!this.data.settings.sheets_url || (window.CONFIG && !window.CONFIG.validateWebAppUrl(this.data.settings.sheets_url)) || (defaultUrl && this.data.settings.sheets_url !== defaultUrl)) {
      this.data.settings.sheets_url = defaultUrl;
    }
    
    this.seedRolesAndPermissions();
    if (!this.data.users || this.data.users.length === 0) this.seedUsers();
    if (!this.data.academic_years || this.data.academic_years.length === 0) this.seedAcademicYears();
    if (!this.data.document_types || this.data.document_types.length === 0) this.seedDocumentTypes();
  }

  /**
   * Test Google Sheets Web App Connection
   */
  async testGoogleSheetsConnection(url) {
    const testUrl = url || (this.data.settings && this.data.settings.sheets_url) || (window.CONFIG ? window.CONFIG.getWebAppUrl() : '');
    if (!testUrl || (window.CONFIG && !window.CONFIG.validateWebAppUrl(testUrl))) {
      return { success: false, message: 'URL Google Apps Script Web App ไม่ถูกต้อง (ต้องเริ่มต้นด้วย https://script.google.com/macros/s/ และลงท้ายด้วย /exec)' };
    }
    try {
      const separator = testUrl.includes('?') ? '&' : '?';
      const pingUrl = `${testUrl}${separator}action=ping&t=${Date.now()}`;
      const res = await fetch(pingUrl, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, message: 'HTTP 404: ไม่พบ Web App URL นี้ในระบบ Google Apps Script (กรุณาตรวจสอบว่ากดยืนยัน Deploy เป็น "Anyone/ทุกคน" หรือยัง)' };
        }
        return { success: false, message: `HTTP Error Status: ${res.status}` };
      }
      const json = await res.json();
      if (json && json.status === 'success') {
        this.googleSyncDisabled = false;
        this.DB_STATE.syncMessage = '🟢 เชื่อมต่อแล้ว';
        if (!this.data.settings) this.data.settings = {};
        this.data.settings.sheets_url = testUrl;
        this.saveLocal();
        return { success: true, message: 'เชื่อมต่อ Google Apps Script Web App สำเร็จเรียบร้อยแล้ว!' };
      }
      return { success: false, message: (json && json.message) || 'ตอบกลับจาก Google Apps Script ไม่ถูกต้อง' };
    } catch (err) {
      return { success: false, message: `ไม่สามารถเชื่อมต่อได้: ${err.message}` };
    }
  }

  /**
   * Single-flight Initialization: Runs ONCE on application launch.
   */
  async initializeDatabase() {
    console.trace("[DB][INIT] called");
    if (this.DB_STATE.initialized) {
      return Promise.resolve(this.data);
    }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      this.DB_STATE.initializing = true;
      console.log('[DB][INIT] Starting initial database sync from Google Sheets...');
      try {
        const res = await this.syncFromGoogleSheets();
        this.DB_STATE.initialized = true;
        console.log('[DB][INIT] Success: Initial database loaded');
        return res;
      } catch (err) {
        console.warn('[DB][INIT] Connection failed, falling back to local cache:', err.message);
        this.DB_STATE.initialized = true;
        return null;
      } finally {
        this.DB_STATE.initializing = false;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Single Flight HTTP GET: Fetch Data from Google Sheets
   */
  async syncFromGoogleSheets(customUrl, isSilent = false) {
    console.trace("[DB][GET] called");

    let sheetsUrl = window.CONFIG ? window.CONFIG.getWebAppUrl() : 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec';
    this.googleSyncDisabled = false;

    if (this.fetchPromise) {
      console.log('[DB][GET] Single Flight: Request already running - returning existing Promise');
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      let sheetsUrl = window.CONFIG ? window.CONFIG.getWebAppUrl() : 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec';
      console.log('[DB][GET] Fetching records from:', sheetsUrl);

      this.DB_STATE.fetching = true;
      this.DB_STATE.lastSyncStatus = 'fetching';

      if (!isSilent && window.utils && typeof window.utils.showLoadingModal === 'function') {
        window.utils.showLoadingModal('กำลังเชื่อมต่อดึงข้อมูลจาก Google Sheets...', 'ระบบกำลังโหลดข้อมูลล่าสุดเพื่อความแม่นยำ 100% (โปรดรอสักครู่)');
      }

      try {
        if (!sheetsUrl || (window.CONFIG && !window.CONFIG.validateWebAppUrl(sheetsUrl))) {
          this.googleSyncDisabled = true;
          this.DB_STATE.syncMessage = '🔴 URL ไม่ถูกต้อง: กรุณาตั้งค่า Web App URL ที่ลงท้ายด้วย /exec ในหน้าตั้งค่าระบบ';
          throw new Error('URL Google Apps Script Web App ไม่ถูกต้อง กรุณาตรวจสอบ URL ที่ลงท้ายด้วย /exec');
        }

        const separator = sheetsUrl.includes('?') ? '&' : '?';
        const fetchUrl = `${sheetsUrl}${separator}action=getData&t=${Date.now()}`;

        let res;
        try {
          res = await fetch(fetchUrl, {
            method: 'GET',
            credentials: 'omit',
            cache: 'no-store'
          });
        } catch (netErr) {
          throw new Error('ไม่สามารถเชื่อมต่อเครือข่ายได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        if (!res.ok) {
          if (res.status === 404) {
            if (window.CONFIG && window.CONFIG.GOOGLE_APPS_SCRIPT_URL && sheetsUrl !== window.CONFIG.GOOGLE_APPS_SCRIPT_URL) {
              console.warn('[DB][GET] Stored URL returned 404. Falling back to default CONFIG URL...');
              this.data.settings.sheets_url = window.CONFIG.GOOGLE_APPS_SCRIPT_URL;
              this.saveLocal();
              this.fetchPromise = null;
              this.googleSyncDisabled = false;
              return await this.syncFromGoogleSheets(window.CONFIG.GOOGLE_APPS_SCRIPT_URL, isSilent);
            }

            this.googleSyncDisabled = true;
            this.DB_STATE.syncMessage = '🔴 เกิดข้อผิดพลาด 404: Web App URL ไม่ถูกต้องหรือยังไม่ได้ Deploy เป็น "Anyone"';
            throw new Error('Google Apps Script Web App ตอบกลับ HTTP 404 — กรุณาตรวจสอบว่าใน Google Apps Script ได้กด Deploy เลือก Who has access = "Anyone (ทุกคน)" เรียบร้อยแล้วหรือยัง');
          } else if (res.status === 401 || res.status === 403) {
            throw new Error('ไม่มีสิทธิ์เข้าถึง Google Sheets (Permission Denied)');
          } else if (res.status === 429) {
            throw new Error('มีการส่งคำร้องขอถี่เกินไป (Too Many Requests)');
          } else if (res.status >= 500) {
            throw new Error('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ Google Apps Script (HTTP 500)');
          }
          throw new Error(`HTTP Error Status: ${res.status}`);
        }

        let json;
        try {
          json = await res.json();
        } catch (e) {
          throw new Error('ตอบกลับจาก Google Apps Script ไม่ใช่รูปแบบ JSON กรุณาตรวจสอบการ Re-deploy สคริปต์อีกครั้ง');
        }

        if (json.status !== 'success' || !json.data) {
          throw new Error(json.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้');
        }

        this.googleSyncDisabled = false;
        this.DB_STATE.syncMessage = '🟢 เชื่อมต่อแล้ว';
        this.currentSource = this.DATA_SOURCE.GOOGLE;

        const hasChanges = this.applySheetData(json.data);

        const studentCount = (this.data.students || []).length;
        const docCount = (this.data.documents || []).length;
        const bookCount = (this.data.books || []).length;

        this.DB_STATE.lastFetchAt = new Date().toLocaleString('th-TH');
        this.DB_STATE.lastSyncStatus = 'success';
        console.log(`[DB][GET] Success: Fetched ${studentCount} students, ${docCount} documents, ${bookCount} books (hasChanges=${hasChanges})`);

        if (hasChanges) {
          // Auto push cross-linked documents and books to Google Sheets if missing records were auto-created
          this.syncToGoogleSheets(null, 'sync').catch(err => console.warn('[DB][GET] Auto-push cross-linked data failed:', err.message));
        }

        if (!isSilent && window.utils && typeof window.utils.updateLoadingModalProgress === 'function') {
          window.utils.updateLoadingModalProgress(100, 'โหลดข้อมูลสำเร็จ!', `พร้อมใช้งาน (${studentCount} นักเรียน, ${docCount} เอกสาร)`);
        }

        return { hasChanges, studentCount, docCount, bookCount };
      } catch (fetchErr) {
        this.DB_STATE.lastSyncStatus = 'error';
        console.error('[DB][ERROR] GET failed:', fetchErr.message);
        throw fetchErr;
      } finally {
        this.DB_STATE.fetching = false;
        this.fetchPromise = null;
        if (!isSilent) {
          setTimeout(() => {
            if (window.utils && typeof window.utils.hideLoadingModal === 'function') {
              window.utils.hideLoadingModal();
            }
          }, 300);
        }
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Single Flight HTTP POST: Write Data to Google Sheets (Create / Update / Delete)
   */
  async syncToGoogleSheets(customUrl, actionName = 'sync') {
    console.trace(`[DB][${actionName.toUpperCase()}] called`);
    this.googleSyncDisabled = false;

    if (this.savePromise) {
      console.log(`[DB][${actionName.toUpperCase()}] Single Flight: Write request in progress - reusing Promise`);
      return this.savePromise;
    }

    this.savePromise = (async () => {
      const sheetsUrl = window.CONFIG ? window.CONFIG.getWebAppUrl() : 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec';
      if (!sheetsUrl || (window.CONFIG && !window.CONFIG.validateWebAppUrl(sheetsUrl))) {
        this.googleSyncDisabled = true;
        this.DB_STATE.syncMessage = '🔴 URL ไม่ถูกต้อง: กรุณาตั้งค่า Web App URL ที่ลงท้ายด้วย /exec ในหน้าตั้งค่าระบบ';
        throw new Error('URL Google Apps Script Web App ไม่ถูกต้อง กรุณาตรวจสอบ URL ที่ลงท้ายด้วย /exec');
      }

      this.DB_STATE.saving = true;
      const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      console.log(`[DB][${actionName.toUpperCase()}] Sending POST request to Google Sheets...`);

      const payload = {
        action: actionName === 'sync' ? 'sync_database' : actionName,
        requestId: requestId,
        users: this.data.users || [],
        students: this.data.students || [],
        documents: this.data.documents || [],
        books: this.data.books || [],
        loans: this.data.loans || [],
        storage_locations: this.data.storage_locations || [],
        settings: this.data.settings || {},
        deleted_keys: this.data.deleted_keys || {}
      };

      try {
        let res = await fetch(sheetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          credentials: 'omit'
        });

        if (!res.ok) {
          if (res.status === 404) {
            this.googleSyncDisabled = true;
            this.DB_STATE.syncMessage = '🔴 เกิดข้อผิดพลาด 404: Web App URL ไม่ถูกต้องหรือหมดอายุ';
            throw new Error('Google Apps Script Web App ตอบกลับ HTTP 404');
          }
          throw new Error(`HTTP Error Status: ${res.status}`);
        }

        let json;
        try {
          json = await res.json();
        } catch (e) {
          throw new Error('ตอบกลับจาก Google Apps Script ไม่ใช่รูปแบบ JSON');
        }

        if (json.status === 'error' && (json.error === 'LOCK_TIMEOUT' || String(json.message).includes('Lock Timeout') || String(json.message).includes('บันทึกข้อมูล'))) {
          throw new Error('ระบบกำลังมีการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
        }

        if (json.status !== 'success') {
          throw new Error(json.message || 'บันทึกข้อมูลลง Google Sheets ไม่สำเร็จ');
        }

        if (json.data) {
          this.applySheetData(json.data);
          this.data.deleted_keys = { users: [], students: [], documents: [], books: [], loans: [], storage_locations: [] };
          this.saveLocal();
        }

        this.DB_STATE.lastSaveAt = new Date().toLocaleString('th-TH');
        console.log(`[DB][SUCCESS] Write operation [${actionName.toUpperCase()}] completed`);
        return json;

      } catch (err) {
        console.error(`[DB][ERROR] Write operation [${actionName.toUpperCase()}] failed:`, err.message);
        throw err;
      } finally {
        this.DB_STATE.saving = false;
        this.savePromise = null;
      }
    })();

    return this.savePromise;
  }

  normalizeDocType(type) {
    const t = String(type || 'ปพ.1').trim();
    if (/^(p1|uw1|uw\.1|ปพ1|ปพ\.1)$/i.test(t)) return { code: 'ปพ1', name: 'ปพ.1' };
    if (/^(p2|uw2|uw\.2|ปพ2|ปพ\.2)$/i.test(t)) return { code: 'ปพ2', name: 'ปพ.2' };
    if (/^(p3|uw3|uw\.3|ปพ3|ปพ\.3)$/i.test(t)) return { code: 'ปพ3', name: 'ปพ.3' };
    if (/^(p7|uw7|uw\.7|ปพ7|ปพ\.7)$/i.test(t)) return { code: 'ปพ7', name: 'ปพ.7' };
    if (/^(p9|uw9|uw\.9|ปพ9|ปพ\.9)$/i.test(t)) return { code: 'ปพ9', name: 'ปพ.9' };
    const clean = t.replace(/[\.\_\-\s]/g, '').toUpperCase();
    return { code: clean || 'ปพ1', name: t || 'ปพ.1' };
  }

  /**
   * Auto Cross Link Students (หน้าแรก), Documents (หน้าสอง), and Books (หน้าสาม)
   */
  autoCrossLinkData() {
    if (!this.data) return;
    const students = this.data.students || [];
    const documents = this.data.documents || [];
    const books = this.data.books || [];

    const deletedStudents = ((this.data.deleted_keys && this.data.deleted_keys.students) || []).map(k => String(k).toLowerCase());
    const deletedDocuments = ((this.data.deleted_keys && this.data.deleted_keys.documents) || []).map(k => String(k).toLowerCase());
    const deletedBooks = ((this.data.deleted_keys && this.data.deleted_keys.books) || []).map(k => String(k).toLowerCase());

    const studentMap = new Map();
    students.forEach(s => {
      if (s.student_id) studentMap.set(String(s.student_id).trim().toLowerCase(), s);
    });

    const docMapBySid = new Map();
    const docMapByCode = new Map();
    documents.forEach(d => {
      if (d.doc_code) docMapByCode.set(String(d.doc_code).trim().toLowerCase(), d);
      if (d.student_id) docMapBySid.set(String(d.student_id).trim().toLowerCase(), d);
    });

    const bookMap = new Map();
    const bookByNumberYear = new Map();
    books.forEach(b => {
      const codeKey = String(b.book_code || '').trim().toLowerCase();
      if (codeKey) bookMap.set(codeKey, b);
      const nyKey = `${String(b.book_number || '').trim()}_${String(b.academic_year || '').trim()}`.toLowerCase();
      if (nyKey && !bookByNumberYear.has(nyKey)) {
        bookByNumberYear.set(nyKey, b);
      }
    });

    let added = false;

    // Cross Link 1: From Students (หน้าแรก) -> Auto add/sync missing Documents (หน้าสอง) & Books (หน้าสาม)
    students.forEach(s => {
      const sid = String(s.student_id || '').trim();
      if (!sid) return;
      const sKey = sid.toLowerCase();
      if (deletedStudents.includes(sKey)) return;

      const fullName = `${s.prefix || ''}${s.first_name || ''} ${s.last_name || ''}`.trim();
      const setNum = String(s.set_number || s.book_number || '01').trim();
      const docNum = String(s.doc_number || '001').trim();
      const year = String(s.academic_year || '2569').trim();

      let docTypeCode = 'ปพ.1';
      let locationCode = 'LOC-A01-01-01';

      let existingBook = null;
      if (s.book_code) {
        existingBook = bookMap.get(String(s.book_code).toLowerCase());
      }
      if (!existingBook) {
        const nyKey = `${setNum}_${year}`.toLowerCase();
        existingBook = bookByNumberYear.get(nyKey);
      }
      if (existingBook) {
        docTypeCode = existingBook.doc_type_code || 'ปพ.1';
        locationCode = existingBook.location_code || 'LOC-A01-01-01';
      }

      const typeInfo = this.normalizeDocType(docTypeCode);
      const docCode = `DOC-${typeInfo.code}-${sid}`;
      const dKey = docCode.toLowerCase();

      let existingDoc = docMapBySid.get(sKey) || docMapByCode.get(dKey);
      const targetBookCode = existingBook ? existingBook.book_code : (s.book_code || `BOOK-${typeInfo.code}-${year}-${setNum}`);
      if (existingDoc) {
        if (existingDoc.student_name !== fullName || existingDoc.doc_number !== docNum || existingDoc.book_number !== setNum || existingDoc.academic_year !== year || existingDoc.book_code !== targetBookCode) {
          existingDoc.student_name = fullName;
          existingDoc.doc_number = docNum;
          existingDoc.book_number = setNum;
          existingDoc.academic_year = year;
          existingDoc.book_code = targetBookCode;
          existingDoc.updated_at = new Date().toISOString();
          added = true;
        }
      } else if (!deletedDocuments.includes(dKey)) {
        const newDoc = {
          id: documents.length + 1,
          doc_code: docCode,
          student_id: sid,
          student_name: fullName,
          doc_type_code: docTypeCode,
          academic_year: year,
          book_number: setNum,
          doc_number: docNum,
          book_code: targetBookCode,
          status: 'stored',
          location_code: locationCode,
          updated_at: new Date().toISOString()
        };
        documents.push(newDoc);
        docMapBySid.set(sKey, newDoc);
        docMapByCode.set(dKey, newDoc);
        added = true;
      }

      // Check Book deduplicating by book_number + academic_year OR book_code
      const bCode = existingBook ? existingBook.book_code : (s.book_code || `BOOK-${typeInfo.code}-${year}-${setNum}`);
      const bKey = bCode.toLowerCase();
      const nyKey = `${setNum}_${year}`.toLowerCase();

      if (!bookMap.has(bKey) && !bookByNumberYear.has(nyKey) && !deletedBooks.includes(bKey)) {
        const newBk = {
          id: books.length + 1,
          book_code: bCode,
          doc_type_code: typeInfo.name,
          academic_year: year,
          book_number: setNum,
          start_no: '001',
          end_no: '050',
          item_count: 50,
          location_code: locationCode,
          updated_at: new Date().toISOString()
        };
        books.push(newBk);
        bookMap.set(bKey, newBk);
        bookByNumberYear.set(nyKey, newBk);
        added = true;
      }
    });

    // Cross Link 2: From Documents (หน้าสอง) -> Auto add missing Students (หน้าแรก) & missing Books (หน้าสาม)
    documents.forEach(d => {
      const sid = String(d.student_id || '').trim();
      const sKey = sid.toLowerCase();
      if (sid && !studentMap.has(sKey) && !deletedStudents.includes(sKey)) {
        const full = d.student_name || '';
        let prefix = '';
        let firstName = full;
        let lastName = '';

        if (full.startsWith('นาย')) { prefix = 'นาย'; firstName = full.replace('นาย', '').trim(); }
        else if (full.startsWith('นางสาว')) { prefix = 'นางสาว'; firstName = full.replace('นางสาว', '').trim(); }
        else if (full.startsWith('นาง')) { prefix = 'นาง'; firstName = full.replace('นาง', '').trim(); }
        else if (full.startsWith('เด็กชาย')) { prefix = 'เด็กชาย'; firstName = full.replace('เด็กชาย', '').trim(); }
        else if (full.startsWith('เด็กหญิง')) { prefix = 'เด็กหญิง'; firstName = full.replace('เด็กหญิง', '').trim(); }

        const parts = firstName.split(/\s+/);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        }

        const newSt = {
          id: students.length + 1,
          student_id: sid,
          prefix: prefix,
          first_name: firstName || full || 'นักเรียน',
          last_name: lastName,
          previous_name: '',
          grade_level: 'ม.1',
          academic_year: d.academic_year || '2569',
          doc_number: d.doc_number || '001',
          set_number: d.book_number || '01',
          status: 'ปกติ',
          updated_at: new Date().toISOString()
        };
        students.push(newSt);
        studentMap.set(sKey, newSt);
        added = true;
      }

      // Check Book deduplicating by book_number + academic_year OR book_code
      const bNum = String(d.book_number || '01').trim();
      const dType = d.doc_type_code || 'ปพ.1';
      const aYear = String(d.academic_year || '2569').trim();
      const typeInfo = this.normalizeDocType(dType);
      const bCode = d.book_code || `BOOK-${typeInfo.code}-${aYear}-${bNum}`;
      const bKey = bCode.toLowerCase();
      const nyKey = `${bNum}_${aYear}`.toLowerCase();

      if (!bookMap.has(bKey) && !bookByNumberYear.has(nyKey) && !deletedBooks.includes(bKey)) {
        const newBk = {
          id: books.length + 1,
          book_code: bCode,
          doc_type_code: typeInfo.name,
          academic_year: aYear,
          book_number: bNum,
          start_no: '001',
          end_no: '050',
          item_count: 50,
          location_code: d.location_code || 'LOC-A01-01-01',
          updated_at: new Date().toISOString()
        };
        books.push(newBk);
        bookMap.set(bKey, newBk);
        bookByNumberYear.set(nyKey, newBk);
        added = true;
      }
    });

    this.data.students = students;
    this.data.documents = documents;
    this.data.books = books;
    return added;
  }

  /**
   * Save Local Storage Cache
   */
  saveLocal() {
    this.cleanupDeletedKeys();
    this.autoCrossLinkData();
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[DB] Failed to write LocalStorage cache:', e);
    }
  }

  /**
   * Legacy Save Wrapper for compatibility
   */
  save(autoSyncSheets = true) {
    this.saveLocal();
    if (autoSyncSheets) {
      this.syncToGoogleSheets().catch(err => console.warn('[DB] Background sync failed:', err.message));
    }
  }

  /**
   * Helper: Smart merge local items with parsed sheet items to prevent overwriting local additions
   */
  mergeEntityList(localList, parsedList, deletedKeys, keyField = 'id') {
    const map = new Map();
    const cleanDeleted = (deletedKeys || []).map(k => String(k).toLowerCase());

    // 1. Add items from Google Sheets
    (parsedList || []).forEach(item => {
      if (!item) return;
      const k = String(item[keyField] || '').trim().toLowerCase();
      if (k && !cleanDeleted.includes(k)) {
        map.set(k, item);
      }
    });

    // 2. Merge items from Local state (preserving local additions & newer timestamp edits)
    (localList || []).forEach(item => {
      if (!item) return;
      const k = String(item[keyField] || '').trim().toLowerCase();
      if (!k || cleanDeleted.includes(k)) return;

      const existing = map.get(k);
      if (!existing) {
        map.set(k, item);
      } else {
        const localTime = Date.parse(item.updated_at || '') || 0;
        const sheetTime = Date.parse(existing.updated_at || '') || 0;
        if (localTime > sheetTime) {
          map.set(k, item);
        }
      }
    });

    return Array.from(map.values());
  }

  /**
   * Apply Parsed Sheet Data into State & Detect Changes
   */
  applySheetData(sheetData) {
    if (!sheetData || typeof sheetData !== 'object') return false;

    let hasChanges = false;
    if (!this.data.deleted_keys) {
      this.data.deleted_keys = { users: [], students: [], documents: [], books: [], loans: [], storage_locations: [] };
    }

    const deletedUsers = (this.data.deleted_keys.users || []).map(k => String(k).toLowerCase());
    const deletedStudents = (this.data.deleted_keys.students || []).map(k => String(k).toLowerCase());
    const deletedDocs = (this.data.deleted_keys.documents || []).map(k => String(k).toLowerCase());
    const deletedBooks = (this.data.deleted_keys.books || []).map(k => String(k).toLowerCase());
    const deletedLoans = (this.data.deleted_keys.loans || []).map(k => String(k).toLowerCase());
    const deletedLocs = (this.data.deleted_keys.storage_locations || []).map(k => String(k).toLowerCase());

    const isDifferent = (oldArr, newArr) => JSON.stringify(oldArr || []) !== JSON.stringify(newArr || []);

    // 1. Students
    if (Array.isArray(sheetData.Students)) {
      const rows = sheetData.Students.length > 1 ? sheetData.Students.slice(1) : [];
      const parsedStudents = rows.map((row, idx) => ({
        id: idx + 1,
        student_id: String(row[0] || '').trim(),
        prefix: String(row[1] || '').trim(),
        first_name: String(row[2] || '').trim(),
        last_name: String(row[3] || '').trim(),
        previous_name: String(row[4] || '').trim(),
        grade_level: String(row[5] || '').trim(),
        academic_year: String(row[6] || '').trim(),
        doc_number: String(row[7] || '').trim(),
        set_number: String(row[8] || '').trim(),
        status: String(row[9] || 'ปกติ').trim(),
        updated_at: String(row[10] || '').trim()
      })).filter(s => s.student_id && !deletedStudents.includes(s.student_id.toLowerCase()));

      const merged = this.mergeEntityList(this.data.students, parsedStudents, deletedStudents, 'student_id');
      if (isDifferent(this.data.students, merged)) {
        this.data.students = merged;
        hasChanges = true;
      }
    }

    // 2. Documents
    if (Array.isArray(sheetData.Documents)) {
      const rows = sheetData.Documents.length > 1 ? sheetData.Documents.slice(1) : [];
      const parsedDocs = rows.map((row, idx) => {
        const dcode = String(row[0] || '').trim();
        const docNum = String(row[6] || '').trim();
        const docTypeCode = String(row[3] || 'ปพ.1').trim();
        const acYear = String(row[4] || '').trim();
        const bookNum = String(row[5] || '').trim();
        const code = dcode || (docNum ? `DOC-${docTypeCode.replace('.', '')}-${acYear || '2565'}-${bookNum || '01'}-${docNum}` : '');

        return {
          id: idx + 1,
          doc_code: code,
          student_id: String(row[1] || '').trim(),
          student_name: String(row[2] || '').trim(),
          doc_type_code: docTypeCode,
          academic_year: acYear,
          book_number: bookNum,
          doc_number: docNum,
          status: String(row[7] || 'stored').trim(),
          location_code: String(row[8] || '').trim(),
          updated_at: String(row[9] || '').trim()
        };
      }).filter(d => d.doc_code && !deletedDocs.includes(d.doc_code.toLowerCase()));

      const merged = this.mergeEntityList(this.data.documents, parsedDocs, deletedDocs, 'doc_code');
      if (isDifferent(this.data.documents, merged)) {
        this.data.documents = merged;
        hasChanges = true;
      }
    }

    // 3. Books
    if (Array.isArray(sheetData.Books)) {
      const rows = sheetData.Books.length > 1 ? sheetData.Books.slice(1) : [];
      const parsedBooks = rows.map((row, idx) => ({
        id: idx + 1,
        book_code: String(row[0] || '').trim(),
        doc_type_code: String(row[1] || '').trim(),
        academic_year: String(row[2] || '').trim(),
        book_number: String(row[3] || '').trim(),
        start_no: String(row[4] || '').trim(),
        end_no: String(row[5] || '').trim(),
        item_count: Number(row[6] || 0),
        location_code: String(row[7] || '').trim(),
        updated_at: String(row[8] || '').trim()
      })).filter(b => b.book_code && !deletedBooks.includes(b.book_code.toLowerCase()));

      const merged = this.mergeEntityList(this.data.books, parsedBooks, deletedBooks, 'book_code');
      if (isDifferent(this.data.books, merged)) {
        this.data.books = merged;
        hasChanges = true;
      }
    }

    // 4. Loans
    if (Array.isArray(sheetData.Loans)) {
      const rows = sheetData.Loans.length > 1 ? sheetData.Loans.slice(1) : [];
      const parsedLoans = rows.map((row, idx) => ({
        id: idx + 1,
        loan_code: String(row[0] || '').trim(),
        student_id: String(row[1] || '').trim(),
        student_name: String(row[2] || '').trim(),
        doc_type_code: String(row[3] || 'ปพ.1').trim(),
        borrower_name: String(row[4] || '').trim(),
        borrower_dept: String(row[5] || '').trim(),
        loan_date: String(row[6] || '').trim(),
        return_due_date: String(row[7] || '').trim(),
        reason: String(row[8] || '').trim(),
        status: (String(row[9] || '').includes('รับ') || String(row[9] || '').includes('returned')) ? 'returned' : 'pending',
        updated_at: String(row[10] || '').trim()
      })).filter(l => l.loan_code && !deletedLoans.includes(l.loan_code.toLowerCase()));

      const merged = this.mergeEntityList(this.data.loans, parsedLoans, deletedLoans, 'loan_code');
      if (isDifferent(this.data.loans, merged)) {
        this.data.loans = merged;
        hasChanges = true;
      }
    }

    // 5. Storage_Locations
    if (Array.isArray(sheetData.Storage_Locations)) {
      const rows = sheetData.Storage_Locations.length > 1 ? sheetData.Storage_Locations.slice(1) : [];
      const parsedLocs = rows.map((row, idx) => ({
        id: idx + 1,
        code: String(row[0] || '').trim(),
        building: String(row[1] || '').trim(),
        room: String(row[2] || '').trim(),
        cabinet: String(row[3] || '').trim(),
        shelf: String(row[4] || '').trim(),
        folder: String(row[5] || '').trim(),
        description: String(row[6] || '').trim(),
        updated_at: String(row[7] || '').trim()
      })).filter(l => l.code && !deletedLocs.includes(l.code.toLowerCase()));

      const merged = this.mergeEntityList(this.data.storage_locations, parsedLocs, deletedLocs, 'code');
      if (isDifferent(this.data.storage_locations, merged)) {
        this.data.storage_locations = merged;
        hasChanges = true;
      }
    }

    // 6. Users
    if (Array.isArray(sheetData.Users)) {
      const rows = sheetData.Users.length > 1 ? sheetData.Users.slice(1) : [];
      const parsedUsers = rows.map((row, idx) => ({
        id: idx + 1,
        username: String(row[0] || '').trim(),
        title: String(row[1] || '').trim(),
        first_name: String(row[2] || '').trim(),
        last_name: String(row[3] || '').trim(),
        role_code: String(row[4] || 'staff').trim(),
        email: String(row[5] || '').trim(),
        created_at: String(row[6] || '').trim(),
        password_hash: String(row[7] || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918').trim(),
        updated_at: String(row[8] || '').trim()
      })).filter(u => u.username && !deletedUsers.includes(u.username.toLowerCase()));

      const merged = this.mergeEntityList(this.data.users, parsedUsers, deletedUsers, 'username');
      if (isDifferent(this.data.users, merged)) {
        this.data.users = merged;
        hasChanges = true;
      }
    }

    // 7. Settings
    const settingsRows = sheetData.Settings || sheetData.settings;
    if (Array.isArray(settingsRows) && settingsRows.length > 1) {
      const parsedSettings = { ...this.data.settings };
      settingsRows.slice(1).forEach(row => {
        const key = String(row[0] || '').trim();
        const val = String(row[1] || '').trim();
        if (key) parsedSettings[key] = val;
      });
      if (isDifferent(this.data.settings, parsedSettings)) {
        this.data.settings = parsedSettings;
        hasChanges = true;
      }
    }

    const crossLinked = this.autoCrossLinkData();
    if (hasChanges || crossLinked) {
      this.saveLocal();
      hasChanges = true;
    }
    return hasChanges;
  }

  /**
   * Clean up Deleted Keys
   */
  cleanupDeletedKeys() {
    if (!this.data.deleted_keys) {
      this.data.deleted_keys = { users: [], students: [], documents: [], books: [], loans: [], storage_locations: [] };
    }
  }

  /**
   * Global Search (Pure In-Memory Filter)
   */
  globalSearch(query) {
    if (!query || typeof query !== 'string') return { students: [], documents: [], books: [], loans: [], locations: [] };
    const q = query.toLowerCase().trim();
    if (!q) return { students: [], documents: [], books: [], loans: [], locations: [] };

    const students = (this.data.students || []).filter(s =>
      String(s.student_id || '').toLowerCase().includes(q) ||
      String(s.first_name || '').toLowerCase().includes(q) ||
      String(s.last_name || '').toLowerCase().includes(q) ||
      `${s.prefix || ''}${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(q)
    );

    const documents = (this.data.documents || []).filter(d =>
      String(d.doc_code || '').toLowerCase().includes(q) ||
      String(d.student_id || '').toLowerCase().includes(q) ||
      String(d.student_name || '').toLowerCase().includes(q) ||
      String(d.doc_number || '').toLowerCase().includes(q) ||
      String(d.location_code || '').toLowerCase().includes(q)
    );

    const books = (this.data.books || []).filter(b =>
      String(b.book_code || '').toLowerCase().includes(q) ||
      String(b.book_number || '').toLowerCase().includes(q) ||
      String(b.location_code || '').toLowerCase().includes(q)
    );

    const loans = (this.data.loans || []).filter(l =>
      String(l.loan_code || '').toLowerCase().includes(q) ||
      String(l.student_id || '').toLowerCase().includes(q) ||
      String(l.student_name || '').toLowerCase().includes(q) ||
      String(l.borrower_name || '').toLowerCase().includes(q)
    );

    const locations = (this.data.storage_locations || []).filter(loc =>
      String(loc.code || '').toLowerCase().includes(q) ||
      String(loc.building || '').toLowerCase().includes(q) ||
      String(loc.room || '').toLowerCase().includes(q) ||
      String(loc.cabinet || '').toLowerCase().includes(q)
    );

    return { students, documents, books, loans, locations };
  }

  // ==========================================
  // In-Memory Search & Query Accessors
  // ==========================================
  getStudents(filters = {}) {
    let list = this.data.students || [];
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      list = list.filter(s =>
        String(s.student_id || '').toLowerCase().includes(q) ||
        String(s.first_name || '').toLowerCase().includes(q) ||
        String(s.last_name || '').toLowerCase().includes(q) ||
        String(s.doc_number || '').toLowerCase().includes(q) ||
        `${s.prefix || ''}${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(q)
      );
    }
    if (filters.academic_year) {
      list = list.filter(s => String(s.academic_year) === String(filters.academic_year));
    }
    if (filters.grade_level) {
      list = list.filter(s => String(s.grade_level) === String(filters.grade_level));
    }
    return [...list].sort((a, b) => {
      const idA = String(a.student_id || '').trim();
      const idB = String(b.student_id || '').trim();
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  getStudentById(id) {
    return (this.data.students || []).find(s => String(s.student_id) === String(id));
  }

  getDocuments(filters = {}) {
    let list = this.data.documents || [];
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      list = list.filter(d =>
        String(d.doc_code || '').toLowerCase().includes(q) ||
        String(d.student_id || '').toLowerCase().includes(q) ||
        String(d.student_name || '').toLowerCase().includes(q) ||
        String(d.doc_number || '').toLowerCase().includes(q)
      );
    }
    if (filters.book_code) {
      const targetBookCode = String(filters.book_code).trim().toLowerCase();
      const targetBook = (this.data.books || []).find(b => String(b.book_code || '').trim().toLowerCase() === targetBookCode);

      list = list.filter(d => {
        const dBookCode = String(d.book_code || '').trim().toLowerCase();
        if (dBookCode && dBookCode === targetBookCode) return true;

        if (targetBook) {
          const bNum = String(targetBook.book_number || '').trim();
          const aYear = String(targetBook.academic_year || '').trim();
          const dNum = String(d.book_number || d.set_number || '').trim();
          const dYear = String(d.academic_year || '').trim();

          if (bNum && aYear && dNum === bNum && dYear === aYear) {
            return true;
          }
        }
        return false;
      });
    }
    if (filters.doc_type_code) {
      list = list.filter(d => String(d.doc_type_code) === String(filters.doc_type_code));
    }
    if (filters.academic_year) {
      list = list.filter(d => String(d.academic_year) === String(filters.academic_year));
    }
    return [...list].sort((a, b) => {
      const idA = String(a.student_id || a.doc_number || '').trim();
      const idB = String(b.student_id || b.doc_number || '').trim();
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  getBooks(filters = {}) {
    let list = this.data.books || [];
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      list = list.filter(b =>
        String(b.book_code || '').toLowerCase().includes(q) ||
        String(b.doc_type_code || '').toLowerCase().includes(q) ||
        String(b.academic_year || '').toLowerCase().includes(q) ||
        String(b.book_number || '').toLowerCase().includes(q) ||
        String(b.location_code || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  getLoans(filters = {}) {
    let list = this.data.loans || [];
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      list = list.filter(l =>
        String(l.loan_code || '').toLowerCase().includes(q) ||
        String(l.student_id || '').toLowerCase().includes(q) ||
        String(l.student_name || '').toLowerCase().includes(q) ||
        String(l.borrower_name || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const idA = String(a.student_id || '').trim();
      const idB = String(b.student_id || '').trim();
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  getLocations(filters = {}) {
    let list = this.data.storage_locations || [];
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      list = list.filter(l =>
        String(l.code || '').toLowerCase().includes(q) ||
        String(l.building || '').toLowerCase().includes(q) ||
        String(l.room || '').toLowerCase().includes(q) ||
        String(l.cabinet || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  getUsers(filters = {}) {
    let list = this.data.users || [];
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      list = list.filter(u =>
        String(u.username || '').toLowerCase().includes(q) ||
        String(u.first_name || '').toLowerCase().includes(q) ||
        String(u.last_name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  // ==========================================
  // Explicit CRUD Methods with Single-Flight Sync
  // ==========================================

  /**
   * Helper: Automatically creates or updates a linked Document record whenever a Student is added/edited
   */
  ensureStudentDocumentLinked(studentData) {
    if (!studentData || !studentData.student_id) return;
    const sid = String(studentData.student_id).trim();
    const fullName = `${studentData.prefix || ''}${studentData.first_name || ''} ${studentData.last_name || ''}`.trim();
    const setNum = String(studentData.set_number || studentData.book_number || '01').trim();
    const docNum = String(studentData.doc_number || '001').trim();
    const year = String(studentData.academic_year || '2569').trim();

    let bookCode = String(studentData.book_code || '').trim();
    let docTypeCode = 'ปพ.1';
    let locationCode = 'LOC-A01-01-01';

    let existingBook = null;
    if (this.data.books && this.data.books.length > 0) {
      if (bookCode) {
        existingBook = this.data.books.find(b => b.book_code === bookCode);
      }
      if (!existingBook) {
        existingBook = this.data.books.find(b =>
          String(b.book_number || '').trim() === setNum &&
          String(b.academic_year || '').trim() === year
        );
      }
    }

    if (existingBook) {
      bookCode = existingBook.book_code;
      docTypeCode = existingBook.doc_type_code || 'ปพ.1';
      locationCode = existingBook.location_code || 'LOC-A01-01-01';
    } else {
      const typeInfo = this.normalizeDocType(docTypeCode);
      bookCode = `BOOK-${typeInfo.code}-${year}-${setNum}`;
    }

    const typeInfo = this.normalizeDocType(docTypeCode);
    const docCode = `DOC-${typeInfo.code}-${sid}`;

    if (!this.data.documents) this.data.documents = [];

    const existingIdx = this.data.documents.findIndex(d => String(d.student_id).trim() === sid || String(d.doc_code).trim() === docCode);

    const updatedDoc = {
      id: existingIdx !== -1 ? this.data.documents[existingIdx].id : (this.data.documents.length + 1),
      doc_code: docCode,
      student_id: sid,
      student_name: fullName,
      doc_type_code: docTypeCode,
      academic_year: year,
      book_number: setNum,
      doc_number: docNum,
      book_code: bookCode,
      status: 'stored',
      location_code: locationCode,
      updated_at: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      this.data.documents[existingIdx] = { ...this.data.documents[existingIdx], ...updatedDoc };
    } else {
      this.data.documents.unshift(updatedDoc);
    }
  }

  // --- Student CRUD ---
  async addStudent(studentData) {
    if (!studentData.student_id) throw new Error('ต้องระบุรหัสนักเรียน (student_id)');
    const cleanSid = String(studentData.student_id).trim();

    // Deduplication check
    const existingIdx = (this.data.students || []).findIndex(s => String(s.student_id).trim().toLowerCase() === cleanSid.toLowerCase());
    if (existingIdx !== -1) {
      this.data.students[existingIdx] = {
        ...this.data.students[existingIdx],
        ...studentData,
        updated_at: new Date().toISOString()
      };
      this.ensureStudentDocumentLinked(this.data.students[existingIdx]);
      this.saveLocal();
      this.syncToGoogleSheets(null, 'update').catch(err => console.warn('[DB] Background sync updateStudent failed:', err.message));
      return this.data.students[existingIdx];
    }

    const now = new Date().toISOString();
    const newStudent = {
      id: (this.data.students || []).length + 1,
      ...studentData,
      student_id: cleanSid,
      updated_at: now
    };
    if (!this.data.students) this.data.students = [];
    this.data.students.unshift(newStudent);

    // Auto-link document entry in Documents table
    this.ensureStudentDocumentLinked(newStudent);

    this.addAuditLog('ข้อมูลนักเรียน', 'เพิ่มข้อมูล', `เพิ่มนักเรียน ${studentData.first_name} ${studentData.last_name} (${cleanSid}) และสร้างทะเบียนเอกสาร ปพ.`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'create').catch(err => console.warn('[DB] Background sync addStudent failed:', err.message));
    return newStudent;
  }

  async updateStudent(studentId, studentData) {
    if (!studentId) throw new Error('ต้องระบุรหัสนักเรียนสำหรับอัปเดต');
    const idx = (this.data.students || []).findIndex(s => String(s.student_id) === String(studentId));
    if (idx === -1) throw new Error(`ไม่พบนักเรียนรหัส ${studentId}`);
    
    this.data.students[idx] = {
      ...this.data.students[idx],
      ...studentData,
      updated_at: new Date().toISOString()
    };

    // Auto-link/update document entry in Documents table
    this.ensureStudentDocumentLinked(this.data.students[idx]);

    this.addAuditLog('ข้อมูลนักเรียน', 'แก้ไขข้อมูล', `แก้ไขข้อมูลนักเรียน ${studentId} และอัปเดตทะเบียนเอกสาร ปพ.`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'update').catch(err => console.warn('[DB] Background sync updateStudent failed:', err.message));
    return this.data.students[idx];
  }

  async deleteStudent(studentId) {
    if (!studentId) throw new Error('ต้องระบุรหัสนักเรียนสำหรับลบ');
    const sidStr = String(studentId).trim();
    this.data.students = (this.data.students || []).filter(s => String(s.student_id).trim() !== sidStr);
    
    // Auto-cleanup corresponding document entries
    if (this.data.documents) {
      const deletedDocs = this.data.documents.filter(d => String(d.student_id).trim() === sidStr);
      this.cleanupDeletedKeys();
      if (!this.data.deleted_keys.documents) this.data.deleted_keys.documents = [];
      deletedDocs.forEach(d => {
        if (d.doc_code && !this.data.deleted_keys.documents.includes(String(d.doc_code).trim())) {
          this.data.deleted_keys.documents.push(String(d.doc_code).trim());
        }
      });
      this.data.documents = this.data.documents.filter(d => String(d.student_id).trim() !== sidStr);
    }

    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.students) this.data.deleted_keys.students = [];
    this.data.deleted_keys.students.push(sidStr);

    this.addAuditLog('ข้อมูลนักเรียน', 'ลบข้อมูล', `ลบนักเรียนรหัส ${studentId} และเอกสาร ปพ. ที่เชื่อมโยง`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  async deleteStudentsBatch(studentIds) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) return null;
    const cleanIds = studentIds.map(id => String(id).trim().toLowerCase());
    
    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.students) this.data.deleted_keys.students = [];
    if (!this.data.deleted_keys.documents) this.data.deleted_keys.documents = [];

    if (this.data.documents) {
      const deletedDocs = this.data.documents.filter(d => cleanIds.includes(String(d.student_id).trim().toLowerCase()));
      deletedDocs.forEach(d => {
        if (d.doc_code && !this.data.deleted_keys.documents.includes(String(d.doc_code).trim().toLowerCase())) {
          this.data.deleted_keys.documents.push(String(d.doc_code).trim().toLowerCase());
        }
      });
      this.data.documents = this.data.documents.filter(d => !cleanIds.includes(String(d.student_id).trim().toLowerCase()));
    }

    cleanIds.forEach(sid => {
      if (!this.data.deleted_keys.students.includes(sid)) {
        this.data.deleted_keys.students.push(sid);
      }
    });
    this.data.students = (this.data.students || []).filter(s => !cleanIds.includes(String(s.student_id).trim().toLowerCase()));

    this.addAuditLog('ข้อมูลนักเรียน', 'ลบข้อมูลกลุ่ม', `ลบข้อมูลนักเรียนจำนวน ${studentIds.length} รายการและเอกสารที่เชื่อมโยง`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  // --- Document CRUD ---
  async addDocument(docData) {
    if (!docData.doc_code) throw new Error('ต้องระบุรหัสเอกสาร (doc_code)');
    const cleanCode = String(docData.doc_code).trim();

    const existing = (this.data.documents || []).find(d => String(d.doc_code).trim().toLowerCase() === cleanCode.toLowerCase());
    if (existing) {
      console.warn('[DB] Duplicate document add prevented:', cleanCode);
      return existing;
    }

    const newDoc = {
      id: (this.data.documents || []).length + 1,
      ...docData,
      doc_code: cleanCode,
      updated_at: new Date().toISOString()
    };
    if (!this.data.documents) this.data.documents = [];
    this.data.documents.unshift(newDoc);
    this.addAuditLog('เอกสาร ปพ.', 'เพิ่มเอกสาร', `เพิ่มเอกสาร ${cleanCode}`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'create').catch(err => console.warn('[DB] Background sync addDocument failed:', err.message));
    return newDoc;
  }

  async updateDocument(docCode, docData) {
    const idx = (this.data.documents || []).findIndex(d => String(d.doc_code) === String(docCode));
    if (idx === -1) throw new Error(`ไม่พบเอกสารรหัส ${docCode}`);
    
    this.data.documents[idx] = {
      ...this.data.documents[idx],
      ...docData,
      updated_at: new Date().toISOString()
    };
    this.addAuditLog('เอกสาร ปพ.', 'แก้ไขเอกสาร', `แก้ไขเอกสาร ${docCode}`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'update').catch(err => console.warn('[DB] Background sync updateDocument failed:', err.message));
    return this.data.documents[idx];
  }

  async deleteDocument(docCode, docId) {
    const codeStr = String(docCode || docId).trim();
    this.data.documents = (this.data.documents || []).filter(d => String(d.doc_code).trim() !== codeStr && String(d.id) !== String(docId));
    
    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.documents) this.data.deleted_keys.documents = [];
    this.data.deleted_keys.documents.push(codeStr);

    this.addAuditLog('เอกสาร ปพ.', 'ลบเอกสาร', `ลบเอกสาร ${codeStr}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  async deleteDocumentsBatch(docCodes) {
    if (!Array.isArray(docCodes) || docCodes.length === 0) return null;
    const cleanCodes = docCodes.map(c => String(c).trim().toLowerCase());

    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.documents) this.data.deleted_keys.documents = [];

    cleanCodes.forEach(code => {
      if (!this.data.deleted_keys.documents.includes(code)) {
        this.data.deleted_keys.documents.push(code);
      }
    });

    this.data.documents = (this.data.documents || []).filter(d => !cleanCodes.includes(String(d.doc_code).trim().toLowerCase()));

    this.addAuditLog('เอกสาร ปพ.', 'ลบเอกสารกลุ่ม', `ลบรายการเอกสาร ปพ. จำนวน ${docCodes.length} รายการ`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  // --- Book CRUD ---
  async addBook(bookData) {
    if (!bookData.book_code) throw new Error('ต้องระบุรหัสเล่ม (book_code)');
    const cleanCode = String(bookData.book_code).trim();

    const existing = (this.data.books || []).find(b => String(b.book_code).trim().toLowerCase() === cleanCode.toLowerCase());
    if (existing) {
      console.warn('[DB] Duplicate book add prevented:', cleanCode);
      return existing;
    }

    const newBook = {
      id: (this.data.books || []).length + 1,
      ...bookData,
      book_code: cleanCode,
      updated_at: new Date().toISOString()
    };
    if (!this.data.books) this.data.books = [];
    this.data.books.unshift(newBook);
    this.addAuditLog('ทะเบียนเล่ม', 'เพิ่มเล่ม', `เพิ่มเล่ม ${cleanCode}`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'create').catch(err => console.warn('[DB] Background sync addBook failed:', err.message));
    return newBook;
  }

  async updateBook(bookCode, bookData) {
    const idx = (this.data.books || []).findIndex(b => String(b.book_code) === String(bookCode));
    if (idx === -1) throw new Error(`ไม่พบเล่มเอกสารรหัส ${bookCode}`);

    this.data.books[idx] = {
      ...this.data.books[idx],
      ...bookData,
      updated_at: new Date().toISOString()
    };
    this.addAuditLog('ทะเบียนเล่ม', 'แก้ไขเล่ม', `แก้ไขเล่ม ${bookCode}`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'update').catch(err => console.warn('[DB] Background sync updateBook failed:', err.message));
    return this.data.books[idx];
  }

  async deleteBook(bookCode) {
    const bcodeStr = String(bookCode).trim();
    this.data.books = (this.data.books || []).filter(b => String(b.book_code).trim() !== bcodeStr);

    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.books) this.data.deleted_keys.books = [];
    this.data.deleted_keys.books.push(bcodeStr);

    this.addAuditLog('ทะเบียนเล่ม', 'ลบเล่ม', `ลบเล่มรหัส ${bookCode}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  async deleteBooksBatch(bookCodes) {
    if (!Array.isArray(bookCodes) || bookCodes.length === 0) return null;
    const cleanCodes = bookCodes.map(c => String(c).trim().toLowerCase());

    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.books) this.data.deleted_keys.books = [];

    cleanCodes.forEach(code => {
      if (!this.data.deleted_keys.books.includes(code)) {
        this.data.deleted_keys.books.push(code);
      }
    });

    this.data.books = (this.data.books || []).filter(b => !cleanCodes.includes(String(b.book_code).trim().toLowerCase()));

    this.addAuditLog('ทะเบียนเล่ม', 'ลบเล่มกลุ่ม', `ลบทะเบียนเล่มจำนวน ${bookCodes.length} รายการ`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  // --- Loan CRUD ---
  async addLoan(loanData) {
    if (!loanData.loan_code) throw new Error('ต้องระบุเลขคำขอ (loan_code)');
    const cleanCode = String(loanData.loan_code).trim();

    const existing = (this.data.loans || []).find(l => String(l.loan_code).trim().toLowerCase() === cleanCode.toLowerCase());
    if (existing) {
      console.warn('[DB] Duplicate loan add prevented:', cleanCode);
      return existing;
    }

    const newLoan = {
      id: (this.data.loans || []).length + 1,
      ...loanData,
      loan_code: cleanCode,
      updated_at: new Date().toISOString()
    };
    if (!this.data.loans) this.data.loans = [];
    this.data.loans.unshift(newLoan);
    this.addAuditLog('คำขอสำเนา', 'เพิ่มคำขอ', `เพิ่มคำขอสำเนา ${cleanCode}`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'create').catch(err => console.warn('[DB] Background sync addLoan failed:', err.message));
    return newLoan;
  }

  async updateLoan(loanCode, loanData) {
    const idx = (this.data.loans || []).findIndex(l => String(l.loan_code) === String(loanCode));
    if (idx === -1) throw new Error(`ไม่พบคำขอรหัส ${loanCode}`);

    this.data.loans[idx] = {
      ...this.data.loans[idx],
      ...loanData,
      updated_at: new Date().toISOString()
    };
    this.addAuditLog('คำขอสำเนา', 'แก้ไขคำขอ', `แก้ไขคำขอ ${loanCode}`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'update').catch(err => console.warn('[DB] Background sync updateLoan failed:', err.message));
    return this.data.loans[idx];
  }

  async deleteLoan(loanCode, loanId) {
    const lcodeStr = String(loanCode || loanId).trim();
    this.data.loans = (this.data.loans || []).filter(l => String(l.loan_code).trim() !== lcodeStr && String(l.id) !== String(loanId));

    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.loans) this.data.deleted_keys.loans = [];
    this.data.deleted_keys.loans.push(lcodeStr);

    this.addAuditLog('คำขอสำเนา', 'ลบคำขอ', `ลบคำขอสำเนา ${lcodeStr}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  async deleteLoansBatch(loanCodes) {
    if (!Array.isArray(loanCodes) || loanCodes.length === 0) return null;
    const cleanCodes = loanCodes.map(c => String(c).trim().toLowerCase());

    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.loans) this.data.deleted_keys.loans = [];

    cleanCodes.forEach(code => {
      if (!this.data.deleted_keys.loans.includes(code)) {
        this.data.deleted_keys.loans.push(code);
      }
    });

    this.data.loans = (this.data.loans || []).filter(l => !cleanCodes.includes(String(l.loan_code).trim().toLowerCase()));

    this.addAuditLog('คำขอสำเนา', 'ลบคำขอกลุ่ม', `ลบรายการคำขอสำเนาจำนวน ${loanCodes.length} รายการ`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  // --- Location CRUD ---
  async addLocation(locData) {
    if (!locData.code) throw new Error('ต้องระบุรหัสตำแหน่ง (code)');
    const cleanCode = String(locData.code).trim();

    const existing = (this.data.storage_locations || []).find(l => String(l.code).trim().toLowerCase() === cleanCode.toLowerCase());
    if (existing) {
      console.warn('[DB] Duplicate location add prevented:', cleanCode);
      return existing;
    }

    const newLoc = {
      id: (this.data.storage_locations || []).length + 1,
      ...locData,
      code: cleanCode,
      updated_at: new Date().toISOString()
    };
    if (!this.data.storage_locations) this.data.storage_locations = [];
    this.data.storage_locations.unshift(newLoc);
    this.addAuditLog('สถานที่จัดเก็บ', 'เพิ่มตำแหน่ง', `เพิ่มตำแหน่ง ${cleanCode}`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'create').catch(err => console.warn('[DB] Background sync addLocation failed:', err.message));
    return newLoc;
  }

  async updateLocation(code, locData) {
    const idx = (this.data.storage_locations || []).findIndex(l => String(l.code) === String(code));
    if (idx === -1) throw new Error(`ไม่พบตำแหน่งรหัส ${code}`);

    this.data.storage_locations[idx] = {
      ...this.data.storage_locations[idx],
      ...locData,
      updated_at: new Date().toISOString()
    };
    this.addAuditLog('สถานที่จัดเก็บ', 'แก้ไขตำแหน่ง', `แก้ไขตำแหน่ง ${code}`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'update').catch(err => console.warn('[DB] Background sync updateLocation failed:', err.message));
    return this.data.storage_locations[idx];
  }

  async deleteLocation(code) {
    const locStr = String(code).trim();
    this.data.storage_locations = (this.data.storage_locations || []).filter(l => String(l.code).trim() !== locStr);

    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.storage_locations) this.data.deleted_keys.storage_locations = [];
    this.data.deleted_keys.storage_locations.push(locStr);

    this.addAuditLog('สถานที่จัดเก็บ', 'ลบตำแหน่ง', `ลบตำแหน่งรหัส ${code}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  // --- User CRUD ---
  async addUser(userData) {
    if (!userData.username) throw new Error('ต้องระบุชื่อผู้ใช้งาน (username)');
    const cleanUsername = String(userData.username).trim();
    if (!cleanUsername) throw new Error('ต้องระบุชื่อผู้ใช้งาน (username)');

    const exists = (this.data.users || []).some(u => String(u.username).trim().toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      throw new Error(`ชื่อผู้ใช้งาน "${cleanUsername}" มีในระบบแล้ว กรุณาใช้ Username อื่น (เช่น ${cleanUsername}2, ${cleanUsername}_admin)`);
    }

    const newUser = {
      id: (this.data.users || []).length + 1,
      password_hash: userData.password_hash || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      ...userData,
      username: cleanUsername,
      updated_at: new Date().toISOString()
    };
    if (!this.data.users) this.data.users = [];
    this.data.users.unshift(newUser);
    this.addAuditLog('ผู้ใช้งาน', 'เพิ่มผู้ใช้', `สร้างบัญชีผู้ใช้ ${cleanUsername} (บทบาท: ${userData.role_code || 'staff'})`);
    this.saveLocal();
    this.syncToGoogleSheets(null, 'create').catch(err => console.warn('[DB] Background sync addUser failed:', err.message));
    return newUser;
  }

  async updateUser(username, userData) {
    const idx = (this.data.users || []).findIndex(u => String(u.username).toLowerCase() === String(username).toLowerCase());
    if (idx === -1) throw new Error(`ไม่พบบัญชีผู้ใช้ ${username}`);

    this.data.users[idx] = {
      ...this.data.users[idx],
      ...userData,
      updated_at: new Date().toISOString()
    };
    this.addAuditLog('ผู้ใช้งาน', 'แก้ไขผู้ใช้', `แก้ไขบัญชีผู้ใช้ ${username}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'update');
  }

  async deleteUser(username) {
    const unameStr = String(username).trim().toLowerCase();
    this.data.users = (this.data.users || []).filter(u => String(u.username).trim().toLowerCase() !== unameStr);

    this.cleanupDeletedKeys();
    if (!this.data.deleted_keys.users) this.data.deleted_keys.users = [];
    this.data.deleted_keys.users.push(unameStr);

    this.addAuditLog('ผู้ใช้งาน', 'ลบผู้ใช้', `ลบบัญชีผู้ใช้ ${username}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'delete');
  }

  // Seed Helper Methods
  seedRolesAndPermissions() {
    this.data.roles = [
      { id: 1, code: 'super_admin', name: 'Super Admin', description: 'ผู้ดูแลระบบสูงสุด เข้าถึงและจัดการได้ทุกส่วน' },
      { id: 2, code: 'administrator', name: 'Administrator', description: 'นายทะเบียน/ผู้บริหาร จัดการข้อมูลและสิทธิ์' },
      { id: 3, code: 'staff', name: 'Staff', description: 'เจ้าหน้าที่ทะเบียน เพิ่ม แก้ไข และสืบค้นเอกสาร' },
      { id: 4, code: 'viewer', name: 'Viewer', description: 'ผู้เข้าชม ดูข้อมูลและสืบค้นได้อย่างเดียว' }
    ];

    this.data.permissions = [
      { key: 'view_students', name: 'ดูข้อมูลนักเรียน' },
      { key: 'create_students', name: 'เพิ่มข้อมูลนักเรียน' },
      { key: 'edit_students', name: 'แก้ไขข้อมูลนักเรียน' },
      { key: 'delete_students', name: 'ลบข้อมูลนักเรียน' },
      { key: 'view_documents', name: 'ดูเอกสาร ปพ.' },
      { key: 'create_documents', name: 'เพิ่มเอกสาร ปพ.' },
      { key: 'edit_documents', name: 'แก้ไขเอกสาร ปพ.' },
      { key: 'delete_documents', name: 'ลบเอกสาร ปพ.' },
      { key: 'manage_loans', name: 'จัดการคำขอสำเนาเอกสาร' },
      { key: 'manage_users', name: 'จัดการผู้ใช้งาน & สิทธิ์' },
      { key: 'view_audit_logs', name: 'ดูประวัติ Audit Log' },
      { key: 'manage_settings', name: 'จัดการตั้งค่าระบบ' }
    ];
  }

  seedUsers() {
    this.data.users = [
      {
        id: 1,
        username: 'admin',
        password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        title: 'นาย',
        first_name: 'ผู้ดูแลระบบ',
        last_name: 'สูงสุด',
        role_code: 'super_admin',
        email: 'admin@school.ac.th',
        status: 'active',
        created_at: '2026-01-10 09:00:00'
      }
    ];
  }

  seedAcademicYears() {
    this.data.academic_years = [
      { year: '2570', is_active: false },
      { year: '2569', is_active: true },
      { year: '2568', is_active: false },
      { year: '2567', is_active: false },
      { year: '2566', is_active: false },
      { year: '2565', is_active: false }
    ];
  }

  seedDocumentTypes() {
    this.data.document_types = [
      { code: 'ปพ.1', name: 'ระเบียนแสดงผลการเรียน (ปพ.1)' },
      { code: 'ปพ.2', name: 'หลักฐานแสดงการจบการศึกษา (ปพ.2)' },
      { code: 'ปพ.3', name: 'รายงานผู้สำเร็จการศึกษา (ปพ.3)' },
      { code: 'ปพ.6', name: 'แบบรายงานพัฒนาคุณภาพผู้เรียน (ปพ.6)' },
      { code: 'ปพ.7', name: 'ใบรับรองผลการเรียน (ปพ.7)' }
    ];
  }

  clearMockData() {
    this.data.students = [];
    this.data.documents = [];
    this.data.books = [];
    this.data.loans = [];
    this.data.storage_locations = [];
    this.data.users = (this.data.users || []).filter(u => u.username === 'admin');
    this.saveLocal();
  }

  resetToSeed() {
    localStorage.removeItem(DB_STORAGE_KEY);
    this.initLocalCache();
  }

  addAuditLog(moduleName, actionName, description) {
    const user = window.authSystem ? window.authSystem.getCurrentUser() : { username: 'system', name: 'System' };
    const newLog = {
      id: (this.data.audit_logs || []).length + 1,
      timestamp: new Date().toLocaleString('th-TH'),
      username: user ? user.username : 'guest',
      user_fullname: user ? `${user.title || ''}${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Guest User',
      module: moduleName,
      action: actionName,
      description: description,
      ip_address: '127.0.0.1'
    };
    if (!this.data.audit_logs) this.data.audit_logs = [];
    this.data.audit_logs.unshift(newLog);
    if (this.data.audit_logs.length > 100) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 100);
    }
    this.saveLocal();
  }
}

// Global Database Instance Singleton
window.db = new RelationalDatabase();
