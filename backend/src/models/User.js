const db = require('../config/database');
const bcrypt = require('bcryptjs');

function normalizeUserPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function isValidIndianMobile(phone) {
  const digits = normalizeUserPhone(phone);
  // Indian 10 digit format starting with 6-9, or +91 format
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return true;
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) return true;
  return false;
}

class User {
  static validateIndianMobile(phone) {
    return isValidIndianMobile(phone);
  }

  static async findByEmail(email) {
    if (db.isPgConnected()) {
      const res = await db.query(
        `SELECT *, 
                CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN FALSE ELSE is_premium END AS is_premium, 
                CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN TRUE ELSE FALSE END AS premium_expired 
         FROM users WHERE email = $1`,
        [email]
      );
      if (!res.rows[0]) return null;
      const user = res.rows[0];
      if (user.email_verified === null || user.email_verified === undefined) user.email_verified = true;
      user.mobile_number = user.mobile_number || user.phone || null;
      return user;
    }

    const user = db.fallbackStore.users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
    if (user) {
      if (user.email_verified === undefined) user.email_verified = true;
      user.mobile_number = user.mobile_number || user.phone || null;
      if (user.is_premium && user.premium_expires_at && new Date(user.premium_expires_at) <= new Date()) {
        user.is_premium = false;
        user.premium_expired = true;
        db.saveFallbackStore();
      }
    }
    return user;
  }

  static async findByUsername(username) {
    if (db.isPgConnected()) {
      const res = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      if (!res.rows[0]) return null;
      const user = res.rows[0];
      if (user.email_verified === null || user.email_verified === undefined) user.email_verified = true;
      user.mobile_number = user.mobile_number || user.phone || null;
      return user;
    }
    const user = db.fallbackStore.users.find(u => u.username.toLowerCase() === String(username).toLowerCase()) || null;
    if (user) {
      if (user.email_verified === undefined) user.email_verified = true;
      user.mobile_number = user.mobile_number || user.phone || null;
    }
    return user;
  }

  static async findByPhone(phone) {
    const normalized = normalizeUserPhone(phone);
    if (!normalized) return null;
    const indianLocal = normalized.startsWith('91') && normalized.length === 12 ? normalized.slice(2) : null;

    if (db.isPgConnected()) {
      const values = indianLocal ? [normalized, indianLocal] : [normalized];
      const res = await db.query(
        `SELECT id, username, email, role, phone, mobile_number, is_premium, premium_expires_at, premium_status, account_status, email_verified, avatar, created_at, updated_at
         FROM users
         WHERE regexp_replace(COALESCE(phone, mobile_number, ''), '\\D', '', 'g') = ANY($1::text[])
         LIMIT 1`,
        [values]
      );
      if (!res.rows[0]) return null;
      const user = res.rows[0];
      if (user.email_verified === null || user.email_verified === undefined) user.email_verified = true;
      return user;
    }

    const user = db.fallbackStore.users.find((u) => {
      const stored = normalizeUserPhone(u.phone || u.mobile_number);
      return stored === normalized || (indianLocal && stored === indianLocal);
    }) || null;
    if (user && user.email_verified === undefined) user.email_verified = true;
    return user;
  }

  static async findById(id) {
    if (db.isPgConnected()) {
      const res = await db.query(
        `SELECT id, username, email, role, phone, mobile_number, 
                CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN FALSE ELSE is_premium END AS is_premium, 
                premium_expires_at, 
                CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN TRUE ELSE FALSE END AS premium_expired, 
                premium_status, premium_requested_at, premium_approved_at, premium_rejected_at, premium_request_note,
                account_status, email_verified, avatar, created_at, updated_at 
         FROM users WHERE id = $1`,
        [id]
      );
      if (!res.rows[0]) return null;
      const user = res.rows[0];
      if (user.email_verified === null || user.email_verified === undefined) user.email_verified = true;
      user.mobile_number = user.mobile_number || user.phone || null;
      return user;
    }

    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    if (user.email_verified === undefined) user.email_verified = true;
    user.mobile_number = user.mobile_number || user.phone || null;
    if (user.is_premium && user.premium_expires_at && new Date(user.premium_expires_at) <= new Date()) {
      user.is_premium = false;
      user.premium_expired = true;
      db.saveFallbackStore();
    }
    const { password_hash, otp_hash, reset_otp_hash, ...safeUser } = user;
    return safeUser;
  }

  static async create({ id, username, email, password, role = 'user', phone = null, mobile_number = null, avatar = null, email_verified = false }) {
    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date();
    const finalPhone = mobile_number || phone;

    if (db.isPgConnected()) {
      const res = await db.query(
        `INSERT INTO users (id, username, email, password_hash, role, phone, mobile_number, avatar, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, username, email, role, phone, mobile_number, is_premium, premium_expires_at, premium_status, account_status, email_verified, avatar, created_at, updated_at`,
        [id, username, email, password_hash, role, finalPhone, finalPhone, avatar, email_verified, now, now]
      );
      return res.rows[0];
    }

    const newUser = {
      id,
      username,
      email,
      password_hash,
      role,
      phone: finalPhone,
      mobile_number: finalPhone,
      is_premium: false,
      premium_expires_at: null,
      premium_status: 'none',
      premium_requested_at: null,
      premium_approved_at: null,
      premium_rejected_at: null,
      premium_request_note: null,
      premium_approved_by: null,
      account_status: 'active',
      email_verified: !!email_verified,
      otp_hash: null,
      otp_expiry: null,
      otp_attempts: 0,
      reset_otp_hash: null,
      reset_otp_expiry: null,
      reset_otp_attempts: 0,
      avatar,
      created_at: now,
      updated_at: now
    };
    db.fallbackStore.users.push(newUser);
    db.saveFallbackStore();
    const { password_hash: _, ...safeUser } = newUser;
    return safeUser;
  }

  static async requestPremium(userId, note = '') {
    const now = new Date();
    const reqId = `premq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (db.isPgConnected()) {
      await db.query(
        `UPDATE users SET premium_status = 'pending', premium_requested_at = $1, premium_request_note = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [now, note, userId]
      );
      await db.query(
        `INSERT INTO premium_requests (id, user_id, status, request_note, created_at, updated_at) VALUES ($1, $2, 'pending', $3, $4, $5)`,
        [reqId, userId, note, now, now]
      );
    } else {
      const user = db.fallbackStore.users.find(u => u.id === userId);
      if (user) {
        user.premium_status = 'pending';
        user.premium_requested_at = now;
        user.premium_request_note = note;
        user.updated_at = now;
      }
      db.fallbackStore.premium_requests ??= [];
      db.fallbackStore.premium_requests.push({
        id: reqId,
        user_id: userId,
        status: 'pending',
        request_note: note,
        created_at: now,
        updated_at: now,
        reviewed_by: null,
        reviewed_at: null
      });
      db.saveFallbackStore();
    }
    return { id: reqId, userId, status: 'pending', note, createdAt: now };
  }

  static async getPendingPremiumRequests() {
    if (db.isPgConnected()) {
      const res = await db.query(
        `SELECT pr.*, u.username, u.email, COALESCE(u.mobile_number, u.phone) AS mobile_number, u.is_premium
         FROM premium_requests pr
         JOIN users u ON u.id = pr.user_id
         WHERE pr.status = 'pending'
         ORDER BY pr.created_at DESC`
      );
      return res.rows;
    }
    db.fallbackStore.premium_requests ??= [];
    return db.fallbackStore.premium_requests
      .filter(pr => pr.status === 'pending')
      .map(pr => {
        const u = db.fallbackStore.users.find(user => user.id === pr.user_id);
        return {
          ...pr,
          username: u?.username || 'Unknown',
          email: u?.email || 'Unknown',
          mobile_number: u?.mobile_number || u?.phone || null,
          is_premium: !!u?.is_premium
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async approvePremiumRequest(userIdOrRequestId, adminId, durationMonths = 1) {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + Math.max(1, Number(durationMonths) || 1));

    if (db.isPgConnected()) {
      // Get target user_id
      const resReq = await db.query(`SELECT * FROM premium_requests WHERE id = $1 OR user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userIdOrRequestId]);
      const targetUserId = resReq.rows[0] ? resReq.rows[0].user_id : userIdOrRequestId;

      await db.query(
        `UPDATE users 
         SET is_premium = TRUE, premium_expires_at = $1, premium_status = 'approved', premium_approved_at = $2, premium_approved_by = $3, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4`,
        [expiresAt, now, adminId, targetUserId]
      );
      await db.query(
        `UPDATE premium_requests SET status = 'approved', reviewed_by = $1, reviewed_at = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND status = 'pending'`,
        [adminId, now, targetUserId]
      );
      return await this.findById(targetUserId);
    }

    db.fallbackStore.premium_requests ??= [];
    const pr = db.fallbackStore.premium_requests.find(x => (x.id === userIdOrRequestId || x.user_id === userIdOrRequestId) && x.status === 'pending');
    const targetUserId = pr ? pr.user_id : userIdOrRequestId;
    if (pr) {
      pr.status = 'approved';
      pr.reviewed_by = adminId;
      pr.reviewed_at = now;
      pr.updated_at = now;
    }

    const user = db.fallbackStore.users.find(u => u.id === targetUserId);
    if (user) {
      user.is_premium = true;
      user.premium_expires_at = expiresAt;
      user.premium_status = 'approved';
      user.premium_approved_at = now;
      user.premium_approved_by = adminId;
      user.updated_at = now;
      db.saveFallbackStore();
    }
    return user ? await this.findById(user.id) : null;
  }

  static async rejectPremiumRequest(userIdOrRequestId, adminId, note = '') {
    const now = new Date();

    if (db.isPgConnected()) {
      const resReq = await db.query(`SELECT * FROM premium_requests WHERE id = $1 OR user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userIdOrRequestId]);
      const targetUserId = resReq.rows[0] ? resReq.rows[0].user_id : userIdOrRequestId;

      await db.query(
        `UPDATE users SET premium_status = 'rejected', premium_rejected_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [now, targetUserId]
      );
      await db.query(
        `UPDATE premium_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = $2, request_note = COALESCE(NULLIF($3, ''), request_note), updated_at = CURRENT_TIMESTAMP WHERE user_id = $4 AND status = 'pending'`,
        [adminId, now, note, targetUserId]
      );
      return await this.findById(targetUserId);
    }

    db.fallbackStore.premium_requests ??= [];
    const pr = db.fallbackStore.premium_requests.find(x => (x.id === userIdOrRequestId || x.user_id === userIdOrRequestId) && x.status === 'pending');
    const targetUserId = pr ? pr.user_id : userIdOrRequestId;
    if (pr) {
      pr.status = 'rejected';
      pr.reviewed_by = adminId;
      pr.reviewed_at = now;
      if (note) pr.request_note = note;
      pr.updated_at = now;
    }

    const user = db.fallbackStore.users.find(u => u.id === targetUserId);
    if (user) {
      user.premium_status = 'rejected';
      user.premium_rejected_at = now;
      user.updated_at = now;
      db.saveFallbackStore();
    }
    return user ? await this.findById(user.id) : null;
  }

  static async setOTP(id, otpHash, expiryMs = 10 * 60 * 1000) {
    const expiry = new Date(Date.now() + expiryMs);
    if (db.isPgConnected()) {
      await db.query(
        `UPDATE users SET otp_hash = $1, otp_expiry = $2, otp_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [otpHash, expiry, id]
      );
    } else {
      const user = db.fallbackStore.users.find(u => u.id === id);
      if (user) {
        user.otp_hash = otpHash;
        user.otp_expiry = expiry;
        user.otp_attempts = 0;
        user.updated_at = new Date();
        db.saveFallbackStore();
      }
    }
  }

  static async incrementOTPAttempts(id) {
    if (db.isPgConnected()) {
      const res = await db.query(
        `UPDATE users SET otp_attempts = COALESCE(otp_attempts, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING otp_attempts`,
        [id]
      );
      return res.rows[0]?.otp_attempts || 0;
    } else {
      const user = db.fallbackStore.users.find(u => u.id === id);
      if (user) {
        user.otp_attempts = (user.otp_attempts || 0) + 1;
        user.updated_at = new Date();
        db.saveFallbackStore();
        return user.otp_attempts;
      }
      return 0;
    }
  }

  static async clearOTP(id) {
    if (db.isPgConnected()) {
      await db.query(
        `UPDATE users SET otp_hash = NULL, otp_expiry = NULL, otp_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
    } else {
      const user = db.fallbackStore.users.find(u => u.id === id);
      if (user) {
        user.otp_hash = null;
        user.otp_expiry = null;
        user.otp_attempts = 0;
        user.updated_at = new Date();
        db.saveFallbackStore();
      }
    }
  }

  static async setVerified(id) {
    if (db.isPgConnected()) {
      await db.query(
        `UPDATE users SET email_verified = TRUE, otp_hash = NULL, otp_expiry = NULL, otp_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
    } else {
      const user = db.fallbackStore.users.find(u => u.id === id);
      if (user) {
        user.email_verified = true;
        user.otp_hash = null;
        user.otp_expiry = null;
        user.otp_attempts = 0;
        user.updated_at = new Date();
        db.saveFallbackStore();
      }
    }
  }

  static async setResetOTP(id, otpHash, expiryMs = 10 * 60 * 1000) {
    const expiry = new Date(Date.now() + expiryMs);
    if (db.isPgConnected()) {
      await db.query(
        `UPDATE users SET reset_otp_hash = $1, reset_otp_expiry = $2, reset_otp_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [otpHash, expiry, id]
      );
    } else {
      const user = db.fallbackStore.users.find(u => u.id === id);
      if (user) {
        user.reset_otp_hash = otpHash;
        user.reset_otp_expiry = expiry;
        user.reset_otp_attempts = 0;
        user.updated_at = new Date();
        db.saveFallbackStore();
      }
    }
  }

  static async incrementResetOTPAttempts(id) {
    if (db.isPgConnected()) {
      const res = await db.query(
        `UPDATE users SET reset_otp_attempts = COALESCE(reset_otp_attempts, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING reset_otp_attempts`,
        [id]
      );
      return res.rows[0]?.reset_otp_attempts || 0;
    } else {
      const user = db.fallbackStore.users.find(u => u.id === id);
      if (user) {
        user.reset_otp_attempts = (user.reset_otp_attempts || 0) + 1;
        user.updated_at = new Date();
        db.saveFallbackStore();
        return user.reset_otp_attempts;
      }
      return 0;
    }
  }

  static async clearResetOTP(id) {
    if (db.isPgConnected()) {
      await db.query(
        `UPDATE users SET reset_otp_hash = NULL, reset_otp_expiry = NULL, reset_otp_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
    } else {
      const user = db.fallbackStore.users.find(u => u.id === id);
      if (user) {
        user.reset_otp_hash = null;
        user.reset_otp_expiry = null;
        user.reset_otp_attempts = 0;
        user.updated_at = new Date();
        db.saveFallbackStore();
      }
    }
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async updateProfile(id, { username, avatar }) {
    if (db.isPgConnected()) {
      const res = await db.query(
        `UPDATE users SET username = COALESCE($1, username), avatar = COALESCE($2, avatar), updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 RETURNING id, username, email, role, phone, mobile_number, is_premium, premium_expires_at, premium_status, account_status, email_verified, avatar, created_at, updated_at`,
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
    const { password_hash, otp_hash, reset_otp_hash, ...safe } = user;
    return safe;
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    if (db.isPgConnected()) {
      await db.query('UPDATE users SET password_hash = $1, reset_otp_hash = NULL, reset_otp_expiry = NULL, reset_otp_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [password_hash, id]);
      return true;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (user) {
      user.password_hash = password_hash;
      user.reset_otp_hash = null;
      user.reset_otp_expiry = null;
      user.reset_otp_attempts = 0;
      user.updated_at = new Date();
      db.saveFallbackStore();
      return true;
    }
    return false;
  }

  static async getAll() {
    if (db.isPgConnected()) {
      const res = await db.query(
        `SELECT id, username, email, role, phone, COALESCE(mobile_number, phone) AS mobile_number, 
                CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN FALSE ELSE is_premium END AS is_premium, 
                premium_expires_at, 
                CASE WHEN is_premium = TRUE AND premium_expires_at IS NOT NULL AND premium_expires_at <= CURRENT_TIMESTAMP THEN TRUE ELSE FALSE END AS premium_expired, 
                premium_status, account_status, email_verified, avatar, created_at 
         FROM users 
         ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at DESC`
      );
      return res.rows;
    }
    return db.fallbackStore.users
      .map(({ password_hash, otp_hash, reset_otp_hash, ...rest }) => rest)
      .map(u => {
        if (u.email_verified === undefined) u.email_verified = true;
        u.mobile_number = u.mobile_number || u.phone || null;
        if (u.is_premium && u.premium_expires_at && new Date(u.premium_expires_at) <= new Date()) {
          u.is_premium = false; u.premium_expired = true; db.saveFallbackStore();
        }
        return u;
      })
      .sort((a,b) => (a.role === 'admin' ? -1 : 1) - (b.role === 'admin' ? -1 : 1) || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  static async setStatus(id, accountStatus) {
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET account_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, role, phone, mobile_number, is_premium, premium_expires_at, premium_status, account_status, email_verified, avatar, created_at`, [accountStatus, id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    user.account_status = accountStatus;
    user.updated_at = new Date();
    db.saveFallbackStore();
    const { password_hash, otp_hash, reset_otp_hash, ...safe } = user;
    return safe;
  }

  static async setPremium(id, isPremium, durationMonths = 1) {
    const enabled = !!isPremium;
    let expiresAt = null; if (enabled) { expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + Math.max(1, Number(durationMonths) || 1)); }
    const status = enabled ? 'approved' : 'none';
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET is_premium = $1, premium_expires_at = $2, premium_status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, username, email, role, phone, mobile_number, is_premium, premium_expires_at, premium_status, account_status, email_verified, avatar, created_at`, [enabled, expiresAt, status, id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user) return null;
    user.is_premium = enabled;
    user.premium_expires_at = expiresAt;
    user.premium_status = status;
    user.premium_expired = false;
    user.updated_at = new Date();
    db.saveFallbackStore();
    const { password_hash, otp_hash, reset_otp_hash, ...safe } = user;
    return safe;
  }

  static async deleteById(id) {
    if (db.isPgConnected()) {
      const res = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, username, email, role, phone, mobile_number, is_premium, premium_expires_at, account_status, email_verified, avatar, created_at', [id]);
      return res.rows[0] || null;
    }
    const index = db.fallbackStore.users.findIndex(u => u.id === id);
    if (index < 0) return null;
    const [deleted] = db.fallbackStore.users.splice(index, 1);
    const owned = ['bookmarks','favorites','reading_history','refresh_tokens','notifications','notification_preferences','comic_likes','comic_follows','ratings','comments','premium_requests'];
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
    const { password_hash, otp_hash, reset_otp_hash, ...safe } = deleted;
    return safe;
  }

  static async setRole(id, role) {
    if (!['user','creator','admin'].includes(role)) return null;
    if (db.isPgConnected()) {
      const r=await db.query(`UPDATE users SET role=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING id,username,email,role,phone,mobile_number,is_premium,premium_expires_at,account_status,email_verified,avatar,created_at`,[role,id]);
      return r.rows[0]||null;
    }
    const u=db.fallbackStore.users.find(x=>x.id===id); if(!u)return null;u.role=role;u.updated_at=new Date();db.saveFallbackStore();const {password_hash,otp_hash,reset_otp_hash,...safe}=u;return safe;
  }

  static async becomeCreator(id) {
    if (db.isPgConnected()) {
      const res = await db.query(`UPDATE users SET role = CASE WHEN role = 'admin' THEN role ELSE 'creator' END, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND account_status = 'active' RETURNING id, username, email, role, phone, mobile_number, is_premium, premium_expires_at, account_status, email_verified, avatar, created_at`, [id]);
      return res.rows[0] || null;
    }
    const user = db.fallbackStore.users.find(u => u.id === id);
    if (!user || user.account_status !== 'active') return null;
    if (user.role !== 'admin') user.role = 'creator'; user.updated_at = new Date(); db.saveFallbackStore();
    const { password_hash, otp_hash, reset_otp_hash, ...safe } = user;
    return safe;
  }
}

module.exports = User;
