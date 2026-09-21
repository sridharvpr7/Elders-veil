const User = require('../models/User');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const JsonManagerService = require('../services/jsonManagerService');
const db = require('../config/database');

class AdminController {
  static async getUsers(req, res, next) {
    try {
      const users = await User.getAll();
      res.status(200).json({ users });
    } catch (err) {
      next(err);
    }
  }

  static async getStatistics(req, res, next) {
    try {
      const comics = await Comic.getAll({ limit: 10000 });
      const users = await User.getAll();
      
      let totalViews = 0;
      comics.forEach(c => totalViews += (c.views || 0));

      let totalChaptersCount = 0;
      if (db.isPgConnected()) {
        const chRes = await db.query('SELECT COUNT(*) FROM chapters');
        totalChaptersCount = parseInt(chRes.rows[0].count, 10);
      } else {
        totalChaptersCount = db.fallbackStore.chapters.length;
      }

      res.status(200).json({
        totalComics: comics.length,
        totalChapters: totalChaptersCount,
        totalUsers: users.length,
        totalViews,
        systemStatus: db.isPgConnected() ? 'PostgreSQL Production Engine' : 'Dynamic Local Engine'
      });
    } catch (err) {
      next(err);
    }
  }

  static async importComicsJson(req, res, next) {
    try {
      const result = await JsonManagerService.importJson(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async exportComicsJson(req, res, next) {
    try {
      const data = await JsonManagerService.exportJson();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="comicverse_backup.json"');
      res.status(200).send(JSON.stringify(data, null, 2));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
