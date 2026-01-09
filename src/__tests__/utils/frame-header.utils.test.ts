/**
 * Unit tests for frame-header.utils.ts
 */

import {
  extractFrameHeader,
  validateFrameHeader,
} from '../../utils/frame-header.utils';
import { UnsupportedFormatError } from '../../utils/errors';
import {
  createFrameHeader,
  createDefaultFrameHeader,
} from '../test-utils/mp3-buffer-utils';

describe('frame-header.utils', () => {
  describe('extractFrameHeader', () => {
    it('should extract valid MPEG-1 Layer 3 frame header', () => {
      const header = createDefaultFrameHeader();
      const buffer = createFrameHeader(header);

      const result = extractFrameHeader(buffer, 0);

      expect(result).not.toBeNull();
      expect(result).toEqual(header);
    });

    it('should return null for invalid sync word', () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);

      const result = extractFrameHeader(buffer, 0);

      expect(result).toBeNull();
    });

    it('should return null when buffer is too small', () => {
      const buffer = Buffer.from([0xff, 0xe0]);

      const result = extractFrameHeader(buffer, 0);

      expect(result).toBeNull();
    });

    it('should return null when position is out of bounds', () => {
      const header = createDefaultFrameHeader();
      const buffer = createFrameHeader(header);

      const result = extractFrameHeader(buffer, 100);

      expect(result).toBeNull();
    });

    it('should extract header with CRC protection', () => {
      const header = {
        ...createDefaultFrameHeader(),
        hasCrc: true,
      };
      const buffer = createFrameHeader(header);

      const result = extractFrameHeader(buffer, 0);

      expect(result).not.toBeNull();
      expect(result?.hasCrc).toBe(true);
    });

    it('should extract header with padding', () => {
      const header = {
        ...createDefaultFrameHeader(),
        paddingBit: 1,
      };
      const buffer = createFrameHeader(header);

      const result = extractFrameHeader(buffer, 0);

      expect(result).not.toBeNull();
      expect(result?.paddingBit).toBe(1);
    });

    it('should extract header with different channel modes', () => {
      const modes = [0, 1, 2, 3]; // stereo, joint stereo, dual channel, mono

      modes.forEach((mode) => {
        const header = {
          ...createDefaultFrameHeader(),
          channelMode: mode,
        };
        const buffer = createFrameHeader(header);

        const result = extractFrameHeader(buffer, 0);

        expect(result).not.toBeNull();
        expect(result?.channelMode).toBe(mode);
      });
    });
  });

  describe('validateFrameHeader', () => {
    it('should not throw for valid MPEG-1 Layer 3 header', () => {
      const header = createDefaultFrameHeader();

      expect(() => validateFrameHeader(header)).not.toThrow();
    });

    it('should throw for MPEG-2.5 (versionId = 0)', () => {
      const header = {
        ...createDefaultFrameHeader(),
        versionId: 0,
      };

      expect(() => validateFrameHeader(header)).toThrow(UnsupportedFormatError);
      expect(() => validateFrameHeader(header)).toThrow(
        'Unsupported MPEG version'
      );
    });

    it('should throw for MPEG-2 (versionId = 2)', () => {
      const header = {
        ...createDefaultFrameHeader(),
        versionId: 2,
      };

      expect(() => validateFrameHeader(header)).toThrow(UnsupportedFormatError);
    });

    it('should throw for Layer 1 (layer = 3)', () => {
      const header = {
        ...createDefaultFrameHeader(),
        layer: 3,
      };

      expect(() => validateFrameHeader(header)).toThrow(UnsupportedFormatError);
      expect(() => validateFrameHeader(header)).toThrow(
        'Unsupported MPEG layer'
      );
    });

    it('should throw for Layer 2 (layer = 2)', () => {
      const header = {
        ...createDefaultFrameHeader(),
        layer: 2,
      };

      expect(() => validateFrameHeader(header)).toThrow(UnsupportedFormatError);
    });

    it('should throw for invalid bitrate index 0', () => {
      const header = {
        ...createDefaultFrameHeader(),
        bitrateIndex: 0,
      };

      expect(() => validateFrameHeader(header)).toThrow(UnsupportedFormatError);
      expect(() => validateFrameHeader(header)).toThrow(
        'Invalid bitrate index'
      );
    });

    it('should throw for invalid bitrate index 15', () => {
      const header = {
        ...createDefaultFrameHeader(),
        bitrateIndex: 15,
      };

      expect(() => validateFrameHeader(header)).toThrow(UnsupportedFormatError);
    });

    it('should throw for invalid sample rate index 3', () => {
      const header = {
        ...createDefaultFrameHeader(),
        sampleRateIndex: 3,
      };

      expect(() => validateFrameHeader(header)).toThrow(UnsupportedFormatError);
      expect(() => validateFrameHeader(header)).toThrow(
        'Invalid sample rate index'
      );
    });
  });
});
