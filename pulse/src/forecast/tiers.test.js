import { describe, it, expect } from 'vitest';
import { tierFor, buildForecast } from './engine';
import { FACILITY, TIER_LIMITS } from './config';

// PRD: Low < 40%, Medium 40-75%, High > 75%. The engine treats 40 as Medium
// and 75 as Medium (inclusive), and 76 as High. That matches the PRD wording.
const { low, high } = TIER_LIMITS;

describe('tierFor boundaries (driven by TIER_LIMITS)', () => {
  it.each([
    ['0% (empty)', 0, 'low'],
    ['one point under the low limit (39)', low - 1, 'low'],
    ['just under the low limit', low - 0.01, 'low'],
    ['exactly the low limit (40)', low, 'medium'],
    ['just over the low limit', low + 0.01, 'medium'],
    ['mid Medium', (low + high) / 2, 'medium'],
    ['exactly the high limit (75)', high, 'medium'],
    ['just over the high limit', high + 0.01, 'high'],
    ['one point over the high limit (76)', high + 1, 'high'],
    ['100% (full)', 100, 'high'],
  ])('%s -> %s', (_name, pct, tier) => {
    expect(tierFor(pct)).toBe(tier);
  });

  it('pins the PRD numbers themselves so a config change is noticed', () => {
    expect(TIER_LIMITS).toEqual({ low: 40, high: 75 });
  });

  it('returns null for missing readings', () => {
    expect(tierFor(null)).toBeNull();
    expect(tierFor(undefined)).toBeNull();
  });

  it('does not throw on non-numeric input', () => {
    expect(() => tierFor('abc')).not.toThrow();
    expect(() => tierFor(NaN)).not.toThrow();
  });
});

// A mid-day moment when the facility is open (Tuesday 10:15 AM).
const NOW = new Date(2026, 9, 13, 10, 15);
const liveAt = (count) => ({ count, asOf: NOW.toISOString() });
// Use a 1000-spot facility so integer counts hit exact percentages.
const BIG = { ...FACILITY, capacity: 1000 };
const currentFor = (count, facility = BIG) =>
  buildForecast({ now: NOW, history: [], live: liveAt(count), facility }).current;

describe('tier boundaries through buildForecast (live reading)', () => {
  it.each([
    [0, 'low'],
    [low * 10 - 10, 'low'], // 39%
    [low * 10, 'medium'], // 40%
    [high * 10, 'medium'], // 75%
    [high * 10 + 10, 'high'], // 76%
    [1000, 'high'], // 100%
  ])('count %i of 1000 -> %s', (count, tier) => {
    expect(currentFor(count).tier).toBe(tier);
  });

  it('uses the configured capacity: exact boundary counts at the real capacity', () => {
    const cap = FACILITY.capacity;
    const at = (pct) => buildForecast({ now: NOW, history: [], live: liveAt((cap * pct) / 100) }).current;
    expect(at(0).tier).toBe('low');
    expect(at(low).tier).toBe('medium');
    expect(at(high).tier).toBe('medium');
    expect(at(100).tier).toBe('high');
  });

  it('clamps readings above capacity to 100% (High)', () => {
    const c = currentFor(5000);
    expect(c.pct).toBe(100);
    expect(c.tier).toBe('high');
  });

  it('clamps negative readings to 0% (Low)', () => {
    const c = currentFor(-5);
    expect(c.pct).toBe(0);
    expect(c.tier).toBe('low');
  });

  // The engine rounds before picking a tier, so a true 75.4% shows "75%" and is
  // Medium, and a true 39.6% shows "40%" and is Medium.
  it('tier agrees with the displayed (rounded) percentage', () => {
    const c = currentFor(754);
    expect(Math.round(c.pct)).toBe(75);
    expect(c.tier).toBe('medium');
    const d = currentFor(396);
    expect(Math.round(d.pct)).toBe(40);
    expect(d.tier).toBe('medium');
  });
});
