const NotificationService = require('../services/notificationService');

class NotificationController {
  static async list(req, res, next) {
    try {
      res.json({ notifications: await NotificationService.list(req.user.id) });
    } catch (e) {
      next(e);
    }
  }

  static async read(req, res, next) {
    try {
      await NotificationService.markRead(req.user.id, req.params.id);
      res.json({ success: true, message: 'Notification marked as read.' });
    } catch (e) {
      next(e);
    }
  }

  static async readAll(req, res, next) {
    try {
      await NotificationService.markAllRead(req.user.id);
      res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (e) {
      next(e);
    }
  }

  static async deleteOne(req, res, next) {
    try {
      await NotificationService.deleteOne(req.user.id, req.params.id);
      res.json({ success: true, message: 'Notification deleted.' });
    } catch (e) {
      next(e);
    }
  }

  static async deleteAll(req, res, next) {
    try {
      await NotificationService.deleteAll(req.user.id);
      res.json({ success: true, message: 'All notifications deleted.' });
    } catch (e) {
      next(e);
    }
  }

  static async prefs(req, res, next) {
    try {
      res.json({ preferences: await NotificationService.preferences(req.user.id) });
    } catch (e) {
      next(e);
    }
  }

  static async updatePrefs(req, res, next) {
    try {
      res.json({ preferences: await NotificationService.updatePreferences(req.user.id, req.body) });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = NotificationController;
