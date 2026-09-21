const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../../uploads');
const coversDir = path.join(uploadsDir, 'covers');
const bannersDir = path.join(uploadsDir, 'banners');
const comicsDir = path.join(uploadsDir, 'comics');

[uploadsDir, coversDir, bannersDir, comicsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadsDir;
    if (file.fieldname === 'cover' || req.originalUrl.includes('/cover')) {
      dest = coversDir;
    } else if (file.fieldname === 'banner' || req.originalUrl.includes('/banner')) {
      dest = bannersDir;
    } else if (file.fieldname === 'pages' || req.originalUrl.includes('/chapter-pages')) {
      const comicId = req.body.comicId || 'temp';
      const chapterId = req.body.chapterId || 'temp';
      dest = path.join(comicsDir, comicId, chapterId);
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file format. Only JPG, PNG, WEBP, and GIF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per image
  }
});

module.exports = upload;
