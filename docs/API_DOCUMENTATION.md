# API Documentation - EDMRS
## ระบบจัดเก็บและสืบค้นข้อมูลเอกสารทางการศึกษา (ปพ.)

เอกสารอ้างอิง API Endpoints สำหรับเชื่อมต่อบริการภายนอกหรือระบบจัดเก็บข้อมูลส่วนกลาง

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
เข้าสู่ระบบเพื่อรับ Authentication JWT Token

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "super_admin",
    "name": "นายสมศักดิ์ วิทยากร"
  }
}
```

---

## 2. Student Endpoints

### `GET /api/students`
ดึงรายการนักเรียนทั้งหมด

**Query Parameters:**
- `search` (string): ค้นหารหัสนักเรียน/ชื่อ
- `grade_level` (string): ป.6, ม.1, ม.3, ม.6
- `academic_year` (string): 2569, 2568, 2565

### `GET /api/students/:id`
ดึงข้อมูลนักเรียนรายบุคคลและประวัติเอกสาร ปพ. ทั้งหมด

---

## 3. Documents & Location Endpoints

### `GET /api/documents`
ดึงรายการทะเบียนเอกสาร ปพ.

### `GET /api/locations/:code`
ดึงโครงสร้างสถานที่จัดเก็บ 6 ระดับตาม Location Code (เช่น `LOC-A03-02-04`)

**Response:**
```json
{
  "code": "LOC-A03-02-04",
  "building": "อาคารสำนักงาน",
  "room": "ห้องทะเบียน 101",
  "cabinet": "ตู้ A-03",
  "shelf": "ชั้น 02",
  "folder": "แฟ้ม 04"
}
```
