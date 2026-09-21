/* ==========================================================================
   ComicVerse - Centralized API Adapter Client (js/api.js)
   ========================================================================== */

const API = {
  BASE_URL: 'http://localhost:5000/api',
  _backendAvailable: null,

  /**
   * Test if Node.js Express REST server is running on localhost:5000
   */
  async isBackendAvailable() {
    if (this._backendAvailable !== null) return this._backendAvailable;
    try {
      const res = await fetch(`${this.BASE_URL}/health`, { method: 'GET', timeout: 1500 });
      this._backendAvailable = res.ok;
    } catch (e) {
      this._backendAvailable = false;
    }
    return this._backendAvailable;
  },

  /**
   * Generic REST fetch helper with JWT header inclusion
   */
  async request(endpoint, options = {}) {
    const isOnline = await this.isBackendAvailable();
    if (!isOnline) {
      // Graceful local fallback signal
      return null;
    }

    const token = Auth.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API Request failed');
      }
      return data;
    } catch (error) {
      console.warn(`[API Client Warning]: Backend request to ${endpoint} failed. Falling back to local mode.`, error.message);
      return null;
    }
  }
};
