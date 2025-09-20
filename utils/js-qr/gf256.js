/**
 * Galois Field GF(256) Implementation
 * Used for Reed-Solomon error correction in QR codes
 */

export class GF256 {
  constructor(poly, alpha = 2) {
    if (poly < 0x100 || poly >= 0x200 || this.isReducible(poly)) {
      throw new Error(`Invalid polynomial: 0x${poly.toString(16)}`);
    }

    this.poly = poly;
    this.alpha = alpha;
    this.log = new Array(256).fill(0);
    this.exp = new Array(510).fill(0);

    // Build log and exp tables
    let x = 1;
    for (let i = 0; i < 255; i++) {
      if (x === 1 && i !== 0) {
        throw new Error(`Invalid generator ${alpha} for polynomial 0x${poly.toString(16)}`);
      }

      this.exp[i] = x;
      this.exp[i + 255] = x;
      this.log[x] = i;

      x = this.mul(x, alpha, poly);
    }

    this.log[0] = 255;

    // Verify tables
    for (let i = 0; i < 255; i++) {
      if (this.log[this.exp[i]] !== i) {
        throw new Error('Bad log table');
      }
      if (this.log[this.exp[i + 255]] !== i) {
        throw new Error('Bad log table');
      }
    }

    for (let i = 1; i < 256; i++) {
      if (this.exp[this.log[i]] !== i) {
        throw new Error('Bad exp table');
      }
    }
  }

  // Multiplication in GF(256)
  mul(x, y, poly) {
    let z = 0;
    while (x > 0) {
      if (x & 1) {
        z ^= y;
      }
      x >>= 1;
      y <<= 1;
      if (y & 0x100) {
        y ^= poly;
      }
    }
    return z;
  }

  // Check if polynomial is reducible
  isReducible(p) {
    const np = this.bitCount(p);
    for (let q = 2; q < (1 << (np / 2 + 1)); q++) {
      if (this.polyDiv(p, q) === 0) {
        return true;
      }
    }
    return false;
  }

  // Polynomial division
  polyDiv(p, q) {
    let np = this.bitCount(p);
    let nq = this.bitCount(q);

    while (np >= nq) {
      if (p & (1 << (np - 1))) {
        p ^= q << (np - nq);
      }
      np--;
    }

    return p;
  }

  // Count bits
  bitCount(p) {
    let n = 0;
    while (p > 0) {
      p >>= 1;
      n++;
    }
    return n;
  }

  // Add two elements (simple XOR)
  add(x, y) {
    return x ^ y;
  }

  // Multiply two elements using log/exp tables
  multiply(x, y) {
    if (x === 0 || y === 0) {
      return 0;
    }
    return this.exp[this.log[x] + this.log[y]];
  }

  // Divide two elements
  divide(x, y) {
    if (x === 0) {
      return 0;
    }
    if (y === 0) {
      throw new Error('Division by zero in GF(256)');
    }
    return this.exp[this.log[x] - this.log[y] + 255];
  }

  // Get inverse of an element
  inverse(x) {
    if (x === 0) {
      throw new Error('Cannot compute inverse of 0');
    }
    return this.exp[255 - this.log[x]];
  }

  // Exponentiation
  power(x, n) {
    if (x === 0) {
      return 0;
    }
    return this.exp[(this.log[x] * n) % 255];
  }
}

// Reed-Solomon encoder
export class ReedSolomon {
  constructor(field) {
    this.field = field;
  }

  // Generate generator polynomial
  genPoly(ncheck) {
    if (ncheck === 0) {
      return new Uint8Array([1]);
    }

    let g = new Uint8Array([1]);

    for (let i = 0; i < ncheck; i++) {
      const next = new Uint8Array(g.length + 1);
      next[0] = 1;

      for (let j = 0; j < g.length; j++) {
        const c = this.field.multiply(g[j], this.field.exp[i]);
        next[j] ^= c;
        next[j + 1] ^= g[j];
      }

      g = next;
    }

    return g;
  }

  // Encode data with Reed-Solomon error correction
  encode(data, ncheck) {
    const g = this.genPoly(ncheck);
    const len = data.length + ncheck;

    // Create polynomial: data * x^ncheck
    const poly = new Uint8Array(len);
    for (let i = 0; i < data.length; i++) {
      poly[i] = data[i];
    }

    // Compute remainder modulo g
    const rem = new Uint8Array(ncheck).fill(0);

    for (let i = 0; i < data.length; i++) {
      const coef = poly[i];
      if (coef === 0) continue;

      for (let j = 0; j < g.length; j++) {
        rem[i + j] ^= this.field.multiply(g[j], coef);
      }
    }

    // Return check bytes
    return rem;
  }
}

// Standard QR code field (polynomial 0x11d, generator 2)
export const qrField = new GF256(0x11d, 2);

// Standard QR code Reed-Solomon encoder
export const qrReedSolomon = new ReedSolomon(qrField);