import React, { useState } from 'react'
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
  Image,
  StyleSheet,
} from 'react-native'
import { generateQRCode } from '../../utils/qrGenerator'

export default function HomeScreen() {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [qrData, setQrData] = useState<{ size: number; matrix: number[][] } | null>(null)

  const handleGenerate = () => {
    // Generate QR code using our utility function
    const result = generateQRCode(url)

    if (result.generated) {
      console.log('QR code generated successfully!')
      console.log('Size:', result.size)
      console.log('Matrix preview:', result.matrix.slice(0, 5).map(row => row.slice(0, 5)))

      setQrData({
        size: result.size,
        matrix: result.matrix
      })
    } else {
      console.log('Failed to generate QR code')
      setQrData(null)
    }
  }

  // Function to create QR code component from matrix
  const renderQRCode = () => {
    if (!qrData) return null

    const { size, matrix } = qrData
    const pixelSize = 8 // Size of each QR module in pixels
    const qrSize = size * pixelSize

    return (
      <View style={styles.qrContainer}>
        <Text style={styles.qrTitle}>Generated QR Code</Text>
        <View style={[styles.qrCode, { width: qrSize, height: qrSize }]}>
          {matrix.map((row, y) => (
            <View key={y} style={styles.qrRow}>
              {row.map((cell, x) => (
                <View
                  key={`${y}-${x}`}
                  style={[
                    styles.qrPixel,
                    {
                      width: pixelSize,
                      height: pixelSize,
                      backgroundColor: cell === 1 ? 'black' : 'white',
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
        <Text style={styles.qrInfo}>Size: {size}x{size} modules</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: 'center', padding: 24 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          QR code generator
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>URL</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
          placeholder="Enter URL"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Image Description</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            height: 80,
          }}
          placeholder="Describe the image (for accessibility or AI)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Button
          title="Generate QR Code"
          onPress={handleGenerate}
          disabled={!url}
        />

        {renderQRCode()}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  qrContainer: {
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  qrCode: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
  },
  qrRow: {
    flexDirection: 'row',
  },
  qrPixel: {
    borderWidth: 0,
  },
  qrInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
})
