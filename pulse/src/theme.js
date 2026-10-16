import { createTheme } from '@mui/material/styles';
import { brand } from './brand';

/**
 * Design tokens. Pulse (the default) is a dark, single-accent theme inspired by
 * the book cover: "a quiet control panel at night". York U Fitness is a light
 * theme that follows yorku.ca: white page, grey panels, York's two reds and its
 * charcoal text. The accent colors come from the active brand (see brand.js).
 */

const VIOLET = brand.accent;
const VIOLET_BRIGHT = brand.accentBright;
const BORDER_VIOLET = `rgba(${brand.accentRGB},0.22)`;
const GLOW_VIOLET = `rgba(${brand.accentBrightRGB},0.30)`;

// York U Fitness: light yorku.ca look. Every value below was checked for WCAG AA
// on white (#FFFFFF) and on the grey panel (#EAEAEC): text >= 4.5:1, borders,
// bars and focus rings >= 3:1. Pulse keeps its original dark values.
const YORK = Boolean(brand.features.light);
const C = YORK
  ? {
    page: '#FFFFFF',
    panel: '#EAEAEC',          // yorku.ca "My Account" panel
    dialog: '#FFFFFF',
    text: '#343045',           // yorku.ca charcoal (10.6:1 on panel)
    textSecondary: '#55515F',  // 6.4:1 on panel
    divider: 'rgba(52,48,69,0.16)',
    fieldBorder: '#9A6560',    // muted York red; >= 3.9:1 on white and panel (WCAG 1.4.11)
    focusRing: brand.accentDeep, // dark red; 8.5:1+ on white and panel
    accentText: brand.accentDeep, // York dark red for red text (8.5:1 on panel)
    tooltip: '#343045',
    tooltipText: '#FFFFFF',
    navUnselected: 'rgba(255,255,255,0.80)', // on the dark-red header (7:1)
    navSelected: '#FFFFFF',
    bottomNav: '#FFFFFF',
    bottomNavUnselected: '#55515F',
    bottomNavSelected: brand.accentDeep,
  }
  : {
    page: '#0A0A0F',
    panel: '#14141C',
    dialog: '#1C1B27',
    text: '#F5F5FA',
    textSecondary: '#8E8EA0',
    divider: BORDER_VIOLET,
    fieldBorder: BORDER_VIOLET,
    focusRing: VIOLET,
    accentText: VIOLET_BRIGHT,
    tooltip: '#1C1B27',
    tooltipText: '#F5F5FA',
    navUnselected: '#8E8EA0',
    navSelected: VIOLET_BRIGHT,
    bottomNav: '#14141C',
    bottomNavUnselected: '#8E8EA0',
    bottomNavSelected: VIOLET_BRIGHT,
  };

// When to use the phone layout (bottom nav). York also treats a phone turned
// sideways (short and wide) as a phone, so all tabs stay reachable.
export const MOBILE_QUERY = YORK ? '(max-width:600px), (max-height:500px)' : '(max-width:600px)';

const theme = createTheme({
  palette: {
    mode: YORK ? 'light' : 'dark',
    background: {
      default: C.page,
      paper: YORK ? C.page : C.panel,
    },
    primary: {
      main: VIOLET,
      light: VIOLET_BRIGHT,
      ...(YORK && { dark: brand.accentDeep, contrastText: '#FFFFFF' }),
    },
    text: {
      primary: C.text,
      secondary: C.textSecondary,
    },
    divider: C.divider,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    subtitle1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.06em',
    },
    button: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.08em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: YORK
          ? { backgroundColor: C.page, backgroundImage: 'none' }
          : {
            backgroundColor: '#0A0A0F',
            // Subtle circuit-grid background
            backgroundImage: `
              linear-gradient(${BORDER_VIOLET} 1px, transparent 1px),
              linear-gradient(90deg, ${BORDER_VIOLET} 1px, transparent 1px),
              radial-gradient(ellipse at 0% 100%, ${GLOW_VIOLET} 0%, transparent 50%)
            `,
            backgroundSize: '60px 60px, 60px 60px, 100% 100%',
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed',
          },
      },
    },
    MuiCard: {
      styleOverrides: {
        // York: flat grey panels like yorku.ca, no glow.
        root: YORK
          ? { backgroundColor: C.panel, border: 'none', borderRadius: 4, boxShadow: 'none' }
          : {
            backgroundColor: '#14141C',
            border: `1px solid ${BORDER_VIOLET}`,
            borderRadius: 12,
            boxShadow: `0 0 24px rgba(${brand.accentBrightRGB},0.12)`,
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            '&:hover': {
              boxShadow: `0 0 32px rgba(${brand.accentBrightRGB},0.20)`,
              borderColor: `rgba(${brand.accentRGB},0.40)`,
            },
          },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: YORK ? 4 : 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        },
        contained: YORK
          ? { boxShadow: 'none', '&:hover': { boxShadow: 'none', backgroundColor: brand.accentDeep } }
          : {
            boxShadow: `0 0 16px rgba(${brand.accentBrightRGB},0.20)`,
            '&:hover': {
              boxShadow: `0 0 24px rgba(${brand.accentBrightRGB},0.35)`,
            },
          },
        outlined: {
          borderColor: YORK ? C.fieldBorder : BORDER_VIOLET,
          ...(YORK && { color: C.accentText }),
          '&:hover': {
            borderColor: YORK ? C.accentText : VIOLET,
            backgroundColor: `rgba(${brand.accentRGB},0.08)`,
          },
        },
        ...(YORK && { text: { color: C.accentText } }),
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        // Strong, visible keyboard focus ring (York).
        root: YORK
          ? { '&.Mui-focusVisible': { outline: `2px solid ${C.focusRing}`, outlineOffset: 2 } }
          : {},
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: C.bottomNav,
          borderTop: `1px solid ${C.divider}`,
          ...(YORK && { height: 64 }),
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: C.bottomNavUnselected,
          '&.Mui-selected': {
            color: C.bottomNavSelected,
          },
          ...(YORK && { overflow: 'hidden' }),
        },
        // York, large text settings: shorten labels with "…" instead of overlapping.
        ...(YORK && { label: { maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: C.navUnselected,
          '&.Mui-selected': {
            color: C.navSelected,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: C.navSelected,
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: C.fieldBorder,
            },
            '&:hover fieldset': {
              borderColor: YORK ? C.focusRing : VIOLET,
            },
            ...(YORK && { '&.Mui-focused:not(.Mui-error) fieldset': { borderColor: C.focusRing } }),
            ...(YORK && { backgroundColor: '#FFFFFF' }),
          },
        },
      },
    },
    ...(YORK && {
      // Toggles (test states, filters): flat, white, with York red for the selected one.
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            borderColor: C.fieldBorder,
            backgroundColor: '#FFFFFF',
            color: C.textSecondary,
            '&:hover': { backgroundColor: `rgba(${brand.accentRGB},0.08)` },
            '&.Mui-selected': {
              backgroundColor: brand.accent,
              borderColor: brand.accent,
              color: '#FFFFFF',
              '&:hover': { backgroundColor: brand.accentDeep },
            },
          },
        },
      },
    }),
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: C.dialog,
          border: `1px solid ${C.divider}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: C.tooltip,
          border: `1px solid ${C.divider}`,
          color: C.tooltipText,
        },
      },
    },
    ...(YORK && {
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 4 } },
      },
    }),
  },
});

// Export design tokens for use in components (e.g. Recharts)
export const tokens = {
  violet: VIOLET,
  violetBright: VIOLET_BRIGHT,
  borderViolet: BORDER_VIOLET,
  glowViolet: GLOW_VIOLET,
  accentRGB: brand.accentRGB,
  accentBrightRGB: brand.accentBrightRGB,
  accentDim08: `rgba(${brand.accentRGB},0.08)`,
  accentDim12: `rgba(${brand.accentRGB},0.12)`,
  accentDim15: `rgba(${brand.accentRGB},0.15)`,
  accentBorder40: `rgba(${brand.accentRGB},0.40)`,
  // Red/violet used as small text (chips, labels). York: dark red, AA on white.
  accentText: C.accentText,
  surfaceRaised: YORK ? C.dialog : brand.surfaceRaised,
  page: C.page,
  text: C.text,
  textSecondary: C.textSecondary,
  focusRing: YORK ? C.focusRing : '#FFFFFF',
  controlBorder: YORK ? C.fieldBorder : 'rgba(255,255,255,0.45)', // toggles, chips (>= 3:1)
  chartGrid: YORK ? 'rgba(52,48,69,0.08)' : 'rgba(255,255,255,0.05)',
  chartAxis: C.textSecondary,
  chartLabel: C.text,
  chartReference: YORK ? 'rgba(52,48,69,0.5)' : 'rgba(255,255,255,0.4)',
  chartBarTrack: YORK ? '#FFFFFF' : 'rgba(255,255,255,0.04)',
  chartGradientStart: `rgba(${brand.accentBrightRGB},0.35)`,
  chartGradientEnd: `rgba(${brand.accentBrightRGB},0)`,
  // York: the header is yorku.ca's dark-red nav band, with a bright-red stripe on top.
  headerSurface: YORK
    ? { backgroundColor: brand.accentDeep, borderTop: `4px solid ${brand.accent}` }
    : { backgroundColor: 'rgba(20,20,28,0.85)', backdropFilter: 'blur(12px)' },
  headerBorder: YORK ? brand.accentDeep : BORDER_VIOLET,
  // York: flat corners like yorku.ca; Pulse keeps its rounded pills.
  pillRadius: YORK ? '4px' : '999px',
  toggleRadius: YORK ? '4px' : '10px',
  toggleBorder: YORK ? C.fieldBorder : 'divider',
  // Inset surfaces inside cards (gauge track, detail panels, pills).
  // York: white insets on the grey panel, like yorku.ca's white fields.
  glassInset: YORK ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
  glassBorder: YORK ? 'rgba(128,23,14,0.22)' : 'rgba(255,255,255,0.10)',
  // Crowd traffic tiers (PRD: green / yellow / red, high contrast). Always
  // paired with a text label so color is never the only signal. York uses
  // darker shades so bars clear 3:1 on the grey panel.
  tier: YORK
    ? { low: '#047857', medium: '#B45309', high: '#B42318' }
    : { low: '#34D399', medium: '#FBBF24', high: '#FF5C70' },
  // Text-safe variants for tier labels on tinted chips (>= 4.5:1).
  tierText: YORK
    ? { low: '#065F46', medium: '#92400E', high: '#912018' }
    : { low: '#34D399', medium: '#FBBF24', high: '#FF8796' },
};

export default theme;
