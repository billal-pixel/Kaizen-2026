import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  FileText,
  Link2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Sun,
  Moon,
  X,
  Compass,
  FileSpreadsheet,
  ChevronRight
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
  const [isActionDrawerOpen, setIsActionDrawerOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-colors duration-300 relative overflow-hidden ${
      theme === 'light'
        ? 'bg-slate-50/95 text-slate-900 border-slate-300/80 shadow-lg shadow-slate-200/50'
        : 'bg-slate-950/90 text-slate-100 border-cyan-500/20 shadow-2xl shadow-slate-950/90'
    }`}>
      {/* Top Animated Cyan/Sky Glow Hairline Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 via-sky-400/80 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top bar with Brand ID on Left and grouped Actions & Integrations on Right */}
        <div className="py-1.5 sm:py-2.5 flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-3 border-b border-slate-800/70">
          
          {/* Brand ID & Top-Level Quick Actions */}
          <div className="flex items-center justify-between gap-2.5 w-full lg:w-auto shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Hologram Floating Logo Shield */}
              <motion.div 
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative group cursor-pointer shrink-0 self-center"
              >
                <div className="relative bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-sm backdrop-blur-md flex items-center justify-center">
                  <KaizenLogo size="md" />
                </div>
              </motion.div>

              <div className="flex flex-col justify-center shrink-0 self-center min-w-max">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight uppercase font-sans leading-none text-white whitespace-nowrap">
                  TEAM KAIZEN
                </h1>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-[#38BDF8] whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span className="shrink-0 text-slate-400 font-medium">TL:</span>
                  <span className="text-[#38BDF8] font-bold leading-tight whitespace-nowrap">{teamLeaderName}</span>
                </div>
              </div>
            </div>

            {/* Mobile Top-Right Control: Theme Toggle (36x36px) */}
            <div className="flex items-center gap-2 shrink-0 self-center lg:hidden">
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to High-Contrast Light Mode'}
                  className={`w-9 h-9 min-h-[36px] min-w-[36px] p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-amber-100 border-amber-300 text-amber-950'
                      : 'bg-slate-900 border-slate-800 text-amber-300 hover:border-slate-700'
                  }`}
                >
                  {theme === 'light' ? (
                    <Sun className="w-4 h-4 text-amber-600 animate-spin-slow shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 text-amber-300 shrink-0" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Controls & Quick Access Integrations */}
          <div className="flex flex-col sm:flex-row lg:flex-row flex-wrap items-stretch sm:items-center gap-2.5 justify-end w-full lg:w-auto">
            
            {/* Live Google Sheet Integration Widget (Desktop Only) */}
            <div className="hidden lg:block w-full lg:w-auto min-w-0">
              <AutoSyncBar
                sheetUrl={sheetUrl}
                onUpdateSheetUrl={onUpdateSheetUrl}
                onImportStationedData={onImportStationedData}
                onImportVirtualData={onImportVirtualData}
                onOpenSyncModal={onOpenSheetSync}
              />
            </div>

            {/* Mobile Horizontal Scrolling Direct Link Chips */}
            <div className="relative w-full lg:hidden min-w-0">
              {/* Right Edge 12px Gradient Fade Visual Cue for Horizontal Scroll */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[12px] bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent z-10" />

              <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 pr-4 scroll-smooth shrink-0">
                {/* Station Group Link */}
                <a
                  href="https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0"
                  target="_blank"
                  rel="noreferrer"
                  title="Station Group Joining Link (Google Doc)"
                  className="h-10 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap font-bold">Station Group</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-80 shrink-0" />
                </a>

                {/* Virtual Group Link */}
                <a
                  href="https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0"
                  target="_blank"
                  rel="noreferrer"
                  title="Virtual Group Joining Link (Google Doc)"
                  className="h-10 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Link2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="whitespace-nowrap font-bold">Virtual Group</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400 opacity-80 shrink-0" />
                </a>

                {/* Essential Site */}
                <a
                  href="https://sites.google.com/view/10msmirpur/home"
                  target="_blank"
                  rel="noreferrer"
                  title="10MS Station Site"
                  className="h-10 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="whitespace-nowrap font-bold">Essential Site</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-80 shrink-0" />
                </a>

                {/* VT Essential Site */}
                <a
                  href="https://sites.google.com/view/10ms-vt-essential/home"
                  target="_blank"
                  rel="noreferrer"
                  title="VT Essential Site"
                  className="h-10 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="whitespace-nowrap font-bold">VT Essential Site</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400 opacity-80 shrink-0" />
                </a>

                {/* Payment Copy Messages */}
                {onOpenPaymentModal && (
                  <button
                    type="button"
                    onClick={onOpenPaymentModal}
                    className="h-10 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-pink-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <CreditCard className="w-4 h-4 text-pink-400 shrink-0" />
                    <span className="whitespace-nowrap font-bold">Payment Texts</span>
                  </button>
                )}

                {/* More Actions Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setIsActionDrawerOpen(true)}
                  className="h-10 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="whitespace-nowrap font-bold">More</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Desktop Only: Group Joining Links, Portals & Payment Texts Horizontal Row */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-inner backdrop-blur-md shrink-0">
              {/* Station Group Joining Link */}
              <a
                href="https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0"
                target="_blank"
                rel="noreferrer"
                title="Station Group Joining Link (Google Doc)"
                className="min-h-[40px] px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-emerald-300 hover:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
              >
                <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap font-bold">Station Group Link</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-70 shrink-0" />
              </a>

              {/* Virtual Group Joining Link */}
              <a
                href="https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0"
                target="_blank"
                rel="noreferrer"
                title="Virtual Group Joining Link (Google Doc)"
                className="min-h-[40px] px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-indigo-300 hover:text-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
              >
                <Link2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="whitespace-nowrap font-bold">Virtual Group Link</span>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400 opacity-70 shrink-0" />
              </a>

              <div className="h-5 w-px bg-slate-800 mx-0.5 shrink-0" />

              {/* Essential Sites Links */}
              <a
                href="https://sites.google.com/view/10msmirpur/home"
                target="_blank"
                rel="noreferrer"
                title="10MS Mirpur Station Essential Link Google Site"
                className="min-h-[40px] px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-cyan-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
              >
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="whitespace-nowrap font-bold">Essential Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-70 shrink-0" />
              </a>

              <a
                href="https://sites.google.com/view/10ms-vt-essential/home"
                target="_blank"
                rel="noreferrer"
                title="Virtual Team Essential Links Google Site"
                className="min-h-[40px] px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-sky-300 hover:text-sky-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 active:scale-95"
              >
                <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="whitespace-nowrap font-bold">VT Essential Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-sky-400 opacity-70 shrink-0" />
              </a>

              <div className="h-5 w-px bg-slate-800 mx-0.5 shrink-0" />

              {/* Payment Copy Messages Button */}
              {onOpenPaymentModal && (
                <button
                  type="button"
                  onClick={onOpenPaymentModal}
                  className="min-h-[40px] px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-pink-500/40 text-pink-300 hover:text-pink-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="font-bold">Payment Texts</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                </button>
              )}
            </div>

            {/* Desktop Only Extra Action Controls */}
            <div className="hidden lg:flex items-center gap-2 justify-end w-auto shrink-0">
              {/* Theme Toggle Button (Desktop View) */}
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

              {/* Secondary Action: Add Advisor (Desktop View) */}
              <motion.button
                whileHover={{ scale: 1.03, y: -0.5 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenAddModal}
                className="min-h-[40px] bg-slate-900/90 hover:bg-slate-800 text-[#38BDF8] font-black text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 border border-[#38BDF8]/80 hover:border-[#38BDF8] transition-all duration-200 shrink-0 cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5] text-[#38BDF8] shrink-0" />
                <span className="whitespace-nowrap font-black tracking-wide">Add Advisor</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Segmented Control */}
        <nav className="w-full overflow-x-auto no-scrollbar py-2">
          <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-inner min-w-max">
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
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 h-10 min-h-[40px] ${
                    isActive
                      ? 'text-cyan-100 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className={`absolute inset-0 rounded-xl border ${
                        tab.isAi 
                          ? 'bg-slate-900 border-cyan-400/60 shadow-md shadow-cyan-500/15'
                          : 'bg-slate-900 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
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
                          : 'text-slate-400 group-hover:text-cyan-300'
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
                            ? 'bg-cyan-400 text-slate-950 shadow-xs shadow-cyan-400/50' 
                            : 'bg-slate-900 text-slate-400 border border-slate-800 group-hover:border-cyan-500/40 group-hover:text-cyan-200'
                        }`}
                      >
                        {tab.badge}
                      </motion.span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Quick Actions & Portals Drawer Modal */}
      <AnimatePresence>
        {isActionDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActionDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Slide-Up Drawer Container */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-cyan-500/30 sm:rounded-2xl rounded-t-3xl p-5 shadow-2xl z-50 max-h-[85vh] overflow-y-auto"
            >
              {/* Drawer Handle Pill for mobile touch dragging */}
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100">Quick Actions & Portals</h3>
                    <p className="text-xs text-slate-400">Team Kaizen Operational Shortcuts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActionDrawerOpen(false)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Items List */}
              <div className="space-y-4">
                {/* Management Actions */}
                <div>
                  <h4 className="text-[11px] uppercase font-mono tracking-wider text-cyan-400 font-bold mb-2">Team Actions & Tools</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsActionDrawerOpen(false); onOpenAddModal(); }}
                      className="min-h-[48px] w-full px-4 py-3 bg-slate-800/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold text-sm rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-98 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plus className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
                        <span>Add New Advisor</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {onOpenPaymentModal && (
                      <button
                        type="button"
                        onClick={() => { setIsActionDrawerOpen(false); onOpenPaymentModal(); }}
                        className="min-h-[48px] w-full px-4 py-3 bg-slate-800/90 hover:bg-slate-800 text-pink-300 border border-pink-500/30 font-bold text-sm rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-98"
                      >
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-5 h-5 text-pink-400" />
                          <span>Payment Copy Messages</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => { setIsActionDrawerOpen(false); onOpenSheetSync(); }}
                      className="min-h-[48px] w-full px-4 py-3 bg-slate-800/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 font-bold text-sm rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                        <span>Google Sheet Sync Settings</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Group Joining Links */}
                <div>
                  <h4 className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-2">Group Joining Links</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0"
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[48px] px-4 py-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-emerald-400" />
                        <span>Station Group Link</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-emerald-400 opacity-70" />
                    </a>

                    <a
                      href="https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0"
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[48px] px-4 py-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-indigo-400" />
                        <span>Virtual Group Link</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-indigo-400 opacity-70" />
                    </a>
                  </div>
                </div>

                {/* Essential Google Sites */}
                <div>
                  <h4 className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-2">Essential Google Sites</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="https://sites.google.com/view/10msmirpur/home"
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[48px] px-4 py-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 font-bold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>10MS Station Site</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-cyan-400 opacity-70" />
                    </a>

                    <a
                      href="https://sites.google.com/view/10ms-vt-essential/home"
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[48px] px-4 py-3 bg-slate-950 border border-slate-800 hover:border-sky-500/40 text-sky-300 font-bold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-400" />
                        <span>VT Essential Site</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-sky-400 opacity-70" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
});

