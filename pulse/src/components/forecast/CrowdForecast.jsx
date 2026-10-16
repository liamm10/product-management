import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import NowCard from './NowCard';
import HourlyChart from './HourlyChart';
import BestTimeCard from './BestTimeCard';
import ClassTimesCard from './ClassTimesCard';
import TestStates from './TestStates';
import useCrowdForecast from '../../hooks/useCrowdForecast';
import useClassBlocks from '../../hooks/useClassBlocks';
import { tokens } from '../../theme';
import { FACILITY } from '../../forecast/config';
import { dayTimeLabel, timeLabel } from '../../forecast/format';

/** Header status pill: live / estimates / closed / unavailable. */
function StatusPill({ forecast, updatedAt }) {
  const { status, dataState } = forecast;
  const live = status === 'open' && dataState === 'live';
  const text =
    status === 'closed' ? 'Closed'
      : dataState === 'live' ? `Live · ${timeLabel(updatedAt)}`
        : dataState === 'historical' ? 'Estimates only'
          : 'No data';
  const color = live ? tokens.tier.low : status === 'closed' ? tokens.textSecondary : tokens.tier.medium;
  return (
    <Box
      id="forecast-status"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: tokens.pillRadius, border: `1px solid ${tokens.glassBorder}`, bgcolor: tokens.glassInset, fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}
    >
      <Box
        sx={{
          width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 0 0 ${color}`,
          ...(live && {
            animation: 'livePulse 2s ease-out infinite',
            '@keyframes livePulse': { '0%': { boxShadow: `0 0 0 0 ${color}99` }, '100%': { boxShadow: `0 0 0 8px ${color}00` } },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }),
        }}
      />
      {text}
    </Box>
  );
}

/**
 * Crowd Forecast — York U Fitness MVP (Must-have, top RICE score).
 * JTBD: when I have free time between classes, I want to know if the gym is
 * quiet and worth visiting right now, so I can work out instead of waiting.
 */
export default function CrowdForecast() {
  const [scenarioKey, setScenarioKey] = useState('real');
  const classes = useClassBlocks();
  const { forecast, now, updatedAt, scenario, classBlocks, demoClasses } = useCrowdForecast(scenarioKey, classes.blocks);

  return (
    <Box component="main" aria-labelledby="forecast-title" sx={{ maxWidth: 980, mx: 'auto', px: 2, py: { xs: 2.5, sm: 4 } }}>
      {/* Heading */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box>
          <Typography component="h1" id="forecast-title" variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '1.8rem' }, mb: 0.5 }}>
            Crowd Forecast
          </Typography>
          <Typography color="text.secondary">
            {FACILITY.name}
            {scenario.key !== 'real' && <> · <Box component="span" sx={{ color: 'text.primary' }}>Showing {dayTimeLabel(now)}</Box></>}
          </Typography>
        </Box>
        <StatusPill forecast={forecast} updatedAt={updatedAt} />
      </Box>

      {/* Data banners (PRD eval 5 + data-unavailable guardrail) */}
      {/* The wrapper is always mounted so screen readers reliably announce banners
          that appear later (WCAG 4.1.3). Polite, not assertive: the alert role is
          dropped on the inner Alerts so they don't interrupt or double-announce. */}
      <Box role="status" aria-live="polite" aria-atomic="true" aria-label="Data notices" id="forecast-banners">
        {forecast.status === 'open' && forecast.dataState === 'historical' && (
          <Alert severity="warning" role="none" sx={{ mb: 2 }} id="banner-offline">
            Historical estimates only — live data offline. Numbers show what’s typical for this time.
          </Alert>
        )}
        {forecast.status === 'open' && forecast.dataState === 'unavailable' && (
          <Alert severity="error" role="none" sx={{ mb: 2 }} id="banner-unavailable">
            Crowd data is unavailable, so no forecast is shown.
          </Alert>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: forecast.status === 'open' && forecast.slots.length ? 7 : 12 }}>
          <NowCard forecast={forecast} />
        </Grid>
        {forecast.status === 'open' && forecast.slots.length > 0 && (
          <Grid size={{ xs: 12, md: 5 }}>
            <BestTimeCard forecast={forecast} classCount={classBlocks.length} />
          </Grid>
        )}
        {forecast.slots.length > 0 && (
          <Grid size={12}>
            <HourlyChart key={scenario.key} forecast={forecast} />
          </Grid>
        )}
        <Grid size={12}>
          <ClassTimesCard blocks={classBlocks} demo={demoClasses} onAdd={classes.add} onRemove={classes.remove} />
        </Grid>
      </Grid>

      {forecast.model === 'weekend' && forecast.status === 'open' && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }} id="weekend-note">
          Using weekend patterns — weekends don’t follow the weekday class schedule.
        </Typography>
      )}

      <Box sx={{ mt: 5, pt: 3, borderTop: `1px solid ${tokens.glassBorder}` }}>
        <TestStates value={scenarioKey} onChange={setScenarioKey} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Prototype: occupancy is simulated from a model of typical check-ins, and capacity and hours are placeholders.
          The real app would read the Tait McKenzie check-in database.
        </Typography>
      </Box>
    </Box>
  );
}
