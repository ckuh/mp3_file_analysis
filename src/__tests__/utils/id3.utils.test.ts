/**
 * Unit tests for id3.utils.ts
 */

import { hasID3v2Tag, getID3v2Size, hasID3v1Tag } from '../../utils/id3.utils';
import {
  createID3v2Header,
  createID3v1Tag,
} from '../test-utils/mp3-buffer-utils';

describe('id3.utils', () => {
  describe('hasID3v2Tag', () => {
    it('should return true for buffer starting with ID3', () => {
      const buffer = Buffer.from('ID3', 'ascii');

      const result = hasID3v2Tag(buffer);

      expect(result).toBe(true);
    });

    it('should return false for buffer not starting with ID3', () => {
      const buffer = Buffer.from('MP3', 'ascii');

      const result = hasID3v2Tag(buffer);

      expect(result).toBe(false);
    });

    it('should return false for buffer too small', () => {
      const buffer = Buffer.from('ID', 'ascii');

      const result = hasID3v2Tag(buffer);

      expect(result).toBe(false);
    });

    it('should return false for empty buffer', () => {
      const buffer = Buffer.alloc(0);

      const result = hasID3v2Tag(buffer);

      expect(result).toBe(false);
    });
  });

  describe('getID3v2Size', () => {
    it('should return correct size for ID3v2 tag', () => {
      const tagSize = 100;
      const header = createID3v2Header(tagSize);
      const buffer = Buffer.concat([header, Buffer.alloc(tagSize)]);

      const result = getID3v2Size(buffer);

      expect(result).toBe(10 + tagSize); // Header (10 bytes) + tag size
    });

    it('should return 0 for buffer too small', () => {
      const buffer = Buffer.alloc(5);

      const result = getID3v2Size(buffer);

      expect(result).toBe(0);
    });

    it('should handle large tag sizes', () => {
      const tagSize = 1000000;
      const header = createID3v2Header(tagSize);
      const buffer = Buffer.concat([header, Buffer.alloc(100)]); // Only allocate small buffer for test

      const result = getID3v2Size(buffer);

      expect(result).toBe(10 + tagSize);
    });

    it('should handle zero tag size', () => {
      const tagSize = 0;
      const header = createID3v2Header(tagSize);
      const buffer = header;

      const result = getID3v2Size(buffer);

      expect(result).toBe(10);
    });
  });

  describe('hasID3v1Tag', () => {
    it('should return true for buffer ending with ID3v1 tag', () => {
      const id3v1Tag = createID3v1Tag();
      const buffer = Buffer.concat([Buffer.alloc(100), id3v1Tag]);

      const result = hasID3v1Tag(buffer);

      expect(result).toBe(true);
    });

    it('should return false for buffer not ending with TAG', () => {
      const buffer = Buffer.alloc(200);

      const result = hasID3v1Tag(buffer);

      expect(result).toBe(false);
    });

    it('should return false for buffer too small', () => {
      const buffer = Buffer.alloc(100);

      const result = hasID3v1Tag(buffer);

      expect(result).toBe(false);
    });

    it('should return false for empty buffer', () => {
      const buffer = Buffer.alloc(0);

      const result = hasID3v1Tag(buffer);

      expect(result).toBe(false);
    });

    it('should return true only if last 128 bytes start with TAG', () => {
      const buffer = Buffer.alloc(200);
      buffer.write('TAG', 50, 'ascii'); // Not in the last 128 bytes

      const result = hasID3v1Tag(buffer);

      expect(result).toBe(false);

      // Now add TAG at the correct position (last 128 bytes = position 72)
      buffer.write('TAG', 200 - 128, 'ascii');

      const result2 = hasID3v1Tag(buffer);

      expect(result2).toBe(true);
    });
  });
});
