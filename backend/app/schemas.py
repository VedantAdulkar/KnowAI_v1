from datetime import datetime, timezone

from pydantic import BaseModel, Field

from app.config_loader import CredibilityTier


class ScoreBreakdown(BaseModel):
    recency: float
    popularity: float
    impact: float
    relevance: float
    total: float


class SwipeCard(BaseModel):
    id: int
    title: str
    url: str
    summary: str | None = None
    description: str | None = None
    published_at: datetime | None = None
    source_id: str
    source_name: str
    credibility: CredibilityTier
    scores: ScoreBreakdown


class FeedResponse(BaseModel):
    items: list[SwipeCard]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class IngestResponse(BaseModel):
    fetched: int
    after_dedupe: int
    after_score: int
    surfaced: int
    errors: list[str] = Field(default_factory=list)
