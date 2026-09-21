const db = require('../config/database');

class Genre {
  static async getAll() {
    if (db.isPgConnected()) {
      const res = await db.query('SELECT * FROM genres ORDER BY name ASC');
      return res.rows;
    }
    return db.fallbackStore.genres;
  }

  static async findByName(name) {
    if (db.isPgConnected()) {
      const res = await db.query('SELECT * FROM genres WHERE LOWER(name) = LOWER($1)', [name]);
      return res.rows[0] || null;
    }
    return db.fallbackStore.genres.find(g => g.name.toLowerCase() === name.toLowerCase()) || null;
  }

  static async create({ id, name }) {
    if (db.isPgConnected()) {
      const res = await db.query(
        'INSERT INTO genres (id, name) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING *',
        [id, name]
      );
      return res.rows[0];
    }
    let existing = db.fallbackStore.genres.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const newGenre = { id, name };
    db.fallbackStore.genres.push(newGenre);
    db.saveFallbackStore();
    return newGenre;
  }
}

module.exports = Genre;
