/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
  TELEMETRY = "TELEMETRY",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private readonly maxLogs = 1000;
  private logs: LogEntry[] = [];

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupGlobalHandlers() {
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.log(LogLevel.CRITICAL, "UNCAUGHT_EXCEPTION", event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        this.log(LogLevel.CRITICAL, "UNHANDLED_REJECTION", String(event.reason), {
          reason: event.reason,
        });
      });
    }
  }

  public log(level: LogLevel, module: string, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      metadata,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Production-ready console output with structured formatting
    const color = this.getLogColor(level);
    console.log(
      `%c[${entry.timestamp}] [${level}] [${module}]%c ${message}`,
      `color: ${color}; font-weight: bold;`,
      "color: inherit;",
      metadata || ""
    );

    // Sync with server in non-interactive background
    this.syncWithServer([entry]);
  }

  private async syncWithServer(entries: LogEntry[]) {
    try {
      await fetch("/api/telemetry/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (err) {
      // Fail silently to avoid infinite recursion or blocking UI
    }
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.CRITICAL: return "#ff0000";
      case LogLevel.ERROR: return "#ff4444";
      case LogLevel.WARN: return "#ffaa00";
      case LogLevel.TELEMETRY: return "#33bbff";
      default: return "#888888";
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = Logger.getInstance();
