export type NavTab = "home" | "discover" | "feed" | "profile";

type Props = {
  active: NavTab;
  onChange: (tab: NavTab) => void;
};

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 2}>
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" strokeLinejoin="round" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

function IconFeed() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
    </svg>
  );
}

const tabs: { id: NavTab; label: string }[] = [
  { id: "home", label: "Desk" },
  { id: "discover", label: "Scan" },
  { id: "feed", label: "Vault" },
  { id: "profile", label: "You" },
];

export function FloatingPillNav({ active, onChange }: Props) {
  return (
    <nav className="float-nav" aria-label="Main">
      <div className="float-nav__outer">
        {tabs.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              className={`float-nav__item${isActive ? " float-nav__item--active" : ""}`}
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={isActive ? `${label}, current` : `Go to ${label}`}
            >
              {isActive ? (
                <span className="float-nav__inner">
                  {id === "home" && <IconHome active />}
                  {id === "discover" && <IconGlobe />}
                  {id === "feed" && <IconFeed />}
                  {id === "profile" && <IconProfile />}
                  <span className="float-nav__label">{label}</span>
                </span>
              ) : (
                <span className="float-nav__icon-only">
                  {id === "home" && <IconHome active={false} />}
                  {id === "discover" && <IconGlobe />}
                  {id === "feed" && <IconFeed />}
                  {id === "profile" && <IconProfile />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
