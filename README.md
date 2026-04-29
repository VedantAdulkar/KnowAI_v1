# KnowAI news stack

Curated AI and tech news with a **quality-first** pipeline: allowlisted sources, deduplication, scoring, and optional LLM summaries. This repo ships a **FastAPI backend** (SQLite + ingestion), an optional **React (Vite) frontend**, and a **static `/ui/`** served by the same API process.

## Repository layout

```
Project/
├── README.md                 # This file — ingest, deploy, quick start
├── package.json              # Optional: npm run dev|build|preview → frontend/
├── docs/
│   └── FIGMA_UI_SPEC.md      # UI spec reference
├── frontend/                 # React + Vite (KnowAI preview UI)
└── backend/                  # FastAPI + SQLite + ingestion
    ├── README.md             # API details, env vars, troubleshooting
    ├── app/
    ├── config/sources.yaml   # Sources and funnel caps
    ├── data/news.db          # Created at runtime (default path)
    ├── static/web/           # No-Node UI at /ui/
    ├── run_dev.bat / run_dev.ps1 / run_stable.bat
    └── .env.example
```

---

## Ingesting new news

The database is filled when you call **`POST /ingest`**. Until you run ingest at least once, **`GET /feed`** may return an empty list.

### 1. Run the API locally

From `backend/` (after venv + `pip install -r requirements.txt` — see [backend/README.md](backend/README.md)):

```bat
cd backend
run_dev.bat
```

API base: **http://127.0.0.1:8001** (default in this project).

### 2. Trigger ingestion

**Option A — Browser (GET helper page)**

Open **http://127.0.0.1:8001/ingest** in the address bar. You will see a short explanation (GET vs POST) and a **“Run ingest now”** button that submits **POST** for you. If you only refresh the URL without using the button, you are still doing GET — use the button or Swagger.

**Option B — Swagger UI**

1. Open **http://127.0.0.1:8001/docs**
2. Expand **`POST /ingest`**
3. Click **Execute** (no body required)

**Option C — curl (PowerShell)**

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8001/ingest" -Method POST -UseBasicParsing
```

**Option D — curl (bash)**

```bash
curl -X POST "http://127.0.0.1:8001/ingest"
```

The JSON response includes `fetched`, `after_dedupe`, `after_score`, `surfaced`, and `errors`. A run can take **tens of seconds** depending on RSS latency and optional APIs.

### 3. Pull the feed

- **Browser / app:** `GET http://127.0.0.1:8001/feed?limit=20`
- **React dev:** with Vite proxy, the frontend calls **`/api/feed`** (see [frontend/README.md](frontend/README.md)).

### Configuration and secrets

- **Sources and caps:** edit **`backend/config/sources.yaml`** (RSS URLs, GitHub search, Product Hunt, credibility, funnel limits).
- **Env:** copy **`backend/.env.example`** → **`.env`**. Optional: `GITHUB_TOKEN`, `PRODUCT_HUNT_TOKEN` (required for Product Hunt), `OPENAI_API_KEY` (richer summaries). See [backend/README.md](backend/README.md).

> **Security:** `POST /ingest` has **no authentication** in this template. Use only on trusted networks, or put the API behind auth / run ingestion from a private worker before production.

---

## Deployment (overview)

You typically deploy **two pieces**: the **API** (Python) and the **static frontend** (either the built Vite app or only `/ui/` from the backend).

### Backend (API + optional built-in UI)

1. **Runtime:** Python **3.12+**, install **`backend/requirements.txt`** into a venv on the server.
2. **Process:** run Uvicorn bound to `127.0.0.1` behind a reverse proxy (nginx, Caddy, Traefik) that terminates TLS and forwards to Uvicorn.

   Example (adjust paths and host):

   ```bash
   /path/to/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
   ```

   For production you often use **gunicorn + uvicorn workers** or a platform-specific runner; the important part is **one stable process** and **persistent disk** for SQLite (or set `DATABASE_URL` to Postgres if you migrate).

3. **Environment:** set production **`.env`** on the server (`DATABASE_URL`, tokens, `OPENAI_API_KEY` as needed).
4. **CORS:** the app ships permissive CORS for local dev. **Tighten** `allow_origins` in `backend/app/main.py` (or settings) to your real frontend origin(s) before exposing the API publicly.
5. **Ingest in production:** schedule **`POST /ingest`** via cron, systemd timer, GitHub Actions, or a queue worker — **not** exposed anonymously on the public internet unless you add auth.

The same server already serves **`/ui/`** static files from **`backend/static/web/`** if you only need a simple hosted UI without Node.

### Frontend (React / Vite)

1. **Build** (from repo root or `frontend/`):

   ```powershell
   cd frontend
   npm install
   npm run build
   ```

   Output: **`frontend/dist/`**.

2. **Configure API origin:** create **`frontend/.env`** for production builds:

   ```env
   VITE_API_BASE=https://api.yourdomain.com
   ```

   The browser will call **`VITE_API_BASE/feed`** directly; your API must **allow that origin in CORS** and use **HTTPS** in production.

3. **Host `dist/`** on any static host (S3 + CloudFront, Azure Static Web Apps, Netlify, Vercel, nginx `root`, etc.). SPA fallback: for client-side routes (if you add a router later), serve **`index.html`** for unknown paths; this app is mostly a single page today.

4. **Preview locally after build:**

   ```powershell
   npm run preview
   ```

   From repo root (if **`package.json`** exists at root): **`npm run preview`** runs the same via `--prefix frontend`.

5. **Story art:** the React UI picks topical **Unsplash** URLs from `frontend/src/utils/storyImage.ts` (no images stored in the repo). When the API later adds a real `image_url` per article, wire that in and keep the stock URLs as fallback.

### End-to-end checklist

- [ ] API reachable over HTTPS with hardened CORS  
- [ ] `POST /ingest` scheduled or secured  
- [ ] `GET /feed` returns data after ingest  
- [ ] Frontend `VITE_API_BASE` matches deployed API  
- [ ] SQLite path / `DATABASE_URL` persistent on restarts  

---

## Quick start (local)

**Backend**

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt
copy .env.example .env
run_dev.bat
```

Then **ingest** (see above) and open **http://127.0.0.1:8001/docs** or **http://127.0.0.1:8001/ui/**.

**Frontend (optional)**

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** (Vite proxies **`/api`** → `http://127.0.0.1:8001` by default in `vite.config.ts`).

---

## Design reference

- **[docs/FIGMA_UI_SPEC.md](docs/FIGMA_UI_SPEC.md)** — product UI notes  
- **`frontend/Design.md`** — cinematic typography / palette reference for the React UI  

---

## Session / handoff

See **[SESSION_RESUME.md](SESSION_RESUME.md)** for dense context when resuming work in a new chat.
