/**
 * File routes
 */

import { Router } from 'express';
import { uploadSingle } from '../middlewares/files.middleware';
import filesController from '../controllers/files.controller';
import { filesErrorHandler } from '../middlewares/filesErrorHandler';

const router = Router();

/**
 * POST /file-upload
 * Accepts an MP3 file and returns the frame count
 */
router.post('/file-upload', uploadSingle, filesController.uploadFile);

// Error handler for file routes (must be last)
router.use(filesErrorHandler);

export default router;
