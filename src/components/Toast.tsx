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
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-5 right-5 z-50 max-w-sm w-full pointer-events-auto"
        >
          <div className="bg-[#0A1628] text-white border border-[#234575] rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <div className="p-2 rounded-xl bg-[#132845] border border-[#2B4E7E] shrink-0 flex items-center justify-center">
              {toast.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-sky-400" />
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
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
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
