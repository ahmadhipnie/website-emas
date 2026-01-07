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
import { manualFetch, getManualRefreshStatus } from '../config/gold-scheduler.js';
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

/**
 * GET /api/emas/structure
 * Cek struktur table emas
 */
router.get('/emas/structure', async (req, res) => {
  try {
    const columns = await query('DESCRIBE emas');
    res.json({
      success: true,
      data: columns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get table structure',
      error: error.message
    });
  }
});

/**
 * GET /api/emas/latest
 * Get harga emas terbaru
 */
router.get('/emas/latest', async (req, res) => {
  try {
    const result = await query(
      'SELECT id_emas, timestamp, currency, metal, unit, price, ask, bid, high, low, change_value, change_percent FROM emas ORDER BY timestamp DESC LIMIT 1'
    );
    res.json({
      success: true,
      data: result[0] || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get latest gold price',
      error: error.message
    });
  }
});

/**
 * GET /api/emas/history
 * Get histori harga emas
 * Query params: limit (default 30), unit (toz/gram)
 */
router.get('/emas/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    const result = await query(
      `SELECT id_emas, timestamp, currency, metal, unit, price, ask, bid, high, low, change_value, change_percent FROM emas ORDER BY timestamp DESC LIMIT ${limit}`
    );
    res.json({
      success: true,
      data: result.reverse() // Urutkan ascending untuk chart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get gold history',
      error: error.message
    });
  }
});

/**
 * POST /api/emas/fetch
 * Fetch harga emas dari API dan simpan ke database
 * HATI-HATI: Rate limit 100 request/bulan
 * Manual refresh: Maksimal 10x/bulan
 */
router.post('/emas/fetch', async (req, res) => {
  try {
    // Gunakan manualFetch dari scheduler (dengan limit 10x/bulan)
    const result = await manualFetch();

    if (result.success) {
      res.json({
        success: true,
        message: 'Harga emas berhasil diperbarui!',
        data: result.data
      });
    } else {
      // Handle error dari manualFetch
      const statusCode = result.error === 'RATE_LIMIT_EXCEEDED' || result.error === 'API_LIMIT_EXCEEDED' ? 429 : 400;

      res.status(statusCode).json({
        success: false,
        message: result.message,
        error: result.error,
        manualLimit: result.manualLimit
      });
    }
  } catch (error) {
    // Cek jika error karena network/limit
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('enoent') || errorMessage.includes('fetch failed') || errorMessage.includes('econnrefused')) {
      return res.status(500).json({
        success: false,
        message: 'Gagal terhubung ke API metals.dev. Periksa koneksi internet Anda.',
        error: 'CONNECTION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch gold price',
      error: error.message
    });
  }
});

/**
 * GET /api/emas/manual-refresh-status
 * Cek sisa kuota manual refresh
 */
router.get('/emas/manual-refresh-status', async (_req, res) => {
  try {
    const status = await getManualRefreshStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get manual refresh status',
      error: error.message
    });
  }
});

/**
 * GET /api/emas/stats
 * Get statistik harga emas (ringkasan untuk dashboard)
 */
router.get('/emas/stats', async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_records,
        MIN(timestamp) as first_record,
        MAX(timestamp) as last_record
      FROM emas
    `);

    const latest = await query(`
      SELECT id_emas, timestamp, currency, metal, unit, price, ask, bid, high, low, change_value, change_percent
      FROM emas
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    res.json({
      success: true,
      data: {
        stats: stats[0],
        latest: latest[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get gold stats',
      error: error.message
    });
  }
});

/**
 * GET /api/emas/usage
 * Get API usage dari metals.dev
 */
router.get('/emas/usage', async (req, res) => {
  try {
    const apiKey = process.env.METALS_API_KEY || 'QWTJB0KX5AH01IVHGVVQ846VHGVVQ';
    const apiUrl = `https://api.metals.dev/usage?api_key=${apiKey}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get API usage',
      error: error.message
    });
  }
});

export default router;
