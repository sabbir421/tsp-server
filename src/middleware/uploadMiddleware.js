const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_MIME = /^(image\/(jpeg|jpg|png|webp|heic|heif)|video\/(mp4|webm|ogg|quicktime|3gpp)|application\/pdf)$/i;
const ALLOWED_EXT = /\.(jpe?g|png|webp|heic|heif|mp4|webm|ogg|mov|3gp|pdf)$/i;

const fileFilter = (req, file, cb) => {
  const mimeMatch = ALLOWED_MIME.test(file.mimetype || '');
  const extMatch = ALLOWED_EXT.test(file.originalname || '');

  if (mimeMatch || extMatch) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed for ${file.originalname}. Allowed: Images (JPG, PNG, WEBP), Videos (MP4, MOV, WEBM), Documents (PDF, JPG, PNG)`), false);
  }
};

const uploadPropertyFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 30, // Up to 30 files total across photos, documents, verification
  },
});

module.exports = {
  uploadPropertyPhotos: uploadPropertyFiles,
  uploadPropertyFiles,
};
