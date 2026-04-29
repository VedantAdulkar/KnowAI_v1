import { useCallback, useEffect, useRef, useState } from "react";
import type { SwipeCard } from "../types/feed";
import { CredibilityChip } from "./CredibilityChip";
import { StoryCoverImage } from "./StoryCoverImage";
import { formatRelativeTime } from "../utils/format";
import { cardAbstract } from "../utils/plainText";

type Props = {
  items: SwipeCard[];
  isSaved: (id: number) => boolean;
  onSave: (card: SwipeCard) => void;
  onSkip: (card: SwipeCard) => void;
  onProgress?: (index: number, total: number) => void;
  onOpenCard?: (card: SwipeCard) => void;
};

const SWIPE_THRESHOLD = 96;
const PULL_HINT = 48;

export function SwipeDeck({ items, isSaved, onSave, onSkip, onProgress, onOpenCard }: Props) {
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const itemsRef = useRef(items);
  const currentRef = useRef<SwipeCard | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    setIndex(0);
    setDx(0);
  }, [items]);

  const current = items[index] ?? null;
  const next = items[index + 1] ?? null;

  useEffect(() => {
    currentRef.current = current;
    onProgress?.(index, items.length);
  }, [index, items.length, current, onProgress]);

  const finish = useCallback(
    (direction: "left" | "right" | "cancel") => {
      const card = currentRef.current;
      if (!card) return;
      if (direction === "cancel") {
        setDx(0);
        return;
      }
      if (direction === "right") onSave(card);
      else onSkip(card);
      setDx(0);
      setIndex((i) => Math.min(i + 1, itemsRef.current.length));
    },
    [onSave, onSkip],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        finish("right");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        finish("left");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!currentRef.current) return;
    dragging.current = true;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setDx(e.clientX - startX.current);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const x = e.clientX - startX.current;
    if (x > SWIPE_THRESHOLD) finish("right");
    else if (x < -SWIPE_THRESHOLD) finish("left");
    else finish("cancel");
  };

  let pull: "" | "left" | "right" = "";
  if (dx > PULL_HINT) pull = "right";
  else if (dx < -PULL_HINT) pull = "left";

  if (!items.length) {
    return (
      <div className="deck-empty glass-card">
        <p className="deck-empty__title">No signal yet</p>
        <p className="deck-empty__sub">Run ingestion on the API, then refresh.</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="deck-empty glass-card">
        <p className="deck-empty__title">Orbit clear</p>
        <p className="deck-empty__sub">You&apos;ve cleared this briefing. Refresh for more.</p>
      </div>
    );
  }

  const rot = dx * 0.035;
  const saved = isSaved(current.id);

  return (
    <div className="deck">
      {next && (
        <div className="deck__peek glass-card" aria-hidden>
          <p className="deck__peek-title">{next.title}</p>
        </div>
      )}
      <article
        className="deck__card glass-card"
        data-pull={pull || undefined}
        style={{ transform: `translateX(${dx}px) rotate(${rot}deg)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragging.current = false;
          setDx(0);
        }}
      >
        <span className="deck__swipe-hint deck__swipe-hint--left" aria-hidden>
          Pass
        </span>
        <span className="deck__swipe-hint deck__swipe-hint--right" aria-hidden>
          Archive
        </span>
        <div className="deck__cover-wrap">
          <StoryCoverImage card={current} className="deck__cover" decorative />
        </div>
        <div className="deck__meta">
          <CredibilityChip tier={current.credibility} />
          <span className="deck__source">{current.source_name}</span>
          <span className="deck__time">{formatRelativeTime(current.published_at)}</span>
        </div>
        <h2 className="deck__title">{current.title}</h2>
        <p className="deck__summary">
          {cardAbstract(current) || "Open the story for full context."}
        </p>
        {onOpenCard && (
          <button type="button" className="btn btn--ghost deck__read" onClick={() => onOpenCard(current)}>
            View story
          </button>
        )}
        <div className="deck__actions">
          <button type="button" className="btn btn--ghost" onClick={() => finish("left")} aria-label="Pass this story">
            Pass
          </button>
          <button
            type="button"
            className={`btn btn--accent${saved ? " btn--saved" : ""}`}
            onClick={() => finish("right")}
            aria-label={saved ? "Already archived" : "Archive to saved feed"}
          >
            {saved ? "Archived" : "Archive"}
          </button>
        </div>
        <p className="deck__hint">
          Swipe or drag · ← pass · → archive · keyboard arrows when not typing
        </p>
      </article>
    </div>
  );
}
