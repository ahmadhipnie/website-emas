/**
 * Script untuk membuat default users dengan password ter-hash
 * Jalankan dengan: node database/create-users.js
 */

import bcrypt from 'bcrypt';
import { query } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function createDefaultUsers() {
  try {
    console.log('🔐 Creating default users...\n');

    // Hash passwords
    const adminPassword = await bcrypt.hash('password123', 10);
    const userPassword = await bcrypt.hash('password123', 10);

    // Check if users already exist
    const existingAdmin = await query('SELECT id_user FROM users WHERE email = ?', ['admin@websiteemas.com']);
    const existingUser = await query('SELECT id_user FROM users WHERE email = ?', ['user@websiteemas.com']);

    // Insert admin if not exists
    if (existingAdmin.length === 0) {
      await query(
        'INSERT INTO users (nama, email, password, role, keterangan) VALUES (?, ?, ?, ?, ?)',
        ['Administrator', 'admin@websiteemas.com', adminPassword, 'admin', 'Administrator sistem']
      );
      console.log('✅ Admin user created');
      console.log('   Email: admin@websiteemas.com');
      console.log('   Password: password123');
      console.log('   Role: admin\n');
    } else {
      console.log('ℹ️  Admin user already exists\n');
    }

    // Insert demo user if not exists
    if (existingUser.length === 0) {
      await query(
        'INSERT INTO users (nama, email, password, role, keterangan) VALUES (?, ?, ?, ?, ?)',
        ['User Demo', 'user@websiteemas.com', userPassword, 'user', 'User demo untuk testing']
      );
      console.log('✅ Demo user created');
      console.log('   Email: user@websiteemas.com');
      console.log('   Password: password123');
      console.log('   Role: user\n');
    } else {
      console.log('ℹ️  Demo user already exists\n');
    }

    console.log('✅ User creation completed!\n');
    console.log('You can now login with:');
    console.log('- admin@websiteemas.com / password123 (Admin)');
    console.log('- user@websiteemas.com / password123 (User)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    process.exit(1);
  }
}

createDefaultUsers();
