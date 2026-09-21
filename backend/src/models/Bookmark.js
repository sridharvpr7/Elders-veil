const db = require('../config/database');
const Comic = require('./Comic');

class Bookmark {
  static async getByUserId(userId) {
    if (db.isPgConnected()) {
      const sql = `
        SELECT c.*, b.created_at as bookmarked_at
        FROM bookmarks b
        JOIN comics c ON b.comic_id = c.id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
      `;
      const res = await db.query(sql, [userId]);
      return res.rows.map(Comic.formatComic);
    }
    const userBookmarks = db.fallbackStore.bookmarks.filter(b => b.user_id === userId);
    const comicIds = userBookmarks.map(b => b.comic_id);
    const comics = db.fallbackStore.comics.filter(c => comicIds.includes(c.id));
    return comics.map(Comic.formatComic);
  }

  static async add(userId, comicId) {
    const id = `bookmark-${userId}-${comicId}`;
    const now = new Date();

    if (db.isPgConnected()) {
      await db.query(
        `INSERT INTO bookmarks (id, user_id, comic_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, comic_id) DO NOTHING`,
        [id, userId, comicId, now]
      );
      return true;
    }

    const exists = db.fallbackStore.bookmarks.some(b => b.user_id === userId && b.comic_id === comicId);
    if (!exists) {
      db.fallbackStore.bookmarks.push({ id, user_id: userId, comic_id: comicId, created_at: now });
      db.saveFallbackStore();
    }
    return true;
  }

  static async remove(userId, comicId) {
    if (db.isPgConnected()) {
      const res = await db.query(`DELETE FROM bookmarks WHERE user_id = $1 AND comic_id = $2`, [userId, comicId]);
      return res.rowCount > 0;
    }
    const idx = db.fallbackStore.bookmarks.findIndex(b => b.user_id === userId && b.comic_id === comicId);
    if (idx !== -1) {
      db.fallbackStore.bookmarks.splice(idx, 1);
      db.saveFallbackStore();
      return true;
    }
    return false;
  }

  static async isBookmarked(userId, comicId) {
    if (db.isPgConnected()) {
      const res = await db.query(`SELECT 1 FROM bookmarks WHERE user_id = $1 AND comic_id = $2`, [userId, comicId]);
      return res.rowCount > 0;
    }
    return db.fallbackStore.bookmarks.some(b => b.user_id === userId && b.comic_id === comicId);
  }
}

module.exports = Bookmark;
