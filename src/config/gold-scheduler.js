/**
 * Gold Price Scheduler
 * Fetch harga emas otomatis dari API
 *
 * PERINGATAN: API metals.dev memiliki limit 100 request/bulan
 * Konfigurasi saat ini:
 * - Scheduler: 3x sehari (06:00, 14:00, 22:00) = ~90 request/bulan
 * - Manual refresh: Maksimal 10x/bulan
 *
 * Default: DISABLED
 * Untuk mengaktifkan, set ENABLE_GOLD_SCHEDULER=true di .env
 */

import { query } from './database.js';
import dotenv from 'dotenv';

dotenv.config();

const SCHEDULER_ENABLED = process.env.ENABLE_GOLD_SCHEDULER === 'true';
const API_KEY = process.env.METALS_API_KEY || 'QWTJB0KX5AH01IVHGVVQ846VHGVVQ';
const API_URL = `https://api.metals.dev/v1/metal/spot?api_key=${API_KEY}&metal=gold&currency=IDR`;
const USAGE_URL = `https://api.metals.dev/usage?api_key=${API_KEY}`;

// Scheduler: 3x sehari (setiap 8 jam)
// Jam: 06:00, 14:00, 22:00 WIB
const SCHEDULE_HOURS = [6, 14, 22];

// Limit manual refresh per bulan (sisanya dari 100 - 90 scheduler)
const MAX_MANUAL_REFRESH_PER_MONTH = 10;

let schedulerTimeout = null;
let isRunning = false;

/**
 * Cek API usage sebelum fetch
 */
async function checkApiUsage() {
  try {
    const response = await fetch(USAGE_URL);
    const data = await response.json();

    if (data.status === 'success') {
      const used = parseInt(data.used) || 0;
      const total = parseInt(data.total) || 100;
      const remaining = total - used;

      console.log(`API Usage: ${used}/${total} | Remaining: ${remaining}`);

      return { used, total, remaining, hasLimit: remaining <= 0 };
    }

    return { hasLimit: false };
  } catch (error) {
    console.error('Error checking API usage:', error.message);
    return { hasLimit: false };
  }
}

// Flag untuk cek apakah kolom source sudah ada
let hasSourceColumn = null;

/**
 * Cek apakah tabel emas memiliki kolom 'source'
 */
async function checkSourceColumn() {
  if (hasSourceColumn !== null) return hasSourceColumn;
  
  try {
    const columns = await query('DESCRIBE emas');
    hasSourceColumn = columns.some(col => col.Field === 'source');
    console.log(`Column 'source' exists: ${hasSourceColumn}`);
    return hasSourceColumn;
  } catch (error) {
    console.error('Error checking source column:', error.message);
    hasSourceColumn = false;
    return false;
  }
}

/**
 * Cek limit manual refresh dari database
 * Menghitung jumlah manual refresh di bulan ini
 */
async function checkManualRefreshLimit() {
  try {
    // Cek apakah kolom source ada
    const sourceExists = await checkSourceColumn();
    
    if (!sourceExists) {
      // Jika kolom source tidak ada, skip limit check
      console.log('Column source not found, skipping manual limit check');
      return { count: 0, limit: MAX_MANUAL_REFRESH_PER_MONTH, remaining: MAX_MANUAL_REFRESH_PER_MONTH, exceeded: false };
    }
    
    // Hitung manual refresh di bulan ini
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await query(
      `SELECT COUNT(*) as count FROM emas
       WHERE source = 'manual'
       AND timestamp >= ?`,
      [firstDayOfMonth]
    );

    const manualCount = result[0]?.count || 0;
    const remaining = MAX_MANUAL_REFRESH_PER_MONTH - manualCount;

    console.log(`Manual refresh this month: ${manualCount}/${MAX_MANUAL_REFRESH_PER_MONTH} | Remaining: ${remaining}`);

    return {
      count: manualCount,
      limit: MAX_MANUAL_REFRESH_PER_MONTH,
      remaining: remaining,
      exceeded: remaining <= 0
    };
  } catch (error) {
    console.error('Error checking manual refresh limit:', error.message);
    return { count: 0, limit: MAX_MANUAL_REFRESH_PER_MONTH, remaining: MAX_MANUAL_REFRESH_PER_MONTH, exceeded: false };
  }
}

/**
 * Fetch harga emas dari API
 * @param {string} source - 'scheduler' atau 'manual'
 */
async function fetchGoldPrice(source = 'scheduler') {
  const isManual = source === 'manual';

  // Untuk manual refresh, cek limit terlebih dahulu
  if (isManual) {
    const manualLimit = await checkManualRefreshLimit();

    if (manualLimit.exceeded) {
      console.warn(`Manual refresh limit exceeded! (${manualLimit.count}/${MAX_MANUAL_REFRESH_PER_MONTH})`);
      return {
        success: false,
        error: 'MANUAL_LIMIT_EXCEEDED',
        message: `Batas manual refresh bulan ini sudah tercapai (${MAX_MANUAL_REFRESH_PER_MONTH}x). Silakan coba lagi bulan depan.`,
        manualLimit: manualLimit
      };
    }
  }

  // Cek API usage
  const usage = await checkApiUsage();

  if (usage.hasLimit) {
    console.warn('API limit reached! Skipping fetch.');
    const errorMsg = isManual
      ? 'API quota bulanan sudah habis. Silakan coba lagi bulan depan.'
      : 'API limit reached';
    return {
      success: false,
      error: 'API_LIMIT_EXCEEDED',
      message: errorMsg
    };
  }

  try {
    console.log(`Fetching gold price from API (${source})...`);

    const response = await fetch(API_URL);

    // Handle rate limit
    if (response.status === 429) {
      console.warn('Rate limit exceeded (429).');
      return {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'API rate limit exceeded. Silakan coba lagi nanti.'
      };
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(`API returned status: ${data.status}`);
    }

    // Cek duplikat berdasarkan timestamp
    const existing = await query(
      'SELECT id_emas FROM emas WHERE timestamp = ?',
      [new Date(data.timestamp)]
    );

    if (existing.length > 0) {
      console.log('Gold price for this timestamp already exists, skipping...');
      return { success: true, message: 'Data already exists', data: data };
    }

    // Cek apakah kolom source ada
    const sourceExists = await checkSourceColumn();

    // Simpan ke database
    if (sourceExists) {
      // Dengan kolom source
      await query(
        `INSERT INTO emas (timestamp, currency, metal, unit, price, ask, bid, high, low, change_value, change_percent, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          new Date(data.timestamp),
          data.currency,
          data.metal,
          data.unit,
          data.rate.price,
          data.rate.ask,
          data.rate.bid,
          data.rate.high,
          data.rate.low,
          data.rate.change,
          data.rate.change_percent,
          source
        ]
      );
    } else {
      // Tanpa kolom source (untuk backward compatibility)
      await query(
        `INSERT INTO emas (timestamp, currency, metal, unit, price, ask, bid, high, low, change_value, change_percent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          new Date(data.timestamp),
          data.currency,
          data.metal,
          data.unit,
          data.rate.price,
          data.rate.ask,
          data.rate.bid,
          data.rate.high,
          data.rate.low,
          data.rate.change,
          data.rate.change_percent
        ]
      );
    }

    console.log(`✓ Gold price saved: ${formatPrice(data.rate.price)}/toz (${data.timestamp}) [${source}]`);

    return { success: true, data: data };
  } catch (error) {
    console.error('✗ Error fetching gold price:', error.message);
    throw error;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Hitung milisecond sampai jadwal berikutnya
 */
function getMsUntilNextSchedule() {
  const now = new Date();
  const currentHour = now.getHours();

  // Cari jadwal berikutnya hari ini
  for (const hour of SCHEDULE_HOURS) {
    if (currentHour < hour) {
      const next = new Date(now);
      next.setHours(hour, 0, 0, 0);
      return next.getTime() - now.getTime();
    }
  }

  // Jika tidak ada jadwal lagi hari ini, schedule ke jam pertama besok
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(SCHEDULE_HOURS[0], 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

/**
 * Format jadwal berikutnya untuk logging
 */
function getNextScheduleTime() {
  const now = new Date();
  const currentHour = now.getHours();

  for (const hour of SCHEDULE_HOURS) {
    if (currentHour < hour) {
      const next = new Date(now);
      next.setHours(hour, 0, 0, 0);
      return next.toLocaleString('id-ID');
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(SCHEDULE_HOURS[0], 0, 0, 0);
  return tomorrow.toLocaleString('id-ID');
}

/**
 * Jalankan scheduler loop
 */
async function runScheduler() {
  if (!isRunning) return;

  try {
    await fetchGoldPrice();
  } catch (error) {
    // Error sudah ditangani di fetchGoldPrice
  }

  // Schedule next run
  const msUntilNext = getMsUntilNextSchedule();
  const nextTime = getNextScheduleTime();

  console.log(`Next fetch scheduled at: ${nextTime} (in ${Math.round(msUntilNext / 60000)} minutes)`);

  schedulerTimeout = setTimeout(runScheduler, msUntilNext);
}

/**
 * Start scheduler
 */
export function startGoldScheduler() {
  if (!SCHEDULER_ENABLED) {
    console.log('Gold price scheduler is DISABLED.');
    console.log('To enable, set ENABLE_GOLD_SCHEDULER=true in .env');
    console.log('');
    console.log('Current configuration:');
    console.log(`  - Schedule: ${SCHEDULE_HOURS.length}x daily at ${SCHEDULE_HOURS.join(':00, ')}:00 WIB`);
    console.log(`  - Est. monthly: ${SCHEDULE_HOURS.length * 30} requests (limit: 100)`);
    return;
  }

  if (isRunning) {
    console.log('Gold price scheduler is already running');
    return;
  }

  isRunning = true;

  console.log('');
  console.log('========================================');
  console.log('  GOLD PRICE SCHEDULER STARTED');
  console.log('========================================');
  console.log(`Schedule: ${SCHEDULE_HOURS.length}x daily at ${SCHEDULE_HOURS.join(':00, ')}:00 WIB`);
  console.log(`Est. monthly usage: ${SCHEDULE_HOURS.length * 30} requests (limit: 100)`);
  console.log('========================================');
  console.log('');

  // Run immediately then schedule
  fetchGoldPrice().catch(err => {
    console.error('Initial fetch failed:', err.message);
  });

  const msUntilNext = getMsUntilNextSchedule();
  const nextTime = getNextScheduleTime();

  console.log(`Next fetch scheduled at: ${nextTime} (in ${Math.round(msUntilNext / 60000)} minutes)`);
  console.log('');

  schedulerTimeout = setTimeout(runScheduler, msUntilNext);
}

/**
 * Stop scheduler
 */
export function stopGoldScheduler() {
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }
  isRunning = false;
  console.log('Gold price scheduler stopped');
}

/**
 * Manual fetch dengan limit 10x/bulan
 */
export async function manualFetch() {
  console.log('Manual gold price fetch triggered...');
  return await fetchGoldPrice('manual');
}

/**
 * Cek limit manual refresh (untuk API endpoint)
 */
export async function getManualRefreshStatus() {
  return await checkManualRefreshLimit();
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  const msUntilNext = isRunning ? getMsUntilNextSchedule() : 0;

  return {
    enabled: SCHEDULER_ENABLED,
    running: isRunning,
    schedule: `${SCHEDULE_HOURS.length}x daily at ${SCHEDULE_HOURS.join(':00, ')}:00`,
    nextRun: isRunning ? getNextScheduleTime() : null,
    nextRunInMinutes: isRunning ? Math.round(msUntilNext / 60000) : 0,
    estimatedMonthlyRequests: SCHEDULE_HOURS.length * 30,
    manualRefreshLimit: MAX_MANUAL_REFRESH_PER_MONTH,
    apiLimit: '100 requests/month'
  };
}

// Auto-start jika enabled
if (SCHEDULER_ENABLED) {
  startGoldScheduler();
}
