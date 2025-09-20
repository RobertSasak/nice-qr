import React, { useState } from 'react'
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native'

export default function HomeScreen() {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [showQR, setShowQR] = useState(false)

  const handleGenerate = () => {
    // Retrieve the URL from state
    console.log('Generated URL:', url)
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
      </View>
    </KeyboardAvoidingView>
  )
}
