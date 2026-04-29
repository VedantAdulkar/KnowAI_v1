# AI News Swipe — Backend API

FastAPI service that **ingests** from a curated allowlist (RSS, GitHub, Product Hunt), **ranks** items, stores them in **SQLite**, and exposes a **JSON feed** for a client app.

## Requirements

- **Python 3.12+** (this project was run on **3.14** on Windows).

### Python environment (use venv only)

Do **not** `pip install` into your system Python. Everything should run from **`backend/.venv`**.

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\pip.exe install -r requirements.txt
```

After this, prefer:

- **`.\.venv\Scripts\python.exe`** for scripts and `python -m …`
- **`.\.venv\Scripts\pip.exe`** for installs
- **`.\.venv\Scripts\uvicorn.exe`** (or **`.\run_dev.ps1`**, which calls uvicorn inside `.venv`)

Or activate once per shell: **`.\.venv\Scripts\Activate.ps1`** (Windows), then `pip` / `python` resolve to the venv.

Copy **`.env.example`** to **`.env`** and set variables as needed.

## Configuration

| File | Purpose |
|------|---------|
| `config/sources.yaml` | Source allowlist, per-source type (`rss`, `github_search`, `product_hunt`), credibility, category weights, and **funnel** caps |
| `.env` | Secrets and optional `DATABASE_URL` |

### Funnel (defaults in YAML)

- `fetch_cap_per_source` — max items taken per source before merge.
- `after_dedupe_cap` — max items after URL/title dedupe.
- `after_score_cap` — max after sorting by score.
- `surface_cap` — how many top items are written/updated in the DB per ingest run.

### Environment variables

| Variable | Role |
|----------|------|
| `DATABASE_URL` | Default `sqlite:///./data/news.db` (relative to `backend/`). |
| `GITHUB_TOKEN` | Optional; higher GitHub API rate limits for search. |
| `PRODUCT_HUNT_TOKEN` | Required for Product Hunt ingestion; if missing, PH is skipped (`errors` may include `product_hunt_skipped_no_token`). |
| `OPENAI_API_KEY` | Optional; if set, card summaries use the API; otherwise a short excerpt fallback. |

## Running locally

### Option A — `run_dev.bat` (Windows, works if `.ps1` opens in Notepad)

```bat
cd backend
run_dev.bat
```

Double‑click **`run_dev.bat`** in Explorer, or run it from **Command Prompt**. It runs **`.venv\Scripts\python.exe -m uvicorn`** (not `uvicorn.exe`, so **Device Guard** often allows it), with **`--reload-delay 1.5`** to reduce rapid reloads under **OneDrive**.

### Option A-stable — `run_stable.bat` (no auto-reload)

```bat
cd backend
run_stable.bat
```

Same app and **`/ui/`**, but **no `--reload`** — avoids reload noise and subprocess races while you demo or browse.

### Option A2 — `run_dev.ps1` (PowerShell only)

```powershell
cd backend
.\run_dev.ps1
```

Use **`.\`** and run inside **PowerShell**. If **`run_dev.ps1` opens in Notepad** when double‑clicked, your `.ps1` association is wrong — use **`run_dev.bat`** above instead.

Starts **uvicorn** with:

- Host **`127.0.0.1`**
- Port **`8001`** (8000 was blocked on the original dev machine; change the script if you prefer another port)
- **`--reload-dir app`**, **`config`**, and **`static\web`** so `.venv` does not trigger reload loops

### Option B — `python -m app.main` (no `uvicorn.exe`; same settings as `_dev()`)

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.main
```

Uses host/port/reload dirs inside `app/main.py`. Prefer this if **`python -m uvicorn`** is still blocked.

### Option C — full `uvicorn` flags via Python module

Same as **`run_dev.bat`**, explicit one-liner:

```bat
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --reload-delay 1.5 --host 127.0.0.1 --port 8001 --reload-dir app --reload-dir config --reload-dir static\web
```

Interactive docs: **http://127.0.0.1:8001/docs**

## Web UI (no Node.js)

The API serves a **static** web app (vanilla JS + CSS) from `static/web/` via explicit routes (not a catch‑all mount), so **`/ui/`**, **`/ui/styles.css`**, and **`/ui/app.js`** always resolve:

- **http://127.0.0.1:8001/ui/** — HTML shell.
- **http://127.0.0.1:8001/** — redirects to `/ui/`.
- **http://127.0.0.1:8001/ui** — redirects to `/ui/`.

The page calls **`GET /feed`** on the same origin. Bookmarks use `localStorage`. Edit files under **`static/web/`** and refresh; with `--reload`, include **`static\web`** in `--reload-dir` (see `run_dev.bat` / `app/main.py`).

If the page is **blank**, hard‑refresh (**Ctrl+F5**) and check the browser **Network** tab: **`/ui/app.js`** and **`/ui/styles.css`** should return **200** (not blocked by an extension or policy).

## HTTP API

### `GET /health`

Returns `{"status":"ok"}`.

### `POST /ingest`

Runs the ingestion job synchronously (can take tens of seconds depending on network).

**Note:** Opening **`/ingest` in the tab bar sends GET**, which used to return **405 Method Not Allowed**. A **`GET /ingest`** page now explains this and includes a **form button** that sends **POST** so you can trigger ingest from the browser without Swagger.

**Response** (`IngestResponse`):

- `fetched` — raw items collected.
- `after_dedupe` — after deduplication.
- `after_score` — after ranking cap.
- `surfaced` — items written/updated in DB.
- `errors` — non-fatal strings (e.g. skipped Product Hunt).

> **Security:** There is **no authentication** on this route. Use only on trusted networks, or add auth / move ingestion to a private worker before deployment.

### `GET /feed?limit=15`

Returns ranked **swipe cards** from the database. Each successful call prints one line to the **API process stdout** (timestamp UTC, count, first few item ids) so you can confirm refreshes in the terminal where uvicorn runs—not in the Vite dev window.

Each card includes: `title`, `url`, `summary`, `description`, `published_at`, `source_id`, `source_name`, **`credibility`**, and **`scores`** (`recency`, `popularity`, `impact`, `relevance`, `total`).

## Project layout (backend)

```
backend/
├── app/
│   ├── main.py              # FastAPI routes, CORS, lifespan (init DB)
│   ├── settings.py          # Pydantic settings from env
│   ├── database.py          # Engine, session, init_db
│   ├── models.py            # SQLAlchemy: Source, Item
│   ├── schemas.py           # Pydantic API models
│   ├── config_loader.py     # Load and validate sources.yaml
│   └── services/
│       ├── ingestion.py     # Fetch + funnel + DB upsert
│       ├── ranking.py       # Dedupe, scoring, apply_funnel
│       └── llm.py           # Summaries
├── config/sources.yaml
├── data/                    # SQLite file created here by default
├── requirements.txt
├── run_dev.ps1
└── .env.example
```

## CORS

`allow_origins=["*"]` is enabled for frictionless local mobile/web clients. Tighten for production.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| **WinError 10013** on port 8000 | Use another port (e.g. 8001) or check `netsh interface ipv4 show excludedportrange protocol=tcp`. |
| **Device Guard blocks `uvicorn.exe`** | Use **`python.exe -m uvicorn ...`** (`run_dev.bat` / `run_dev.ps1` do this) or **`python -m app.main`**. If **`python.exe` in `.venv`** is also blocked, IT must allowlist the venv or provide a corporate Python. |
| **Reload spam / `CancelledError` / `KeyboardInterrupt` in subprocess** | Normal when **WatchFiles** restarts the worker. **OneDrive** can fire many saves — dev uses **`--reload-delay 1.5`** and only watches **`app`**, **`config`**, **`static\web`**. For no reload: **`run_stable.bat`** or omit **`--reload`**. |
| **pydantic-core build failure** on Windows | Use a Python version with wheels, or upgrade `pydantic` / `pydantic-core` per `requirements.txt` (avoids Rust compile). |
| **Empty feed** | Run **POST /ingest** at least once; check RSS URLs and tokens. |

## Parent project

See the repository root **[README.md](../README.md)** and **[SESSION_RESUME.md](../SESSION_RESUME.md)** for full product context and handoff notes.
