import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.tsx';
import { logger, LogLevel } from './core/logger.ts';

// Initialize System Core
logger.log(LogLevel.INFO, "SYSTEM", "Engine Initializing...");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
