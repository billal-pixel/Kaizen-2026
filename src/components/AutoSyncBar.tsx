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
  ArrowRight
} from 'lucide-react';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { parseCsvText } from '../utils/sheetParser';

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
    if (!sheetUrl) return;

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      // Call multi-tab endpoint to sync both Stationed (gid=0) and Virtual (gid=1487776310) tabs simultaneously
      const multiSyncUrl = `/api/sheets-sync-all?url=${encodeURIComponent(sheetUrl)}&_t=${Date.now()}`;
      const res = await fetch(multiSyncUrl);

      if (!res.ok) {
        throw new Error('Google Sheet link restricted or offline.');
      }

      const syncResult = await res.json();

      if (!syncResult.success || !syncResult.sheets) {
        throw new Error(syncResult.error || 'Failed to sync Google Sheet data.');
      }

      let totalStationedImported = 0;
      let totalVirtualImported = 0;

      // Parse each sheet tab
      for (const gid of Object.keys(syncResult.sheets)) {
        const csvText = syncResult.sheets[gid];
        if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('document-root')) continue;

        const parsed = await parseCsvText(csvText, 'auto');

        if (parsed.stationed && parsed.stationed.length > 0) {
          stationedImportRef.current(parsed.stationed, true);
          totalStationedImported += parsed.stationed.length;
        }

        if (parsed.virtual && parsed.virtual.length > 0) {
          virtualImportRef.current(parsed.virtual, true);
          totalVirtualImported += parsed.virtual.length;
        }
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
    <div className="relative bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/30 rounded-xl px-3 py-1.5 shadow-inner backdrop-blur-md transition-all overflow-hidden">
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
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Status Box Icon with Gentle Cyan/Green Breather Glow */}
          <div className="relative group shrink-0">
            {autoSyncEnabled && (
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-emerald-500/40 rounded-xl blur-xs animate-pulse opacity-80" />
            )}
            <div className={`relative p-1.5 rounded-lg border flex items-center justify-center transition-all duration-300 ${
              autoSyncEnabled 
                ? 'bg-slate-950 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce text-cyan-400' : 'text-emerald-400'}`} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-100 tracking-tight">
                Google Sheet Live Sync
              </span>
              
              {/* Pulsing Status Beacon */}
              {autoSyncEnabled ? (
                <span className="relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm overflow-hidden">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"></span>
                  </span>
                  <span className="tracking-wider">LIVE</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  PAUSED
                </span>
              )}
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              {isSyncing ? (
                <span className="text-cyan-400 font-medium animate-pulse flex items-center gap-1 text-[10px]">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Fetching updates...
                </span>
              ) : syncStatus === 'success' ? (
                <span className="text-emerald-400/90 flex items-center gap-1 font-medium text-[10px] sm:text-[11px]">
                  <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
                  <span>{syncedCount} records synced ({lastSyncTime})</span>
                  {autoSyncEnabled && (
                    <span className="text-slate-500 font-mono text-[10px] ml-1">• Poll in {countdown}s</span>
                  )}
                </span>
              ) : syncStatus === 'error' ? (
                <span className="text-amber-400 flex items-center gap-1 font-medium truncate max-w-xs text-[10px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {statusMessage}
                </span>
              ) : (
                <span className="truncate max-w-xs text-[10px]">{statusMessage}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
              autoSyncEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
            }`}
            title={autoSyncEnabled ? "Pause Auto-Sync" : "Enable Auto-Sync"}
          >
            {autoSyncEnabled ? (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Resume</span>
              </>
            )}
          </button>

          {/* Sync Now Button with active rotation & glow */}
          <button
            type="button"
            onClick={performSync}
            disabled={isSyncing}
            className={`relative px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer overflow-hidden ${
              isSyncing 
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.4)]' 
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60'
            }`}
            title="Sync data now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-300 stroke-[2.5]' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {/* Configure Sheet Modal Trigger with Glint Border & Tactile Press */}
          {onOpenSyncModal && (
            <motion.button
              whileHover={{ scale: 1.03, y: -0.5 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onOpenSyncModal}
              className="group relative bg-emerald-950/90 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400/80 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer overflow-hidden"
              title="Open Google Sheet configuration & paste modal"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/20 to-emerald-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
              <span>Sheet Config</span>
            </motion.button>
          )}

          {/* Auto-Sync Settings Cog */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-100 transition-colors cursor-pointer ${
              showSettings ? 'bg-slate-800 border-cyan-500/40 text-cyan-300' : 'bg-slate-950/80 border-slate-800'
            }`}
            title="Auto-Sync Settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
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
