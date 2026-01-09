/**
 * File controller
 * Handles HTTP request/response for file operations
 */

import { Request, Response, NextFunction } from 'express';
import filesService from '../services/files.service';

/**
 * POST /file-upload
 * Accepts an MP3 file and returns the frame count
 */
const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        error: 'No file uploaded. Please provide an MP3 file.',
      });
      return;
    }

    // Get file buffer
    const fileBuffer = req.file.buffer;

    // Parse MP3 and count frames using service
    const result = filesService.countMP3Frames(fileBuffer);

    // Return frame count
    res.status(200).json({
      frameCount: result.frameCount,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadFile,
};
