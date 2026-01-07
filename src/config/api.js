/**
 * Database API Routes
 * Endpoints untuk testing dan operasi database
 */

import express from 'express';
import { query } from '../config/database.js';
import { manualFetch, getManualRefreshStatus } from '../config/gold-scheduler.js';

const router = express.Router();

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
