# AI News Swipe — Frontend (optional)

React + Vite + TypeScript UI aligned with [docs/FIGMA_UI_SPEC.md](../docs/FIGMA_UI_SPEC.md): dark gradient, glass surfaces, **floating pill bottom navigation** (active tab = icon + label in inner pill; inactive = icon only), and structured consumption of the FastAPI **`GET /feed`** payload.

**Cannot install Node?** Use the built-in UI served by Python: start the backend and open **http://127.0.0.1:8001/ui/** (see [backend/README.md](../backend/README.md)). No npm required.

## Prerequisites

- Node.js 20+ and npm (or pnpm/yarn), only if you use this Vite project.
- Backend running with CORS enabled (see [backend/README.md](../backend/README.md)), default `http://127.0.0.1:8001`.

## Setup

```bash
cd frontend
npm install
```

## Development

Vite proxies **`/api/*`** to the backend (see `vite.config.ts`). Override target if needed:

```bash
set VITE_API_PROXY_TARGET=http://127.0.0.1:8001
npm run dev
```

Open **http://localhost:5173**. The app fetches **`/api/feed`**, which maps to **`http://127.0.0.1:8001/feed`**.

Ensure the API has data (`POST /ingest` once via `/docs`).

**Logs:** every **`GET /feed`** is printed in the **backend terminal** (uvicorn / `run_dev.bat`). The Vite terminal only shows HMR; it does not mirror API logs. In dev, the **browser DevTools console** logs `[KnowAI] Feed loaded in browser: N items` after each successful fetch.

## Production build

```bash
copy .env.example .env
# Set VITE_API_BASE to your deployed API origin, e.g. https://api.example.com
npm run build
npm run preview
```

## Data model

Types in `src/types/feed.ts` mirror `SwipeCard` / `FeedResponse` from `backend/app/schemas.py`. `src/api/client.ts` validates JSON at runtime before rendering.

## Structure

- `src/api/client.ts` — feed fetch + validation
- `src/components/` — TopBar, Hero, SwipeDeck, tabs, floating nav
- `src/hooks/useSavedVault.ts` — archived story snapshots in `localStorage` (Vault survives feed refresh)
