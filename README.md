# EDMRS - ระบบจัดเก็บและสืบค้นข้อมูลเอกสารทางการศึกษา (ปพ.)
## Educational Document Management and Retrieval System

ระบบบริหารจัดการเอกสารทางการศึกษา (ปพ.1 ถึง ปพ.9) ประจำสถานศึกษาแบบครบวงจร พร้อมระบบสืบค้นตำแหน่งจัดเก็บเชิงกายภาพ 6 ระดับ (อาคาร → ห้อง → ตู้ → ชั้น → แฟ้ม → เล่ม → เลขที่เอกสาร), QR Code / Barcode Scanner, ระบบยืม–คืนเอกสารอัตโนมัติ, Audit Log และรายงานสารสนเทศสำหรับผู้บริหาร

---

## 🌟 คุณสมบัติเด่นของระบบ (Key Features)

1. **ระบบสืบค้นตำแหน่งจัดเก็บเชิงลึก (Central Deep Search & Location Flow)**:
   - ตอบคำถามได้ทันทีว่า **"เอกสาร ปพ. ของนักเรียนคนนี้อยู่ที่ไหน?"**
   - แสดงแผนผังเส้นทาง: `อาคารสำนักงาน → ห้องทะเบียน 101 → ตู้ A-03 → ชั้น 02 → แฟ้ม 04 → เล่ม ปพ.1/2565/03 → เลขที่ 087`
   - รหัส Location Code อัตโนมัติ เช่น `LOC-A03-02-04`

2. **ระบบทะเบียนเอกสาร ปพ.1 - ปพ.9 & Multi-Source Digital File Scanning**:
   - รองรับเอกสาร ปพ.1 ถึง ปพ.9 และสามารถเพิ่มประเภทเอกสารใหม่ได้อย่างอิสระโดยผู้ดูแลระบบ (ไม่ต้อง Hard-code)
   - รองรับการเพิ่มไฟล์สแกนดิจิทัล (PDF, JPG, JPEG, PNG) ผ่าน 3 ช่องทาง:
     1. **อัปโหลดไฟล์จากเครื่อง/โทรศัพท์มือถือ** (พร้อมระบบตรวจสอบประเภทไฟล์และขนาดไฟล์ไม่เกิน 10MB)
     2. **สแกนด้วยกล้องสด (Mobile/Webcam Scanner)** ถ่ายภาพเอกสารฉบับจริงจากกล้องมือถือ/เว็บแคม แล้วแปลงเป็นไฟล์สแกนดิจิทัลทันที
     3. **รับภาพจากเครื่องปริ้นต์/สแกนเนอร์** (Printer/Scanner Device Interface)

3. **ระบบสแกน QR Code & Barcode**:
   - สร้าง QR Code และ Barcode อัตโนมัติสำหรับ นักเรียน, เล่มเอกสาร, ตู้ และตำแหน่งจัดเก็บ
   - รองรับการสแกนผ่านกล้องถ่ายรูป หรือไฟล์รูปภาพเพื่อเปิดหน้าข้อมูลฉับไว
   - รองรับการพิมพ์แผ่นสติกเกอร์ Label (Single & Bulk Sheet Printing)

4. **ระบบยืม–คืนเอกสารพร้อมสถานะอัตโนมัติ**:
   - เมื่อยืมเอกสาร ระบบเปลี่ยนสถานะเอกสารเป็น **"ยืมออก"** โดยอัตโนมัติ
   - เมื่อคืนเอกสาร ระบบเปลี่ยนสถานะเป็น **"จัดเก็บแล้ว"** และคืนกลับเข้าคลังจัดเก็บเดิม
   - ติดตามรายการยืมเกินกำหนดคืน (Overdue Tracking)

5. **หน้าตรวจสอบเอกสาร (Verification Matrix Checklist)**:
   - ตารางตรวจสอบความครบถ้วนของเอกสาร ปพ.1, ปพ.2, ปพ.3 แยกตามปีการศึกษา/ระดับชั้น/ห้อง พร้อมสัญลักษณ์ (✓, ✕, ⚠️)

6. **ระบบความปลอดภัย & Role-Based Access Control (RBAC)**:
   - สิทธิ์ใช้งาน 4 ระดับ: `Super Admin`, `Administrator`, `Staff`, `Viewer`
   - รหัสผ่านเข้ารหัส Salted SHA-256
   - ระบบประวัติการดำเนินงาน (Audit Log) บันทึกทุกการเข้าถึง แก้ไข และยืม-คืน

7. **ระบบรายงาน & สถิติ (10 รายงาน)**:
   - ส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx), CSV, PDF และพิมพ์เอกสาร

8. **ระบบสำรองข้อมูล (Backup & Restore)**:
   - สร้างและกู้คืนไฟล์สำรองฐานข้อมูล JSON Dump พร้อมการแจ้งเตือนระยะเวลาสำรอง

9. **ระบบเชื่อมต่อ Google Drive Albums & Google Sheets Integration**:
   - บันทึกและซิงก์ข้อมูลทะเบียน ปพ., ทะเบียนเล่ม และประวัตินักเรียนลง **Google Sheets** แบบ Real-Time
   - สร้างโฟลเดอร์อัลบั้มแยกตาม **ทะเบียนเล่มเอกสาร** ใน **Google Drive** โดยอัตโนมัติ (`Google Drive / EDMRS_Vault / [BOOK_CODE] /`)

---

## 🔐 บัญชีผู้ใช้งานทดสอบระบบ (Demo Accounts)

| ชื่อผู้ใช้งาน (Username) | รหัสผ่าน (Password) | บทบาทหน้าที่ (Role) | สิทธิ์การทำงาน (Permissions) |
| :--- | :--- | :--- | :--- |
| **admin** | `admin123` | **Super Admin** | เข้าถึงและจัดการได้ทุกระบบสูงสุด |
| **registrar** | `admin123` | **Administrator** | จัดการทะเบียน นักเรียน เอกสาร และสิทธิ์ |
| **staff** | `staff123` | **Staff** | เพิ่ม/แก้ไข/ค้นหาเอกสาร ยืม-คืน |
| **viewer** | `viewer123` | **Viewer** | ค้นหาและดูข้อมูลได้อย่างเดียว (Read-Only) |

---

## 🚀 การติดตั้งและเปิดใช้งานระบบ (Quick Start)

### วิธีที่ 1: เปิดใช้งานโดยตรงผ่านเว็บเบราว์เซอร์ (Zero Friction Browser Mode)
ไม่ต้องติดตั้ง Server หรือตั้งค่าฐานข้อมูลให้ยุ่งยาก เพียงดับเบิลคลิกไฟล์:
```text
index.html
```
ระบบ Relational Data Engine และ Seed Data 20 นักเรียน, 50 เอกสาร, 5 เล่ม และ 10 ตำแหน่งจัดเก็บจะถูกโหลดขึ้นมาพร้อมใช้งานทันที 100%

### วิธีที่ 2: รันผ่าน Node.js Server (Production Backend Mode)
```bash
npm install
npm run dev
```
เปิดเว็บเบราว์เซอร์ไปที่: `http://localhost:5000`

---

## 📚 เอกสารคู่มือการใช้งานและการบริหารจัดการ (Documentation List)

1. [คู่มือการติดตั้งระบบ (Installation Guide)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/INSTALLATION_GUIDE.md)
2. [คู่มือการใช้งานสำหรับเจ้าหน้าที่ (User Manual)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/USER_MANUAL.md)
3. [คู่มือผู้ดูแลระบบ (Admin Guide)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/ADMIN_GUIDE.md)
4. [เอกสารอ้างอิง REST API (API Documentation)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/API_DOCUMENTATION.md)
5. [คู่มือการ Deploy บน Production (Deployment Guide)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/DEPLOYMENT_GUIDE.md)
6. [คู่มือการสำรองและกู้คืนฐานข้อมูล (Backup & Restore Guide)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/BACKUP_RESTORE_GUIDE.md)
7. [วิธีการสร้างบัญชี Admin ใหม่ (Create Admin Account)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/CREATE_ADMIN.md)
8. [วิธีการเปลี่ยน Logo โรงเรียน (Change Logo)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/CHANGE_LOGO.md)
9. [วิธีการเพิ่มประเภทเอกสาร ปพ. (Add Doc Types)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/ADD_DOC_TYPES.md)
10. [วิธีการเพิ่มปีการศึกษาใหม่ (Add Academic Years)](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/docs/ADD_ACADEMIC_YEARS.md)

---

## 🛠️ โครงสร้างโปรเจกต์ (Project Structure)

```text
educational-document-system/
├── css/
│   ├── main.css           # Master CSS Tokens & Reset
│   ├── components.css     # Buttons, Modals, Tables, Flow Diagrams
│   ├── dashboard.css      # KPI Cards, Charts & Login UI
│   └── responsive.css     # Mobile Breakpoints & Print Stylesheet
├── js/
│   ├── db.js              # Relational Data Engine & Seed Loader
│   ├── auth.js            # RBAC Authentication & Session Guard
│   ├── utils.js           # Toasts, Modals, QR/Barcode, Excel Exporters
│   ├── router.js          # SPA Hash Navigation Guard Router
│   ├── app.js             # Master App Shell Controller
│   └── views/             # 16 Functional View Controllers
├── backend/
│   └── server.js          # Production Node.js Express REST API Blueprint
├── database/
│   ├── schema/schema.sql  # PostgreSQL DDL Database Schema
│   └── seeds/seed.sql     # Initial Relational Database Seeds
├── docs/                  # 10 Detailed Markdown Documentation Guides
├── index.html             # Application Entry File
├── package.json           # Node.js Package Manifest
├── .env.example           # Production Environment Variables Blueprint
└── README.md              # Project Manual & Architecture Overview
```

---
© 2026 Educational Document Management and Retrieval System (EDMRS).
