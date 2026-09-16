-- ==========================================================================
-- EDMRS - Educational Document Management and Retrieval System
-- Relational Database DDL Schema (PostgreSQL Standard)
-- ==========================================================================

-- 1. Roles & Users
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  title VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role_code VARCHAR(50) REFERENCES roles(code),
  email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Permissions & Matrix
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  permission_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_code VARCHAR(50) REFERENCES roles(code) ON DELETE CASCADE,
  permission_key VARCHAR(100) REFERENCES permissions(permission_key) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_key)
);

-- 3. Academic Years
CREATE TABLE academic_years (
  year VARCHAR(4) PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Students
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  citizen_id VARCHAR(13) UNIQUE NOT NULL,
  prefix VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  previous_name VARCHAR(150),
  birthdate DATE,
  grade_level VARCHAR(10) NOT NULL,
  room VARCHAR(10) NOT NULL,
  academic_year VARCHAR(4) REFERENCES academic_years(year),
  status VARCHAR(20) DEFAULT 'studying',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_id ON students(student_id);
CREATE INDEX idx_student_citizen ON students(citizen_id);
CREATE INDEX idx_student_name ON students(first_name, last_name);

-- 5. Document Types
CREATE TABLE document_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Storage Locations
CREATE TABLE storage_locations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  building VARCHAR(100) NOT NULL,
  room VARCHAR(100) NOT NULL,
  cabinet VARCHAR(100) NOT NULL,
  shelf VARCHAR(50) NOT NULL,
  folder VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_code ON storage_locations(code);

-- 7. Books Registry
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  book_code VARCHAR(50) UNIQUE NOT NULL,
  doc_type_code VARCHAR(20) REFERENCES document_types(code),
  academic_year VARCHAR(4) REFERENCES academic_years(year),
  book_number VARCHAR(20) NOT NULL,
  start_no VARCHAR(20) NOT NULL,
  end_no VARCHAR(20) NOT NULL,
  item_count INT DEFAULT 50,
  location_code VARCHAR(50) REFERENCES storage_locations(code),
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_book_code ON books(book_code);

-- 8. Por.Por. Documents
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  doc_code VARCHAR(100) UNIQUE NOT NULL,
  student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
  student_name VARCHAR(200) NOT NULL,
  doc_type_code VARCHAR(20) REFERENCES document_types(code),
  academic_year VARCHAR(4) REFERENCES academic_years(year),
  doc_number VARCHAR(20) NOT NULL,
  book_code VARCHAR(50) REFERENCES books(book_code),
  book_number VARCHAR(20),
  page_number VARCHAR(20),
  date_created DATE,
  date_received DATE,
  status VARCHAR(20) DEFAULT 'stored',
  location_code VARCHAR(50) REFERENCES storage_locations(code),
  file_name VARCHAR(255),
  file_url VARCHAR(500),
  file_size VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_code ON documents(doc_code);
CREATE INDEX idx_doc_number ON documents(doc_number);
CREATE INDEX idx_doc_student ON documents(student_id);

-- 9. Loans Log
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  loan_code VARCHAR(50) UNIQUE NOT NULL,
  doc_id INT REFERENCES documents(id),
  student_id VARCHAR(20) REFERENCES students(student_id),
  student_name VARCHAR(200) NOT NULL,
  doc_type_code VARCHAR(20) REFERENCES document_types(code),
  doc_number VARCHAR(20) NOT NULL,
  borrower_name VARCHAR(150) NOT NULL,
  borrower_dept VARCHAR(150),
  loan_date DATE NOT NULL,
  loan_time VARCHAR(10),
  reason TEXT NOT NULL,
  return_due_date DATE NOT NULL,
  return_date DATE,
  receiver_name VARCHAR(150),
  status VARCHAR(20) DEFAULT 'borrowed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  username VARCHAR(50) NOT NULL,
  user_fullname VARCHAR(150),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(50)
);

-- 11. System Settings
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
