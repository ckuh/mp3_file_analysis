/**
 * MP3 Frame Parser - Vanilla TypeScript implementation
 * Only supports MPEG Version 1 Audio Layer 3
 */

import {
  MPEG1_LAYER3_BITRATES,
  MPEG1_SAMPLE_RATES,
  ParserResult,
  FrameHeader,
} from '../types/mp3';
import {
  InvalidFileError,
  UnsupportedFormatError,
  ParseError,
} from '../utils/errors';

/**
 * Checks if the buffer starts with an ID3v2 tag
 * ID3v2 tags start with "ID3"
 */
function hasID3v2Tag(buffer: Buffer): boolean {
  if (buffer.length < 3) {
    return false;
  }
  return buffer.toString('ascii', 0, 3) === 'ID3';
}

/**
 * Reads ID3v2 tag size and returns the offset to skip to
 * ID3v2 header format: "ID3" + version (2 bytes) + flags (1 byte) + size (4 bytes)
 * Size is stored as a 28-bit synchsafe integer
 */
function getID3v2Size(buffer: Buffer): number {
  if (buffer.length < 10) {
    return 0;
  }
  // ID3v2 size is stored in bytes 6-9 as synchsafe integer
  const size =
    (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];
  return 10 + size; // Header (10 bytes) + tag size
}

/**
 * Checks if there's an ID3v1 tag at the end of the buffer
 * ID3v1 tags are exactly 128 bytes and start with "TAG"
 */
function hasID3v1Tag(buffer: Buffer): boolean {
  if (buffer.length < 128) {
    return false;
  }
  const tagStart = buffer.length - 128;
  return buffer.toString('ascii', tagStart, tagStart + 3) === 'TAG';
}

/**
 * Checks if a frame at the given position is a Xing/LAME header frame
 * These are metadata frames that appear at the beginning of VBR MP3 files
 * and should not be counted as audio frames
 */
function isXingLameHeader(
  buffer: Buffer,
  position: number,
  header: FrameHeader,
  frameSize: number
): boolean {
  // MPEG-1 Layer III: side info size depends on channel mode
  const sideInfoSize = header.channelMode === 0b11 ? 17 : 32; // 3=mono, else stereo-ish

  // CRC is present when protectionBit == 0 (your hasCrc === true)
  const crcSize = header.hasCrc ? 2 : 0;

  const identifierOffset = position + 4 + crcSize + sideInfoSize;

  // Don't read past the end of THIS frame
  const frameEnd = position + frameSize;
  if (identifierOffset + 4 > frameEnd) return false;

  const identifier = buffer.toString(
    'ascii',
    identifierOffset,
    identifierOffset + 4
  );
  return identifier === 'Xing' || identifier === 'Info';
}

/**
 * Extracts MPEG frame header from buffer at given position
 *
 * MPEG frame header format (4 bytes):
 *   b0: 0xFF (sync byte)
 *   b1: sync bits (bits 7-5: 0xE0) | versionId (bits 4-3) | layer (bits 2-1) | protection (bit 0)
 *   b2: bitrateIndex (bits 7-4) | sampleRateIndex (bits 3-2) | padding (bit 1) | private (bit 0)
 *   b3: channel mode and other flags
 *
 * @param buffer - Buffer containing MP3 data
 * @param position - Byte position to start reading from
 * @returns FrameHeader object if sync word is valid, null otherwise
 */
function extractFrameHeader(
  buffer: Buffer,
  position: number
): FrameHeader | null {
  // Ensure we have at least 4 bytes to read
  if (position + 4 > buffer.length) {
    return null;
  }

  const b0 = buffer[position];
  const b1 = buffer[position + 1];
  const b2 = buffer[position + 2];
  const b3 = buffer[position + 3];

  // Sync word validation: b0 must be 0xFF and b1 bits 7-5 must be 0xE0 (bits 11-9 globally)
  if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) {
    return null;
  }

  // Extract versionId from b1 bits 4-3 (bits 12-11 globally)
  // 0 = MPEG-2.5, 1 = reserved, 2 = MPEG-2, 3 = MPEG-1
  const versionId = (b1 & 0x18) >> 3;

  // Extract layer from b1 bits 2-1 (bits 10-9 globally)
  // 0 = reserved, 1 = Layer III, 2 = Layer II, 3 = Layer I
  const layer = (b1 & 0x06) >> 1;

  // Extract bitrateIndex from b2 bits 7-4 (bits 19-16 globally)
  const bitrateIndex = (b2 & 0xf0) >> 4;

  // Extract sampleRateIndex from b2 bits 3-2 (bits 21-20 globally)
  const sampleRateIndex = (b2 & 0x0c) >> 2;

  // Extract padding bit from b2 bit 1 (bit 22 globally)
  // 0 = no padding, 1 = padding byte present
  const paddingBit = (b2 & 0x02) >> 1;

  // Extract CRC protection from b1 bit 0 (bit 8 globally)
  // 0 = CRC present (16-bit CRC follows header), 1 = no CRC
  const hasCrc = (b1 & 0x01) === 0;

  // Extract channel mode from b3 bits 24-25 (bits 30-29 globally)
  // 0 = stereo, 1 = joint stereo, 2 = dual channel, 3 = mono
  const channelMode = (b3 & 0xc0) >> 6;

  return {
    bitrateIndex,
    channelMode,
    hasCrc,
    layer,
    paddingBit,
    sampleRateIndex,
    versionId,
  };
}

/**
 * Validates that the frame header is MPEG Version 1 Layer 3
 * Throws UnsupportedFormatError if validation fails
 */
function validateFrameHeader(header: FrameHeader): void {
  // Validate MPEG version: Only accept MPEG-1 (versionId === 3)
  if (header.versionId !== 3) {
    throw new UnsupportedFormatError(
      `Unsupported MPEG version: ${header.versionId}. Only MPEG Version 1 is supported.`
    );
  }

  // Validate layer: Only accept Layer III (layer === 1)
  if (header.layer !== 1) {
    throw new UnsupportedFormatError(
      `Unsupported MPEG layer: ${header.layer}. Only Layer 3 is supported.`
    );
  }

  // Validate bitrate index: Reject reserved/invalid indices (0 and 15)
  if (header.bitrateIndex === 0 || header.bitrateIndex === 15) {
    throw new UnsupportedFormatError(
      `Invalid bitrate index: ${header.bitrateIndex}. Index must be between 1 and 14.`
    );
  }

  // Validate sample rate index: Reject reserved index (3)
  if (header.sampleRateIndex === 3) {
    throw new UnsupportedFormatError(
      `Invalid sample rate index: ${header.sampleRateIndex}. Index must be 0, 1, or 2.`
    );
  }
}

/**
 * Calculates frame size in bytes
 * Formula: (144 * bitrate * 1000) / sampleRate + padding
 * Note: This formula gives the total frame size INCLUDING the 4-byte header
 */
function calculateFrameSize(
  bitrate: number,
  sampleRate: number,
  padding: boolean
): number {
  if (bitrate === 0 || sampleRate === 0)
    throw new ParseError('Invalid bitrate or sample rate in frame header');

  // Formula already includes the 4-byte header
  const frameSize =
    Math.floor((144 * bitrate * 1000) / sampleRate) + (padding ? 1 : 0);
  return frameSize;
}

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
