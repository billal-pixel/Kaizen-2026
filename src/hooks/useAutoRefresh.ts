import { useState, useEffect, useCallback, useRef } from 'react';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { parseCsvText } from '../utils/sheetParser';

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

    const DEFAULT_SHEET = 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit#gid=0';
    const targetUrl = sheetUrl || DEFAULT_SHEET;

    try {
      let fetchUrl = `/api/sheets-sync-all?url=${encodeURIComponent(targetUrl)}&_t=${Date.now()}`;
      let res = await fetch(fetchUrl);

      if (!res.ok) {
        fetchUrl = `/api/sheets-sync-all?url=${encodeURIComponent(DEFAULT_SHEET)}&_t=${Date.now()}`;
        res = await fetch(fetchUrl);
      }

      const syncResult = await res.json();

      if (syncResult && syncResult.success && syncResult.sheets) {
        let allStationed: StationedAdvisor[] = [];
        let allVirtual: VirtualAdvisor[] = [];

        for (const gid of Object.keys(syncResult.sheets)) {
          const csvText = syncResult.sheets[gid];
          if (csvText) {
            const parsed = await parseCsvText(csvText);
            if (parsed.stationed) allStationed = [...allStationed, ...parsed.stationed];
            if (parsed.virtual) allVirtual = [...allVirtual, ...parsed.virtual];
          }
        }

        if (allStationed.length > 0) {
          stationedRef.current(allStationed, true);
        }
        if (allVirtual.length > 0) {
          virtualRef.current(allVirtual, true);
        }

        const now = new Date();
        setLastRefreshedAt(now);
        setLastStatus('success');
        localStorage.setItem('kaizen_last_sync_time', now.toLocaleTimeString());
      } else {
        setLastStatus('error');
      }
    } catch (err) {
      console.warn('60s Auto-refresh error:', err);
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
