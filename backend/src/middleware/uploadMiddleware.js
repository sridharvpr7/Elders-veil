const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UPLOAD_DIR, dirs } = require('../config/uploadConfig');

const safeSegment = (v, f = 'temp') => {
  const x = String(v || f).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  return x || f;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = UPLOAD_DIR;
    if (file.fieldname === 'cover' || req.originalUrl.includes('/cover')) dest = dirs.covers;
    else if (file.fieldname === 'banner' || req.originalUrl.includes('/banner')) dest = dirs.banners;
    else if (file.fieldname === 'avatar' || req.originalUrl.includes('/avatar')) dest = dirs.avatars;
    else if (file.fieldname === 'pages' || req.originalUrl.includes('/chapter-pages')) {
      dest = path.join(
        dirs.comics,
        safeSegment(req.body.comicId),
        safeSegment(req.body.chapterId)
      );
    }

    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const mime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ext = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const e = path.extname(file.originalname).toLowerCase();

  if (mime.includes(file.mimetype) && ext.includes(e)) {
    cb(null, true);
  } else {
    cb(new Error(
      'Invalid image file format. Only JPG, PNG, WEBP, and GIF are allowed.'
    ));
  }
};

const makeUpload = (size) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: size }
  });

const upload = makeUpload(10 * 1024 * 1024);
upload.chapterPageUpload = makeUpload(150 * 1024);
upload.avatarUpload = makeUpload(50 * 1024);

module.exports = upload;
