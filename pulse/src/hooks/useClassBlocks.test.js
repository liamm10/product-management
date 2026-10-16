import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useClassBlocks from './useClassBlocks';

const KEY = 'yorku.classBlocks';
const stored = () => JSON.parse(localStorage.getItem(KEY));
const block = { day: 2, start: '10:00', end: '11:30' };

describe('useClassBlocks', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts empty when nothing is stored', () => {
    const { result } = renderHook(() => useClassBlocks());
    expect(result.current.blocks).toEqual([]);
  });

  it('loads previously stored blocks', () => {
    const saved = [{ id: 'x', ...block }];
    localStorage.setItem(KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useClassBlocks());
    expect(result.current.blocks).toEqual(saved);
  });

  it('falls back to empty on corrupted JSON', () => {
    localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useClassBlocks());
    expect(result.current.blocks).toEqual([]);
  });

  it.each([['an object', '{"a":1}'], ['a string', '"hi"'], ['a number', '5'], ['null', 'null']])(
    'falls back to empty when storage holds %s instead of an array',
    (_n, raw) => {
      localStorage.setItem(KEY, raw);
      const { result } = renderHook(() => useClassBlocks());
      expect(result.current.blocks).toEqual([]);
    },
  );

  it('drops malformed stored blocks instead of crashing', () => {
    localStorage.setItem(KEY, JSON.stringify([
      { id: 'ok', day: 1, start: '09:00', end: '10:30' },
      { id: 'no-end', day: 1, start: '09:00' },
      null,
      { id: 'bad-time', day: 2, start: 9, end: '10:00' },
    ]));
    const { result } = renderHook(() => useClassBlocks());
    expect(result.current.blocks.map((b) => b.id)).toEqual(['ok']);
  });

  it('add() assigns a unique id, keeps the block fields, and persists', () => {
    const { result } = renderHook(() => useClassBlocks());
    act(() => result.current.add(block));
    act(() => result.current.add(block));
    const { blocks } = result.current;
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject(block);
    expect(typeof blocks[0].id).toBe('string');
    expect(blocks[0].id).not.toBe(blocks[1].id);
    expect(stored()).toEqual(blocks);
  });

  it('add() does not let a caller-supplied id collide (hook assigns its own)', () => {
    const { result } = renderHook(() => useClassBlocks());
    act(() => result.current.add({ ...block, id: 'mine' }));
    expect(result.current.blocks[0].id).not.toBe('mine');
  });

  it('remove() deletes only the matching block and persists', () => {
    const { result } = renderHook(() => useClassBlocks());
    act(() => result.current.add(block));
    act(() => result.current.add({ ...block, day: 4 }));
    const [first, second] = result.current.blocks;
    act(() => result.current.remove(first.id));
    expect(result.current.blocks).toEqual([second]);
    expect(stored()).toEqual([second]);
  });

  it('remove() with an unknown id changes nothing', () => {
    const { result } = renderHook(() => useClassBlocks());
    act(() => result.current.add(block));
    const before = result.current.blocks;
    act(() => result.current.remove('nope'));
    expect(result.current.blocks).toEqual(before);
  });

  it('survives a remount (persistence round-trip)', () => {
    const first = renderHook(() => useClassBlocks());
    act(() => first.result.current.add(block));
    first.unmount();
    const second = renderHook(() => useClassBlocks());
    expect(second.result.current.blocks).toHaveLength(1);
    expect(second.result.current.blocks[0]).toMatchObject(block);
  });

  it('keeps working in memory when storage writes fail (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useClassBlocks());
    expect(() => act(() => result.current.add(block))).not.toThrow();
    expect(result.current.blocks).toHaveLength(1);
  });
});
