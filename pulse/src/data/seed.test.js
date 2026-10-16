import { describe, it, expect } from 'vitest';
import generateSeedData from './seed';

const UNITS = { food: 'kcal', steps: 'steps', water: 'ml', sleep: 'hours' };

describe('generateSeedData', () => {
  const entries = generateSeedData();

  it('covers 14 days and all four types', () => {
    const days = new Set(entries.map((e) => e.timestamp.slice(0, 10)));
    expect(days.size).toBe(14);
    expect(new Set(entries.map((e) => e.type))).toEqual(new Set(Object.keys(UNITS)));
  });

  it('matches the entry data model', () => {
    for (const e of entries) {
      expect(typeof e.id).toBe('string');
      expect(UNITS[e.type]).toBe(e.unit);
      expect(Number.isFinite(e.value)).toBe(true);
      expect(typeof e.note).toBe('string');
      expect(Number.isNaN(Date.parse(e.timestamp))).toBe(false);
    }
  });
});
