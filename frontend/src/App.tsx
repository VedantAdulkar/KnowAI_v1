import { useCallback, useEffect, useState } from "react";
import { fetchFeed } from "./api/client";
import type { SwipeCard } from "./types/feed";
import { DiscoverView } from "./components/DiscoverView";
import { FeedView } from "./components/FeedView";
import { FloatingPillNav, type NavTab } from "./components/FloatingPillNav";
import { HomeView } from "./components/HomeView";
import { ProfileView } from "./components/ProfileView";
import { useSavedVault } from "./hooks/useSavedVault";

export default function App() {
  const [tab, setTab] = useState<NavTab>("home");
  const [items, setItems] = useState<SwipeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sessionArchives, setSessionArchives] = useState(0);
  const { savedCards, toggleSave, isSaved } = useSavedVault(items);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feed = await fetchFeed(20);
      setItems(feed.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = useCallback(
    (card: SwipeCard) => {
      if (!isSaved(card.id)) {
        toggleSave(card);
        setSessionArchives((n) => n + 1);
      }
    },
    [isSaved, toggleSave],
  );

  const handleSkip = useCallback((_card: SwipeCard) => {
    /* deck advances internally */
  }, []);

  return (
    <div className="app-shell">
      {tab === "home" && (
        <HomeView
          items={items}
          search={search}
          onSearchChange={setSearch}
          loading={loading}
          error={error}
          onRefresh={load}
          isSaved={isSaved}
          onSave={handleSave}
          onSkip={handleSkip}
          sessionArchives={sessionArchives}
        />
      )}
      {tab === "discover" && <DiscoverView items={items} search={search} onSearchChange={setSearch} />}
      {tab === "feed" && (
        <FeedView savedCards={savedCards} search={search} onSearchChange={setSearch} onToggleSave={toggleSave} />
      )}
      {tab === "profile" && <ProfileView />}
      <FloatingPillNav active={tab} onChange={setTab} />
    </div>
  );
}
