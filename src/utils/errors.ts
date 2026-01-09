/**
 * Custom error classes for MP3 parsing
 */

export class InvalidFileError extends Error {
  constructor(message: string = 'Invalid or corrupted file') {
    super(message);
    this.name = 'InvalidFileError';
    Object.setPrototypeOf(this, InvalidFileError.prototype);
  }
}

export class UnsupportedFormatError extends Error {
  constructor(
    message: string = 'File must be MPEG Version 1 Audio Layer 3. Other MPEG formats are not supported.'
  ) {
    super(message);
    this.name = 'UnsupportedFormatError';
    Object.setPrototypeOf(this, UnsupportedFormatError.prototype);
  }
}

export class ParseError extends Error {
  constructor(message: string = 'Failed to parse MP3 file') {
    super(message);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}
