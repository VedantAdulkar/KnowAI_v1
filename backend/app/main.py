from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    return FeedResponse(items=cards)


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
        reload_dirs=[str(backend_root / "app"), str(backend_root / "config")],
    )


if __name__ == "__main__":
    _dev()
