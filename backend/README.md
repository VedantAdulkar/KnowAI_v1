# AI News Swipe — Backend API

FastAPI service that **ingests** from a curated allowlist (RSS, GitHub, Product Hunt), **ranks** items, stores them in **SQLite**, and exposes a **JSON feed** for a client app.

## Requirements

- **Python 3.12+** (this project was run on **3.14** on Windows).
- Recommended: **virtualenv** at `backend/.venv`.

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\pip install --upgrade pip
.\.venv\Scripts\pip install -r requirements.txt
```

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

### Option A — `run_dev.ps1` (Windows)

```powershell
cd backend
.\run_dev.ps1
```

Starts **uvicorn** with:

- Host **`127.0.0.1`**
- Port **`8001`** (8000 was blocked on the original dev machine; change the script if you prefer another port)
- **`--reload-dir app`** and **`--reload-dir config`** so `.venv` does not trigger reload loops

### Option B — module entrypoint

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.main
```

Uses the same host/port/reload settings as defined in `app/main.py` (`_dev()`).

### Option C — uvicorn CLI

```powershell
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8001 --reload-dir app --reload-dir config
```

Interactive docs: **http://127.0.0.1:8001/docs**

## HTTP API

### `GET /health`

Returns `{"status":"ok"}`.

### `POST /ingest`

Runs the ingestion job synchronously (can take tens of seconds depending on network).

**Response** (`IngestResponse`):

- `fetched` — raw items collected.
- `after_dedupe` — after deduplication.
- `after_score` — after ranking cap.
- `surfaced` — items written/updated in DB.
- `errors` — non-fatal strings (e.g. skipped Product Hunt).

> **Security:** There is **no authentication** on this route. Use only on trusted networks, or add auth / move ingestion to a private worker before deployment.

### `GET /feed?limit=15`

Returns ranked **swipe cards** from the database.

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
| **Reload spam** | Ensure reload is limited to `app` + `config` (see `run_dev.ps1` or `_dev()` in `main.py`). |
| **pydantic-core build failure** on Windows | Use a Python version with wheels, or upgrade `pydantic` / `pydantic-core` per `requirements.txt` (avoids Rust compile). |
| **Empty feed** | Run **POST /ingest** at least once; check RSS URLs and tokens. |

## Parent project

See the repository root **[README.md](../README.md)** and **[SESSION_RESUME.md](../SESSION_RESUME.md)** for full product context and handoff notes.
