/**
 * User Model
 * Contoh model untuk operasi database users
 */

import { query, getConnection } from '../config/database.js';

class UserModel {
  /**
   * Get all users
   * @param {number} limit - Number of records to return
   * @param {number} offset - Starting position
   */
  static async getAll(limit = 10, offset = 0) {
    const sql = 'SELECT id, username, email, created_at FROM users LIMIT ? OFFSET ?';
    return await query(sql, [limit, offset]);
  }

  /**
   * Get user by ID
   * @param {number} id - User ID
   */
  static async getById(id) {
    const sql = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  /**
   * Get user by email
   * @param {string} email - User email
   */
  static async getByEmail(email) {
    const sql = 'SELECT id, username, email, created_at FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    return results[0] || null;
  }

  /**
   * Create new user
   * @param {object} userData - User data {username, email, password}
   */
  static async create(userData) {
    const { username, email, password } = userData;
    const sql = 'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())';
    const result = await query(sql, [username, email, password]);
    return {
      id: result.insertId,
      username,
      email
    };
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {object} userData - Data to update
   */
  static async update(id, userData) {
    const fields = [];
    const values = [];

    if (userData.username) {
      fields.push('username = ?');
      values.push(userData.username);
    }
    if (userData.email) {
      fields.push('email = ?');
      values.push(userData.email);
    }
    if (userData.password) {
      fields.push('password = ?');
      values.push(userData.password);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const result = await query(sql, values);
    return result.affectedRows > 0;
  }

  /**
   * Delete user
   * @param {number} id - User ID
   */
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Count total users
   */
  static async count() {
    const sql = 'SELECT COUNT(*) as total FROM users';
    const results = await query(sql);
    return results[0].total;
  }

  /**
   * Search users by username or email
   * @param {string} searchTerm - Search term
   */
  static async search(searchTerm) {
    const sql = `
      SELECT id, username, email, created_at 
      FROM users 
      WHERE username LIKE ? OR email LIKE ?
      LIMIT 20
    `;
    const term = `%${searchTerm}%`;
    return await query(sql, [term, term]);
  }
}

export default UserModel;
