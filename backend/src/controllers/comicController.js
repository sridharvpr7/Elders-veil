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
        includeDrafts: !!(req.user && (req.user.role === 'admin' || req.query.mine))
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

      const canSeeUnpublished = !!(req.user && (req.user.role === 'admin' || (comic.creatorId && comic.creatorId === req.user.id)));
      if (comic.publishStatus !== 'published' && !canSeeUnpublished) return res.status(404).json({ error: 'Comic not found.' });
      const chapters = await Chapter.getByComicId(comic.id, { includeUnpublished: canSeeUnpublished });

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

      const canSeeUnpublished = !!(req.user && (req.user.role === 'admin' || (comic.creatorId && comic.creatorId === req.user.id)));
      if (comic.publishStatus !== 'published' && !canSeeUnpublished) return res.status(404).json({ error: 'Comic not found.' });
      const chapters = await Chapter.getByComicId(comic.id, { includeUnpublished: canSeeUnpublished });

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
      if (!req.user) return res.status(401).json({ error: 'Login required.' });
      if (!req.body.title || String(req.body.title).trim().length < 2) return res.status(400).json({ error: 'Comic title is required.' });
      const payload = { ...req.body, creatorId: req.user.role === 'admin' ? (req.body.creatorId || null) : req.user.id, publishStatus: req.user.role === 'admin' ? (req.body.publishStatus || 'published') : 'pending' };
      const comic = await Comic.create(payload);
      res.status(201).json({ comic, message: 'Comic created successfully.' });
    } catch (err) {
      next(err);
    }
  }


  static async publishComic(req, res, next) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only an administrator can publish submissions.' });
      const comic = await Comic.findById(req.params.id);
      if (!comic) return res.status(404).json({ error: 'Comic not found.' });
      const updated = await Comic.update(req.params.id, { publishStatus: 'published', reviewNote: null });
      res.json({ comic: updated, message: 'Comic approved and published.' });
    } catch (err) { next(err); }
  }

  static async rejectComic(req, res, next) {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only an administrator can reject submissions.' });
      const comic = await Comic.findById(req.params.id);
      if (!comic) return res.status(404).json({ error: 'Comic not found.' });
      const updated = await Comic.update(req.params.id, { publishStatus: 'rejected', reviewNote: req.body.reason || 'Rejected by administrator.' });
      res.json({ comic: updated, message: 'Comic rejected.' });
    } catch (err) { next(err); }
  }

  static async resubmitComic(req, res, next) {
    try {
      const comic = await Comic.findById(req.params.id);
      if (!comic) return res.status(404).json({ error: 'Comic not found.' });
      if (req.user.role !== 'admin' && comic.creatorId !== req.user.id) return res.status(403).json({ error: 'You can only resubmit your own comics.' });
      const updated = await Comic.update(req.params.id, { publishStatus: 'pending', reviewNote: null });
      res.json({ comic: updated, message: 'Comic resubmitted for administrator review.' });
    } catch (err) { next(err); }
  }

  static async updateComic(req, res, next) {
    try {
      const existing = await Comic.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Comic not found.' });
      if (req.user.role !== 'admin' && existing.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own comics.' });
      }
      const payload = req.user.role === 'admin' ? req.body : { ...req.body, publishStatus: 'pending', reviewNote: null };
      const comic = await Comic.update(req.params.id, payload);
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
