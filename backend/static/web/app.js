(function () {
  "use strict";

  const SAVED_KEY = "ai-news-swipe-saved-ids";
  const STREAK_KEY = "ai-news-streak";
  const LAST_KEY = "ai-news-streak-last";

  /** @type {{ id: number; title: string; url: string; summary: string | null; description: string | null; published_at: string | null; source_id: string; source_name: string; credibility: string; scores: { total: number } }[]} */
  let items = [];
  let tab = "home";
  let search = "";
  let deckIndex = 0;
  let tier = "all";
  let loading = true;
  let error = null;

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function readSaved() {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "number") : []);
    } catch {
      return new Set();
    }
  }

  function writeSaved(set) {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...set]));
  }

  function isSaved(id) {
    return readSaved().has(id);
  }

  function toggleSave(id) {
    const s = readSaved();
    if (s.has(id)) s.delete(id);
    else s.add(id);
    writeSaved(s);
  }

  function bumpStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(LAST_KEY);
    let s = Number(localStorage.getItem(STREAK_KEY) ?? "0") || 0;
    if (last === today) return s;
    if (!last) s = 1;
    else {
      const prev = new Date(last + "T12:00:00Z").getTime();
      const diffDays = Math.floor((Date.now() - prev) / 86400000);
      if (diffDays === 1) s += 1;
      else if (diffDays > 1) s = 1;
    }
    localStorage.setItem(LAST_KEY, today);
    localStorage.setItem(STREAK_KEY, String(s));
    return s;
  }

  function formatRelative(iso) {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 48) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  }

  function credClass(c) {
    if (c === "official") return "cred-chip cred-chip--official";
    if (c === "news") return "cred-chip cred-chip--news";
    return "cred-chip cred-chip--community";
  }

  function credLabel(c) {
    if (c === "official") return "Official";
    if (c === "news") return "News";
    return "Community";
  }

  async function loadFeed() {
    loading = true;
    error = null;
    render();
    try {
      const res = await fetch("/feed?limit=20");
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      const data = await res.json();
      if (!data || !Array.isArray(data.items)) throw new Error("Invalid feed JSON");
      items = data.items;
      deckIndex = 0;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load";
      items = [];
    } finally {
      loading = false;
      render();
    }
  }

  function iconHome(active) {
    const sw = active ? 2.2 : 2;
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}"><path stroke-linejoin="round" d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z"/></svg>`;
  }
  function iconGlobe() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>';
  }
  function iconFeed() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>';
  }
  function iconProfile() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1"/></svg>';
  }

  function navButton(id, label, iconFn) {
    const active = tab === id;
    return `<button type="button" class="float-nav__item${active ? " float-nav__item--active" : ""}" data-tab="${id}" aria-label="${esc(label)}${active ? ", selected" : ""}">
      ${active ? `<span class="float-nav__inner">${iconFn(true)}<span class="float-nav__label">${esc(label)}</span></span>` : `<span class="float-nav__icon-only">${iconFn(false)}</span>`}
    </button>`;
  }

  function renderNav() {
    const el = document.getElementById("nav");
    if (!el) return;
    el.innerHTML = `<div class="float-nav__outer" role="tablist">
      ${navButton("home", "Home", iconHome)}
      ${navButton("discover", "Discover", () => iconGlobe())}
      ${navButton("feed", "Feed", () => iconFeed())}
      ${navButton("profile", "Profile", () => iconProfile())}
    </div>`;
    el.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        tab = btn.getAttribute("data-tab") || "home";
        render();
      });
    });
  }

  function topBar() {
    return `<header class="top-bar">
      <div class="top-bar__pill">
        <span class="top-bar__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></span>
        <input type="search" class="top-bar__search" id="q" placeholder="Search…" value="${esc(search)}" aria-label="Search" />
        <button type="button" class="top-bar__icon-btn" aria-label="Notifications"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></button>
      </div>
      <div class="top-bar__avatar"><span></span></div>
    </header>`;
  }

  function bubbles() {
    const b = [
      ["Models", true],
      ["Startups", false],
      ["Research", true],
      ["Tools", false],
    ];
    return `<div class="bubbles"><div class="bubbles__scroll">${b
      .map(
        ([name, live]) => `<button type="button" class="bubbles__item"><span class="bubbles__ring"></span>${live ? '<span class="bubbles__live">Live</span>' : ""}<span class="bubbles__cap">${esc(name)}</span></button>`,
      )
      .join("")}</div></div>`;
  }

  function heroCard(it) {
    return `<article class="hero glass-card">
      <div class="hero__badge-row"><span class="hero__badge">Headlines</span><span class="hero__badge hero__badge--live">Breaking</span></div>
      <div class="hero__visual"></div>
      <div class="hero__body">
        <div class="hero__meta"><span class="${credClass(it.credibility)}">${esc(credLabel(it.credibility))}</span><span class="hero__source">${esc(it.source_name)}</span></div>
        <h1 class="hero__title">${esc(it.title)}</h1>
      </div>
    </article>`;
  }

  function deckSection() {
    if (!items.length && !loading) {
      return `<div class="deck-empty glass-card"><p class="deck-empty__title">No stories yet</p><p class="deck-empty__sub">POST /ingest from API docs, then Refresh.</p></div>`;
    }
    const cur = items[deckIndex];
    const nxt = items[deckIndex + 1];
    if (!cur) {
      return `<div class="deck-empty glass-card"><p class="deck-empty__title">You're caught up</p><p class="deck-empty__sub">Pull fresh items with Refresh.</p></div>`;
    }
    const sum = cur.summary || cur.description || "Open to read more.";
    const saved = isSaved(cur.id);
    return `<div class="deck">
      ${nxt ? `<div class="deck__peek glass-card" aria-hidden="true"><p class="deck__peek-title">${esc(nxt.title)}</p></div>` : ""}
      <article class="deck__card glass-card" data-card-id="${cur.id}">
        <div class="deck__meta">
          <span class="${credClass(cur.credibility)}">${esc(credLabel(cur.credibility))}</span>
          <span class="deck__source">${esc(cur.source_name)}</span>
          <span class="deck__time">${esc(formatRelative(cur.published_at))}</span>
        </div>
        <h2 class="deck__title">${esc(cur.title)}</h2>
        <p class="deck__summary">${esc(sum)}</p>
        <div class="deck__actions">
          <button type="button" class="btn btn--ghost" data-skip>Skip</button>
          <button type="button" class="btn btn--accent${saved ? " btn--saved" : ""}" data-save>${saved ? "Saved" : "Save"}</button>
        </div>
        <p class="deck__hint">Swipe or use buttons · <a class="link-btn" href="${esc(cur.url)}" target="_blank" rel="noopener">Open source</a></p>
      </article>
    </div>`;
  }

  function homeView() {
    let body = "";
    if (error) {
      body += `<div class="banner banner--error" role="alert">${esc(error)} <button type="button" class="banner__btn" id="retry">Retry</button></div>`;
    }
    if (loading) body += '<div class="skeleton skeleton--hero"></div>';
    if (!loading && items[0]) body += heroCard(items[0]);
    body += bubbles();
    body += `<div class="view__section-head"><h2 class="h2">For you</h2><button type="button" class="link-btn" id="refresh">${loading ? "Loading…" : "Refresh"}</button></div>`;
    body += deckSection();
    return `<div class="view view--home">${topBar()}<div class="view__body">${body}</div></div>`;
  }

  function discoverView() {
    const q = search.trim().toLowerCase();
    const filtered = items.filter((it) => {
      if (tier !== "all" && it.credibility !== tier) return false;
      if (!q) return true;
      return `${it.title} ${it.summary || ""} ${it.source_name}`.toLowerCase().includes(q);
    });
    const chips = ["all", "official", "news", "community"]
      .map((t) => {
        const on = tier === t;
        const lab = t === "all" ? "All" : credLabel(t);
        return `<button type="button" class="chip${on ? " chip--on" : ""}" data-tier="${t}">${esc(lab)}</button>`;
      })
      .join("");
    const list = filtered
      .map(
        (it) => `<li><a class="list-row glass-card" href="${esc(it.url)}" target="_blank" rel="noopener">
        <div class="list-row__top"><span class="${credClass(it.credibility)}">${esc(credLabel(it.credibility))}</span><span class="list-row__time">${esc(formatRelative(it.published_at))}</span></div>
        <span class="list-row__title">${esc(it.title)}</span><span class="list-row__src">${esc(it.source_name)}</span></a></li>`,
      )
      .join("");
    return `<div class="view">${topBar()}<div class="view__body"><h2 class="h2">Discover</h2><p class="sub">Filter by trust tier.</p><div class="chips-row">${chips}</div><ul class="list">${list}</ul>${filtered.length ? "" : '<p class="sub">No matches.</p>'}</div></div>`;
  }

  function feedView() {
    const savedItems = items.filter((it) => isSaved(it.id));
    const q = search.trim().toLowerCase();
    const filtered = q ? savedItems.filter((it) => `${it.title} ${it.source_name}`.toLowerCase().includes(q)) : savedItems;
    const inner =
      filtered.length === 0
        ? `<div class="deck-empty glass-card"><p class="deck-empty__title">Nothing saved yet</p><p class="deck-empty__sub">Save from Home (right swipe or Save).</p></div>`
        : `<ul class="list">${filtered
            .map(
              (it) => `<li><a class="list-row glass-card" href="${esc(it.url)}" target="_blank" rel="noopener">
          <div class="list-row__top"><span class="${credClass(it.credibility)}">${esc(credLabel(it.credibility))}</span><span class="list-row__time">${esc(formatRelative(it.published_at))}</span></div>
          <span class="list-row__title">${esc(it.title)}</span><span class="list-row__src">${esc(it.source_name)}</span></a></li>`,
            )
            .join("")}</ul>`;
    return `<div class="view">${topBar()}<div class="view__body"><h2 class="h2">Saved</h2>${inner}</div></div>`;
  }

  function profileView() {
    const streak = bumpStreak();
    return `<div class="view view--profile"><div class="view__body view__body--profile">
      <div class="profile-hero glass-card"><div class="profile-hero__avatar"></div><div><h2 class="h2 h2--tight">Reader</h2><p class="sub">Curated AI news</p></div></div>
      <div class="stat-pill glass-card"><span class="stat-pill__num">${streak}</span><span class="stat-pill__lbl">day streak</span></div>
      <section class="panel glass-card"><h3 class="h3">Daily digest</h3><p class="sub">UI placeholder.</p><label class="field"><span class="field__lbl">Send at</span><input class="field__input" type="time" value="08:00" /></label></section>
      <section class="panel glass-card"><h3 class="h3">Notifications</h3><label class="toggle"><input type="checkbox" checked /> Breaking</label><label class="toggle"><input type="checkbox" checked /> Digest</label></section>
      <p class="fine-print">No Node required — this UI is served from the Python API at <code>/ui/</code>.</p>
    </div></div>`;
  }

  function render() {
    const app = document.getElementById("app");
    if (!app) return;
    let main = "";
    if (tab === "home") main = homeView();
    else if (tab === "discover") main = discoverView();
    else if (tab === "feed") main = feedView();
    else main = profileView();
    app.innerHTML = `<div class="app-shell">${main}</div>`;

    const qel = document.getElementById("q");
    if (qel) {
      qel.addEventListener("input", () => {
        search = qel.value;
        if (tab === "discover" || tab === "feed") render();
      });
    }
    document.getElementById("refresh")?.addEventListener("click", () => loadFeed());
    document.getElementById("retry")?.addEventListener("click", () => loadFeed());
    document.querySelectorAll("[data-tier]").forEach((b) => {
      b.addEventListener("click", () => {
        tier = b.getAttribute("data-tier") || "all";
        render();
      });
    });
    document.querySelector("[data-skip]")?.addEventListener("click", () => {
      deckIndex = Math.min(deckIndex + 1, items.length);
      render();
    });
    document.querySelector("[data-save]")?.addEventListener("click", () => {
      const id = Number(document.querySelector("[data-card-id]")?.getAttribute("data-card-id"));
      if (id && !isSaved(id)) toggleSave(id);
      deckIndex = Math.min(deckIndex + 1, items.length);
      render();
    });

    let nav = document.getElementById("nav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "nav";
      nav.className = "float-nav";
      nav.setAttribute("aria-label", "Main");
      document.body.appendChild(nav);
    }
    renderNav();
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadFeed();
  });
})();
