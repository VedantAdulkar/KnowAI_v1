import { useMemo, useState } from "react";
import type { CredibilityTier, SwipeCard } from "../types/feed";
import { CredibilityChip } from "./CredibilityChip";
import { NewsModal } from "./NewsModal";
import { StoryCoverImage } from "./StoryCoverImage";
import { TopBar } from "./TopBar";
import { formatRelativeTime } from "../utils/format";
import { stripHtmlToPlain } from "../utils/plainText";

type Props = {
  items: SwipeCard[];
  search: string;
  onSearchChange: (v: string) => void;
};

const tiers: (CredibilityTier | "all")[] = ["all", "official", "news", "community"];

export function DiscoverView({ items, search, onSearchChange }: Props) {
  const [tier, setTier] = useState<CredibilityTier | "all">("all");
  const [detail, setDetail] = useState<SwipeCard | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (tier !== "all" && it.credibility !== tier) return false;
      if (!q) return true;
      const blob = [
        it.title,
        it.summary ?? "",
        it.description ?? "",
        stripHtmlToPlain(it.summary),
        stripHtmlToPlain(it.description),
        it.source_name,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [items, search, tier]);

  return (
    <div className="view">
      <NewsModal card={detail} onClose={() => setDetail(null)} />
      <TopBar search={search} onSearchChange={onSearchChange} />
      <div className="view__body">
        <h2 className="h2">Scan grid</h2>
        <p className="sub">Filter by trust tier · same queue as desk</p>
        <div className="chips-row">
          {tiers.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${tier === t ? " chip--on" : ""}`}
              onClick={() => setTier(t)}
            >
              {t === "all" ? "All" : t === "official" ? "Official" : t === "news" ? "News" : "Community"}
            </button>
          ))}
        </div>
        <ul className="list">
          {filtered.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                className="list-row glass-card list-row--click"
                onClick={() => setDetail(it)}
              >
                <StoryCoverImage card={it} className="list-row__thumb" decorative />
                <div className="list-row__main">
                  <div className="list-row__top">
                    <CredibilityChip tier={it.credibility} />
                    <span className="list-row__time">{formatRelativeTime(it.published_at)}</span>
                  </div>
                  <span className="list-row__title">{it.title}</span>
                  <span className="list-row__src">{it.source_name}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        {!filtered.length && <p className="sub">No matches. Try another filter or search.</p>}
      </div>
    </div>
  );
}
