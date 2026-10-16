import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { BarChart, Bar, XAxis, YAxis, Cell, ReferenceLine, ResponsiveContainer } from 'recharts';
import SectionLabel from './SectionLabel';
import { tokens } from '../../theme';
import { TIER_COPY, hourLabel, rangeLabel } from '../../forecast/format';
import { TIER_LIMITS } from '../../forecast/config';

const visuallyHidden = {
  position: 'absolute', width: 1, height: 1, p: 0, m: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};

function slotSummary(s) {
  if (s.closed) return `${rangeLabel(s.start, s.end)}: closed`;
  if (s.pct == null) return `${rangeLabel(s.start, s.end)}: no estimate`;
  return `${rangeLabel(s.start, s.end)}: ${TIER_COPY[s.tier].label}, about ${s.pct}% full${s.inClass ? ', during your class' : ''}`;
}

/** Interactive bar chart of the next 8 hours. Tap a bar for details. */
export default function HourlyChart({ forecast }) {
  const { slots } = forecast;
  const [selected, setSelected] = useState(0);
  if (!slots.length) return null;

  const data = slots.map((s, i) => ({
    i,
    label: i === 0 ? 'Now' : hourLabel(s.start),
    value: s.pct ?? 0,
    slot: s,
  }));
  const selIndex = Math.min(selected, slots.length - 1);
  const sel = slots[selIndex];

  // Keyboard equivalent of tapping a bar (WCAG 2.1.1): arrow keys move the
  // selection, Home/End jump to the first/last hour.
  const onKeyDown = (e) => {
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(selIndex + 1, slots.length - 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(selIndex - 1, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = slots.length - 1;
    else return;
    e.preventDefault();
    setSelected(next);
  };

  return (
    <Card component="section" aria-labelledby="hourly-heading" id="forecast-hourly-card">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
          <SectionLabel id="hourly-heading">Next 8 hours</SectionLabel>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }} aria-hidden="true">
            {['low', 'medium', 'high'].map((t) => (
              <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', color: 'text.secondary' }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: tokens.tier[t] }} />
                {TIER_COPY[t].short}
              </Box>
            ))}
          </Box>
        </Box>

        {/* The chart is drawn in SVG (hidden from screen readers); this wrapper is the
            keyboard/screen-reader control. aria-valuetext reads the selected hour in full,
            and the hidden list below gives every hour at once. */}
        <Box
          role="slider"
          tabIndex={0}
          aria-label="Choose an hour to see its forecast"
          aria-valuemin={0}
          aria-valuemax={slots.length - 1}
          aria-valuenow={selIndex}
          aria-valuetext={slotSummary(sel)}
          onKeyDown={onKeyDown}
          sx={{
            mx: -1,
            borderRadius: 2,
            '& .recharts-bar-rectangle': { cursor: 'pointer' },
            '&:focus-visible': { outline: `2px solid ${tokens.focusRing}`, outlineOffset: 2 },
          }}
        >
          <Box aria-hidden="true">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 18, right: 8, left: -12, bottom: 0 }} barCategoryGap="18%" accessibilityLayer={false}>
              <defs>
                {['low', 'medium', 'high'].map((t) => (
                  <pattern key={t} id={`stripes-${t}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill={tokens.tier[t]} fillOpacity="0.25" />
                    <rect width="3" height="8" fill={tokens.tier[t]} fillOpacity="1" />
                  </pattern>
                ))}
              </defs>
              <XAxis dataKey="label" stroke={tokens.chartAxis} fontSize={12} tickLine={false} axisLine={false} interval={0} />
              <YAxis domain={[0, 100]} ticks={[0, TIER_LIMITS.low, TIER_LIMITS.high, 100]} stroke={tokens.chartAxis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <ReferenceLine y={TIER_LIMITS.low} stroke={tokens.chartReference} strokeDasharray="4 4" />
              <ReferenceLine y={TIER_LIMITS.high} stroke={tokens.chartReference} strokeDasharray="4 4" />
              <Bar
                dataKey="value"
                radius={[8, 8, 4, 4]}
                background={{ fill: tokens.chartBarTrack, radius: 8 }}
                onClick={(d) => setSelected(d.i)}
                isAnimationActive={!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}
                label={({ x, y, width, index }) => {
                  const slot = data[index]?.slot;
                  if (!slot) return null;
                  // Numeric/text value on every bar so tier is never colour-only (1.4.1).
                  const text = slot.closed ? 'Closed' : slot.pct == null ? null : `${slot.pct}%`;
                  return text ? (
                    <text key={`lbl-${index}`} x={x + width / 2} y={y - 6} textAnchor="middle" fill={slot.closed ? tokens.chartAxis : tokens.chartLabel} fontSize={11} fontFamily="Inter, sans-serif">
                      {text}
                    </text>
                  ) : null;
                }}
              >
                {data.map((d) => {
                  const { tier, inClass, closed } = d.slot;
                  const fill = closed || !tier ? 'transparent' : inClass ? `url(#stripes-${tier})` : tokens.tier[tier];
                  const isSel = d.i === selected;
                  return (
                    <Cell
                      key={d.i}
                      fill={fill}
                      // 0.8 keeps unselected bars >= 3:1 against the panel (1.4.11);
                      // the selected bar is also outlined so it isn't shown by opacity alone.
                      fillOpacity={isSel ? 1 : 0.8}
                      stroke={isSel && !closed && tier ? tokens.focusRing : 'none'}
                      strokeWidth={isSel ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </Box>
        </Box>

        {/* Details for the selected hour */}
        <Box
          id="hourly-selected"
          aria-live="polite"
          sx={{ mt: 1.5, p: 1.75, borderRadius: tokens.pillRadius, bgcolor: tokens.glassInset, border: `1px solid ${tokens.glassBorder}`, borderLeft: `4px solid ${tokens.violet}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
        >
          <Box>
            <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
              {rangeLabel(sel.start, sel.end)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sel.closed
                ? 'Closed — no forecast outside opening hours.'
                : sel.inClass
                  ? 'You’re in class then, so we won’t suggest it.'
                  : sel.tier ? TIER_COPY[sel.tier].line : 'No estimate for this hour.'}
            </Typography>
          </Box>
          {!sel.closed && sel.tier && (
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography sx={{ color: tokens.tierText[sel.tier], fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.85rem' }}>
                {TIER_COPY[sel.tier].label}
              </Typography>
              <Typography variant="body2" color="text.secondary">~{sel.pct}% full</Typography>
            </Box>
          )}
        </Box>

        {/* Screen-reader equivalent of the chart */}
        <Box component="ul" aria-labelledby="hourly-heading" sx={visuallyHidden}>
          {slots.map((s) => <li key={s.start.toISOString()}>{slotSummary(s)}</li>)}
        </Box>
      </CardContent>
    </Card>
  );
}
