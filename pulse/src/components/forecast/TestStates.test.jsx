import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TestStates from './TestStates';
import { SCENARIOS } from '../../forecast/scenarios';

afterEach(cleanup);

describe('TestStates', () => {
  it('offers the six PRD eval states plus real-clock and no-data options', () => {
    render(<TestStates value="real" onChange={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(SCENARIOS.length);
    for (const key of ['happy', 'closed', 'surge', 'weekend', 'offline', 'guardrail']) {
      const s = SCENARIOS.find((x) => x.key === key);
      expect(screen.getByRole('button', { name: s.label })).toBeTruthy();
    }
    expect(SCENARIOS.filter((s) => /^\d ·/.test(s.label))).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'No data at all' })).toBeTruthy();
  });

  it('marks the selected state and describes it', () => {
    const offline = SCENARIOS.find((s) => s.key === 'offline');
    render(<TestStates value="offline" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: offline.label }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: SCENARIOS[0].label }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText(offline.describe)).toBeTruthy();
  });

  it('reports the chosen key, but ignores re-clicking the selected state', () => {
    const onChange = vi.fn();
    render(<TestStates value="happy" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: SCENARIOS.find((s) => s.key === 'surge').label }));
    expect(onChange).toHaveBeenCalledWith('surge');
    onChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: SCENARIOS.find((s) => s.key === 'happy').label }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
