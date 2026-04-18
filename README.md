# AI News Swipe

Curated AI and tech news with a **quality-first** pipeline: allowlisted sources, deduplication, scoring, and short summaries for a swipe-style feed. This repository currently ships the **backend API**; a mobile client is the natural next step.

## Goals

- **Trusted sources** over volume (RSS + official APIs, no generic scraping).
- **Funnel**: many candidates → dedupe → rank → persist a small **top set** for the app.
- **Transparency**: each story carries a **credibility** tag (`official`, `news`, `community`).

## Repository layout

```
Project/
├── README.md                 # This file
├── SESSION_RESUME.md         # Dense context for resuming work in a new session
└── backend/                  # FastAPI service + SQLite + ingestion
    ├── README.md             # API and developer documentation
    ├── app/                  # Application code
    ├── config/sources.yaml   # Curated sources and funnel caps
    ├── data/news.db          # SQLite DB (created at runtime)
    ├── requirements.txt
    ├── run_dev.ps1           # Windows: start dev server with safe reload dirs
    └── .env.example          # Copy to .env
```

## Quick start (backend)

From the `backend` folder:

1. **Python / venv** (Windows example):

   ```powershell
   py -3 -m venv .venv
   .\.venv\Scripts\pip install -r requirements.txt
   copy .env.example .env
   ```

2. **Run the API** (default in this project: `127.0.0.1:8001` — see [backend/README.md](backend/README.md) if port 8000 is free on your machine):

   ```powershell
   .\run_dev.ps1
   ```

3. Open **http://127.0.0.1:8001/docs** in a browser.

4. Call **POST /ingest** once to pull from configured sources, then **GET /feed** for cards.

Optional environment variables: `GITHUB_TOKEN`, `PRODUCT_HUNT_TOKEN`, `OPENAI_API_KEY` (see `backend/.env.example`).