/**
 * File routes
 */

import { Router } from 'express';
import { uploadSingle } from '../middlewares/files.middleware';
import filesController from '../controllers/files.controller';

const router = Router();

/**
 * POST /file-upload
 * Accepts an MP3 file and returns the frame count
 */
router.post('/file-upload', uploadSingle, filesController.uploadFile);

export default router;
