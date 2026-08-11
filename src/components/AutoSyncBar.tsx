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
    <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:px-3 sm:py-2 shadow-inner backdrop-blur-md transition-all overflow-hidden">
      {/* Active Sync: Horizontal Scanning Progress Beam across top edge */}
      {isSyncing && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800 overflow-hidden z-20">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.9)]"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left Status & Indicators */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Status Box Icon */}
            <div className="relative shrink-0">
              <div className={`p-2 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                autoSyncEnabled 
                  ? 'bg-slate-950 border-emerald-500/40 text-emerald-300 shadow-sm' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}>
                <Zap className={`w-4 h-4 ${isSyncing ? 'animate-bounce text-cyan-400' : 'text-emerald-400'}`} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight">
                  Google Sheet Sync
                </span>
                
                {/* Status Badge */}
                {autoSyncEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                    </span>
                    <span>LIVE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    PAUSED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                {isSyncing ? (
                  <span className="text-cyan-400 font-medium animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching live data...</span>
                  </span>
                ) : syncStatus === 'success' ? (
                  <span className="text-emerald-400/90 flex items-center gap-1.5 flex-wrap font-medium text-xs min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="font-semibold text-emerald-300">{syncedCount} records synced ({lastSyncTime})</span>
                    {autoSyncEnabled && (
                      <span className="text-slate-500 font-mono text-xs shrink-0">• Poll: {countdown}s</span>
                    )}
                  </span>
                ) : syncStatus === 'error' ? (
                  <span className="text-amber-400 flex items-center gap-1 font-medium text-xs flex-wrap">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{statusMessage}</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">{statusMessage}</span>
                )}
              </p>
            </div>
          </div>

          {/* Mobile Collapse/Expand Controls Button */}
          <button
            type="button"
            onClick={() => setIsControlsOpenMobile(!isControlsOpenMobile)}
            className="sm:hidden min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/90 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 ml-2"
          >
            <span>{isControlsOpenMobile ? 'Hide' : 'Sync Controls'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isControlsOpenMobile ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Right Controls - Collapsible on Mobile, always visible on Desktop */}
        <div className={`${isControlsOpenMobile ? 'flex' : 'hidden'} sm:flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 justify-stretch sm:justify-end w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/80`}>
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer flex-1 sm:flex-initial whitespace-nowrap active:scale-95 ${
              autoSyncEnabled
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-600/40'
            }`}
            title={autoSyncEnabled ? "Pause Auto-Sync" : "Enable Auto-Sync"}
          >
            {autoSyncEnabled ? (
              <>
                <Pause className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold">Resume</span>
              </>
            )}
          </button>

          {/* Sync Now Button - Secondary wireframe outline style */}
          <button
            type="button"
            onClick={performSync}
            disabled={isSyncing}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer flex-1 sm:flex-initial whitespace-nowrap ${
              isSyncing 
                ? 'bg-slate-900 border border-cyan-500/50 text-cyan-200' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/80 hover:border-slate-600'
            }`}
            title="Sync data now"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncing ? 'animate-spin text-cyan-400 stroke-[2.5]' : 'text-slate-400'}`} />
            <span className="text-xs font-bold">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {/* Configure Sheet Modal Trigger */}
          {onOpenSyncModal && (
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="min-h-[44px] bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer flex-1 sm:flex-initial whitespace-nowrap"
              title="Open Google Sheet configuration"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">Sheet Config</span>
            </button>
          )}

          {/* Auto-Sync Settings Cog */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors cursor-pointer shrink-0 ${
              showSettings ? 'bg-slate-800 border-cyan-500/50 text-cyan-300' : 'bg-slate-950 border-slate-800'
            }`}
            title="Auto-Sync Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Settings Bar */}
      {showSettings && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">Auto-Sync Frequency:</span>
            <select
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-cyan-300 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value={15}>Every 15 Seconds</option>
              <option value={30}>Every 30 Seconds (Default)</option>
              <option value={60}>Every 1 Minute</option>
              <option value={180}>Every 3 Minutes</option>
              <option value={300}>Every 5 Minutes</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-400">
            Automated background polling checks for live changes in Google Sheets without refreshing the browser tab.
          </div>
        </div>
      )}
    </div>
  );
});
