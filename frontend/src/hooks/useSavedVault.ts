import { useCallback, useEffect, useState } from "react";
import type { SwipeCard } from "../types/feed";

const CARDS_KEY = "ai-news-swipe-saved-cards";

function readCards(): SwipeCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is SwipeCard => x && typeof x === "object" && typeof (x as SwipeCard).id === "number");
  } catch {
    return [];
  }
}

/** Persist full archived cards so Vault works after feed refresh; merge fresh feed rows by id. */
export function useSavedVault(feedItems: SwipeCard[]) {
  const [savedCards, setSavedCards] = useState<SwipeCard[]>(() =>
    typeof window === "undefined" ? [] : readCards(),
  );

  useEffect(() => {
    localStorage.setItem(CARDS_KEY, JSON.stringify(savedCards));
  }, [savedCards]);

  useEffect(() => {
    if (!feedItems.length) return;
    setSavedCards((prev) =>
      prev.length ? prev.map((c) => feedItems.find((i) => i.id === c.id) ?? c) : prev,
    );
  }, [feedItems]);

  const isSaved = useCallback((id: number) => savedCards.some((c) => c.id === id), [savedCards]);

  const toggleSave = useCallback((card: SwipeCard) => {
    setSavedCards((prev) => {
      if (prev.some((c) => c.id === card.id)) {
        return prev.filter((c) => c.id !== card.id);
      }
      return [...prev, { ...card }];
    });
  }, []);

  return { savedCards, toggleSave, isSaved };
}
