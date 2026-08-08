import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  BarChart3, 
  Users, 
  CheckSquare, 
  Clock, 
  Sparkles,
  PhoneCall,
  CreditCard,
  Globe,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { AutoSyncBar } from './AutoSyncBar';

interface HeaderProps {
  activeTab: 'overview' | 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report';
  setActiveTab: (tab: 'overview' | 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report') => void;
  teamLeaderName: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenSheetSync: () => void;
  onOpenAddModal: () => void;
  onOpenPaymentModal?: () => void;
  onResetData?: () => void;
  stationedCount: number;
  virtualCount: number;
  callRecordsCount?: number;
  totalSales: number;
  avgKpi: number;
  sheetUrl?: string;
  onUpdateSheetUrl?: (newUrl: string) => void;
  onImportStationedData?: (data: StationedAdvisor[], replace?: boolean) => void;
  onImportVirtualData?: (data: VirtualAdvisor[], replace?: boolean) => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  activeTab,
  setActiveTab,
  teamLeaderName,
  theme = 'dark',
  onToggleTheme,
  onOpenSheetSync,
  onOpenAddModal,
  onOpenPaymentModal,
  onResetData,
  stationedCount,
  virtualCount,
  callRecordsCount = 0,
  totalSales,
  avgKpi,
  sheetUrl = '',
  onUpdateSheetUrl = () => {},
  onImportStationedData = () => {},
  onImportVirtualData = () => {},
}) => {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-colors duration-300 relative overflow-hidden ${
      theme === 'light'
        ? 'bg-slate-50/95 text-slate-900 border-slate-300/80 shadow-lg shadow-slate-200/50'
        : 'bg-slate-950/90 text-slate-100 border-cyan-500/20 shadow-2xl shadow-slate-950/90'
    }`}>
      {/* Top Animated Cyan/Sky Glow Hairline Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 via-sky-400/80 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with Brand ID on Left and grouped Actions & Integrations on Right */}
        <div className="py-3 flex flex-col lg:flex-row items-center justify-between gap-3.5 border-b border-slate-800/70">
          
          {/* Left: Brand ID & Team Leader */}
          <div className="flex items-center gap-3.5 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              {/* Hologram Floating Logo Shield */}
              <motion.div 
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative group cursor-pointer shrink-0"
              >
                {/* Ambient Cyan Hologram Glow Layer */}
                <motion.div 
                  animate={{ 
                    opacity: [0.4, 0.75, 0.4], 
                    scale: [0.98, 1.06, 0.98] 
                  }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 rounded-2xl blur-md shadow-[0_0_22px_rgba(34,211,238,0.65)]"
                />
                <div className="relative bg-slate-900 border border-cyan-400/50 p-1 rounded-xl shadow-inner shadow-cyan-500/20 backdrop-blur-md">
                  <KaizenLogo size="md" />
                </div>
              </motion.div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-cyan-100 to-slate-100 bg-clip-text text-transparent uppercase font-sans drop-shadow-sm">
                    TEAM KAIZEN
                  </h1>
                  <span className="bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase shadow-inner flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>COMMAND CENTER</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-900/80 border border-slate-800/80 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>TL:</span>
                    <strong className="text-cyan-300 font-semibold">{teamLeaderName}</strong>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-md font-mono">
                    <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>10MS Live Hub</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Grouped Controls (Integration Settings, Quick Links, Payment CTA, Add Advisor) */}
          <div className="flex flex-wrap items-center gap-2.5 justify-end w-full lg:w-auto">
            
            {/* Live Google Sheet Integration Widget */}
            <div className="min-w-0">
              <AutoSyncBar
                sheetUrl={sheetUrl}
                onUpdateSheetUrl={onUpdateSheetUrl}
                onImportStationedData={onImportStationedData}
                onImportVirtualData={onImportVirtualData}
                onOpenSyncModal={onOpenSheetSync}
              />
            </div>

            {/* Team Google Sites Quick Links (Essential Link & Virtual Link) */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-inner backdrop-blur-md">
              <motion.a
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.96 }}
                href="https://sites.google.com/view/10msmirpur/home"
                target="_blank"
                rel="noreferrer"
                title="10MS Mirpur Station Essential Link Google Site"
                className="group relative px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/30 hover:border-cyan-400/80 text-cyan-300 hover:text-cyan-100 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                <span>Essential Link</span>
                <ExternalLink className="w-3 h-3 text-cyan-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.02, y: -0.5 }}
                whileTap={{ scale: 0.96 }}
                href="https://sites.google.com/view/10ms-vt-essential/home"
                target="_blank"
                rel="noreferrer"
                title="Virtual Team Essential Links Google Site"
                className="group relative px-3 py-1.5 bg-sky-950/70 hover:bg-sky-900/90 border border-sky-500/30 hover:border-sky-400/80 text-sky-300 hover:text-sky-100 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(56,189,248,0.25)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400/0 via-sky-400/20 to-sky-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <Globe className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                <span>Virtual Link</span>
                <ExternalLink className="w-3 h-3 text-sky-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </motion.a>
            </div>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <motion.button
                whileHover={{ scale: 1.04, y: -0.5 }}
                whileTap={{ scale: 0.96 }}
                onClick={onToggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to High-Contrast Light Mode'}
                className={`group relative px-3 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-sm ${
                  theme === 'light'
                    ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950 shadow-amber-500/10 ring-1 ring-amber-400/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-amber-300 shadow-inner hover:border-amber-500/40'
                }`}
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-600 shrink-0 animate-spin-slow" />
                    <span className="font-extrabold text-[11px] text-amber-950">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-amber-300 shrink-0 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="font-extrabold text-[11px] text-slate-200 group-hover:text-amber-200">Dark Mode</span>
                  </>
                )}
              </motion.button>
            )}

            {/* Payment Copy Messages Button with Glint Border & Tactile Press */}
            {onOpenPaymentModal && (
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenPaymentModal}
                className="group relative bg-slate-900 hover:bg-slate-850 border border-pink-500/40 hover:border-pink-400/90 text-pink-300 hover:text-pink-100 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer shadow-lg shadow-pink-500/10 hover:shadow-[0_0_16px_rgba(236,72,153,0.3)] overflow-hidden"
              >
                {/* Glint Sweep Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-400/25 to-pink-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                <CreditCard className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform duration-200 shrink-0" />
                <span>Payment Texts</span>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              </motion.button>
            )}

            {/* Primary Action CTA: Add Advisor with Pulsing Outline Glow, Tactile Press & Shimmer Sweep */}
            <div className="relative group shrink-0">
              {/* Pulsing Outline Aura */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-400 opacity-70 blur-xs animate-pulse group-hover:opacity-100 group-hover:blur-sm transition-all duration-300" />
              
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenAddModal}
                className="relative bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-200 shrink-0 cursor-pointer overflow-hidden border border-cyan-200/50"
              >
                {/* Fast Shimmer Sweep Across Surface */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-600 ease-out" />
                <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300 shrink-0" />
                <span className="tracking-wide">Add Advisor</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {[
            { id: 'overview', label: 'Executive Dashboard', icon: BarChart3, color: 'text-cyan-400' },
            { id: 'stationed', label: 'Stationed Team', icon: Users, color: 'text-cyan-400', badge: stationedCount },
            { id: 'virtual', label: 'Virtual Team', icon: Users, color: 'text-sky-400', badge: virtualCount },
            { id: 'call_records', label: 'Call Records', icon: PhoneCall, color: 'text-cyan-400', badge: callRecordsCount },
            { id: 'tasks', label: 'Task Manager', icon: CheckSquare, color: 'text-indigo-400' },
            { id: 'time', label: 'Time Tracker', icon: Clock, color: 'text-emerald-400' },
            { id: 'ai_report', label: 'AI Operations Report', icon: Sparkles, color: 'text-cyan-300', isAi: true },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group relative px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-cyan-100 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className={`absolute inset-0 rounded-xl border ${
                      tab.isAi 
                        ? 'bg-gradient-to-r from-cyan-500/25 via-indigo-500/20 to-sky-500/25 border-cyan-400/60 shadow-lg shadow-cyan-500/20'
                        : 'bg-cyan-500/20 border-cyan-400/50 shadow-md shadow-cyan-500/15'
                    }`}
                    transition={{ type: 'spring', stiffness: 480, damping: 32 }}
                  >
                    {/* Glowing bottom line accent indicator */}
                    <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
                  </motion.div>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.isAi ? (
                    <div className="relative flex items-center justify-center">
                      {/* Sparkle Aura Glow Behind AI Icon */}
                      <motion.div
                        animate={{
                          scale: [0.85, 1.3, 0.85],
                          opacity: [0.35, 0.8, 0.35],
                          rotate: [0, 180, 360],
                        }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-sky-400 blur-xs opacity-70"
                      />
                      
                      {/* Sparkling Micro Icon */}
                      <motion.div
                        animate={{
                          rotate: [0, 12, -12, 0],
                          scale: [1, 1.18, 1],
                        }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="relative z-10"
                      >
                        <Sparkles className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                      </motion.div>

                      {/* Floating Micro Particle Stars */}
                      <motion.span
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          x: [-5, -9, -5],
                          y: [-5, -9, -5],
                        }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_4px_#22d3ee]"
                      />
                      <motion.span
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          x: [5, 9, 5],
                          y: [3, 7, 3],
                        }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: 0.8, ease: "easeInOut" }}
                        className="absolute w-1 h-1 bg-sky-200 rounded-full shadow-[0_0_4px_#38bdf8]"
                      />
                    </div>
                  ) : (
                    <Icon className={`w-4 h-4 transition-all duration-200 group-hover:scale-110 ${
                      isActive 
                        ? tab.color 
                        : 'text-slate-400 group-hover:text-cyan-300 group-hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]'
                    }`} />
                  )}
                  
                  {tab.isAi ? (
                    <span className="relative bg-gradient-to-r from-cyan-200 via-indigo-200 to-sky-100 bg-clip-text text-transparent font-black tracking-wide flex items-center gap-1.5">
                      <span>{tab.label}</span>
                      <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-400/40 text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono shadow-inner tracking-wider">
                        AI 2.0
                      </span>
                    </span>
                  ) : (
                    <span className="transition-colors group-hover:text-slate-100">{tab.label}</span>
                  )}

                  {tab.badge !== undefined && (
                    <motion.span
                      key={tab.badge}
                      initial={{ scale: 0.75 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold font-mono transition-colors ${
                        isActive 
                          ? 'bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-400/50' 
                          : 'bg-slate-800/90 text-slate-300 border border-slate-700/70 group-hover:border-cyan-500/40 group-hover:text-cyan-200'
                      }`}
                    >
                      {tab.badge}
                    </motion.span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </header>
  );
});

