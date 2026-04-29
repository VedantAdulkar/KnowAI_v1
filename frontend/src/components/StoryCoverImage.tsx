import { useState } from "react";
import type { SwipeCard } from "../types/feed";
import { picsumFallbackUrl, storyImageUrl } from "../utils/storyImage";

type Props = {
  card: SwipeCard;
  className?: string;
  decorative?: boolean;
  fallback?: "omit" | "placeholder";
};

export function StoryCoverImage({
  card,
  className = "",
  decorative = true,
  fallback = "placeholder",
}: Props) {
  const [stage, setStage] = useState<"primary" | "picsum" | "failed">("primary");
  const primary = storyImageUrl(card);
  const picsum = picsumFallbackUrl(card, 640, 400);

  if (stage === "failed") {
    if (fallback === "omit") return null;
    return <div className={`${className} story-cover-fallback`.trim()} aria-hidden />;
  }

  const src = stage === "primary" ? primary : picsum;

  return (
    <img
      className={className}
      src={src}
      alt={decorative ? "" : `Visual for: ${card.title}`}
      loading="lazy"
      decoding="async"
      aria-hidden={decorative ? true : undefined}
      onError={() => {
        if (stage === "primary") setStage("picsum");
        else setStage("failed");
      }}
    />
  );
}
