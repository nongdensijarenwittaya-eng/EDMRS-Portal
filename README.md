# EDMRS - ระบบจัดเก็บและสืบค้นข้อมูลเอกสารทางการศึกษา (ปพ.)
## Educational Document Management and Retrieval System

ระบบบริหารจัดการเอกสารทางการศึกษา (ปพ.1 ถึง ปพ.9) ประจำสถานศึกษาแบบครบวงจร พร้อมระบบสืบค้นตำแหน่งจัดเก็บเชิงกายภาพ 6 ระดับ (อาคาร → ห้อง → ตู้ → ชั้น → แฟ้ม → เล่ม → เลขที่เอกสาร), QR Code / Barcode Scanner, ระบบยืม–คืนเอกสารอัตโนมัติ, Audit Log และรายงานสารสนเทศสำหรับผู้บริหาร

---

## 🌟 คุณสมบัติหลักของระบบ (Key Features)

1. **เพิ่มข้อมูล (Add Data)**:
   - เพิ่มรายชื่อนักเรียน, ทะเบียนเอกสาร ปพ.1 - ปพ.9, ทะเบียนเล่มเอกสาร, สถานที่จัดเก็บ และบัญชีผู้ใช้งาน

2. **แก้ไขข้อมูล (Edit Data)**:
   - แก้ไขประวัติข้อมูลนักเรียน, ข้อมูลเอกสาร ปพ., เลขเล่ม/ชุด, สถานที่จัดเก็บ และสถานะเอกสาร

3. **ลบข้อมูล (Delete Data)**:
   - ลบรายการข้อมูลที่ไม่ต้องการ พร้อมซิงก์สถานะการลบไปยัง Google Sheets อัตโนมัติ

4. **ค้นหาข้อมูล (Search Data)**:
   - ระบบค้นหาข้อมูลแบบรวมศูนย์ (Central Search): ค้นหาด้วยรหัสนักเรียน, ชื่อ-นามสกุล, เลขที่เอกสาร, เล่มที่ หรือ Location Code (เช่น `LOC-A03-02-04`)
   - แสดงแผนผังเส้นทางระบุตำแหน่งจัดเก็บเชิงกายภาพ (Visual Location Flow)

5. **ดึงข้อมูลจาก Google Sheets มาแสดงบนเว็บไซต์ (Fetch Data)**:
   - กดปุ่มดึงข้อมูล (`☁️⬇️`) เพื่อดึงข้อมูลล่าสุดจาก Google Sheets มาแสดงผลบนเว็บไซต์

6. **บันทึกข้อมูลจากเว็บไซต์ลง Google Sheets (Save Data)**:
   - กดปุ่มบันทึกข้อมูล (`☁️⬆️`) เพื่อส่งและบันทึกข้อมูลบนเว็บไซต์ลง Google Sheets (Source of Truth)

---
> [!NOTE]
> - **ไม่มีการบันทึกไฟล์ใดๆ ทั้งในระบบและใน Google Drive**
> - **ไม่มีระบบสแกนเอกสาร**

## 🔐 บัญชีผู้ใช้งานทดสอบระบบ (Demo Accounts)

| ชื่อผู้ใช้งาน (Username) | รหัสผ่าน (Password) | บทบาทหน้าที่ (Role) | สิทธิ์การทำงาน (Permissions) |
| :--- | :--- | :--- | :--- |
| **admin** | `admin123` | **Super Admin** | เข้าถึงและจัดการได้ทุกระบบสูงสุด |
| **registrar** | `admin123` | **Administrator** | จัดการทะเบียน นักเรียน เอกสาร และสิทธิ์ |
| **staff** | `staff123` | **Staff** | เพิ่ม/แก้ไข/ค้นหาเอกสาร ยืม-คืน |
| **viewer** | `viewer123` | **Viewer** | ค้นหาและดูข้อมูลได้อย่างเดียว (Read-Only) |

---

## 🚀 การเปิดใช้งานระบบ (Quick Start)

> [!WARNING]
> **ห้ามเปิดไฟล์ `index.html` โดยการดับเบิลคลิก (Double-click / `file:///`)** เนื่องจาก Google Chrome และ Modern Browsers จะบล็อก Origin Security (`file:` URLs are treated as unique security origins) ทำให้ไม่สามารถโหลดและสลับหน้า Hash Router ได้

กรุณาเลือกเปิดระบบผ่าน HTTP Development Server ด้วยวิธีใดวิธีหนึ่งดังต่อไปนี้:

### วิธีที่ 1: รันผ่าน Node.js Server (แนะนำ)
เปิด Terminal ที่โฟลเดอร์โปรเจกต์ แล้วรัน:
```bash
npm install
npm run dev
```
เปิดเว็บเบราว์เซอร์ไปที่: `http://localhost:5000`

### วิธีที่ 2: รันผ่าน Python HTTP Server
เปิด Terminal ที่โฟลเดอร์โปรเจกต์ แล้วรัน:
```bash
python -m http.server 5500
```
เปิดเว็บเบราว์เซอร์ไปที่: `http://localhost:5500`

### วิธีที่ 3: เปิดด้วย VS Code Live Server
1. เปิดโฟลเดอร์โปรเจกต์ด้วย VS Code
2. ติดตั้ง Extension **Live Server**
3. คลิกขวาที่ `index.html` เลือก **Open with Live Server** (ระบบจะเปิดผ่าน `http://127.0.0.1:5500/`)

---

## 🌐 การ Deploy บน Vercel Production
โปรเจกต์นี้มาพร้อมไฟล์ `vercel.json` ที่ตั้งค่าการทำงานพร้อมขึ้น Production บน Vercel:
1. Push โปรเจกต์ขึ้น GitHub
2. เข้าสู่ระบบ [Vercel](https://vercel.com) แล้วกด **Import Project**
3. กด **Deploy** เว็บไซต์จะพร้อมใช้งานผ่าน HTTPS ทันที

---

## 📚 เอกสารคู่มือการใช้งานและการบริหารจัดการ (Documentation List)

1. [คู่มือการติดตั้งระบบ (Installation Guide)](docs/INSTALLATION_GUIDE.md)
2. [คู่มือการใช้งานสำหรับเจ้าหน้าที่ (User Manual)](docs/USER_MANUAL.md)
3. [คู่มือผู้ดูแลระบบ (Admin Guide)](docs/ADMIN_GUIDE.md)
4. [เอกสารอ้างอิง REST API (API Documentation)](docs/API_DOCUMENTATION.md)
5. [คู่มือการ Deploy บน Production (Deployment Guide)](docs/DEPLOYMENT_GUIDE.md)
6. [คู่มือการสำรองและกู้คืนฐานข้อมูล (Backup & Restore Guide)](docs/BACKUP_RESTORE_GUIDE.md)
7. [วิธีการสร้างบัญชี Admin ใหม่ (Create Admin Account)](docs/CREATE_ADMIN.md)
8. [วิธีการเปลี่ยน Logo โรงเรียน (Change Logo)](docs/CHANGE_LOGO.md)
9. [วิธีการเพิ่มประเภทเอกสาร ปพ. (Add Doc Types)](docs/ADD_DOC_TYPES.md)
10. [วิธีการเพิ่มปีการศึกษาใหม่ (Add Academic Years)](docs/ADD_ACADEMIC_YEARS.md)

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
