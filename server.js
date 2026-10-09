/**
 * SmartBudget AI – Secure Backend Server (Node.js)
 * Serves static assets and securely proxies requests to Google Gemini API.
 * Uses only Node.js standard built-in modules (no npm install required).
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Simple .env reader
function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch (e) {
      console.warn("[WARN] Could not parse .env:", e.message);
    }
  }
}

loadEnvFile();

const PORT = parseInt(process.env.PORT || "8000", 10);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  // CORS support
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. GET /api/status
  if (req.method === "GET" && (pathname === "/api/status" || pathname === "/api/status/")) {
    const configured = Boolean(GEMINI_API_KEY);
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
    return res.end(JSON.stringify({
      configured,
      model: configured ? GEMINI_MODEL : null,
      message: configured ? "Gemini API key configured" : "Running in Rule-Based Demonstration Mode"
    }));
  }

  // 2. POST /api/generate-budget
  if (req.method === "POST" && (pathname === "/api/generate-budget" || pathname === "/api/generate-budget/")) {
    if (!GEMINI_API_KEY) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        success: false,
        engine: "rule-based",
        message: "No GEMINI_API_KEY configured. Fallback to Rule-Based engine."
      }));
    }

    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { systemPrompt, userPrompt } = payload;

        if (!userPrompt) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "Missing userPrompt" }));
        }

        const geminiPayload = {
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        };

        if (systemPrompt) {
          geminiPayload.system_instruction = { parts: [{ text: systemPrompt }] };
        }

        const postData = JSON.stringify(geminiPayload);
        const geminiReqUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const apiReq = https.request(geminiReqUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData)
          },
          timeout: 30000
        }, (apiRes) => {
          let apiData = "";
          apiRes.on("data", c => { apiData += c; });
          apiRes.on("end", () => {
            try {
              const apiJson = JSON.parse(apiData);
              const candidates = apiJson.candidates || [];
              if (candidates.length > 0) {
                const parts = candidates[0].content?.parts || [];
                const generatedText = parts.map(p => p.text || "").join("");
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({
                  success: true,
                  engine: "gemini",
                  model: GEMINI_MODEL,
                  content: generatedText
                }));
              } else {
                throw new Error("No candidates returned from Gemini API");
              }
            } catch (err) {
              console.error("[ERROR] Parsing Gemini response:", err.message, apiData);
              res.writeHead(200, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({
                success: false,
                engine: "rule-based",
                error: err.message
              }));
            }
          });
        });

        apiReq.on("error", (err) => {
          console.error("[ERROR] Gemini HTTPS request failed:", err.message);
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({
            success: false,
            engine: "rule-based",
            error: err.message
          }));
        });

        apiReq.write(postData);
        apiReq.end();

      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: "Invalid JSON request" }));
      }
    });
    return;
  }

  // 3. Static File Server
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  if (safePath === "/" || safePath === "\\") safePath = "/index.html";
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("404 Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log("=".repeat(65));
  console.log(" SmartBudget AI – Financial Planning Agent (Node.js Server)");
  console.log(" Prompt Engineering Laboratory");
  console.log("=".repeat(65));
  console.log(` * Port: ${PORT}`);
  if (GEMINI_API_KEY) {
    console.log(` * Gemini Mode: ACTIVE (Model: ${GEMINI_MODEL})`);
  } else {
    console.log(" * Gemini Mode: INACTIVE (No GEMINI_API_KEY found)");
    console.log("   Running in Rule-Based Demonstration Engine Mode.");
  }
  console.log("-".repeat(65));
  console.log(` * Access the Web App at: http://localhost:${PORT}`);
  console.log("=".repeat(65));
});
