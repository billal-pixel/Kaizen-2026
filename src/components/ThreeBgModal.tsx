import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Box, 
  Sparkles, 
  Activity, 
  Compass, 
  Sliders, 
  Eye, 
  EyeOff, 
  Gauge, 
  MousePointer, 
  CheckCircle2,
  Layers
} from 'lucide-react';
import { ThreeBgStyle, ThreeBgIntensity } from './ThreeBackground';

interface ThreeBgModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  onToggleEnabled: () => void;
  style: ThreeBgStyle;
  onSelectStyle: (style: ThreeBgStyle) => void;
  intensity: ThreeBgIntensity;
  onSelectIntensity: (intensity: ThreeBgIntensity) => void;
  speed: number;
  onSelectSpeed: (speed: number) => void;
  interactive: boolean;
  onToggleInteractive: () => void;
}

export const ThreeBgModal: React.FC<ThreeBgModalProps> = ({
  isOpen,
  onClose,
  enabled,
  onToggleEnabled,
  style,
  onSelectStyle,
  intensity,
  onSelectIntensity,
  speed,
  onSelectSpeed,
  interactive,
  onToggleInteractive,
}) => {
  if (!isOpen) return null;

  const stylesList: Array<{
    id: ThreeBgStyle;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ElementType;
    badge: string;
    color: string;
  }> = [
    {
      id: 'cyber_grid',
      title: '3D Cyber Grid',
      subtitle: 'Undulating Matrix Terrain',
      description: 'Dynamic sine-wave cybernetic terrain with wireframe geometry and floating horizon markers.',
      icon: Activity,
      badge: 'POPULAR',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
    },
    {
      id: 'neural_constellation',
      title: '3D Neural Nexus',
      subtitle: 'Nodes & Orbital Rings',
      description: 'Connected floating constellation nodes with dynamic line physics and gyroscope tech rings.',
      icon: Sparkles,
      badge: 'TECH',
      color: 'text-sky-400 border-sky-500/40 bg-sky-950/30',
    },
    {
      id: 'floating_prisms',
      title: '3D Geometric Prisms',
      subtitle: 'Faceted Crystals & Polyhedra',
      description: 'Reflective icosahedrons, octahedrons, and cubes drifting and rotating with directional specular light.',
      icon: Box,
      badge: 'ELEGANT',
      color: 'text-purple-400 border-purple-500/40 bg-purple-950/30',
    },
    {
      id: 'starfield_warp',
      title: '3D Starfield Warp',
      subtitle: 'Galactic Cyber Stream',
      description: 'High-speed particle velocity stream through 3D space with continuous depth loops.',
      icon: Compass,
      badge: 'IMMERSIVE',
      color: 'text-teal-400 border-teal-500/40 bg-teal-950/30',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0A1628] border border-[#1A3154] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[#1A3154] flex items-center justify-between bg-[#0D1E36]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-sky-500/20 border border-teal-500/30 text-teal-300">
                <Box className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white tracking-wide">3D Background Experiences</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950 border border-teal-500/40 text-teal-300 font-bold uppercase">
                    WebGL Real-Time
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Select your preferred real-time 3D visual atmosphere with interactive mouse depth.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Master Toggle Banner */}
            <div className="flex items-center justify-between p-3.5 bg-[#0F223D] border border-[#1E3A5F] rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {enabled ? <Eye className="w-4 h-4 stroke-[2.5]" /> : <EyeOff className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>3D Canvas Background</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${enabled ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {enabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {enabled ? 'Renders real-time Three.js shaders behind the dashboard.' : 'Disabled to save system GPU resources.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleEnabled}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                  enabled
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white shadow-md shadow-emerald-950'
                }`}
              >
                {enabled ? 'Turn Off' : 'Enable 3D'}
              </button>
            </div>

            {/* 3D Scene Presets Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Choose 3D Atmosphere ({stylesList.length} Presets)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stylesList.map((item) => {
                  const Icon = item.icon;
                  const isSelected = style === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!enabled}
                      onClick={() => onSelectStyle(item.id)}
                      className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] group ${
                        !enabled
                          ? 'opacity-40 cursor-not-allowed bg-[#091424] border-slate-800'
                          : isSelected
                          ? 'bg-[#132C4D] border-teal-400 shadow-lg shadow-teal-950/50 ring-1 ring-teal-400/30'
                          : 'bg-[#0F223D] hover:bg-[#162E50] border-[#1E3A5F] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg border ${item.color}`}>
                            <Icon className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white group-hover:text-teal-300 transition-colors">
                              {item.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                        ) : (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine Tuning Controls */}
            <div className={`space-y-4 pt-2 border-t border-[#1A3154] ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Motion & Intensity Controls</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Intensity Setting */}
                <div className="p-3 bg-[#0F223D] border border-[#1E3A5F] rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Opacity Intensity</span>
                    <span className="text-teal-400 capitalize">{intensity}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['subtle', 'balanced', 'vivid'] as ThreeBgIntensity[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onSelectIntensity(val)}
                        className={`py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
                          intensity === val
                            ? 'bg-teal-600 border-teal-400 text-white'
                            : 'bg-[#162D4E] border-[#224470] text-slate-300 hover:text-white'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation Speed Setting */}
                <div className="p-3 bg-[#0F223D] border border-[#1E3A5F] rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-sky-400" />
                      <span>Speed</span>
                    </span>
                    <span className="text-sky-400 font-mono">{speed}x</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { val: 0.5, label: '0.5x' },
                      { val: 1.0, label: '1.0x' },
                      { val: 1.5, label: '1.5x' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => onSelectSpeed(item.val)}
                        className={`py-1.5 text-[10px] font-black font-mono rounded-lg border transition-all ${
                          speed === item.val
                            ? 'bg-sky-600 border-sky-400 text-white'
                            : 'bg-[#162D4E] border-[#224470] text-slate-300 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mouse Parallax Tilt Setting */}
                <div className="p-3 bg-[#0F223D] border border-[#1E3A5F] rounded-xl flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-3 h-3 text-amber-400" />
                      <span>Mouse Tilt</span>
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${interactive ? 'text-amber-400' : 'text-slate-500'}`}>
                      {interactive ? 'Active' : 'Static'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleInteractive}
                    className={`mt-2 py-1.5 px-2 text-[10px] font-black uppercase rounded-lg border transition-all ${
                      interactive
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-[#162D4E] border-[#224470] text-slate-400'
                    }`}
                  >
                    {interactive ? 'Tilt On (Responsive)' : 'Tilt Off (Static)'}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-[#1A3154] bg-[#0D1E36] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              GPU acceleration enabled • Real-time frame loop
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 border border-teal-400 text-white font-black text-xs shadow-md shadow-teal-950/50 transition-all active:scale-95"
            >
              Done & Save View
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
