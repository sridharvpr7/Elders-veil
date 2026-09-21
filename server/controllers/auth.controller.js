const db = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { displayName, username, email, password, dateOfBirth } = req.body;

    if (!displayName || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check duplicate username or email
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username.trim().toLowerCase(), email.trim().toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or Email is already registered.' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const newUser = await db.query(
      `INSERT INTO users (id, display_name, username, email, password_hash, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, display_name as "displayName", username, email, avatar, bio, role, created_at as "createdAt"`,
      [userId, displayName.trim(), username.trim().toLowerCase(), email.trim().toLowerCase(), hashedPassword, dateOfBirth || null]
    );

    const user = newUser.rows[0];
    const token = generateToken({ id: user.id, username: user.username, email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { token, user }
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
    }

    const result = await db.query(
      `SELECT id, display_name as "displayName", username, email, password_hash, avatar, bio, role
       FROM users WHERE username = $1 OR email = $1`,
      [identifier.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    delete user.password_hash;
    const token = generateToken({ id: user.id, username: user.username, email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user }
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, display_name as "displayName", username, email, avatar, bio, role, created_at as "createdAt"
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(444).json({ success: false, message: 'User account not found.' });
    }

    res.json({
      success: true,
      data: { user: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await comparePassword(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const newHashed = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHashed, req.user.id]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function deleteAccount(req, res, next) {
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: 'Account and associated data deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  deleteAccount
};
