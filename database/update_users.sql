-- =============================================
-- Update Tabel Users untuk Authentication
-- =============================================

USE db_emas;

-- Drop tabel users lama jika ada
DROP TABLE IF EXISTS users;

-- Buat tabel users baru sesuai struktur yang diminta
CREATE TABLE users (
  id_user INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  keterangan TEXT,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default users
-- Password untuk semua user: password123 (sudah di-hash dengan bcrypt)
INSERT INTO users (nama, email, password, role, keterangan) VALUES
('Administrator', 'admin@websiteemas.com', '$2b$10$rZ5VF5iy8F5J5tK5K5K5KOu5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'admin', 'Administrator sistem'),
('User Demo', 'user@websiteemas.com', '$2b$10$rZ5VF5iy8F5J5tK5K5K5KOu5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'user', 'User demo untuk testing');

-- =============================================
-- CATATAN:
-- Password default di atas adalah hash dummy
-- Untuk membuat user baru, gunakan API endpoint /api/auth/register
-- atau hash password terlebih dahulu dengan bcrypt
-- =============================================
