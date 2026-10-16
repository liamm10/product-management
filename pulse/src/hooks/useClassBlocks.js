import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'yorku.classBlocks';
const TIME = /^\d\d:\d\d$/;

// Drop malformed blocks so one bad stored value can't crash the forecast.
const isValidBlock = (b) =>
  b != null && Number.isInteger(b.day) && TIME.test(b.start) && TIME.test(b.end);

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed.filter(isValidBlock) : [];
  } catch {
    return [];
  }
}

/**
 * The student's weekly class times, entered by hand (PRD: calendar sync is out
 * of scope; manual blocks come first). Stored in localStorage. Each block:
 *   { id, day: 0–6 (Sun–Sat), start: 'HH:MM', end: 'HH:MM' }
 * The forecast never recommends a time that overlaps one of these.
 */
export default function useClassBlocks() {
  const [blocks, setBlocks] = useState(read);

  const persist = useCallback((updater) => {
    setBlocks((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode) — keep in memory only.
      }
      return next;
    });
  }, []);

  const add = useCallback((block) => {
    persist((prev) => [...prev, { ...block, id: uuidv4() }]);
  }, [persist]);

  const remove = useCallback((id) => {
    persist((prev) => prev.filter((b) => b.id !== id));
  }, [persist]);

  return { blocks, add, remove };
}
