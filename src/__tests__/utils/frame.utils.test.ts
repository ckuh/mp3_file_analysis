/**
 * Unit tests for frame.utils.ts
 */

import { calculateFrameSize, isXingLameHeader } from '../../utils/frame.utils';
import { ParseError } from '../../utils/errors';
import {
  createDefaultFrameHeader,
  createMP3Frame,
} from '../test-utils/mp3-buffer-utils';

describe('frame.utils', () => {
  describe('calculateFrameSize', () => {
    it('should calculate correct frame size for 128 kbps, 44100 Hz, no padding', () => {
      const bitrate = 128; // kbps
      const sampleRate = 44100; // Hz
      const padding = false;

      const frameSize = calculateFrameSize(bitrate, sampleRate, padding);

      // Formula: (144 * bitrate * 1000) / sampleRate + padding
      // (144 * 128 * 1000) / 44100 = 417.96... = 417 (floored)
      expect(frameSize).toBe(417);
    });

    it('should add padding byte when padding is true', () => {
      const bitrate = 128;
      const sampleRate = 44100;
      const padding = false;
      const paddingTrue = true;

      const frameSizeNoPadding = calculateFrameSize(
        bitrate,
        sampleRate,
        padding
      );
      const frameSizeWithPadding = calculateFrameSize(
        bitrate,
        sampleRate,
        paddingTrue
      );

      expect(frameSizeWithPadding).toBe(frameSizeNoPadding + 1);
    });

    it('should calculate correct frame size for 320 kbps, 48000 Hz', () => {
      const bitrate = 320;
      const sampleRate = 48000;
      const padding = false;

      const frameSize = calculateFrameSize(bitrate, sampleRate, padding);

      // (144 * 320 * 1000) / 48000 = 960
      expect(frameSize).toBe(960);
    });

    it('should throw error for zero bitrate', () => {
      expect(() => calculateFrameSize(0, 44100, false)).toThrow(ParseError);
      expect(() => calculateFrameSize(0, 44100, false)).toThrow(
        'Invalid bitrate or sample rate'
      );
    });

    it('should throw error for zero sample rate', () => {
      expect(() => calculateFrameSize(128, 0, false)).toThrow(ParseError);
    });

    it('should handle different bitrates correctly', () => {
      const sampleRate = 44100;
      const testCases = [
        { bitrate: 32, expected: 104 }, // (144 * 32 * 1000) / 44100 = 104.21...
        { bitrate: 192, expected: 626 }, // (144 * 192 * 1000) / 44100 = 626.93...
        { bitrate: 320, expected: 1044 }, // (144 * 320 * 1000) / 44100 = 1044.89...
      ];

      testCases.forEach(({ bitrate, expected }) => {
        const frameSize = calculateFrameSize(bitrate, sampleRate, false);
        expect(frameSize).toBe(expected);
      });
    });
  });

  describe('isXingLameHeader', () => {
    it('should return false for regular audio frame', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);

      const result = isXingLameHeader(frame, 0, header, frameSize);

      expect(result).toBe(false);
    });

    it('should return true for Xing header frame', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);

      // Calculate position where Xing identifier should be
      const sideInfoSize = header.channelMode === 0b11 ? 17 : 32;
      const crcSize = header.hasCrc ? 2 : 0;
      const identifierOffset = 4 + crcSize + sideInfoSize;

      // Write "Xing" at the identifier position
      frame.write('Xing', identifierOffset, 'ascii');

      const result = isXingLameHeader(frame, 0, header, frameSize);

      expect(result).toBe(true);
    });

    it('should return true for Info header frame', () => {
      const header = createDefaultFrameHeader();
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);

      // Calculate position where Info identifier should be
      const sideInfoSize = header.channelMode === 0b11 ? 17 : 32;
      const crcSize = header.hasCrc ? 2 : 0;
      const identifierOffset = 4 + crcSize + sideInfoSize;

      // Write "Info" at the identifier position
      frame.write('Info', identifierOffset, 'ascii');

      const result = isXingLameHeader(frame, 0, header, frameSize);

      expect(result).toBe(true);
    });

    it('should return false when identifier position is out of frame bounds', () => {
      const header = createDefaultFrameHeader();
      const frameSize = 10; // Very small frame
      const frame = createMP3Frame(header, frameSize);

      const result = isXingLameHeader(frame, 0, header, frameSize);

      expect(result).toBe(false);
    });

    it('should handle mono channel mode correctly', () => {
      const header = {
        ...createDefaultFrameHeader(),
        channelMode: 3, // Mono
      };
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);

      // For mono, side info is 17 bytes
      const crcSize = header.hasCrc ? 2 : 0;
      const identifierOffset = 4 + crcSize + 17;
      frame.write('Xing', identifierOffset, 'ascii');

      const result = isXingLameHeader(frame, 0, header, frameSize);

      expect(result).toBe(true);
    });

    it('should handle frame with CRC correctly', () => {
      const header = {
        ...createDefaultFrameHeader(),
        hasCrc: true, // CRC present
      };
      const frameSize = calculateFrameSize(128, 44100, false);
      const frame = createMP3Frame(header, frameSize);

      // With CRC, side info offset is 4 + 2 (CRC) + sideInfoSize
      const sideInfoSize = header.channelMode === 0b11 ? 17 : 32;
      const identifierOffset = 4 + 2 + sideInfoSize;
      frame.write('Xing', identifierOffset, 'ascii');

      const result = isXingLameHeader(frame, 0, header, frameSize);

      expect(result).toBe(true);
    });
  });
});
