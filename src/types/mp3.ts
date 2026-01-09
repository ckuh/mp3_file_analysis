/**
 * Type definitions for MP3 frame parsing
 * Only supports MPEG Version 1 Audio Layer 3
 */

/**
 * MPEG Version values in frame header
 */
export enum MPEGVersion {
  VERSION_2_5 = 0,
  RESERVED = 1,
  VERSION_2 = 2,
  VERSION_1 = 3, // Only this version is supported
}

/**
 * MPEG Layer values in frame header
 */
export enum MPEGLayer {
  RESERVED = 0,
  LAYER_3 = 1, // Only this layer is supported
  LAYER_2 = 2,
  LAYER_1 = 3,
}

/**
 * Frame header structure (4 bytes)
 * Only includes fields needed for frame counting
 */
export interface FrameHeader {
  versionId: number; // MPEG version ID (2 bits from b1 bits 4-3)
  layer: number; // Layer ID (2 bits from b1 bits 2-1)
  channelMode: number; // Channel mode (2 bits from b3 bits 24-25)
  bitrateIndex: number; // Bitrate index (4 bits from b2 bits 7-4)
  sampleRateIndex: number; // Sample rate index (2 bits from b2 bits 3-2)
  paddingBit: number; // Padding bit (1 bit from b2 bit 1: 0 or 1)
  hasCrc: boolean; // CRC protection present (1 bit from b1 bit 0: 0 = CRC present, 1 = no CRC)
}

/**
 * Parser result
 */
export interface ParserResult {
  frameCount: number;
}

/**
 * Bitrate lookup table for MPEG-1 Layer 3 (kbps)
 * Index corresponds to bitrate index in frame header
 */
export const MPEG1_LAYER3_BITRATES: readonly number[] = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
] as const;

/**
 * Sample rate lookup table for MPEG-1 (Hz)
 * Index corresponds to sample rate index in frame header
 */
export const MPEG1_SAMPLE_RATES: readonly number[] = [
  44100, 48000, 32000, 0,
] as const;
