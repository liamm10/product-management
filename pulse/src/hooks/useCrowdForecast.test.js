import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useCrowdForecast from './useCrowdForecast';
import { SCENARIOS } from '../forecast/scenarios';
import { REFRESH_MS, HORIZON_HOURS, FACILITY } from '../forecast/config';

// A fixed "today" (a Monday, mid-afternoon) so scenario dates are stable.
const TODAY = new Date(2026, 9, 12, 12, 0);
const userBlocks = [{ id: 'u1', day: 3, start: '09:00', end: '10:00' }];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});
afterEach(() => vi.useRealTimers());

const run = (key, blocks = userBlocks) => renderHook(({ k, b }) => useCrowdForecast(k, b), { initialProps: { k: key, b: blocks } });

describe('useCrowdForecast scenarios', () => {
  it('happy: open, live, full-horizon forecast at the scenario clock', () => {
    const { result } = run('happy');
    const { forecast, now, scenario } = result.current;
    expect(scenario.key).toBe('happy');
    expect(now.getDay()).toBe(2); // Tuesday
    expect(forecast.status).toBe('open');
    expect(forecast.dataState).toBe('live');
    expect(forecast.slots).toHaveLength(HORIZON_HOURS);
  });

  it('closed: no current reading and no slots', () => {
    const { forecast } = run('closed').result.current;
    expect(forecast.status).toBe('closed');
    expect(forecast.current).toBeNull();
    expect(forecast.slots).toEqual([]);
  });

  it('weekend: uses the weekend model', () => {
    expect(run('weekend').result.current.forecast.model).toBe('weekend');
  });

  it('offline: historical estimates, not live', () => {
    const { forecast } = run('offline').result.current;
    expect(forecast.dataState).toBe('historical');
    expect(forecast.current.estimate).toBe(true);
  });

  it('nodata: unavailable, nothing to show', () => {
    const { forecast } = run('nodata').result.current;
    expect(forecast.dataState).toBe('unavailable');
    expect(forecast.current).toBeNull();
    expect(forecast.slots).toEqual([]);
  });

  it('every scenario produces a forecast without throwing', () => {
    for (const s of SCENARIOS) {
      expect(() => run(s.key)).not.toThrow();
    }
  });

  it('unknown scenario key falls back to the real-clock scenario', () => {
    const { result } = run('does-not-exist');
    expect(result.current.scenario.key).toBe('real');
    expect(result.current.now.getTime()).toBe(TODAY.getTime());
  });
});

describe('useCrowdForecast class blocks', () => {
  it('guardrail scenario uses its own demo classes, not the student\'s', () => {
    const { result } = run('guardrail');
    expect(result.current.demoClasses).toBe(true);
    expect(result.current.classBlocks).not.toBe(userBlocks);
    expect(result.current.classBlocks.length).toBeGreaterThan(0);
    const { best } = result.current.forecast;
    expect(best.inClass).toBe(false);
  });

  it('other scenarios pass the student\'s blocks through', () => {
    const { result } = run('happy');
    expect(result.current.demoClasses).toBe(false);
    expect(result.current.classBlocks).toBe(userBlocks);
  });

  it('re-computes when the student\'s class blocks change', () => {
    // Tuesday 10:15: block the whole open day and the recommendation disappears.
    const { result, rerender } = run('happy', []);
    expect(result.current.forecast.best).not.toBeNull();
    const [open, close] = FACILITY.hours[2];
    const all = [{ id: 'all', day: 2, start: `${String(open).padStart(2, '0')}:00`, end: `${close}:00` }];
    rerender({ k: 'happy', b: all });
    expect(result.current.forecast.best).toBeNull();
  });
});

describe('useCrowdForecast refresh and timers', () => {
  it('real scenario follows the system clock and refreshes updatedAt every REFRESH_MS', () => {
    const { result } = run('real');
    const first = result.current.updatedAt.getTime();
    expect(first).toBe(TODAY.getTime());
    act(() => vi.advanceTimersByTime(REFRESH_MS));
    expect(result.current.updatedAt.getTime()).toBe(first + REFRESH_MS);
  });

  it('refreshes well inside the PRD 60-second surge window', () => {
    expect(REFRESH_MS).toBeLessThan(60_000);
  });

  it('surge: not High at first, High once the burst of check-ins arrives', () => {
    const { result } = run('surge');
    expect(result.current.forecast.current.tier).not.toBe('high');
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.forecast.current.tier).toBe('high');
  });

  it('switching to surge restarts its delay', () => {
    const { result, rerender } = run('happy');
    act(() => vi.advanceTimersByTime(10_000));
    rerender({ k: 'surge', b: userBlocks });
    expect(result.current.forecast.current.tier).not.toBe('high');
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.forecast.current.tier).toBe('high');
  });

  it('clears its timers on unmount', () => {
    const { unmount } = run('surge');
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
