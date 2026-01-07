/**
 * Authentication Controller
 * Handle login, logout, dan session management
 */

import bcrypt from 'bcrypt';
import { query } from '../config/database.js';

class AuthController {
  /**
   * POST /api/auth/login
   * Login user dan create session
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validasi input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email dan password harus diisi'
        });
      }

      // Cari user berdasarkan email
      const users = await query(
        'SELECT id_user, nama, email, password, role, keterangan FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      const user = users[0];

      // Verifikasi password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      // Buat session
      req.session.user = {
        id_user: user.id_user,
        nama: user.nama,
        email: user.email,
        role: user.role,
        keterangan: user.keterangan
      };

      // Update last login (optional - butuh kolom last_login di database)
      // await query('UPDATE users SET last_login = NOW() WHERE id_user = ?', [user.id_user]);

      // Response sukses
      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          id_user: user.id_user,
          nama: user.nama,
          email: user.email,
          role: user.role,
          keterangan: user.keterangan
        },
        redirect: '/dashboard'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat login',
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user dan destroy session
   */
  static async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Gagal logout'
          });
        }

        // Clear cookie
        res.clearCookie('connect.sid');

        res.json({
          success: true,
          message: 'Logout berhasil',
          redirect: '/login'
        });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat logout',
        error: error.message
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current logged in user info
   */
  static async me(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: 'Tidak ada user yang login',
          isAuthenticated: false
        });
      }

      res.json({
        success: true,
        isAuthenticated: true,
        data: req.session.user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan',
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/register
   * Register user baru
   */
  static async register(req, res) {
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
        message: 'Registrasi berhasil',
        data: {
          id_user: result.insertId,
          nama,
          email,
          role,
          keterangan
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat registrasi',
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  static async changePassword(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          success: false,
          message: 'Anda harus login terlebih dahulu'
        });
      }

      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Password lama dan password baru harus diisi'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 6 karakter'
        });
      }

      // Get user dari database
      const users = await query(
        'SELECT password FROM users WHERE id_user = ?',
        [req.session.user.id_user]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(old_password, users[0].password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password lama salah'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await query(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id_user = ?',
        [hashedPassword, req.session.user.id_user]
      );

      res.json({
        success: true,
        message: 'Password berhasil diubah'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengubah password',
        error: error.message
      });
    }
  }
}

export default AuthController;
