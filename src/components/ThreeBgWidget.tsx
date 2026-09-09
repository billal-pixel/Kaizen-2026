import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Activity, 
  Sparkles, 
  Compass, 
  Sliders, 
  ChevronUp
} from 'lucide-react';
import { ThreeBgStyle, ThreeBgIntensity } from './ThreeBackground';

interface ThreeBgWidgetProps {
  enabled: boolean;
  onToggleEnabled: () => void;
  style: ThreeBgStyle;
  onSelectStyle: (style: ThreeBgStyle) => void;
  intensity: ThreeBgIntensity;
  onSelectIntensity: (intensity: ThreeBgIntensity) => void;
  onOpenModal: () => void;
}

export const ThreeBgWidget: React.FC<ThreeBgWidgetProps> = ({
  enabled,
  onToggleEnabled,
  style,
  onSelectStyle,
  onOpenModal,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const styleNames: Record<ThreeBgStyle, { label: string; icon: React.ElementType }> = {
    cyber_grid: { label: 'Sky Cyber Grid', icon: Activity },
    neural_constellation: { label: 'Sky Neural Nexus', icon: Sparkles },
    floating_prisms: { label: 'Sky Prisms', icon: Box },
    starfield_warp: { label: 'Sky Warp Stream', icon: Compass },
  };

  const CurrentIcon = styleNames[style]?.icon || Box;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end select-none">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="mb-2 bg-[#082F49]/95 border border-sky-600/50 rounded-2xl shadow-2xl p-3 w-64 backdrop-blur-md text-white space-y-2.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-sky-800/60">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-sky-400 stroke-[2.5]" />
                <span className="text-xs font-black tracking-wide">3D Sky Canvas</span>
              </div>
              <button
                type="button"
                onClick={onToggleEnabled}
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border transition-colors ${
                  enabled
                    ? 'bg-sky-950 border-sky-400/60 text-sky-200 hover:bg-sky-900'
                    : 'bg-rose-950 border-rose-500/50 text-rose-300 hover:bg-rose-900'
                }`}
              >
                {enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                Switch 3D Scene:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['cyber_grid', 'neural_constellation', 'floating_prisms', 'starfield_warp'] as ThreeBgStyle[]).map((s) => {
                  const Icon = styleNames[s].icon;
                  const active = style === s && enabled;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        if (!enabled) onToggleEnabled();
                        onSelectStyle(s);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all text-left truncate cursor-pointer ${
                        active
                          ? 'bg-sky-600 border-sky-300 text-white shadow-xs'
                          : 'bg-[#0c3d61] hover:bg-[#124d7a] border-sky-700/60 text-sky-100 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-sky-300'}`} />
                      <span className="truncate">{styleNames[s].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deep Config Button */}
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                onOpenModal();
              }}
              className="w-full py-1.5 px-2 bg-sky-900/80 hover:bg-sky-800 border border-sky-600/60 hover:border-sky-300 rounded-xl text-[11px] font-bold text-sky-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Full 3D Controls & Physics</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        title="3D Background Atmosphere Switcher"
        className={`group h-8 px-3 rounded-full border shadow-xl flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer active:scale-95 ${
          enabled
            ? 'bg-[#082F49]/95 hover:bg-[#0c3d61] border-sky-400/80 text-white shadow-sky-950/40 ring-1 ring-sky-400/30'
            : 'bg-[#082F49]/80 hover:bg-[#0c3d61] border-slate-700 text-slate-400 shadow-black/40'
        }`}
      >
        <div className="relative">
          <CurrentIcon className={`w-4 h-4 stroke-[2.2] ${enabled ? 'text-sky-300' : 'text-slate-400'}`} />
          {enabled && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          )}
        </div>
        <span className="text-xs font-black tracking-wide">
          {enabled ? styleNames[style].label : '3D Off'}
        </span>
        <ChevronUp className={`w-3.5 h-3.5 text-sky-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
