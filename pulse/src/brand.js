/**
 * Brand configuration for the app.
 *
 * `pulse` is the DEFAULT and must stay the standard look for the book and the
 * deployed Pulse site. `yorku` is an
 * opt-in classroom variant selected at build time with Vite mode `yorku`:
 *
 *   npm run dev:yorku      npm run build:yorku
 *
 * which loads `.env.yorku` (VITE_BRAND=yorku). A plain `npm run dev` / `build`
 * has no VITE_BRAND set and therefore renders Pulse, unchanged.
 *
 * Branding (colors, product name) differs between the two, and York U Fitness
 * also turns on `features`: the Crowd Forecast home screen (our group's MVP,
 * see artifacts) and the light yorku.ca-style theme. Pulse keeps every flag
 * off so the book's standard app is unchanged. The localStorage key for health
 * entries is intentionally shared (see useEntries.js) and is NOT branded.
 */

const BRANDS = {
  pulse: {
    name: 'Pulse',
    accent: '#8B5CF6',        // violet
    accentBright: '#A855F7',  // brighter violet
    accentRGB: '139,92,246',
    accentBrightRGB: '168,85,247',
    surfaceRaised: '#1C1B27',
    tagline: 'Health Tracker',
    features: { crowdForecast: false, light: false },
  },
  yorku: {
    name: 'York U Fitness',
    // York's two web reds (yorku.ca header): the bright band and the dark nav band.
    accent: '#D0343E',        // York bright red — buttons, highlights, glows
    accentBright: '#D0343E',
    accentRGB: '208,52,62',
    accentBrightRGB: '208,52,62',
    accentDeep: '#80170E',    // York dark red — header band, ambient depth
    accentDeepRGB: '128,23,14',
    surfaceRaised: '#1C1B27',
    tagline: 'Crowd Forecast',
    features: { crowdForecast: true, light: true },
  },
};

const key = import.meta.env.VITE_BRAND === 'yorku' ? 'yorku' : 'pulse';

export const brand = BRANDS[key];
export default brand;
