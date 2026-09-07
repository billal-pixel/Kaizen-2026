import { useState, useEffect, useCallback, useRef } from 'react';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { syncAllSheetsData, PRIMARY_DEFAULT_SHEET } from '../utils/sheetSync';
import { backgroundSync } from '../utils/backgroundSync';

export type AutoRefreshErrorType = 'network' | 'restricted' | 'invalid_url' | 'empty_data' | 'unknown' | null;

export interface UseAutoRefreshOptions {
  sheetUrl: string;
  onImportStationedData: (data: StationedAdvisor[], replace?: boolean) => void;
  onImportVirtualData: (data: VirtualAdvisor[], replace?: boolean) => void;
  intervalSeconds?: number; // default 30
  enabled?: boolean;
}

export interface UseAutoRefreshReturn {
  isRefreshing: boolean;
  lastRefreshedAt: Date | null;
  countdown: number;
  autoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
  refreshNow: () => Promise<void>;
  lastStatus: 'idle' | 'success' | 'error';
  errorMessage: string | null;
  errorType: AutoRefreshErrorType;
  lastErrorAt: Date | null;
  consecutiveErrors: number;
  isErrorDismissed: boolean;
  dismissError: () => void;
  clearError: () => void;
}

export function useAutoRefresh({
  sheetUrl,
  onImportStationedData,
  onImportVirtualData,
  intervalSeconds = 30,
  enabled = false,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(() => new Date());
  const [countdown, setCountdown] = useState<number>(intervalSeconds);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('kaizen_auto_refresh_enabled');
    return saved !== null ? JSON.parse(saved) : enabled;
  });
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<AutoRefreshErrorType>(null);
  const [lastErrorAt, setLastErrorAt] = useState<Date | null>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [isErrorDismissed, setIsErrorDismissed] = useState<boolean>(false);

  const stationedRef = useRef(onImportStationedData);
  const virtualRef = useRef(onImportVirtualData);

  useEffect(() => {
    stationedRef.current = onImportStationedData;
    virtualRef.current = onImportVirtualData;
  }, [onImportStationedData, onImportVirtualData]);

  // Save autoRefreshEnabled state & sync with background manager
  useEffect(() => {
    localStorage.setItem('kaizen_auto_refresh_enabled', JSON.stringify(autoRefreshEnabled));
    backgroundSync.setSheetUrl(sheetUrl, intervalSeconds * 1000);
  }, [autoRefreshEnabled, sheetUrl, intervalSeconds]);

  // Listen for data updates from background worker
  useEffect(() => {
    const unsubscribeData = backgroundSync.subscribeData(({ stationed, virtual }) => {
      if (stationed.length > 0) stationedRef.current(stationed, true);
      if (virtual.length > 0) virtualRef.current(virtual, true);
      const now = new Date();
      setLastRefreshedAt(now);
      setLastStatus('success');
      setErrorMessage(null);
      setErrorType(null);
      setConsecutiveErrors(0);
      localStorage.setItem('kaizen_last_sync_time', now.toLocaleTimeString());
    });

    return () => unsubscribeData();
  }, []);

  const refreshNow = useCallback(async () => {
    setIsRefreshing(true);
    setLastStatus('idle');

    const targetUrl = sheetUrl || PRIMARY_DEFAULT_SHEET;

    try {
      const result = await syncAllSheetsData(targetUrl);

      if (result.success && (result.stationed.length > 0 || result.virtual.length > 0)) {
        if (result.stationed.length > 0) {
          stationedRef.current(result.stationed, true);
        }
        if (result.virtual.length > 0) {
          virtualRef.current(result.virtual, true);
        }

        const now = new Date();
        setLastRefreshedAt(now);
        setLastStatus('success');
        setErrorMessage(null);
        setErrorType(null);
        setConsecutiveErrors(0);
        setIsErrorDismissed(false);
        localStorage.setItem('kaizen_last_sync_time', now.toLocaleTimeString());
      } else {
        const rawErr = result.error || 'Failed to sync Google Sheet data.';
        let detectedType: AutoRefreshErrorType = 'unknown';
        let userFacingMsg = rawErr;

        const lowerErr = rawErr.toLowerCase();
        if (lowerErr.includes('restricted') || lowerErr.includes('private')) {
          detectedType = 'restricted';
          userFacingMsg = 'Google Sheet link is restricted or private. Ensure access is set to "Anyone with the link can view".';
        } else if (lowerErr.includes('fetch') || lowerErr.includes('network') || lowerErr.includes('offline')) {
          detectedType = 'network';
          userFacingMsg = 'Network connection to Google Sheets service failed or timed out.';
        } else if (lowerErr.includes('invalid')) {
          detectedType = 'invalid_url';
          userFacingMsg = 'Invalid Google Sheet URL format provided.';
        } else if (result.success && result.stationed.length === 0 && result.virtual.length === 0) {
          detectedType = 'empty_data';
          userFacingMsg = 'Connected to Google Sheet, but no advisor rows were detected in the tab.';
        }

        setLastStatus('error');
        setErrorMessage(userFacingMsg);
        setErrorType(detectedType);
        setLastErrorAt(new Date());
        setConsecutiveErrors((prev) => prev + 1);
      }
    } catch (err: any) {
      console.warn('Auto-refresh runtime error caught gracefully:', err);
      const rawMsg = err?.message || 'An unexpected error occurred while fetching Google Sheet updates.';
      let detectedType: AutoRefreshErrorType = 'unknown';

      if (rawMsg.toLowerCase().includes('fetch') || rawMsg.toLowerCase().includes('network')) {
        detectedType = 'network';
      }

      setLastStatus('error');
      setErrorMessage(rawMsg);
      setErrorType(detectedType);
      setLastErrorAt(new Date());
      setConsecutiveErrors((prev) => prev + 1);
    } finally {
      setIsRefreshing(false);
      setCountdown(intervalSeconds);
    }
  }, [sheetUrl, intervalSeconds]);

  // Initial refresh on mount & timer loop for periodic auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) {
      return;
    }

    refreshNow();

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshNow();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, intervalSeconds, refreshNow]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  const dismissError = useCallback(() => {
    setIsErrorDismissed(true);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setErrorType(null);
    setLastStatus('idle');
    setIsErrorDismissed(false);
  }, []);

  return {
    isRefreshing,
    lastRefreshedAt,
    countdown,
    autoRefreshEnabled,
    toggleAutoRefresh,
    refreshNow,
    lastStatus,
    errorMessage,
    errorType,
    lastErrorAt,
    consecutiveErrors,
    isErrorDismissed,
    dismissError,
    clearError,
  };
}


