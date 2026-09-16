# คู่มือการ Deploy บน Production Environment (Deployment Guide) - EDMRS

## 1. การเตรียมสภาพแวดล้อมระบบเซิร์ฟเวอร์
1. ติดตั้ง Node.js (v18+) และ PostgreSQL (v14+) บนเซิร์ฟเวอร์ Linux / Windows Server
2. นำเข้าฐานข้อมูล PostgreSQL Schema:
   ```bash
   psql -U postgres -d edmrs_db -f database/schema/schema.sql
   ```
3. นำเข้าข้อมูลเริ่มต้น (Seed Data):
   ```bash
   psql -U postgres -d edmrs_db -f database/seeds/seed.sql
   ```

---

## 2. การตั้งค่า Environment Variables (`.env`)
สร้างไฟล์ `.env` ใน Root directory:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@localhost:5432/edmrs_db
AUTH_SECRET=super_secret_jwt_key_edmrs_2026
```

---

## 3. การรัน Process Manager (PM2)
```bash
npm install -g pm2
pm2 start backend/server.js --name "edmrs-app"
pm2 save
pm2 startup
```
