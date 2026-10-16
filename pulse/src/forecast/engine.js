import { FACILITY, TIER_LIMITS, HORIZON_HOURS, LIVE_STALE_MINUTES, WEEK_WEIGHTS } from './config';

/**
 * Crowd Forecast engine — pure functions, no React, no storage.
 *
 * Inputs mirror what the Tait McKenzie check-in database can provide (PRD:
 * "no new data sources"):
 *   history: [{ hourStart: ISO string, count: number }]  hourly occupancy
 *   live:    { count: number, asOf: ISO string } | null    latest reading
 *
 * The app computes every number here; the UI only displays it.
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function tierFor(pct) {
  if (pct == null) return null;
  if (pct < TIER_LIMITS.low) return 'low';
  if (pct <= TIER_LIMITS.high) return 'medium';
  return 'high';
}

export function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function isOpen(date, facility = FACILITY) {
  const [open, close] = facility.hours[date.getDay()];
  const h = date.getHours() + date.getMinutes() / 60;
  return h >= open && h < close;
}

/** The next moment the facility opens at or after `date`. */
export function nextOpening(date, facility = FACILITY) {
  for (let i = 0; i < 8; i++) {
    const day = new Date(date);
    day.setDate(day.getDate() + i);
    const [open] = facility.hours[day.getDay()];
    day.setHours(open, 0, 0, 0);
    if (day > date) return day;
  }
  return null;
}

export function floorToHour(date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

const clampPct = (n) => Math.max(0, Math.min(100, n));

/**
 * Weighted historical occupancy (%) for the hour starting at `slotStart`,
 * using the same weekday and hour 1–4 weeks earlier. Returns null when there
 * is no history for that hour.
 */
export function baselinePct(history, slotStart, facility = FACILITY) {
  let sum = 0;
  let weightSum = 0;
  for (const row of history) {
    const t = new Date(row.hourStart);
    if (t.getDay() !== slotStart.getDay() || t.getHours() !== slotStart.getHours()) continue;
    const weeksAgo = Math.round((slotStart - t) / (7 * DAY_MS));
    const w = WEEK_WEIGHTS[weeksAgo - 1];
    if (!w) continue;
    sum += (row.count / facility.capacity) * 100 * w;
    weightSum += w;
  }
  return weightSum ? clampPct(sum / weightSum) : null;
}

/** True if `start`–`start+1h` overlaps any of the student's class blocks. */
export function inClass(start, classBlocks = []) {
  const end = new Date(start.getTime() + HOUR_MS);
  return classBlocks.some((b) => {
    if (b.day !== start.getDay()) return false;
    const [sh, sm] = b.start.split(':').map(Number);
    const [eh, em] = b.end.split(':').map(Number);
    const bStart = new Date(start);
    bStart.setHours(sh, sm, 0, 0);
    const bEnd = new Date(start);
    bEnd.setHours(eh, em, 0, 0);
    return bStart < end && bEnd > start;
  });
}

function liveIsFresh(live, now) {
  if (!live || typeof live.count !== 'number') return false;
  const age = now - new Date(live.asOf);
  return age >= 0 && age <= LIVE_STALE_MINUTES * 60 * 1000;
}

/**
 * Build the forecast shown on screen.
 *
 * Returns:
 *   status      'open' | 'closed'
 *   dataState   'live' | 'historical' | 'unavailable'
 *   model       'weekday' | 'weekend'  (which historical pattern applies)
 *   current     { pct, tier, count, estimate } | null
 *   slots       [{ start, end, pct, tier, closed, inClass }]  (empty when closed
 *               or when no forecast can be made)
 *   best        the quietest open slot outside class time, or null
 *   opensAt     next opening time when closed, else null
 *
 * Guardrails (PRD):
 *   - Closed: no occupancy or forecast is shown, only the next opening time.
 *   - Slots outside operating hours carry no number.
 *   - No live data AND no history: no numbers at all ('unavailable').
 *   - Live data offline but history present: historical estimates, flagged.
 *   - `best` never falls in a class block or outside opening hours.
 */
export function buildForecast({
  now = new Date(),
  history = [],
  live = null,
  classBlocks = [],
  facility = FACILITY,
  horizon = HORIZON_HOURS,
}) {
  const model = isWeekend(now) ? 'weekend' : 'weekday';
  const hasLive = liveIsFresh(live, now);
  const nowBase = baselinePct(history, floorToHour(now), facility);
  const hasHistory = history.length > 0;
  const dataState = hasLive ? 'live' : hasHistory ? 'historical' : 'unavailable';

  const base = { model, dataState };

  if (!isOpen(now, facility)) {
    return { ...base, status: 'closed', current: null, slots: [], best: null, opensAt: nextOpening(now, facility) };
  }
  if (dataState === 'unavailable') {
    return { ...base, status: 'open', current: null, slots: [], best: null, opensAt: null };
  }

  // Current occupancy: the live reading, or the historical estimate when live
  // data is offline. Percentages are rounded before picking a tier so the tier
  // always matches the number on screen (a displayed 75% is Medium, not High).
  let current = null;
  if (hasLive) {
    const pct = Math.round(clampPct((live.count / facility.capacity) * 100));
    current = { pct, tier: tierFor(pct), count: live.count, estimate: false };
  } else if (nowBase != null) {
    const pct = Math.round(nowBase);
    current = {
      pct,
      tier: tierFor(pct),
      count: Math.round((nowBase / 100) * facility.capacity),
      estimate: true,
    };
  }

  // Live deviation from the usual level fades out over the following hours.
  const delta = hasLive && nowBase != null ? current.pct - nowBase : 0;

  const first = floorToHour(now);
  const slots = [];
  for (let k = 0; k < horizon; k++) {
    const start = new Date(first.getTime() + k * HOUR_MS);
    const end = new Date(start.getTime() + HOUR_MS);
    const closed = !isOpen(start, facility);
    let pct = null;
    if (!closed) {
      const b = baselinePct(history, start, facility);
      if (k === 0 && current) pct = current.pct;
      else if (b != null) pct = Math.round(clampPct(b + delta * Math.pow(0.6, k)));
    }
    slots.push({
      start,
      end,
      pct,
      tier: tierFor(pct),
      closed,
      inClass: inClass(start, classBlocks),
    });
  }

  let best = null;
  for (const s of slots) {
    if (s.pct == null || s.closed || s.inClass) continue;
    if (!best || s.pct < best.pct) best = s;
  }

  return { ...base, status: 'open', current, slots, best, opensAt: null };
}
