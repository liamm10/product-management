import { describe, it, expect } from 'vitest';
import { hourLabel, rangeLabel, timeLabel, dayTimeLabel, clockLabel } from './format';

const at = (h, m = 0) => new Date(2026, 9, 14, h, m); // a Wednesday

describe('format helpers', () => {
  it('labels midnight and noon correctly (12 AM / 12 PM)', () => {
    expect(hourLabel(at(0))).toBe('12 AM');
    expect(hourLabel(at(12))).toBe('12 PM');
    expect(hourLabel(at(13))).toBe('1 PM');
  });

  it('collapses the meridiem in a same-half-day range and keeps it across noon', () => {
    expect(rangeLabel(at(9), at(10))).toBe('9–10 AM');
    expect(rangeLabel(at(11), at(12))).toBe('11 AM–12 PM');
    expect(rangeLabel(at(13), at(14))).toBe('1–2 PM');
  });

  it('formats clock times with padded minutes', () => {
    expect(timeLabel(at(10, 5))).toBe('10:05 AM');
    expect(dayTimeLabel(at(15, 10))).toBe('Wed 3:10 PM');
  });

  it('formats HH:MM strings, dropping :00', () => {
    expect(clockLabel('13:00')).toBe('1 PM');
    expect(clockLabel('13:30')).toBe('1:30 PM');
    expect(clockLabel('00:15')).toBe('12:15 AM');
  });
});
