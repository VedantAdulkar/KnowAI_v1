from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db, init_db
from app.models import Item, Source
from app.schemas import FeedResponse, IngestResponse, ScoreBreakdown, SwipeCard
from app.services.ingestion import run_ingestion


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI News Swipe API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ingest", response_model=IngestResponse)
def ingest(db: Session = Depends(get_db)) -> IngestResponse:
    result = run_ingestion(db)
    return IngestResponse(
        fetched=result["fetched"],
        after_dedupe=result["after_dedupe"],
        after_score=result["after_score"],
        surfaced=result["surfaced"],
        errors=result["errors"],
    )


@app.get("/ingest", include_in_schema=False)
def ingest_browser_help() -> HTMLResponse:
    """Typing /ingest in the address bar sends GET; ingestion is POST-only. Offer a one-click POST."""
    page = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ingest — use POST</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    code { background: #f4f4f4; padding: 0.15rem 0.35rem; border-radius: 4px; }
    button { margin-top: 1rem; padding: 0.6rem 1.2rem; font-size: 1rem; cursor: pointer; }
    .muted { color: #555; font-size: 0.95rem; }
  </style>
</head>
<body>
  <h1>Run ingestion</h1>
  <p>
    The address bar always sends a <strong>GET</strong> request.
    This API only accepts <strong>POST</strong> on <code>/ingest</code>, so a bare URL shows
    <code>Method Not Allowed</code> — that is expected.
  </p>
  <p class="muted">Use the button below (POST), or open <a href="/docs">/docs</a> and execute <strong>POST /ingest</strong>.</p>
  <form method="post" action="/ingest">
    <button type="submit">Run ingest now</button>
  </form>
  <p class="muted">After it finishes, open <a href="/ui/">the UI</a> or <a href="/feed">GET /feed</a>.</p>
</body>
</html>"""
    return HTMLResponse(page)


@app.get("/feed", response_model=FeedResponse)
def feed(limit: int = 15, db: Session = Depends(get_db)) -> FeedResponse:
    rows = db.execute(select(Item, Source.name).join(Source, Source.id == Item.source_id)).all()
    items_sorted = sorted(
        rows,
        key=lambda r: float((r[0].scores or {}).get("total", 0.0)),
        reverse=True,
    )[:limit]

    cards: list[SwipeCard] = []
    for it, source_name in items_sorted:
        s = it.scores or {}
        cards.append(
            SwipeCard(
                id=it.id,
                title=it.title,
                url=it.url,
                summary=it.summary,
                description=it.description,
                published_at=it.published_at,
                source_id=it.source_id,
                source_name=str(source_name),
                credibility=it.credibility,  # type: ignore[arg-type]
                scores=ScoreBreakdown(
                    recency=float(s.get("recency", 0.0)),
                    popularity=float(s.get("popularity", 0.0)),
                    impact=float(s.get("impact", 0.0)),
                    relevance=float(s.get("relevance", 0.0)),
                    total=float(s.get("total", 0.0)),
                ),
            )
        )
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    head = ",".join(str(c.id) for c in cards[:6]) if cards else "—"
    print(f"[KnowAI] GET /feed @ {ts} UTC — count={len(cards)} limit={limit} head_ids=[{head}]", flush=True)

    return FeedResponse(items=cards)


STATIC_WEB_DIR = Path(__file__).resolve().parent.parent / "static" / "web"


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/ui/")


@app.get("/ui", include_in_schema=False)
def ui_no_trailing_slash() -> RedirectResponse:
    return RedirectResponse(url="/ui/")


@app.get("/ui/", include_in_schema=False)
def ui_index() -> FileResponse:
    path = STATIC_WEB_DIR / "index.html"
    if not path.is_file():
        raise HTTPException(status_code=500, detail=f"UI bundle missing: {path}")
    return FileResponse(path, media_type="text/html; charset=utf-8")


@app.get("/ui/styles.css", include_in_schema=False)
def ui_styles() -> FileResponse:
    return FileResponse(STATIC_WEB_DIR / "styles.css", media_type="text/css; charset=utf-8")


@app.get("/ui/app.js", include_in_schema=False)
def ui_app_js() -> FileResponse:
    return FileResponse(STATIC_WEB_DIR / "app.js", media_type="application/javascript; charset=utf-8")


@app.get("/ui/index.html", include_in_schema=False)
def ui_index_html() -> FileResponse:
    """Same as `/ui/` (some browsers or bookmarks request this path)."""
    path = STATIC_WEB_DIR / "index.html"
    if not path.is_file():
        raise HTTPException(status_code=500, detail=f"UI bundle missing: {path}")
    return FileResponse(path, media_type="text/html; charset=utf-8")


# For quick local runs without uvicorn CLI package layout
def _dev() -> None:
    import uvicorn

    backend_root = Path(__file__).resolve().parent.parent
    # Only watch app + config so .venv/site-packages changes do not trigger reload storms.
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        reload_delay=1.5,
        reload_dirs=[
            str(backend_root / "app"),
            str(backend_root / "config"),
            str(backend_root / "static" / "web"),
        ],
    )


if __name__ == "__main__":
    _dev()
