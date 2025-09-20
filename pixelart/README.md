# Pixel Art Generator

A Flask-based API that generates 64x64 black and white pixel art using Gemini 2.5 Flash Image API.

## Features

- Generates 9 unique 64x64 pixel art variations in a single API call
- Black pixels on white background
- Simple web interface for testing
- RESTful API endpoint

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start the server:
```bash
python server.py --api-key YOUR_GEMINI_API_KEY
```

## Usage

### Web Interface

Open `index.html` in your web browser and:
1. Enter a prompt (e.g., "cat", "house", "tree")
2. Click "Generate Pixel Art"
3. Wait for the 9 variations to appear

### API Endpoint

```bash
curl -X POST http://127.0.0.1:5000/generate-pixel-art \
  -H "Content-Type: application/json" \
  -d '{"prompt": "cat"}'
```

### Response

```json
{
  "images": [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    ...
  ]
}
```

## Server Options

```bash
python server.py --api-key YOUR_API_KEY [OPTIONS]

Options:
  --host HOST       Host to bind to (default: 127.0.0.1)
  --port PORT       Port to bind to (default: 5000)
  --debug           Enable debug mode
```

## Health Check

```bash
curl http://127.0.0.1:5000/health
```

## Files

- `server.py` - Flask API server
- `index.html` - Web interface
- `generate_pixelart.py` - Original script version
- `requirements.txt` - Python dependencies

## Notes

- Requires a valid Gemini API key from Google AI Studio
- Each generation creates 9 variations arranged in a 3x3 grid
- Images are returned as base64-encoded PNG data URIs
- Designed for black and white pixel art with sharp edges