# JavaScript QR Code Generator

A complete JavaScript implementation of QR code generation, ported from the Go library `rsc.io/qr`.

## Features

- **Pure JavaScript**: No external dependencies
- **Complete QR specification**: Supports all encoding modes (Numeric, Alphanumeric, Byte)
- **Error correction**: Reed-Solomon encoding with configurable levels (L, M, Q, H)
- **Multiple versions**: Supports QR versions 1-4 (with extensible architecture)
- **First-party implementation**: Full control over the generation process

## Installation

```bash
# Copy the library to your project
cp -r utils/js-qr path/to/your/project/
```

## Usage

### Basic Usage

```javascript
import { encode, Level } from './js-qr/index.js';

// Generate QR code
const qr = encode('Hello, World!', Level.L);

console.log('QR Size:', qr.size);
console.log('QR Stride:', qr.stride);

// Check individual pixels
console.log('Pixel at (0,0) is black:', qr.isBlack(0, 0));

// Get 2D matrix representation
const matrix = qr.toMatrix();
```

### Advanced Usage

```javascript
import { encode, Level, QRCode } from './js-qr/index.js';

// Generate QR code with high error correction
const qr = encode('Important data', Level.H);

// Convert to data URL (browser only)
try {
  const dataURL = qr.toDataURL();
  const img = new Image();
  img.src = dataURL;
  document.body.appendChild(img);
} catch (error) {
  console.log('Data URL not available in this environment');
}
```

### Error Correction Levels

- `Level.L`: ~7% error correction capability
- `Level.M`: ~15% error correction capability
- `Level.Q`: ~25% error correction capability
- `Level.H`: ~30% error correction capability

## Architecture

The library is organized into several modules:

- **`index.js`**: Main entry point and QR code class
- **`encoding.js`**: Data encoding schemes (Numeric, Alphanumeric, Byte)
- **`gf256.js`**: Galois Field GF(256) mathematics for Reed-Solomon
- **`version.js`**: QR version management and capacity calculations
- **`matrix.js`**: Matrix construction and pattern placement
- **`test.js`**: Test suite and examples

## Implementation Details

### Data Encoding

The library automatically selects the most efficient encoding mode:

1. **Numeric**: Digits 0-9 (most efficient)
2. **Alphanumeric**: 45 characters including A-Z, space, and symbols
3. **Byte**: Any UTF-8 data (least efficient)

### Error Correction

Uses Reed-Solomon encoding with the standard QR code polynomial (0x11d) and generator (2).

### Matrix Construction

Follows the QR code specification for:
- Position detection patterns
- Alignment patterns
- Timing patterns
- Format and version information
- Data placement with zigzag pattern

## Limitations

- Currently supports QR versions 1-4 (can be extended)
- Simplified mask pattern selection (always uses pattern 0)
- No advanced features like micro QR codes or QR art
- Data URL generation requires browser environment

## Testing

```javascript
import { runTests } from './js-qr/test.js';

runTests();
```

## License

This implementation is based on the Go QR code library by Russ Cox and follows the same BSD-style license.