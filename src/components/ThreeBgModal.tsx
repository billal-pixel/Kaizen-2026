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
      title: '3D Sky Cyber Grid',
      subtitle: 'Undulating Sky Wave Terrain',
      description: 'Dynamic sine-wave cybernetic terrain in luminous sky blue wireframe with drifting atmospheric crystals.',
      icon: Activity,
      badge: 'DEFAULT',
      color: 'text-sky-300 border-sky-400/40 bg-sky-950/40',
    },
    {
      id: 'neural_constellation',
      title: '3D Sky Neural Nexus',
      subtitle: 'Synaptic Nodes & Orbital Rings',
      description: 'Connected sky blue constellation nodes with real-time vector connections and tri-axial gyroscope rings.',
      icon: Sparkles,
      badge: 'TECH',
      color: 'text-sky-400 border-sky-500/40 bg-sky-950/40',
    },
    {
      id: 'floating_prisms',
      title: '3D Sky Crystal Prisms',
      subtitle: 'Faceted Polyhedral Crystals',
      description: 'Reflective icosahedrons, dodecahedrons, and cubes drifting and rotating with sky-tinted specular light.',
      icon: Box,
      badge: 'CRYSTAL',
      color: 'text-sky-200 border-sky-300/40 bg-sky-950/40',
    },
    {
      id: 'starfield_warp',
      title: '3D Sky Warp Stream',
      subtitle: 'Celestial Velocity Stream',
      description: 'High-speed sky blue particle stream through continuous 3D depth with responsive parallax steering.',
      icon: Compass,
      badge: 'WARP',
      color: 'text-cyan-300 border-cyan-400/40 bg-cyan-950/40',
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
          className="bg-[#082F49] border border-sky-600/50 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-sky-800/80 flex items-center justify-between bg-[#0b3b5c]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-400/20 to-sky-600/30 border border-sky-400/40 text-sky-300">
                <Box className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white tracking-wide">3D Sky Canvas Atmosphere</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 border border-sky-400/50 text-sky-300 font-bold uppercase">
                    WebGL 3D
                  </span>
                </div>
                <p className="text-xs text-sky-200">
                  Full-screen 3D graphics rendered seamlessly across the whole sky blue canvas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-sky-800/80 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Master Toggle Banner */}
            <div className="flex items-center justify-between p-3.5 bg-[#0c3d61] border border-sky-600/40 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${enabled ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'}`}>
                  {enabled ? <Eye className="w-4 h-4 stroke-[2.5]" /> : <EyeOff className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>3D Canvas Background</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${enabled ? 'bg-sky-950 border border-sky-400/50 text-sky-300' : 'bg-slate-800 text-slate-400'}`}>
                      {enabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-sky-200">
                    {enabled ? 'Rendering full-viewport 3D sky environment in real-time.' : 'Paused to conserve device resources.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleEnabled}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                  enabled
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300'
                    : 'bg-sky-600 hover:bg-sky-500 border border-sky-400 text-white shadow-md shadow-sky-950'
                }`}
              >
                {enabled ? 'Turn Off' : 'Enable 3D'}
              </button>
            </div>

            {/* 3D Scene Presets Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-sky-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Choose 3D Scene ({stylesList.length} Presets)</span>
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
                          ? 'opacity-40 cursor-not-allowed bg-[#072438] border-sky-900'
                          : isSelected
                          ? 'bg-[#0e4873] border-sky-300 shadow-lg shadow-sky-950/60 ring-2 ring-sky-400/40'
                          : 'bg-[#0c3d61] hover:bg-[#124e7a] border-sky-700/60 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg border ${item.color}`}>
                            <Icon className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white group-hover:text-sky-200 transition-colors">
                              {item.title}
                            </h4>
                            <span className="text-[11px] text-sky-200 font-medium">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
                        ) : (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-700">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-sky-100 mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine Tuning Controls */}
            <div className={`space-y-4 pt-2 border-t border-sky-800/80 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="text-xs font-black uppercase tracking-wider text-sky-100 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-300" />
                <span>Motion & Intensity Controls</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Intensity Setting */}
                <div className="p-3 bg-[#0c3d61] border border-sky-600/40 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-sky-100 flex items-center justify-between">
                    <span>Opacity Intensity</span>
                    <span className="text-sky-300 capitalize">{intensity}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['subtle', 'balanced', 'vivid'] as ThreeBgIntensity[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onSelectIntensity(val)}
                        className={`py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          intensity === val
                            ? 'bg-sky-600 border-sky-300 text-white'
                            : 'bg-sky-900/60 border-sky-700/60 text-sky-200 hover:text-white'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation Speed Setting */}
                <div className="p-3 bg-[#0c3d61] border border-sky-600/40 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-sky-100 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-sky-300" />
                      <span>Speed</span>
                    </span>
                    <span className="text-sky-300 font-mono">{speed}x</span>
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
                        className={`py-1.5 text-[10px] font-black font-mono rounded-lg border transition-all cursor-pointer ${
                          speed === item.val
                            ? 'bg-sky-600 border-sky-300 text-white'
                            : 'bg-sky-900/60 border-sky-700/60 text-sky-200 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mouse Parallax Tilt Setting */}
                <div className="p-3 bg-[#0c3d61] border border-sky-600/40 rounded-xl flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-sky-100 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-3 h-3 text-sky-300" />
                      <span>Mouse Tilt</span>
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${interactive ? 'text-sky-300' : 'text-slate-400'}`}>
                      {interactive ? 'Active' : 'Static'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleInteractive}
                    className={`mt-2 py-1.5 px-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                      interactive
                        ? 'bg-sky-500/25 border-sky-400/60 text-sky-200 hover:bg-sky-500/35'
                        : 'bg-sky-900/60 border-sky-700/60 text-slate-400'
                    }`}
                  >
                    {interactive ? 'Tilt On (Interactive)' : 'Tilt Off (Static)'}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-sky-800/80 bg-[#0b3b5c] flex items-center justify-between">
            <span className="text-[11px] text-sky-200">
              Sky Blue 3D Engine • Three.js WebGL Real-Time
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 border border-sky-300 text-white font-black text-xs shadow-md shadow-sky-950 transition-all active:scale-95 cursor-pointer"
            >
              Done & Save View
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
