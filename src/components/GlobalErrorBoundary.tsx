/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { logger, LogLevel } from "@/src/core/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.log(LogLevel.CRITICAL, "RUNTIME_CORE", "Component matched failure boundary", {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return (
        fallback || (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 font-mono">
            <div className="max-w-md w-full border border-red-500/30 bg-red-500/5 p-6 rounded">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold uppercase tracking-widest text-xs">Runtime Error Detected</span>
              </div>
              <h1 className="text-white text-lg font-black mb-2 italic">CRITICAL_SYSTEM_FAILURE</h1>
              <p className="text-neutral-500 text-[10px] leading-relaxed mb-6 uppercase">
                The application encountered an unrecoverable exception in the render thread. Telemetry has been captured.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
              >
                Re-initialize Core
              </button>
            </div>
          </div>
        )
      );
    }

    return children;
  }
}
