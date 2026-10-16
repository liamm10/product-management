import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SectionLabel from './SectionLabel';
import { tokens } from '../../theme';
import { DAY_NAMES, clockLabel } from '../../forecast/format';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

/**
 * Manual class times. The forecast never suggests a time that overlaps these.
 * In a test state with its own demo classes, the list is read-only.
 */
export default function ClassTimesCard({ blocks, demo, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [day, setDay] = useState(1);
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('11:30');
  const invalid = !start || !end || end <= start;

  // Keep focus predictable (2.4.3): the Add button unmounts while the form is
  // open, so hand focus back to it when the form closes.
  const addRef = useRef(null);
  const wasAdding = useRef(false);
  useEffect(() => {
    if (wasAdding.current && !adding) addRef.current?.focus();
    wasAdding.current = adding;
  }, [adding]);

  const sorted = [...blocks].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day) || a.start.localeCompare(b.start));

  const submit = (e) => {
    e.preventDefault();
    if (invalid) return;
    onAdd({ day, start, end });
    setAdding(false);
  };

  return (
    <Card component="section" aria-labelledby="classes-heading" id="forecast-classes-card">
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Box>
            <SectionLabel id="classes-heading" sx={{ mb: 0.5 }}>My class times</SectionLabel>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {demo ? 'Demo classes for this test state. Your own list isn’t changed.' : 'We’ll never suggest a gym time during class.'}
            </Typography>
          </Box>
          {!demo && !adding && (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setAdding(true)} id="add-class-button" ref={addRef} sx={{ minHeight: 44 }}>
              Add
            </Button>
          )}
        </Box>

        <Collapse in={adding && !demo} unmountOnExit>
          <Box component="form" onSubmit={submit} aria-label="Add a class time" sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start', mb: 2 }}>
            <TextField select autoFocus label="Day" size="small" value={day} onChange={(e) => setDay(Number(e.target.value))} sx={{ minWidth: 96 }} id="class-day">
              {WEEKDAYS.map((d) => <MenuItem key={d} value={d}>{DAY_NAMES[d]}</MenuItem>)}
            </TextField>
            <TextField label="Start" type="time" size="small" value={start} onChange={(e) => setStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} id="class-start" />
            <TextField
              label="End" type="time" size="small" value={end} onChange={(e) => setEnd(e.target.value)}
              error={Boolean(start && end && end <= start)} helperText={start && end && end <= start ? 'Ends after it starts' : ' '}
              slotProps={{ inputLabel: { shrink: true } }} id="class-end"
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button type="submit" variant="contained" size="small" disabled={invalid} id="save-class-button" sx={{ minHeight: 44 }}>Save</Button>
              <Button size="small" onClick={() => setAdding(false)} sx={{ minHeight: 44 }}>Cancel</Button>
            </Box>
          </Box>
        </Collapse>

        {sorted.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
            <SchoolOutlinedIcon fontSize="small" />
            <Typography variant="body2">No classes added yet.</Typography>
          </Box>
        ) : (
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sorted.map((b) => (
              <Box
                component="li"
                key={b.id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, pr: demo ? 1.5 : 0.5, py: 0.5, borderRadius: tokens.pillRadius, bgcolor: tokens.glassInset, border: `1px solid ${tokens.glassBorder}`, fontSize: '0.85rem' }}
              >
                <Box component="span" sx={{ fontWeight: 600 }}>{DAY_NAMES[b.day]}</Box>
                <Box component="span" sx={{ color: 'text.secondary' }}>{clockLabel(b.start)}–{clockLabel(b.end)}</Box>
                {!demo && (
                  <IconButton
                    size="small"
                    onClick={() => onRemove(b.id)}
                    aria-label={`Remove ${DAY_NAMES[b.day]} ${clockLabel(b.start)} class`}
                    // 44px hit area without making the pill taller: the padding overhangs.
                    sx={{ p: '14px', m: '-10px -6px -10px -10px' }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
