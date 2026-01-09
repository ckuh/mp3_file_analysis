/**
 * Unit tests for files.controller.ts
 */

import request from 'supertest';
import express, { Express } from 'express';
import multer from 'multer';
import filesController from '../../controllers/files.controller';
import {
  InvalidFileError,
  UnsupportedFormatError,
  ParseError,
} from '../../utils/errors';
import filesService from '../../services/files.service';
import {
  createDefaultFrameHeader,
  createMP3Frame,
} from '../test-utils/mp3-buffer-utils';
import { calculateFrameSize } from '../../utils/frame.utils';

// Mock the files service
jest.mock('../../services/files.service');

describe('files.controller', () => {
  let app: Express;
  const mockCountMP3Frames = filesService.countMP3Frames as jest.MockedFunction<
    typeof filesService.countMP3Frames
  >;

  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    app.use(express.json());

    // Set up multer middleware (in-memory storage)
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    });

    // Set up route
    app.post('/file-upload', upload.single('file'), filesController.uploadFile);

    // Error handler (matching the actual error handler middleware)
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        if (
          err instanceof InvalidFileError ||
          err instanceof UnsupportedFormatError ||
          err instanceof ParseError
        ) {
          res.status(400).json({ error: err.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /file-upload', () => {
    it('should return frame count for valid MP3 file', async () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);
      const buffer = frame;

      mockCountMP3Frames.mockReturnValue({ frameCount: 1 });

      const response = await request(app)
        .post('/file-upload')
        .attach('file', buffer, 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ frameCount: 1 });
      expect(mockCountMP3Frames).toHaveBeenCalledWith(buffer);
    });

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app).post('/file-upload');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'No file uploaded. Please provide an MP3 file.',
      });
      expect(mockCountMP3Frames).not.toHaveBeenCalled();
    });

    it('should handle service errors correctly', async () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);
      const buffer = frame;

      mockCountMP3Frames.mockImplementation(() => {
        throw new InvalidFileError('Invalid or corrupted file');
      });

      const response = await request(app)
        .post('/file-upload')
        .attach('file', buffer, 'test.mp3');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid or corrupted file');
    });

    it('should handle multiple frames correctly', async () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame1 = createMP3Frame(header, frameSize);
      const frame2 = createMP3Frame(header, frameSize);
      const buffer = Buffer.concat([frame1, frame2]);

      mockCountMP3Frames.mockReturnValue({ frameCount: 2 });

      const response = await request(app)
        .post('/file-upload')
        .attach('file', buffer, 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ frameCount: 2 });
    });

    it('should handle large frame counts', async () => {
      const buffer = Buffer.alloc(1000);

      mockCountMP3Frames.mockReturnValue({ frameCount: 5000 });

      const response = await request(app)
        .post('/file-upload')
        .attach('file', buffer, 'test.mp3');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ frameCount: 5000 });
    });
  });
});
