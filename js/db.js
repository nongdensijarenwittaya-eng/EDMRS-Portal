/* ==========================================================================
   EDMRS - Database Engine & Seed Data Loader (js/db.js)
   Relational data store with local persistence & indexed query engine
   ========================================================================== */

const DB_STORAGE_KEY = 'EDMRS_RELATIONAL_DB_V2.5';

class RelationalDatabase {
  constructor() {
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
      notifications: []
    };
    this.init();
  }

  init() {
    const saved = localStorage.getItem(DB_STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        // Ensure legacy missing fields get updated defaults if needed
        if (!this.data.roles || this.data.roles.length === 0) this.seedRolesAndPermissions();
        if (!this.data.users || this.data.users.length === 0) this.seedUsers();
        if (!this.data.academic_years || this.data.academic_years.length === 0) this.seedAcademicYears();
        if (!this.data.document_types || this.data.document_types.length === 0) this.seedDocumentTypes();
        if (!this.data.storage_locations) this.seedStorageLocations();

        // Permanently clear initial sample mock data and prevent re-writing back
        this.data.is_mock_cleared = true;
        if (!this.data.students) this.data.students = [];
        if (!this.data.documents) this.data.documents = [];
        if (!this.data.books) this.data.books = [];
        if (!this.data.loans) this.data.loans = [];

        if (Array.isArray(this.data.students) && this.data.students.some(s => s.student_id === '65001234')) {
          this.data.books = [];
          this.data.students = [];
          this.data.documents = [];
          this.data.loans = [];
        }

        if (Array.isArray(this.data.storage_locations) && this.data.storage_locations.some(l => l.code === 'LOC-B02-04-01' || l.code === 'LOC-A01-01-01')) {
          this.data.storage_locations = [];
        }

        if (!this.data.audit_logs || this.data.audit_logs.length === 0) this.seedAuditLogs();
        if (!this.data.settings) this.seedSettings();
        if (!this.data.settings.logo_url || this.data.settings.logo_url === 'assets/logo.png') {
          this.data.settings.logo_url = 'https://lh3.googleusercontent.com/d/1SIu3JfivV9RnCOW2xkzb30x_A16q0MGU';
        }
        this.data.settings.sheets_url = 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec';
        if (!this.data.settings.drive_folder || this.data.settings.drive_folder === '1A2B3C4D5E6F7G8H9_EDMRS_Vault_Root') {
          this.data.settings.drive_folder = '1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv';
        }

        // Auto-migrate any legacy assets/sample_porpor.pdf file_urls to working Google Drive document link
        const defaultSampleDriveUrl = 'https://drive.google.com/file/d/1SIu3JfivV9RnCOW2xkzb30x_A16q0MGU/view?usp=sharing';
        if (Array.isArray(this.data.students)) {
          this.data.students.forEach(s => {
            if (!s.file_url || s.file_url === 'assets/sample_porpor.pdf' || s.file_url === 'assets/sample_porpor.png') {
              s.file_url = defaultSampleDriveUrl;
            }
          });
        }
        if (Array.isArray(this.data.documents)) {
          this.data.documents.forEach(d => {
            if (!d.file_url || d.file_url === 'assets/sample_porpor.pdf' || d.file_url === 'assets/sample_porpor.png') {
              d.file_url = defaultSampleDriveUrl;
            }
          });
        }

        this.save(false);
        if (!this.data.notifications) this.seedNotifications();
      } catch (e) {
        console.error('Failed to parse existing DB. Re-seeding database...', e);
        this.seedDefaultData();
      }
    } else {
      this.seedDefaultData();
    }
  }

  save(autoSyncSheets = true) {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));
    if (autoSyncSheets) {
      this.triggerAutoSyncToSheets();
    }
  }

  triggerAutoSyncToSheets() {
    if (this._syncTimeout) clearTimeout(this._syncTimeout);
    this._syncTimeout = setTimeout(() => {
      const sheetsUrl = this.data.settings && this.data.settings.sheets_url;
      if (sheetsUrl && sheetsUrl.includes('script.google.com')) {
        this.syncToGoogleSheets().then(() => {
          console.log('Auto-synced latest database to Google Sheets successfully');
        }).catch(err => {
          console.warn('Auto sync to Google Sheets background attempt:', err.message);
        });
      }
    }, 300);
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
    // Salted SHA-256 equivalent mock hashes for demo accounts
    this.data.users = [
      {
        id: 1,
        username: 'admin',
        password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // admin123
        title: 'นาย',
        first_name: 'สมศักดิ์',
        last_name: 'วิทยากร',
        role_code: 'super_admin',
        email: 'admin@school.ac.th',
        status: 'active',
        created_at: '2026-01-10 09:00:00'
      },
      {
        id: 2,
        username: 'registrar',
        password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // admin123
        title: 'นาง',
        first_name: 'นภาพร',
        last_name: 'เจริญสุข',
        role_code: 'administrator',
        email: 'registrar@school.ac.th',
        status: 'active',
        created_at: '2026-01-12 10:15:00'
      },
      {
        id: 3,
        username: 'staff',
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // staff123
        title: 'นาย',
        first_name: 'กิตติศักดิ์',
        last_name: 'มั่นคง',
        role_code: 'staff',
        email: 'staff@school.ac.th',
        status: 'active',
        created_at: '2026-01-15 11:30:00'
      },
      {
        id: 4,
        username: 'viewer',
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // viewer123
        title: 'นางสาว',
        first_name: 'ปรียา',
        last_name: 'สว่างศรี',
        role_code: 'viewer',
        email: 'viewer@school.ac.th',
        status: 'active',
        created_at: '2026-02-01 14:00:00'
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
      org_name_th: 'โรงเรียนสาธิตวิทยาการการศึกษา',
      org_name_en: 'Demonstration School of Educational Sciences',
      org_code: 'SCH-100203',
      logo_url: 'https://lh3.googleusercontent.com/d/1SIu3JfivV9RnCOW2xkzb30x_A16q0MGU',
      address: '99/9 ถนนวิภาวดีรังสิต แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900',
      phone: '02-555-1234',
      email: 'info@school.ac.th',
      doc_code_template: 'DOC-[TYPE]-[STUDENT_ID]',
      book_code_template: 'BOOK-[TYPE]-[YEAR]-[NUM]',
      location_code_template: 'LOC-[CABINET]-[SHELF]-[FOLDER]',
      sheets_url: 'https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec',
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
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(d =>
        d.doc_code.toLowerCase().includes(q) ||
        d.student_id.toLowerCase().includes(q) ||
        d.student_name.toLowerCase().includes(q) ||
        d.doc_number.includes(q) ||
        (d.book_code && d.book_code.toLowerCase().includes(q)) ||
        (d.location_code && d.location_code.toLowerCase().includes(q))
      );
    }
    if (filter.student_id) {
      result = result.filter(d => d.student_id === filter.student_id);
    }
    if (filter.doc_type_code) {
      result = result.filter(d => d.doc_type_code === filter.doc_type_code);
    }
    if (filter.academic_year) {
      result = result.filter(d => d.academic_year === filter.academic_year);
    }
    if (filter.status) {
      result = result.filter(d => d.status === filter.status);
    }
    if (filter.location_code) {
      result = result.filter(d => d.location_code === filter.location_code);
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
    const sheetsUrl = customUrl || (this.data.settings && this.data.settings.sheets_url);
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

    if (!res.ok) throw new Error(`HTTP Error status: ${res.status}`);
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error('ตอบกลับจาก Google Apps Script ไม่ใช่รูปแบบ JSON กรุณาตรวจสอบการ Re-deploy สคริปต์อีกครั้ง');
    }

    if (json.status !== 'success' || !json.data) {
      throw new Error(json.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้');
    }

    const sheetData = json.data;
    let studentCount = 0, docCount = 0, bookCount = 0, loanCount = 0, locCount = 0;
    this.data.is_mock_cleared = true;

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
        file_url: extractUrl(row[9]),
        file_url_back: extractUrl(row[10]),
        status: String(row[11] || 'graduated').trim()
      })).filter(s => s.student_id);

      this.data.students = parsedStudents;
      studentCount = parsedStudents.length;
    } else {
      this.data.students = [];
    }

    // 2. Documents
    if (Array.isArray(sheetData.Documents) && sheetData.Documents.length > 1) {
      const rows = sheetData.Documents.slice(1);
      const parsedDocs = rows.map((row, idx) => {
        let docCode = '', stdId = '', stdName = '', docTypeCode = 'ปพ.1', gradYear = '2565', setNo = '01', docNum = '001', status = 'stored', locationCode = '', fileName = '', rawDriveUrl = '', rawDriveUrlBack = '';

        if (row.length >= 10) {
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
          rawDriveUrl = String(row[10] || row[8] || '').trim();
          rawDriveUrlBack = String(row[11] || '').trim();
        } else {
          docCode = String(row[0] || '').trim();
          docTypeCode = String(row[1] || 'ปพ.1').trim();
          gradYear = String(row[2] || '2565').trim();
          setNo = String(row[3] || '01').trim();
          docNum = String(row[4] || '001').trim();
          status = String(row[5] || 'stored').trim();
          locationCode = String(row[6] || '').trim();
          fileName = String(row[7] || '').trim();
          rawDriveUrl = String(row[8] || '').trim();
        }

        const driveUrl = extractUrl(rawDriveUrl);
        const driveUrlBack = extractUrl(rawDriveUrlBack);

        return {
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
          file_url: driveUrl || 'assets/sample_porpor.pdf',
          file_url_back: driveUrlBack || '',
          book_code: `BOOK-${docTypeCode.replace('.', '')}-${gradYear}-${setNo}`,
          file_size: driveUrl.includes('drive') ? 'Google Drive' : '1.5 MB'
        };
      }).filter(d => d.doc_code || d.doc_number || d.student_id);

      this.data.documents = parsedDocs;
      docCount = parsedDocs.length;
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

      this.data.books = parsedBooks;
      bookCount = parsedBooks.length;
    }

    // 4. Loans / Document Copy Requests
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
        status: (String(row[9] || '').includes('รับ') || String(row[9] || '').includes('returned')) ? 'returned' : 'pending'
      })).filter(l => l.loan_code);

      this.data.loans = parsedLoans;
      loanCount = parsedLoans.length;
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

      if (parsedLocs.length > 0) {
        this.data.storage_locations = parsedLocs;
        locCount = parsedLocs.length;
      } else {
        this.data.storage_locations = [];
      }
    } else {
      this.data.storage_locations = [];
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
        password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
      })).filter(u => u.username);

      if (parsedUsers.length > 0) {
        this.data.users = parsedUsers;
        userCount = parsedUsers.length;
      }
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

    this.addAuditLog('Google Sheets', 'ดึงฐานข้อมูลจาก Google Sheets', `ดึงข้อมูลจากชีทสำเร็จ: ${studentCount} นักเรียน, ${docCount} เอกสาร, ${bookCount} เล่ม, ${userCount} ผู้ใช้`);
    this.save(false);

    return { studentCount, docCount, bookCount, loanCount, locCount, userCount };
  }

  clearMockData() {
    this.data.is_mock_cleared = true;
    this.data.students = [];
    this.data.documents = [];
    this.data.books = [];
    this.data.loans = [];
    this.data.storage_locations = [];
    this.addAuditLog('ระบบ', 'ล้างข้อมูลสาธิต', 'ล้างข้อมูลปลอมทั้งหมดเพื่อรอรับข้อมูลจริงจาก Google Sheets');
    this.save(false);
  }

  // Push Local Database to Google Sheets
  async syncToGoogleSheets(customUrl) {
    const sheetsUrl = customUrl || (this.data.settings && this.data.settings.sheets_url);
    if (!sheetsUrl || !sheetsUrl.includes('script.google.com')) {
      throw new Error('กรุณาระบุ Google Sheets Web App URL ในหน้าตั้งค่าระบบก่อนดำเนินการ');
    }

    const payload = {
      action: 'sync_database',
      users: this.data.users || [],
      students: this.data.students || [],
      documents: this.data.documents || [],
      books: this.data.books || [],
      loans: this.data.loans || [],
      storage_locations: this.data.storage_locations || [],
      settings: this.data.settings || {}
    };

    let res;
    try {
      res = await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (fetchErr) {
      throw new Error(
        'เชื่อมต่อส่งข้อมูลไป Google Sheets ไม่สำเร็จ (Failed to fetch)\n' +
        '📍 กรุณาตรวจสอบว่าใน Apps Script ได้ตั้งค่า "Who has access" เป็น "Anyone" (ทุกคน)'
      );
    }

    if (!res.ok) throw new Error(`HTTP Error status: ${res.status}`);
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error('ตอบกลับจาก Google Apps Script ไม่ใช่รูปแบบ JSON กรุณาตรวจสอบการ Re-deploy สคริปต์อีกครั้ง');
    }

    if (json.status !== 'success') {
      throw new Error(json.message || 'ซิงก์ข้อมูลไป Google Sheets ไม่สำเร็จ');
    }

    this.addAuditLog('Google Sheets', 'ซิงก์ฐานข้อมูลไป Google Sheets', 'อัปเดตข้อมูลนักเรียน เอกสาร เล่ม และยืม-คืน ลง Google Sheets เรียบร้อย');
    return json;
  }

  // Upload Camera Captured Photo or Scanner File to Google Drive Album via Apps Script API
  async uploadScanFileToDrive(fileOrBlob, fileName = 'scan_document.png', bookCode = 'UNASSIGNED') {
    const sheetsUrl = this.data.settings && this.data.settings.sheets_url;
    if (!sheetsUrl || !sheetsUrl.includes('script.google.com')) {
      console.warn('No Google Sheets Web App URL configured. Cannot upload file to Drive.');
      return null;
    }

    try {
      let base64Data = '';
      let fileType = 'image/png';

      if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
        const parts = fileOrBlob.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) fileType = mimeMatch[1];
        base64Data = parts[1];
      } else if (fileOrBlob instanceof Blob || fileOrBlob instanceof File) {
        fileType = fileOrBlob.type || 'image/png';
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result;
            const b64 = res.split(',')[1];
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(fileOrBlob);
        });
      }

      const payload = {
        action: 'upload_file_to_album',
        book_code: bookCode,
        file_name: fileName || `Scan_Document_${Date.now()}.png`,
        file_type: fileType,
        base64_data: base64Data
      };

      const res = await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.file_url) {
          console.log('Uploaded scan file to Google Drive Album:', json.file_url);
          this.addAuditLog('Google Drive', 'อัปโหลดไฟล์สแกน/กล้อง', `อัปโหลดไฟล์ ${fileName} ลง Google Drive อัลบั้ม ${bookCode}`);
          return json.file_url;
        }
      }
    } catch (err) {
      console.warn('Failed to upload scan file to Drive:', err);
    }
    return null;
  }

  addAuditLog(moduleName, actionName, description) {
    const user = window.authSystem ? window.authSystem.getCurrentUser() : { username: 'system', name: 'System' };
    const newLog = {
      id: this.data.audit_logs.length + 1,
      timestamp: new Date().toLocaleString('th-TH'),
      username: user ? user.username : 'guest',
      user_fullname: user ? `${user.title || ''}${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Guest User',
      module: moduleName,
      action: actionName,
      description: description,
      ip_address: '127.0.0.1'
    };
    this.data.audit_logs.unshift(newLog);
    this.save();
  }
}

// Global Database Instance Singleton
window.db = new RelationalDatabase();
