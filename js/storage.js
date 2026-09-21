/* ==========================================================================
   ComicVerse - Storage Module (js/storage.js)
   ========================================================================== */

const Storage = {
  KEYS: {
    THEME: 'comicverse_theme',
    FAVORITES: 'comicverse_favorites',
    HISTORY: 'comicverse_history',
    PROGRESS: 'comicverse_progress',
    SETTINGS: 'comicverse_user_settings'
  },

  /* --- Theme Settings --- */
  getTheme() {
    return localStorage.getItem(this.KEYS.THEME) || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem(this.KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  /* --- Favorites Management --- */
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES)) || [];
    } catch (e) {
      return [];
    }
  },

  isFavorite(comicId) {
    const favs = this.getFavorites();
    return favs.includes(comicId);
  },

  toggleFavorite(comicId) {
    let favs = this.getFavorites();
    const index = favs.indexOf(comicId);
    let isAdded = false;
    if (index >= 0) {
      favs.splice(index, 1);
    } else {
      favs.push(comicId);
      isAdded = true;
    }
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favs));
    return isAdded;
  },

  /* --- Reading Progress & History --- */
  getProgressMap() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.PROGRESS)) || {};
    } catch (e) {
      return {};
    }
  },

  saveProgress(comicId, chapterId, chapterNumber, pageNumber, totalPages) {
    const progressMap = this.getProgressMap();
    const percentage = totalPages > 0 ? Math.round((pageNumber / totalPages) * 100) : 0;
    
    const progressItem = {
      comicId,
      chapterId,
      chapterNumber,
      pageNumber,
      totalPages,
      progressPercentage: percentage,
      lastReadTime: new Date().toISOString()
    };

    progressMap[comicId] = progressItem;
    localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progressMap));

    // Also update history list
    this.addToHistory(progressItem);
  },

  getComicProgress(comicId) {
    const progressMap = this.getProgressMap();
    return progressMap[comicId] || null;
  },

  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.HISTORY)) || [];
    } catch (e) {
      return [];
    }
  },

  addToHistory(progressItem) {
    let history = this.getHistory();
    // Filter out existing entry for this comic to bring latest to top
    history = history.filter(item => item.comicId !== progressItem.comicId);
    history.unshift(progressItem);
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
  },

  removeFromHistory(comicId) {
    let history = this.getHistory();
    history = history.filter(item => item.comicId !== comicId);
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));

    let progressMap = this.getProgressMap();
    delete progressMap[comicId];
    localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progressMap));
  },

  clearHistory() {
    localStorage.removeItem(this.KEYS.HISTORY);
    localStorage.removeItem(this.KEYS.PROGRESS);
  }
};
