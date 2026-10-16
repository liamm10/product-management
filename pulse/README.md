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

Both serve at the same address, so run one at a time. Tell them apart by color: violet = Pulse, red = York U Fitness. The only difference between the two is branding (colors and the product name) — no feature or data differences. Branding lives in `src/brand.js`; the York variant is selected by Vite mode `yorku` (`.env.yorku` sets `VITE_BRAND=yorku`). A plain `npm run dev`/`build` sets nothing, so it renders Pulse.

Both variants are also deployed to GitHub Pages from the same workflow:

- Pulse — https://liamm10.github.io/product-management/pulse/
- York U Fitness — https://liamm10.github.io/product-management/pulse/yorku/

## Production build

```bash
npm run build
```

Output goes to `dist/`. The build is deployed to GitHub Pages automatically via the workflow in `.github/workflows/deploy.yml`.
