# คู่มือการติดตั้งระบบ (Installation Guide) - EDMRS

## ข้อกำหนดระบบ (System Requirements)
- **Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox หรือ Safari เวอร์ชันล่าสุด
- **Node.js**: เวอร์ชัน 18.x ขึ้นไป (กรณีรันระบบ Server Backend)
- **PostgreSQL**: เวอร์ชัน 14.x ขึ้นไป (กรณีเชื่อมต่อฐานข้อมูลการผลิต)

---

## ขั้นตอนการติดตั้ง

### วิธีที่ 1: การใช้งานแบบ Standalone (เปิดใช้งานทันที)
1. แตกไฟล์ ZIP หรือคัดลอกโปรเจกต์ไปยังโฟลเดอร์ที่ต้องการ
2. ดับเบิลคลิกไฟล์ `index.html` เพื่อเปิดใช้งานผ่านเว็บเบราว์เซอร์
3. ระบบจะสร้างและโหลดฐานข้อมูล Relational Seed Data ขึ้นมาใช้งานโดยอัตโนมัติ

### วิธีที่ 2: การติดตั้งและรันผ่าน Node.js Server
1. เปิด Terminal / PowerShell ไปยังโฟลเดอร์โปรเจกต์:
   ```bash
   cd d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. เริ่มต้นรันเซิร์ฟเวอร์:
   ```bash
   npm run dev
   ```
4. เข้าใช้งานผ่านเบราว์เซอร์ที่: `http://localhost:5000`
