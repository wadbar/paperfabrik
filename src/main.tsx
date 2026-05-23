import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.tsx';
import { logger, LogLevel } from './core/logger.ts';
import { I18nProvider } from './lib/i18n.tsx';

// Initialize System Core
logger.log(LogLevel.INFO, "SYSTEM", "Service Initializing...");

// Graceful Shutdown & Unhandled Rejection Interceptors
const gracefulTeardown = (event: Event) => {
    logger.log(LogLevel.WARN, "SYSTEM", `Graceful Teardown Triggered via ${event.type}`);
    // Clear major event loops, flush telemetry, etc.
    const activeWorkers = navigator.serviceWorker;
    if (activeWorkers) {
        // Broadcast teardown to workers if applicable
    }
};

window.addEventListener('beforeunload', gracefulTeardown);
window.addEventListener('unload', gracefulTeardown);

window.addEventListener('unhandledrejection', (event) => {
    logger.log(LogLevel.ERROR, "SYSTEM", `UNHANDLED_REJECTION: ${event.reason?.message || event.reason}`);
});
window.addEventListener('error', (event) => {
    logger.log(LogLevel.ERROR, "SYSTEM", `UNCAUGHT_EXCEPTION: ${event.error?.message || event.message} at ${event.filename}:${event.lineno}`);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
);
