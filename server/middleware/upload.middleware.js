const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

const uploadDir = path.join(__dirname, '../../', env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let subfolder = 'comics';
    if (file.fieldname === 'avatar') {
      subfolder = 'avatars';
    }
    const dest = path.join(uploadDir, subfolder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file type. Only JPG, PNG, WEBP, and SVG are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: fileFilter
});

module.exports = upload;
