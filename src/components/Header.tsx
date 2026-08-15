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
  ChevronRight,
  Folder,
  BookOpen
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
  theme = 'light',
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
        ? 'bg-white/95 text-slate-900 border-slate-200/90 shadow-sm shadow-slate-200/60'
        : 'bg-slate-950/90 text-slate-100 border-[#30AFFF]/20 shadow-2xl shadow-slate-950/90'
    }`}>
      {/* Top Animated 4-Color Glow Hairline Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#30AFFF] via-[#92EEFF] via-[#C4F7CA] to-transparent shadow-[0_0_12px_rgba(48,175,255,0.8)]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 space-y-2">
        {/* Tier 1: Primary Header Bar (Brand on Left | Live Sync + Theme + Add Advisor on Right) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Brand ID & TL info */}
          <div className="flex items-center justify-between lg:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Logo Shield */}
              <motion.div 
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="relative group cursor-pointer shrink-0 self-center"
              >
                <div className="relative bg-slate-900 border border-slate-800 p-1.5 rounded-xl shadow-2xs backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                  <KaizenLogo size="md" />
                </div>
              </motion.div>

              <div className="flex flex-col justify-center shrink-0 min-w-max">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight uppercase font-sans leading-none text-slate-900 dark:text-white whitespace-nowrap">
                  TEAM KAIZEN
                </h1>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-sky-600 dark:text-[#92EEFF] whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-500 dark:text-[#30AFFF] shrink-0" />
                  <span className="shrink-0 text-slate-500 dark:text-slate-400 font-medium">TL:</span>
                  <span className="text-slate-800 dark:text-[#92EEFF] font-bold leading-tight whitespace-nowrap">{teamLeaderName}</span>
                </div>
              </div>
            </div>

            {/* Mobile-Only Quick Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0 lg:hidden">
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                  className={`h-8 w-8 p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                    theme === 'light'
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
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

              <button
                type="button"
                onClick={onOpenAddModal}
                className="h-8 px-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Desktop Controls (AutoSyncBar + Theme Toggle + Add Advisor) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 justify-end">
            {/* Live Google Sheet Integration Widget */}
            <div className="w-auto min-w-0 shrink-0">
              <AutoSyncBar
                sheetUrl={sheetUrl}
                onUpdateSheetUrl={onUpdateSheetUrl}
                onImportStationedData={onImportStationedData}
                onImportVirtualData={onImportVirtualData}
                onOpenSyncModal={onOpenSheetSync}
              />
            </div>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                className={`group h-9 px-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs ${
                  theme === 'light'
                    ? 'bg-amber-50/90 hover:bg-amber-100/90 border-amber-200/90 text-amber-900 ring-1 ring-amber-300/30'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300 hover:border-amber-500/40'
                }`}
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                    <span className="font-extrabold text-[11px] text-amber-950 leading-none">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-amber-300 shrink-0 group-hover:-rotate-12 transition-transform duration-300" />
                    <span className="font-extrabold text-[11px] text-slate-200 leading-none">Dark Mode</span>
                  </>
                )}
              </motion.button>
            )}

            {/* Primary Action: Add Advisor */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAddModal}
              className="group h-9 px-3.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-600 dark:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-sky-500/25 transition-all duration-200 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
              <span className="whitespace-nowrap font-bold tracking-wide leading-none">Add Advisor</span>
            </motion.button>
          </div>
        </div>

        {/* Tier 2: Direct Resource Links Pill Strip (Clean Utility Bar) */}
        <div className="w-full overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs backdrop-blur-xs min-w-max">
            {/* Station Group Link */}
            <motion.a
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href="https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0"
              target="_blank"
              rel="noreferrer"
              title="Station Group Joining Link (Google Doc)"
              className="group h-7 px-2.5 bg-white hover:bg-emerald-50/90 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 hover:border-emerald-300 dark:border-slate-700/90 dark:hover:border-emerald-500/40 text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <Link2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:rotate-45 transition-transform duration-200 shrink-0" />
              <span className="whitespace-nowrap leading-none">Station Group Link</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-600 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 opacity-80 shrink-0" />
            </motion.a>

            {/* Virtual Group Link */}
            <motion.a
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href="https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0"
              target="_blank"
              rel="noreferrer"
              title="Virtual Group Joining Link (Google Doc)"
              className="group h-7 px-2.5 bg-white hover:bg-sky-50/90 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 hover:border-sky-300 dark:border-slate-700/90 dark:hover:border-sky-500/40 text-slate-700 hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <Link2 className="w-3 h-3 text-sky-600 dark:text-sky-400 group-hover:rotate-45 transition-transform duration-200 shrink-0" />
              <span className="whitespace-nowrap leading-none">Virtual Group Link</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-sky-600 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 opacity-80 shrink-0" />
            </motion.a>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

            {/* Essential Sites Links */}
            <motion.a
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href="https://sites.google.com/view/10msmirpur/home"
              target="_blank"
              rel="noreferrer"
              title="10MS Mirpur Station Essential Link Google Site"
              className="group h-7 px-2.5 bg-white hover:bg-indigo-50/70 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 hover:border-indigo-300 dark:border-slate-700/90 dark:hover:border-indigo-500/40 text-slate-700 hover:text-indigo-700 dark:text-slate-200 dark:hover:text-indigo-300 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <Globe className="w-3 h-3 text-indigo-500 dark:text-indigo-400 group-hover:rotate-12 transition-transform duration-200 shrink-0" />
              <span className="whitespace-nowrap leading-none">Essential Site</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 opacity-80 shrink-0" />
            </motion.a>

            <motion.a
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href="https://sites.google.com/view/10ms-vt-essential/home"
              target="_blank"
              rel="noreferrer"
              title="Virtual Team Essential Links Google Site"
              className="group h-7 px-2.5 bg-white hover:bg-cyan-50/70 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 hover:border-cyan-300 dark:border-slate-700/90 dark:hover:border-cyan-500/40 text-slate-700 hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-300 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <Globe className="w-3 h-3 text-cyan-500 dark:text-cyan-400 group-hover:rotate-12 transition-transform duration-200 shrink-0" />
              <span className="whitespace-nowrap leading-none">VT Essential Site</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-cyan-600 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 opacity-80 shrink-0" />
            </motion.a>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

            {/* Good Call Drive Folder Link */}
            <motion.a
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href="https://drive.google.com/drive/folders/1BGEaDod5zXZ6nvoNfYsGvry02c2oElZk?ths=true"
              target="_blank"
              rel="noreferrer"
              title="Good Call Drive Folder"
              className="group h-7 px-2.5 bg-white hover:bg-emerald-50/90 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 hover:border-emerald-300 dark:border-slate-700/90 dark:hover:border-emerald-500/40 text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <Folder className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200 shrink-0" />
              <span className="whitespace-nowrap leading-none">Good Call</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-600 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 opacity-80 shrink-0" />
            </motion.a>

            {/* Follow Up Drive Folder Link */}
            <motion.a
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href="https://drive.google.com/drive/folders/1Tk2c1pQKVmBhJkZqSeMHizWdeW_cMeah"
              target="_blank"
              rel="noreferrer"
              title="Follow Up Drive Folder"
              className="group h-7 px-2.5 bg-white hover:bg-sky-50/90 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 hover:border-sky-300 dark:border-slate-700/90 dark:hover:border-sky-500/40 text-slate-700 hover:text-sky-700 dark:text-slate-200 dark:hover:text-sky-300 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <Folder className="w-3 h-3 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-200 shrink-0" />
              <span className="whitespace-nowrap leading-none">Follow Up</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-sky-600 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 opacity-80 shrink-0" />
            </motion.a>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

            {/* Free Resource Google Doc Link */}
            <motion.a
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              href="https://docs.google.com/document/d/1GiVK9N2diFGsYuW9RfFeDVxtl3AnZe9wP3LGo2g0g1o/edit?tab=t.0"
              target="_blank"
              rel="noreferrer"
              title="Free Resource Google Doc"
              className="group h-7 px-2.5 bg-white hover:bg-amber-50/90 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 hover:border-amber-300 dark:border-slate-700/90 dark:hover:border-amber-500/40 text-slate-700 hover:text-amber-700 dark:text-slate-200 dark:hover:text-amber-300 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <BookOpen className="w-3 h-3 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200 shrink-0" />
              <span className="whitespace-nowrap leading-none">Free Resource</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-amber-600 dark:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 opacity-80 shrink-0" />
            </motion.a>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

            {/* Payment Copy Messages Button */}
            {onOpenPaymentModal && (
              <motion.button
                whileHover={{ y: -1.5, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onOpenPaymentModal}
                className="group h-7 px-2.5 bg-white hover:bg-pink-50/90 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 hover:border-pink-300 dark:border-slate-700/90 dark:hover:border-pink-500/40 text-slate-700 hover:text-pink-700 dark:text-slate-200 dark:hover:text-pink-300 font-semibold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <CreditCard className="w-3 h-3 text-pink-500 dark:text-pink-400 group-hover:rotate-6 transition-transform duration-200 shrink-0" />
                <span className="leading-none">Payment Texts</span>
                <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
                </span>
              </motion.button>
            )}

            {/* Mobile Actions Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsActionDrawerOpen(true)}
              className="lg:hidden h-7 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              <Compass className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>More</span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Tier 3: Navigation Tabs Segmented Control (Full-Width Symmetrical Distribution with Smooth Slide Indicator) */}
        <nav className="w-full pt-0.5 pb-0.5">
          <div className="w-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-1 rounded-xl shadow-2xs flex items-center justify-between overflow-x-auto no-scrollbar gap-1 relative">
            {[
              { id: 'overview', label: 'Executive Dashboard', icon: BarChart3, color: 'text-sky-500' },
              { id: 'stationed', label: 'Stationed Team', icon: Users, color: 'text-sky-500', badge: stationedCount },
              { id: 'virtual', label: 'Virtual Team', icon: Users, color: 'text-cyan-500', badge: virtualCount },
              { id: 'call_records', label: 'Call Records', icon: PhoneCall, color: 'text-sky-500', badge: callRecordsCount },
              { id: 'tasks', label: 'Task Manager', icon: CheckSquare, color: 'text-emerald-500' },
              { id: 'time', label: 'Time Tracker', icon: Clock, color: 'text-teal-500' },
              { id: 'ai_report', label: 'AI Operations Report', icon: Sparkles, color: 'text-cyan-500', isAi: true },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative flex-1 min-w-max px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-200 cursor-pointer h-8 sm:h-8.5 select-none ${
                    isActive
                      ? 'text-slate-900 dark:text-white font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Sliding Animated Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeHeaderTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200/90 dark:border-slate-700 z-0"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.isAi ? (
                      <div className="relative flex items-center justify-center">
                        <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600 dark:text-cyan-400 animate-pulse' : 'text-slate-500 dark:text-cyan-400/80 group-hover:text-cyan-500'}`} />
                      </div>
                    ) : (
                      <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive 
                          ? 'text-sky-600 dark:text-sky-400' 
                          : 'text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                      }`} />
                    )}
                    
                    {tab.isAi ? (
                      <span className="font-extrabold tracking-wide flex items-center gap-1.5 leading-none">
                        <span>{tab.label}</span>
                        <span className="bg-gradient-to-r from-cyan-500/15 to-sky-500/15 dark:from-cyan-950/60 dark:to-sky-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-400/50 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md font-mono shadow-2xs leading-none">
                          AI 2.0
                        </span>
                      </span>
                    ) : (
                      <span className="leading-none">{tab.label}</span>
                    )}

                    {tab.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 min-w-[19px] h-4.5 rounded-full font-extrabold font-mono transition-colors leading-none flex items-center justify-center ${
                          isActive 
                            ? 'bg-sky-500 text-white dark:bg-sky-500 dark:text-white font-black shadow-2xs' 
                            : 'bg-slate-200/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 group-hover:bg-slate-300/70 dark:group-hover:bg-slate-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
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

                {/* Essential Google Sites & Resources */}
                <div>
                  <h4 className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-2">Essential Sites & Free Resources</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="https://docs.google.com/document/d/1GiVK9N2diFGsYuW9RfFeDVxtl3AnZe9wP3LGo2g0g1o/edit?tab=t.0"
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[48px] px-4 py-3 bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span>Free Resource Doc</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-amber-400 opacity-70" />
                    </a>

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

