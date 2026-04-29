import { useEffect, useState } from "react";

const STREAK_KEY = "ai-news-streak";
const LAST_KEY = "ai-news-streak-last";

function readStreak(): number {
  const n = Number(localStorage.getItem(STREAK_KEY) ?? "0");
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function bumpStreak(): number {
  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem(LAST_KEY);
  let s = readStreak();
  if (last === today) return s;
  if (!last) {
    s = 1;
  } else {
    const prev = new Date(last + "T12:00:00Z");
    const diffDays = Math.floor((Date.now() - prev.getTime()) / 86400000);
    if (diffDays === 1) s += 1;
    else if (diffDays > 1) s = 1;
  }
  localStorage.setItem(LAST_KEY, today);
  localStorage.setItem(STREAK_KEY, String(s));
  return s;
}

export function ProfileView() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(bumpStreak());
  }, []);

  return (
    <div className="view view--profile">
      <div className="view__body view__body--profile">
        <div className="profile-hero glass-card">
          <div className="profile-hero__avatar" />
          <div>
            <h2 className="h2 h2--tight">Operator</h2>
            <p className="sub">KnowAI preview · local only until launch</p>
          </div>
        </div>
        <div className="stat-pill glass-card">
          <span className="stat-pill__num">{streak}</span>
          <span className="stat-pill__lbl">day streak</span>
        </div>
        <section className="panel glass-card">
          <h3 className="h3">Daily digest</h3>
          <p className="sub">Schedule send time · wire to push later</p>
          <label className="field">
            <span className="field__lbl">Send at</span>
            <input className="field__input" type="time" defaultValue="08:00" />
          </label>
        </section>
        <section className="panel glass-card">
          <h3 className="h3">Alerts</h3>
          <label className="toggle">
            <input type="checkbox" defaultChecked /> Breaking alerts
          </label>
          <label className="toggle">
            <input type="checkbox" defaultChecked /> Digest reminder
          </label>
        </section>
        <p className="fine-print">Local preferences only · connect backend when accounts ship</p>
      </div>
    </div>
  );
}
