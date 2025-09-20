import React, { useEffect, useState } from 'react'
import {
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { generateQRCode } from '../../utils/qrGenerator'

import '../wasm_exec.js'

export default function HomeScreen() {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [qrData, setQrData] = useState<{
    size: number
    matrix: number[][]
  } | null>(null)

  useEffect(() => {
    const originalAddEventListener = Element.prototype.addEventListener

    Element.prototype.addEventListener = function (
      eventName: string,
      handler: any
    ) {
      if (this.id !== 'upload-input') {
        originalAddEventListener.apply(this, arguments)
      }
      console.log(`Mocking event listener for ${this.id}`)
      originalAddEventListener.apply(this, [
        eventName,
        (...a) => {
          console.log('File input change event triggered', a)
          // Return a mock image file object
          const mockFile = new File([
            new Uint8Array([
              0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG header
              0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
              0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 px
              0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, // RGBA
              0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
              0x08, 0xd7, 0x63, 0x60, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // minimal data
              0xe2, 0x26, 0x05, 0x9b, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82 // IEND
            ])
          ], 'mock.png', { type: 'image/png' })
          const mockEvent = {
            ...a[0],
            target: {
              ...a[0]?.target,
              files: [mockFile],
            },
          }
          handler.call(this, mockEvent)
          return
        },
      ])
    }

    const go = new (window as any).Go()
    fetch('/main.wasm')
      .then((res) => res.arrayBuffer())
      .then((res) =>
        WebAssembly.instantiate(res, go.importObject).then((result) => {
          go.run(result.instance)
        })
      )
  })

  const handleGenerate = () => {
    // Generate QR code using our utility function
    const result = generateQRCode(url)

    if (result.generated) {
      console.log('QR code generated successfully!')
      console.log('Size:', result.size)
      console.log(
        'Matrix preview:',
        result.matrix.slice(0, 5).map((row) => row.slice(0, 5))
      )

      setQrData({
        size: result.size,
        matrix: result.matrix,
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
        <Text style={styles.qrInfo}>
          Size: {size}x{size} modules
        </Text>
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
      <h1>
        <center>QArt Coder</center>
      </h1>
      <div className="all">
        <div className="article">
          <div id="output">
            <center id="wasm1">
              <div id="err-output"></div>
              <img
                id="img-output"
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYgAAAGIAQAAAABzOEqLAAAAJHRFWHRTb2Z0d2FyZQBRUi1QTkcgaHR0cDovL3FyLnN3dGNoLmNvbS9nj329AAAJg0lEQVR4AWP4TyoY1TGqY1THqI5RHQgdI1cHw/////8zMDAwMDAw/P//n4GBgYGBgYGBgYGBgYGBgeH/f4b//xkY/jMwMDAwMDD8/////6gOWupg+P///3+G///////P8J+BgYHh//////8zMDD8Z/j/n4GBgYHhP8N/hv8M//////+f4f////9HddBSB8P/////M/xnYGD4z/D/P8P//////////z8DAwMDw38GBgaG/wwMDP//M/xnYGD4z/D/////ozpoqYPh/////xn+MzAw/Gf4z/D/////////////PwMDAwMDAwMDAwMDw////xn+MzAw/Gf4/////1EdtNTB8P////8M/xkYGP4z/P////////////////9/BgYGBob/DAwM/xkY/v9n+M/AwPCf4f////9HddBSB8P/////M/z/////f4b/DP///////////////2dgYGBg+P+fgYHhPwPDf4b//////8/w/////6M6aKmD4f////8ZGBgYGBgY/jP8Z/jP8J/hP8N/hv8M/xn+M/xn+M/wn+E/w38GBgYGBgaG/////x/VQUsdDP////////////////////////////////////8ZGBgY/jP8////PwPD/////////////////4/qoKUOhv////9nYGBgYPjPwMDw/////wz///////////8MDP8ZGP4zMPxnYGD4z/Cf4T/D//////8f1UFLHQz/////////fwYGhv////////////////////////8MDAwM/xkY/jMw/GdgYGD4/5/h/////0d10FIHw////////8/AwMDA8P///////////////////////5+B4T8Dw3+G//8Z/jMw/P//////////j+qgpQ6G///////PwMDAwPD/PwMDAwMDw/////////+fgeE/A8P//wz/GRgYGBgYGBj+MzD8/////6gOWupg+P//////DAwMDAwMDP/////PwMDw//9/BgYGBgYGBob///8zMDAwMPz//5+B4T/D/////4/qoKUOhv////9nYGBgYGD4////f4b/DAwMDAwMDAz/////z/CfgYHhPwPDf4b///8z/P/P8P////+jOmipg+H/////GRgYGBgYGP7/Z2D4z8DAwMDAwMDAwMDAwMDwn4Hh/38GBob///////////////+P6qClDob/////Z2BgYGBg+P//PwPDf4b//xn+/2dgYGBgYGD4/5+B4T8DA8N/hv////9n+P//////ozpoqYPh/////xkYGBgYGBj+//////////8Z/v9nYGBgYGD4z8DA8J/hP8P//////////////////x/VQUsdDP/////PwMDAwMDw///////////P8P//fwaG/////2dgYPj/n4GB4T8DAwPD//8MDP////8/qoOWOhj+////n4GBgYHhP8P////////PwPD//38Ghv//////z/CfgYGB4f9/hv//////z8Dw/////6M6aKmD4f//////M/xnYPj/////////MzD8/////38Ghv///////5+BgYHh//////8zMPz/z/D/////ozpoqYPh//////////+f4T/DfwYGBgaG/////////z8DAwPD//8M/xkYGBj+/////z8DAwPD/////4/qoKUOhv//////////f4b///8zMDAw/P///////wz/GRgYGBj+MzAw/P//////////////n+H/////R3XQUgfD/////////5+B4T/D////////z8DAwMDAwMDw//9/hv8MDAwMDP///////z/D/////////39UBy11MPz/////////GRj+/////////////2dgYGBg+P+f4T/D//8MDP////////9/hv//Gf7//////6gOWupg+P////////8zMPxn+P//////////Z2BgYPj//z/D//8M////Z/jP8P//f4b/DAwMDP////8/qoOWOhj+//////////8ZGP7///+fgeH/////////z/CfgeE/A8P//wwMDAwMDAwMDP//MzD8/////6gOWupg+P///////xkYGBgYGP7/Z2BgYGBgYGBg+M/AwPD/P8N/BgYGhv8M//8z/GdgYGD4/////1EdtNTB8P///////zP8Z2D4z/D//////////////38GBob//xkYGP4zMDAw/P//n+H/////////////qA5a6mD4////////Gf7/Z2D4////////////////f4b/////Z2D4/5+B4f//////MzAwMPxn+P////9RHbTUwfD/////DP8Z/jP8////P8P/////MzAwMDAw/Gf4z8Dwn+H/f4b//////8/w//9/Bob/////H9VBSx0M/////8/wn4Hh/3+G//8Z/v//z/CfgYGBgYHhPwMDA8P/////M/z/z/Cf4f9/hv///////39UBy11MPz///8/w/////8z/P//n4Hh////////////P8N/BgaG/wz///9n+P////////8zMPz//////1EdtNTB8P////8M//////+fgeH/////GRgY/v//z/Cf4T8DA8P/////MzD8Z2BgYGBg+M/w//////9HddBSB8P/////////////////MzAwMPz/z8DA8P//fwYGBgaG/wz/Gf4z/Gf4//8/w38GBob/////H9VBSx0M/////8/AwMDAwMDwn4GB4f9/BgYGBgaG//8ZGBgY/v9nYPjPwMDwn+E/w38Ghv//////P6qDljoY/v///5/h//////8z/P//n+H/fwYGhv8MDP//MzAwMPz///////8MDP///2f4//////////8f1UFLHQz/////z/CfgYHhP8N/hv////9nYGBgYGD4z8DA8J+B4T/D//8M/xkYGBgY/jMwMPz/////qA5a6mD4////f4b/DAwM/xn+M/z//5+B4T/DfwYGBgaG/wwM/xn+MzAw/Gf4////////GRj+////f1QHLXUw/P///z/DfwYGhv8M/xkYGBj+MzAwMPz///////8M/xn+///P8P////8M/xkYGBj+//////+oDlrqYPj///9/hv//////z/Cf4f9/hv//Gf7/Z/jP8P8/w38GBob///8z/Gf4z8Dwn+E/w///////H9VBSx0M/////8/AwMDAwMDwn4GB4f9/BgaG////M/xn+P+f4T8Dw3+G//8ZGP4z/P/P8P///////4/qoKUOhv+kglEdozpGdYzqGNWB0DFydQAAYGMxgGjCIDIAAAAASUVORK5CYII="
              />
              <br />
              <a
                id="img-download"
                download="qart.png"
                href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYgAAAGIAQAAAABzOEqLAAAAJHRFWHRTb2Z0d2FyZQBRUi1QTkcgaHR0cDovL3FyLnN3dGNoLmNvbS9nj329AAAJg0lEQVR4AWP4TyoY1TGqY1THqI5RHQgdI1cHw/////8zMDAwMDAw/P//n4GBgYGBgYGBgYGBgYGBgeH/f4b//xkY/jMwMDAwMDD8/////6gOWupg+P///3+G///////P8J+BgYHh//////8zMDD8Z/j/n4GBgYHhP8N/hv8M//////+f4f////9HddBSB8P/////M/xnYGD4z/D/P8P//////////z8DAwMDw38GBgaG/wwMDP//M/xnYGD4z/D/////ozpoqYPh/////xn+MzAw/Gf4z/D/////////////PwMDAwMDAwMDAwMDw////xn+MzAw/Gf4/////1EdtNTB8P////8M/xkYGP4z/P////////////////9/BgYGBob/DAwM/xkY/v9n+M/AwPCf4f////9HddBSB8P/////M/z/////f4b/DP///////////////2dgYGBg+P+fgYHhPwPDf4b//////8/w/////6M6aKmD4f////8ZGBgYGBgY/jP8Z/jP8J/hP8N/hv8M/xn+M/xn+M/wn+E/w38GBgYGBgaG/////x/VQUsdDP////////////////////////////////////8ZGBgY/jP8////PwPD/////////////////4/qoKUOhv////9nYGBgYPjPwMDw/////wz///////////8MDP8ZGP4zMPxnYGD4z/Cf4T/D//////8f1UFLHQz/////////fwYGhv////////////////////////8MDAwM/xkY/jMw/GdgYGD4/5/h/////0d10FIHw////////8/AwMDA8P///////////////////////5+B4T8Dw3+G//8Z/jMw/P//////////j+qgpQ6G///////PwMDAwPD/PwMDAwMDw/////////+fgeE/A8P//wz/GRgYGBgYGBj+MzD8/////6gOWupg+P//////DAwMDAwMDP/////PwMDw//9/BgYGBgYGBob///8zMDAwMPz//5+B4T/D/////4/qoKUOhv////9nYGBgYGD4////f4b/DAwMDAwMDAz/////z/CfgYHhPwPDf4b///8z/P/P8P////+jOmipg+H/////GRgYGBgYGP7/Z2D4z8DAwMDAwMDAwMDAwMDwn4Hh/38GBob///////////////+P6qClDob/////Z2BgYGBg+P//PwPDf4b//xn+/2dgYGBgYGD4/5+B4T8DA8N/hv////9n+P//////ozpoqYPh/////xkYGBgYGBj+//////////8Z/v9nYGBgYGD4z8DA8J/hP8P//////////////////x/VQUsdDP/////PwMDAwMDw///////////P8P//fwaG/////2dgYPj/n4GB4T8DAwPD//8MDP////8/qoOWOhj+////n4GBgYHhP8P////////PwPD//38Ghv//////z/CfgYGB4f9/hv//////z8Dw/////6M6aKmD4f//////M/xnYPj/////////MzD8/////38Ghv///////5+BgYHh//////8zMPz/z/D/////ozpoqYPh//////////+f4T/DfwYGBgaG/////////z8DAwPD//8M/xkYGBj+/////z8DAwPD/////4/qoKUOhv//////////f4b///8zMDAw/P///////wz/GRgYGBj+MzAw/P//////////////n+H/////R3XQUgfD/////////5+B4T/D////////z8DAwMDAwMDw//9/hv8MDAwMDP///////z/D/////////39UBy11MPz/////////GRj+/////////////2dgYGBg+P+f4T/D//8MDP////////9/hv//Gf7//////6gOWupg+P////////8zMPxn+P//////////Z2BgYPj//z/D//8M////Z/jP8P//f4b/DAwMDP////8/qoOWOhj+//////////8ZGP7///+fgeH/////////z/CfgeE/A8P//wwMDAwMDAwMDP//MzD8/////6gOWupg+P///////xkYGBgYGP7/Z2BgYGBgYGBg+M/AwPD/P8N/BgYGhv8M//8z/GdgYGD4/////1EdtNTB8P///////zP8Z2D4z/D//////////////38GBob//xkYGP4zMDAw/P//n+H/////////////qA5a6mD4////////Gf7/Z2D4////////////////f4b/////Z2D4/5+B4f//////MzAwMPxn+P////9RHbTUwfD/////DP8Z/jP8////P8P/////MzAwMDAw/Gf4z8Dwn+H/f4b//////8/w//9/Bob/////H9VBSx0M/////8/wn4Hh/3+G//8Z/v//z/CfgYGBgYHhPwMDA8P/////M/z/z/Cf4f9/hv///////39UBy11MPz///8/w/////8z/P//n4Hh////////////P8N/BgaG/wz///9n+P////////8zMPz//////1EdtNTB8P////8M//////+fgeH/////GRgY/v//z/Cf4T8DA8P/////MzD8Z2BgYGBg+M/w//////9HddBSB8P/////////////////MzAwMPz/z8DA8P//fwYGBgaG/wz/Gf4z/Gf4//8/w38GBob/////H9VBSx0M/////8/AwMDAwMDwn4GB4f9/BgYGBgaG//8ZGBgY/v9nYPjPwMDwn+E/w38Ghv//////P6qDljoY/v///5/h//////8z/P//n+H/fwYGhv8MDP//MzAwMPz///////8MDP///2f4//////////8f1UFLHQz/////z/CfgYHhP8N/hv////9nYGBgYGD4z8DA8J+B4T/D//8M/xkYGBgY/jMwMPz/////qA5a6mD4////f4b/DAwM/xn+M/z//5+B4T/DfwYGBgaG/wwM/xn+MzAw/Gf4////////GRj+////f1QHLXUw/P///z/DfwYGhv8M/xkYGBj+MzAwMPz///////8M/xn+///P8P////8M/xkYGBj+//////+oDlrqYPj///9/hv//////z/Cf4f9/hv//Gf7/Z/jP8P8/w38GBob///8z/Gf4z8Dwn+E/w///////H9VBSx0M/////8/AwMDAwMDwn4GB4f9/BgaG////M/xn+P+f4T8Dw3+G//8ZGP4z/P/P8P///////4/qoKUOhv+kglEdozpGdYzqGNWB0DFydQAAYGMxgGjCIDIAAAAASUVORK5CYII="
              >
                Download QR Code
              </a>
            </center>
          </div>
          <div id="leftcol">
            <div id="loading">Loading WebAssembly...</div>
            <div id="wasm2">
              <div id="controls">
                <div id="urlbox">
                  <label htmlFor="url">URL:</label>{' '}
                  <input
                    id="url"
                    type="text"
                    value="https://research.swtch.com/qart"
                  />
                  <br />
                  Tip: Short URLs work best.
                  <br />
                  <br />
                  <input id="upload-input" type="file" />
                  <br />
                </div>
                <div id="arrowbox">
                  <table id="arrows">
                    <tbody>
                      <tr>
                        <td>
                          <table cellSpacing="0" cellPadding="0">
                            <tbody>
                              <tr>
                                <td></td>
                                <td>
                                  <a id="up">
                                    <img
                                      id="arrow-up"
                                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA80lEQVR4nOzRDYqDMBTEcfXkOdrezIVSHGn9eEnmOQ3MwELpxvj/0WUafAaoZ4B6BqhngHoGqGeAegaoZ4B6BqhngHoGqGfAzdb3X9oyAevJZ+qyAEfBKYgMwFUoHcEGRAKpCCbgK6yUdSrlL3S2dSzAYTw+5yEYgMt4fJeD6AWE4vE/PqIHUBWPM1xEK6ApHmd5iBZAVzye4SBqAZR4PNuPqAFQ43FHHyIKSInHXe2ICCA1Hne2Ie4Aj8Tj7nrEFeDReLyjDnEGkMTjXXHEEUAaj3fGEPPdgR/d1r3/BUaJn/aty+cXA+3VPA8av+0/AAD//+ndZmPU2MnIAAAAAElFTkSuQmCC"
                                    />
                                  </a>
                                </td>
                                <td></td>
                              </tr>
                              <tr>
                                <td>
                                  <a id="left">
                                    <img
                                      id="arrow-left"
                                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABDklEQVR4nNTYQW7CMBBG4deq9+rVfLTezFUWkaI4CbE9npl/FggsFL0PBDZ8oz1VGVC3G1VA3e8oAurxgRqgnheUAE08QoDLeEQAt/EIAB7jSQ5o4kv5a56UFfAqnqSA1/EkBHTFkwzQHU8iwFA8SQDD8SQATMUTDJiOJxBgEk8QwCyeAIBpPM4A83gcAUvicQIsi9/mx+xKXfNrdiWPd+DrvFBKszQ8Xp+BZQjPb6ElCO99wBwRsRObIqLOQmaIyNOoCSL698A0IhrALCIDgBlEFgCjiEwARhDZAPQiMgLoQdgdC9eM9N/rvHmBswP4hFAA8IRQAXCHUAJwhVADcEYoAjgiVAHsiP8AAAD//y9JQexPmDgcAAAAAElFTkSuQmCC"
                                    />
                                  </a>
                                </td>
                                <td>
                                  <img
                                    id="img-src"
                                    src="data:image/png;base64,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"
                  />
                                </td>
                        <td>
                                  <a id="right">
                                    <img
                                      id="arrow-right"
                                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABFklEQVR4nNTYy43CMBhF4TPWFDalpbWpDISURZT48fuBfK83QBZwPoUkthPwwnik89UWkS7vLRHp9tkOcQfghsgBcEKUALggagAcEC0A6ogH4DiyvbKI7BlwQhT/Qi6I6jXggGhexOqIyF1IGhECIIwIAxBFdAEQRHQDEEMMARBCDAMQQUwBEEBMA9iMWAJgI+L3eej/27+5dCw8A3+5wz+rvr80Fl0De+JZcxfaF8/8c2BvPHNP4v3xjM+FNOIZm43qxNO/HtCKp29FphdPfE2sGU9sV0I3nva+kHY89Z05/XjKe6Me8ZxRkTm7ZDzBu5BsPAGAdDwNgHw8FYBFPAWATTwZgFU8N4BdPBeAZfxnvAMAAP//MpdJkhG/oicAAAAASUVORK5CYII="
                                    />
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td></td>
                                <td>
                                  <a id="down">
                                    <img
                                      id="arrow-down"
                                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABFklEQVR4nOyXUaqDQAxFr8Pb1+vSZmndWQstgtXozCQ3E4ScryKanKP0Y/4AvHBjCoAlWsLAUtYfwSIaPs5lf+EmLIcfGw7/iVqfhl3/6idrFd/pz8XSuuE76KGW0NIjj5MA8caZEb3yuAgQH5gRMSKPRoD4oGfEqDw6AsQBHhEaeXQGiIOYEVp5DASIAxkRFnkMBoiDLRFWeSgCxAWaCIY8lAHiopEIljwMAeLCngimPIwB4uKrCLY8CAGigBThIQ9SAFoRXvK0IRt6j6e0vawvsNIjRn1p7AA0BOmnPo8AnIi6HFm9ArATvtN5ey6eX2AKGRBNBkSTAdFkQDQZEE0GRJMB0WRANBkQTQZEkwHRvAMAAP//yAkmFtiU8dwAAAAASUVORK5CYII="
                                    />
                                  </a>
                                </td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td>
                          <table cellSpacing="5" cellPadding="0">
                            <tbody>
                              <tr>
                                <td>
                                  <a id="smaller">
                                    <img
                                      id="arrow-smaller"
                                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAeUlEQVR4nKzU3QmAMAwE4Ebcy9UympudVKhUaWqT3D1IVPgI/clWuAETRH2wQLSCAaJ/yYL4fsiAD6Z6psEhFgVNLAJOMS/4i9XsDrDLYf7xdCitUBUKuIRGdnmKRs+hidqLsRbq1SujhhjTRtjgC2VO7Bu9AgAA//+UdxgqownkhAAAAABJRU5ErkJggg=="
                                    />
                                  </a>
                                </td>
                                <td>QR Size</td>
                                <td>
                                  <a id="bigger">
                                  <img
                                      id="arrow-bigger"
                                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAeElEQVR4nKzRTQ6FMAgEYB55B/NovZonqzHxB+nURGbYFBb9MqVuZt2E5ccpQz30EtTTTKMZpNELbK1L0EdCBTo8mUXRDikUggz6v9v1S5BpvSRc4vijwCoGQQYbQBY7L6EfLGE22WEZQyCFZZDGIijB9toCAAD//13hGuTGSOFBAAAAAElFTkSuQmCC"
                                    />
              </a>
                                </td>
                              </tr>
                      <tr>
                        <td>
                                  <a id="ismaller">
                                    <img
                                      id="arrow-ismaller"
                                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAeUlEQVR4nKzU3QmAMAwE4Ebcy9UympudVKhUaWqT3D1IVPgI/clWuAETRH2wQLSCAaJ/yYL4fsiAD6Z6psEhFgVNLAJOMS/4i9XsDrDLYf7xdCitUBUKuIRGdnmKRs+hidqLsRbq1SujhhjTRtjgC2VO7Bu9AgAA//+UdxgqownkhAAAAABJRU5ErkJggg=="
                                    />
                                  </a>
                                </td>
                                <td>Image Size</td>
                                <td>
                                  <a id="ibigger">
                                    <img
                                      id="arrow-ibigger"
                                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAeElEQVR4nKzRTQ6FMAgEYB55B/NovZonqzHxB+nURGbYFBb9MqVuZt2E5ccpQz30EtTTTKMZpNELbK1L0EdCBTo8mUXRDikUggz6v9v1S5BpvSRc4vijwCoGQQYbQBY7L6EfLGE22WEZQyCFZZDGIijB9toCAAD//13hGuTGSOFBAAAAAElFTkSuQmCC"
                                    />
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                                <td>
                          <label htmlFor="rand">
                            <input type="checkbox" id="rand" /> Random Pixels
                          </label>
                          <br />
                          <label htmlFor="data">
                            <input type="checkbox" id="data" /> Data Pixels Only
                          </label>
                          <br />
                          <label htmlFor="dither">
                            <input type="checkbox" id="dither" /> Dither
                          </label>
                          <br />
                          <label htmlFor="control">
                            <input type="checkbox" id="control" /> Show
                            Controllable Pixels
                          </label>
                          <br />
                          <br />
                          <button id="redraw">Redraw</button>
                          &nbsp; &nbsp;
                          <button id="rotate">Rotate</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div id="help">
                    Use the blue buttons to move the image within the code
                    <br />
                    and to change the size of the code and the image.
                    <br />
                    <br />
                    Powered by <a href="/qart">QArt Codes</a> and{' '}
                    <a href="https://go.dev/wiki/WebAssembly">Go+WebAssembly</a>
                    .
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
