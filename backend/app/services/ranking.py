import math
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlparse

from app.config_loader import CredibilityTier, FunnelConfig, SourceEntry

AI_KEYWORDS = re.compile(
    r"\b(ai|ml|llm|gpt|openai|anthropic|gemini|model|neural|"
    r"deep learning|machine learning|arxiv|dataset|gpu|inference|"
    r"agent|rag|embedding|transformer)\b",
    re.I,
)
IMPACT_KEYWORDS = re.compile(
    r"\b(release|launch|announces|breakthrough|paper|model weights|"
    r"api|funding|series [a-z]|acquisition|open source)\b",
    re.I,
)


@dataclass
class NormalizedItem:
    source_id: str
    source_name: str
    source_entry: SourceEntry
    url: str
    title: str
    description: str | None
    published_at: datetime | None
    credibility: CredibilityTier
    popularity_signal: float | None = None


def _canonical_url(url: str) -> str:
    try:
        p = urlparse(url.strip())
        netloc = (p.netloc or "").lower().removeprefix("www.")
        path = (p.path or "").rstrip("/")
        return f"{netloc}{path}".lower()
    except Exception:
        return url.strip().lower()[:512]


def _title_fingerprint(title: str) -> str:
    t = re.sub(r"\s+", " ", title.strip().lower())
    return t[:120]


def dedupe_items(items: list[NormalizedItem], cap: int) -> list[NormalizedItem]:
    seen_url: set[str] = set()
    seen_title: set[str] = set()
    out: list[NormalizedItem] = []
    for it in sorted(
        items,
        key=lambda x: x.published_at or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    ):
        cu = _canonical_url(it.url)
        tf = _title_fingerprint(it.title)
        if cu in seen_url or tf in seen_title:
            continue
        seen_url.add(cu)
        seen_title.add(tf)
        out.append(it)
        if len(out) >= cap:
            break
    return out


def _hours_since(published_at: datetime | None) -> float:
    if published_at is None:
        return 168.0
    now = datetime.now(timezone.utc)
    ts = published_at if published_at.tzinfo else published_at.replace(tzinfo=timezone.utc)
    delta = (now - ts).total_seconds() / 3600.0
    return max(0.0, min(delta, 24.0 * 90))


def score_item(it: NormalizedItem) -> dict[str, float]:
    hours = _hours_since(it.published_at)
    recency = math.exp(-hours / 48.0)

    pop_raw = it.popularity_signal or 0.0
    popularity = min(1.0, math.log1p(max(0.0, pop_raw)) / math.log1p(5000))

    text = f"{it.title} {it.description or ''}"
    relevance = min(1.0, 0.15 + 0.85 * (len(AI_KEYWORDS.findall(text)) / 5.0))
    if relevance < 0.15:
        relevance = 0.15

    impact_hits = len(IMPACT_KEYWORDS.findall(text))
    impact = min(1.0, 0.2 + 0.2 * impact_hits)

    cred_boost = {"official": 1.15, "news": 1.05, "community": 1.0}[it.credibility]
    cat = it.source_entry.category_weight
    total = (
        (0.35 * recency + 0.25 * popularity + 0.2 * impact + 0.2 * relevance)
        * cred_boost
        * (0.85 + 0.15 * cat)
    )
    return {
        "recency": round(recency, 4),
        "popularity": round(popularity, 4),
        "impact": round(impact, 4),
        "relevance": round(relevance, 4),
        "total": round(float(total), 4),
    }


def apply_funnel(
    items: list[NormalizedItem],
    funnel: FunnelConfig,
) -> tuple[list[NormalizedItem], list[NormalizedItem], list[NormalizedItem]]:
    deduped = dedupe_items(items, funnel.after_dedupe_cap)
    scored = sorted(
        deduped,
        key=lambda x: score_item(x)["total"],
        reverse=True,
    )[: funnel.after_score_cap]
    surfaced = scored[: funnel.surface_cap]
    return deduped, scored, surfaced
