/**
 * Test utilities for creating mock MP3 buffers
 * These utilities help create valid MP3 frame headers for testing
 */

import { FrameHeader } from '../../types/mp3';

/**
 * Creates a valid MPEG-1 Layer 3 frame header buffer (4 bytes)
 * @param header - Frame header data
 * @returns Buffer containing the frame header
 */
export function createFrameHeader(header: FrameHeader): Buffer {
  const buffer = Buffer.alloc(4);

  // Byte 0: Sync byte (0xFF)
  buffer[0] = 0xff;

  // Byte 1: Sync bits (0xE0) | versionId (bits 4-3) | layer (bits 2-1) | protection (bit 0)
  buffer[1] =
    0xe0 |
    (header.versionId << 3) |
    (header.layer << 1) |
    (header.hasCrc ? 0 : 1);

  // Byte 2: bitrateIndex (bits 7-4) | sampleRateIndex (bits 3-2) | padding (bit 1) | private (bit 0)
  buffer[2] =
    (header.bitrateIndex << 4) |
    (header.sampleRateIndex << 2) |
    (header.paddingBit << 1);

  // Byte 3: channel mode and other flags (we'll just set channel mode)
  buffer[3] = header.channelMode << 6;

  return buffer;
}

/**
 * Creates a valid MPEG-1 Layer 3 frame with header and dummy data
 * @param header - Frame header data
 * @param frameSize - Total frame size (including header)
 * @returns Buffer containing the complete frame
 */
export function createMP3Frame(header: FrameHeader, frameSize: number): Buffer {
  const frameHeader = createFrameHeader(header);
  const frame = Buffer.alloc(frameSize);
  frameHeader.copy(frame, 0);
  // Fill rest with dummy data (0x00)
  return frame;
}

/**
 * Creates an ID3v2 tag header
 * @param tagSize - Size of the ID3v2 tag data (not including 10-byte header)
 * @returns Buffer containing ID3v2 header
 */
export function createID3v2Header(tagSize: number): Buffer {
  const buffer = Buffer.alloc(10);
  buffer.write('ID3', 0, 'ascii');
  buffer[3] = 0x03; // Version 3
  buffer[4] = 0x00; // Revision
  buffer[5] = 0x00; // Flags
  // Size as synchsafe integer (28 bits)
  buffer[6] = (tagSize >> 21) & 0x7f;
  buffer[7] = (tagSize >> 14) & 0x7f;
  buffer[8] = (tagSize >> 7) & 0x7f;
  buffer[9] = tagSize & 0x7f;
  return buffer;
}

/**
 * Creates an ID3v1 tag (128 bytes)
 * @returns Buffer containing ID3v1 tag
 */
export function createID3v1Tag(): Buffer {
  const buffer = Buffer.alloc(128);
  buffer.write('TAG', 0, 'ascii');
  // Rest is filled with zeros
  return buffer;
}

/**
 * Creates a simple valid MPEG-1 Layer 3 frame header for testing
 * Default values: 128 kbps, 44100 Hz, stereo, no padding, no CRC
 */
export function createDefaultFrameHeader(): FrameHeader {
  return {
    versionId: 3, // MPEG-1
    layer: 1, // Layer 3
    bitrateIndex: 9, // 128 kbps
    sampleRateIndex: 0, // 44100 Hz
    paddingBit: 0, // No padding
    hasCrc: false, // No CRC
    channelMode: 0, // Stereo
  };
}
