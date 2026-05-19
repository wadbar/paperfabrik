import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.tsx';
import { logger, LogLevel } from './core/logger.ts';
import { I18nProvider } from './lib/i18n.tsx';

// Initialize System Core
logger.log(LogLevel.INFO, "SYSTEM", "Service Initializing...");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
);
