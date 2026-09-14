// Minimal authenticated content endpoint. Zero dependencies (Node built-ins only).
// Serves the exact `code` payload from data/unique-code.json when a valid apiKey is supplied.
//
// Runs anywhere Node runs (Render, Railway, Fly, a VM, locally) via `node index.js`,
// and also works on Vercel: api/index.js re-exports the `handler` below, which Vercel
// invokes directly as a serverless function.

const http = require("http");
const { URL } = require("url");

// --- Config -----------------------------------------------------------------
// Static API key. Override in production with the API_KEY environment variable.
const API_KEY = process.env.API_KEY || "f5b89048d6b98e39b4012611c1799589400b412c";
const PORT = process.env.PORT || 3000;

// --- Load the payload once at startup ---------------------------------------
// data/unique-code.json is the verbatim source object { "code": "<...>" }.
// We serve the exact value of `code`, unmodified. Using require() (rather than fs) means
// bundlers like Vercel's automatically include the JSON file in the serverless function.
let UNIQUE_CODE = "";
try {
  UNIQUE_CODE = require("./data/unique-code.json").code || "";
} catch (err) {
  console.error("Failed to load payload -", err.message);
}

// --- Landing page HTML ------------------------------------------------------
function landingPage(origin) {
  const link = `${origin}/unique-code?apiKey=${encodeURIComponent(API_KEY)}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unique Code API</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.55 system-ui, sans-serif; max-width: 720px; margin: 0 auto;
         padding: 40px 20px; }
  h1 { font-size: 1.4rem; margin: 0 0 4px; }
  p.sub { color: #666; margin: 0 0 28px; }
  .row { margin: 18px 0; }
  label { display: block; font-weight: 600; font-size: .8rem; text-transform: uppercase;
          letter-spacing: .04em; color: #888; margin-bottom: 6px; }
  .box { display: flex; gap: 8px; }
  input { flex: 1; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px;
          font-family: ui-monospace, monospace; font-size: .9rem; background: transparent;
          color: inherit; }
  button { padding: 10px 16px; border: 0; border-radius: 8px; background: #2563eb;
           color: #fff; font-weight: 600; cursor: pointer; }
  button:active { transform: translateY(1px); }
  a.open { display: inline-block; margin-top: 8px; }
  small { color: #888; }
  code { font-family: ui-monospace, monospace; }
</style>
</head>
<body>
  <h1>Unique Code API</h1>
  <p class="sub">Copy the link below and open it in Chrome to get the exact data.</p>

  <div class="row">
    <label>API key</label>
    <div class="box">
      <input id="key" value="${API_KEY}" readonly>
      <button data-copy="key">Copy</button>
    </div>
  </div>

  <div class="row">
    <label>Link</label>
    <div class="box">
      <input id="link" value="${link}" readonly>
      <button data-copy="link">Copy</button>
    </div>
    <a class="open" href="${link}" target="_blank" rel="noopener">Open link &#8599;</a>
  </div>

  <p><small>Formats: <code>?format=raw</code> (default, exact text) &middot;
     <code>?format=html</code> (rendered) &middot;
     <code>?format=json</code> (JSON).</small></p>

<script>
  document.querySelectorAll("button[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var el = document.getElementById(b.dataset.copy);
      el.select();
      navigator.clipboard.writeText(el.value).then(function () {
        var t = b.textContent; b.textContent = "Copied!";
        setTimeout(function () { b.textContent = t; }, 1200);
      });
    });
  });
</script>
</body>
</html>`;
}

// --- Request handler (also the Vercel serverless export) --------------------
function handler(req, res) {
  // Build an absolute URL so we can read path + query regardless of platform.
  const host = req.headers.host || `localhost:${PORT}`;
  const proto = req.headers["x-forwarded-proto"] || "http";
  const parsed = new URL(req.url, `${proto}://${host}`);
  const pathname = parsed.pathname;

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed." }));
  }

  // Landing page
  if (pathname === "/" || pathname === "") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(landingPage(`${proto}://${host}`));
  }

  // Health check
  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  // The data endpoint
  if (pathname === "/unique-code") {
    const provided = parsed.searchParams.get("apiKey");

    if (!provided) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing apiKey query parameter." }));
    }
    if (provided !== API_KEY) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid apiKey." }));
    }

    const format = (parsed.searchParams.get("format") || "raw").toLowerCase();
    if (format === "json") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ code: UNIQUE_CODE }));
    }
    if (format === "html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(UNIQUE_CODE);
    }
    // default: exact bytes as plain text
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end(UNIQUE_CODE);
  }

  // Fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ error: "Not found." }));
}

// --- Start (only when run directly; on Vercel the handler is imported) ------
if (require.main === module) {
  http.createServer(handler).listen(PORT, () =>
    console.log(`Listening on http://localhost:${PORT}`)
  );
}

module.exports = handler;
