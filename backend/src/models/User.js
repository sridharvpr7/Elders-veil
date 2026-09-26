const db = require('../config/database');
const bcrypt = require('bcryptjs');

function normalizeUserPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

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

  static async findByPhone(phone) {
    const normalized = normalizeUserPhone(phone);
    if (!normalized) return null;
    const indianLocal = normalized.startsWith('91') && normalized.length === 12 ? normalized.slice(2) : null;

    if (db.isPgConnected()) {
      const values = indianLocal ? [normalized, indianLocal] : [normalized];
      const res = await db.query(
        `SELECT id, username, email, role, phone, is_premium, premium_expires_at, account_status, avatar, created_at, updated_at
         FROM users
         WHERE regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = ANY($1::text[])
         LIMIT 1`,
        [values]
      );
      return res.rows[0] || null;
    }

    return db.fallbackStore.users.find((user) => {
      const stored = normalizeUserPhone(user.phone);
      return stored === normalized || (indianLocal && stored === indianLocal);
    }) || null;
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
        `INSERT INTO users (id, username, email, password_hash, role, phone, avatar, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9)
         RETURNING id, username, email, role, phone, is_premium, premium_expires_at, account_status, avatar, email_verified, created_at, updated_at`,
        [id, username, email, password_hash, role, phone, avatar, now, now]
      );
      return res.rows[0];
    }

    const newUser = { id, username, email, password_hash, role, phone, email_verified: false, otp_hash: null, otp_expiry: null, otp_attempts: 0, reset_otp_hash: null, reset_otp_expiry: null, reset_otp_attempts: 0, is_premium: false, premium_expires_at: null, account_status: 'active', avatar, created_at: now, updated_at: now };
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

  static async setOTP(id, otpHash, expiry) {
    if (db.isPgConnected()) {
      await db.query('UPDATE users SET otp_hash=$1, otp_expiry=$2, otp_attempts=0, updated_at=CURRENT_TIMESTAMP WHERE id=$3', [otpHash, expiry, id]);
      return true;
    }
    const user=db.fallbackStore.users.find(u=>u.id===id); if(!user)return false;
    user.otp_hash=otpHash; user.otp_expiry=expiry; user.otp_attempts=0; db.saveFallbackStore(); return true;
  }

  static async incrementOTPAttempts(id, reset=false) {
    const hashField=reset?'reset_otp_attempts':'otp_attempts';
    if (db.isPgConnected()) {
      await db.query(`UPDATE users SET ${hashField}=COALESCE(${hashField},0)+1 WHERE id=$1`, [id]);
      return true;
    }
    const user=db.fallbackStore.users.find(u=>u.id===id); if(!user)return false;
    user[hashField]=(user[hashField]||0)+1; db.saveFallbackStore(); return true;
  }

  static async setVerified(id) {
    if (db.isPgConnected()) {
      await db.query('UPDATE users SET email_verified=TRUE, otp_hash=NULL, otp_expiry=NULL, otp_attempts=0, updated_at=CURRENT_TIMESTAMP WHERE id=$1', [id]);
      return true;
    }
    const user=db.fallbackStore.users.find(u=>u.id===id); if(!user)return false;
    user.email_verified=true; user.otp_hash=null; user.otp_expiry=null; user.otp_attempts=0; user.updated_at=new Date(); db.saveFallbackStore(); return true;
  }

  static async setResetOTP(id, otpHash, expiry) {
    if (db.isPgConnected()) {
      await db.query('UPDATE users SET reset_otp_hash=$1, reset_otp_expiry=$2, reset_otp_attempts=0, updated_at=CURRENT_TIMESTAMP WHERE id=$3', [otpHash, expiry, id]);
      return true;
    }
    const user=db.fallbackStore.users.find(u=>u.id===id); if(!user)return false;
    user.reset_otp_hash=otpHash; user.reset_otp_expiry=expiry; user.reset_otp_attempts=0; db.saveFallbackStore(); return true;
  }

  static async clearResetOTP(id) {
    if (db.isPgConnected()) {
      await db.query('UPDATE users SET reset_otp_hash=NULL, reset_otp_expiry=NULL, reset_otp_attempts=0, updated_at=CURRENT_TIMESTAMP WHERE id=$1', [id]);
      return true;
    }
    const user=db.fallbackStore.users.find(u=>u.id===id); if(!user)return false;
    user.reset_otp_hash=null; user.reset_otp_expiry=null; user.reset_otp_attempts=0; db.saveFallbackStore(); return true;
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
