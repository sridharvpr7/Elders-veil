/* ==========================================================================
   ComicVerse - Centralized Authentication System (js/auth.js)
   ========================================================================== */

const Auth = {
  KEYS: {
    USERS: 'comic_users',
    CURRENT_USER: 'comic_current_user',
    AUTH_SESSION: 'comic_auth_session'
  },

  /**
   * Get list of locally registered users
   */
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Save users array to LocalStorage
   */
  saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },

  /**
   * Get active session JWT token or session flag
   */
  getToken() {
    return localStorage.getItem(this.KEYS.AUTH_SESSION) || null;
  },

  /**
   * Get currently logged-in user profile object
   */
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.CURRENT_USER)) || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if user is currently logged in
   */
  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  /**
   * Check password strength score (0 to 4)
   */
  evaluatePasswordStrength(password) {
    if (!password) return { score: 0, label: 'Empty', color: '#64748b' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const strengthMap = [
      { score: 0, label: 'Very Weak', color: '#ef4444' },
      { score: 1, label: 'Weak', color: '#f97316' },
      { score: 2, label: 'Medium', color: '#facc15' },
      { score: 3, label: 'Strong', color: '#10b981' },
      { score: 4, label: 'Very Strong', color: '#7c3aed' }
    ];

    return strengthMap[score] || strengthMap[0];
  },

  /**
   * Register a new user
   */
  async registerUser({ displayName, username, email, password, confirmPassword, dateOfBirth, termsAccepted }) {
    // 1. Validation Checks
    if (!displayName || !username || !email || !password) {
      throw new Error('Please fill in all required fields.');
    }

    if (!termsAccepted) {
      throw new Error('You must accept the Terms and Conditions.');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    if (password.length < 6 || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must be at least 6 characters long and contain at least one number and one special character.');
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Try backend REST API first
    const apiRes = await API.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName, username: cleanUsername, email: cleanEmail, password, dateOfBirth })
    });

    if (apiRes && apiRes.success) {
      localStorage.setItem(this.KEYS.AUTH_SESSION, apiRes.data.token);
      localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(apiRes.data.user));
      this.updateHeaderAuthState();
      return apiRes.data.user;
    }

    // LocalStorage Fallback Authentication
    const users = this.getUsers();

    if (users.some(u => u.username === cleanUsername)) {
      throw new Error('Username is already taken by another account.');
    }

    if (users.some(u => u.email === cleanEmail)) {
      throw new Error('Email address is already registered.');
    }

    const newUser = {
      id: 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      displayName: displayName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: btoa(password), // Frontend encoding representation
      avatar: 'assets/images/avatars/default.svg',
      bio: '',
      role: cleanUsername === 'admin' ? 'admin' : 'user',
      dateOfBirth: dateOfBirth || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    // Set Active Session
    localStorage.setItem(this.KEYS.AUTH_SESSION, 'demo_local_token_' + newUser.id);
    localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(newUser));

    this.updateHeaderAuthState();
    return newUser;
  },

  /**
   * Login user with credentials
   */
  async loginUser(identifier, password, rememberMe = false) {
    if (!identifier || !password) {
      throw new Error('Please enter your username/email and password.');
    }

    const cleanId = identifier.trim().toLowerCase();

    // Try backend REST API first
    const apiRes = await API.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: cleanId, password })
    });

    if (apiRes && apiRes.success) {
      localStorage.setItem(this.KEYS.AUTH_SESSION, apiRes.data.token);
      localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(apiRes.data.user));
      this.updateHeaderAuthState();
      return apiRes.data.user;
    }

    // LocalStorage Fallback Login
    const users = this.getUsers();
    const foundUser = users.find(u => u.username === cleanId || u.email === cleanId);

    if (!foundUser) {
      throw new Error('Account does not exist. Please check your credentials or register.');
    }

    if (foundUser.passwordHash !== btoa(password)) {
      throw new Error('Incorrect password. Please try again.');
    }

    localStorage.setItem(this.KEYS.AUTH_SESSION, 'demo_local_token_' + foundUser.id);
    localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(foundUser));

    this.updateHeaderAuthState();
    return foundUser;
  },

  /**
   * Logout active user
   */
  logoutUser() {
    localStorage.removeItem(this.KEYS.AUTH_SESSION);
    localStorage.removeItem(this.KEYS.CURRENT_USER);
    this.updateHeaderAuthState();
    window.location.href = 'index.html';
  },

  /**
   * Update active user profile
   */
  updateUser(updatedFields) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const users = this.getUsers();
    const updatedUser = { ...currentUser, ...updatedFields };

    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex >= 0) {
      users[userIndex] = updatedUser;
      this.saveUsers(users);
    }

    localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(updatedUser));
    this.updateHeaderAuthState();
    return updatedUser;
  },

  /**
   * Change user password
   */
  changePassword(currentPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No active user session.');

    if (user.passwordHash !== btoa(currentPassword)) {
      throw new Error('Current password is incorrect.');
    }

    if (newPassword.length < 6 || !/\d/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      throw new Error('New password must be at least 6 characters with a number and a special character.');
    }

    user.passwordHash = btoa(newPassword);
    this.updateUser({ passwordHash: user.passwordHash });
  },

  /**
   * Delete user account and associated user data
   */
  deleteAccount() {
    const user = this.getCurrentUser();
    if (!user) return;

    // Remove from local users array
    let users = this.getUsers();
    users = users.filter(u => u.id !== user.id);
    this.saveUsers(users);

    // Clear user data
    Storage.clearHistory();
    localStorage.removeItem(this.KEYS.AUTH_SESSION);
    localStorage.removeItem(this.KEYS.CURRENT_USER);

    this.updateHeaderAuthState();
    window.location.href = 'index.html';
  },

  /**
   * Dynamically update header navigation buttons based on auth state
   */
  updateHeaderAuthState() {
    const navLinks = document.querySelector('.nav-links');
    const user = this.getCurrentUser();

    if (!navLinks) return;

    // Remove existing auth links
    navLinks.querySelectorAll('.auth-nav-link').forEach(el => el.remove());

    if (user) {
      // Logged in Navigation Links
      const isAdmin = user.role === 'admin' || user.username === 'admin';
      const authLinksHTML = `
        <a href="profile.html" class="nav-link auth-nav-link"><i class="ri-user-3-line"></i> Profile</a>
        <a href="account.html" class="nav-link auth-nav-link"><i class="ri-settings-4-line"></i> Account</a>
        ${isAdmin ? '<a href="admin.html" class="nav-link auth-nav-link" style="color:var(--warning);"><i class="ri-shield-star-line"></i> Admin</a>' : ''}
        <button class="nav-link auth-nav-link" id="header-logout-btn" style="color:var(--danger); font-weight:600;"><i class="ri-logout-box-r-line"></i> Logout</button>
      `;
      navLinks.insertAdjacentHTML('beforeend', authLinksHTML);

      const logoutBtn = document.getElementById('header-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logoutUser());
      }
    } else {
      // Logged out Navigation Links
      const authLinksHTML = `
        <a href="login.html" class="nav-link auth-nav-link"><i class="ri-login-box-line"></i> Login</a>
        <a href="register.html" class="nav-link auth-nav-link btn btn-primary" style="padding: 0.4rem 0.9rem; color:#fff;"><i class="ri-user-add-line"></i> Create Account</a>
      `;
      navLinks.insertAdjacentHTML('beforeend', authLinksHTML);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateHeaderAuthState();
});
