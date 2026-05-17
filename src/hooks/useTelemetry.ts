/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { logger, LogLevel } from "@/src/core/logger";

export function useTelemetry(moduleName: string) {
  const mountTime = useRef(performance.now());

  useEffect(() => {
    logger.log(LogLevel.INFO, moduleName, "Module Mounted", {
      timestamp: Date.now(),
    });

    return () => {
      const liveTime = performance.now() - mountTime.current;
      logger.log(LogLevel.INFO, moduleName, "Module Unmounted", {
        lifetime_ms: liveTime.toFixed(2),
      });
    };
  }, [moduleName]);

  const recordEvent = (action: string, metadata?: Record<string, any>) => {
    logger.log(LogLevel.TELEMETRY, moduleName, action, metadata);
  };

  return { recordEvent };
}
