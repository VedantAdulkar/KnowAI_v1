import { useEffect } from "react";
import type { SwipeCard } from "../types/feed";
import { cardLongAbstract } from "../utils/plainText";
import { formatRelativeTime } from "../utils/format";
import { CinematicCover } from "./CinematicCover";
import { CredibilityChip } from "./CredibilityChip";

type Props = {
  card: SwipeCard | null;
  onClose: () => void;
  onRemoveFromVault?: (card: SwipeCard) => void;
};

export function NewsModal({ card, onClose, onRemoveFromVault }: Props) {
  useEffect(() => {
    if (!card) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [card]);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, onClose]);

  if (!card) return null;

  const abstract = cardLongAbstract(card);
  const eyebrow = `${card.source_name} · ${formatRelativeTime(card.published_at)}`;

  return (
    <div className="news-modal news-modal--enter" role="dialog" aria-modal="true" aria-labelledby="news-modal-title">
      <div className="news-modal__scene">
        <div className="news-modal__cover-slot">
          <CinematicCover card={card} className="news-modal__cover-img" picsumW={1600} picsumH={900} />
        </div>

        <div className="news-modal__scrim news-modal__scrim--top" aria-hidden />
        <div className="news-modal__scrim news-modal__scrim--bottom" aria-hidden />

        <button type="button" className="news-modal__dismiss" aria-label="Close story" onClick={onClose} />

        <header className="news-modal__top">
          <div className="news-modal__brand">
            <span className="news-modal__eyebrow">STORY</span>
            <span className="news-modal__eyebrow-sub">{card.source_name}</span>
          </div>
          <div className="news-modal__top-actions">
            <CredibilityChip tier={card.credibility} />
            <button type="button" className="news-modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </header>

        <div className="news-modal__content">
          <p className="news-modal__kicker">{eyebrow}</p>
          <h2 id="news-modal-title" className="news-modal__title">
            {card.title}
          </h2>
          <p className="news-modal__abstract">{abstract}</p>
          <div className="news-modal__source-row">
            <span className="news-modal__source-label">Source</span>
            <a className="news-modal__source-link" href={card.url} target="_blank" rel="noopener noreferrer">
              {card.source_name}
            </a>
          </div>
          <div className="news-modal__actions">
            {onRemoveFromVault && (
              <button
                type="button"
                className="link-btn news-modal__remove"
                onClick={() => {
                  onRemoveFromVault(card);
                  onClose();
                }}
              >
                Remove from vault
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
            <a className="btn btn--accent" href={card.url} target="_blank" rel="noopener noreferrer">
              Open original
            </a>
          </div>
        </div>

        <p className="news-modal__hint">ESC TO CLOSE</p>
      </div>
    </div>
  );
}
