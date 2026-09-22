const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const Bookmark = require('../models/Bookmark');
const Favorite = require('../models/Favorite');
const Genre = require('../models/Genre');

class ComicController {
  static async getComics(req, res, next) {
    try {
      const { search, genre, status, type, sortBy, limit, offset } = req.query;
      const comics = await Comic.getAll({
        search,
        genre,
        status,
        type,
        sortBy,
        limit: limit ? parseInt(limit, 10) : 24,
        offset: offset ? parseInt(offset, 10) : 0,
        creatorId: req.query.mine && req.user ? req.user.id : null,
        includeDrafts: !!(req.user && (req.user.role === 'admin' || (req.query.mine && ['creator','admin'].includes(req.user.role))))
      });
      res.status(200).json({ comics, count: comics.length });
    } catch (err) {
      next(err);
    }
  }

  static async getComicById(req, res, next) {
    try {
      const comic = await Comic.findById(req.params.id);
      if (!comic) {
        return res.status(404).json({ error: 'Comic not found.' });
      }

      let isBookmarked = false;
      let isFavorite = false;

      if (req.user) {
        isBookmarked = await Bookmark.isBookmarked(req.user.id, comic.id);
        isFavorite = await Favorite.isFavorite(req.user.id, comic.id);
      }

      const chapters = await Chapter.getByComicId(comic.id);

      res.status(200).json({
        comic,
        chapters,
        isBookmarked,
        isFavorite
      });
    } catch (err) {
      next(err);
    }
  }

  static async getComicBySlug(req, res, next) {
    try {
      const comic = await Comic.findBySlug(req.params.slug);
      if (!comic) {
        return res.status(404).json({ error: 'Comic not found.' });
      }

      let isBookmarked = false;
      let isFavorite = false;

      if (req.user) {
        isBookmarked = await Bookmark.isBookmarked(req.user.id, comic.id);
        isFavorite = await Favorite.isFavorite(req.user.id, comic.id);
      }

      const chapters = await Chapter.getByComicId(comic.id);

      res.status(200).json({
        comic,
        chapters,
        isBookmarked,
        isFavorite
      });
    } catch (err) {
      next(err);
    }
  }

  static async recordView(req, res, next) {
    try {
      const comic = await Comic.findById(req.params.id);
      if (!comic) {
        return res.status(404).json({ error: 'Comic not found.' });
      }

      await Comic.incrementViews(comic.id);
      const updatedComic = await Comic.findById(comic.id);

      res.status(200).json({
        views: updatedComic ? Number(updatedComic.views || 0) : Number(comic.views || 0) + 1
      });
    } catch (err) {
      next(err);
    }
  }

  static async getGenres(req, res, next) {
    try {
      const genres = await Genre.getAll();
      res.status(200).json({ genres });
    } catch (err) {
      next(err);
    }
  }

  static async createComic(req, res, next) {
    try {
      if (!['admin','creator'].includes(req.user.role)) return res.status(403).json({ error: 'Creator privileges required.' });
      const payload = { ...req.body, creatorId: req.user.role === 'admin' ? (req.body.creatorId || null) : req.user.id, publishStatus: req.user.role === 'admin' ? (req.body.publishStatus || 'published') : 'draft' };
      const comic = await Comic.create(payload);
      res.status(201).json({ comic, message: 'Comic created successfully.' });
    } catch (err) {
      next(err);
    }
  }


  static async publishComic(req, res, next) {
    try {
      const comic = await Comic.findById(req.params.id);
      if (!comic) return res.status(404).json({ error: 'Comic not found.' });
      if (req.user.role !== 'admin' && comic.creator_id !== req.user.id) return res.status(403).json({ error: 'You can only publish your own comics.' });
      const updated = await Comic.update(req.params.id, { publishStatus: 'published' });
      res.json({ comic: updated, message: 'Comic published successfully.' });
    } catch (err) { next(err); }
  }

  static async updateComic(req, res, next) {
    try {
      const comic = await Comic.update(req.params.id, req.body);
      if (!comic) {
        return res.status(404).json({ error: 'Comic not found.' });
      }
      res.status(200).json({ comic, message: 'Comic updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async deleteComic(req, res, next) {
    try {
      const success = await Comic.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Comic not found.' });
      }
      res.status(200).json({ message: 'Comic deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ComicController;
