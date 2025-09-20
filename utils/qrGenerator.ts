import { encode, Level } from './js-qr/index.js'

export interface QRCodeResult {
  data: string
  size: number
  matrix: number[][]
  generated: boolean
}

export function generateQRCode(url: string): QRCodeResult {
  // First-party QR code generation function
  console.log('Generating QR code for URL:', url)

  try {
    // Generate QR code using our JavaScript implementation
    const qr = encode(url, Level.L)

    // Get the matrix representation
    const matrix = qr.toMatrix()

    return {
      data: url,
      size: qr.size,
      matrix,
      generated: true
    }
  } catch (error) {
    console.error('Error generating QR code:', error)
    return {
      data: url,
      size: 0,
      matrix: [],
      generated: false
    }
  }
}

// Default export for easier importing
export default generateQRCode