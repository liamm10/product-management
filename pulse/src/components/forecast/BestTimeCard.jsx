import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import SectionLabel from './SectionLabel';
import { tokens } from '../../theme';
import { TIER_COPY, rangeLabel } from '../../forecast/format';

/**
 * The quietest open hour in the forecast that isn't during the student's
 * classes. Hidden when the facility is closed or there's no forecast.
 */
export default function BestTimeCard({ forecast, classCount }) {
  const { best, slots, status } = forecast;
  if (status !== 'open' || !slots.length) return null;

  const isNow = best && best.start.getTime() === slots[0].start.getTime();
  const skipped = slots.filter((s) => s.inClass && !s.closed).length;

  return (
    <Card component="section" aria-labelledby="best-heading" id="forecast-best-card" sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
        <SectionLabel id="best-heading">Best time to go</SectionLabel>
        {best ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <EventAvailableOutlinedIcon aria-hidden="true" sx={{ color: tokens.tier[best.tier], fontSize: 36, mt: 0.25 }} />
            <Box>
              <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '1.7rem', lineHeight: 1.15 }} id="best-time">
                {isNow ? 'Now' : rangeLabel(best.start, best.end)}
              </Typography>
              <Typography sx={{ color: tokens.tierText[best.tier], fontWeight: 600, fontSize: '0.9rem', mt: 0.5 }}>
                {TIER_COPY[best.tier].label} · ~{best.pct}% full
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                {best.tier === 'high'
                  ? 'Every open hour looks busy. This is the least crowded one.'
                  : isNow
                    ? 'It won’t get quieter in the next 8 hours.'
                    : 'The quietest open hour in the next 8.'}
                {skipped > 0 && ` Skips ${skipped} hour${skipped > 1 ? 's' : ''} of your classes.`}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography color="text.secondary" id="best-time-none">
            {classCount
              ? 'No open time outside your classes in the next 8 hours. Check back later today.'
              : 'No open time to suggest in the next 8 hours.'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
