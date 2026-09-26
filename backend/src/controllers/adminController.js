const User = require('../models/User');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const JsonManagerService = require('../services/jsonManagerService');
const db = require('../config/database');
const NotificationService = require('../services/notificationService');
const EmailService = require('../services/emailService');

class AdminController {
  static async getUsers(req, res, next) {
    try {
      res.status(200).json({ users: await User.getAll() });
    } catch (err) {
      next(err);
    }
  }

  static async getStatistics(req, res, next) {
    try {
      if (db.isPgConnected()) {
        const [u, c, ch, v, cv, l, b, cr, pr, au, rc, rch, prq] = await Promise.all([
          db.query('SELECT COUNT(*) FROM users'),
          db.query("SELECT COUNT(*) FROM comics WHERE publish_status='published'"),
          db.query("SELECT COUNT(*) FROM chapters WHERE publish_status='published'"),
          db.query("SELECT COALESCE(SUM(views),0) AS total FROM comics WHERE publish_status='published'"),
          db.query("SELECT COALESCE(SUM(views),0) AS total FROM chapters WHERE publish_status='published'"),
          db.query('SELECT COUNT(*) FROM favorites'),
          db.query('SELECT COUNT(*) FROM bookmarks'),
          db.query("SELECT COUNT(*) FROM users WHERE role='creator'"),
          db.query("SELECT COUNT(*) FROM users WHERE is_premium=true AND (premium_expires_at IS NULL OR premium_expires_at > CURRENT_TIMESTAMP)"),
          db.query("SELECT COUNT(*) FROM users WHERE account_status='active'"),
          db.query("SELECT COUNT(*) FROM comics WHERE publish_status='rejected'"),
          db.query("SELECT COUNT(*) FROM chapters WHERE publish_status='rejected'"),
          db.query("SELECT COUNT(*) FROM premium_requests WHERE status='pending'")
        ]);
        const pending = await db.query("SELECT (SELECT COUNT(*) FROM comics WHERE publish_status='pending') AS comics, (SELECT COUNT(*) FROM chapters WHERE publish_status='pending') AS chapters");
        res.json({
          totalUsers: +u.rows[0].count,
          totalComics: +c.rows[0].count,
          totalChapters: +ch.rows[0].count,
          totalViews: +v.rows[0].total,
          totalChapterViews: +cv.rows[0].total,
          totalLikes: +l.rows[0].count,
          totalBookmarks: +b.rows[0].count,
          totalCreators: +cr.rows[0].count,
          totalPremiumUsers: +pr.rows[0].count,
          totalActiveUsers: +au.rows[0].count,
          rejectedSubmissions: +rc.rows[0].count + +rch.rows[0].count,
          pendingComics: +pending.rows[0].comics,
          pendingChapters: +pending.rows[0].chapters,
          pendingSubmissions: +pending.rows[0].comics + +pending.rows[0].chapters,
          pendingPremiumRequests: +prq.rows[0].count,
          systemStatus: 'PostgreSQL Production Engine'
        });
      } else {
        const users = db.fallbackStore.users, comics = db.fallbackStore.comics, chapters = db.fallbackStore.chapters;
        const publishedComics = comics.filter(c => (c.publish_status || 'published') === 'published');
        const publishedChapters = chapters.filter(c => (c.publish_status || 'published') === 'published');
        const pendingComics = comics.filter(c => c.publish_status === 'pending').length;
        const pendingChapters = chapters.filter(c => c.publish_status === 'pending').length;
        const pendingPrq = (db.fallbackStore.premium_requests || []).filter(p => p.status === 'pending').length;
        res.json({
          totalUsers: users.length,
          totalComics: publishedComics.length,
          totalChapters: publishedChapters.length,
          totalViews: publishedComics.reduce((n, c) => n + (c.views || 0), 0),
          totalChapterViews: publishedChapters.reduce((n, c) => n + (c.views || 0), 0),
          totalLikes: db.fallbackStore.favorites.length,
          totalBookmarks: db.fallbackStore.bookmarks.length,
          totalCreators: users.filter(u => u.role === 'creator').length,
          totalPremiumUsers: users.filter(u => u.is_premium && (!u.premium_expires_at || new Date(u.premium_expires_at) > new Date())).length,
          totalActiveUsers: users.filter(u => (u.account_status || 'active') === 'active').length,
          rejectedSubmissions: comics.filter(c => c.publish_status === 'rejected').length + chapters.filter(c => c.publish_status === 'rejected').length,
          pendingComics,
          pendingChapters,
          pendingSubmissions: pendingComics + pendingChapters,
          pendingPremiumRequests: pendingPrq,
          systemStatus: 'Dynamic Local Engine'
        });
      }
    } catch (err) {
      next(err);
    }
  }

  static async getPendingSubmissions(req, res, next) {
    try {
      if (db.isPgConnected()) {
        const [c, ch] = await Promise.all([
          db.query(`SELECT c.*, u.username AS creator_username FROM comics c LEFT JOIN users u ON u.id=c.creator_id WHERE c.publish_status IN ('pending','rejected','changes_requested') ORDER BY c.updated_at DESC`),
          db.query(`SELECT ch.*, c.title AS comic_title, c.slug AS comic_slug, u.username AS creator_username FROM chapters ch JOIN comics c ON c.id=ch.comic_id LEFT JOIN users u ON u.id=c.creator_id WHERE ch.publish_status IN ('pending','rejected','changes_requested') ORDER BY ch.created_at DESC`)
        ]);
        res.json({
          comics: c.rows.map(row => ({ ...Comic.formatComic(row), creatorUsername: row.creator_username || null })),
          chapters: ch.rows.map(row => ({ ...Chapter.formatChapter(row), creatorUsername: row.creator_username || null }))
        });
        return;
      }
      const comics = db.fallbackStore.comics
        .filter(c => ['pending', 'rejected', 'changes_requested'].includes(c.publish_status))
        .map(c => {
          const u = db.fallbackStore.users.find(u => u.id === (c.creator_id || c.creatorId));
          return { ...Comic.formatComic(c), creatorUsername: u?.username || null };
        });
      const chapters = db.fallbackStore.chapters
        .filter(c => ['pending', 'rejected', 'changes_requested'].includes(c.publish_status))
        .map(c => {
          const comic = db.fallbackStore.comics.find(x => x.id === c.comic_id);
          const u = db.fallbackStore.users.find(u => u.id === (comic?.creator_id || comic?.creatorId));
          return { ...Chapter.formatChapter(c), creatorUsername: u?.username || null };
        });
      res.json({ comics, chapters });
    } catch (err) {
      next(err);
    }
  }

  static async getPremiumRequests(req, res, next) {
    try {
      const requests = await User.getPendingPremiumRequests();
      res.json({ requests });
    } catch (err) {
      next(err);
    }
  }

  static async approvePremiumRequest(req, res, next) {
    try {
      const requestId = req.params.id;
      const durationMonths = req.body.durationMonths || 1;
      const user = await User.approvePremiumRequest(requestId, req.user.id, durationMonths);
      if (!user) return res.status(404).json({ error: 'Premium request or user not found.' });

      NotificationService.create(
        user.id,
        'premium_approved',
        'Premium Membership Approved!',
        'Your Premium membership request has been approved by an administrator! Enjoy unlimited access to exclusive comics.',
        {}
      ).catch(() => {});

      EmailService.sendPremiumActivatedEmail(user, user.premium_expires_at).catch(e => console.warn('[Email] Premium activation email failed:', e.message));

      res.json({ user, message: 'Premium membership request approved successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async rejectPremiumRequest(req, res, next) {
    try {
      const requestId = req.params.id;
      const reason = req.body.reason || 'Did not meet requirements';
      const user = await User.rejectPremiumRequest(requestId, req.user.id, reason);
      if (!user) return res.status(404).json({ error: 'Premium request or user not found.' });

      NotificationService.create(
        user.id,
        'premium_rejected',
        'Premium Request Update',
        'Your Premium membership request could not be approved at this time.',
        { reason }
      ).catch(() => {});

      EmailService.sendPremiumRejectedEmail(user, reason).catch(e => console.warn('[Email] Premium rejection email failed:', e.message));

      res.json({ user, message: 'Premium request rejected.' });
    } catch (err) {
      next(err);
    }
  }

  static async setUserStatus(req, res, next) {
    try {
      const status = req.body.status;
      if (!['active', 'blocked', 'banned'].includes(status)) return res.status(400).json({ error: 'Invalid account status.' });
      if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot change your own account status.' });
      const user = await User.setStatus(req.params.id, status);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json({ user, message: `User status set to ${status}.` });
    } catch (err) {
      next(err);
    }
  }

  static async setRole(req, res, next) {
    try {
      const targetId = req.params.id;
      const newRole = req.body.role;
      if (!['user', 'creator', 'admin'].includes(newRole)) return res.status(400).json({ error: 'Invalid user role.' });
      if (targetId === req.user.id && newRole !== 'admin') return res.status(400).json({ error: 'You cannot remove your own administrator role.' });
      const before = await User.findById(targetId);
      if (!before) return res.status(404).json({ error: 'User not found.' });
      const user = await User.setRole(targetId, newRole);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      if (newRole === 'admin' && before.role !== 'admin') {
        NotificationService.create(targetId, 'admin_promoted', 'Administrator access granted', 'You have been promoted to administrator on Elder’s Veil.', {}).catch(() => {});
        EmailService.sendAdminPromotedEmail(user).catch(e => console.warn('[Email] Admin promotion email failed:', e.message));
      } else if (before.role === 'admin' && newRole !== 'admin') {
        NotificationService.create(targetId, 'admin_removed', 'Administrator access removed', 'Your administrator access on Elder’s Veil has been removed.', {}).catch(() => {});
        EmailService.sendAdminRemovedEmail(user).catch(e => console.warn('[Email] Admin removal email failed:', e.message));
      }
      res.json({ user, message: 'User role updated.' });
    } catch (e) {
      next(e);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const targetId = req.params.id;
      if (!targetId) {
        return res.status(400).json({ success: false, message: 'User ID is required.' });
      }
      if (targetId === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own administrator account.' });
      }

      const user = await User.findById(targetId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Send account deletion email notification safely (email failure does NOT break DB deletion)
      try {
        if (typeof EmailService.sendAccountDeletedEmail === 'function') {
          EmailService.sendAccountDeletedEmail(user).catch(e => console.warn('[Email] Account deletion email failed:', e.message));
        }
      } catch (emailErr) {
        console.warn('[Email] Account deletion email exception:', emailErr.message);
      }

      const deleted = await User.deleteById(targetId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        user: deleted
      });
    } catch (e) {
      next(e);
    }
  }

  static async setPremium(req, res, next) {
    try {
      const user = await User.setPremium(req.params.id, !!req.body.isPremium, req.body.durationMonths || 1);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      if (user.is_premium) EmailService.sendPremiumActivatedEmail(user, user.premium_expires_at).catch(e => console.warn('[Email] Premium email failed:', e.message));
      res.json({ user, message: user.is_premium ? `Premium enabled for ${req.body.durationMonths || 1} month(s) (expires ${new Date(user.premium_expires_at).toLocaleDateString()}).` : 'Premium removed.' });
    } catch (err) {
      next(err);
    }
  }

  static async importComicsJson(req, res, next) {
    try {
      res.status(200).json(await JsonManagerService.importJson(req.body));
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
