/**
 * QR Version Management
 * Handles version selection and data capacity calculations
 */

// Version table - simplified version for now
// In a complete implementation, this would contain all 40 versions
export const VERSION_TABLE = [
  // Version 1
  {
    version: 1,
    size: 21,
    alignment: [],
    totalBytes: 26,
    levels: [
      { nblock: 1, check: 7 }, // Level L
      { nblock: 1, check: 10 }, // Level M
      { nblock: 1, check: 13 }, // Level Q
      { nblock: 1, check: 17 }  // Level H
    ]
  },
  // Version 2
  {
    version: 2,
    size: 25,
    alignment: [18, 22],
    totalBytes: 44,
    levels: [
      { nblock: 1, check: 10 },
      { nblock: 1, check: 16 },
      { nblock: 1, check: 20 },
      { nblock: 1, check: 26 }
    ]
  },
  // Version 3
  {
    version: 3,
    size: 29,
    alignment: [22, 26],
    totalBytes: 70,
    levels: [
      { nblock: 1, check: 15 },
      { nblock: 1, check: 26 },
      { nblock: 2, check: 18 }, // 2 blocks, 18 check bytes each
      { nblock: 2, check: 22 }
    ]
  },
  // Version 4
  {
    version: 4,
    size: 33,
    alignment: [26, 30],
    totalBytes: 100,
    levels: [
      { nblock: 1, check: 20 },
      { nblock: 2, check: 18 },
      { nblock: 2, check: 26 },
      { nblock: 4, check: 16 }
    ]
  }
];

export class Version {
  constructor(version) {
    if (version < 1 || version > VERSION_TABLE.length) {
      throw new Error(`Invalid version: ${version}`);
    }
    this.version = version;
    this.data = VERSION_TABLE[version - 1];
  }

  get size() {
    return this.data.size;
  }

  get alignmentPositions() {
    return this.data.alignment;
  }

  // Get total bytes available for this version
  get totalBytes() {
    return this.data.totalBytes;
  }

  // Get data bytes available (total - error correction bytes)
  getDataBytes(level) {
    const levelData = this.data.levels[level];
    const ecBlocks = levelData.nblock * levelData.check;
    return this.data.totalBytes - ecBlocks;
  }

  // Get character count bits for encoding mode and version
  getCharCountBits(mode) {
    const version = this.version;
    if (version <= 9) {
      switch (mode) {
        case 1: return 10; // Numeric
        case 2: return 9;  // Alphanumeric
        case 4: return 8;  // Byte
        default: return 0;
      }
    } else if (version <= 26) {
      switch (mode) {
        case 1: return 12; // Numeric
        case 2: return 11; // Alphanumeric
        case 4: return 16; // Byte
        default: return 0;
      }
    } else {
      switch (mode) {
        case 1: return 14; // Numeric
        case 2: return 13; // Alphanumeric
        case 4: return 16; // Byte
        default: return 0;
      }
    }
  }

  // Static helper method
  static getDataBytes(version, level) {
    const v = new Version(version);
    return v.getDataBytes(level);
  }

  // Get version information bits (for versions 7+)
  getVersionInfo() {
    if (this.version < 7) {
      return null;
    }

    // Version information: 6-bit version number with BCH encoding
    let versionBits = this.version;
    let info = versionBits << 12;

    // BCH encoding for error correction
    for (let i = 0; i < 6; i++) {
      if (info & (1 << (17 - i))) {
        info ^= 0b1111100100101;
      }
    }

    return info;
  }
}

// Helper functions
export function getVersion(version) {
  return new Version(version);
}

export function getSizeForVersion(version) {
  return 4 * version + 17;
}

export function findMinimalVersion(dataBits, level) {
  for (let v = 1; v <= VERSION_TABLE.length; v++) {
    const version = new Version(v);
    const availableBits = version.getDataBytes(level) * 8;

    if (dataBits <= availableBits) {
      return v;
    }
  }
  throw new Error('Text too long for any QR version');
}