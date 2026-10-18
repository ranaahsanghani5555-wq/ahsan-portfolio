import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { initMotion } from './lib/motion.js';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';

/* Resolve the motion mode (?motion= URL param > OS setting) and mirror it to
   <html data-motion> BEFORE React renders, so every component and stylesheet
   override block sees the same decision at first paint. */
initMotion();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
