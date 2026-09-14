// Vercel serverless function. Filesystem routing serves it at /api/unique-code;
// vercel.json rewrites /unique-code -> /api/unique-code so both paths work.
// Returns the exact `code` payload from data/unique-code.json when a valid apiKey is supplied.
// Self-contained: no rewrites, no cross-file requires except the JSON payload (which Vercel
// bundles because it is a static require).

const DEFAULT_KEY = "f5b89048d6b98e39b4012611c1799589400b412c";
const API_KEY = process.env.API_KEY || DEFAULT_KEY;

let UNIQUE_CODE = "";
try {
  UNIQUE_CODE = require("../data/unique-code.json").code || "";
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

  format = String(format || "raw").toLowerCase();
  if (format === "json") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ code: UNIQUE_CODE }));
  }
  if (format === "html") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(UNIQUE_CODE);
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.end(UNIQUE_CODE);
};
