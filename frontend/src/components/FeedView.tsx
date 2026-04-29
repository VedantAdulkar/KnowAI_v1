import { useMemo, useState } from "react";
import type { SwipeCard } from "../types/feed";
import { CredibilityChip } from "./CredibilityChip";
import { NewsModal } from "./NewsModal";
import { StoryCoverImage } from "./StoryCoverImage";
import { TopBar } from "./TopBar";
import { formatRelativeTime } from "../utils/format";
import { stripHtmlToPlain } from "../utils/plainText";

type Props = {
  savedCards: SwipeCard[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggleSave: (card: SwipeCard) => void;
};

export function FeedView({ savedCards, search, onSearchChange, onToggleSave }: Props) {
  const [detail, setDetail] = useState<SwipeCard | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedCards;
    return savedCards.filter((it) => {
      const blob = [
        it.title,
        it.source_name,
        stripHtmlToPlain(it.summary),
        stripHtmlToPlain(it.description),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [savedCards, search]);

  return (
    <div className="view">
      <NewsModal
        card={detail}
        onClose={() => setDetail(null)}
        onRemoveFromVault={onToggleSave}
      />
      <TopBar search={search} onSearchChange={onSearchChange} />
      <div className="view__body">
        <h2 className="h2">Vault</h2>
        {savedCards.length === 0 ? (
          <div className="deck-empty glass-card">
            <p className="deck-empty__title">Vault empty</p>
            <p className="deck-empty__sub">Archive stories from the desk — they land here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="sub">No matches for that search. Try other keywords.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
