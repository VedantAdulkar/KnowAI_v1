/**
 * Mirrors FastAPI `SwipeCard`, `ScoreBreakdown`, `FeedResponse`
 * (backend/app/schemas.py). ISO datetimes arrive as strings from JSON.
 */
export type CredibilityTier = "official" | "news" | "community";

export interface ScoreBreakdown {
  recency: number;
  popularity: number;
  impact: number;
  relevance: number;
  total: number;
}

export interface SwipeCard {
  id: number;
  title: string;
  url: string;
  summary: string | null;
  description: string | null;
  published_at: string | null;
  source_id: string;
  source_name: string;
  credibility: CredibilityTier;
  scores: ScoreBreakdown;
}

export interface FeedResponse {
  items: SwipeCard[];
  generated_at: string;
}

export function isCredibilityTier(v: string): v is CredibilityTier {
  return v === "official" || v === "news" || v === "community";
}
