const Chapter = require('../models/Chapter');
const ReadingHistory = require('../models/ReadingHistory');
const Comic = require('../models/Comic');

class ChapterController {
  static async getComicChapters(req, res, next) {
    try {
      const chapters = await Chapter.getByComicId(req.params.comicId);
      res.status(200).json({ chapters });
    } catch (err) {
      next(err);
    }
  }

  static async getChapterById(req, res, next) {
    try {
      const chapter = await Chapter.findById(req.params.id);
      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found.' });
      }

      Chapter.incrementViews(chapter.id).catch(() => {});

      // Get all chapters for this comic to allow prev/next navigation
      const allChapters = await Chapter.getByComicId(chapter.comicId);

      // Track history if user logged in
      if (req.user) {
        const pageNum = req.query.page ? parseInt(req.query.page, 10) : 1;
        ReadingHistory.saveProgress(req.user.id, chapter.comicId, chapter.id, pageNum).catch(() => {});
      }

      res.status(200).json({
        chapter,
        allChapters
      });
    } catch (err) {
      next(err);
    }
  }

  static async createChapter(req, res, next) {
    try {
      const comicId = req.params.comicId || req.body.comicId;
      const comic = await Comic.findById(comicId);
      if (!comic) return res.status(404).json({ error: 'Comic not found.' });
      if (req.user.role !== 'admin' && comic.creatorId !== req.user.id) return res.status(403).json({ error: 'You can only add chapters to your own comics.' });
      const chapter = await Chapter.create({
        ...req.body,
        comicId
      });
      res.status(201).json({ chapter, message: 'Chapter created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async updateChapter(req, res, next) {
    try {
      const existing = await Chapter.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Chapter not found.' });
      const comic = await Comic.findById(existing.comicId);
      if (req.user.role !== 'admin' && (!comic || comic.creatorId !== req.user.id)) return res.status(403).json({ error: 'You can only edit your own chapters.' });
      const chapter = await Chapter.update(req.params.id, req.body);
      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found.' });
      }
      res.status(200).json({ chapter, message: 'Chapter updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async deleteChapter(req, res, next) {
    try {
      const existing = await Chapter.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Chapter not found.' });
      const comic = await Comic.findById(existing.comicId);
      if (req.user.role !== 'admin' && (!comic || comic.creatorId !== req.user.id)) return res.status(403).json({ error: 'You can only delete your own chapters.' });
      const success = await Chapter.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Chapter not found.' });
      }
      res.status(200).json({ message: 'Chapter deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ChapterController;
