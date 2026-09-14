// Vercel serverless function. Filesystem routing serves it at /api/unique-code;
// vercel.json rewrites /unique-code -> /api/unique-code so both paths work.
// Returns the exact `code` payload from data/unique-code.json when a valid apiKey is supplied.
// Self-contained: no rewrites, no cross-file requires except the JSON payload (which Vercel
// bundles because it is a static require).

const fs = require("fs");
const path = require("path");

const DEFAULT_KEY = "f5b89048d6b98e39b4012611c1799589400b412c";
const API_KEY = process.env.API_KEY || DEFAULT_KEY;

// RAW_PAYLOAD: the file's exact bytes, served verbatim so the JSON response is
// byte-for-byte identical to the source. UNIQUE_CODE: decoded value for html/raw.
let RAW_PAYLOAD = Buffer.from('{"code":""}');
let UNIQUE_CODE = "";
try {
  RAW_PAYLOAD = fs.readFileSync(path.join(__dirname, "..", "data", "unique-code.json"));
  UNIQUE_CODE = JSON.parse(RAW_PAYLOAD.toString("utf8")).code || "";
} catch (err) {
  console.error("Failed to load payload -", err.message);
}

module.exports = (req, res) => {
  // Vercel populates req.query; fall back to manual parsing for other runtimes.
  let apiKey = req.query && req.query.apiKey;
  let format = req.query && req.query.format;
  if (apiKey === undefined || format === undefined) {
    try {
      const sp = new URL(req.url, "http://localhost").searchParams;
      if (apiKey === undefined) apiKey = sp.get("apiKey");
      if (format === undefined) format = sp.get("format");
    } catch (e) { /* ignore */ }
  }

  if (!apiKey) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Missing apiKey query parameter." }));
  }
  if (apiKey !== API_KEY) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Invalid apiKey." }));
  }

  format = String(format || "json").toLowerCase();
  if (format === "html") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(UNIQUE_CODE);
  }
  if (format === "raw") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end(UNIQUE_CODE);
  }
  // default (and format=json): the raw source file, byte-for-byte, as JSON
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(RAW_PAYLOAD);
};
