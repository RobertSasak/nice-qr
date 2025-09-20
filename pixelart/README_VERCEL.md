# Pixel Art Generator - Vercel Deployment

This version is optimized for deployment on Vercel as serverless functions.

## Setup Instructions

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Set Environment Variable
```bash
vercel env add GEMINI_API_KEY
```
Or add it in the Vercel dashboard under project settings.

### 3. Deploy
```bash
vercel
```

## Project Structure

```
pixelart/
├── index.py              # Serverless function
├── index.html            # Frontend
├── vercel.json           # Vercel configuration
├── requirements.txt      # Python dependencies
└── .gitignore           # Git ignore file
```

## Environment Variables

- `GEMINI_API_KEY` - Your Gemini API key (required)

## How It Works

1. **Frontend** (`index.html`) makes requests to `/generate-pixel-art`
2. **Vercel** routes requests to `api/index.py`
3. **Serverless function** processes the request using Gemini API
4. **Response** returns 9 base64-encoded PNG images

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Test locally
vercel dev
```

## API Endpoints

- `POST /generate-pixel-art` - Generate pixel art
- `GET /health` - Health check
- `GET /` - Root endpoint

## Deployment

1. Push to a Git repository
2. Connect to Vercel
3. Deploy automatically on push

Or deploy manually:
```bash
vercel --prod
```