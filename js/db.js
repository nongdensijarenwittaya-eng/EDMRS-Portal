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
    if (!this.data.settings.sheets_url || (window.CONFIG && !window.CONFIG.validateWebAppUrl(this.data.settings.sheets_url))) {
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
      const res = await fetch(pingUrl);
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
  async syncFromGoogleSheets(customUrl) {
    console.trace("[DB][GET] called");
    if (customUrl) {
      this.googleSyncDisabled = false;
    }

    if (this.googleSyncDisabled && !customUrl) {
      // Auto-recovery: If sheets_url in settings differs from CONFIG.GOOGLE_APPS_SCRIPT_URL, try config URL
      if (window.CONFIG && window.CONFIG.GOOGLE_APPS_SCRIPT_URL && this.data.settings && this.data.settings.sheets_url !== window.CONFIG.GOOGLE_APPS_SCRIPT_URL) {
        console.log('[DB][GET] Auto-recovering using CONFIG.GOOGLE_APPS_SCRIPT_URL');
        this.data.settings.sheets_url = window.CONFIG.GOOGLE_APPS_SCRIPT_URL;
        this.saveLocal();
        this.googleSyncDisabled = false;
      } else {
        console.log('[DB][GET] Google Sheets sync is disabled due to invalid URL or 404');
        return null;
      }
    }

    if (this.fetchPromise) {
      console.log('[DB][GET] Single Flight: Request already running - returning existing Promise');
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      let sheetsUrl = customUrl || (this.data.settings && this.data.settings.sheets_url) || (window.CONFIG ? window.CONFIG.getWebAppUrl() : '');
      console.log('[DB][GET] Fetching records from:', sheetsUrl);

      this.DB_STATE.fetching = true;
      this.DB_STATE.lastSyncStatus = 'fetching';

      if (window.utils && typeof window.utils.showLoadingModal === 'function') {
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
          res = await fetch(fetchUrl);
        } catch (netErr) {
          throw new Error('ไม่สามารถเชื่อมต่อเครือข่ายได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        if (!res.ok) {
          if (res.status === 404) {
            // Auto fallback check: if stored URL was old and differs from CONFIG default, update it
            if (window.CONFIG && window.CONFIG.GOOGLE_APPS_SCRIPT_URL && sheetsUrl !== window.CONFIG.GOOGLE_APPS_SCRIPT_URL) {
              console.warn('[DB][GET] Stored URL returned 404. Falling back to default CONFIG URL...');
              this.data.settings.sheets_url = window.CONFIG.GOOGLE_APPS_SCRIPT_URL;
              this.saveLocal();
              // Recursive one-time retry with new CONFIG URL
              this.fetchPromise = null;
              this.googleSyncDisabled = false;
              return await this.syncFromGoogleSheets(window.CONFIG.GOOGLE_APPS_SCRIPT_URL);
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

        this.applySheetData(json.data);

        const studentCount = (this.data.students || []).length;
        const docCount = (this.data.documents || []).length;
        const bookCount = (this.data.books || []).length;

        this.DB_STATE.lastFetchAt = new Date().toLocaleString('th-TH');
        this.DB_STATE.lastSyncStatus = 'success';
        console.log(`[DB][GET] Success: Fetched ${studentCount} students, ${docCount} documents, ${bookCount} books`);

        if (window.utils && typeof window.utils.updateLoadingModalProgress === 'function') {
          window.utils.updateLoadingModalProgress(100, 'โหลดข้อมูลสำเร็จ!', `พร้อมใช้งาน (${studentCount} นักเรียน, ${docCount} เอกสาร)`);
        }

        return { studentCount, docCount, bookCount };
      } catch (fetchErr) {
        this.DB_STATE.lastSyncStatus = 'error';
        console.error('[DB][ERROR] GET failed:', fetchErr.message);
        throw fetchErr;
      } finally {
        this.DB_STATE.fetching = false;
        this.fetchPromise = null;
        setTimeout(() => {
          if (window.utils && typeof window.utils.hideLoadingModal === 'function') {
            window.utils.hideLoadingModal();
          }
        }, 300);
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Single Flight HTTP POST: Write Data to Google Sheets (Create / Update / Delete)
   */
  async syncToGoogleSheets(customUrl, actionName = 'sync') {
    console.trace(`[DB][${actionName.toUpperCase()}] called`);
    if (this.googleSyncDisabled && !customUrl) {
      return { status: 'disabled', message: 'Google Sheets Sync ถูกปิดใช้งานเนื่องจาก URL ไม่ถูกต้องหรือตอบกลับ 404' };
    }

    if (this.savePromise) {
      console.log(`[DB][${actionName.toUpperCase()}] Single Flight: Write request in progress - reusing Promise`);
      return this.savePromise;
    }

    this.savePromise = (async () => {
      const sheetsUrl = customUrl || (this.data.settings && this.data.settings.sheets_url) || (window.CONFIG ? window.CONFIG.getWebAppUrl() : '');
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
          body: JSON.stringify(payload)
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

  /**
   * Save Local Storage Cache
   */
  saveLocal() {
    this.cleanupDeletedKeys();
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
   * Apply Parsed Sheet Data into State
   */
  applySheetData(sheetData) {
    if (!sheetData || typeof sheetData !== 'object') return;

    if (!this.data.deleted_keys) {
      this.data.deleted_keys = { users: [], students: [], documents: [], books: [], loans: [], storage_locations: [] };
    }

    const deletedUsers = (this.data.deleted_keys.users || []).map(k => String(k).toLowerCase());
    const deletedStudents = (this.data.deleted_keys.students || []).map(k => String(k).toLowerCase());
    const deletedDocs = (this.data.deleted_keys.documents || []).map(k => String(k).toLowerCase());
    const deletedBooks = (this.data.deleted_keys.books || []).map(k => String(k).toLowerCase());
    const deletedLoans = (this.data.deleted_keys.loans || []).map(k => String(k).toLowerCase());
    const deletedLocs = (this.data.deleted_keys.storage_locations || []).map(k => String(k).toLowerCase());

    // 1. Students
    if (Array.isArray(sheetData.Students) && sheetData.Students.length > 1) {
      const rows = sheetData.Students.slice(1);
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
      })).filter(s => s.student_id);

      const studentMap = new Map();
      (this.data.students || []).forEach(s => {
        const sid = String(s.student_id).toLowerCase();
        if (!deletedStudents.includes(sid)) studentMap.set(sid, s);
      });

      parsedStudents.forEach(s => {
        const sid = String(s.student_id).toLowerCase();
        if (!deletedStudents.includes(sid)) {
          const local = studentMap.get(sid);
          if (!local || !local.updated_at || (s.updated_at && s.updated_at >= local.updated_at)) {
            studentMap.set(sid, { ...local, ...s });
          }
        }
      });

      this.data.students = Array.from(studentMap.values());
    }

    // 2. Documents
    if (Array.isArray(sheetData.Documents) && sheetData.Documents.length > 1) {
      const rows = sheetData.Documents.slice(1);
      const parsedDocs = rows.map((row, idx) => ({
        id: idx + 1,
        doc_code: String(row[0] || '').trim(),
        student_id: String(row[1] || '').trim(),
        student_name: String(row[2] || '').trim(),
        doc_type_code: String(row[3] || 'ปพ.1').trim(),
        academic_year: String(row[4] || '').trim(),
        book_number: String(row[5] || '').trim(),
        doc_number: String(row[6] || '').trim(),
        status: String(row[7] || 'stored').trim(),
        location_code: String(row[8] || '').trim(),
        updated_at: String(row[9] || '').trim()
      })).filter(d => d.doc_code || d.doc_number);

      const docMap = new Map();
      (this.data.documents || []).forEach(d => {
        const dcode = String(d.doc_code).toLowerCase();
        if (!deletedDocs.includes(dcode)) docMap.set(dcode, d);
      });

      parsedDocs.forEach(d => {
        const dcode = String(d.doc_code).toLowerCase();
        if (!deletedDocs.includes(dcode)) {
          const local = docMap.get(dcode);
          if (!local || !local.updated_at || (d.updated_at && d.updated_at >= local.updated_at)) {
            docMap.set(dcode, { ...local, ...d });
          }
        }
      });

      this.data.documents = Array.from(docMap.values());
    }

    // 3. Books
    if (Array.isArray(sheetData.Books) && sheetData.Books.length > 1) {
      const rows = sheetData.Books.slice(1);
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
      })).filter(b => b.book_code);

      const bookMap = new Map();
      (this.data.books || []).forEach(b => {
        const bcode = String(b.book_code).toLowerCase();
        if (!deletedBooks.includes(bcode)) bookMap.set(bcode, b);
      });

      parsedBooks.forEach(b => {
        const bcode = String(b.book_code).toLowerCase();
        if (!deletedBooks.includes(bcode)) {
          const local = bookMap.get(bcode);
          if (!local || !local.updated_at || (b.updated_at && b.updated_at >= local.updated_at)) {
            bookMap.set(bcode, { ...local, ...b });
          }
        }
      });

      this.data.books = Array.from(bookMap.values());
    }

    // 4. Loans
    if (Array.isArray(sheetData.Loans) && sheetData.Loans.length > 1) {
      const rows = sheetData.Loans.slice(1);
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
      })).filter(l => l.loan_code);

      const loanMap = new Map();
      (this.data.loans || []).forEach(l => {
        const lcode = String(l.loan_code).toLowerCase();
        if (!deletedLoans.includes(lcode)) loanMap.set(lcode, l);
      });

      parsedLoans.forEach(l => {
        const lcode = String(l.loan_code).toLowerCase();
        if (!deletedLoans.includes(lcode)) {
          const local = loanMap.get(lcode);
          if (!local || !local.updated_at || (l.updated_at && l.updated_at >= local.updated_at)) {
            loanMap.set(lcode, { ...local, ...l });
          }
        }
      });

      this.data.loans = Array.from(loanMap.values());
    }

    // 5. Storage_Locations
    if (Array.isArray(sheetData.Storage_Locations) && sheetData.Storage_Locations.length > 1) {
      const rows = sheetData.Storage_Locations.slice(1);
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
      })).filter(l => l.code);

      const locMap = new Map();
      (this.data.storage_locations || []).forEach(l => {
        const lcode = String(l.code).toLowerCase();
        if (!deletedLocs.includes(lcode)) locMap.set(lcode, l);
      });

      parsedLocs.forEach(l => {
        const lcode = String(l.code).toLowerCase();
        if (!deletedLocs.includes(lcode)) {
          const local = locMap.get(lcode);
          if (!local || !local.updated_at || (l.updated_at && l.updated_at >= local.updated_at)) {
            locMap.set(lcode, { ...local, ...l });
          }
        }
      });

      this.data.storage_locations = Array.from(locMap.values());
    }

    // 6. Users
    if (Array.isArray(sheetData.Users) && sheetData.Users.length > 1) {
      const rows = sheetData.Users.slice(1);
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
      })).filter(u => u.username);

      const userMap = new Map();
      (this.data.users || []).forEach(u => {
        const uname = String(u.username).toLowerCase();
        if (!deletedUsers.includes(uname)) userMap.set(uname, u);
      });

      parsedUsers.forEach(u => {
        const uname = String(u.username).toLowerCase();
        if (!deletedUsers.includes(uname)) {
          const local = userMap.get(uname);
          if (!local || !local.updated_at || (u.updated_at && u.updated_at >= local.updated_at)) {
            userMap.set(uname, { ...local, ...u });
          }
        }
      });

      this.data.users = Array.from(userMap.values());
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
      this.data.settings = parsedSettings;
    }

    this.saveLocal();
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
    return list;
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
      list = list.filter(d => String(d.book_code) === String(filters.book_code));
    }
    if (filters.doc_type_code) {
      list = list.filter(d => String(d.doc_type_code) === String(filters.doc_type_code));
    }
    if (filters.academic_year) {
      list = list.filter(d => String(d.academic_year) === String(filters.academic_year));
    }
    return list;
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
    return list;
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

    if (bookCode && this.data.books) {
      const bookObj = this.data.books.find(b => b.book_code === bookCode);
      if (bookObj) {
        docTypeCode = bookObj.doc_type_code || 'ปพ.1';
        locationCode = bookObj.location_code || 'LOC-A01-01-01';
      }
    } else {
      const cleanType = docTypeCode.replace(/[\.\_\-\s]/g, '');
      bookCode = `BOOK-${cleanType}-${year}-${String(setNum).padStart(2, '0')}`;
    }

    const cleanType = docTypeCode.replace(/[\.\_\-\s]/g, '').toUpperCase();
    const docCode = `DOC-${cleanType}-${sid}`;

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
    const now = new Date().toISOString();
    const newStudent = {
      id: (this.data.students || []).length + 1,
      ...studentData,
      updated_at: now
    };
    if (!this.data.students) this.data.students = [];
    this.data.students.unshift(newStudent);

    // Auto-link document entry in Documents table
    this.ensureStudentDocumentLinked(newStudent);

    this.addAuditLog('ข้อมูลนักเรียน', 'เพิ่มข้อมูล', `เพิ่มนักเรียน ${studentData.first_name} ${studentData.last_name} (${studentData.student_id}) และสร้างทะเบียนเอกสาร ปพ.`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'create');
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
    return await this.syncToGoogleSheets(null, 'update');
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

  // --- Document CRUD ---
  async addDocument(docData) {
    if (!docData.doc_code) throw new Error('ต้องระบุรหัสเอกสาร (doc_code)');
    const newDoc = {
      id: (this.data.documents || []).length + 1,
      ...docData,
      updated_at: new Date().toISOString()
    };
    if (!this.data.documents) this.data.documents = [];
    this.data.documents.unshift(newDoc);
    this.addAuditLog('เอกสาร ปพ.', 'เพิ่มเอกสาร', `เพิ่มเอกสาร ${docData.doc_code}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'create');
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
    return await this.syncToGoogleSheets(null, 'update');
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

  // --- Book CRUD ---
  async addBook(bookData) {
    if (!bookData.book_code) throw new Error('ต้องระบุรหัสเล่ม (book_code)');
    const newBook = {
      id: (this.data.books || []).length + 1,
      ...bookData,
      updated_at: new Date().toISOString()
    };
    if (!this.data.books) this.data.books = [];
    this.data.books.unshift(newBook);
    this.addAuditLog('ทะเบียนเล่ม', 'เพิ่มเล่ม', `เพิ่มเล่ม ${bookData.book_code}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'create');
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
    return await this.syncToGoogleSheets(null, 'update');
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

  // --- Loan CRUD ---
  async addLoan(loanData) {
    if (!loanData.loan_code) throw new Error('ต้องระบุเลขคำขอ (loan_code)');
    const newLoan = {
      id: (this.data.loans || []).length + 1,
      ...loanData,
      updated_at: new Date().toISOString()
    };
    if (!this.data.loans) this.data.loans = [];
    this.data.loans.unshift(newLoan);
    this.addAuditLog('คำขอสำเนา', 'เพิ่มคำขอ', `เพิ่มคำขอสำเนา ${loanData.loan_code}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'create');
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
    return await this.syncToGoogleSheets(null, 'update');
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

  // --- Location CRUD ---
  async addLocation(locData) {
    if (!locData.code) throw new Error('ต้องระบุรหัสตำแหน่ง (code)');
    const newLoc = {
      id: (this.data.storage_locations || []).length + 1,
      ...locData,
      updated_at: new Date().toISOString()
    };
    if (!this.data.storage_locations) this.data.storage_locations = [];
    this.data.storage_locations.unshift(newLoc);
    this.addAuditLog('สถานที่จัดเก็บ', 'เพิ่มตำแหน่ง', `เพิ่มตำแหน่ง ${locData.code}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'create');
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
    return await this.syncToGoogleSheets(null, 'update');
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
    const newUser = {
      id: (this.data.users || []).length + 1,
      password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      ...userData,
      updated_at: new Date().toISOString()
    };
    if (!this.data.users) this.data.users = [];
    this.data.users.unshift(newUser);
    this.addAuditLog('ผู้ใช้งาน', 'เพิ่มผู้ใช้', `สร้างบัญชีผู้ใช้ ${userData.username}`);
    this.saveLocal();
    return await this.syncToGoogleSheets(null, 'create');
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
