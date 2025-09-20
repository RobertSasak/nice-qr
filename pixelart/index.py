"""
Vercel serverless function for pixel art generation.
"""

import os
import json
from typing import List
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO
import base64

# Create Flask app for Vercel
app = Flask(__name__)
CORS(app)

class PixelArtGenerator:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)


    def generate_pixel_art(self, prompt: str) -> List[str]:
        """Generate 3x3 grid of 64x64 pixel art variations and return base64 encoded images."""

        full_prompt = (
            f"Generate a single black and white pixel art image arranged in a 3x3 grid (3 rows, 3 columns). "
            f"Each cell should be of size 64x64 pixel art and show different variations of: {prompt}. "
            f"Each variation should be a very simple pixel art easily recognizable as {prompt}. "
            f"IMPORTANT: Make each variation unique with different angles, styles, or compositions. "
            f"The entire image should be 1024x1024 pixels. "
            f"Use only black pixels on a white background. "
            f"There should be no grid lines or borders between and or around the cells. "
            f"Fill each cell completely without any borders or padding within cells."
        )

        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash-image-preview",
                contents=[full_prompt],
            )

            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    image = Image.open(BytesIO(part.inline_data.data))
                    return self._split_and_encode_grid(image)

            raise Exception("No image generated in response")

        except Exception as e:
            raise Exception(f"Error generating pixel art: {str(e)}")

    def _split_and_encode_grid(self, grid_image: Image.Image) -> List[str]:
        """Split grid image into individual variations and return base64 encoded images."""
        # Get the actual dimensions of the returned image
        width, height = grid_image.size

        # Calculate cell dimensions by dividing the image into thirds
        cell_width = width // 3
        cell_height = height // 3

        encoded_images = []

        for row in range(3):
            for col in range(3):
                # Calculate crop box for each third of the image
                left = col * cell_width
                top = row * cell_height
                right = left + cell_width
                bottom = top + cell_height

                # Crop the cell
                cell_image = grid_image.crop((left, top, right, bottom))

                # Cut the middle 320x320 from each cell to remove grid lines
                cell_width, cell_height = cell_image.size
                target_size = 320

                # Calculate crop box to get center 320x320
                left = (cell_width - target_size) // 2
                top = (cell_height - target_size) // 2
                right = left + target_size
                bottom = top + target_size

                cell_image_center_crop = cell_image.crop((left, top, right, bottom))

                # Convert to black and white and resize to 64x64
                processed_image = self._process_image(cell_image_center_crop, 64)

                # Encode to base64
                buffered = BytesIO()
                processed_image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                encoded_images.append(f"data:image/png;base64,{img_str}")

        return encoded_images

    def _process_image(self, image: Image.Image, size: int) -> Image.Image:
        """Process image to specified size black and white."""
        # Resize to target size
        img = image.resize((size, size), Image.NEAREST)

        # Convert to black and white (1-bit)
        img = img.convert('1')

        return img

# Initialize generator with API key from environment
pixel_generator = None

def init_generator():
    global pixel_generator
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise Exception("GEMINI_API_KEY environment variable is required")
    pixel_generator = PixelArtGenerator(api_key)

@app.route('/generate-pixel-art', methods=['POST'])
def generate_pixel_art():
    """Generate pixel art variations for the given prompt."""
    global pixel_generator

    try:
        if not pixel_generator:
            init_generator()

        data = request.get_json()
        if not data or 'prompt' not in data:
            return jsonify({"error": "Prompt is required"}), 400

        prompt = data['prompt']
        images = pixel_generator.generate_pixel_art(prompt)
        return jsonify({"images": images})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def root():
    """Serve the main HTML file."""
    return send_from_directory('.', 'index.html')

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "generator_initialized": pixel_generator is not None
    })

# Vercel handler
def handler(event, context):
    return app.wsgi_app

# For local testing
if __name__ == "__main__":
    init_generator()
    app.run(debug=True)