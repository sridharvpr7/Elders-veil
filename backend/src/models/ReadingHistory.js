const db = require('../config/database');

class ReadingHistory {
  static async getByUserId(userId) {
    if (db.isPgConnected()) {
      const sql = `
        SELECT rh.*, 
               c.title as comic_title, c.slug as comic_slug, c.cover_image as comic_cover,
               ch.chapter_number, ch.title as chapter_title
        FROM reading_history rh
        JOIN comics c ON rh.comic_id = c.id
        JOIN chapters ch ON rh.chapter_id = ch.id
        WHERE rh.user_id = $1
        ORDER BY rh.updated_at DESC
      `;
      const res = await db.query(sql, [userId]);
      return res.rows.map(this.formatHistory);
    }

    const histories = db.fallbackStore.reading_history
      .filter(h => h.user_id === userId)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return histories.map(h => {
      const comic = db.fallbackStore.comics.find(c => c.id === h.comic_id) || {};
      const chapter = db.fallbackStore.chapters.find(ch => ch.id === h.chapter_id) || {};
      return this.formatHistory({
        ...h,
        comic_title: comic.title,
        comic_slug: comic.slug,
        comic_cover: comic.cover_image,
        chapter_number: chapter.chapter_number,
        chapter_title: chapter.title
      });
    });
  }

  static async saveProgress(userId, comicId, chapterId, pageNumber = 1) {
    const id = `history-${userId}-${comicId}`;
    const now = new Date();

    if (db.isPgConnected()) {
      await db.query(
        `INSERT INTO reading_history (id, user_id, comic_id, chapter_id, page_number, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, comic_id) 
         DO UPDATE SET chapter_id = EXCLUDED.chapter_id, page_number = EXCLUDED.page_number, updated_at = EXCLUDED.updated_at`,
        [id, userId, comicId, chapterId, Number(pageNumber), now]
      );
      return true;
    }

    let existing = db.fallbackStore.reading_history.find(h => h.user_id === userId && h.comic_id === comicId);
    if (existing) {
      existing.chapter_id = chapterId;
      existing.page_number = Number(pageNumber);
      existing.updated_at = now;
    } else {
      db.fallbackStore.reading_history.push({
        id,
        user_id: userId,
        comic_id: comicId,
        chapter_id: chapterId,
        page_number: Number(pageNumber),
        updated_at: now
      });
    }
    db.saveFallbackStore();
    return true;
  }

  static formatHistory(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id || row.userId,
      comicId: row.comic_id || row.comicId,
      chapterId: row.chapter_id || row.chapterId,
      pageNumber: parseInt(row.page_number || row.pageNumber || 1, 10),
      updatedAt: row.updated_at || row.updatedAt,
      comicTitle: row.comic_title || row.comicTitle,
      comicSlug: row.comic_slug || row.comicSlug,
      comicCover: row.comic_cover || row.comicCover,
      chapterNumber: row.chapter_number || row.chapterNumber,
      chapterTitle: row.chapter_title || row.chapterTitle
    };
  }
}

module.exports = ReadingHistory;
