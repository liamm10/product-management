import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SectionLabel from './SectionLabel';
import { tokens } from '../../theme';
import { SCENARIOS } from '../../forecast/scenarios';

/** Switch between the PRD's eval states to demo or check each one. */
export default function TestStates({ value, onChange }) {
  const current = SCENARIOS.find((s) => s.key === value);
  return (
    <Box component="section" aria-labelledby="test-states-heading">
      <SectionLabel id="test-states-heading">Prototype test states</SectionLabel>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, next) => next && onChange(next)}
        aria-labelledby="test-states-heading"
        sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { borderRadius: `${tokens.pillRadius} !important`, border: '1px solid !important', borderColor: `${tokens.controlBorder} !important`, px: 1.75, py: 0.6, minHeight: 44, fontSize: '0.75rem', '&.Mui-selected': { borderColor: `${tokens.violet} !important`, fontWeight: 700 } } }}
      >
        {SCENARIOS.map((s) => (
          <ToggleButton key={s.key} value={s.key} id={`forecast-state-${s.key}`}>{s.label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
      {current && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }} id="test-state-description">
          {current.describe}
        </Typography>
      )}
    </Box>
  );
}
