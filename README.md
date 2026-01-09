# MP3 File Analysis API

A TypeScript Express API that accepts MP3 file uploads and returns the number of frames in the file. The solution manually parses MPEG Version 1 Audio Layer 3 frame headers using vanilla TypeScript (no MP3 parsing libraries).

## Features

- Manual MP3 frame parsing (vanilla TypeScript implementation)
- Only supports MPEG Version 1 Audio Layer 3 files
- Handles ID3v2 tags
- Comprehensive error handling
- Optimized for large files
- Full test coverage

## Setup

1. Install dependencies:
```bash
npm install
```

## Running the Project

### Development Mode (with hot reload)
```bash
npm run dev
```

The server will run on port 3000 by default (configurable via `.env` file).

### Build
```bash
npm run build
```

### Production Mode
```bash
npm start
```

## API Documentation

### POST /file-upload

Accepts an MP3 file upload and returns the number of frames in the file.

**Request:**
- Method: `POST`
- Endpoint: `/file-upload`
- Content-Type: `multipart/form-data`
- Body: Form data with a `file` field containing the MP3 file
- Maximum file size: 25MB

**Response:**
- Status: `200 OK`
- Content-Type: `application/json`
- Body:
```json
{
  "frameCount": 1234
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file type, no file uploaded, or file parsing error
```json
{
  "error": "Error message describing the issue"
}
```

- `500 Internal Server Error` - Unexpected server error
```json
{
  "error": "Internal server error"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/file-upload \
  -F "file=@path/to/your/file.mp3"
```

**Example using JavaScript (fetch):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/file-upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(`Frame count: ${data.frameCount}`);
```

## Format Support

**Supported:**
- MPEG Version 1 Audio Layer 3 (MP3) files

**Not Supported (out of scope):**
- MPEG Version 2 files
- MPEG Version 2.5 files
- MPEG Layer 1 files
- MPEG Layer 2 files
- Other audio formats

Files that are not MPEG Version 1 Audio Layer 3 will be rejected with an appropriate error message.
## Linting and Formatting

### Linting
```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

### Formatting
```bash
# Format code with Prettier
npm run format

# Check if code is formatted
npm run format:check
```

## Project Structure

```
src/
  ├── index.ts                 # Main Express server
  ├── routes/
  │   └── files.routes.ts      # File upload route definitions
  ├── controllers/
  │   └── files.controller.ts  # File upload request/response handlers
  ├── services/
  │   └── files.service.ts     # MP3 frame parsing logic (vanilla TypeScript)
  ├── middlewares/
  │   ├── files.middleware.ts  # Multer middleware for file uploads
  │   └── filesErrorHandler.ts # Error handling middleware for file routes
  ├── types/
  │   └── mp3.ts               # TypeScript type definitions
  └── utils/
      └── errors.ts            # Custom error classes
```

## Implementation Details

- **Vanilla Implementation**: All MP3 frame parsing is done using vanilla TypeScript with Node.js Buffer APIs and bitwise operations. No MP3 parsing libraries are used.
- **Frame Detection**: The parser searches for frame sync words (`0xFFE`) and validates MPEG Version 1 Layer 3 headers.
- **ID3 Tag Handling**: ID3v2 tags at the beginning of files are automatically skipped.
- **Performance**: The parser processes files in a single pass through the buffer, making it efficient for large files.
- **Error Handling**: Comprehensive error handling for invalid files, unsupported formats, and parsing errors.
