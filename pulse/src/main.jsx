import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// Per-brand font set; vite.config.js points this alias at src/fonts/<brand>.js.
import 'brand-fonts';
import theme from './theme';
import brand from './brand';
import App from './App';

// Tab title follows the active brand (Pulse by default).
document.title = `${brand.name} — ${brand.tagline}`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
