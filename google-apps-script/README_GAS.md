# คู่มือการติดตั้งและตั้งค่า Google Apps Script (Code.gs)
## EDMRS - Google Sheets & Google Drive Integration Guide

โปรแกรม **Google Apps Script (`Code.gs`)** ช่วยให้ระบบ EDMRS สามารถเชื่อมต่อบันทึกข้อมูลลง **Google Sheets** แบบอัตโนมัติ และสร้างโฟลเดอร์ **อัลบั้มประจำทะเบียนเล่มใน Google Drive** ได้โดยตรง

---

## 🛠️ ขั้นตอนการติดตั้ง 5 นาที

### ขั้นตอนที่ 1: สร้าง Google Sheet
1. เข้าไปที่ [Google Sheets](https://sheets.google.com)
2. กดสร้างสเปรดชีตใหม่ ตั้งชื่อว่า **`EDMRS_Database_Master`**

### ขั้นตอนที่ 2: เปิด Apps Script Editor
1. ในหน้า Google Sheets ให้ไปที่เมนู **Extensions (ส่วนขยาย)** → **Apps Script**
2. ลบโค้ดเดิมใน `Code.gs` ออกทั้งหมด

### ขั้นตอนที่ 3: วางโค้ด `Code.gs`
1. เปิดไฟล์ [`google-apps-script/Code.gs`](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/google-apps-script/Code.gs) ในโปรเจกต์นี้
2. คัดลอกโค้ดทั้งหมด ไปวางในช่อง `Code.gs` บน Google Apps Script Editor
3. บรรทัดที่ 19 มีการกำหนด ID โฟลเดอร์หลักใน Google Drive ไว้เรียบร้อยแล้ว: `1FvbKtV0uFyPUfZPLLfQQHE45oH8fatTv`

### ขั้นตอนที่ 4: Deploy เป็น Web App
1. คลิกปุ่ม **Deploy (ทำให้ใช้งานได้)** มุมขวาบน → เลือก **New deployment (การใช้งานใหม่)**
2. คลิกไอคอนฟันเฟืองเลือกประเภทเป็น **Web App (เว็บแอป)**
3. ตั้งค่าดังนี้:
   - **Description**: `EDMRS Connector v2.5`
   - **Execute as (เรียกใช้ในฐานะ)**: `Me (ฉัน - อีเมลของท่าน)`
   - **Who has access (ผู้มีสิทธิ์เข้าถึง)**: `Anyone (ทุกคน)`
4. กดปุ่ม **Deploy (ทำให้ใช้งานได้)** และกดยืนยันสิทธิ์การเข้าถึง (Authorize Access)

### ขั้นตอนที่ 5: นำ Web App URL มาใส่ในระบบ EDMRS
1. คัดลอก **Web App URL** ที่ได้ (`https://script.google.com/macros/s/AKfycbxBJ-fRIiU0T8BqyAlZS5xrO8x5N6niAxQLkkKiAKCMCDZoaoAImKhKWHaFLn8TxEYs/exec`)
2. เปิดระบบ EDMRS ไปที่เมนู **"ตั้งค่าระบบ"** → หัวข้อ **"ตั้งค่าการเชื่อมต่อ Google Drive & Google Sheets"**
3. ระบบเปิดการใช้งานลิงก์และ ID โฟลเดอร์ที่พร้อมซิงก์เรียบร้อยแล้ว

---

## ✨ ผลลัพธ์การทำงานอัตโนมัติ

1. **Google Sheets**:
   - ระบบจะสร้างชีท `Users`, `Students`, `Documents`, `Books`, `Loans`, และ `Storage_Locations` พร้อมจัดรูปแบบหัวตารางสวยงามและลงข้อมูลซิงก์ตรงกันทุกประการ
2. **Google Drive**:
   - ระบบจะสร้างโฟลเดอร์ `EDMRS_Drive_Vault/`
   - ด้านในจะสร้างโฟลเดอร์อัลบั้มแยกสำหรับแต่ละทะเบียนเล่มอัตโนมัติ เช่น:
     - `EDMRS_Drive_Vault/BOOK-P1-2565-01/`
     - `EDMRS_Drive_Vault/BOOK-P1-2565-02/`
     - `EDMRS_Drive_Vault/BOOK-P2-2565-01/`
