const db = require('../config/database');
const { createSlug } = require('../utils/slug');

class Comic {
  static async getAll({ search, genre, status, type, sortBy = 'latest', limit = 20, offset = 0, creatorId = null, includeDrafts = false } = {}) {
    if (db.isPgConnected()) {
      let sql = `
        SELECT c.*, 
               COALESCE(json_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL), '[]') as genres,
               COUNT(DISTINCT ch.id) as chapter_count
        FROM comics c
        LEFT JOIN comic_genres cg ON c.id = cg.comic_id
        LEFT JOIN genres g ON cg.genre_id = g.id
        LEFT JOIN chapters ch ON c.id = ch.comic_id
        WHERE 1=1
      `;
      const params = [];

      if (!includeDrafts) sql += ` AND c.publish_status = 'published'`;
      if (creatorId) { params.push(creatorId); sql += ` AND c.creator_id = $${params.length}`; }

      if (search) {
        params.push(`%${search}%`);
        sql += ` AND (c.title ILIKE $${params.length} OR c.author ILIKE $${params.length} OR c.artist ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
      }
      if (status) {
        params.push(status);
        sql += ` AND c.status = $${params.length}`;
      }
      if (type) {
        params.push(type);
        sql += ` AND c.type = $${params.length}`;
      }
      if (genre) {
        params.push(genre);
        sql += ` AND c.id IN (SELECT comic_id FROM comic_genres cg2 JOIN genres g2 ON cg2.genre_id = g2.id WHERE LOWER(g2.name) = LOWER($${params.length}))`;
      }

      sql += ` GROUP BY c.id`;

      if (sortBy === 'popular') sql += ` ORDER BY c.views DESC`;
      else if (sortBy === 'rating') sql += ` ORDER BY c.rating DESC`;
      else if (sortBy === 'title') sql += ` ORDER BY c.title ASC`;
      else sql += ` ORDER BY c.updated_at DESC`;

      params.push(limit, offset);
      sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const res = await db.query(sql, params);
      return res.rows.map(this.formatComic);
    }

    // Fallback store filter
    let list = [...db.fallbackStore.comics];
    if (!includeDrafts) list = list.filter(c => (c.publish_status || 'published') === 'published');
    if (creatorId) list = list.filter(c => (c.creator_id || c.creatorId) === creatorId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.author && c.author.toLowerCase().includes(q)) ||
        (c.artist && c.artist.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    if (status) list = list.filter(c => c.status === status);
    if (type) list = list.filter(c => c.type === type);
    if (genre) {
      list = list.filter(c => Array.isArray(c.genres) && c.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    if (sortBy === 'popular') list.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sortBy === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

    return list.slice(offset, offset + limit).map(this.formatComic);
  }

  static async findById(id) {
    if (db.isPgConnected()) {
      const sql = `
        SELECT c.*, 
               COALESCE(json_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL), '[]') as genres
        FROM comics c
        LEFT JOIN comic_genres cg ON c.id = cg.comic_id
        LEFT JOIN genres g ON cg.genre_id = g.id
        WHERE c.id = $1
        GROUP BY c.id
      `;
      const res = await db.query(sql, [id]);
      if (!res.rows[0]) return null;
      return this.formatComic(res.rows[0]);
    }
    const item = db.fallbackStore.comics.find(c => c.id === id);
    return item ? this.formatComic(item) : null;
  }

  static async findBySlug(slug) {
    if (db.isPgConnected()) {
      const sql = `
        SELECT c.*, 
               COALESCE(json_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL), '[]') as genres
        FROM comics c
        LEFT JOIN comic_genres cg ON c.id = cg.comic_id
        LEFT JOIN genres g ON cg.genre_id = g.id
        WHERE c.slug = $1
        GROUP BY c.id
      `;
      const res = await db.query(sql, [slug]);
      if (!res.rows[0]) return null;
      return this.formatComic(res.rows[0]);
    }
    const item = db.fallbackStore.comics.find(c => c.slug === slug);
    return item ? this.formatComic(item) : null;
  }

  static async create(data) {
    const id = data.id || `comic-${Date.now()}`;
    const slug = data.slug || createSlug(data.title);
    const now = new Date();

    const comicData = {
      id,
      title: data.title,
      slug,
      description: data.description || '',
      author: data.author || 'Unknown',
      artist: data.artist || 'Unknown',
      status: data.status || 'ongoing',
      type: data.type || 'manga',
      cover_image: data.coverImage || data.cover_image || '/uploads/covers/default.jpg',
      banner_image: data.bannerImage || data.banner_image || '/uploads/banners/default.jpg',
      rating: data.rating !== undefined ? Number(data.rating) : 4.5,
      views: data.views !== undefined ? Number(data.views) : 0,
      release_year: data.releaseYear || data.release_year || 2026,
      language: data.language || 'English',
      creator_id: data.creatorId || data.creator_id || null,
      publish_status: data.publishStatus || data.publish_status || 'published',
      review_note: data.reviewNote || data.review_note || null,
      created_at: now,
      updated_at: now,
      genres: data.genres || []
    };

    if (db.isPgConnected()) {
      await db.query(
        `INSERT INTO comics (id, title, slug, description, author, artist, status, type, cover_image, banner_image, rating, views, release_year, language, creator_id, publish_status, review_note, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          comicData.id, comicData.title, comicData.slug, comicData.description,
          comicData.author, comicData.artist, comicData.status, comicData.type,
          comicData.cover_image, comicData.banner_image, comicData.rating, comicData.views,
          comicData.release_year, comicData.language, comicData.creator_id, comicData.publish_status, comicData.review_note, comicData.created_at, comicData.updated_at
        ]
      );

      // Handle genres
      if (Array.isArray(comicData.genres)) {
        for (const gName of comicData.genres) {
          const gId = `genre-${createSlug(gName)}`;
          await db.query(`INSERT INTO genres (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`, [gId, gName]);
          const gRes = await db.query(`SELECT id FROM genres WHERE LOWER(name) = LOWER($1)`, [gName]);
          if (gRes.rows[0]) {
            await db.query(`INSERT INTO comic_genres (comic_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, gRes.rows[0].id]);
          }
        }
      }
      return this.findById(id);
    }

    db.fallbackStore.comics.push(comicData);
    db.saveFallbackStore();
    return this.formatComic(comicData);
  }

  static async update(id, data) {
    if (db.isPgConnected()) {
      const updates = [];
      const params = [id];

      const fields = {
        title: data.title,
        slug: data.title ? createSlug(data.title) : undefined,
        description: data.description,
        author: data.author,
        artist: data.artist,
        status: data.status,
        type: data.type,
        cover_image: data.coverImage || data.cover_image,
        banner_image: data.bannerImage || data.banner_image,
        rating: data.rating,
        release_year: data.releaseYear || data.release_year,
        language: data.language,
        publish_status: data.publishStatus || data.publish_status,
        review_note: data.reviewNote !== undefined ? data.reviewNote : data.review_note,
        updated_at: new Date()
      };

      Object.entries(fields).forEach(([key, val]) => {
        if (val !== undefined) {
          params.push(val);
          updates.push(`${key} = $${params.length}`);
        }
      });

      if (updates.length > 0) {
        await db.query(`UPDATE comics SET ${updates.join(', ')} WHERE id = $1`, params);
      }

      if (Array.isArray(data.genres)) {
        await db.query(`DELETE FROM comic_genres WHERE comic_id = $1`, [id]);
        for (const gName of data.genres) {
          const gId = `genre-${createSlug(gName)}`;
          await db.query(`INSERT INTO genres (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`, [gId, gName]);
          const gRes = await db.query(`SELECT id FROM genres WHERE LOWER(name) = LOWER($1)`, [gName]);
          if (gRes.rows[0]) {
            await db.query(`INSERT INTO comic_genres (comic_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, gRes.rows[0].id]);
          }
        }
      }
      return this.findById(id);
    }

    const idx = db.fallbackStore.comics.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const target = db.fallbackStore.comics[idx];
    if (data.title) target.title = data.title;
    if (data.description !== undefined) target.description = data.description;
    if (data.author) target.author = data.author;
    if (data.artist) target.artist = data.artist;
    if (data.status) target.status = data.status;
    if (data.type) target.type = data.type;
    if (data.coverImage || data.cover_image) target.cover_image = data.coverImage || data.cover_image;
    if (data.bannerImage || data.banner_image) target.banner_image = data.bannerImage || data.banner_image;
    if (data.rating !== undefined) target.rating = Number(data.rating);
    if (data.publishStatus || data.publish_status) target.publish_status = data.publishStatus || data.publish_status;
    if (data.reviewNote !== undefined || data.review_note !== undefined) target.review_note = data.reviewNote || data.review_note;
    if (data.genres) target.genres = data.genres;
    target.updated_at = new Date();

    db.saveFallbackStore();
    return this.formatComic(target);
  }

  static async delete(id) {
    if (db.isPgConnected()) {
      const res = await db.query('DELETE FROM comics WHERE id = $1 RETURNING id', [id]);
      return res.rowCount > 0;
    }
    const idx = db.fallbackStore.comics.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.fallbackStore.comics.splice(idx, 1);
      db.fallbackStore.chapters = db.fallbackStore.chapters.filter(ch => ch.comic_id !== id);
      db.saveFallbackStore();
      return true;
    }
    return false;
  }

  static async incrementViews(id) {
    if (db.isPgConnected()) {
      await db.query('UPDATE comics SET views = views + 1 WHERE id = $1', [id]);
      return;
    }
    const comic = db.fallbackStore.comics.find(c => c.id === id);
    if (comic) {
      comic.views = (comic.views || 0) + 1;
      db.saveFallbackStore();
    }
  }

  static formatComic(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      slug: row.slug || createSlug(row.title),
      description: row.description,
      author: row.author,
      artist: row.artist,
      status: row.status,
      type: row.type,
      genres: Array.isArray(row.genres) ? row.genres : (typeof row.genres === 'string' ? JSON.parse(row.genres) : []),
      coverImage: row.cover_image || row.coverImage,
      bannerImage: row.banner_image || row.bannerImage,
      rating: parseFloat(row.rating || 0),
      views: parseInt(row.views || 0, 10),
      releaseYear: parseInt(row.release_year || row.releaseYear || 2026, 10),
      language: row.language || 'English',
      creatorId: row.creator_id || row.creatorId || null,
      publishStatus: row.publish_status || row.publishStatus || 'published',
      reviewNote: row.review_note || row.reviewNote || null,
      chapterCount: parseInt(row.chapter_count || 0, 10),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = Comic;
