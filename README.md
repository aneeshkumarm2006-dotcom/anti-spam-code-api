# Unique Code API

A tiny, zero-dependency Node server. Open the landing page, copy the link, click it in
Chrome, and you get back the **exact** `code` payload from `data/unique-code.json`.

## Endpoints

| Route | What it does |
|-------|--------------|
| `GET /` | Landing page: shows the API key + a ready-to-copy link with a Copy button |
| `GET /unique-code?apiKey=KEY` | Returns the exact payload as plain text |
| `GET /unique-code?apiKey=KEY&format=html` | Returns it as `text/html` (rendered) |
| `GET /unique-code?apiKey=KEY&format=json` | Returns `{ "code": "..." }` |
| `GET /health` | `{ "ok": true }` |

Wrong/missing `apiKey` → `401` (missing) or `403` (invalid).

## The API key

Default (works out of the box): `f5b89048d6b98e39b4012611c1799589400b412c`

Override it by setting the `API_KEY` environment variable in your host's dashboard.
The landing page and link always reflect whatever key is configured.

## Run locally

```bash
node index.js
# → http://localhost:3000
```

Test it:

```bash
KEY=f5b89048d6b98e39b4012611c1799589400b412c
curl "http://localhost:3000/unique-code?apiKey=$KEY"          # exact text
curl "http://localhost:3000/unique-code?apiKey=$KEY&format=json"
curl -i "http://localhost:3000/unique-code"                   # 401
```

No `npm install` needed — there are no dependencies.

## Deploy to Render (matches the reference URL style)

> If this app lives in a subfolder of the repo (e.g. `unique-code-api/`), set the service's
> **Root Directory** to that folder. Otherwise push this folder as the repo root.

1. Push this folder to a GitHub repo.
2. Render → **New → Web Service** → connect the repo. It auto-detects `render.yaml`, or set
   manually: **Build command** = `echo "no build step"`, **Start command** = `node index.js`.
3. (Optional) Add an `API_KEY` environment variable.
4. Deploy. Your link: `https://<your-service>.onrender.com/unique-code?apiKey=<KEY>`

## Deploy to Vercel

> If this app lives in a subfolder of the repo (e.g. `unique-code-api/`), set the project's
> **Root Directory** to that folder during import.

1. Push to GitHub, then Vercel → **Add New → Project** → import the repo (no build settings needed).
2. Vercel serves `public/index.html` at `/` (the interface) and the `api/unique-code.js`
   function at `/unique-code` automatically — no `vercel.json` or rewrites required.
3. (Optional) Add an `API_KEY` environment variable. If you set a custom key, also update the
   `API_KEY` constant in `public/index.html` so the displayed link stays valid.
4. Deploy. Your link: `https://<your-project>.vercel.app/unique-code?apiKey=<KEY>`

## Files

- `index.js` — standalone Node server for Render / Railway / a VM / local (`node index.js`).
- `public/index.html` — the interface, served at `/` on Vercel.
- `api/unique-code.js` — Vercel serverless function, served at `/unique-code`.
- `data/unique-code.json` — the verbatim source `{ "code": "..." }`; served unmodified.
- `render.yaml` — Render deploy config.
