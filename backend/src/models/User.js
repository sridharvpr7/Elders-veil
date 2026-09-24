const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    if (db.isPgConnected()) {
      const res = await db.query("SELECT *, CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN FALSE ELSE is_premium END AS is_premium, CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN TRUE ELSE FALSE END AS premium_expired FROM users WHERE email = $1", [email]);
      return res.rows[0] || null;
    }
    const user=db.fallbackStore.users.find(u=>u.email.toLowerCase()===String(email).toLowerCase()) || null; if(user&&user.is_premium&&user.premium_expires_at&&new Date(user.premium_expires_at)<=new Date()){user.is_premium=false;user.premium_expired=true;db.saveFallbackStore();} return user;
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
      const res = await db.query("SELECT id, username, email, role, phone, CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN FALSE ELSE is_premium END AS is_premium, premium_expires_at, CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN TRUE ELSE FALSE END AS premium_expired, account_status, avatar, created_at, updated_at FROM users WHERE id = $1", [id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    if (user.is_premium && user.premium_expires_at && new Date(user.premium_expires_at) <= new Date()) {
      user.is_premium = false;
      user.premium_expired = true;
      db.saveFallbackStore();
    }
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
         RETURNING id, username, email, role, phone, is_premium, premium_expires_at, account_status, avatar, created_at, updated_at`,
        [id, username, email, password_hash, role, phone, avatar, now, now]
      );
      return res.rows[0];
    }

    const newUser = { id, username, email, password_hash, role, phone, is_premium: false, premium_expires_at: null, account_status: 'active', avatar, created_at: now, updated_at: now };
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
         WHERE id = $3 RETURNING id, username, email, role, phone, is_premium, premium_expires_at, account_status, avatar, created_at, updated_at`,
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
      const res = await db.query("SELECT id, username, email, role, phone, CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN FALSE ELSE is_premium END AS is_premium, premium_expires_at, CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN TRUE ELSE FALSE END AS premium_expired, account_status, avatar, created_at FROM users ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at DESC");
      return res.rows;
    }
    return db.fallbackStore.users
      .map(({ password_hash, ...rest }) => rest)
      .map(u => { if (u.is_premium && u.premium_expires_at && new Date(u.premium_expires_at) <= new Date()) { u.is_premium = false; u.premium_expired = true; db.saveFallbackStore(); } return u; })
      .sort((a,b) => (a.role === 'admin' ? -1 : 1) - (b.role === 'admin' ? -1 : 1) || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
  static async setStatus(id, accountStatus) {
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET account_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role, phone, is_premium, premium_expires_at, account_status, avatar, created_at`, [accountStatus, id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    user.account_status = accountStatus;
    user.updated_at = new Date();
    db.saveFallbackStore();
    const { password_hash, ...safe } = user; return safe;
  }

  static async setPremium(id, isPremium, durationMonths = 1) {
    const enabled = !!isPremium;
    let expiresAt = null; if (enabled) { expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + Math.max(1, Number(durationMonths) || 1)); }
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET is_premium = $1, premium_expires_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, role, phone, is_premium, premium_expires_at, account_status, avatar, created_at`, [enabled, expiresAt, id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    user.is_premium = enabled;
    user.premium_expires_at = expiresAt;
    user.premium_expired = false;
    user.updated_at = new Date();
    db.saveFallbackStore();
    const { password_hash, ...safe } = user; return safe;
  }

  static async deleteById(id) {
    if (db.isPgConnected()) {
      // Related user-owned records use ON DELETE CASCADE; comics keep their creator via SET NULL.
      const res = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, username, email, role, phone, is_premium, premium_expires_at, account_status, avatar, created_at', [id]);
      return res.rows[0] || null;
    }
    const index = db.fallbackStore.users.findIndex(u => u.id === id);
    if (index < 0) return null;
    const [deleted] = db.fallbackStore.users.splice(index, 1);
    const owned = ['bookmarks','favorites','reading_history','refresh_tokens','notifications','notification_preferences','comic_likes','comic_follows','ratings','comments'];
    owned.forEach(key => {
      if (Array.isArray(db.fallbackStore[key])) {
        db.fallbackStore[key] = db.fallbackStore[key].filter(x => x.user_id !== id);
      }
    });
    db.fallbackStore.comics.forEach(c => {
      if (c.creator_id === id) c.creator_id = null;
      if (c.creatorId === id) c.creatorId = null;
    });
    db.saveFallbackStore();
    const { password_hash, ...safe } = deleted;
    return safe;
  }

  static async setRole(id, role) {
    if (!['user','creator','admin'].includes(role)) return null;
    if (db.isPgConnected()) {
      const r=await db.query(`UPDATE users SET role=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING id,username,email,role,phone,is_premium,premium_expires_at,account_status,avatar,created_at`,[role,id]);
      return r.rows[0]||null;
    }
    const u=db.fallbackStore.users.find(x=>x.id===id); if(!u)return null;u.role=role;u.updated_at=new Date();db.saveFallbackStore();const {password_hash,...safe}=u;return safe;
  }

  static async becomeCreator(id) {
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET role = CASE WHEN role = 'admin' THEN role ELSE 'creator' END, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND account_status = 'active' RETURNING id, username, email, role, phone, is_premium, premium_expires_at, account_status, avatar, created_at`, [id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user || user.account_status !== 'active') return null;
    if (user.role !== 'admin') user.role = 'creator'; user.updated_at = new Date(); db.saveFallbackStore();
    const { password_hash, ...safe } = user; return safe;
  }

}

module.exports = User;
