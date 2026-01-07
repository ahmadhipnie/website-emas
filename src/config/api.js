/**
 * Database API Routes
 * Endpoints untuk testing dan operasi database
 */

import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';
import AuthController from '../controllers/AuthController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// =============================================
// Multer Configuration untuk Upload Gambar
// =============================================

// Storage configuration
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/flyers');
    // Pastikan folder exists
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter - hanya terima gambar
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, PNG, GIF) yang diperbolehkan!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter
});

// =============================================
// Authentication Routes
// =============================================

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/auth/login', AuthController.login);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/auth/logout', AuthController.logout);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/auth/me', isAuthenticated, AuthController.me);

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/auth/register', AuthController.register);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/auth/change-password', isAuthenticated, AuthController.changePassword);

// =============================================
// User Management Routes (Admin Only)
// =============================================

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('📋 GET /api/users - Request from:', req.session.user?.nama);
    
    const users = await query(
      'SELECT id_user, nama, email, role, created_at, updated_at, keterangan FROM users ORDER BY id_user DESC'
    );
    
    console.log(`✅ Found ${users.length} users`);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data users',
      error: error.message
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = await query(
      'SELECT id_user, nama, email, role, created_at, updated_at, keterangan FROM users WHERE id_user = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user',
      error: error.message
    });
  }
});

/**
 * POST /api/users
 * Create new user (Admin only)
 */
router.post('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { nama, email, password, role = 'user', keterangan = '' } = req.body;

    // Validasi input
    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password harus diisi'
      });
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
    }

    // Check apakah email sudah terdaftar
    const existingUsers = await query(
      'SELECT id_user FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const result = await query(
      'INSERT INTO users (nama, email, password, role, keterangan, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [nama, email, hashedPassword, role, keterangan]
    );

    res.status(201).json({
      success: true,
      message: 'User berhasil ditambahkan',
      data: {
        id_user: result.insertId,
        nama,
        email,
        role,
        keterangan
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan user',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user (Admin only)
 */
router.put('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama, email, password, role, keterangan } = req.body;

    console.log('📝 PUT /api/users/:id - Updating user:', {
      id: id,
      nama: nama,
      email: email,
      role: role
    });

    // Validasi ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID user tidak valid'
      });
    }

    // Validasi input
    if (!nama || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan email harus diisi'
      });
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // Check apakah user exists
    const existingUser = await query(
      'SELECT id_user FROM users WHERE id_user = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Check apakah email sudah digunakan user lain
    const duplicateEmail = await query(
      'SELECT id_user FROM users WHERE email = ? AND id_user != ?',
      [email, id]
    );

    console.log('📧 Email check:', {
      email: email,
      currentUserId: id,
      duplicateFound: duplicateEmail.length > 0,
      duplicateUserId: duplicateEmail.length > 0 ? duplicateEmail[0].id_user : null
    });

    if (duplicateEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan oleh user lain'
      });
    }

    // Build update query
    let updateQuery = 'UPDATE users SET nama = ?, email = ?, role = ?, keterangan = ?, updated_at = NOW()';
    let params = [nama, email, role, keterangan || ''];

    // Include password jika diisi
    if (password && password.trim() !== '') {
      // Validasi password minimal 6 karakter
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE id_user = ?';
    params.push(id);

    // Update user
    await query(updateQuery, params);

    res.json({
      success: true,
      message: 'User berhasil diupdate'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate user',
      error: error.message
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check apakah user exists
    const existingUser = await query(
      'SELECT id_user, email FROM users WHERE id_user = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Prevent deleting current logged in user
    if (req.session.user.id_user === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak dapat menghapus akun Anda sendiri'
      });
    }

    // Delete user
    await query('DELETE FROM users WHERE id_user = ?', [id]);

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus user',
      error: error.message
    });
  }
});

// =============================================
// Testing Routes
// =============================================

/**
 * GET /api/test-db
 * Test database connection
 */
router.get('/test-db', async (req, res) => {
  try {
    const result = await query('SELECT 1 + 1 AS solution');
    res.json({
      success: true,
      message: 'Database connection successful',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

/**
 * GET /api/tables
 * Get all tables in database
 */
router.get('/tables', async (req, res) => {
  try {
    const tables = await query('SHOW TABLES');
    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get tables',
      error: error.message
    });
  }
});

// =============================================
// Flyer Management Routes
// =============================================

/**
 * GET /api/flyers
 * Get all flyers
 */
router.get('/flyers', isAuthenticated, async (req, res) => {
  try {
    const flyers = await query(
      'SELECT * FROM flyers ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: flyers
    });
  } catch (error) {
    console.error('Error fetching flyers:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data flyers'
    });
  }
});

/**
 * GET /api/flyers/:id
 * Get single flyer by ID
 */
router.get('/flyers/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const flyers = await query(
      'SELECT * FROM flyers WHERE id_flyer = ?',
      [id]
    );

    if (flyers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flyer tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: flyers[0]
    });
  } catch (error) {
    console.error('Error fetching flyer:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data flyer'
    });
  }
});

/**
 * POST /api/flyers
 * Create new flyer (with image upload)
 */
router.post('/flyers', isAuthenticated, upload.single('gambar'), async (req, res) => {
  try {
    const { nama, keterangan } = req.body;

    // Validasi input
    if (!nama || !req.file) {
      // Hapus file jika ada
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(400).json({
        success: false,
        message: 'Nama dan gambar harus diisi'
      });
    }

    // Insert ke database
    const result = await query(
      'INSERT INTO flyers (gambar, nama, keterangan) VALUES (?, ?, ?)',
      [req.file.filename, nama, keterangan || '']
    );

    res.json({
      success: true,
      message: 'Flyer berhasil ditambahkan',
      data: {
        id_flyer: result.insertId,
        gambar: req.file.filename,
        nama,
        keterangan
      }
    });
  } catch (error) {
    console.error('Error creating flyer:', error);
    
    // Hapus file jika terjadi error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan flyer'
    });
  }
});

/**
 * PUT /api/flyers/:id
 * Update flyer (optional image upload)
 */
router.put('/flyers/:id', isAuthenticated, upload.single('gambar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama, keterangan } = req.body;

    // Validasi ID
    if (isNaN(id) || id <= 0) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(400).json({
        success: false,
        message: 'ID flyer tidak valid'
      });
    }

    // Validasi input
    if (!nama) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(400).json({
        success: false,
        message: 'Nama harus diisi'
      });
    }

    // Check apakah flyer exists
    const existingFlyer = await query(
      'SELECT * FROM flyers WHERE id_flyer = ?',
      [id]
    );

    if (existingFlyer.length === 0) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(404).json({
        success: false,
        message: 'Flyer tidak ditemukan'
      });
    }

    // Build update query
    let updateQuery = 'UPDATE flyers SET nama = ?, keterangan = ?';
    let params = [nama, keterangan || ''];

    // Jika ada file baru, update gambar dan hapus file lama
    if (req.file) {
      updateQuery += ', gambar = ?';
      params.push(req.file.filename);
      
      // Hapus file lama
      const oldFilePath = path.join(__dirname, '../../public/uploads/flyers', existingFlyer[0].gambar);
      await fs.unlink(oldFilePath).catch(err => {
        console.warn('Could not delete old file:', err.message);
      });
    }

    updateQuery += ', updated_at = NOW() WHERE id_flyer = ?';
    params.push(id);

    await query(updateQuery, params);

    res.json({
      success: true,
      message: 'Flyer berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating flyer:', error);
    
    // Hapus file baru jika terjadi error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate flyer'
    });
  }
});

/**
 * DELETE /api/flyers/:id
 * Delete flyer
 */
router.delete('/flyers/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validasi ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID flyer tidak valid'
      });
    }

    // Check apakah flyer exists
    const existingFlyer = await query(
      'SELECT * FROM flyers WHERE id_flyer = ?',
      [id]
    );

    if (existingFlyer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flyer tidak ditemukan'
      });
    }

    // Delete from database
    await query('DELETE FROM flyers WHERE id_flyer = ?', [id]);

    // Delete file
    const filePath = path.join(__dirname, '../../public/uploads/flyers', existingFlyer[0].gambar);
    await fs.unlink(filePath).catch(err => {
      console.warn('Could not delete file:', err.message);
    });

    res.json({
      success: true,
      message: 'Flyer berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting flyer:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus flyer'
    });
  }
});

export default router;
