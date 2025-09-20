/**
 * Test the QR code generator
 */

import { encode, QRCode, Level } from './index.js';
import { NumericEncoding, AlphanumericEncoding, ByteEncoding } from './encoding.js';
import { GF256, ReedSolomon } from './gf256.js';
import { Version } from './version.js';
import { QRMatrix, MaskPatterns } from './matrix.js';

// Test encoding detection
function testEncodingDetection() {
  console.log('Testing encoding detection...');

  const numeric = '1234567890';
  const alpha = 'HELLO WORLD';
  const mixed = 'Hello World 123!';

  console.log('Numeric:', NumericEncoding.canEncode(numeric));
  console.log('Alphanumeric:', AlphanumericEncoding.canEncode(alpha));
  console.log('Mixed (should use byte):', ByteEncoding.canEncode(mixed));
}

// Test version management
function testVersionManagement() {
  console.log('Testing version management...');

  const version = new Version(1);
  console.log('Version 1 size:', version.size);
  console.log('Version 1 data bytes (L):', version.getDataBytes(Level.L));
  console.log('Version 1 char count bits (numeric):', version.getCharCountBits(1));
}

// Test GF256 operations
function testGF256() {
  console.log('Testing GF256 operations...');

  const field = new GF256(0x11d, 2);

  console.log('Multiply 3 * 5:', field.multiply(3, 5));
  console.log('Divide 15 / 3:', field.divide(15, 3));
  console.log('Inverse of 3:', field.inverse(3));
  console.log('Power 3^2:', field.power(3, 2));

  // Test Reed-Solomon
  const rs = new ReedSolomon(field);
  const data = new Uint8Array([1, 2, 3, 4]);
  const check = rs.encode(data, 2);
  console.log('Reed-Solomon check bytes:', check);
}

// Test matrix construction
function testMatrixConstruction() {
  console.log('Testing matrix construction...');

  const matrix = new QRMatrix(1);
  const built = matrix.build();

  console.log('Matrix size:', built.length);
  console.log('Position pattern at (0,0):', built[0][0].type);
  console.log('Timing pattern at (8,6):', built[6][8].type);
}

// Test QR code generation
function testQRGeneration() {
  console.log('Testing QR code generation...');

  try {
    const qr = encode('HELLO', Level.L);
    console.log('QR code generated successfully');
    console.log('Size:', qr.size);
    console.log('Stride:', qr.stride);
    console.log('First few pixels:');
    for (let y = 0; y < 5; y++) {
      const row = [];
      for (let x = 0; x < 5; x++) {
        row.push(qr.isBlack(x, y) ? '█' : '·');
      }
      console.log(row.join(' '));
    }
  } catch (error) {
    console.log('Error generating QR code:', error.message);
  }
}

// Run all tests
function runTests() {
  console.log('=== QR Code Generator Tests ===\n');

  testEncodingDetection();
  console.log();

  testVersionManagement();
  console.log();

  testGF256();
  console.log();

  testMatrixConstruction();
  console.log();

  testQRGeneration();
  console.log();

  console.log('=== Tests Complete ===');
}

// Export tests
export { runTests };

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}