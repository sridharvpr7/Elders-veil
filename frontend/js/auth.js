class Auth {
  static getUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  }

  static getToken() {
    return localStorage.getItem('token') || null;
  }

  static isLoggedIn() {
    return !!this.getToken();
  }

  static isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  }

  static saveSession(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  }

  static logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showToast('Logged out successfully.', 'info');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 500);
  }

  static async checkAuth() {
    if (this.isLoggedIn()) {
      try {
        const res = await API.get('/auth/me');
        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      } catch (err) {
        this.logout();
      }
    }
  }
}
