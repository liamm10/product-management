# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

This is an **educational repository** for the textbook *Practical Product Management in the Age of AI* by Guinevere Orvis. It is **not a commercial product**. The running case study is **Pulse**, a deliberately minimal personal health tracker that students clone, study, and extend as they work through the book.

Readers and students fork this repo to their own GitHub account and work there. 

## Repository layout

This is a single repo with an example app alongside book materials. Folder structure:

| Folder | Contents |
|--------|----------|
| `pulse/` | **The Pulse web app** (React + Vite). All app development happens here. |
| `artifacts/` | Product-file templates & examples (the book's deliverables) |
| `artifacts/examples/` | Completed reference examples (PRDs, labs, diagrams) |
| `artifacts/labs/` | Blank lab templates, one per chapter |
| `artifacts/data/` | Sample datasets (e.g. `1week.md`, `2week.md`) for lab prototyping, standing in for real backend data |
| `prompts/` | Versioned prompt files used in the book |



## Commands

All app commands run from the `pulse/` directory:

```bash
cd pulse
npm install        # install dependencies
npm run dev        # Vite dev server — http://localhost:5173/product-management/pulse/
npm run build      # production build to pulse/dist/
npm run preview    # serve the production build locally
npm run lint       # ESLint (flat config in eslint.config.js)
npm test           # Vitest, run once (npm run test:watch to watch)

npm run dev:yorku    # dev server, York U Fitness class branding (red)
npm run build:yorku  # production build, York U Fitness branding
```

The plain `dev`/`build` scripts render **Pulse** (the default, standard look for the book). The `:yorku` scripts render the **York U Fitness** class variant. See the Branding section below.

Tests use **Vitest** + jsdom + React Testing Library and live next to the code they cover (`*.test.js`). `vitest.setup.js` points the global `localStorage` at jsdom's, because Node 22+ ships its own that shadows it. Run `npm run lint && npm test` before committing; CI runs both before building.

## Deployment

`pulse/` is built and deployed to GitHub Pages automatically by `.github/workflows/deploy.yml` on every push to `main`. The workflow runs `npm ci`, `npm run lint`, `npm test` and `npm run build` inside `pulse/` and publishes `pulse/dist`. It then also runs `npm run build:yorku`, which (via the mode-aware `vite.config.js`) outputs the York U Fitness class variant into `dist/pulse/yorku`, so it deploys alongside Pulse. Result: Pulse serves at `…/pulse/` and York U Fitness at `…/pulse/yorku/`. Build order matters — Pulse first, then York, since the York output nests inside the Pulse `outDir`.

Because GitHub Pages serves this fork at `https://liamm10.github.io/product-management/`, `vite.config.js` sets `base` to `/<repo>/pulse/`, reading the repo name from `GITHUB_REPOSITORY` in CI and falling back to `product-management` locally. Keep this in mind for any asset paths or links — the dev server and the deployed site both live under `/pulse/`.

## Architecture

The app is a small client-only SPA. There is **no backend, no database, and no accounts** — everything lives in the browser.

- **Entry point** — `src/main.jsx` mounts `<App>` inside MUI's `ThemeProvider` + `CssBaseline`, and loads the Space Grotesk / Inter web fonts.
- **`src/App.jsx`** is the root. There is **no router**: navigation is plain view-index state (`0=Dashboard`, `1=Log`, `2=History`) so the app works on GitHub Pages without server-side routing. App also owns the Settings dialog and edit/quick-add flows.
- **`src/hooks/useEntries.js`** is the single source of truth for data. It exposes `{ entries, add, update, remove, clearAll, loadSampleData }`, backed by `localStorage` under the key `pulse.entries`. On first run (or corrupted storage) it auto-loads generated sample data. **Route all entry mutations through this hook** — don't touch `localStorage` directly elsewhere.
- **`src/data/seed.js`** generates ~14 days of realistic sample entries with timestamps relative to today, so charts always look populated.
- **`src/components/`** — presentational/feature components: `Nav` (responsive Tabs on desktop, `BottomNavigation` on mobile via `useMediaQuery('(max-width:600px)')`), `Dashboard`, `LogForm`, `History`, `MetricCard`, `TrendChart`, `PulseLine`.
- **`src/brand.js`** — brand configuration (product name + accent colors). Exports the active `brand`, chosen by `import.meta.env.VITE_BRAND`, defaulting to `pulse`. `theme.js` derives its accent/palette tokens from it, so all UI color flows from the selected brand.

### Branding (Pulse vs York U Fitness)

One codebase serves two brands. **Pulse is the default and must stay so** — it's the standard look for the book and the deployed GitHub Pages site. **York U Fitness** is an opt-in red-branded variant for the York University course, selected with Vite mode `yorku` (`npm run dev:yorku` / `build:yorku`; `.env.yorku` sets `VITE_BRAND=yorku`). Only branding differs — colors and the product name — there are no feature or data differences, and the `localStorage` key (`pulse.entries`) is intentionally shared. When adding UI color, pull from the theme tokens / `brand.js` rather than hardcoding hex values, so both variants stay consistent. Never change the default (unset `VITE_BRAND`) away from Pulse.

### Crowd Forecast (York U Fitness only)

Our group's MVP (Must-have, top RICE score). It's the York U Fitness home screen, switched on by `brand.features.crowdForecast`; Pulse never shows it. `brand.features.light` turns on the light yorku.ca-style theme in `theme.js`: white page, grey `#EAEAEC` panels, charcoal `#343045` text, York bright red `#D0343E` and dark red `#80170E` (header band). All York colors are WCAG AA-checked on white and on the grey panel; use the `tokens` (e.g. `tokens.accentText`, `tokens.chartAxis`, `tokens.focusRing`) rather than hardcoding colors so both brands stay correct.

- `src/forecast/engine.js` — pure forecast logic (`buildForecast`, tiers, opening hours, class-time overlap). All numbers are computed here; components only display them. PRD guardrails are enforced here, so put new guardrail logic here too.
- `src/forecast/config.js` — facility capacity, opening hours, tier limits (Low < 40%, Medium 40–75%, High > 75%), refresh interval. Capacity and hours are **placeholders** until confirmed with York Athletics.
- `src/forecast/mockData.js` — simulated check-in history and live readings (seeded). This is the seam for real data: replace `generateHistory` / `generateLive` with reads from the Tait McKenzie check-in database.
- `src/forecast/scenarios.js` — the PRD's six eval states plus "no data", selectable in the UI under "Prototype test states".
- `src/forecast/engine.test.js` — one test per eval state. Keep these passing; they are the go/no-go bar.
- `src/hooks/useCrowdForecast.js` (feeds the engine, refreshes every 30s) and `src/hooks/useClassBlocks.js` (manual class times in localStorage under `yorku.classBlocks`).
- UI lives in `src/components/forecast/`. Tier colors come from `tokens.tier` and are always paired with a text label.

Out of scope per the PRD: push alerts, per-machine availability, calendar sync, streaks, gym buddy.

### Entry data model

Every record (sample or user-created) has this structure:

```js
{
  id,          // uuid (from the `uuid` package)
  type,        // 'food' | 'steps' | 'water' | 'sleep'
  value,       // number
  unit,        // 'kcal' | 'steps' | 'ml' | 'hours'
  note,        // string (free text, e.g. meal name)
  timestamp,   // ISO 8601 string
}
```

The four `type` values (food, steps, water, sleep) are the core domain. Any feature touching entries should handle all four consistently.

## UI / styling conventions

- Use **React** and **Material UI (MUI v6)** for all UI. Build with MUI components rather than hand-rolled HTML/CSS, and use MUI's `sx` prop / theme for styling.
- Charts use **Recharts**. Pull colors from the design tokens exported by `src/theme.js` (`import { tokens } from '../theme'`) so charts match the theme.
- The look is a **dark, mono-violet theme** ("a quiet control panel at night") defined centrally in `src/theme.js`. Headings use **Space Grotesk** (uppercase, letter-spaced); body uses **Inter**. Add or change visual styling through the theme, not scattered inline overrides, so the aesthetic stays consistent.
- Respect accessibility cues already in place — e.g. `prefers-reduced-motion` gates the logo animation, and interactive elements carry `aria-label`s and stable `id`s.

## Contributing conventions

- Work happens off `main`; the GitHub Pages deploy triggers on merge to `main`.
- **Do not add AI/assistant attribution** to commits, PR descriptions, or code comments (no "Generated with…" / "Co-Authored-By" assistant lines).