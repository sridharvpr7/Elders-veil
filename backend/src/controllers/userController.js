const User = require('../models/User');
const Bookmark = require('../models/Bookmark');
const Favorite = require('../models/Favorite');
const ReadingHistory = require('../models/ReadingHistory');

class UserController {
  static async getProfile(req, res) {
    res.status(200).json({ user: req.user });
  }

  static async updateProfile(req, res, next) {
    try {
      const { username, avatar } = req.body;
      const updatedUser = await User.updateProfile(req.user.id, { username, avatar });
      res.status(200).json({ user: updatedUser, message: 'Profile updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      const fullUser = await User.findByEmail(req.user.email);
      const isMatch = await User.verifyPassword(fullUser, currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      await User.updatePassword(req.user.id, newPassword);
      res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async getBookmarks(req, res, next) {
    try {
      const bookmarks = await Bookmark.getByUserId(req.user.id);
      res.status(200).json({ bookmarks });
    } catch (err) {
      next(err);
    }
  }

  static async addBookmark(req, res, next) {
    try {
      const { comicId } = req.body;
      if (!comicId) return res.status(400).json({ error: 'comicId is required.' });
      await Bookmark.add(req.user.id, comicId);
      res.status(200).json({ message: 'Comic added to bookmarks.' });
    } catch (err) {
      next(err);
    }
  }

  static async removeBookmark(req, res, next) {
    try {
      await Bookmark.remove(req.user.id, req.params.comicId);
      res.status(200).json({ message: 'Comic removed from bookmarks.' });
    } catch (err) {
      next(err);
    }
  }

  static async getFavorites(req, res, next) {
    try {
      const favorites = await Favorite.getByUserId(req.user.id);
      res.status(200).json({ favorites });
    } catch (err) {
      next(err);
    }
  }

  static async addFavorite(req, res, next) {
    try {
      const { comicId } = req.body;
      if (!comicId) return res.status(400).json({ error: 'comicId is required.' });
      await Favorite.add(req.user.id, comicId);
      res.status(200).json({ message: 'Comic added to favorites.' });
    } catch (err) {
      next(err);
    }
  }

  static async removeFavorite(req, res, next) {
    try {
      await Favorite.remove(req.user.id, req.params.comicId);
      res.status(200).json({ message: 'Comic removed from favorites.' });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const history = await ReadingHistory.getByUserId(req.user.id);
      res.status(200).json({ history });
    } catch (err) {
      next(err);
    }
  }

  static async saveHistory(req, res, next) {
    try {
      const { comicId, chapterId, pageNumber } = req.body;
      if (!comicId || !chapterId) {
        return res.status(400).json({ error: 'comicId and chapterId are required.' });
      }
      await ReadingHistory.saveProgress(req.user.id, comicId, chapterId, pageNumber || 1);
      res.status(200).json({ message: 'Reading progress saved.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
