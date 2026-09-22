const db = require('../config/database');

class ReadingHistory {
  static async getByUserId(userId) {
    if (db.isPgConnected()) {
      const sql = `
        SELECT rh.*, 
               c.title as comic_title, c.slug as comic_slug, c.cover_image as comic_cover,
               ch.chapter_number, ch.title as chapter_title, (SELECT COUNT(*) FROM chapters c2 WHERE c2.comic_id = rh.comic_id AND c2.publish_status = 'published' AND c2.chapter_number <= ch.chapter_number) AS completed_chapters, (SELECT COUNT(*) FROM chapters c3 WHERE c3.comic_id = rh.comic_id AND c3.publish_status = 'published') AS total_chapters, (SELECT COUNT(*) FROM chapter_pages cp2 WHERE cp2.chapter_id = rh.chapter_id) AS current_chapter_pages
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
      const chapters = db.fallbackStore.chapters.filter(ch => ch.comic_id === h.comic_id && (ch.publish_status || 'published') === 'published').sort((a,b)=>a.chapter_number-b.chapter_number);
      const idx = Math.max(0, chapters.findIndex(ch => ch.id === h.chapter_id));
      const pages = Math.max(1, db.fallbackStore.chapter_pages.filter(p => p.chapter_id === h.chapter_id).length);
      return this.formatHistory({...h,comic_title:comic.title,comic_slug:comic.slug,comic_cover:comic.cover_image,chapter_number:chapter.chapter_number,chapter_title:chapter.title,total_chapters:Math.max(1,chapters.length),completed_chapters:idx+1,current_chapter_pages:pages});
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
    const totalChapters = parseInt(row.total_chapters || row.totalChapters || 1, 10);
    const completedChapters = parseInt(row.completed_chapters || row.completedChapters || 1, 10);
    const currentPages = Math.max(1, parseInt(row.current_chapter_pages || row.currentChapterPages || 1, 10));
    const page = Math.min(currentPages, Math.max(1, parseInt(row.page_number || row.pageNumber || 1, 10)));
    const progress = row.progress_percent !== undefined ? Number(row.progress_percent) : (((Math.max(0, completedChapters - 1) + page / currentPages) / Math.max(1, totalChapters)) * 100);
    return {id:row.id,userId:row.user_id||row.userId,comicId:row.comic_id||row.comicId,chapterId:row.chapter_id||row.chapterId,pageNumber:page,updatedAt:row.updated_at||row.updatedAt,comicTitle:row.comic_title||row.comicTitle,comicSlug:row.comic_slug||row.comicSlug,comicCover:row.comic_cover||row.comicCover,chapterNumber:row.chapter_number||row.chapterNumber,chapterTitle:row.chapter_title||row.chapterTitle,totalChapters,completedChapters,currentChapterPages:currentPages,progressPercent:Math.min(100,Math.max(0,Math.round(progress)))};
  }
}

module.exports = ReadingHistory;
