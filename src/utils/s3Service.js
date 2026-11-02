const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configure S3 Client if credentials exist
const region = process.env.AWS_REGION || 'ap-southeast-1';
const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const customDomain = process.env.AWS_S3_CUSTOM_DOMAIN;

const isS3Configured = Boolean(bucketName && accessKeyId && secretAccessKey);

let s3Client = null;
if (isS3Configured) {
  try {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } catch (err) {
    console.error('Failed to initialize AWS S3 Client:', err);
    s3Client = null;
  }
}

const localUploadDir = path.join(__dirname, '../../uploads/properties');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

/**
 * Upload a single file buffer to AWS S3 (with local disk fallback if S3 is unconfigured)
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Target folder prefix in S3 / disk
 * @returns {Promise<string>} Public file URL
 */
async function uploadFileToS3(buffer, originalName, mimeType, folder = 'properties') {
  const ext = path.extname(originalName) || '.jpg';
  const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${uuidv4()}_${cleanBase}${ext}`;
  const s3Key = `${folder}/${filename}`;

  if (s3Client && bucketName) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
      });
      await s3Client.send(command);

      if (customDomain) {
        return `${customDomain.replace(/\/$/, '')}/${s3Key}`;
      }
      return `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
    } catch (s3Error) {
      console.warn('AWS S3 upload failed, falling back to local storage:', s3Error.message);
    }
  }

  // Local storage fallback
  const targetDir = path.join(localUploadDir, folder !== 'properties' ? folder : '');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const localFilePath = path.join(targetDir, filename);
  fs.writeFileSync(localFilePath, buffer);

  const relativeUrl = folder !== 'properties' 
    ? `/uploads/properties/${folder}/${filename}`
    : `/uploads/properties/${filename}`;
  return relativeUrl;
}

/**
 * Process Multer file objects (which can be memory storage or disk storage)
 * @param {Express.Multer.File} file
 * @param {string} folder
 * @returns {Promise<string>}
 */
async function uploadMulterFile(file, folder = 'properties') {
  if (!file) return null;

  let buffer = file.buffer;
  if (!buffer && file.path && fs.existsSync(file.path)) {
    buffer = fs.readFileSync(file.path);
  }

  if (!buffer) {
    throw new Error(`File buffer not available for ${file.originalname}`);
  }

  return uploadFileToS3(buffer, file.originalname, file.mimetype, folder);
}

/**
 * Process multiple Multer file objects
 * @param {Express.Multer.File[]} files
 * @param {string} folder
 * @returns {Promise<string[]>}
 */
async function uploadMulterFiles(files, folder = 'properties') {
  if (!Array.isArray(files) || files.length === 0) return [];
  const uploadPromises = files.map((file) => uploadMulterFile(file, folder));
  return Promise.all(uploadPromises);
}

module.exports = {
  isS3Configured: () => isS3Configured && Boolean(s3Client),
  uploadFileToS3,
  uploadMulterFile,
  uploadMulterFiles,
};

