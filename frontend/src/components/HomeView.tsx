import { useCallback, useEffect, useState } from "react";
import type { SwipeCard } from "../types/feed";
import { HeroCard } from "./HeroCard";
import { NewsModal } from "./NewsModal";
import { StoryBubbles } from "./StoryBubbles";
import { SwipeDeck } from "./SwipeDeck";
import { TopBar } from "./TopBar";

const STREAK_KEY = "ai-news-streak";

function readStreak(): number {
  const n = Number(localStorage.getItem(STREAK_KEY) ?? "0");
  return Number.isFinite(n) && n > 0 ? n : 0;
}

type Props = {
  items: SwipeCard[];
  search: string;
  onSearchChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isSaved: (id: number) => boolean;
  onSave: (card: SwipeCard) => void;
  onSkip: (card: SwipeCard) => void;
  sessionArchives: number;
};

export function HomeView({
  items,
  search,
  onSearchChange,
  loading,
  error,
  onRefresh,
  isSaved,
  onSave,
  onSkip,
  sessionArchives,
}: Props) {
  const hero = items[0];
  const [deckIndex, setDeckIndex] = useState(0);
  const [deckTotal, setDeckTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [detail, setDetail] = useState<SwipeCard | null>(null);

  useEffect(() => {
    const refresh = () => setStreak(readStreak());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  useEffect(() => {
    setDeckIndex(0);
    setDeckTotal(items.length);
  }, [items]);

  const onDeckProgress = useCallback((index: number, total: number) => {
    setDeckIndex(index);
    setDeckTotal(total);
  }, []);

  return (
    <div className="view view--home">
      <NewsModal card={detail} onClose={() => setDetail(null)} />
      <TopBar search={search} onSearchChange={onSearchChange} />
      <div className="view__body">
        {error && (
          <div className="banner banner--error" role="alert">
            {error}
            <button type="button" className="banner__btn" onClick={onRefresh}>
              Retry
            </button>
          </div>
        )}
        {loading && <div className="skeleton skeleton--hero" />}
        {!loading && hero && <HeroCard item={hero} onOpen={setDetail} />}
        <StoryBubbles />
        {!loading && items.length > 0 && (
          <div className="mission-row" aria-label="Session overview">
            <div className="mission-stat glass-card">
              <span className="mission-stat__k">Live queue</span>
              <span className="mission-stat__v">{items.length}</span>
            </div>
            <div className="mission-stat glass-card">
              <span className="mission-stat__k">Archived · session</span>
              <span className="mission-stat__v">{sessionArchives}</span>
            </div>
            <div className="mission-stat glass-card">
              <span className="mission-stat__k">Visit streak</span>
              <span className="mission-stat__v">{streak}d</span>
            </div>
          </div>
        )}
        <div className="view__section-head">
          <h2 className="h2">Briefing deck</h2>
          <button type="button" className="link-btn" onClick={onRefresh} disabled={loading}>
            {loading ? "Loading…" : "Reload feed"}
          </button>
        </div>
        <div className="deck-wrap">
          <div className="deck-hud">
            <span className="deck-hud__progress">
              {deckTotal > 0 ? `Card ${deckIndex + 1} / ${deckTotal}` : "—"}
            </span>
            {sessionArchives > 0 ? (
              <span className="deck-hud__session">{sessionArchives} archived this session</span>
            ) : (
              <span className="deck-hud__session">Swipe to engage</span>
            )}
          </div>
          <SwipeDeck
            items={items}
            isSaved={isSaved}
            onSave={onSave}
            onSkip={onSkip}
            onProgress={onDeckProgress}
            onOpenCard={setDetail}
          />
        </div>
      </div>
    </div>
  );
}
