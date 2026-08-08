import { useState, useEffect, useCallback, useRef } from 'react';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { syncAllSheetsData, PRIMARY_DEFAULT_SHEET } from '../utils/sheetSync';

interface UseAutoRefreshOptions {
  sheetUrl: string;
  onImportStationedData: (data: StationedAdvisor[], replace?: boolean) => void;
  onImportVirtualData: (data: VirtualAdvisor[], replace?: boolean) => void;
  intervalSeconds?: number; // default 60
  enabled?: boolean;
}

export function useAutoRefresh({
  sheetUrl,
  onImportStationedData,
  onImportVirtualData,
  intervalSeconds = 60,
  enabled = true,
}: UseAutoRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(() => new Date());
  const [countdown, setCountdown] = useState<number>(intervalSeconds);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('kaizen_auto_refresh_enabled');
    return saved !== null ? JSON.parse(saved) : enabled;
  });
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const stationedRef = useRef(onImportStationedData);
  const virtualRef = useRef(onImportVirtualData);

  useEffect(() => {
    stationedRef.current = onImportStationedData;
    virtualRef.current = onImportVirtualData;
  }, [onImportStationedData, onImportVirtualData]);

  // Save autoRefreshEnabled state
  useEffect(() => {
    localStorage.setItem('kaizen_auto_refresh_enabled', JSON.stringify(autoRefreshEnabled));
  }, [autoRefreshEnabled]);

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
        localStorage.setItem('kaizen_last_sync_time', now.toLocaleTimeString());
      } else {
        setLastStatus('error');
      }
    } catch (err) {
      console.warn('Auto-refresh warning:', err);
      setLastStatus('error');
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

    // Trigger immediate refresh on mount / when sheetUrl changes
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

  return {
    isRefreshing,
    lastRefreshedAt,
    countdown,
    autoRefreshEnabled,
    toggleAutoRefresh,
    refreshNow,
    lastStatus,
  };
}
