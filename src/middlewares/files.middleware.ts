/**
 * Multer middleware for file uploads
 */

import multer from 'multer';

// Configure multer to store files in memory
const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio/mpeg or files with .mp3 extension
    if (
      file.mimetype === 'audio/mpeg' ||
      file.mimetype === 'audio/mp3' ||
      file.originalname.toLowerCase().endsWith('.mp3')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 files are allowed'));
    }
  },
});

// Export multer middleware for single file upload with field name 'file'
export const uploadSingle = fileUpload.single('file');
