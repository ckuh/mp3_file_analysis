/**
 * Files Service
 * Service layer for file operations
 * Contains main MP3 parsing logic
 * Only supports MPEG Version 1 Audio Layer 3
 */

import {
  MPEG1_LAYER3_BITRATES,
  MPEG1_SAMPLE_RATES,
  ParserResult,
} from '../types/mp3';
import { InvalidFileError } from '../utils/errors';
import { hasID3v1Tag, hasID3v2Tag, getID3v2Size } from '../utils/id3.utils';
import {
  extractFrameHeader,
  validateFrameHeader,
} from '../utils/frame-header.utils';
import { calculateFrameSize, isXingLameHeader } from '../utils/frame.utils';

/**
 * Counts MP3 frames in the buffer
 * Only counts MPEG Version 1 Audio Layer 3 frames
 */
function countMP3Frames(buffer: Buffer): ParserResult {
  if (!buffer || buffer.length < 4)
    throw new InvalidFileError('File is too small or empty');

  let position = 0;
  let frameCount = 0;

  // Skip ID3v2 tag if present
  if (hasID3v2Tag(buffer)) {
    position = getID3v2Size(buffer);
    if (position > buffer.length)
      throw new InvalidFileError('Invalid ID3v2 tag size');
  }

  // Calculate end position: exclude ID3v1 tag if present (last 128 bytes)
  const endPosition = hasID3v1Tag(buffer) ? buffer.length - 128 : buffer.length;

  // Search for frames
  while (position < endPosition - 4) {
    // Look for sync word pattern: 0xFF followed by 0xE0-0xFF
    if (buffer[position] === 0xff && (buffer[position + 1] & 0xe0) === 0xe0) {
      const header = extractFrameHeader(buffer, position);

      if (header) {
        // Validate it's MPEG Version 1 Layer 3
        // Catch validation errors and skip false positives
        try {
          validateFrameHeader(header);
        } catch (error) {
          // Invalid frame header (wrong version, layer, etc.) - skip this position
          position++;
          continue;
        }

        // Get bitrate and sample rate from lookup tables
        const bitrate = MPEG1_LAYER3_BITRATES[header.bitrateIndex];
        const sampleRate = MPEG1_SAMPLE_RATES[header.sampleRateIndex];

        if (
          bitrate === 0 ||
          sampleRate === 0 ||
          bitrate === undefined ||
          sampleRate === undefined
        ) {
          // Invalid bitrate or sample rate index - skip this potential frame
          position++;
          continue;
        }

        // Calculate frame size (paddingBit: 0 = no padding, 1 = padding present)
        const frameSize = calculateFrameSize(
          bitrate,
          sampleRate,
          header.paddingBit === 1
        );

        if (frameSize <= 0 || position + frameSize > buffer.length) {
          // Invalid frame size or frame extends beyond buffer
          position++;
          continue;
        }

        // Skip Xing/LAME header frames (metadata frames, not audio frames)
        if (isXingLameHeader(buffer, position, header, frameSize)) {
          position += frameSize;
          continue;
        }

        // Valid frame found - increment counter and move to next position
        frameCount++;
        position += frameSize;
      } else {
        // Not a valid frame header, move forward
        position++;
      }
    } else {
      // No sync word found, move forward
      position++;
    }
  }

  if (frameCount === 0)
    throw new InvalidFileError(
      'No valid MPEG Version 1 Audio Layer 3 frames found in file'
    );

  return { frameCount };
}

export default {
  countMP3Frames,
};
