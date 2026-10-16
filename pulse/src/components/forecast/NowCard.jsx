import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import SectionLabel from './SectionLabel';
import { tokens } from '../../theme';
import { TIER_COPY, dayTimeLabel } from '../../forecast/format';
import { FACILITY } from '../../forecast/config';

const SIZE = 196;
const SIZE_SHORT = 128;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

// Short phones (iPhone SE, small Android) and phones turned sideways: a
// side-by-side layout with a smaller gauge, so more of the forecast fits above
// the bottom nav without scrolling.
const SHORT_PHONE = '@media (max-width:599.95px) and (max-height:760px), (max-height:500px)';

/** Circular occupancy gauge. The tier label sits beside it, so color is never the only cue. */
function Gauge({ pct, color }) {
  return (
    <Box
      sx={{
        position: 'relative', width: SIZE, height: SIZE, flexShrink: 0,
        [SHORT_PHONE]: { width: SIZE_SHORT, height: SIZE_SHORT },
        // The arc animates; turn that off for people who ask for reduced motion (2.3.3 / good practice).
        '@media (prefers-reduced-motion: reduce)': { '& circle': { transition: 'none !important' } },
      }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={tokens.glassInset} strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct / 100)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '3.2rem', lineHeight: 1, [SHORT_PHONE]: { fontSize: '2.2rem' } }}>
          {Math.round(pct)}
          <Box component="span" sx={{ fontSize: '1.4rem', ml: 0.25, color: 'text.secondary' }}>%</Box>
        </Typography>
        <Typography variant="body2" color="text.secondary">full</Typography>
      </Box>
    </Box>
  );
}

function TierChip({ tier }) {
  const color = tokens.tier[tier];
  return (
    <Chip
      label={TIER_COPY[tier].label}
      sx={{
        fontFamily: '"Space Grotesk", sans-serif',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: '0.78rem',
        color: tokens.tierText[tier],
        backgroundColor: `${color}1F`,
        border: `1px solid ${color}66`,
      }}
    />
  );
}

/** "Right now" card: live occupancy, or the closed / unavailable states. */
export default function NowCard({ forecast }) {
  const { status, current, opensAt } = forecast;

  let body;
  if (status === 'closed') {
    body = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: 2 }} id="now-closed">
        <BedtimeOutlinedIcon sx={{ fontSize: 56, color: 'text.secondary' }} />
        <Box>
          <Typography variant="h4" component="h3" sx={{ fontSize: '1.8rem', mb: 0.5 }}>Closed</Typography>
          <Typography color="text.secondary">
            {opensAt ? `Opens ${dayTimeLabel(opensAt)}.` : 'Check York Athletics for hours.'} Crowd levels show once it opens.
          </Typography>
        </Box>
      </Box>
    );
  } else if (!current) {
    body = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: 2 }} id="now-unavailable">
        <CloudOffOutlinedIcon sx={{ fontSize: 56, color: 'text.secondary' }} />
        <Box>
          <Typography variant="h4" component="h3" sx={{ fontSize: '1.5rem', mb: 0.5 }}>Forecast unavailable</Typography>
          <Typography color="text.secondary">
            We can’t reach check-in data right now, so we’re not showing crowd levels rather than guessing. Try again in a few minutes.
          </Typography>
        </Box>
      </Box>
    );
  } else {
    const copy = TIER_COPY[current.tier];
    body = (
      <Box
        sx={{
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 2, sm: 4 },
          [SHORT_PHONE]: {
            flexDirection: 'row', gap: 2,
            '& .now-text': { textAlign: 'left' },
            '& .now-chips': { justifyContent: 'flex-start' },
            '& .now-line': { fontSize: '1rem' },
          },
        }}
        role="status"
        aria-live="polite"
        aria-label={`${copy.label}, about ${Math.round(current.pct)} percent full${current.estimate ? ', historical estimate' : ''}`}
        id="now-occupancy"
      >
        <Gauge pct={current.pct} color={tokens.tier[current.tier]} />
        <Box className="now-text" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Box className="now-chips" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 1.5 }}>
            <TierChip tier={current.tier} />
            {current.estimate && <Chip label="Estimate" variant="outlined" size="small" sx={{ alignSelf: 'center' }} />}
          </Box>
          <Typography className="now-line" sx={{ fontSize: '1.15rem', fontWeight: 500, mb: 1 }}>{copy.line}</Typography>
          <Typography variant="body2" color="text.secondary">
            {current.estimate ? 'Usually' : 'About'} {current.count} of {FACILITY.capacity} spots in use
            {current.estimate ? ' at this time' : ''}.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Card component="section" aria-labelledby="now-heading" id="forecast-now-card" sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
        <SectionLabel id="now-heading">Right now</SectionLabel>
        {body}
      </CardContent>
    </Card>
  );
}
