import email.utils
import time
from datetime import datetime, timezone
from typing import Any

import feedparser
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config_loader import SourceEntry, SourcesDocument, load_sources
from app.models import Item, Source
from app.services.llm import summarize_card
from app.services.ranking import NormalizedItem, apply_funnel, score_item
from app.settings import settings


def _parse_http_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        t = email.utils.parsedate_to_datetime(value)
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        return t
    except Exception:
        return None


def _struct_time_to_dt(st: time.struct_time | None) -> datetime | None:
    if st is None:
        return None
    try:
        return datetime(*st[:6], tzinfo=timezone.utc)
    except Exception:
        return None


def fetch_rss(client: httpx.Client, src: SourceEntry, cap: int) -> list[NormalizedItem]:
    if not src.url:
        return []
    parsed = feedparser.parse(src.url)
    out: list[NormalizedItem] = []
    for entry in getattr(parsed, "entries", [])[:cap]:
        link = entry.get("link") or entry.get("id")
        title = (entry.get("title") or "Untitled").strip()
        summary = entry.get("summary") or entry.get("description")
        if summary and len(summary) > 2000:
            summary = summary[:2000]
        published = _struct_time_to_dt(entry.get("published_parsed")) or _struct_time_to_dt(
            entry.get("updated_parsed")
        )
        if not link:
            continue
        out.append(
            NormalizedItem(
                source_id=src.id,
                source_name=src.name,
                source_entry=src,
                url=str(link).strip(),
                title=title,
                description=summary,
                published_at=published,
                credibility=src.credibility,
                popularity_signal=None,
            )
        )
    return out


def fetch_github(client: httpx.Client, src: SourceEntry, cap: int) -> list[NormalizedItem]:
    if not src.github_query:
        return []
    headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    q = httpx.QueryParams({"q": src.github_query, "sort": "stars", "order": "desc", "per_page": str(min(cap, 30))})
    r = client.get("https://api.github.com/search/repositories", params=q, headers=headers, timeout=30.0)
    r.raise_for_status()
    data = r.json()
    out: list[NormalizedItem] = []
    for repo in data.get("items", [])[:cap]:
        url = repo.get("html_url")
        title = repo.get("full_name") or repo.get("name") or "Repo"
        desc = repo.get("description") or ""
        stars = float(repo.get("stargazers_count") or 0)
        published = _parse_http_date(repo.get("pushed_at")) or _parse_http_date(repo.get("created_at"))
        if not url:
            continue
        out.append(
            NormalizedItem(
                source_id=src.id,
                source_name=src.name,
                source_entry=src,
                url=url,
                title=str(title),
                description=str(desc),
                published_at=published,
                credibility=src.credibility,
                popularity_signal=stars,
            )
        )
    return out


def fetch_product_hunt(client: httpx.Client, src: SourceEntry, cap: int) -> list[NormalizedItem]:
    if not settings.product_hunt_token or not src.topic_slugs:
        return []
    headers = {
        "Authorization": f"Bearer {settings.product_hunt_token}",
        "Content-Type": "application/json",
    }
    out: list[NormalizedItem] = []
    per_topic = max(1, cap // max(1, len(src.topic_slugs)))
    for slug in src.topic_slugs:
        query = """
        query TopicPosts($slug: String!, $first: Int!) {
          topic(slug: $slug) {
            posts(first: $first) {
              edges {
                node {
                  name
                  tagline
                  url
                  votesCount
                  createdAt
                }
              }
            }
          }
        }
        """
        r = client.post(
            "https://api.producthunt.com/v2/api/graphql",
            json={"query": query, "variables": {"slug": slug, "first": per_topic}},
            headers=headers,
            timeout=30.0,
        )
        if r.status_code != 200:
            continue
        payload = r.json()
        topic = (payload.get("data") or {}).get("topic") or {}
        edges = ((topic.get("posts") or {}).get("edges")) or []
        for edge in edges:
            node = edge.get("node") or {}
            url = node.get("url")
            name = node.get("name") or "Product"
            tag = node.get("tagline") or ""
            votes = float(node.get("votesCount") or 0)
            created = node.get("createdAt")
            published = None
            if created:
                try:
                    published = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
                except Exception:
                    published = None
            if not url:
                continue
            out.append(
                NormalizedItem(
                    source_id=src.id,
                    source_name=src.name,
                    source_entry=src,
                    url=str(url),
                    title=str(name),
                    description=str(tag),
                    published_at=published,
                    credibility=src.credibility,
                    popularity_signal=votes,
                )
            )
    return out[:cap]


def _sync_sources(db: Session, doc: SourcesDocument) -> None:
    for s in doc.sources:
        extra: dict[str, Any] | None = None
        if s.github_query:
            extra = {"github_query": s.github_query}
        if s.topic_slugs:
            extra = {**(extra or {}), "topic_slugs": s.topic_slugs}
        row = db.get(Source, s.id)
        if row is None:
            db.add(
                Source(
                    id=s.id,
                    name=s.name,
                    source_type=s.type,
                    credibility=s.credibility,
                    extra_config=extra,
                )
            )
        else:
            row.name = s.name
            row.source_type = s.type
            row.credibility = s.credibility
            row.extra_config = extra


def run_ingestion(db: Session) -> dict[str, Any]:
    errors: list[str] = []
    doc = load_sources(settings.sources_path)
    funnel = doc.funnel
    _sync_sources(db, doc)
    db.commit()

    raw: list[NormalizedItem] = []
    cap = funnel.fetch_cap_per_source

    with httpx.Client() as client:
        for src in doc.sources:
            try:
                if src.type == "rss":
                    raw.extend(fetch_rss(client, src, cap))
                elif src.type == "github_search":
                    raw.extend(fetch_github(client, src, cap))
                elif src.type == "product_hunt":
                    if not settings.product_hunt_token:
                        errors.append("product_hunt_skipped_no_token")
                    else:
                        raw.extend(fetch_product_hunt(client, src, cap))
            except Exception as e:  # noqa: BLE001
                errors.append(f"{src.id}:{e!s}")

    deduped, scored, surfaced = apply_funnel(raw, funnel)

    now = datetime.now(timezone.utc)
    for it in surfaced:
        scores = score_item(it)
        summary = summarize_card(it.title, it.description)
        existing = db.execute(select(Item).where(Item.url == it.url)).scalar_one_or_none()
        if existing:
            existing.title = it.title
            existing.description = it.description
            existing.published_at = it.published_at
            existing.credibility = it.credibility
            existing.scores = scores
            existing.summary = summary
            existing.raw_excerpt = (it.description or "")[:2000]
            existing.popularity_signal = it.popularity_signal
            existing.updated_at = now
        else:
            db.add(
                Item(
                    source_id=it.source_id,
                    url=it.url,
                    title=it.title,
                    description=it.description,
                    published_at=it.published_at,
                    credibility=it.credibility,
                    scores=scores,
                    summary=summary,
                    raw_excerpt=(it.description or "")[:2000],
                    popularity_signal=it.popularity_signal,
                    created_at=now,
                    updated_at=now,
                )
            )

    db.commit()
    return {
        "fetched": len(raw),
        "after_dedupe": len(deduped),
        "after_score": len(scored),
        "surfaced": len(surfaced),
        "errors": errors,
    }
