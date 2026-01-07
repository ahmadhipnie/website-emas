/**
 * Database API Routes
 * Endpoints untuk testing dan operasi database
 */

import express from 'express';
import { query } from '../config/database.js';

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



export default router;
