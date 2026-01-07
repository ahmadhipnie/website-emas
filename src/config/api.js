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
    const uploadPath = path.join(__dirname, '../../public/uploads/flyer');
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
// Multer Configuration untuk Upload PDF (Laporan)
// =============================================

// Storage configuration untuk PDF
const pdfStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/laporan');
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

// File filter - hanya terima PDF
const pdfFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/pdf';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file PDF yang diperbolehkan!'));
  }
};

const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB untuk PDF
  fileFilter: pdfFileFilter
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
 * GET /api/auth/me
 * Get current logged in user info
 */
router.get('/auth/me', isAuthenticated, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id_user: req.session.user.id_user,
        nama: req.session.user.nama,
        email: req.session.user.email,
        role: req.session.user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user',
      error: error.message
    });
  }
});

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
// Lead Management Routes
// =============================================

/**
 * GET /api/leads
 * Get all leads
 * NOTE: Auth temporarily disabled for development - add back isAuthenticated middleware in production
 */
router.get('/leads', async (req, res) => {
  try {
    console.log('📋 GET /api/leads - Fetching leads data...');

    const leads = await query(
      'SELECT id_leads, nama_nasabah, no_hp, email, produk, status_leads, tanggal_input, keterangan FROM leads ORDER BY id_leads DESC'
    );

    console.log(`✅ Found ${leads.length} leads`);

    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    console.error('❌ Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data leads',
      error: error.message
    });
  }
});

/**
 * GET /api/leads/:id
 * Get lead by ID
 */
router.get('/leads/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const leads = await query(
      'SELECT id_leads, nama_nasabah, no_hp, email, produk, status_leads, tanggal_input, keterangan FROM leads WHERE id_leads = ?',
      [id]
    );

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: leads[0]
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data lead',
      error: error.message
    });
  }
});

/**
 * POST /api/leads
 * Create new lead
 */
router.post('/leads', isAuthenticated, async (req, res) => {
  try {
    const { nama_nasabah, no_hp, email, produk, status_leads, tanggal_input, keterangan } = req.body;

    // Validasi input - nama_nasabah is required (NOT NULL in database)
    if (!nama_nasabah) {
      return res.status(400).json({
        success: false,
        message: 'Nama nasabah harus diisi'
      });
    }

    // Create lead
    const result = await query(
      'INSERT INTO leads (nama_nasabah, no_hp, email, produk, status_leads, tanggal_input, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nama_nasabah, no_hp, email, produk, status_leads, tanggal_input, keterangan]
    );

    console.log('✅ Lead created:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Lead berhasil dibuat',
      data: {
        id_leads: result.insertId,
        nama_nasabah,
        no_hp,
        email,
        produk,
        status_leads,
        tanggal_input,
        keterangan
      }
    });

  } catch (error) {
    console.error('❌ Create lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat lead baru',
      error: error.message
    });
  }
});

/**
 * PUT /api/leads/:id
 * Update lead
 */
router.put('/leads/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama_nasabah, no_hp, email, produk, status_leads, tanggal_input, keterangan } = req.body;

    console.log('📝 PUT /api/leads/:id - Updating lead:', {
      id: id,
      nama_nasabah: nama_nasabah,
      no_hp: no_hp
    });

    // Validasi ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID lead tidak valid'
      });
    }

    // Validasi input - nama_nasabah is required
    if (!nama_nasabah) {
      return res.status(400).json({
        success: false,
        message: 'Nama nasabah harus diisi'
      });
    }

    // Check apakah lead exists
    const existingLead = await query(
      'SELECT id_leads FROM leads WHERE id_leads = ?',
      [id]
    );

    if (existingLead.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead tidak ditemukan'
      });
    }

    // Update lead
    await query(
      'UPDATE leads SET nama_nasabah = ?, no_hp = ?, email = ?, produk = ?, status_leads = ?, tanggal_input = ?, keterangan = ? WHERE id_leads = ?',
      [nama_nasabah, no_hp, email, produk, status_leads, tanggal_input, keterangan, id]
    );

    console.log('✅ Lead updated:', id);

    res.json({
      success: true,
      message: 'Lead berhasil diupdate'
    });

  } catch (error) {
    console.error('❌ Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate lead',
      error: error.message
    });
  }
});

/**
 * DELETE /api/leads/:id
 * Delete lead
 */
router.delete('/leads/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Check apakah lead exists
    const existingLead = await query(
      'SELECT id_leads, nama_nasabah FROM leads WHERE id_leads = ?',
      [id]
    );

    if (existingLead.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead tidak ditemukan'
      });
    }

    // Delete lead
    await query('DELETE FROM leads WHERE id_leads = ?', [id]);

    console.log('✅ Lead deleted:', id);

    res.json({
      success: true,
      message: 'Lead berhasil dihapus'
    });

  } catch (error) {
    console.error('❌ Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus lead',
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

// =============================================
// flyer CRUD Routes
// =============================================

/**
 * GET /api/flyer/public
 * Get semua flyer untuk public/dashboard (tanpa auth)
 */
router.get('/flyer/public', async (req, res) => {
  try {
    const result = await query('SELECT * FROM flyer ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data flyer',
      error: error.message
    });
  }
});

/**
 * GET /api/flyer
 * Get semua flyer
 */
router.get('/flyer', isAuthenticated, async (req, res) => {
  try {
    const result = await query('SELECT * FROM flyer ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data flyer',
      error: error.message
    });
  }
});

/**
 * GET /api/flyer/:id
 * Get flyer by ID
 */
router.get('/flyer/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM flyer WHERE id_flyer = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flyer tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data flyer',
      error: error.message
    });
  }
});

/**
 * POST /api/flyer
 * Create new flyer with image upload
 */
router.post('/flyer', isAuthenticated, upload.single('gambar'), async (req, res) => {
  try {
    const { nama, keterangan } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Gambar flyer harus diupload'
      });
    }
    
    if (!nama) {
      return res.status(400).json({
        success: false,
        message: 'Nama flyer harus diisi'
      });
    }
    
    // Path gambar yang disimpan ke database
    const gambarPath = `/public/uploads/flyer/${req.file.filename}`;
    
    const result = await query(
      'INSERT INTO flyer (gambar, nama, keterangan) VALUES (?, ?, ?)',
      [gambarPath, nama, keterangan || null]
    );
    
    res.json({
      success: true,
      message: 'Flyer berhasil ditambahkan',
      data: {
        id_flyer: result.insertId,
        gambar: gambarPath,
        nama,
        keterangan
      }
    });
  } catch (error) {
    // Hapus file jika terjadi error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan flyer',
      error: error.message
    });
  }
});

/**
 * PUT /api/flyer/:id
 * Update flyer (optional image upload)
 */
router.put('/flyer/:id', isAuthenticated, upload.single('gambar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, keterangan } = req.body;
    
    // Cek apakah flyer exists
    const existing = await query('SELECT * FROM flyer WHERE id_flyer = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flyer tidak ditemukan'
      });
    }
    
    let gambarPath = existing[0].gambar;
    
    // Jika ada file baru, update gambar
    if (req.file) {
      gambarPath = `/public/uploads/flyer/${req.file.filename}`;
      
      // Hapus gambar lama
      const oldPath = path.join(__dirname, '../..', existing[0].gambar);
      try {
        await fs.unlink(oldPath);
      } catch (unlinkError) {
        console.error('Error deleting old image:', unlinkError);
      }
    }
    
    await query(
      'UPDATE flyer SET gambar = ?, nama = ?, keterangan = ? WHERE id_flyer = ?',
      [gambarPath, nama || existing[0].nama, keterangan || existing[0].keterangan, id]
    );
    
    res.json({
      success: true,
      message: 'Flyer berhasil diperbarui',
      data: {
        id_flyer: parseInt(id),
        gambar: gambarPath,
        nama: nama || existing[0].nama,
        keterangan: keterangan || existing[0].keterangan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui flyer',
      error: error.message
    });
  }
});

/**
 * DELETE /api/flyer/:id
 * Delete flyer and its image
 */
router.delete('/flyer/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get flyer data untuk hapus file
    const existing = await query('SELECT * FROM flyer WHERE id_flyer = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flyer tidak ditemukan'
      });
    }
    
    // Hapus dari database
    await query('DELETE FROM flyer WHERE id_flyer = ?', [id]);
    
    // Hapus file gambar
    const imagePath = path.join(__dirname, '../..', existing[0].gambar);
    try {
      await fs.unlink(imagePath);
    } catch (unlinkError) {
      console.error('Error deleting image file:', unlinkError);
    }
    
    res.json({
      success: true,
      message: 'Flyer berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus flyer',
      error: error.message
    });
  }
});

// =============================================
// Event (Calendar) CRUD Routes
// =============================================

/**
 * GET /api/event
 * Get semua events
 */
router.get('/event', isAuthenticated, async (req, res) => {
  try {
    const result = await query(`
      SELECT id_event, nama_event, lokasi,
             DATE_FORMAT(tanggal_event, '%Y-%m-%d') AS tanggal_event,
             TIME_FORMAT(waktu_event, '%H:%i:%s') AS waktu_event,
             penanggung_jawab, keterangan
      FROM event
      ORDER BY tanggal_event ASC, waktu_event ASC
    `);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data event',
      error: error.message
    });
  }
});

/**
 * GET /api/event/:id
 * Get event by ID
 */
router.get('/event/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT id_event, nama_event, lokasi,
             DATE_FORMAT(tanggal_event, '%Y-%m-%d') AS tanggal_event,
             TIME_FORMAT(waktu_event, '%H:%i:%s') AS waktu_event,
             penanggung_jawab, keterangan
      FROM event WHERE id_event = ?`, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data event',
      error: error.message
    });
  }
});

/**
 * POST /api/event
 * Create new event
 */
router.post('/event', isAuthenticated, async (req, res) => {
  try {
    const { nama_event, lokasi, tanggal_event, waktu_event, penanggung_jawab, keterangan } = req.body;
    
    // Validation
    if (!nama_event || !lokasi || !tanggal_event || !waktu_event || !penanggung_jawab) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi kecuali keterangan'
      });
    }
    
    const result = await query(
      'INSERT INTO event (nama_event, lokasi, tanggal_event, waktu_event, penanggung_jawab, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_event, lokasi, tanggal_event, waktu_event, penanggung_jawab, keterangan || null]
    );
    
    res.json({
      success: true,
      message: 'Event berhasil ditambahkan',
      data: {
        id_event: result.insertId,
        nama_event,
        lokasi,
        tanggal_event,
        waktu_event,
        penanggung_jawab,
        keterangan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan event',
      error: error.message
    });
  }
});

/**
 * PUT /api/event/:id
 * Update event
 */
router.put('/event/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_event, lokasi, tanggal_event, waktu_event, penanggung_jawab, keterangan } = req.body;
    
    // Cek apakah event exists
    const existing = await query('SELECT * FROM event WHERE id_event = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }
    
    // Validation
    if (!nama_event || !lokasi || !tanggal_event || !waktu_event || !penanggung_jawab) {
      return res.status(400).json({
        success: false,
        message: 'Semua field wajib diisi kecuali keterangan'
      });
    }
    
    await query(
      'UPDATE event SET nama_event = ?, lokasi = ?, tanggal_event = ?, waktu_event = ?, penanggung_jawab = ?, keterangan = ? WHERE id_event = ?',
      [nama_event, lokasi, tanggal_event, waktu_event, penanggung_jawab, keterangan || null, id]
    );
    
    res.json({
      success: true,
      message: 'Event berhasil diperbarui',
      data: {
        id_event: parseInt(id),
        nama_event,
        lokasi,
        tanggal_event,
        waktu_event,
        penanggung_jawab,
        keterangan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui event',
      error: error.message
    });
  }
});

/**
 * DELETE /api/event/:id
 * Delete event
 */
router.delete('/event/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah event exists
    const existing = await query('SELECT * FROM event WHERE id_event = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event tidak ditemukan'
      });
    }
    
    // Hapus dari database
    await query('DELETE FROM event WHERE id_event = ?', [id]);
    
    res.json({
      success: true,
      message: 'Event berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus event',
      error: error.message
    });
  }
});

// =============================================
// INVENTARIS CRUD ENDPOINTS
// =============================================

/**
 * GET /api/inventaris
 * Mendapatkan semua data inventaris
 */
router.get('/inventaris', isAuthenticated, async (req, res) => {
  try {
    const result = await query(`
      SELECT id_inventaris, nama_barang, jumlah, kondisi,
             DATE_FORMAT(tanggal_update, '%Y-%m-%d') AS tanggal_update,
             keterangan
      FROM inventaris
      ORDER BY tanggal_update DESC, nama_barang ASC
    `);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching inventaris:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data inventaris',
      error: error.message
    });
  }
});

/**
 * GET /api/inventaris/:id
 * Mendapatkan detail inventaris berdasarkan ID
 */
router.get('/inventaris/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT id_inventaris, nama_barang, jumlah, kondisi,
             DATE_FORMAT(tanggal_update, '%Y-%m-%d') AS tanggal_update,
             keterangan
      FROM inventaris
      WHERE id_inventaris = ?
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventaris tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error fetching inventaris detail:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail inventaris',
      error: error.message
    });
  }
});

/**
 * POST /api/inventaris
 * Menambahkan inventaris baru
 */
router.post('/inventaris', isAuthenticated, async (req, res) => {
  try {
    const { nama_barang, jumlah, kondisi, tanggal_update, keterangan } = req.body;
    
    // Validasi input
    if (!nama_barang || jumlah === undefined || !kondisi) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang, jumlah, dan kondisi harus diisi'
      });
    }
    
    // Validasi jumlah harus angka
    if (isNaN(jumlah) || parseInt(jumlah) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah harus berupa angka positif'
      });
    }
    
    // Insert ke database
    const result = await query(
      `INSERT INTO inventaris (nama_barang, jumlah, kondisi, tanggal_update, keterangan)
       VALUES (?, ?, ?, ?, ?)`,
      [nama_barang, parseInt(jumlah), kondisi, tanggal_update || null, keterangan || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Inventaris berhasil ditambahkan',
      data: {
        id_inventaris: result.insertId,
        nama_barang,
        jumlah: parseInt(jumlah),
        kondisi,
        tanggal_update,
        keterangan
      }
    });
  } catch (error) {
    console.error('Error creating inventaris:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan inventaris',
      error: error.message
    });
  }
});

/**
 * PUT /api/inventaris/:id
 * Update inventaris
 */
router.put('/inventaris/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_barang, jumlah, kondisi, tanggal_update, keterangan } = req.body;
    
    // Validasi input
    if (!nama_barang || jumlah === undefined || !kondisi) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang, jumlah, dan kondisi harus diisi'
      });
    }
    
    // Validasi jumlah harus angka
    if (isNaN(jumlah) || parseInt(jumlah) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah harus berupa angka positif'
      });
    }
    
    // Cek apakah inventaris exists
    const existing = await query('SELECT * FROM inventaris WHERE id_inventaris = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventaris tidak ditemukan'
      });
    }
    
    // Update database
    await query(
      `UPDATE inventaris 
       SET nama_barang = ?, jumlah = ?, kondisi = ?, tanggal_update = ?, keterangan = ?
       WHERE id_inventaris = ?`,
      [nama_barang, parseInt(jumlah), kondisi, tanggal_update || null, keterangan || null, id]
    );
    
    res.json({
      success: true,
      message: 'Inventaris berhasil diperbarui',
      data: {
        id_inventaris: parseInt(id),
        nama_barang,
        jumlah: parseInt(jumlah),
        kondisi,
        tanggal_update,
        keterangan
      }
    });
  } catch (error) {
    console.error('Error updating inventaris:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui inventaris',
      error: error.message
    });
  }
});

/**
 * DELETE /api/inventaris/:id
 * Delete inventaris
 */
router.delete('/inventaris/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah inventaris exists
    const existing = await query('SELECT * FROM inventaris WHERE id_inventaris = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventaris tidak ditemukan'
      });
    }
    
    // Hapus dari database
    await query('DELETE FROM inventaris WHERE id_inventaris = ?', [id]);
    
    res.json({
      success: true,
      message: 'Inventaris berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting inventaris:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus inventaris',
      error: error.message
    });
  }
});

// =============================================
// RAB (RENCANA ANGGARAN BIAYA) CRUD ENDPOINTS
// =============================================

/**
 * GET /api/rab
 * Mendapatkan semua data RAB
 */
router.get('/rab', isAuthenticated, async (req, res) => {
  try {
    const result = await query(`
      SELECT id_rab, nama_kegiatan, anggaran, realisasi,
             DATE_FORMAT(tanggal_pengajuan, '%Y-%m-%d') AS tanggal_pengajuan,
             status, keterangan,
             (anggaran - realisasi) AS sisa_anggaran,
             CASE 
               WHEN anggaran > 0 THEN ROUND((realisasi / anggaran * 100), 2)
               ELSE 0 
             END AS persentase_realisasi
      FROM rab
      ORDER BY tanggal_pengajuan DESC, id_rab DESC
    `);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching rab:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data RAB',
      error: error.message
    });
  }
});

/**
 * GET /api/rab/:id
 * Mendapatkan detail RAB berdasarkan ID
 */
router.get('/rab/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT id_rab, nama_kegiatan, anggaran, realisasi,
             DATE_FORMAT(tanggal_pengajuan, '%Y-%m-%d') AS tanggal_pengajuan,
             status, keterangan
      FROM rab
      WHERE id_rab = ?
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'RAB tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error fetching rab detail:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail RAB',
      error: error.message
    });
  }
});

/**
 * POST /api/rab
 * Menambahkan RAB baru
 */
router.post('/rab', isAuthenticated, async (req, res) => {
  try {
    const { nama_kegiatan, anggaran, realisasi, tanggal_pengajuan, status, keterangan } = req.body;
    
    // Validasi input
    if (!nama_kegiatan || anggaran === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nama kegiatan dan anggaran harus diisi'
      });
    }
    
    // Validasi anggaran harus angka positif
    if (isNaN(anggaran) || parseFloat(anggaran) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Anggaran harus berupa angka positif'
      });
    }
    
    // Validasi realisasi tidak boleh lebih dari anggaran
    const realisasiValue = parseFloat(realisasi) || 0;
    if (realisasiValue > parseFloat(anggaran)) {
      return res.status(400).json({
        success: false,
        message: 'Realisasi tidak boleh melebihi anggaran'
      });
    }
    
    // Insert ke database
    const result = await query(
      `INSERT INTO rab (nama_kegiatan, anggaran, realisasi, tanggal_pengajuan, status, keterangan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nama_kegiatan,
        parseFloat(anggaran),
        realisasiValue,
        tanggal_pengajuan || null,
        status || 'Diajukan',
        keterangan || null
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'RAB berhasil ditambahkan',
      data: {
        id_rab: result.insertId,
        nama_kegiatan,
        anggaran: parseFloat(anggaran),
        realisasi: realisasiValue,
        tanggal_pengajuan,
        status: status || 'Diajukan',
        keterangan
      }
    });
  } catch (error) {
    console.error('Error creating rab:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan RAB',
      error: error.message
    });
  }
});

/**
 * PUT /api/rab/:id
 * Update RAB
 */
router.put('/rab/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kegiatan, anggaran, realisasi, tanggal_pengajuan, status, keterangan } = req.body;
    
    // Validasi input
    if (!nama_kegiatan || anggaran === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nama kegiatan dan anggaran harus diisi'
      });
    }
    
    // Validasi anggaran harus angka positif
    if (isNaN(anggaran) || parseFloat(anggaran) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Anggaran harus berupa angka positif'
      });
    }
    
    // Validasi realisasi tidak boleh lebih dari anggaran
    const realisasiValue = parseFloat(realisasi) || 0;
    if (realisasiValue > parseFloat(anggaran)) {
      return res.status(400).json({
        success: false,
        message: 'Realisasi tidak boleh melebihi anggaran'
      });
    }
    
    // Cek apakah rab exists
    const existing = await query('SELECT * FROM rab WHERE id_rab = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'RAB tidak ditemukan'
      });
    }
    
    // Update database
    await query(
      `UPDATE rab 
       SET nama_kegiatan = ?, anggaran = ?, realisasi = ?, tanggal_pengajuan = ?, status = ?, keterangan = ?
       WHERE id_rab = ?`,
      [
        nama_kegiatan,
        parseFloat(anggaran),
        realisasiValue,
        tanggal_pengajuan || null,
        status || 'Diajukan',
        keterangan || null,
        id
      ]
    );
    
    res.json({
      success: true,
      message: 'RAB berhasil diperbarui',
      data: {
        id_rab: parseInt(id),
        nama_kegiatan,
        anggaran: parseFloat(anggaran),
        realisasi: realisasiValue,
        tanggal_pengajuan,
        status,
        keterangan
      }
    });
  } catch (error) {
    console.error('Error updating rab:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui RAB',
      error: error.message
    });
  }
});

/**
 * DELETE /api/rab/:id
 * Delete RAB (akan set NULL di LPJ yang terkait)
 */
router.delete('/rab/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah rab exists
    const existing = await query('SELECT * FROM rab WHERE id_rab = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'RAB tidak ditemukan'
      });
    }
    
    // Cek apakah ada LPJ terkait
    const relatedLPJ = await query('SELECT COUNT(*) as count FROM lpj WHERE id_rab = ?', [id]);
    const lpjCount = relatedLPJ[0].count;
    
    // Hapus dari database (foreign key akan set NULL otomatis di LPJ)
    await query('DELETE FROM rab WHERE id_rab = ?', [id]);
    
    res.json({
      success: true,
      message: `RAB berhasil dihapus${lpjCount > 0 ? `. ${lpjCount} LPJ terkait akan menjadi tidak berelasi.` : ''}`
    });
  } catch (error) {
    console.error('Error deleting rab:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus RAB',
      error: error.message
    });
  }
});

// =============================================
// LPJ (LAPORAN PERTANGGUNGJAWABAN) CRUD ENDPOINTS
// =============================================

/**
 * GET /api/laporan
 * Mendapatkan semua data LPJ dengan join ke RAB
 */
router.get('/laporan', isAuthenticated, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        l.id_lpj,
        l.id_rab,
        l.nama_kegiatan,
        l.total_pengeluaran,
        DATE_FORMAT(l.tanggal_lpj, '%Y-%m-%d') AS tanggal_lpj,
        l.bukti_dokumen,
        l.keterangan,
        r.anggaran AS rab_anggaran,
        r.status AS rab_status,
        CASE 
          WHEN r.anggaran > 0 THEN ROUND((l.total_pengeluaran / r.anggaran * 100), 2)
          ELSE 0 
        END AS persentase_terhadap_rab
      FROM lpj l
      LEFT JOIN rab r ON l.id_rab = r.id_rab
      ORDER BY l.tanggal_lpj DESC, l.id_lpj DESC
    `);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching laporan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data Laporan',
      error: error.message
    });
  }
});

/**
 * GET /api/laporan/:id
 * Mendapatkan detail LPJ berdasarkan ID
 */
router.get('/laporan/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        l.id_lpj,
        l.id_rab,
        l.nama_kegiatan,
        l.total_pengeluaran,
        DATE_FORMAT(l.tanggal_lpj, '%Y-%m-%d') AS tanggal_lpj,
        l.bukti_dokumen,
        l.keterangan,
        r.nama_kegiatan AS rab_nama_kegiatan,
        r.anggaran AS rab_anggaran,
        r.status AS rab_status
      FROM lpj l
      LEFT JOIN rab r ON l.id_rab = r.id_rab
      WHERE l.id_lpj = ?
    `, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error fetching laporan detail:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail Laporan',
      error: error.message
    });
  }
});

/**
 * GET /api/laporan/rab-list
 * Mendapatkan daftar RAB untuk dropdown
 */
router.get('/laporan/rab-list', isAuthenticated, async (req, res) => {
  try {
    const result = await query(`
      SELECT id_rab, nama_kegiatan, anggaran, status
      FROM rab
      ORDER BY nama_kegiatan ASC
    `);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching rab list:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar RAB',
      error: error.message
    });
  }
});

/**
 * POST /api/laporan
 * Menambahkan LPJ baru dengan upload PDF
 */
router.post('/laporan', isAuthenticated, uploadPDF.single('bukti_dokumen'), async (req, res) => {
  try {
    const { id_rab, nama_kegiatan, total_pengeluaran, tanggal_lpj, keterangan } = req.body;
    
    // Validasi input
    if (!nama_kegiatan || total_pengeluaran === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nama kegiatan dan total pengeluaran harus diisi'
      });
    }
    
    // Validasi total pengeluaran harus angka positif
    if (isNaN(total_pengeluaran) || parseFloat(total_pengeluaran) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total pengeluaran harus berupa angka positif'
      });
    }
    
    // Jika ada id_rab, validasi RAB exists
    if (id_rab) {
      const rabExists = await query('SELECT * FROM rab WHERE id_rab = ?', [id_rab]);
      if (rabExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'RAB tidak ditemukan'
        });
      }
    }
    
    // Get filename dari uploaded file
    const bukti_dokumen = req.file ? req.file.filename : null;
    
    // Insert ke database
    const result = await query(
      `INSERT INTO lpj (id_rab, nama_kegiatan, total_pengeluaran, tanggal_lpj, bukti_dokumen, keterangan)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_rab || null,
        nama_kegiatan,
        parseFloat(total_pengeluaran),
        tanggal_lpj || null,
        bukti_dokumen,
        keterangan || null
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Laporan berhasil ditambahkan',
      data: {
        id_lpj: result.insertId,
        id_rab,
        nama_kegiatan,
        total_pengeluaran: parseFloat(total_pengeluaran),
        tanggal_lpj,
        bukti_dokumen,
        keterangan
      }
    });
  } catch (error) {
    console.error('Error creating laporan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan Laporan',
      error: error.message
    });
  }
});

/**
 * PUT /api/laporan/:id
 * Update LPJ dengan upload PDF baru (opsional)
 */
router.put('/laporan/:id', isAuthenticated, uploadPDF.single('bukti_dokumen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { id_rab, nama_kegiatan, total_pengeluaran, tanggal_lpj, keterangan } = req.body;
    
    // Validasi input
    if (!nama_kegiatan || total_pengeluaran === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nama kegiatan dan total pengeluaran harus diisi'
      });
    }
    
    // Validasi total pengeluaran harus angka positif
    if (isNaN(total_pengeluaran) || parseFloat(total_pengeluaran) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total pengeluaran harus berupa angka positif'
      });
    }
    
    // Cek apakah lpj exists
    const existing = await query('SELECT * FROM lpj WHERE id_lpj = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }
    
    // Jika ada id_rab, validasi RAB exists
    if (id_rab) {
      const rabExists = await query('SELECT * FROM rab WHERE id_rab = ?', [id_rab]);
      if (rabExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'RAB tidak ditemukan'
        });
      }
    }
    
    // Get filename dari uploaded file (jika ada file baru)
    let bukti_dokumen = existing[0].bukti_dokumen; // Keep old file
    if (req.file) {
      bukti_dokumen = req.file.filename; // Use new file
      
      // Hapus file lama jika ada
      if (existing[0].bukti_dokumen) {
        const oldFilePath = path.join(__dirname, '../../public/uploads/laporan', existing[0].bukti_dokumen);
        try {
          await fs.unlink(oldFilePath);
        } catch (error) {
          console.error('Error deleting old PDF:', error);
        }
      }
    }
    
    // Update database
    await query(
      `UPDATE lpj 
       SET id_rab = ?, nama_kegiatan = ?, total_pengeluaran = ?, tanggal_lpj = ?, bukti_dokumen = ?, keterangan = ?
       WHERE id_lpj = ?`,
      [
        id_rab || null,
        nama_kegiatan,
        parseFloat(total_pengeluaran),
        tanggal_lpj || null,
        bukti_dokumen,
        keterangan || null,
        id
      ]
    );
    
    res.json({
      success: true,
      message: 'Laporan berhasil diperbarui',
      data: {
        id_lpj: parseInt(id),
        id_rab,
        nama_kegiatan,
        total_pengeluaran: parseFloat(total_pengeluaran),
        tanggal_lpj,
        bukti_dokumen,
        keterangan
      }
    });
  } catch (error) {
    console.error('Error updating laporan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui Laporan',
      error: error.message
    });
  }
});

/**
 * DELETE /api/laporan/:id
 * Delete LPJ dengan hapus file PDF juga
 */
router.delete('/laporan/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek apakah lpj exists
    const existing = await query('SELECT * FROM lpj WHERE id_lpj = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan'
      });
    }
    
    // Hapus file PDF jika ada
    if (existing[0].bukti_dokumen) {
      const filePath = path.join(__dirname, '../../public/uploads/laporan', existing[0].bukti_dokumen);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting PDF file:', error);
      }
    }
    
    // Hapus dari database
    await query('DELETE FROM lpj WHERE id_lpj = ?', [id]);
    
    res.json({
      success: true,
      message: 'Laporan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting laporan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus Laporan',
      error: error.message
    });
  }
});

export default router;
