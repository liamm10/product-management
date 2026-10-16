import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup, act } from '@testing-library/react';
import CrowdForecast from './CrowdForecast';
import { FACILITY, HORIZON_HOURS } from '../../forecast/config';
import { SCENARIOS } from '../../forecast/scenarios';
import { rangeLabel, timeLabel } from '../../forecast/format';

// Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const labelOf = (key) => SCENARIOS.find((s) => s.key === key).label;

/** Render the screen and switch to a prototype test state, as a user would. */
function openState(key) {
  render(<CrowdForecast />);
  fireEvent.click(screen.getByRole('button', { name: labelOf(key) }));
}

// What the user sees in the "Right now" card.
const occupancy = () => screen.queryByRole('status', { name: /percent full/ });
// The data-warning banners live in one polite status region.
const notices = () => screen.getByRole('status', { name: 'Data notices' });
const hasForecastSections = () => ({
  chart: screen.queryByText('Next 8 hours'),
  best: screen.queryByText('Best time to go'),
});

describe('eval state 1: happy path', () => {
  it('shows live occupancy, a tier label, an 8-hour forecast and a best time', () => {
    openState('happy');
    expect(screen.getByText(/Showing Tue 10:15 AM/)).toBeTruthy();
    expect(screen.getByText(/^Live · /)).toBeTruthy();
    expect(occupancy().getAttribute('aria-label')).toMatch(/(Low|Medium|High) traffic, about \d+ percent full$/);
    expect(screen.getByText(new RegExp(`of ${FACILITY.capacity} spots in use`))).toBeTruthy();
    expect(notices().textContent).toBe(''); // no data warnings
    const { chart, best } = hasForecastSections();
    expect(chart).toBeTruthy();
    expect(best).toBeTruthy();
    const list = screen.getByRole('list', { name: 'Next 8 hours' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(HORIZON_HOURS);
  });
});

describe('eval state 2: closed', () => {
  it('says Closed with the next opening time and shows no occupancy or forecast', () => {
    openState('closed');
    expect(screen.getByRole('heading', { name: 'Closed' })).toBeTruthy();
    const [openHour] = FACILITY.hours[4]; // 11:30 PM Wednesday -> opens Thursday
    const opens = screen.getByText(/^Opens /);
    expect(opens.textContent).toContain(`Thu ${timeLabel(new Date(2026, 0, 1, openHour))}`);
    expect(screen.getByText('Closed', { selector: '#forecast-status' })).toBeTruthy();
    expect(occupancy()).toBeNull();
    expect(screen.queryByText(/% full|percent full|spots in use/)).toBeNull();
    const { chart, best } = hasForecastSections();
    expect(chart).toBeNull();
    expect(best).toBeNull();
  });
});

describe('eval state 3: surge spike', () => {
  it('moves to High traffic on the next reading, within the 60-second window', () => {
    vi.useFakeTimers();
    openState('surge');
    expect(occupancy().getAttribute('aria-label')).not.toMatch(/^High traffic/);
    act(() => vi.advanceTimersByTime(30_000)); // one refresh interval
    expect(occupancy().getAttribute('aria-label')).toMatch(/^High traffic/);
    expect(screen.getByText('High traffic', { selector: '.MuiChip-label' })).toBeTruthy();
    expect(screen.getAllByText(/busy right now/i).length).toBeGreaterThan(0);
  });
});

describe('eval state 4: weekend', () => {
  it('uses the weekend pattern and says so', () => {
    openState('weekend');
    expect(screen.getByText(/Showing Sat 10:00 AM/)).toBeTruthy();
    expect(screen.getByText(/Using weekend patterns/)).toBeTruthy();
    expect(occupancy()).not.toBeNull();
    // 10 AM + 8 hours stays inside Saturday's configured hours, so every slot has a number.
    const [, close] = FACILITY.hours[6];
    expect(10 + HORIZON_HOURS).toBeLessThanOrEqual(close);
    const list = screen.getByRole('list', { name: 'Next 8 hours' });
    const items = within(list).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toHaveLength(HORIZON_HOURS);
    items.forEach((t) => expect(t).toMatch(/about \d+% full/));
  });

  it('does not show the weekend note on a weekday', () => {
    openState('happy');
    expect(screen.queryByText(/Using weekend patterns/)).toBeNull();
  });
});

describe('eval state 5: live data offline (guardrail, current behaviour)', () => {
  it('shows historical estimates WITH a visible warning banner', () => {
    openState('offline');
    const banner = notices();
    expect(banner.textContent).toMatch(/Historical estimates only/);
    expect(banner.textContent).toMatch(/live data offline/);
    expect(screen.getByText('Estimates only')).toBeTruthy();
    expect(screen.getByText('Estimate', { selector: '.MuiChip-label' })).toBeTruthy();
    expect(occupancy().getAttribute('aria-label')).toMatch(/historical estimate$/);
    expect(screen.getByText(/^Usually /)).toBeTruthy();
    expect(screen.getByText('Next 8 hours')).toBeTruthy();
    expect(screen.queryByText(/^Live · /)).toBeNull();
  });
});

describe('eval state 6: class-time guardrail', () => {
  it('never recommends an hour that overlaps the demo classes', () => {
    openState('guardrail');
    expect(screen.getByText(/Demo classes for this test state/)).toBeTruthy();
    const chips = screen.getAllByRole('listitem').filter((li) => /Mon/.test(li.textContent) && /PM–/.test(li.textContent));
    expect(chips.map((c) => c.textContent)).toEqual(['Mon1 PM–3 PM', 'Mon5 PM–7 PM']);

    // Monday 1:05 PM, slots 1..8 PM; classes cover 1, 2, 5 and 6 PM.
    const free = [15, 16, 19, 20].map((h) => rangeLabel(new Date(2026, 0, 1, h), new Date(2026, 0, 1, h + 1)));
    const best = document.getElementById('best-time').textContent;
    expect(free).toContain(best);
    expect(screen.getByText(/Skips 4 hours of your classes/)).toBeTruthy();

    const list = screen.getByRole('list', { name: 'Next 8 hours' });
    const inClass = within(list).getAllByRole('listitem').filter((li) => /during your class/.test(li.textContent));
    expect(inClass).toHaveLength(4);
  });

  it('demo classes are read-only (no Add or Remove controls)', () => {
    openState('guardrail');
    expect(screen.queryByRole('button', { name: 'Add' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull();
  });
});

describe('guardrail: no data at all', () => {
  it('shows an unavailable message and NO forecast numbers', () => {
    openState('nodata');
    expect(notices().textContent).toMatch(/Crowd data is unavailable, so no forecast is shown/);
    expect(screen.getByRole('heading', { name: 'Forecast unavailable' })).toBeTruthy();
    expect(screen.getByText('No data')).toBeTruthy();
    expect(occupancy()).toBeNull();
    expect(screen.queryByText(/% full|percent full|spots in use|traffic/i)).toBeNull();
    const { chart, best } = hasForecastSections();
    expect(chart).toBeNull();
    expect(best).toBeNull();
  });

  it('contrast with state 5: offline shows numbers, no-data shows none', () => {
    openState('offline');
    expect(occupancy()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: labelOf('nodata') }));
    expect(occupancy()).toBeNull();
  });
});

describe('class times card', () => {
  it('lets a student add a class and rejects an end time before the start', () => {
    openState('happy');
    expect(screen.getByText('No classes added yet.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const end = screen.getByLabelText('End');
    fireEvent.change(end, { target: { value: '09:00' } }); // start defaults to 10:00
    expect(screen.getByRole('button', { name: 'Save' }).disabled).toBe(true);
    fireEvent.change(end, { target: { value: '11:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Remove Mon 10 AM class' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('yorku.classBlocks'))).toHaveLength(1);
  });
});
