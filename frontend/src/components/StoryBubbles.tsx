import { useState } from "react";

const bubbles = [
  { label: "Models", live: true },
  { label: "Startups", live: false },
  { label: "Research", live: true },
  { label: "Tools", live: false },
  { label: "Policy", live: false },
];

export function StoryBubbles() {
  const [active, setActive] = useState(bubbles[0].label);

  return (
    <div className="bubbles">
      <p className="bubbles__label">Signal tracks · tap to focus</p>
      <div className="bubbles__scroll" role="tablist" aria-label="Topics">
        {bubbles.map((b) => {
          const on = active === b.label;
          return (
            <button
              key={b.label}
              type="button"
              role="tab"
              aria-selected={on}
              className={`bubbles__item${on ? " bubbles__item--on" : ""}`}
              onClick={() => setActive(b.label)}
            >
              <span className="bubbles__ring" />
              {b.live && <span className="bubbles__live">Live</span>}
              <span className="bubbles__cap">{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
