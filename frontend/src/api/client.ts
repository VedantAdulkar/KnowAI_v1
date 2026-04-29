import { isCredibilityTier, type FeedResponse } from "../types/feed";

/** Dev: Vite proxy `/api` -> backend. Prod: set `VITE_API_BASE` (e.g. http://127.0.0.1:8001). */
function apiBase(): string {
  if (import.meta.env.DEV) return "/api";
  const raw = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? "";
  if (!raw) {
    console.warn("VITE_API_BASE unset; feed requests may fail outside dev.");
    return "";
  }
  return raw;
}

function validateFeedResponse(data: unknown): FeedResponse {
  if (!data || typeof data !== "object") throw new Error("Invalid feed: not an object");
  const o = data as Record<string, unknown>;
  if (!Array.isArray(o.items)) throw new Error("Invalid feed: items not an array");
  const items = o.items.map((raw, i) => {
    if (!raw || typeof raw !== "object") throw new Error(`Invalid feed item ${i}`);
    const it = raw as Record<string, unknown>;
    const scores = it.scores;
    if (!scores || typeof scores !== "object") throw new Error(`Invalid scores on item ${i}`);
    const s = scores as Record<string, unknown>;
    const cred = typeof it.credibility === "string" ? it.credibility : "";
    if (!isCredibilityTier(cred)) throw new Error(`Invalid credibility on item ${i}`);
    return {
      id: Number(it.id),
      title: String(it.title),
      url: String(it.url),
      summary: it.summary == null ? null : String(it.summary),
      description: it.description == null ? null : String(it.description),
      published_at: it.published_at == null ? null : String(it.published_at),
      source_id: String(it.source_id),
      source_name: String(it.source_name),
      credibility: cred,
      scores: {
        recency: Number(s.recency),
        popularity: Number(s.popularity),
        impact: Number(s.impact),
        relevance: Number(s.relevance),
        total: Number(s.total),
      },
    };
  });
  return {
    items,
    generated_at: typeof o.generated_at === "string" ? o.generated_at : new Date().toISOString(),
  };
}

export async function fetchFeed(limit = 15): Promise<FeedResponse> {
  const base = apiBase();
  const url = `${base}/feed?limit=${encodeURIComponent(String(limit))}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Feed request failed: ${res.status}`);
  }
  const json: unknown = await res.json();
  const out = validateFeedResponse(json);
  if (import.meta.env.DEV) {
    console.info(`[KnowAI] Feed loaded in browser: ${out.items.length} items`);
  }
  return out;
}
