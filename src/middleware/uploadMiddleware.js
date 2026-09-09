const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const uploadsDir = path.join(__dirname, '../../uploads/properties');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_IMAGE = /^image\//;
const ALLOWED_VIDEO = /^video\/(mp4|webm|ogg|quicktime)$/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE.test(file.mimetype) || ALLOWED_VIDEO.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image or video files are allowed (JPG, PNG, MP4, WEBM)'), false);
  }
};

const uploadPropertyPhotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
});

module.exports = { uploadPropertyPhotos, uploadsDir };
