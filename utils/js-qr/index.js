/**
 * JavaScript QR Code Generator
 * Ported from rsc.io/qr Go library
 */

import { NumericEncoding, AlphanumericEncoding, ByteEncoding, Bits } from './encoding.js';
import { Version, findMinimalVersion } from './version.js';
import { QRMatrix, MaskPatterns } from './matrix.js';
import { qrReedSolomon } from './gf256.js';

// Error correction levels
export const Level = {
  L: 0, // 20% redundant
  M: 1, // 38% redundant
  Q: 2, // 55% redundant
  H: 3  // 65% redundant
};

// QR Code class
export class QRCode {
  constructor(bitmap, size, stride, scale = 8) {
    this.bitmap = bitmap; // 1 is black, 0 is white
    this.size = size;    // number of pixels on a side
    this.stride = stride; // number of bytes per row
    this.scale = scale;  // number of image pixels per QR pixel
  }

  // Check if pixel at (x,y) is black
  isBlack(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return false;
    }
    const byteIndex = y * this.stride + Math.floor(x / 8);
    const bitIndex = 7 - (x % 8);
    return (this.bitmap[byteIndex] & (1 << bitIndex)) !== 0;
  }

  // Convert to 2D array for easier processing
  toMatrix() {
    const matrix = [];
    for (let y = 0; y < this.size; y++) {
      const row = [];
      for (let x = 0; x < this.size; x++) {
        row.push(this.isBlack(x, y) ? 1 : 0);
      }
      matrix.push(row);
    }
    return matrix;
  }

  // Get data URL for rendering (browser environment)
  toDataURL() {
    if (typeof document === 'undefined') {
      throw new Error('toDataURL() requires browser environment');
    }

    const canvas = document.createElement('canvas');
    const pixelSize = this.scale;
    canvas.width = this.size * pixelSize;
    canvas.height = this.size * pixelSize;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.isBlack(x, y)) {
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    return canvas.toDataURL();
  }
}

// Main encode function
export function encode(text, level = Level.L) {
  // Pick data encoding, smallest first
  let encoding;
  if (NumericEncoding.canEncode(text)) {
    encoding = new NumericEncoding(text);
  } else if (AlphanumericEncoding.canEncode(text)) {
    encoding = new AlphanumericEncoding(text);
  } else {
    encoding = new ByteEncoding(text);
  }

  // Calculate required bits
  const dataBits = encoding.getBits(40); // Worst case version
  const version = findMinimalVersion(dataBits, level);

  const versionObj = new Version(version);
  const availableBits = versionObj.getDataBytes(level) * 8;

  if (dataBits > availableBits) {
    throw new Error('Text too long to encode as QR');
  }

  // Encode the data
  const bits = new Bits();
  encoding.encode(bits, version);

  // Add terminator
  const remainingBits = availableBits - bits.getBits();
  const terminatorBits = Math.min(4, remainingBits);
  bits.write(0, terminatorBits);

  // Pad to byte boundary
  const padBits = (8 - (bits.getBits() % 8)) % 8;
  bits.write(0, padBits);

  // Add padding bytes
  while (bits.getBits() < availableBits * 8) {
    bits.write(0x00, 8);
  }

  // Get data bytes
  const dataBytes = bits.getBytes();

  // Apply Reed-Solomon error correction
  const levelInfo = versionObj.data.levels[level];
  const checkBytes = qrReedSolomon.encode(
    dataBytes.slice(0, dataBytes.length - levelInfo.nblock * levelInfo.check),
    levelInfo.check
  );

  // Combine data and check bytes
  const codewords = new Uint8Array(dataBytes.length + checkBytes.length);
  codewords.set(dataBytes);
  codewords.set(checkBytes, dataBytes.length);

  // Build QR matrix
  const matrix = buildCompleteQRMatrix(version, level, codewords);

  return new QRCode(
    matrixToBitmap(matrix),
    matrix.length,
    Math.ceil(matrix.length / 8)
  );
}

// Build complete QR matrix with all patterns and data
function buildCompleteQRMatrix(version, level, codewords) {
  // Create matrix structure
  const qrMatrix = new QRMatrix(version);
  const matrix = qrMatrix.build();

  // Place data bits in zigzag pattern
  const size = 4 * version + 17;
  let bitIndex = 0;

  // Zigzag pattern for placing data
  for (let x = size - 1; x >= 0; x -= 2) {
    if (x === 6) x--; // Skip timing pattern column

    for (let dir = -1; dir <= 1; dir += 2) {
      for (let y = (dir === -1 ? size - 1 : 0); y >= 0 && y < size; y += dir) {
        if (bitIndex >= codewords.length * 8) break;

        for (let col = x; col >= x - 1 && col >= 0; col--) {
          if (col === 6) continue; // Skip timing pattern column

          if (matrix[y][col].type === 0 && matrix[y][col].maskable) {
            const bit = (codewords[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1;
            matrix[y][col].value = bit;
            bitIndex++;
          }
        }
      }
    }
  }

  // Apply best mask pattern (simplified - using pattern 0)
  qrMatrix.applyMask(MaskPatterns[0]);

  // Return value matrix
  return matrix.map(row => row.map(pixel => pixel.value));
}

// Convert matrix to bitmap (byte array)
function matrixToBitmap(matrix) {
  const size = matrix.length;
  const stride = Math.ceil(size / 8);
  const bitmap = new Array(stride * size).fill(0);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix[y][x] === 1) {
        const byteIndex = y * stride + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        bitmap[byteIndex] |= (1 << bitIndex);
      }
    }
  }

  return new Uint8Array(bitmap);
}