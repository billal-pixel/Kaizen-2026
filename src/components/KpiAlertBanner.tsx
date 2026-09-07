import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  Sliders, 
  Users, 
  Layers, 
  ArrowDownRight, 
  CheckCircle2, 
  X, 
  TrendingDown, 
  BellRing,
  Info,
  RotateCcw
} from 'lucide-react';
import { KpiAlertStatus, setStoredAlertThreshold } from '../utils/kpiAlertSystem';

interface KpiAlertBannerProps {
  alerts: KpiAlertStatus[];
  currentThreshold: number;
  onThresholdChange: (newThreshold: number) => void;
  onSelectAdvisor: (advisorId: string, teamType: 'stationed' | 'virtual') => void;
  filterActive: boolean;
  onToggleFilterAtRisk: () => void;
  className?: string;
}

export const KpiAlertBanner: React.FC<KpiAlertBannerProps> = ({
  alerts,
  currentThreshold,
  onThresholdChange,
  onSelectAdvisor,
  filterActive,
  onToggleFilterAtRisk,
  className = '',
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [tempThreshold, setTempThreshold] = useState<number>(currentThreshold);

  if (alerts.length === 0 && !isConfigOpen) {
    return (
      <div className={`bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-200">All Advisors Performing Above Threshold</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Threshold: {currentThreshold}% (3 consecutive updates)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">No advisors currently have 3 consecutive updates below the alert threshold.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setTempThreshold(currentThreshold);
            setIsConfigOpen(true);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors cursor-pointer shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Configure Alerts</span>
        </button>
      </div>
    );
  }

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 px-3 py-1 rounded-lg transition-all cursor-pointer shadow-xs"
        >
          <BellRing className="w-3.5 h-3.5 animate-bounce" />
          <span>Show KPI Alerts ({alerts.length})</span>
        </button>
      </div>
    );
  }

  const stationedAlerts = alerts.filter((a) => a.teamType === 'stationed');
  const virtualAlerts = alerts.filter((a) => a.teamType === 'virtual');

  const handleSaveThreshold = (val: number) => {
    setStoredAlertThreshold(val);
    onThresholdChange(val);
    setIsConfigOpen(false);
  };

  return (
    <div className={`relative bg-gradient-to-r from-rose-950/90 via-rose-950/80 to-slate-950/95 border-2 border-rose-600/70 dark:border-rose-500/80 rounded-2xl p-4 sm:p-5 shadow-xl shadow-rose-950/30 overflow-hidden transition-all ${className}`}>
      {/* Background Animated Pulse Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3.5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-800/50">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-xl shadow-inner shrink-0 relative">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-rose-100 text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                  Automated Performance Alert
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-rose-900/90 text-rose-200 border border-rose-700/80 text-[10px] font-mono font-black">
                  {alerts.length} Advisor{alerts.length > 1 ? 's' : ''} Flagged
                </span>
                <span className="text-[11px] font-mono font-bold text-rose-300/80">
                  Threshold: &lt;{currentThreshold}% for 3 consecutive updates
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5">
                System detected 3 consecutive milestone updates below the benchmark threshold. Immediate management intervention recommended.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {/* Filter Toggle */}
            <button
              type="button"
              onClick={onToggleFilterAtRisk}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterActive
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40 border border-rose-400'
                  : 'bg-rose-900/70 hover:bg-rose-800 text-rose-100 border border-rose-700/70'
              }`}
              title="Toggle to show only alerted advisors across the dashboard"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>{filterActive ? 'Showing At-Risk (Active)' : 'Filter At-Risk Only'}</span>
            </button>

            {/* Threshold Config Gear */}
            <button
              type="button"
              onClick={() => {
                setTempThreshold(currentThreshold);
                setIsConfigOpen(!isConfigOpen);
              }}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
              title="Configure Alert Threshold Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Drawer (if open) */}
        <AnimatePresence>
          {isConfigOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-950/90 border border-rose-800/60 rounded-xl p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  <span>Alert Threshold Settings</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">Trigger Alert when KPI &lt;</span>
                  <div className="flex items-center gap-1">
                    {[60, 65, 70, 75, 80].map((val) => (
                      <button
                        key={`thresh-opt-${val}`}
                        type="button"
                        onClick={() => handleSaveThreshold(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          currentThreshold === val
                            ? 'bg-rose-500 text-white font-black shadow-xs'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-400" />
                  <span>Rule: Triggers in red if 3 consecutive weekly updates drop below threshold.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flagged Advisor Micro-Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-0.5">
          {alerts.map((alert) => (
            <motion.div
              key={`alert-advisor-${alert.advisorId}`}
              whileHover={{ scale: 1.015 }}
              onClick={() => onSelectAdvisor(alert.advisorId, alert.teamType)}
              className="bg-slate-950/85 hover:bg-slate-900 border-2 border-rose-600/80 hover:border-rose-500 rounded-xl p-3 shadow-md flex items-center justify-between gap-3 cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-black text-xs shrink-0">
                  {alert.advisorName.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100 group-hover:text-rose-200 transition-colors truncate">
                      {alert.advisorName}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1 rounded ${
                      alert.teamType === 'stationed' ? 'bg-sky-950 text-sky-300 border border-sky-800/60' : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                    }`}>
                      {alert.teamType}
                    </span>
                  </div>

                  {/* Consecutive Trend Trajectory */}
                  <div className="flex items-center gap-1 text-[10px] font-mono text-rose-300/90 mt-0.5">
                    <TrendingDown className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">
                      {alert.recentScores.slice(-3).map((s) => `${s}%`).join(' → ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-rose-400 uppercase font-mono">Current KPI</span>
                  <span className="text-xs font-black text-rose-200 bg-rose-900/60 px-1.5 py-0.5 rounded border border-rose-700/60 font-mono">
                    {alert.currentKpi}%
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
