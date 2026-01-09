/**
 * File controller
 * Handles HTTP request/response for file operations
 */

import { Request, Response, NextFunction } from 'express';

/**
 * POST /files/upload
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

    console.log('fileBuffer', fileBuffer);

    res.status(200).json({
      message: 'File uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadFile,
};
