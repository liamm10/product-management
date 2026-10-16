# Pulse

The web app for the textbook. Built with React + Vite, MUI, and Recharts.

## Development

```bash
npm install
npm run dev
```

## Branding: Pulse and the York U Fitness class variant

One codebase ships two brands, chosen by a build flag. **Pulse is the default** — the standard look used by the book and the deployed site. **York U Fitness** is a red-branded variant for the York University course.

```bash
npm run dev          # Pulse (violet) — the default
npm run dev:yorku    # York U Fitness (red)
npm run build        # Pulse production build
npm run build:yorku  # York U Fitness production build
```

Both serve at the same address, so run one at a time. Tell them apart by color: violet = Pulse, red = York U Fitness. York U Fitness also adds the Crowd Forecast home screen (our group's MVP) and a light yorku.ca-style theme; Pulse is unchanged. Branding lives in `src/brand.js`; the York variant is selected by Vite mode `yorku` (`.env.yorku` sets `VITE_BRAND=yorku`). A plain `npm run dev`/`build` sets nothing, so it renders Pulse.

The York U Fitness prototype is shared as a Bolt project (see the top-level README), not through GitHub Pages.

## Production build

```bash
npm run build
```

Output goes to `dist/`. The build is deployed to GitHub Pages automatically via the workflow in `.github/workflows/deploy.yml`.
