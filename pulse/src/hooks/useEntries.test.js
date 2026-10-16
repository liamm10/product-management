import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useEntries from './useEntries';

const KEY = 'pulse.entries';
const stored = () => JSON.parse(localStorage.getItem(KEY));

describe('useEntries', () => {
  beforeEach(() => localStorage.clear());

  it('seeds sample data on first run', () => {
    const { result } = renderHook(() => useEntries());
    expect(result.current.entries.length).toBeGreaterThan(0);
    expect(stored()).toHaveLength(result.current.entries.length);
  });

  it('loads existing entries instead of seeding', () => {
    localStorage.setItem(KEY, JSON.stringify([{ id: 'a', type: 'water', value: 250 }]));
    const { result } = renderHook(() => useEntries());
    expect(result.current.entries).toEqual([{ id: 'a', type: 'water', value: 250 }]);
  });

  it('persists add, update and remove as valid JSON', () => {
    localStorage.setItem(KEY, '[]');
    const { result } = renderHook(() => useEntries());

    let created;
    act(() => {
      created = result.current.add({ type: 'steps', value: 5000, unit: 'steps', note: '' });
    });
    expect(created.id).toBeTruthy();
    expect(created.timestamp).toBeTruthy();
    expect(stored()).toEqual([created]);

    act(() => result.current.update(created.id, { value: 6000 }));
    expect(stored()[0].value).toBe(6000);

    act(() => result.current.remove(created.id));
    expect(stored()).toEqual([]);
  });

  it('keeps user data across a reload after adding an entry', () => {
    localStorage.setItem(KEY, '[]');
    const first = renderHook(() => useEntries());
    act(() => {
      first.result.current.add({ type: 'sleep', value: 8, unit: 'hours', note: '' });
    });
    first.unmount();

    const second = renderHook(() => useEntries());
    expect(second.result.current.entries).toHaveLength(1);
    expect(second.result.current.entries[0].type).toBe('sleep');
  });

  it('reseeds when storage is corrupted', () => {
    localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useEntries());
    expect(result.current.entries.length).toBeGreaterThan(0);
  });

  it('clearAll empties entries and storage', () => {
    const { result } = renderHook(() => useEntries());
    act(() => result.current.clearAll());
    expect(result.current.entries).toEqual([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
  it('reseeds when storage holds valid JSON that is not a list', () => {
    localStorage.setItem(KEY, '{}');
    const { result } = renderHook(() => useEntries());
    expect(Array.isArray(result.current.entries)).toBe(true);
    expect(result.current.entries.length).toBeGreaterThan(0);
  });

  it('keeps working in memory when storage writes fail (private mode)', () => {
    localStorage.setItem(KEY, '[]');
    const { result } = renderHook(() => useEntries());
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      act(() => { result.current.add({ type: 'water', value: 250, unit: 'ml', note: '' }); });
      expect(result.current.entries).toHaveLength(1);
    } finally {
      spy.mockRestore();
    }
  });
});
