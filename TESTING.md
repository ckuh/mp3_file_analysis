# Testing Guide

This project uses **Jest** as the testing framework for unit tests. The test suite provides comprehensive coverage of the MP3 parsing logic, utilities, services, and controllers.

## Test Setup

### Dependencies

- **jest** - Testing framework
- **ts-jest** - TypeScript support for Jest
- **@types/jest** - TypeScript types for Jest
- **supertest** - HTTP assertion library for testing Express routes
- **@types/supertest** - TypeScript types for supertest

### Configuration

Jest is configured via `jest.config.js`:
- Uses `ts-jest` preset for TypeScript support
- Test files are located in `src/__tests__/` directory
- Test files match pattern: `*.test.ts` or `*.spec.ts`
- Coverage reports are generated in the `coverage/` directory

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
  __tests__/
    ├── test-utils/
    │   └── mp3-buffer-utils.ts    # Utilities for creating mock MP3 buffers
    ├── utils/
    │   ├── frame-header.utils.test.ts
    │   ├── id3.utils.test.ts
    │   └── frame.utils.test.ts
    ├── services/
    │   └── files.service.test.ts
    └── controllers/
        └── files.controller.test.ts
```

## Test Coverage

### Utils Tests (`src/__tests__/utils/`)

**frame-header.utils.test.ts**
- Tests frame header extraction from buffers
- Validates MPEG version and layer checking
- Tests error handling for invalid headers

**id3.utils.test.ts**
- Tests ID3v1 and ID3v2 tag detection
- Tests ID3v2 size calculation
- Tests edge cases (empty buffers, invalid tags)

**frame.utils.test.ts**
- Tests frame size calculation with various bitrates/sample rates
- Tests padding byte handling
- Tests Xing/LAME header detection

### Service Tests (`src/__tests__/services/`)

**files.service.test.ts**
- Tests MP3 frame counting logic
- Tests ID3 tag skipping (both v1 and v2)
- Tests error handling (empty files, invalid formats)
- Tests edge cases (Xing headers, padding, multiple frames)

### Controller Tests (`src/__tests__/controllers/`)

**files.controller.test.ts**
- Tests HTTP endpoint behavior
- Tests file upload handling
- Tests error responses
- Uses `supertest` for HTTP assertions

## Test Utilities

The `src/__tests__/test-utils/mp3-buffer-utils.ts` file provides helper functions for creating mock MP3 data:

- `createFrameHeader()` - Creates a valid MPEG-1 Layer 3 frame header
- `createMP3Frame()` - Creates a complete MP3 frame with header and data
- `createID3v2Header()` - Creates an ID3v2 tag header
- `createID3v1Tag()` - Creates an ID3v1 tag
- `createDefaultFrameHeader()` - Creates a default valid frame header for testing

These utilities allow testing without requiring actual MP3 files.

## Writing New Tests

### Example: Testing a Utility Function

```typescript
import { myFunction } from '../../utils/my-utils';

describe('my-utils', () => {
  describe('myFunction', () => {
    it('should handle valid input', () => {
      const result = myFunction('valid input');
      expect(result).toBe(expectedValue);
    });

    it('should throw error for invalid input', () => {
      expect(() => myFunction('invalid')).toThrow(Error);
    });
  });
});
```

### Example: Testing a Service with Mocks

```typescript
import myService from '../../services/my.service';
import myDependency from '../../utils/my-dependency';

jest.mock('../../utils/my-dependency');

describe('my.service', () => {
  it('should call dependency correctly', () => {
    const mockFn = myDependency.someFunction as jest.MockedFunction<...>;
    mockFn.mockReturnValue('mocked value');

    const result = myService.doSomething();

    expect(mockFn).toHaveBeenCalled();
    expect(result).toBe('expected result');
  });
});
```

## Coverage Goals

The test suite aims for:
- **High coverage** of core parsing logic (utils, services)
- **Integration testing** of HTTP endpoints (controllers)
- **Edge case coverage** for error handling

Run `npm run test:coverage` to see detailed coverage reports.
