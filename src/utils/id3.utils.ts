/**
 * ID3 Tag Utilities
 * Functions for detecting and skipping ID3v1 and ID3v2 tags in MP3 files
 */

/**
 * Checks if the buffer starts with an ID3v2 tag
 * ID3v2 tags start with "ID3"
 */
export function hasID3v2Tag(buffer: Buffer): boolean {
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
export function getID3v2Size(buffer: Buffer): number {
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
export function hasID3v1Tag(buffer: Buffer): boolean {
  if (buffer.length < 128) {
    return false;
  }
  const tagStart = buffer.length - 128;
  return buffer.toString('ascii', tagStart, tagStart + 3) === 'TAG';
}
