import { useState } from "react";
import type { SwipeCard } from "../types/feed";
import { picsumFallbackUrl, posterTokens, storyImageUrl } from "../utils/storyImage";

type Stage = "primary" | "picsum" | "poster";

type Props = {
  card: SwipeCard;
  className?: string;
  /** Cover dimensions for Picsum fallback (match layout). */
  picsumW?: number;
  picsumH?: number;
};

export function CinematicCover({ card, className = "", picsumW = 1600, picsumH = 900 }: Props) {
  const [stage, setStage] = useState<Stage>("primary");
  const primary = storyImageUrl(card);
  const picsum = picsumFallbackUrl(card, picsumW, picsumH);

  if (stage === "poster") {
    const t = posterTokens(card);
    return (
      <div
        className={`story-poster ${className}`.trim()}
        role="img"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(${t.hueA} 22% 9%) 0%, hsl(${t.hueB} 14% 5%) 48%, #050508 100%)`,
        }}
      >
        <span className="story-poster__label">{t.label}</span>
        <span className="story-poster__glyph" aria-hidden>
          {card.title.slice(0, 1)}
        </span>
      </div>
    );
  }

  const src = stage === "primary" ? primary : picsum;

  return (
    <img
      className={`cinematic-cover__img ${className}`.trim()}
      src={src}
      alt=""
      decoding="async"
      fetchPriority="high"
      onError={() => {
        if (stage === "primary") setStage("picsum");
        else setStage("poster");
      }}
    />
  );
}
