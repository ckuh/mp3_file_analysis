/**
 * Frame Header Utilities
 * Functions for extracting and validating MP3 frame headers
 */

import { FrameHeader } from '../types/mp3';
import { UnsupportedFormatError } from './errors';

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
export function extractFrameHeader(
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
export function validateFrameHeader(header: FrameHeader): void {
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
