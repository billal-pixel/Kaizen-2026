/**
 * Performance API Guard & Memory Pruning Utility
 * 
 * Prevents "DataCloneError: Failed to execute 'measure' on 'Performance': Data cannot be cloned, out of memory."
 * which can occur in Chromium browsers when React 19's User Timing DevTools instrumentation
 * attempts to structured-clone component props/details or when the browser's performance timeline
 * buffer accumulates entries over prolonged sessions.
 */

if (typeof window !== 'undefined' && window.performance) {
  const perf = window.performance;

  if (typeof perf.measure === 'function') {
    const originalMeasure = perf.measure.bind(perf);
    let measureCounter = 0;

    perf.measure = function (
      measureName: string,
      startOrMeasureOptions?: any,
      endMark?: string
    ) {
      try {
        measureCounter++;
        // Periodically purge internal performance measures to prevent memory accumulation
        if (measureCounter > 150) {
          measureCounter = 0;
          if (typeof perf.clearMeasures === 'function') perf.clearMeasures();
          if (typeof perf.clearMarks === 'function') perf.clearMarks();
        }

        return originalMeasure(measureName as any, startOrMeasureOptions, endMark);
      } catch {
        // Chromium throws DataCloneError when options.detail cannot be cloned
        try {
          if (startOrMeasureOptions && typeof startOrMeasureOptions === 'object') {
            // Strip out uncloneable/heavy detail payload while retaining timing marks
            const { detail, ...safeOptions } = startOrMeasureOptions;
            return originalMeasure(measureName as any, safeOptions, endMark);
          }
        } catch {
          // Fallback: minimal measure call without options
          try {
            return originalMeasure(measureName as any);
          } catch {
            return undefined as any;
          }
        }
        return undefined as any;
      }
    };
  }

  // Global error safety net for any asynchronous Performance.measure exceptions
  window.addEventListener('error', (event) => {
    if (
      event &&
      event.message &&
      (event.message.includes("Failed to execute 'measure' on 'Performance'") ||
        event.message.includes('Data cannot be cloned'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  });
}

export {};
