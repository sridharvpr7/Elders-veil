const API_BASE_URL = '/api';

class API {
  static getToken() {
    return localStorage.getItem('token') || '';
  }

  static getHeaders(isJson = true) {
    const headers = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = data.error || data.message || `Request failed with status ${response.status}`;
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        throw new Error(error);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err.message);
      throw err;
    }
  }

  static async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
      headers: this.getHeaders(true)
    });
  }

  static async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(body)
    });
  }

  static async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(body)
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders(true)
    });
  }

  static async upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      headers: this.getHeaders(false), // Let browser set multipart boundary
      body: formData
    });
  }
}

// Toast helper utility
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'info') icon = 'info-circle';

  toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
