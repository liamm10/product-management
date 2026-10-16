import React from 'react';
import Typography from '@mui/material/Typography';

/** Small uppercase label used above each forecast card's content. */
export default function SectionLabel({ children, id, sx }) {
  return (
    <Typography
      id={id}
      component="h2"
      variant="subtitle1"
      sx={{ fontSize: '0.72rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.14em', mb: 1.5, ...sx }}
    >
      {children}
    </Typography>
  );
}
