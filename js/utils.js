/* ==========================================================================
   ComicVerse - Utilities Module (js/utils.js)
   ========================================================================== */

const Utils = {
  // In-memory cache for JSON files to minimize unnecessary HTTP requests
  _dataCache: new Map(),

  /**
   * Fetch JSON file with memory caching
   */
  async fetchJSON(url) {
    if (this._dataCache.has(url)) {
      return this._dataCache.get(url);
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ${url} (Status: ${response.status})`);
      }
      const data = await response.json();
      this._dataCache.set(url, data);
      return data;
    } catch (error) {
      console.error(`[Utils.fetchJSON Error]:`, error);
      return null;
    }
  },

  /**
   * Format view counts into readable strings (e.g. 12500 -> 12.5k)
   */
  formatViews(views) {
    if (typeof views !== 'number') return '0';
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  },

  /**
   * Format ISO date string into readable date (e.g. "2026-09-01" -> "Sep 01, 2026")
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  },

  /**
   * Debounce helper function for input events
   */
  debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Render SVG placeholder fallback if an image fails to load
   */
  handleImageError(imgElement, title = 'Comic Cover') {
    imgElement.onerror = null; // Prevent infinite loop
    const encodedTitle = encodeURIComponent(title);
    imgElement.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420"><rect width="100%" height="100%" fill="%231a1a24"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%237c3aed" font-family="sans-serif" font-size="28" font-weight="bold">ComicVerse</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="14">${encodedTitle}</text></svg>`;
  }
};
