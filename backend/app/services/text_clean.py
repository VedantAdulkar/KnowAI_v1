"""Strip HTML / tags from scraped excerpts (RSS often ships summary as HTML)."""

from __future__ import annotations

import html
import re

_TAG_RE = re.compile(r"<[^>]+>", re.DOTALL)


def strip_html_tags(text: str | None) -> str | None:
    if text is None:
        return None
    s = html.unescape(str(text))
    s = _TAG_RE.sub(" ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s or None
