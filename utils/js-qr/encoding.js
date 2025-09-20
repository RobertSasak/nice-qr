/**
 * QR Code Data Encoding Schemes
 */

// Bit manipulation helper
export class Bits {
  constructor() {
    this.bytes = [];
    this.bitCount = 0;
  }

  reset() {
    this.bytes = [];
    this.bitCount = 0;
  }

  getBits() {
    return this.bitCount;
  }

  getBytes() {
    if (this.bitCount % 8 !== 0) {
      throw new Error('Fractional byte not allowed');
    }
    return new Uint8Array(this.bytes);
  }

  appendBytes(data) {
    if (this.bitCount % 8 !== 0) {
      throw new Error('Cannot append bytes at non-byte boundary');
    }
    this.bytes.push(...data);
    this.bitCount += 8 * data.length;
  }

  write(value, bitCount) {
    while (bitCount > 0) {
      const bitsToWrite = Math.min(bitCount, 8);

      if (this.bitCount % 8 === 0) {
        this.bytes.push(0);
      }

      const currentByte = this.bytes[this.bytes.length - 1];
      const bitsUsed = this.bitCount % 8;
      const bitsAvailable = 8 - bitsUsed;
      const actualBits = Math.min(bitsToWrite, bitsAvailable);

      const mask = (1 << actualBits) - 1;
      const shiftedValue = (value >> (bitCount - actualBits)) & mask;

      this.bytes[this.bytes.length - 1] = currentByte | (shiftedValue << (bitsAvailable - actualBits));

      this.bitCount += actualBits;
      bitCount -= actualBits;
    }
  }
}

// Abstract base encoding class
export class Encoding {
  constructor(text) {
    this.text = text;
  }

  // Check if text can be encoded with this encoding
  static canEncode(text) {
    throw new Error('Must implement canEncode');
  }

  // Get number of bits needed for encoding
  getBits(version) {
    throw new Error('Must implement getBits');
  }

  // Encode the text into bits
  encode(bits, version) {
    throw new Error('Must implement encode');
  }

  // Check if encoding is valid
  check() {
    return null; // No error
  }
}

// Numeric encoding (digits 0-9 only)
export class NumericEncoding extends Encoding {
  static canEncode(text) {
    return /^[0-9]*$/.test(text);
  }

  getBits(version) {
    // Mode indicator (4 bits) + character count (10 bits for version 1-9)
    const modeBits = 4;
    const charCountBits = version <= 9 ? 10 : version <= 26 ? 12 : 14;

    // Data bits: 3 digits = 10 bits, 2 digits = 7 bits, 1 digit = 4 bits
    const len = this.text.length;
    const groupCount = Math.floor(len / 3);
    const remaining = len % 3;

    let dataBits = groupCount * 10;
    if (remaining === 1) dataBits += 4;
    else if (remaining === 2) dataBits += 7;

    return modeBits + charCountBits + dataBits;
  }

  encode(bits, version) {
    // Write mode indicator (0001 for numeric)
    bits.write(1, 4);

    // Write character count
    const charCountBits = version <= 9 ? 10 : version <= 26 ? 12 : 14;
    bits.write(this.text.length, charCountBits);

    // Write data
    const len = this.text.length;
    for (let i = 0; i < len; i += 3) {
      const group = this.text.slice(i, Math.min(i + 3, len));
      const num = parseInt(group, 10);

      if (group.length === 3) {
        bits.write(num, 10);
      } else if (group.length === 2) {
        bits.write(num, 7);
      } else {
        bits.write(num, 4);
      }
    }
  }
}

// Alphanumeric encoding (45 characters: 0-9, A-Z, space, $%*+-./:)
export class AlphanumericEncoding extends Encoding {
  static ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

  static canEncode(text) {
    return /^[0-9A-Z $%*+-.:/]*$/.test(text.toUpperCase());
  }

  getBits(version) {
    const modeBits = 4;
    const charCountBits = version <= 9 ? 9 : version <= 26 ? 11 : 13;

    // Data bits: 2 characters = 11 bits, 1 character = 6 bits
    const len = this.text.length;
    const groupCount = Math.floor(len / 2);
    const remaining = len % 2;

    let dataBits = groupCount * 11;
    if (remaining === 1) dataBits += 6;

    return modeBits + charCountBits + dataBits;
  }

  encode(bits, version) {
    // Write mode indicator (0010 for alphanumeric)
    bits.write(2, 4);

    // Write character count
    const charCountBits = version <= 9 ? 9 : version <= 26 ? 11 : 13;
    bits.write(this.text.length, charCountBits);

    // Write data
    const len = this.text.length;
    const upperText = this.text.toUpperCase();

    for (let i = 0; i < len; i += 2) {
      if (i + 1 < len) {
        // Two characters
        const c1 = AlphanumericEncoding.ALPHABET.indexOf(upperText[i]);
        const c2 = AlphanumericEncoding.ALPHABET.indexOf(upperText[i + 1]);
        const value = c1 * 45 + c2;
        bits.write(value, 11);
      } else {
        // One character
        const c1 = AlphanumericEncoding.ALPHABET.indexOf(upperText[i]);
        bits.write(c1, 6);
      }
    }
  }
}

// Byte encoding (8-bit data)
export class ByteEncoding extends Encoding {
  static canEncode(text) {
    return true; // Can encode any text
  }

  getBits(version) {
    const modeBits = 4;
    const charCountBits = version <= 9 ? 8 : version <= 26 ? 16 : 16;
    const dataBits = this.text.length * 8;

    return modeBits + charCountBits + dataBits;
  }

  encode(bits, version) {
    // Write mode indicator (0100 for byte)
    bits.write(4, 4);

    // Write character count
    const charCountBits = version <= 9 ? 8 : version <= 26 ? 16 : 16;
    bits.write(this.text.length, charCountBits);

    // Write data as UTF-8 bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(this.text);
    bits.appendBytes(Array.from(data));
  }
}