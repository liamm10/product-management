import React from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import PulseLine from './PulseLine';
import { tokens, MOBILE_QUERY } from '../theme';
import brand from '../brand';

/**
 * App header with PulseLine logo and responsive navigation.
 * Mobile (≤600px): BottomNavigation fixed to bottom.
 * Desktop: Tabs in the header.
 * `views` is the list of { key, label, icon } screens to show (see App.jsx).
 */
export default function Nav({ views, view, onChangeView }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <>
      {/* App header */}
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pl: { xs: 2, sm: 3 },
          pr: { xs: 7, sm: 8 },
          py: 1.5,
          borderBottom: `1px solid ${tokens.headerBorder}`,
          ...tokens.headerSurface,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PulseLine width={120} height={28} animate={!prefersReducedMotion} />
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              fontWeight: 700,
              // York: white wordmark on the red header band, like yorku.ca.
              ...(brand.features.light
                ? { color: '#FFFFFF' }
                : {
                    background: `linear-gradient(135deg, ${tokens.violet} 0%, ${tokens.violetBright} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }),
            }}
          >
            {brand.name}
          </Typography>
        </Box>

        {/* Desktop tabs */}
        {!isMobile && (
          <Tabs
            value={view}
            onChange={(_, v) => onChangeView(v)}
            aria-label="Main navigation"
          >
            {views.map(({ key, label, icon: Icon }) => (
              <Tab key={key} icon={<Icon />} iconPosition="start" label={label} value={key} id={`nav-${key}`} />
            ))}
          </Tabs>
        )}
      </Box>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <BottomNavigation
          value={view}
          onChange={(_, v) => onChangeView(v)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
          }}
        >
          {views.map(({ key, label, icon: Icon }) => (
            <BottomNavigationAction key={key} label={label} value={key} icon={<Icon />} id={`nav-mobile-${key}`} sx={{ minWidth: 0, px: 0.5 }} />
          ))}
        </BottomNavigation>
      )}
    </>
  );
}
