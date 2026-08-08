import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  WifiOff, 
  Lock, 
  RefreshCw, 
  FileSpreadsheet, 
  X,
  HelpCircle
} from 'lucide-react';
import { AutoRefreshErrorType } from '../hooks/useAutoRefresh';

interface SyncErrorAlertProps {
  errorMessage: string | null;
  errorType: AutoRefreshErrorType;
  lastErrorAt: Date | null;
  consecutiveErrors: number;
  isRefreshing: boolean;
  isErrorDismissed: boolean;
  onRetry: () => void;
  onOpenSyncModal: () => void;
  onDismiss: () => void;
}

export const SyncErrorAlert: React.FC<SyncErrorAlertProps> = ({
  errorMessage,
  errorType,
  lastErrorAt,
  consecutiveErrors,
  isRefreshing,
  isErrorDismissed,
  onRetry,
  onOpenSyncModal,
  onDismiss,
}) => {
  if (!errorMessage || isErrorDismissed) {
    return null;
  }

  const getErrorIcon = () => {
    switch (errorType) {
      case 'restricted':
        return <Lock className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'network':
        return <WifiOff className="w-5 h-5 text-red-400 shrink-0" />;
      case 'invalid_url':
        return <HelpCircle className="w-5 h-5 text-orange-400 shrink-0" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    }
  };

  const getBadgeText = () => {
    switch (errorType) {
      case 'restricted':
        return 'Restricted Access';
      case 'network':
        return 'Network Timeout';
      case 'invalid_url':
        return 'Invalid URL';
      case 'empty_data':
        return 'No Data Rows';
      default:
        return 'Sync Issue';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="mb-6 rounded-2xl border border-amber-500/40 bg-slate-900/95 p-4 shadow-xl shadow-amber-950/20 backdrop-blur-md relative overflow-hidden"
      >
        {/* Subtle warning glow stripe across top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Message and details */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0 mt-0.5">
              {getErrorIcon()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-100">
                  Google Sheet Auto-Sync Warning
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {getBadgeText()}
                </span>
                {consecutiveErrors > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Failed {consecutiveErrors}x
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {errorMessage}
              </p>

              {lastErrorAt && (
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Last failed attempt: {lastErrorAt.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              type="button"
              onClick={onRetry}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Retrying...' : 'Retry Now'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSyncModal}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Paste Cells</span>
            </button>

            <button
              type="button"
              onClick={onDismiss}
              title="Dismiss warning"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
