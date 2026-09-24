const db = require('../config/database');

class Chapter {
  static async getByCreatorId(creatorId) {
    if (db.isPgConnected()) {
      const res = await db.query(`
        SELECT ch.*, c.title AS comic_title, c.creator_id
        FROM chapters ch JOIN comics c ON c.id = ch.comic_id
        WHERE c.creator_id = $1
        ORDER BY ch.created_at DESC
      `, [creatorId]);
      return res.rows.map(row => ({ ...this.formatChapter(row), comicTitle: row.comic_title }));
    }
    return db.fallbackStore.chapters
      .filter(ch => {
        const comic = db.fallbackStore.comics.find(c => c.id === ch.comic_id);
        return comic && (comic.creator_id || comic.creatorId) === creatorId;
      })
      .sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .map(ch => {
        const comic = db.fallbackStore.comics.find(c => c.id === ch.comic_id) || {};
        return { ...this.formatChapter(ch), comicTitle: comic.title };
      });
  }

  static async getByComicId(comicId, { includeUnpublished = false } = {}) {
    if (db.isPgConnected()) {
      let sql = `
        SELECT ch.*, COUNT(cp.id) as page_count
        FROM chapters ch
        LEFT JOIN chapter_pages cp ON ch.id = cp.chapter_id
        WHERE ch.comic_id = $1
      `;
      const params = [comicId];
      if (!includeUnpublished) sql += ` AND ch.publish_status = 'published'`;
      sql += ` GROUP BY ch.id ORDER BY ch.chapter_number ASC`;
      const res = await db.query(sql, params);
      return res.rows.map(this.formatChapter);
    }
    let list = db.fallbackStore.chapters.filter(ch => ch.comic_id === comicId);
    if (!includeUnpublished) list = list.filter(ch => (ch.publish_status || 'published') === 'published');
    list.sort((a, b) => a.chapter_number - b.chapter_number);
    return list.map(this.formatChapter);
  }

  static async findById(id) {
    if (db.isPgConnected()) {
      const res = await db.query(`SELECT * FROM chapters WHERE id = $1`, [id]);
      if (!res.rows[0]) return null;
      const pageRes = await db.query(`SELECT image_url FROM chapter_pages WHERE chapter_id = $1 ORDER BY page_number ASC`, [id]);
      return this.formatChapter({ ...res.rows[0], pages: pageRes.rows.map(r => r.image_url) });
    }
    const ch = db.fallbackStore.chapters.find(c => c.id === id);
    if (!ch) return null;
    const pages = db.fallbackStore.chapter_pages.filter(p => p.chapter_id === id).sort((a,b)=>a.page_number-b.page_number).map(p=>p.image_url);
    return this.formatChapter({ ...ch, pages });
  }

  static async create({ id, comicId, chapterNumber, title, releaseDate, pages = [], publishStatus = 'pending', reviewNote = null }) {
    const chapterId = id || `chapter-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const release = releaseDate || now.toISOString().split('T')[0];
    if (db.isPgConnected()) {
      await db.query(`INSERT INTO chapters (id, comic_id, chapter_number, title, release_date, views, publish_status, review_note, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [chapterId, comicId, Number(chapterNumber), title || `Chapter ${chapterNumber}`, release, 0, publishStatus, reviewNote, now]);
      for (let i=0;i<pages.length;i++) await db.query(`INSERT INTO chapter_pages (id,chapter_id,page_number,image_url) VALUES ($1,$2,$3,$4)`, [`page-${chapterId}-${i+1}`, chapterId, i+1, pages[i]]);
      await db.query('UPDATE comics SET updated_at=CURRENT_TIMESTAMP WHERE id=$1',[comicId]);
      return this.findById(chapterId);
    }
    const newChapter={id:chapterId,comic_id:comicId,chapter_number:Number(chapterNumber),title:title||`Chapter ${chapterNumber}`,release_date:release,views:0,publish_status:publishStatus,review_note:reviewNote,created_at:now};
    db.fallbackStore.chapters.push(newChapter);
    pages.forEach((url,index)=>db.fallbackStore.chapter_pages.push({id:`page-${chapterId}-${index+1}`,chapter_id:chapterId,page_number:index+1,image_url:url}));
    const targetComic=db.fallbackStore.comics.find(c=>c.id===comicId); if(targetComic) targetComic.updated_at=now;
    db.saveFallbackStore();
    return this.formatChapter({...newChapter,pages});
  }

  static async update(id, { chapterNumber, title, pages, publishStatus, reviewNote }) {
    if (db.isPgConnected()) {
      const fields=[]; const params=[id];
      const values={chapter_number:chapterNumber!==undefined?Number(chapterNumber):undefined,title,publish_status:publishStatus,review_note:reviewNote};
      Object.entries(values).forEach(([key,val])=>{if(val!==undefined){params.push(val);fields.push(`${key}=$${params.length}`);}});
      if(fields.length) await db.query(`UPDATE chapters SET ${fields.join(', ')} WHERE id=$1`,params);
      if(Array.isArray(pages)){await db.query('DELETE FROM chapter_pages WHERE chapter_id=$1',[id]);for(let i=0;i<pages.length;i++) await db.query(`INSERT INTO chapter_pages (id,chapter_id,page_number,image_url) VALUES ($1,$2,$3,$4)`,[`page-${id}-${i+1}`,id,i+1,pages[i]]);}
      return this.findById(id);
    }
    const ch=db.fallbackStore.chapters.find(c=>c.id===id); if(!ch) return null;
    if(chapterNumber!==undefined) ch.chapter_number=Number(chapterNumber); if(title!==undefined) ch.title=title;
    if(publishStatus!==undefined) ch.publish_status=publishStatus; if(reviewNote!==undefined) ch.review_note=reviewNote;
    if(Array.isArray(pages)){db.fallbackStore.chapter_pages=db.fallbackStore.chapter_pages.filter(p=>p.chapter_id!==id);pages.forEach((url,index)=>db.fallbackStore.chapter_pages.push({id:`page-${id}-${index+1}`,chapter_id:id,page_number:index+1,image_url:url}));}
    db.saveFallbackStore(); return this.findById(id);
  }

  static async delete(id) {
    if(db.isPgConnected()){const res=await db.query('DELETE FROM chapters WHERE id=$1 RETURNING comic_id',[id]);return res.rowCount>0;}
    const idx=db.fallbackStore.chapters.findIndex(c=>c.id===id); if(idx!==-1){db.fallbackStore.chapters.splice(idx,1);db.fallbackStore.chapter_pages=db.fallbackStore.chapter_pages.filter(p=>p.chapter_id!==id);db.saveFallbackStore();return true;} return false;
  }

  static async incrementViews(id){if(db.isPgConnected()){await db.query('UPDATE chapters SET views=views+1 WHERE id=$1',[id]);return;} const ch=db.fallbackStore.chapters.find(c=>c.id===id);if(ch){ch.views=(ch.views||0)+1;db.saveFallbackStore();}}

  static formatChapter(row){if(!row)return null;return {id:row.id,comicId:row.comic_id||row.comicId,chapterNumber:parseFloat(row.chapter_number||row.chapterNumber||1),title:row.title,pages:Array.isArray(row.pages)?row.pages:[],pageCount:parseInt(row.page_count||row.pageCount||(Array.isArray(row.pages)?row.pages.length:0),10),releaseDate:row.release_date||row.releaseDate||new Date().toISOString().split('T')[0],views:parseInt(row.views||0,10),publishStatus:row.publish_status||row.publishStatus||'published',reviewNote:row.review_note||row.reviewNote||null,createdAt:row.created_at};}
}
module.exports=Chapter;
