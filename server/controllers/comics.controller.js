const db = require('../config/database');

async function getComics(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;
    const { search, genre, status, type, sort } = req.query;

    let queryStr = `
      SELECT c.id, c.title, c.slug, c.author, c.artist, c.description, c.cover, c.banner,
             c.status, c.type, c.release_year as "releaseYear", c.rating, c.views,
             c.chapter_count as "chapterCount", c.latest_chapter as "latestChapter",
             c.is_featured as "featured", c.is_popular as "popular"
      FROM comics c
    `;
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(c.title) LIKE $${params.length} OR LOWER(c.author) LIKE $${params.length} OR LOWER(c.artist) LIKE $${params.length})`);
    }

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }

    if (type && type !== 'all') {
      params.push(type);
      conditions.push(`c.type = $${params.length}`);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    switch (sort) {
      case 'oldest': queryStr += ' ORDER BY c.release_year ASC'; break;
      case 'popular': queryStr += ' ORDER BY c.views DESC'; break;
      case 'rating': queryStr += ' ORDER BY c.rating DESC'; break;
      case 'az': queryStr += ' ORDER BY c.title ASC'; break;
      case 'za': queryStr += ' ORDER BY c.title DESC'; break;
      case 'latest':
      default: queryStr += ' ORDER BY c.created_at DESC'; break;
    }

    queryStr += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(queryStr, params);

    res.json({
      success: true,
      data: {
        comics: result.rows,
        page,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getComicById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.id, c.title, c.slug, c.author, c.artist, c.description, c.cover, c.banner,
              c.status, c.type, c.release_year as "releaseYear", c.rating, c.views,
              c.chapter_count as "chapterCount", c.latest_chapter as "latestChapter"
       FROM comics c WHERE c.id = $1 OR c.slug = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comic not found' });
    }

    res.json({
      success: true,
      data: { comic: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getComics,
  getComicById
};
