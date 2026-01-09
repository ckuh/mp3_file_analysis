/**
 * File error handling middleware
 * Handles errors specific to file upload and MP3 parsing operations
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  InvalidFileError,
  UnsupportedFormatError,
  ParseError,
} from '../utils/errors';

export const filesErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle multer errors - check both instanceof and name
  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    const multerErr = err as multer.MulterError;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'File is too large. Maximum size is 25MB.',
      });
      return;
    }

    if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        error: 'Unexpected file field. Only one file is allowed at a time.',
      });
      return;
    }

    res.status(400).json({
      error: `File upload error: ${err.message}`,
    });
    return;
  }

  if (err.message === 'Only MP3 files are allowed') {
    res.status(400).json({
      error: 'Invalid file type. Only MP3 files are allowed.',
    });
    return;
  }

  // Handle custom errors
  if (
    err instanceof InvalidFileError ||
    err instanceof UnsupportedFormatError ||
    err instanceof ParseError
  ) {
    res.status(400).json({
      error: err.message,
    });
    return;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
};
