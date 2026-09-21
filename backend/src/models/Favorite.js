const db = require('../config/database');
const Comic = require('./Comic');

class Favorite {
  static async getByUserId(userId) {
    if (db.isPgConnected()) {
      const sql = `
        SELECT c.*, f.created_at as favorited_at
        FROM favorites f
        JOIN comics c ON f.comic_id = c.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
      `;
      const res = await db.query(sql, [userId]);
      return res.rows.map(Comic.formatComic);
    }
    const userFavorites = db.fallbackStore.favorites.filter(f => f.user_id === userId);
    const comicIds = userFavorites.map(f => f.comic_id);
    const comics = db.fallbackStore.comics.filter(c => comicIds.includes(c.id));
    return comics.map(Comic.formatComic);
  }

  static async add(userId, comicId) {
    const id = `favorite-${userId}-${comicId}`;
    const now = new Date();

    if (db.isPgConnected()) {
      await db.query(
        `INSERT INTO favorites (id, user_id, comic_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, comic_id) DO NOTHING`,
        [id, userId, comicId, now]
      );
      return true;
    }

    const exists = db.fallbackStore.favorites.some(f => f.user_id === userId && f.comic_id === comicId);
    if (!exists) {
      db.fallbackStore.favorites.push({ id, user_id: userId, comic_id: comicId, created_at: now });
      db.saveFallbackStore();
    }
    return true;
  }

  static async remove(userId, comicId) {
    if (db.isPgConnected()) {
      const res = await db.query(`DELETE FROM favorites WHERE user_id = $1 AND comic_id = $2`, [userId, comicId]);
      return res.rowCount > 0;
    }
    const idx = db.fallbackStore.favorites.findIndex(f => f.user_id === userId && f.comic_id === comicId);
    if (idx !== -1) {
      db.fallbackStore.favorites.splice(idx, 1);
      db.saveFallbackStore();
      return true;
    }
    return false;
  }

  static async isFavorite(userId, comicId) {
    if (db.isPgConnected()) {
      const res = await db.query(`SELECT 1 FROM favorites WHERE user_id = $1 AND comic_id = $2`, [userId, comicId]);
      return res.rowCount > 0;
    }
    return db.fallbackStore.favorites.some(f => f.user_id === userId && f.comic_id === comicId);
  }
}

module.exports = Favorite;
