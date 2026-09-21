const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const Genre = require('../models/Genre');

class JsonManagerService {
  static validateComicJson(data) {
    const errors = [];
    const comicsToImport = Array.isArray(data) ? data : (data.comics ? data.comics : [data]);

    if (!Array.isArray(comicsToImport) || comicsToImport.length === 0) {
      return { isValid: false, errors: ['JSON payload does not contain any valid comic objects.'] };
    }

    const seenComicIds = new Set();
    const seenSlugs = new Set();

    comicsToImport.forEach((comic, idx) => {
      const prefix = `Comic #${idx + 1} (${comic.title || 'Untitled'})`;
      
      if (!comic.title || typeof comic.title !== 'string') {
        errors.push(`${prefix}: Missing or invalid title.`);
      }

      if (comic.id) {
        if (seenComicIds.has(comic.id)) {
          errors.push(`${prefix}: Duplicate comic ID '${comic.id}' in JSON.`);
        }
        seenComicIds.add(comic.id);
      }

      if (comic.slug) {
        if (seenSlugs.has(comic.slug)) {
          errors.push(`${prefix}: Duplicate slug '${comic.slug}' in JSON.`);
        }
        seenSlugs.add(comic.slug);
      }

      if (comic.chapters && Array.isArray(comic.chapters)) {
        const seenChapterNums = new Set();
        comic.chapters.forEach((ch, chIdx) => {
          const chPrefix = `${prefix} -> Chapter #${chIdx + 1}`;
          if (ch.chapterNumber === undefined || isNaN(ch.chapterNumber)) {
            errors.push(`${chPrefix}: Missing or invalid chapterNumber.`);
          } else {
            if (seenChapterNums.has(ch.chapterNumber)) {
              errors.push(`${chPrefix}: Duplicate chapter number '${ch.chapterNumber}' in same comic.`);
            }
            seenChapterNums.add(ch.chapterNumber);
          }
          if (ch.pages && !Array.isArray(ch.pages)) {
            errors.push(`${chPrefix}: 'pages' must be an array of image URLs.`);
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      comicsToImport
    };
  }

  static async importJson(jsonData) {
    const validation = this.validateComicJson(jsonData);
    if (!validation.isValid) {
      throw { statusCode: 400, message: 'JSON validation failed', details: validation.errors };
    }

    let importedComicsCount = 0;
    let importedChaptersCount = 0;

    for (const item of validation.comicsToImport) {
      const createdComic = await Comic.create(item);
      importedComicsCount++;

      if (item.chapters && Array.isArray(item.chapters)) {
        for (const ch of item.chapters) {
          await Chapter.create({
            id: ch.id,
            comicId: createdComic.id,
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            releaseDate: ch.releaseDate,
            pages: ch.pages || []
          });
          importedChaptersCount++;
        }
      }
    }

    return {
      message: 'JSON import successful',
      importedComicsCount,
      importedChaptersCount
    };
  }

  static async exportJson() {
    const comics = await Comic.getAll({ limit: 1000 });
    const fullExport = [];

    for (const comic of comics) {
      const chapters = await Chapter.getByComicId(comic.id);
      const detailedChapters = [];
      for (const ch of chapters) {
        const fullCh = await Chapter.findById(ch.id);
        detailedChapters.push(fullCh);
      }
      fullExport.push({
        ...comic,
        chapters: detailedChapters
      });
    }

    return fullExport;
  }
}

module.exports = JsonManagerService;
