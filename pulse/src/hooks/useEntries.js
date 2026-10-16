import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import generateSeedData from '../data/seed';

const STORAGE_KEY = 'pulse.entries';

// Storage can be full or blocked (e.g. Safari private mode). Entries then live
// in memory only rather than crashing the app.
function save(value) {
  try {
    if (value == null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable — keep in memory only.
  }
}

/** Stored entries, or null if missing, unreadable or not a list. */
function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Custom hook for managing health entries in localStorage.
 * Auto-loads seed data on first run (empty storage) or corrupted storage.
 */
export default function useEntries() {
  const [entries, setEntries] = useState([]);

  // Load entries from localStorage on mount
  useEffect(() => {
    const stored = load();
    if (stored) {
      setEntries(stored);
    } else {
      // First run or corrupted data — load sample data
      const seed = generateSeedData();
      setEntries(seed);
      save(seed);
    }
  }, []);

  // Set entries and write them to localStorage. Accepts a value or an updater
  // function, like setState.
  const persist = useCallback((nextOrUpdater) => {
    setEntries((prev) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater;
      save(next);
      return next;
    });
  }, []);

  /** Add a new entry. Returns the created entry. */
  const add = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: entry.id || uuidv4(),
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    persist((prev) => [...prev, newEntry]);
    return newEntry;
  }, [persist]);

  /** Update an existing entry by id. */
  const update = useCallback((id, changes) => {
    persist((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
  }, [persist]);

  /** Remove an entry by id. */
  const remove = useCallback((id) => {
    persist((prev) => prev.filter((e) => e.id !== id));
  }, [persist]);

  /** Clear all entries. */
  const clearAll = useCallback(() => {
    setEntries([]);
    save(null);
  }, []);

  /** Reload sample data (replaces current entries). */
  const loadSampleData = useCallback(() => {
    const seed = generateSeedData();
    persist(seed);
  }, [persist]);

  return { entries, add, update, remove, clearAll, loadSampleData };
}
