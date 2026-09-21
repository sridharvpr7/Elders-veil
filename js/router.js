/* ==========================================================================
   ComicVerse - Router / URL Parameter Helper (js/router.js)
   ========================================================================== */

const Router = {
  /**
   * Get all URL query parameters as an object
   */
  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  },

  /**
   * Get a specific URL query parameter by key
   */
  getParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },

  /**
   * Navigate to comic detail page
   */
  navigateToComic(comicId) {
    window.location.href = `comic.html?id=${encodeURIComponent(comicId)}`;
  },

  /**
   * Navigate to reader page
   */
  navigateToReader(comicId, chapterId) {
    let url = `reader.html?comic=${encodeURIComponent(comicId)}`;
    if (chapterId) {
      url += `&chapter=${encodeURIComponent(chapterId)}`;
    }
    window.location.href = url;
  },

  /**
   * Redirect to 404 page
   */
  redirectTo404() {
    window.location.href = '404.html';
  }
};
