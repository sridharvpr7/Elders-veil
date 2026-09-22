const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    if (db.isPgConnected()) {
      const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0] || null;
    }
    return db.fallbackStore.users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
  }

  static async findByUsername(username) {
    if (db.isPgConnected()) {
      const res = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      return res.rows[0] || null;
    }
    return db.fallbackStore.users.find(u => u.username.toLowerCase() === String(username).toLowerCase()) || null;
  }

  static async findById(id) {
    if (db.isPgConnected()) {
      const res = await db.query('SELECT id, username, email, role, phone, is_premium, account_status, avatar, created_at, updated_at FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  static async create({ id, username, email, password, role = 'user', phone = null, avatar = null }) {
    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date();

    if (db.isPgConnected()) {
      const res = await db.query(
        `INSERT INTO users (id, username, email, password_hash, role, phone, avatar, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, username, email, role, phone, is_premium, account_status, avatar, created_at, updated_at`,
        [id, username, email, password_hash, role, phone, avatar, now, now]
      );
      return res.rows[0];
    }

    const newUser = { id, username, email, password_hash, role, phone, is_premium: false, account_status: 'active', avatar, created_at: now, updated_at: now };
    db.fallbackStore.users.push(newUser);
    db.saveFallbackStore();
    const { password_hash: _, ...safeUser } = newUser;
    return safeUser;
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async updateProfile(id, { username, avatar }) {
    if (db.isPgConnected()) {
      const res = await db.query(
        `UPDATE users SET username = COALESCE($1, username), avatar = COALESCE($2, avatar), updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 RETURNING id, username, email, role, avatar, updated_at`,
        [username, avatar, id]
      );
      return res.rows[0];
    }

    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    user.updated_at = new Date();
    db.saveFallbackStore();
    const { password_hash, ...safe } = user;
    return safe;
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    if (db.isPgConnected()) {
      await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [password_hash, id]);
      return true;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (user) {
      user.password_hash = password_hash;
      user.updated_at = new Date();
      db.saveFallbackStore();
      return true;
    }
    return false;
  }

  static async getAll() {
    if (db.isPgConnected()) {
      const res = await db.query('SELECT id, username, email, role, phone, is_premium, account_status, avatar, created_at FROM users ORDER BY created_at DESC');
      return res.rows;
    }
    return db.fallbackStore.users.map(({ password_hash, ...rest }) => rest);
  }
  static async setStatus(id, accountStatus) {
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET account_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role, phone, is_premium, account_status, avatar, created_at`, [accountStatus, id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    user.account_status = accountStatus;
    user.updated_at = new Date();
    db.saveFallbackStore();
    const { password_hash, ...safe } = user; return safe;
  }

  static async setPremium(id, isPremium) {
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET is_premium = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role, phone, is_premium, account_status, avatar, created_at`, [!!isPremium, id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    user.is_premium = !!isPremium; user.updated_at = new Date(); db.saveFallbackStore();
    const { password_hash, ...safe } = user; return safe;
  }

  static async becomeCreator(id) {
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET role = CASE WHEN role = 'admin' THEN role ELSE 'creator' END, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND account_status = 'active' RETURNING id, username, email, role, phone, is_premium, account_status, avatar, created_at`, [id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user || user.account_status !== 'active') return null;
    if (user.role !== 'admin') user.role = 'creator'; user.updated_at = new Date(); db.saveFallbackStore();
    const { password_hash, ...safe } = user; return safe;
  }

}

module.exports = User;
