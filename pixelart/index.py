"""
Vercel serverless function for pixel art generation using BaseHTTPRequestHandler.
"""

import base64
import json
import os
import traceback
from http.server import BaseHTTPRequestHandler
from io import BytesIO
from typing import List
from urllib.parse import urlparse

from google import genai
from google.genai import types
from PIL import Image


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
        width, height = grid_image.size
        cell_width = width // 3
        cell_height = height // 3
        encoded_images = []
        for row in range(3):
            for col in range(3):
                left = col * cell_width
                top = row * cell_height
                right = left + cell_width
                bottom = top + cell_height
                cell_image = grid_image.crop((left, top, right, bottom))
                cell_width2, cell_height2 = cell_image.size
                target_size = 320
                left2 = (cell_width2 - target_size) // 2
                top2 = (cell_height2 - target_size) // 2
                right2 = left2 + target_size
                bottom2 = top2 + target_size
                cell_image_center_crop = cell_image.crop((left2, top2, right2, bottom2))
                processed_image = self._process_image(cell_image_center_crop, 64)
                buffered = BytesIO()
                processed_image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                encoded_images.append(f"data:image/png;base64,{img_str}")
        return encoded_images

    def _process_image(self, image: Image.Image, size: int) -> Image.Image:
        img = image.resize((size, size), Image.NEAREST)
        img = img.convert("1")
        return img


# Global generator instance
pixel_generator = None


def get_pixel_generator():
    global pixel_generator
    if pixel_generator is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise Exception("GEMINI_API_KEY environment variable is required")
        pixel_generator = PixelArtGenerator(api_key)
    return pixel_generator


class handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._set_headers()
            resp = {
                "status": "healthy",
                "generator_initialized": pixel_generator is not None,
            }
            self.wfile.write(json.dumps(resp).encode())
        elif parsed.path == "/":
            # Serve index.html
            try:
                with open(
                    os.path.join(os.path.dirname(__file__), "index.html"), "rb"
                ) as f:
                    self._set_headers(200, "text/html")
                    self.wfile.write(f.read())
            except Exception as e:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "index.html not found"}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/generate-pixel-art":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode())
                if "prompt" not in data:
                    self._set_headers(400)
                    self.wfile.write(
                        json.dumps({"error": "Prompt is required"}).encode()
                    )
                    return
                prompt = data["prompt"]
                generator = get_pixel_generator()
                images = generator.generate_pixel_art(prompt)
                self._set_headers(200)
                self.wfile.write(json.dumps({"images": images}).encode())
            except Exception as e:
                self._set_headers(500)
                tb = traceback.format_exc()
                self.wfile.write(json.dumps({"error": str(e), "trace": tb}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())


# For local testing only
if __name__ == "__main__":
    import socketserver
    from http.server import HTTPServer

    port = int(os.environ.get("PORT", 8000))
    server_address = ("", port)
    httpd = HTTPServer(server_address, handler)
    print(f"Serving on port {port}")
    httpd.serve_forever()
