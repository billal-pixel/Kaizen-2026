import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss?: () => void;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, onClose }) => {
  const handleClose = onClose || onDismiss || (() => {});

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] sm:w-full pointer-events-auto shadow-xl"
        >
          <div className="bg-slate-900 dark:bg-[#0B172A] text-white border border-slate-700/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 backdrop-blur-xl ring-1 ring-white/10">
            <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${
              toast.type === 'warning' 
                ? 'bg-amber-500/20 border border-amber-500/30' 
                : toast.type === 'info' 
                  ? 'bg-sky-500/20 border border-sky-500/30' 
                  : 'bg-emerald-500/20 border border-emerald-500/30'
            }`}>
              {toast.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-sky-400 stroke-[2.5]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
