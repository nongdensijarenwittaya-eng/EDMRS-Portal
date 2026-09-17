/* ==========================================================================
   EDMRS - Database Engine & Seed Data Loader (js/db.js)
   Relational data store with local persistence & indexed query engine
   ========================================================================== */

const DB_STORAGE_KEY = 'EDMRS_RELATIONAL_DB_V2.5';
const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec';

class RelationalDatabase {
  constructor() {
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
    this.fetchPromise = null;
    this.initializationPromise = null;

    console.log('[DB] Initializing...');

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
    this.init();
  }

  init() {
    const local = localStorage.getItem(DB_STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') {
          this.data = { ...this.data, ...parsed };
          if (!this.data.settings) this.data.settings = {};
          this.data.settings.sheets_url = DEFAULT_SHEETS_URL;
          if (!this.data.users || this.data.users.length === 0) this.seedUsers();
          if (!this.data.students || this.data.students.length === 0) this.seedStudents();
          if (!this.data.documents || this.data.documents.length === 0) this.seedDocuments();
          if (!this.data.books || this.data.books.length === 0) this.seedBooks();
          if (!this.data.storage_locations || this.data.storage_locations.length === 0) this.seedStorageLocations();
          return;
        }
      } catch (e) {
        console.warn('Failed to parse local DB:', e);
      }
    }
    this.seedDefaultData();
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.sheets_url = DEFAULT_SHEETS_URL;
  }

  isJunkText(str) {
    if (!str) return true;
    const s = String(str).trim().toLowerCase();
    return s.includes('blob:') || s.includes('http://') || s.includes('https://') || s.includes('uw_') || s.endsWith('.pdf');
  }

  sanitizeDocumentItem(doc) {
    if (!doc) return doc;
    if (this.isJunkText(doc.student_id)) doc.student_id = '';
    if (this.isJunkText(doc.student_name)) doc.student_name = '';
    if (this.isJunkText(doc.doc_type_code)) doc.doc_type_code = 'ปพ.1';
    if (this.isJunkText(doc.doc_number)) doc.doc_number = '';

    if (doc.student_id && (!doc.student_name || this.isJunkText(doc.student_name))) {
      const std = this.getStudentById(doc.student_id);
      if (std) {
        doc.student_name = `${std.prefix || ''}${std.first_name || ''} ${std.last_name || ''}`.trim();
      }
    }
    return doc;
  }

  sanitizeLoanItem(loan) {
    if (!loan) return loan;
    let studentId = String(loan.student_id || '').trim();
    let studentName = String(loan.student_name || '').trim();
    let docTypeCode = String(loan.doc_type_code || 'ปพ.1').trim();
    let docNumber = String(loan.doc_number || '').trim();

    if (this.isJunkText(docTypeCode)) docTypeCode = 'ปพ.1';
    if (this.isJunkText(docNumber)) docNumber = '';
    if (this.isJunkText(studentId)) studentId = '';
    if (this.isJunkText(studentName)) studentName = '';

    if (studentId && (!studentName || this.isJunkText(studentName))) {
      const std = this.getStudentById(studentId);
      if (std) {
        studentName = `${std.prefix || ''}${std.first_name || ''} ${std.last_name || ''}`.trim();
      }
    }

    if (!studentName && !studentId && loan.doc_id) {
      const doc = (this.data.documents || []).find(d => d.id == loan.doc_id);
      if (doc) {
        studentId = studentId || doc.student_id || '';
        studentName = studentName || doc.student_name || '';
        docTypeCode = (docTypeCode === 'ปพ.1' && doc.doc_type_code) ? doc.doc_type_code : docTypeCode;
        docNumber = docNumber || doc.doc_number || '';
      }
    }

    loan.student_id = studentId;
    loan.student_name = studentName;
    loan.doc_type_code = docTypeCode;
    loan.doc_number = docNumber;
    return loan;
  }

  sanitizeAllData() {
    if (Array.isArray(this.data.documents)) {
      this.data.documents = this.data.documents.map(d => this.sanitizeDocumentItem(d));
    }
    if (Array.isArray(this.data.loans)) {
      this.data.loans = this.data.loans.map(l => this.sanitizeLoanItem(l));
    }
  }

  save(autoSyncSheets = true, source = null, immediate = true) {
    if (source) {
      this.currentSource = source;
    } else if (this.currentSource !== this.DATA_SOURCE.GOOGLE) {
      this.currentSource = this.DATA_SOURCE.USER;
    }
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    if (autoSyncSheets && this.currentSource !== this.DATA_SOURCE.GOOGLE) {
      this.triggerAutoSyncToSheets(immediate);
    }
  }

  triggerAutoSyncToSheets(immediate = true) {
    if (this._syncTimeout) clearTimeout(this._syncTimeout);
    const delay = immediate ? 50 : 1200;
    this._syncTimeout = setTimeout(() => {
      const sheetsUrl = (this.data.settings && this.data.settings.sheets_url) || DEFAULT_SHEETS_URL;
      if (sheetsUrl && sheetsUrl.includes('script.google.com')) {
        console.log('[DB] Live save requested -> Syncing to Google Sheets immediately');
        this.syncToGoogleSheets().then(res => {
          if (res && res.status === 'queued') {
            console.log('[DB] Save skipped: request already in progress');
          } else if (res && res.status === 'success') {
            console.log('[DB] Live sync to Google Sheets completed successfully');
          }
        }).catch(err => {
          console.warn('[DB] Auto sync to Google Sheets background attempt:', err.message);
        });
      }
    }, delay);
  }

  async initializeDatabase() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      this.DB_STATE.initializing = true;
      try {
        const res = await this.syncFromGoogleSheets();
        this.DB_STATE.initialized = true;
        console.log('[DB] Initialization complete');
        return res;
      } catch (err) {
        console.warn('[DB] Initialization fallback to local cache:', err.message);
        this.DB_STATE.initialized = true;
        return null;
      } finally {
        this.DB_STATE.initializing = false;
      }
    })();

    return this.initializationPromise;
  }

  resetToSeed() {
    localStorage.removeItem(DB_STORAGE_KEY);
    this.seedDefaultData();
  }

  seedDefaultData() {
    this.seedRolesAndPermissions();
    this.seedUsers();
    this.seedAcademicYears();
    this.seedDocumentTypes();
    this.seedStorageLocations();
    this.seedBooks();
    this.seedStudents();
    this.seedDocuments();
    this.seedLoans();
    this.seedAuditLogs();
    this.seedSettings();
    this.seedNotifications();
    this.save();
  }

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
      { key: 'upload_documents', name: 'อัปโหลดไฟล์เอกสาร' },
      { key: 'download_documents', name: 'ดาวน์โหลดไฟล์เอกสาร' },
      { key: 'manage_loans', name: 'จัดการคำขอสำเนาเอกสาร' },
      { key: 'manage_users', name: 'จัดการผู้ใช้งาน & สิทธิ์' },
      { key: 'view_audit_logs', name: 'ดูประวัติ Audit Log' },
      { key: 'manage_settings', name: 'จัดการตั้งค่าระบบ & Backup' }
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
      { year: '2570', is_active: false, created_at: '2026-01-01' },
      { year: '2569', is_active: true, created_at: '2026-01-01' },
      { year: '2568', is_active: false, created_at: '2025-01-01' },
      { year: '2567', is_active: false, created_at: '2024-01-01' },
      { year: '2566', is_active: false, created_at: '2023-01-01' },
      { year: '2565', is_active: false, created_at: '2022-01-01' }
    ];
  }

  seedDocumentTypes() {
    this.data.document_types = [
      { id: 1, code: 'ปพ.1', name: 'ระเบียนแสดงผลการเรียน (ปพ.1)', description: 'เอกสารแสดงผลการเรียนตามหลักสูตร', is_system: true },
      { id: 2, code: 'ปพ.2', name: 'หลักฐานแสดงการจบการศึกษา (ปพ.2)', description: 'ประกาศนียบัตร/ใบจบการศึกษา', is_system: true },
      { id: 3, code: 'ปพ.3', name: 'แบบรายงานผู้สำเร็จการศึกษา (ปพ.3)', description: 'แบบรายงานผู้สำเร็จการศึกษาเสนอเขตพื้นที่', is_system: true },
      { id: 4, code: 'ปพ.4', name: 'แบบบันทึกผลการพัฒนาผู้เรียน (ปพ.4)', description: 'แสดงการประเมินคุณลักษณะอันพึงประสงค์', is_system: true },
      { id: 5, code: 'ปพ.5', name: 'แบบบันทึกผลการเรียนประจำรายวิชา (ปพ.5)', description: 'สมุดประจำชั้น/สมุดบันทึกคะแนนครู', is_system: true },
      { id: 6, code: 'ปพ.6', name: 'แบบรายงานพัฒนาการนักเรียน (ปพ.6)', description: 'สมุดรายงานประจำตัวนักเรียน', is_system: true },
      { id: 7, code: 'ปพ.7', name: 'ใบรับรองผลการเรียน (ปพ.7)', description: 'หนังสือรับรองสถานภาพนักเรียน', is_system: true },
      { id: 8, code: 'ปพ.8', name: 'เอกสารรายงานผลการพัฒนาคุณภาพผู้เรียน (ปพ.8)', description: 'สมุดแจ้งผลการเรียนเปลี่ยนสถานศึกษา', is_system: true },
      { id: 9, code: 'ปพ.9', name: 'สมุดติดตามพัฒนาการผู้เรียน (ปพ.9)', description: 'สมุดสมุดประจำตัวผู้เรียนย้ายโรงเรียน', is_system: true }
    ];
  }

  seedStorageLocations() {
    this.data.storage_locations = [];
  }

  seedBooks() {
    this.data.books = [];
  }

  seedStudents() {
    this.data.students = [];
  }

  seedDocuments() {
    this.data.documents = [];
  }

  seedLoans() {
    this.data.loans = [];
  }

  seedAuditLogs() {
    this.data.audit_logs = [
      {
        id: 1,
        timestamp: new Date().toLocaleString('th-TH'),
        username: 'admin',
        user_fullname: 'ผู้ดูแลระบบ',
        module: 'ระบบ',
        action: 'เริ่มต้นระบบ',
        description: 'เริ่มต้นใช้งานระบบ EDMRS พร้อมเชื่อมต่อ Google Sheets & Google Drive',
        ip_address: '127.0.0.1'
      }
    ];
  }

  seedSettings() {
    this.data.settings = {
      org_name_th: 'โรงเรียนหนองเดิ่นศรีเจริญวิทยา',
      org_name_en: 'Nongdoensricharoenwittaya School',
      org_code: 'SCH-100203',
      logo_url: 'https://lh3.googleusercontent.com/d/1SIu3JfivV9RnCOW2xkzb30x_A16q0MGU',
      address: 'ตำบลหนองเดิ่น อำเภอบุ่งคล้า จังหวัดบึงกาฬ 38000',
      phone: '02-555-1234',
      email: 'info@school.ac.th',
      doc_code_template: 'DOC-[TYPE]-[STUDENT_ID]',
      book_code_template: 'BOOK-[TYPE]-[YEAR]-[NUM]',
      location_code_template: 'LOC-[CABINET]-[SHELF]-[FOLDER]',
      sheets_url: DEFAULT_SHEETS_URL,
      drive_folder: '1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv',
      items_per_page: 15,
      notify_loan_overdue: true,
      last_backup_date: '2026-09-16 18:00:00'
    };
  }

  seedNotifications() {
    this.data.notifications = [
      {
        id: 1,
        type: 'info',
        title: 'ระบบพร้อมใช้งาน',
        message: 'เชื่อมต่อฐานข้อมูล Google Sheets และ Google Drive เรียบร้อยแล้ว พร้อมสำหรับนำเข้าข้อมูลจริง',
        timestamp: new Date().toLocaleString('th-TH'),
        is_read: false
      }
    ];
  }

  trackDeletedKey(entity, key) {
    if (!this.data.deleted_keys) {
      this.data.deleted_keys = { users: [], students: [], documents: [], books: [], loans: [], storage_locations: [] };
    }
    if (!this.data.deleted_keys[entity]) {
      this.data.deleted_keys[entity] = [];
    }
    const cleanKey = String(key || '').trim().toLowerCase();
    if (cleanKey && !this.data.deleted_keys[entity].map(k => String(k).toLowerCase()).includes(cleanKey)) {
      this.data.deleted_keys[entity].push(cleanKey);
    }
  }

  deleteUser(username) {
    const target = String(username || '').trim();
    if (!target) return;
    this.trackDeletedKey('users', target);
    this.data.users = (this.data.users || []).filter(u => String(u.username || '').trim().toLowerCase() !== target.toLowerCase());
    this.addAuditLog('ผู้ใช้งาน', 'ลบผู้ใช้', `ลบบัญชีผู้ใช้ ${target}`);
    this.save(true);
  }

  deleteStudent(studentId) {
    const target = String(studentId || '').trim();
    if (!target) return;
    this.trackDeletedKey('students', target);
    this.data.students = (this.data.students || []).filter(s => String(s.student_id || '').trim().toLowerCase() !== target.toLowerCase());
    this.addAuditLog('ข้อมูลนักเรียน', 'ลบนักเรียน', `ลบข้อมูลนักเรียน ${target}`);
    this.save(true);
  }

  deleteDocument(docCode, docId) {
    const targetCode = String(docCode || '').trim();
    if (targetCode) this.trackDeletedKey('documents', targetCode);
    this.data.documents = (this.data.documents || []).filter(d => {
      if (docId && d.id == docId) return false;
      if (targetCode && String(d.doc_code || '').trim().toLowerCase() === targetCode.toLowerCase()) return false;
      return true;
    });
    this.addAuditLog('ทะเบียนเอกสาร', 'ลบเอกสาร', `ลบเอกสารรหัส ${targetCode || docId}`);
    this.save(true);
  }

  deleteBook(bookCode) {
    const target = String(bookCode || '').trim();
    if (!target) return;
    this.trackDeletedKey('books', target);
    this.data.books = (this.data.books || []).filter(b => String(b.book_code || '').trim().toLowerCase() !== target.toLowerCase());
    this.addAuditLog('ทะเบียนเล่ม', 'ลบเล่ม', `ลบทะเบียนเล่ม ${target}`);
    this.save(true);
  }

  deleteLoan(loanCode, loanId) {
    const targetCode = String(loanCode || '').trim();
    if (targetCode) this.trackDeletedKey('loans', targetCode);
    this.data.loans = (this.data.loans || []).filter(l => {
      if (loanId && l.id == loanId) return false;
      if (targetCode && String(l.loan_code || '').trim().toLowerCase() === targetCode.toLowerCase()) return false;
      return true;
    });
    this.addAuditLog('คำขอสำเนา', 'ลบคำขอ', `ลบรายการคำขอ ${targetCode || loanId}`);
    this.save(true);
  }

  deleteLocation(code) {
    const target = String(code || '').trim();
    if (!target) return;
    this.trackDeletedKey('storage_locations', target);
    this.data.storage_locations = (this.data.storage_locations || []).filter(l => String(l.code || '').trim().toLowerCase() !== target.toLowerCase());
    this.addAuditLog('สถานที่จัดเก็บ', 'ลบสถานที่', `ลบสถานที่จัดเก็บ ${target}`);
    this.save(true);
  }

  /* Query Helper Methods */
  getStudents(filter = {}) {
    let result = [...(this.data.students || [])];
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(s =>
        s.student_id.toLowerCase().includes(q) ||
        s.citizen_id.includes(q) ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        `${s.prefix}${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
      );
    }
    if (filter.academic_year) {
      result = result.filter(s => s.academic_year === filter.academic_year);
    }
    if (filter.grade_level) {
      result = result.filter(s => s.grade_level === filter.grade_level);
    }
    if (filter.room) {
      result = result.filter(s => s.room === filter.room);
    }
    return result;
  }

  getStudentById(studentId) {
    return (this.data.students || []).find(s => s.student_id === studentId || s.id == studentId);
  }

  getDocuments(filter = {}) {
    let result = [...(this.data.documents || [])];

    const norm = (str) => String(str || '').toLowerCase().replace(/[\.\_\-\s]/g, '').replace(/uw/g, 'ปพ').trim();

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(d =>
        (d.doc_code && d.doc_code.toLowerCase().includes(q)) ||
        (d.student_id && d.student_id.toLowerCase().includes(q)) ||
        (d.student_name && d.student_name.toLowerCase().includes(q)) ||
        (d.doc_number && String(d.doc_number).includes(q)) ||
        (d.book_code && d.book_code.toLowerCase().includes(q)) ||
        (d.location_code && d.location_code.toLowerCase().includes(q))
      );
    }
    if (filter.student_id) {
      result = result.filter(d => String(d.student_id).trim() === String(filter.student_id).trim());
    }
    if (filter.doc_type_code) {
      const targetType = norm(filter.doc_type_code);
      result = result.filter(d => norm(d.doc_type_code) === targetType);
    }
    if (filter.academic_year) {
      result = result.filter(d => String(d.academic_year).trim() === String(filter.academic_year).trim());
    }
    if (filter.status) {
      result = result.filter(d => d.status === filter.status);
    }
    if (filter.location_code) {
      result = result.filter(d => d.location_code === filter.location_code);
    }
    if (filter.book_code) {
      const targetBookCode = norm(filter.book_code);
      result = result.filter(d => {
        if (d.book_code && norm(d.book_code) === targetBookCode) return true;
        const synthCode = norm(`BOOK-${d.doc_type_code || 'ปพ.1'}-${d.academic_year || ''}-${d.book_number || '01'}`);
        return synthCode === targetBookCode;
      });
    }
    return result;
  }

  getBooks(filter = {}) {
    let result = [...(this.data.books || [])];
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(b =>
        b.book_code.toLowerCase().includes(q) ||
        b.doc_type_code.toLowerCase().includes(q) ||
        b.book_number.includes(q) ||
        (b.location_code && b.location_code.toLowerCase().includes(q))
      );
    }
    if (filter.doc_type_code) {
      result = result.filter(b => b.doc_type_code === filter.doc_type_code);
    }
    if (filter.academic_year) {
      result = result.filter(b => b.academic_year === filter.academic_year);
    }
    return result;
  }

  getLocations() {
    return [...(this.data.storage_locations || [])];
  }

  getLocationByCode(code) {
    return (this.data.storage_locations || []).find(l => l.code === code);
  }

  // Central Deep Search Algorithm across Students, Documents, Books, Locations, Barcodes & QR
  globalSearch(query) {
    if (!query || !query.trim()) return null;
    const q = query.trim().toLowerCase();

    const matchedStudents = this.getStudents({ search: q });
    const matchedDocs = this.getDocuments({ search: q });
    const matchedBooks = this.getBooks({ search: q });
    const matchedLocations = this.data.storage_locations.filter(l =>
      l.code.toLowerCase().includes(q) ||
      l.building.toLowerCase().includes(q) ||
      l.room.toLowerCase().includes(q) ||
      l.cabinet.toLowerCase().includes(q)
    );

    return {
      query: q,
      students: matchedStudents,
      documents: matchedDocs,
      books: matchedBooks,
      locations: matchedLocations
    };
  }

  // Real-time Fetch & Sync from Google Sheets Database
  async syncFromGoogleSheets(customUrl) {
    if (this.fetchPromise) {
      console.log('[DB] Fetch already running - reusing existing request');
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      console.log('[DB] Fetching remote data...');
      this.DB_STATE.fetching = true;
      this.DB_STATE.lastSyncStatus = 'fetching';
      this.currentSource = this.DATA_SOURCE.GOOGLE;

      try {
        const sheetsUrl = customUrl || (this.data.settings && this.data.settings.sheets_url) || DEFAULT_SHEETS_URL;
    if (!sheetsUrl || !sheetsUrl.includes('script.google.com')) {
      throw new Error('กรุณาระบุ Google Sheets Web App URL ในหน้าตั้งค่าระบบก่อนดำเนินการ');
    }

    const separator = sheetsUrl.includes('?') ? '&' : '?';
    const fetchUrl = `${sheetsUrl}${separator}action=get_all&t=${Date.now()}`;

    let res;
    try {
      res = await fetch(fetchUrl);
    } catch (fetchErr) {
      throw new Error(
        'เชื่อมต่อ Google Apps Script ไม่สำเร็จ (Failed to fetch)\n' +
        '📍 กรุณาตรวจสอบ 3 จุดนี้ใน Google Apps Script:\n' +
        '1) กด Deploy -> Manage Deployments -> แก้ไข -> ตั้งค่า "Who has access" เป็น "Anyone" (ทุกคน)\n' +
        '2) ต้องเลือก Version: "New version" (เวอร์ชันใหม่) ทุกครั้งหลังอัปเดตโค้ด GS แล้วกด Deploy\n' +
        '3) ตรวจสอบว่า URL ในหน้าตั้งค่าระบบลงท้ายด้วย /exec'
      );
    }

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          'ไม่พบ URL ของ Web App (HTTP 404 Not Found)\n' +
          '📍 วิธีแก้ไขปัญหา 404 ใน Google Apps Script:\n' +
          '1) เปิด Google Apps Script -> กดเมนู Deploy -> Manage Deployments\n' +
          '2) กดไอคอนรูปดินสอเพื่อแก้ไข -> ตั้งค่า "Who has access" เป็น "Anyone" (ทุกคน)\n' +
          '3) หากเพิ่งสร้าง Deployment ใหม่ คัดลอก Web App URL ใหม่มาวางในหน้า "ตั้งค่าระบบ"'
        );
      }
      throw new Error(`HTTP Error status: ${res.status}`);
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

    const getFingerprint = (d) => {
      if (!d) return '';
      const s = d.students || [];
      const doc = d.documents || [];
      const b = d.books || [];
      const l = d.loans || [];
      const loc = d.storage_locations || [];
      const u = d.users || [];
      return [
        s.map(i => `${i.student_id}:${i.prefix}:${i.first_name}:${i.last_name}:${i.grade_level}:${i.academic_year}:${i.doc_number}:${i.status}`).join(';'),
        doc.map(i => `${i.doc_code}:${i.student_id}:${i.student_name}:${i.doc_type_code}:${i.academic_year}:${i.book_number}:${i.doc_number}:${i.status}:${i.location_code}`).join(';'),
        b.map(i => `${i.book_code}:${i.doc_type_code}:${i.academic_year}:${i.book_number}:${i.start_number}:${i.end_number}:${i.item_count}:${i.location_code}`).join(';'),
        l.map(i => `${i.id}:${i.student_id}:${i.student_name}:${i.doc_type_code}:${i.requester_name}:${i.status}`).join(';'),
        loc.map(i => `${i.code}:${i.building}:${i.room}:${i.cabinet}:${i.shelf}:${i.folder}`).join(';'),
        u.map(i => `${i.username}:${i.first_name}:${i.last_name}:${i.role_code}`).join(';')
      ].join('||');
    };

    const oldFingerprint = getFingerprint(this.data);
    const sheetData = json.data;
    let studentCount = 0, docCount = 0, bookCount = 0, loanCount = 0, locCount = 0;
    this.data.is_mock_cleared = true;

    if (!this.data.deleted_keys) {
      this.data.deleted_keys = { users: [], students: [], documents: [], books: [], loans: [], storage_locations: [] };
    }

    const deletedUsers = (this.data.deleted_keys.users || []).map(k => String(k).toLowerCase());
    const deletedStudents = (this.data.deleted_keys.students || []).map(k => String(k).toLowerCase());
    const deletedDocs = (this.data.deleted_keys.documents || []).map(k => String(k).toLowerCase());
    const deletedBooks = (this.data.deleted_keys.books || []).map(k => String(k).toLowerCase());
    const deletedLoans = (this.data.deleted_keys.loans || []).map(k => String(k).toLowerCase());
    const deletedLocs = (this.data.deleted_keys.storage_locations || []).map(k => String(k).toLowerCase());

    const extractUrl = (rawStr) => {
      if (!rawStr) return '';
      const str = String(rawStr).trim();
      const match = str.match(/HYPERLINK\("([^"]+)"/i);
      if (match) return match[1];
      if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('blob:')) return str;
      return str;
    };

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
        book_number: String(row[8] || '').trim(),
        file_url: row.length >= 12 ? extractUrl(row[9]) : '',
        file_url_back: row.length >= 12 ? extractUrl(row[10]) : '',
        status: String((row.length >= 12 ? row[11] : row[9]) || 'graduated').trim()
      })).filter(s => s.student_id);

      const uniqueStudents = [];
      const seenStudentIds = new Set();
      parsedStudents.forEach(s => {
        const sid = String(s.student_id).toLowerCase();
        if (!seenStudentIds.has(sid) && !deletedStudents.includes(sid)) {
          seenStudentIds.add(sid);
          uniqueStudents.push(s);
        }
      });

      this.data.students = uniqueStudents;
      studentCount = uniqueStudents.length;
    } else {
      this.data.students = [];
      studentCount = 0;
    }

    // 2. Documents
    if (Array.isArray(sheetData.Documents) && sheetData.Documents.length > 1) {
      const rows = sheetData.Documents.slice(1);
      const parsedDocs = rows.map((row, idx) => {
        let docCode = '', stdId = '', stdName = '', docTypeCode = 'ปพ.1', gradYear = '2565', setNo = '01', docNum = '001', status = 'stored', locationCode = '', fileName = '', rawDriveUrl = '', rawDriveUrlBack = '';

        if (row.length >= 12) {
          docCode = String(row[0] || '').trim();
          stdId = String(row[1] || '').trim();
          stdName = String(row[2] || '').trim();
          docTypeCode = String(row[3] || 'ปพ.1').trim();
          gradYear = String(row[4] || '2565').trim();
          setNo = String(row[5] || '01').trim();
          docNum = String(row[6] || '001').trim();
          status = String(row[7] || 'stored').trim();
          locationCode = String(row[8] || '').trim();
          fileName = String(row[9] || '').trim();
          rawDriveUrl = String(row[10] || '').trim();
          rawDriveUrlBack = String(row[11] || '').trim();
        } else if (row.length >= 9) {
          docCode = String(row[0] || '').trim();
          stdId = String(row[1] || '').trim();
          stdName = String(row[2] || '').trim();
          docTypeCode = String(row[3] || 'ปพ.1').trim();
          gradYear = String(row[4] || '2565').trim();
          setNo = String(row[5] || '01').trim();
          docNum = String(row[6] || '001').trim();
          status = String(row[7] || 'stored').trim();
          locationCode = String(row[8] || '').trim();
        } else {
          docCode = String(row[0] || '').trim();
          docTypeCode = String(row[1] || 'ปพ.1').trim();
          gradYear = String(row[2] || '2565').trim();
          setNo = String(row[3] || '01').trim();
          docNum = String(row[4] || '001').trim();
          status = String(row[5] || 'stored').trim();
          locationCode = String(row[6] || '').trim();
        }

        const driveUrl = extractUrl(rawDriveUrl);
        const driveUrlBack = extractUrl(rawDriveUrlBack);

        return this.sanitizeDocumentItem({
          id: idx + 1,
          doc_code: docCode || `DOC-${docTypeCode.replace('.', '')}-${gradYear}-${setNo}-${docNum}`,
          student_id: stdId,
          student_name: stdName,
          doc_type_code: docTypeCode,
          academic_year: gradYear,
          book_number: setNo,
          doc_number: docNum,
          status: status,
          location_code: locationCode,
          file_name: fileName || `ปพ_${gradYear}_${setNo}_${docNum}.pdf`,
          file_url: driveUrl,
          file_url_back: driveUrlBack,
          book_code: `BOOK-${docTypeCode.replace('.', '')}-${gradYear}-${setNo}`,
          file_size: driveUrl.includes('drive') ? 'Google Drive' : 'N/A'
        });
      }).filter(d => d.doc_code || d.doc_number || d.student_id);

      const uniqueDocs = [];
      const seenDocCodes = new Set();
      parsedDocs.forEach(d => {
        const dcode = String(d.doc_code).toLowerCase();
        if (!seenDocCodes.has(dcode) && !deletedDocs.includes(dcode)) {
          seenDocCodes.add(dcode);
          uniqueDocs.push(d);
        }
      });

      this.data.documents = uniqueDocs;
      docCount = uniqueDocs.length;
    } else {
      this.data.documents = [];
      docCount = 0;
    }

    // 3. Books
    if (Array.isArray(sheetData.Books) && sheetData.Books.length > 1) {
      const rows = sheetData.Books.slice(1);
      const parsedBooks = rows.map((row, idx) => {
        const sNo = String(row[4] || '').trim();
        const eNo = String(row[5] || '').trim();
        const sNum = parseInt(sNo.replace(/\D/g, ''));
        const eNum = parseInt(eNo.replace(/\D/g, ''));
        const calcCount = (!isNaN(sNum) && !isNaN(eNum) && eNum >= sNum) ? (eNum - sNum + 1) : (parseInt(row[6]) || 50);

        return {
          id: idx + 1,
          book_code: String(row[0] || '').trim(),
          doc_type_code: String(row[1] || '').trim(),
          academic_year: String(row[2] || '').trim(),
          book_number: String(row[3] || '').trim(),
          start_no: sNo,
          end_no: eNo,
          item_count: calcCount,
          location_code: String(row[7] || '').trim(),
          status: 'active'
        };
      }).filter(b => b.book_code);

      const uniqueBooks = [];
      const seenBookCodes = new Set();
      parsedBooks.forEach(b => {
        const bcode = String(b.book_code).toLowerCase();
        if (!seenBookCodes.has(bcode) && !deletedBooks.includes(bcode)) {
          seenBookCodes.add(bcode);
          uniqueBooks.push(b);
        }
      });

      this.data.books = uniqueBooks;
      bookCount = uniqueBooks.length;
    } else {
      this.data.books = [];
      bookCount = 0;
    }

    // 4. Loans / Document Copy Requests
    if (Array.isArray(sheetData.Loans) && sheetData.Loans.length > 1) {
      const rows = sheetData.Loans.slice(1);
      const parsedLoans = rows.map((row, idx) => {
        const item = {
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
          status: (String(row[9] || '').includes('รับ') || String(row[9] || '').includes('returned')) ? 'returned' : 'pending'
        };
        return this.sanitizeLoanItem(item);
      }).filter(l => l.loan_code);

      const uniqueLoans = [];
      const seenLoanCodes = new Set();
      parsedLoans.forEach(l => {
        const lcode = String(l.loan_code).toLowerCase();
        if (!seenLoanCodes.has(lcode) && !deletedLoans.includes(lcode)) {
          seenLoanCodes.add(lcode);
          uniqueLoans.push(l);
        }
      });

      this.data.loans = uniqueLoans;
      loanCount = uniqueLoans.length;
    } else {
      this.data.loans = [];
      loanCount = 0;
    }

    // 5. Storage Locations
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
        description: String(row[6] || '').trim()
      })).filter(l => l.code);

      const uniqueLocs = [];
      const seenLocCodes = new Set();
      parsedLocs.forEach(l => {
        const lcode = String(l.code).toLowerCase();
        if (!seenLocCodes.has(lcode) && !deletedLocs.includes(lcode)) {
          seenLocCodes.add(lcode);
          uniqueLocs.push(l);
        }
      });

      this.data.storage_locations = uniqueLocs;
      locCount = uniqueLocs.length;
    } else {
      this.data.storage_locations = [];
      locCount = 0;
    }

    // 6. Users
    let userCount = 0;
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
        status: 'active',
        created_at: String(row[6] || '').trim(),
        password_hash: String(row[7] || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918').trim()
      })).filter(u => u.username);

      const uniqueUsers = [];
      const seenUsernames = new Set();
      parsedUsers.forEach(u => {
        const uname = String(u.username).toLowerCase();
        if (!seenUsernames.has(uname) && !deletedUsers.includes(uname)) {
          seenUsernames.add(uname);
          uniqueUsers.push(u);
        }
      });

      this.data.users = uniqueUsers;
      userCount = uniqueUsers.length;
    } else {
      if (!this.data.users || this.data.users.length === 0) {
        this.seedUsers();
      }
      userCount = this.data.users.length;
    }

    // 7. Settings
    const settingsRowsData = sheetData.Settings || sheetData.settings || sheetData['ตั้งค่าระบบ'];
    if (Array.isArray(settingsRowsData) && settingsRowsData.length > 1) {
      const rows = settingsRowsData.slice(1);
      const parsedSettings = { ...this.data.settings };
      rows.forEach(row => {
        const key = String(row[0] || '').trim();
        const val = String(row[1] || '').trim();
        if (key) {
          parsedSettings[key] = val;
        }
      });
      this.data.settings = parsedSettings;
    }

        this.DB_STATE.lastFetchAt = new Date().toLocaleString('th-TH');
        this.DB_STATE.lastSyncStatus = 'success';
        console.log('[DB] Remote data loaded');

        const newFingerprint = getFingerprint(this.data);
        const dataChanged = (oldFingerprint !== newFingerprint);

        return { studentCount, docCount, bookCount, loanCount, locCount, userCount, dataChanged };
      } catch (fetchErr) {
        this.DB_STATE.lastSyncStatus = 'error';
        throw fetchErr;
      } finally {
        this.DB_STATE.fetching = false;
        this.currentSource = this.DATA_SOURCE.LOCAL;
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  clearMockData() {
    this.data.is_mock_cleared = true;
    this.data.students = [];
    this.data.documents = [];
    this.data.books = [];
    this.data.loans = [];
    this.data.storage_locations = [];
    this.data.users = (this.data.users || []).filter(u => u.username === 'admin');
    this.addAuditLog('ระบบ', 'ล้างข้อมูลสาธิต', 'ล้างข้อมูลปลอมทั้งหมดเพื่อรอรับข้อมูลจริงจาก Google Sheets');
    this.save(false);
  }

  // Push Local Database to Google Sheets
  async syncToGoogleSheets(customUrl) {
    const sheetsUrl = customUrl || (this.data.settings && this.data.settings.sheets_url) || DEFAULT_SHEETS_URL;
    if (!sheetsUrl || !sheetsUrl.includes('script.google.com')) {
      throw new Error('กรุณาระบุ Google Sheets Web App URL ในหน้าตั้งค่าระบบก่อนดำเนินการ');
    }

    if (this.saveInProgress || this.isSyncing) {
      this.saveQueued = true;
      this.hasPendingSync = true;
      console.log('[DB] Save skipped: request already in progress');
      return { status: 'queued', message: 'มีกระบวนการซิงก์ทำงานอยู่แล้ว ได้เข้าคิวข้อมูลล่าสุดไว้เรียบร้อย' };
    }

    this.saveInProgress = true;
    this.isSyncing = true;
    console.log('[DB] Save started');

    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const payload = {
      action: 'sync_database',
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

    let attempts = 0;
    const maxRetries = 3;
    let lastErr = null;

    try {
      while (attempts <= maxRetries) {
        attempts++;
        try {
          let res = await fetch(sheetsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            if (res.status === 404) {
              throw new Error(
                'ไม่พบ URL ของ Web App (HTTP 404 Not Found)\n' +
                '📍 วิธีแก้ไขปัญหา 404 ใน Google Apps Script:\n' +
                '1) เปิด Google Apps Script -> กดเมนู Deploy -> Manage Deployments\n' +
                '2) กดไอคอนรูปดินสอเพื่อแก้ไข -> ตั้งค่า "Who has access" เป็น "Anyone" (ทุกคน)\n' +
                '3) หากเพิ่งสร้าง Deployment ใหม่ คัดลอก Web App URL ใหม่มาวางในหน้า "ตั้งค่าระบบ"'
              );
            }
            throw new Error(`HTTP Error status: ${res.status}`);
          }

          let json;
          try {
            json = await res.json();
          } catch (e) {
            throw new Error('ตอบกลับจาก Google Apps Script ไม่ใช่รูปแบบ JSON กรุณาตรวจสอบการ Re-deploy สคริปต์อีกครั้ง');
          }

          if (json.status === 'error' && (json.code === 'LOCK_TIMEOUT' || String(json.message).includes('Lock Timeout') || String(json.message).includes('อุปกรณ์อื่นกำลังบันทึก'))) {
            if (attempts <= maxRetries) {
              console.warn('[DB] Lock timeout');
              console.warn(`[DB] Retrying ${attempts}/${maxRetries}`);
              if (window.utils && window.utils.showToast) {
                window.utils.showToast(`มีผู้ใช้อื่นกำลังบันทึกข้อมูลอยู่ ระบบกำลังลองใหม่อีกครั้ง (${attempts}/${maxRetries})...`, 'warning', 3000);
              }
              await new Promise(r => setTimeout(r, attempts * 1000));
              continue;
            }
          }

          if (json.status !== 'success') {
            throw new Error(json.message || 'ซิงก์ข้อมูลไป Google Sheets ไม่สำเร็จ');
          }

          this.lastSyncTime = new Date().toLocaleString('th-TH');
          this.lastSyncError = null;
          console.log('[DB] Save success');
          if (window.utils && window.utils.showToast) {
            window.utils.showToast('☁️ บันทึกและอัปเดตข้อมูลลง Google Sheets เรียบร้อยแล้ว', 'success', 3000);
          }
          return json;

        } catch (fetchErr) {
          lastErr = fetchErr;
          if (attempts <= maxRetries && (fetchErr.message.includes('Lock Timeout') || fetchErr.message.includes('อุปกรณ์อื่นกำลังบันทึก'))) {
            console.warn('[DB] Lock timeout');
            console.warn(`[DB] Retrying ${attempts}/${maxRetries}`);
            await new Promise(r => setTimeout(r, attempts * 1000));
            continue;
          }
          this.lastSyncError = fetchErr.message;
          throw fetchErr;
        }
      }
      throw lastErr || new Error('ซิงก์ข้อมูลไม่สำเร็จล้มเหลวเกินจำนวนครั้งที่กำหนด');
    } finally {
      this.saveInProgress = false;
      this.isSyncing = false;
      if (this.saveQueued || this.hasPendingSync) {
        this.saveQueued = false;
        this.hasPendingSync = false;
        setTimeout(() => this.triggerAutoSyncToSheets(true), 50);
      }
    }
  }

  getSyncStatus() {
    return {
      isSyncing: this.saveInProgress || this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastSyncError
    };
  }

  // Upload Camera Captured Photo or Scanner File to Google Drive Album via Apps Script API (Disabled per user requirement)
  async uploadScanFileToDrive(fileOrBlob, fileName = 'scan_document.png', bookCode = 'UNASSIGNED') {
    console.log('File and document storage on Google Drive is disabled.');
    return null;
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
    this.save(false);
  }
}

// Global Database Instance Singleton
window.db = new RelationalDatabase();
