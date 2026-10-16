import { FACILITY } from './config';
import { isOpen, floorToHour, baselinePct } from './engine';

/**
 * Simulated check-in data for the prototype.
 *
 * The real app would read hourly occupancy from the Tait McKenzie check-in
 * database (read-only). We don't have access to it, so this module generates
 * 4 weeks of believable history with a fixed random seed. Swap
 * `fetchHistory` / `fetchLive` for real queries and nothing else changes.
 */

// Typical occupancy (% of capacity) by hour. Weekdays follow class gaps:
// a lunch bump and a 4–7 PM peak. Weekends peak late morning.
const WEEKDAY_CURVE = {
  7: 18, 8: 26, 9: 30, 10: 34, 11: 42, 12: 58, 13: 52, 14: 38,
  15: 46, 16: 70, 17: 86, 18: 82, 19: 66, 20: 44, 21: 26,
};
const WEEKEND_CURVE = {
  9: 22, 10: 40, 11: 54, 12: 56, 13: 48, 14: 40, 15: 34, 16: 28, 17: 18,
};

// Small deterministic PRNG so the same day always yields the same history.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function typicalPct(date) {
  const day = date.getDay();
  const curve = day === 0 || day === 6 ? WEEKEND_CURVE : WEEKDAY_CURVE;
  // Fridays are quieter in the evening.
  const fridayDip = day === 5 && date.getHours() >= 16 ? 0.75 : 1;
  return (curve[date.getHours()] ?? 15) * fridayDip;
}

/** 28 days of hourly occupancy before `now`, open hours only. */
export function generateHistory(now = new Date(), facility = FACILITY) {
  const start = floorToHour(now);
  start.setDate(start.getDate() - 28);
  start.setHours(0);
  const rand = mulberry32(start.getFullYear() * 1000 + start.getMonth() * 40 + start.getDate());
  const rows = [];
  for (let t = new Date(start); t < floorToHour(now); t.setHours(t.getHours() + 1)) {
    if (!isOpen(t, facility)) continue;
    const daysAgo = (now - t) / 86_400_000;
    const trend = 1 + (28 - daysAgo) * 0.004; // recent weeks slightly busier
    const noise = (rand() - 0.5) * 12;
    const pct = Math.max(2, Math.min(100, typicalPct(t) * trend + noise));
    rows.push({ hourStart: t.toISOString(), count: Math.round((pct / 100) * facility.capacity) });
  }
  return rows;
}

/** A live reading near the usual level for `now`, offset by `surgePct` points. */
export function generateLive(now, history, { surgePct = 0, facility = FACILITY } = {}) {
  if (!isOpen(now, facility)) return { count: 0, asOf: now.toISOString() };
  const base = baselinePct(history, floorToHour(now), facility) ?? typicalPct(now);
  const wobble = Math.sin(now.getMinutes() / 9) * 3;
  const pct = Math.max(0, Math.min(100, base + wobble + surgePct));
  return { count: Math.round((pct / 100) * facility.capacity), asOf: now.toISOString() };
}
