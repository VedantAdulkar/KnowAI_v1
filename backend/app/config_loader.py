from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, Field

CredibilityTier = Literal["official", "news", "community"]


class FunnelConfig(BaseModel):
    fetch_cap_per_source: int = 25
    after_dedupe_cap: int = 100
    after_score_cap: int = 30
    surface_cap: int = 15


class SourceEntry(BaseModel):
    id: str
    name: str
    type: Literal["rss", "github_search", "product_hunt"]
    credibility: CredibilityTier
    category_weight: float = Field(default=0.2, ge=0.0, le=1.0)
    url: str | None = None
    github_query: str | None = None
    topic_slugs: list[str] | None = None


class SourcesDocument(BaseModel):
    version: int
    refresh_interval_minutes: int = 60
    funnel: FunnelConfig = Field(default_factory=FunnelConfig)
    sources: list[SourceEntry]


def load_sources(path: Path) -> SourcesDocument:
    with path.open(encoding="utf-8") as f:
        raw: dict[str, Any] = yaml.safe_load(f)
    return SourcesDocument.model_validate(raw)
