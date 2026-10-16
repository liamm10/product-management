import { describe, it, expect } from 'vitest';
import { buildForecast, tierFor, baselinePct, inClass, floorToHour } from './engine';
import { generateHistory, generateLive } from './mockData';
import { FACILITY, HORIZON_HOURS } from './config';

// Fixed local dates so results don't depend on when tests run.
const TUE_10_15 = new Date(2026, 9, 13, 10, 15); // Tuesday
const WED_23_30 = new Date(2026, 9, 14, 23, 30);
const WED_14_20 = new Date(2026, 9, 14, 14, 20);
const SAT_10_00 = new Date(2026, 9, 17, 10, 0);
const THU_15_10 = new Date(2026, 9, 15, 15, 10);
const MON_13_05 = new Date(2026, 9, 12, 13, 5);

const inputs = (now, opts = {}) => {
  const history = generateHistory(now);
  return { now, history, live: generateLive(now, history, opts) };
};

describe('tierFor', () => {
  it('maps PRD thresholds: <40 low, 40–75 medium, >75 high', () => {
    expect(tierFor(39.9)).toBe('low');
    expect(tierFor(40)).toBe('medium');
    expect(tierFor(75)).toBe('medium');
    expect(tierFor(75.1)).toBe('high');
    expect(tierFor(null)).toBeNull();
  });
});

describe('PRD eval states', () => {
  it('1 · happy path: live occupancy plus an 8-hour forecast', () => {
    const f = buildForecast(inputs(TUE_10_15));
    expect(f.status).toBe('open');
    expect(f.dataState).toBe('live');
    expect(f.current.estimate).toBe(false);
    expect(f.slots).toHaveLength(HORIZON_HOURS);
    expect(f.slots[0].start).toEqual(floorToHour(TUE_10_15));
    for (const s of f.slots.filter((x) => !x.closed)) {
      expect(s.pct).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high']).toContain(s.tier);
    }
  });

  it('2 · closed at 11:30 PM: no occupancy or forecast, shows next opening', () => {
    const f = buildForecast(inputs(WED_23_30));
    expect(f.status).toBe('closed');
    expect(f.current).toBeNull();
    expect(f.slots).toEqual([]);
    expect(f.best).toBeNull();
    expect(f.opensAt).toEqual(new Date(2026, 9, 15, FACILITY.hours[4][0]));
  });

  it('3 · surge spike: tier jumps to High on the next live reading', () => {
    const normal = buildForecast(inputs(WED_14_20));
    expect(normal.current.tier).not.toBe('high');
    const surged = buildForecast(inputs(WED_14_20, { surgePct: 48 }));
    expect(surged.current.tier).toBe('high');
    // The surge also lifts the next hour's forecast, fading after that.
    expect(surged.slots[1].pct).toBeGreaterThan(normal.slots[1].pct);
  });

  it('4 · weekend: Saturday uses weekend history, not weekday class gaps', () => {
    const { history } = inputs(SAT_10_00);
    const f = buildForecast({ now: SAT_10_00, history, live: null });
    expect(f.model).toBe('weekend');
    // The baseline only draws on past Saturdays at the same hour.
    const saturdays = history.filter((r) => {
      const t = new Date(r.hourStart);
      return t.getDay() === 6 && t.getHours() === 10;
    });
    expect(saturdays).toHaveLength(4);
    expect(baselinePct(history, floorToHour(SAT_10_00))).not.toBeNull();
  });

  it('slots outside operating hours carry no number (Saturday closes at 6 PM)', () => {
    const satAfternoon = new Date(2026, 9, 17, 13, 0);
    const f = buildForecast(inputs(satAfternoon));
    const after6 = f.slots.filter((s) => s.start.getHours() >= 18);
    expect(after6.length).toBeGreaterThan(0);
    after6.forEach((s) => {
      expect(s.closed).toBe(true);
      expect(s.pct).toBeNull();
    });
  });

  it('5 · live data offline: historical estimates, clearly flagged, no crash', () => {
    const { history } = inputs(THU_15_10);
    const f = buildForecast({ now: THU_15_10, history, live: null });
    expect(f.dataState).toBe('historical');
    expect(f.current.estimate).toBe(true);
    expect(f.slots.some((s) => s.pct != null)).toBe(true);

    // A stale reading (older than the freshness window) counts as offline too.
    const stale = { count: 200, asOf: new Date(THU_15_10 - 60 * 60 * 1000).toISOString() };
    expect(buildForecast({ now: THU_15_10, history, live: stale }).dataState).toBe('historical');
  });

  it('6 · guardrail: never recommends class time or closed hours', () => {
    const classBlocks = [
      { id: 'a', day: 1, start: '13:00', end: '15:00' },
      { id: 'b', day: 1, start: '17:00', end: '19:00' },
    ];
    const f = buildForecast({ ...inputs(MON_13_05), classBlocks });
    expect(f.best).not.toBeNull();
    expect(f.best.inClass).toBe(false);
    expect(f.best.closed).toBe(false);
    expect(inClass(f.best.start, classBlocks)).toBe(false);
    expect(f.slots.filter((s) => s.inClass).map((s) => s.start.getHours())).toEqual([13, 14, 17, 18]);

    // If every open slot is in class, there is no recommendation at all.
    const allDay = [{ id: 'c', day: 1, start: '07:00', end: '22:00' }];
    expect(buildForecast({ ...inputs(MON_13_05), classBlocks: allDay }).best).toBeNull();
  });
});

describe('acceptance-criteria guardrail', () => {
  it('shows no numbers when both live and historical data are unavailable', () => {
    const f = buildForecast({ now: TUE_10_15, history: [], live: null });
    expect(f.dataState).toBe('unavailable');
    expect(f.current).toBeNull();
    expect(f.slots).toEqual([]);
    expect(f.best).toBeNull();
  });
});

describe('go / no-go: forecast latency', () => {
  it('computes history and forecast well under the 2.0 s bar', () => {
    const t0 = performance.now();
    buildForecast(inputs(TUE_10_15));
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});
