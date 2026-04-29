import type { SwipeCard } from "../types/feed";
import { CredibilityChip } from "./CredibilityChip";
import { StoryCoverImage } from "./StoryCoverImage";

type Props = { item: SwipeCard; onOpen?: (item: SwipeCard) => void };

export function HeroCard({ item, onOpen }: Props) {
  return (
    <article className="hero glass-card">
      <div className="hero__badge-row">
        <span className="hero__badge hero__badge--break">Lead story</span>
        <span className="hero__badge hero__badge--live">Live desk</span>
      </div>
      <div className="hero__visual">
        <StoryCoverImage card={item} className="hero__photo" decorative fallback="omit" />
      </div>
      <div className="hero__body">
        <div className="hero__meta">
          <CredibilityChip tier={item.credibility} />
          <span className="hero__source">{item.source_name}</span>
        </div>
        {onOpen ? (
          <h1 className="hero__title">
            <button type="button" className="hero__title-btn" onClick={() => onOpen(item)}>
              {item.title}
            </button>
          </h1>
        ) : (
          <h1 className="hero__title">{item.title}</h1>
        )}
      </div>
    </article>
  );
}
