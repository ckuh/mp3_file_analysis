/**
 * Unit tests for files.service.ts
 */

import filesService from '../../services/files.service';
import { InvalidFileError } from '../../utils/errors';
import {
  createDefaultFrameHeader,
  createMP3Frame,
  createID3v2Header,
  createID3v1Tag,
} from '../test-utils/mp3-buffer-utils';
import { calculateFrameSize } from '../../utils/frame.utils';

describe('files.service', () => {
  describe('countMP3Frames', () => {
    it('should count single frame correctly', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);
      const buffer = frame;

      const result = filesService.countMP3Frames(buffer);

      expect(result.frameCount).toBe(1);
    });

    it('should count multiple frames correctly', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame1 = createMP3Frame(header, frameSize);
      const frame2 = createMP3Frame(header, frameSize);
      const frame3 = createMP3Frame(header, frameSize);
      const buffer = Buffer.concat([frame1, frame2, frame3]);

      const result = filesService.countMP3Frames(buffer);

      expect(result.frameCount).toBe(3);
    });

    it('should skip ID3v2 tag at the beginning', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);
      const id3v2Tag = Buffer.concat([createID3v2Header(50), Buffer.alloc(50)]);
      const buffer = Buffer.concat([id3v2Tag, frame]);

      const result = filesService.countMP3Frames(buffer);

      expect(result.frameCount).toBe(1);
    });

    it('should skip ID3v1 tag at the end', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);
      const id3v1Tag = createID3v1Tag();
      const buffer = Buffer.concat([frame, id3v1Tag]);

      const result = filesService.countMP3Frames(buffer);

      expect(result.frameCount).toBe(1);
    });

    it('should handle both ID3v2 and ID3v1 tags', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);
      const id3v2Tag = Buffer.concat([createID3v2Header(50), Buffer.alloc(50)]);
      const id3v1Tag = createID3v1Tag();
      const buffer = Buffer.concat([id3v2Tag, frame, id3v1Tag]);

      const result = filesService.countMP3Frames(buffer);

      expect(result.frameCount).toBe(1);
    });

    it('should throw error for empty buffer', () => {
      const buffer = Buffer.alloc(0);

      expect(() => filesService.countMP3Frames(buffer)).toThrow(
        InvalidFileError
      );
      expect(() => filesService.countMP3Frames(buffer)).toThrow(
        'File is too small or empty'
      );
    });

    it('should throw error for buffer too small', () => {
      const buffer = Buffer.alloc(3);

      expect(() => filesService.countMP3Frames(buffer)).toThrow(
        InvalidFileError
      );
    });

    it('should throw error when no valid frames found', () => {
      const buffer = Buffer.alloc(1000); // Just zeros, no valid frames

      expect(() => filesService.countMP3Frames(buffer)).toThrow(
        InvalidFileError
      );
      expect(() => filesService.countMP3Frames(buffer)).toThrow(
        'No valid MPEG Version 1 Audio Layer 3 frames found'
      );
    });

    it('should throw error for invalid ID3v2 tag size', () => {
      const id3v2Header = createID3v2Header(1000000); // Very large size
      const buffer = Buffer.concat([id3v2Header, Buffer.alloc(100)]); // But small buffer

      expect(() => filesService.countMP3Frames(buffer)).toThrow(
        InvalidFileError
      );
      expect(() => filesService.countMP3Frames(buffer)).toThrow(
        'Invalid ID3v2 tag size'
      );
    });

    it('should skip invalid frame headers and continue searching', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const validFrame = createMP3Frame(header, frameSize);

      // Create buffer with some invalid sync words, then valid frame
      const invalidData = Buffer.alloc(100);
      invalidData[0] = 0xff;
      invalidData[1] = 0xe0; // Looks like sync, but rest is invalid
      const buffer = Buffer.concat([invalidData, validFrame]);

      const result = filesService.countMP3Frames(buffer);

      expect(result.frameCount).toBe(1);
    });

    it('should handle frames with padding correctly', () => {
      const header = {
        ...createDefaultFrameHeader(),
        paddingBit: 1,
      };
      const frameSize = calculateFrameSize(128, 44100, true);
      const frame = createMP3Frame(header, frameSize);
      const buffer = frame;

      const result = filesService.countMP3Frames(buffer);

      expect(result.frameCount).toBe(1);
    });

    it('should skip Xing/LAME header frames', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const xingFrame = createMP3Frame(header, frameSize);

      // Add Xing identifier
      const sideInfoSize = header.channelMode === 0b11 ? 17 : 32;
      const crcSize = header.hasCrc ? 2 : 0;
      const identifierOffset = 4 + crcSize + sideInfoSize;
      xingFrame.write('Xing', identifierOffset, 'ascii');

      // Add a regular frame after
      const regularFrame = createMP3Frame(header, frameSize);
      const buffer = Buffer.concat([xingFrame, regularFrame]);

      const result = filesService.countMP3Frames(buffer);

      // Should only count the regular frame, not the Xing frame
      expect(result.frameCount).toBe(1);
    });

    it('should handle different bitrates correctly', () => {
      const bitrates = [9, 10, 11, 12]; // 128, 160, 192, 224 kbps
      const frames: Buffer[] = [];

      bitrates.forEach((bitrateIndex) => {
        const header = {
          ...createDefaultFrameHeader(),
          bitrateIndex,
        };
        const bitrate = [
          0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
        ][bitrateIndex];
        const frameSize = calculateFrameSize(bitrate, 44100, false);
        const frame = createMP3Frame(header, frameSize);
        frames.push(frame);
      });

      const buffer = Buffer.concat(frames);

      const result = filesService.countMP3Frames(buffer);

      expect(result.frameCount).toBe(4);
    });
  });
});
