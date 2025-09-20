/**
 * QR Matrix Construction
 * Handles placement of patterns, data, and formatting
 */

import { getVersion, findMinimalVersion } from './version.js';

// Pixel types for QR code
export const PixelType = {
  DATA: 0,
  POSITION: 1,
  ALIGNMENT: 2,
  TIMING: 3,
  FORMAT: 4,
  VERSION: 5,
  UNUSED: 6
};

export class QRMatrix {
  constructor(version) {
    this.version = getVersion(version);
    this.size = this.version.size;
    this.matrix = Array(this.size).fill().map(() =>
      Array(this.size).fill().map(() => ({
        type: PixelType.UNUSED,
        value: 0,
        maskable: false
      }))
    );
  }

  // Place position detection patterns (three large squares)
  placePositionPatterns() {
    const positions = [
      [0, 0], // Top-left
      [this.size - 7, 0], // Top-right
      [0, this.size - 7]  // Bottom-left
    ];

    for (const [x, y] of positions) {
      this.drawPositionPattern(x, y);
    }
  }

  // Draw a single position detection pattern
  drawPositionPattern(x, y) {
    // Outer square (7x7 black)
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6) {
          this.setPixel(x + i, y + j, 1, PixelType.POSITION);
        } else if (i === 1 || i === 5 || j === 1 || j === 5) {
          this.setPixel(x + i, y + j, 0, PixelType.POSITION);
        } else {
          this.setPixel(x + i, y + j, 1, PixelType.POSITION);
        }
      }
    }

    // White border
    for (let i = -1; i <= 7; i++) {
      if (this.isValid(x + i, y - 1)) {
        this.setPixel(x + i, y - 1, 0, PixelType.UNUSED);
      }
      if (this.isValid(x + i, y + 7)) {
        this.setPixel(x + i, y + 7, 0, PixelType.UNUSED);
      }
      if (this.isValid(x - 1, y + i)) {
        this.setPixel(x - 1, y + i, 0, PixelType.UNUSED);
      }
      if (this.isValid(x + 7, y + i)) {
        this.setPixel(x + 7, y + i, 0, PixelType.UNUSED);
      }
    }
  }

  // Place alignment patterns (small squares)
  placeAlignmentPatterns() {
    const positions = this.version.alignmentPositions;

    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        // Skip if this would overlap with position patterns
        const x = positions[i];
        const y = positions[j];

        if (this.isOverlapWithPositionPattern(x, y)) {
          continue;
        }

        this.drawAlignmentPattern(x - 2, y - 2);
      }
    }
  }

  // Draw alignment pattern (5x5 square)
  drawAlignmentPattern(x, y) {
    // Center black dot
    this.setPixel(x + 2, y + 2, 1, PixelType.ALIGNMENT);

    // White ring
    for (let i = 1; i <= 3; i++) {
      for (let j = 1; j <= 3; j++) {
        if (i === 1 || i === 3 || j === 1 || j === 3) {
          this.setPixel(x + i, y + j, 1, PixelType.ALIGNMENT);
        }
      }
    }

    // Outer black ring
    for (let i = 0; i <= 4; i++) {
      for (let j = 0; j <= 4; j++) {
        if (i === 0 || i === 4 || j === 0 || j === 4) {
          this.setPixel(x + i, y + j, 1, PixelType.ALIGNMENT);
        }
      }
    }
  }

  // Place timing patterns (alternating lines)
  placeTimingPatterns() {
    // Horizontal timing pattern
    for (let x = 8; x < this.size - 8; x++) {
      if (x % 2 === 0) {
        this.setPixel(x, 6, 1, PixelType.TIMING);
      } else {
        this.setPixel(x, 6, 0, PixelType.TIMING);
      }
    }

    // Vertical timing pattern
    for (let y = 8; y < this.size - 8; y++) {
      if (y % 2 === 0) {
        this.setPixel(6, y, 1, PixelType.TIMING);
      } else {
        this.setPixel(6, y, 0, PixelType.TIMING);
      }
    }
  }

  // Place format information areas
  placeFormatAreas() {
    // Reserve areas for format information
    for (let i = 0; i < 8; i++) {
      // Left column (excluding timing pattern)
      if (i !== 6) {
        this.setPixel(8, i, 0, PixelType.FORMAT);
        this.setPixel(i, 8, 0, PixelType.FORMAT);
      }
    }

    // Right column
    this.setPixel(8, this.size - 1, 0, PixelType.FORMAT);
    this.setPixel(8, this.size - 2, 0, PixelType.FORMAT);

    // Bottom row
    this.setPixel(this.size - 1, 8, 0, PixelType.FORMAT);
    this.setPixel(this.size - 2, 8, 0, PixelType.FORMAT);
  }

  // Place version information areas (for versions 7+)
  placeVersionAreas() {
    if (this.version.version < 7) {
      return;
    }

    // Left side version area
    for (let i = 0; i < 6; i++) {
      for (let j = this.size - 11; j < this.size - 8; j++) {
        this.setPixel(j, i, 0, PixelType.VERSION);
      }
    }

    // Top side version area
    for (let i = 0; i < 6; i++) {
      for (let j = this.size - 11; j < this.size - 8; j++) {
        this.setPixel(i, j, 0, PixelType.VERSION);
      }
    }
  }

  // Mark remaining areas as data areas
  markDataAreas() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.matrix[y][x].type === PixelType.UNUSED) {
          this.setPixel(x, y, 0, PixelType.DATA);
          this.matrix[y][x].maskable = true;
        }
      }
    }
  }

  // Helper methods
  setPixel(x, y, value, type) {
    if (this.isValid(x, y)) {
      this.matrix[y][x] = { value, type, maskable: false };
    }
  }

  isValid(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  isOverlapWithPositionPattern(x, y) {
    // Check if the alignment pattern would overlap with position patterns
    const positionPatterns = [
      [0, 0],
      [this.size - 7, 0],
      [0, this.size - 7]
    ];

    for (const [px, py] of positionPatterns) {
      if (x >= px - 2 && x <= px + 9 && y >= py - 2 && y <= py + 9) {
        return true;
      }
    }

    return false;
  }

  // Build the complete matrix
  build() {
    this.placePositionPatterns();
    this.placeAlignmentPatterns();
    this.placeTimingPatterns();
    this.placeFormatAreas();
    this.placeVersionAreas();
    this.markDataAreas();

    return this.matrix;
  }

  // Get matrix as simple 2D array of values
  toValueMatrix() {
    return this.matrix.map(row => row.map(pixel => pixel.value));
  }

  // Apply mask pattern to data areas
  applyMask(maskFunction) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.matrix[y][x].maskable) {
          const mask = maskFunction(x, y);
          this.matrix[y][x].value ^= mask;
        }
      }
    }
  }
}

// Mask patterns
export const MaskPatterns = {
  0: (x, y) => (x + y) % 2 === 0,
  1: (x, y) => x % 2 === 0,
  2: (x, y) => y % 3 === 0,
  3: (x, y) => (x + y) % 3 === 0,
  4: (x, y) => (Math.floor(x / 2) + Math.floor(y / 3)) % 2 === 0,
  5: (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
  6: (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
  7: (x, y) => ((x * y) % 3 + (x + y) % 2) % 2 === 0
};

// Build complete QR matrix
export function buildQRMatrix(version, level) {
  const matrix = new QRMatrix(version);
  return matrix.build();
}