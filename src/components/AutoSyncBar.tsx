import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  RefreshCw, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Pause, 
  Play, 
  Settings2, 
  FileSpreadsheet,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { syncAllSheetsData, PRIMARY_DEFAULT_SHEET } from '../utils/sheetSync';

interface AutoSyncBarProps {
  sheetUrl: string;
  onUpdateSheetUrl: (newUrl: string) => void;
  onImportStationedData: (data: StationedAdvisor[], replace?: boolean) => void;
  onImportVirtualData: (data: VirtualAdvisor[], replace?: boolean) => void;
  onOpenSyncModal: () => void;
}

export const AutoSyncBar: React.FC<AutoSyncBarProps> = React.memo(({
  sheetUrl,
  onImportStationedData,
  onImportVirtualData,
  onOpenSyncModal,
}) => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('kaizen_auto_sync_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [intervalSeconds, setIntervalSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('kaizen_auto_sync_interval');
    return saved ? Number(saved) : 30;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('kaizen_last_sync_time');
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Auto-sync configured.');
  const [countdown, setCountdown] = useState<number>(intervalSeconds);
  const [syncedCount, setSyncedCount] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isControlsOpenMobile, setIsControlsOpenMobile] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const stationedImportRef = useRef(onImportStationedData);
  const virtualImportRef = useRef(onImportVirtualData);

  useEffect(() => {
    stationedImportRef.current = onImportStationedData;
    virtualImportRef.current = onImportVirtualData;
  }, [onImportStationedData, onImportVirtualData]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('kaizen_auto_sync_enabled', JSON.stringify(autoSyncEnabled));
  }, [autoSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('kaizen_auto_sync_interval', String(intervalSeconds));
    setCountdown(intervalSeconds);
  }, [intervalSeconds]);

  // Core Sync Logic
  const performSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus('idle');

    const targetUrl = sheetUrl || PRIMARY_DEFAULT_SHEET;

    try {
      const result = await syncAllSheetsData(targetUrl);

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync Google Sheet data.');
      }

      let totalStationedImported = 0;
      let totalVirtualImported = 0;

      if (result.stationed && result.stationed.length > 0) {
        stationedImportRef.current(result.stationed, true);
        totalStationedImported = result.stationed.length;
      }

      if (result.virtual && result.virtual.length > 0) {
        virtualImportRef.current(result.virtual, true);
        totalVirtualImported = result.virtual.length;
      }

      const totalRecords = totalStationedImported + totalVirtualImported;

      if (totalRecords > 0) {
        const summaryParts: string[] = [];
        if (totalStationedImported > 0) summaryParts.push(`${totalStationedImported} Stationed Advisors`);
        if (totalVirtualImported > 0) summaryParts.push(`${totalVirtualImported} Virtual Advisors`);

        setSyncedCount(totalRecords);
        setStatusMessage(`Auto-synced ${summaryParts.join(' & ')} from Google Sheet.`);
        setSyncStatus('success');
      } else {
        setStatusMessage('Sheet loaded, but no valid advisor rows were detected.');
        setSyncStatus('idle');
      }

      const nowStr = new Date().toLocaleTimeString();
      setLastSyncTime(nowStr);
      localStorage.setItem('kaizen_last_sync_time', nowStr);
    } catch (err: any) {
      console.warn('Auto-sync warning:', err?.message);
      setSyncStatus('error');
      setStatusMessage(err?.message || 'Auto-sync failed. Click "Paste Sheet Cells" to manually sync.');
    } finally {
      setIsSyncing(false);
      setCountdown(intervalSeconds);
    }
  }, [sheetUrl, intervalSeconds]);

  // Auto-sync polling loop & countdown
  useEffect(() => {
    if (!autoSyncEnabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    // Initial sync on load
    performSync();

    // Reset countdown
    setCountdown(intervalSeconds);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setInterval(() => {
      performSync();
    }, intervalSeconds * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoSyncEnabled, intervalSeconds, performSync]);

  return (
    <div className="relative bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs dark:shadow-inner backdrop-blur-md transition-all overflow-hidden flex flex-col justify-center">
      {/* Active Sync: Horizontal Scanning Progress Beam across top edge */}
      {isSyncing && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-200 dark:bg-slate-800 overflow-hidden z-20">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.9)]"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
        {/* Left Status & Indicators */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
          {/* Status Box Icon */}
          <div className="relative shrink-0">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 ${
              autoSyncEnabled 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-2xs' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}>
              <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce text-cyan-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
            </div>
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                Google Sheet Sync
              </span>
              
              {/* Status Badge */}
              {autoSyncEnabled ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 leading-none">
                  <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500 dark:bg-emerald-400"></span>
                  </span>
                  <span>LIVE</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/80 dark:border-slate-700 leading-none">
                  PAUSED
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 leading-none">
              {isSyncing ? (
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold animate-pulse flex items-center gap-1 leading-none">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Fetching live data...</span>
                </span>
              ) : syncStatus === 'success' ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium text-[11px] min-w-0 leading-none">
                  <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">{syncedCount} synced ({lastSyncTime})</span>
                  {autoSyncEnabled && (
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] shrink-0">• Poll: {countdown}s</span>
                  )}
                </span>
              ) : syncStatus === 'error' ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium text-[11px] leading-none">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{statusMessage}</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">{statusMessage}</span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Collapse/Expand Controls Button */}
        <button
          type="button"
          onClick={() => setIsControlsOpenMobile(!isControlsOpenMobile)}
          className="sm:hidden h-7 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 shadow-2xs ml-2"
        >
          <span>{isControlsOpenMobile ? 'Hide' : 'Controls'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isControlsOpenMobile ? 'rotate-180' : ''}`} />
        </button>

        {/* Right Controls - Collapsible on Mobile, always visible on Desktop */}
        <div className={`${isControlsOpenMobile ? 'flex' : 'hidden'} sm:flex flex-wrap sm:flex-nowrap items-center gap-1.5 justify-stretch sm:justify-end w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-800`}>
          {/* Pause / Resume Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer flex-1 sm:flex-initial whitespace-nowrap shadow-2xs ${
              autoSyncEnabled
                ? 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600/40'
            }`}
            title={autoSyncEnabled ? "Pause Auto-Sync" : "Enable Auto-Sync"}
          >
            {autoSyncEnabled ? (
              <>
                <Pause className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-[11px] font-bold leading-none">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold leading-none">Resume</span>
              </>
            )}
          </motion.button>

          {/* Sync Now Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={performSync}
            disabled={isSyncing}
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-50 cursor-pointer flex-1 sm:flex-initial whitespace-nowrap shadow-2xs ${
              isSyncing 
                ? 'bg-cyan-50 dark:bg-slate-900 border border-cyan-400 dark:border-cyan-500/50 text-cyan-700 dark:text-cyan-200' 
                : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
            }`}
            title="Sync data now"
          >
            <RefreshCw className={`w-3 h-3 shrink-0 ${isSyncing ? 'animate-spin text-cyan-600 dark:text-cyan-400 stroke-[2.5]' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[11px] font-bold leading-none">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </motion.button>

          {/* Configure Sheet Modal Trigger */}
          {onOpenSyncModal && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onOpenSyncModal}
              className="h-7 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer flex-1 sm:flex-initial whitespace-nowrap shadow-2xs"
              title="Open Google Sheet configuration"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold leading-none">Sheet Config</span>
            </motion.button>
          )}

          {/* Auto-Sync Settings Cog */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`h-7 w-7 p-1 rounded-lg border flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0 shadow-2xs ${
              showSettings ? 'bg-slate-200 dark:bg-slate-800 border-cyan-500 text-cyan-600 dark:text-cyan-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
            title="Auto-Sync Settings"
          >
            <Settings2 className={`w-3.5 h-3.5 transition-transform duration-200 ${showSettings ? 'rotate-90 text-cyan-500' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Expandable Settings Bar */}
      {showSettings && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium text-[11px]">Auto-Sync Frequency:</span>
            <select
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-cyan-700 dark:text-cyan-300 rounded-md px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value={15}>Every 15s</option>
              <option value={30}>Every 30s (Default)</option>
              <option value={60}>Every 1m</option>
              <option value={180}>Every 3m</option>
              <option value={300}>Every 5m</option>
            </select>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Background polling checks for live changes in Google Sheets.
          </div>
        </div>
      )}
    </div>
  );
});
