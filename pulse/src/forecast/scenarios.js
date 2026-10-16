/**
 * Prototype test states — the six PRD eval states, plus a "no data" state
 * for the acceptance-criteria guardrail. Each returns the inputs the engine
 * would get in that situation; `real` uses the actual clock.
 */

// The next date (from today) falling on `weekday`, at `hour`:`minute` local.
function upcoming(weekday, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const SCENARIOS = [
  { key: 'real', label: 'Right now', describe: 'Real clock, simulated live feed.' },
  {
    key: 'happy',
    label: '1 · Happy path',
    describe: 'Tuesday 10:15 AM, open, live data streaming.',
    now: () => upcoming(2, 10, 15),
  },
  {
    key: 'closed',
    label: '2 · Closed',
    describe: '11:30 PM — facility closed, forecasts suppressed.',
    now: () => upcoming(3, 23, 30),
  },
  {
    key: 'surge',
    label: '3 · Surge spike',
    describe: 'Wednesday 2:20 PM, a burst of check-ins pushes occupancy up.',
    now: () => upcoming(3, 14, 20),
    surgePct: 48,
  },
  {
    key: 'weekend',
    label: '4 · Weekend',
    describe: 'Saturday 10:00 AM — weekend pattern, not weekday class gaps.',
    now: () => upcoming(6, 10, 0),
  },
  {
    key: 'offline',
    label: '5 · Live data offline',
    describe: 'Thursday 3:10 PM, check-in feed down — historical estimates only.',
    now: () => upcoming(4, 15, 10),
    liveOffline: true,
  },
  {
    key: 'guardrail',
    label: '6 · Class-time guardrail',
    describe: 'Monday 1:05 PM with classes 1–3 PM and 5–7 PM — never suggest those times.',
    now: () => upcoming(1, 13, 5),
    classBlocks: [
      { id: 'demo-1', day: 1, start: '13:00', end: '15:00', label: 'Demo class' },
      { id: 'demo-2', day: 1, start: '17:00', end: '19:00', label: 'Demo class' },
    ],
  },
  {
    key: 'nodata',
    label: 'No data at all',
    describe: 'Live and historical data both unavailable — no forecast is shown.',
    now: () => upcoming(2, 11, 0),
    liveOffline: true,
    noHistory: true,
  },
];

export const scenarioByKey = (key) => SCENARIOS.find((s) => s.key === key) ?? SCENARIOS[0];
