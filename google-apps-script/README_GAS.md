# คู่มือการติดตั้งและตั้งค่า Google Apps Script (Code.gs)
## EDMRS - Google Sheets Pure Database Connector Guide

โปรแกรม **Google Apps Script (`Code.gs`)** ช่วยให้ระบบ EDMRS สามารถเชื่อมต่อ อ่าน-เขียน และซิงก์ข้อมูลลง **Google Sheets** แบบอัตโนมัติ ซึ่งทำหน้าที่เป็นฐานข้อมูลหลัก (Source of Truth) ของระบบ

---

## 🛠️ ขั้นตอนการติดตั้งและ Deploy (5 นาที)

### ขั้นตอนที่ 1: เตรียม Google Sheet
1. เข้าไปที่ [Google Sheets](https://sheets.google.com)
2. สร้างสเปรดชีตใหม่ ตั้งชื่อว่า **`EDMRS_Database_Master`**

### ขั้นตอนที่ 2: เปิด Apps Script Editor
1. ในหน้า Google Sheets ให้ไปที่เมนู **Extensions (ส่วนขยาย)** → **Apps Script**
2. ลบโค้ดเดิมใน `Code.gs` ออกทั้งหมด

### ขั้นตอนที่ 3: วางโค้ด `Code.gs`
1. เปิดไฟล์ [`google-apps-script/Code.gs`](file:///d:/SMOIS/student-club-web/ระบบจัดเก็บข้อมูลใบปพ/google-apps-script/Code.gs) ในโปรเจกต์นี้
2. คัดลอกโค้ดทั้งหมด ไปวางในช่อง `Code.gs` บน Google Apps Script Editor
3. กดปุ่มบันทึก 💾 (Save)

### ขั้นตอนที่ 4: Deploy เป็น Web App
1. คลิกปุ่ม **Deploy (ทำให้ใช้งานได้)** มุมขวาบน → เลือก **New deployment (การใช้งานใหม่)**
2. คลิกไอคอนฟันเฟืองเลือกประเภทเป็น **Web App (เว็บแอป)**
3. ตั้งค่าดังนี้:
   - **Description**: `EDMRS Master Database Connector v3.0`
   - **Execute as (เรียกใช้ในฐานะ)**: `Me (ฉัน - อีเมลของท่าน)`
   - **Who has access (ผู้มีสิทธิ์เข้าถึง)**: `Anyone (ทุกคน)`
4. กดปุ่ม **Deploy (ทำให้ใช้งานได้)** และกดยืนยันสิทธิ์การเข้าถึง (Authorize Access)

### ขั้นตอนที่ 5: นำ Web App URL มาใส่ในระบบ EDMRS
1. คัดลอก **Web App URL** ที่ได้ (`https://script.google.com/macros/s/AKfycbwjmgWDRgdqfwW1D5Lv9qaILsz6vVsu1yHz917Quk-dfBcRWX3kEyq8NSDKRXVSkM6H/exec`)
2. เปิดระบบ EDMRS ไปที่เมนู **"ตั้งค่าระบบ"** → หัวข้อ **"ตั้งค่าการเชื่อมต่อ Google Sheets"**
3. วาง Web App URL และเปิดใช้งานซิงก์อัตโนมัติ

---

## ✨ จุดเด่นของการอัปเดตระบบ GAS Backend (v3.0)

1. **ความเสถียรสูงสุด (High Reliability & Lock Protection)**:
   - อ่านข้อมูลผ่าน `doGet` แบบ Lock-free ทำให้การดึงข้อมูลจากเว็บรวดเร็วและไม่ติดค้าง
   - บันทึก/อัปเดตข้อมูลผ่าน `doPost` ด้วย `LockService` ป้องกันปัญหา Race Condition เมื่อมีการบันทึกพร้อมกัน
2. **การซิงก์โครงสร้าง 7 แท็บอัตโนมัติ (Automated Tab Structure)**:
   - `Students` (รายชื่อนักเรียน)
   - `Documents` (ทะเบียนเอกสาร ปพ.)
   - `Books` (ทะเบียนเล่ม ปพ.)
   - `Loans` (การขอสำเนาเอกสาร)
   - `Storage_Locations` (สถานที่จัดเก็บ)
   - `Users` (ผู้ใช้งานและสิทธิ์)
   - `Settings` (ตั้งค่าระบบ)
3. **การลบข้อมูลแบบซิงก์ตรงกัน (Deleted Keys Tracking)**:
   - มีแท็บ `Deleted_Keys` คอยบันทึกรายการที่ถูกลบ ป้องกันข้อมูลเก่าไหลกลับมาแสดงผล

