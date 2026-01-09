/**
 * Frame Utilities
 * Functions for calculating frame sizes and detecting special frames
 */

import { FrameHeader } from '../types/mp3';
import { ParseError } from './errors';

/**
 * Calculates frame size in bytes
 * Formula: (144 * bitrate * 1000) / sampleRate + padding
 * Note: This formula gives the total frame size INCLUDING the 4-byte header
 */
export function calculateFrameSize(
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
 * Checks if a frame at the given position is a Xing/LAME header frame
 * These are metadata frames that appear at the beginning of VBR MP3 files
 * and should not be counted as audio frames
 */
export function isXingLameHeader(
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
