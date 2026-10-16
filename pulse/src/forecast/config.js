/**
 * Facility configuration for Crowd Forecast.
 *
 * PLACEHOLDERS: capacity and operating hours below are prototype values, not
 * confirmed York Athletics numbers. Replace them with the official figures
 * before anyone relies on the forecast.
 */
export const FACILITY = {
  name: 'Tait McKenzie Fitness Centre',
  shortName: 'Tait McKenzie',
  capacity: 220,
  // Opening hours per day of week (0 = Sunday … 6 = Saturday), as
  // [openHour, closeHour) in local 24h time.
  hours: {
    0: [9, 18],
    1: [7, 22],
    2: [7, 22],
    3: [7, 22],
    4: [7, 22],
    5: [7, 22],
    6: [9, 18],
  },
};

// Traffic tiers from the PRD: Low < 40%, Medium 40–75%, High > 75%.
export const TIER_LIMITS = { low: 40, high: 75 };

// How many hourly slots the forecast covers (PRD: next 8 hours).
export const HORIZON_HOURS = 8;

// Live readings older than this are treated as "live data offline".
export const LIVE_STALE_MINUTES = 15;

// The UI refreshes live occupancy this often. PRD eval 3 requires a surge to
// show as High within 60 seconds, so this must stay well under 60s.
export const REFRESH_MS = 30_000;

// Weights for the same weekday/hour 1, 2, 3 and 4 weeks ago (recent weeks
// count more). PRD: "historical hourly baselines weighted by recent 4-week trend".
export const WEEK_WEIGHTS = [0.4, 0.3, 0.2, 0.1];
