import { useState, useEffect, useMemo } from 'react';
import { buildForecast } from '../forecast/engine';
import { generateHistory, generateLive } from '../forecast/mockData';
import { scenarioByKey } from '../forecast/scenarios';
import { REFRESH_MS } from '../forecast/config';

// In the surge test state, the burst of check-ins arrives this long after the
// state is selected, so you can watch the tier change live.
const SURGE_DELAY_MS = 4000;

/**
 * Feeds the forecast engine. Re-reads live occupancy every REFRESH_MS (30 s,
 * inside the PRD's 60-second surge requirement).
 *
 * `scenarioKey` picks a prototype test state; 'real' uses the actual clock.
 * Test states that define their own class blocks use those instead of the
 * student's, so a demo never edits real data.
 */
export default function useCrowdForecast(scenarioKey, userClassBlocks) {
  const scenario = scenarioByKey(scenarioKey);
  const [tick, setTick] = useState(0);
  const [selectedAt, setSelectedAt] = useState(() => Date.now());

  // Restart the clock whenever the test state changes.
  useEffect(() => {
    setSelectedAt(Date.now());
  }, [scenarioKey]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!scenario.surgePct) return undefined;
    const id = setTimeout(() => setTick((t) => t + 1), SURGE_DELAY_MS);
    return () => clearTimeout(id);
  }, [scenario, selectedAt]);

  const fixedNow = useMemo(() => (scenario.now ? scenario.now() : null), [scenario]);
  const historyDay = (fixedNow ?? new Date()).toDateString();

  // History only changes once a day (or when the test state changes).
  const history = useMemo(
    () => (scenario.noHistory ? [] : generateHistory(fixedNow ?? new Date())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenario, historyDay],
  );

  return useMemo(() => {
    const now = fixedNow ?? new Date();
    const surgeActive = scenario.surgePct && Date.now() - selectedAt >= SURGE_DELAY_MS;
    const live = scenario.liveOffline
      ? null
      : generateLive(now, history, { surgePct: surgeActive ? scenario.surgePct : 0 });
    const classBlocks = scenario.classBlocks ?? userClassBlocks;
    return {
      scenario,
      now,
      classBlocks,
      demoClasses: Boolean(scenario.classBlocks),
      forecast: buildForecast({ now, history, live, classBlocks }),
      // Test states show their simulated clock; the real view shows when it refreshed.
      updatedAt: fixedNow ?? new Date(),
    };
    // `tick` forces a fresh live reading on each refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, fixedNow, history, userClassBlocks, selectedAt, tick]);
}
