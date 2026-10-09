#!/usr/bin/env python3
"""
SmartBudget AI – Secure Backend Server (Python 3)
Serves static frontend assets and securely proxies requests to the Google Gemini API.
Uses only the Python standard library (no pip dependencies required).
"""

import http.server
import json
import os
import socketserver
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Load environment variables from .env file if present
def load_env_file():
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.is_file():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip('"').strip("'")
                        if key and key not in os.environ:
                            os.environ[key] = val
        except Exception as e:
            print(f"[WARN] Error reading .env file: {e}")

load_env_file()

PORT = int(os.environ.get("PORT", 8000))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()

STATIC_DIR = Path(__file__).resolve().parent

class SmartBudgetHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP Request Handler serving static files and API endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def _send_json_response(self, status_code, data):
        body_bytes = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body_bytes)))
        self.send_header("Connection", "close")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        self.wfile.write(body_bytes)
        self.close_connection = True

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        # API status check endpoint
        if self.path in ("/api/status", "/api/status/"):
            configured = bool(GEMINI_API_KEY)
            resp = {
                "configured": configured,
                "model": GEMINI_MODEL if configured else None,
                "message": "Gemini API key configured" if configured else "Running in Rule-Based Demonstration Mode"
            }
            self._send_json_response(200, resp)
            return

        # Default: Serve static files
        super().do_GET()

    def do_POST(self):
        if self.path in ("/api/generate-budget", "/api/generate-budget/"):
            self.handle_generate_budget()
            return

        self._send_json_response(404, {"error": "Endpoint not found"})

    def handle_generate_budget(self):
        # 1. Check if Gemini API key is configured
        if not GEMINI_API_KEY:
            resp = {
                "success": False,
                "engine": "rule-based",
                "message": "No GEMINI_API_KEY configured on server. Fallback to Rule-Based engine."
            }
            self._send_json_response(200, resp)
            return

        # 2. Read Request Body
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            body_json = json.loads(body_bytes.decode("utf-8"))
        except Exception as e:
            self._send_json_response(400, {"success": False, "error": f"Invalid JSON payload: {e}"})
            return

        system_prompt = body_json.get("systemPrompt", "")
        user_prompt = body_json.get("userPrompt", "")

        if not user_prompt:
            self._send_json_response(400, {"success": False, "error": "Missing userPrompt"})
            return

        # 3. Call Gemini REST API securely
        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        
        gemini_payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }

        if system_prompt:
            gemini_payload["system_instruction"] = {
                "parts": [{"text": system_prompt}]
            }

        req_data = json.dumps(gemini_payload).encode("utf-8")
        req = urllib.request.Request(
            gemini_url,
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)

                candidates = res_json.get("candidates", [])
                if candidates:
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    generated_text = "".join([p.get("text", "") for p in content_parts])
                    
                    resp = {
                        "success": True,
                        "engine": "gemini",
                        "model": GEMINI_MODEL,
                        "content": generated_text
                    }
                    self._send_json_response(200, resp)
                    return
                else:
                    raise ValueError("No candidates returned by Gemini API")

        except urllib.error.HTTPError as he:
            err_msg = he.read().decode("utf-8")
            print(f"[ERROR] Gemini API HTTPError ({he.code}): {err_msg}")
            resp = {
                "success": False,
                "engine": "rule-based",
                "error": f"Gemini API returned error code {he.code}",
                "detail": err_msg
            }
            self._send_json_response(200, resp)
        except Exception as ex:
            print(f"[ERROR] Gemini request exception: {ex}")
            resp = {
                "success": False,
                "engine": "rule-based",
                "error": str(ex)
            }
            self._send_json_response(200, resp)

def main():
    print("=" * 65)
    print(" SmartBudget AI – Financial Planning Agent")
    print(" Prompt Engineering Laboratory Server")
    print("=" * 65)
    print(f" * Server Root: {STATIC_DIR}")
    print(f" * Port: {PORT}")
    if GEMINI_API_KEY:
        print(f" * Gemini Mode: ACTIVE (Model: {GEMINI_MODEL})")
        print("   (API Key loaded securely via environment variable)")
    else:
        print(" * Gemini Mode: INACTIVE (No GEMINI_API_KEY found)")
        print("   Running in Rule-Based Demonstration Engine Mode.")
        print("   (To enable Gemini, set GEMINI_API_KEY in .env or environment)")
    print("-" * 65)
    print(f" * Access the Web App at: http://localhost:{PORT}")
    print("=" * 65)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SmartBudgetHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down SmartBudget AI server.")

if __name__ == "__main__":
    main()
