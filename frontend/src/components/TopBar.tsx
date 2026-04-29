type Props = {
  search: string;
  onSearchChange: (v: string) => void;
};

export function TopBar({ search, onSearchChange }: Props) {
  return (
    <header className="top-bar">
      <div className="top-bar__brand">
        KnowAI
        <small>Preview · full product not live yet</small>
      </div>
      <div className="top-bar__pill">
        <span className="top-bar__icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <input
          type="search"
          className="top-bar__search"
          placeholder="Search the feed"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search"
        />
        <button type="button" className="top-bar__icon-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>
      <div className="top-bar__avatar" aria-hidden title="Profile">
        <span />
      </div>
    </header>
  );
}
