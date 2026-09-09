import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  BarChart3, 
  Users, 
  CheckSquare, 
  Clock, 
  Sparkles, 
  PhoneCall, 
  ShieldCheck, 
  Sun, 
  Moon, 
  FileSpreadsheet,
  Zap,
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  Link2,
  Globe,
  Folder,
  BookOpen,
  CreditCard,
  ExternalLink,
  Search,
  Copy,
  Check,
  Box
} from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { syncAllSheetsData, PRIMARY_DEFAULT_SHEET } from '../utils/sheetSync';

interface HeaderProps {
  activeTab: 'overview' | 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report';
  setActiveTab: (tab: 'overview' | 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report') => void;
  teamLeaderName: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenSheetSync: () => void;
  onOpenAddModal: () => void;
  onOpenPaymentModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenThreeBgModal?: () => void;
  threeBgEnabled?: boolean;
  threeBgStyle?: string;
  onShowToast?: (msg: string) => void;
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
  onOpenCommandPalette,
  onOpenThreeBgModal,
  threeBgEnabled = true,
  threeBgStyle = 'Cyber Grid',
  onShowToast,
  stationedCount,
  virtualCount,
  callRecordsCount = 0,
  sheetUrl,
  onImportStationedData,
  onImportVirtualData,
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(() => {
    const saved = localStorage.getItem('kaizen_auto_sync_enabled');
    return saved !== null ? !JSON.parse(saved) : false;
  });
  const [countdown, setCountdown] = useState<number>(12);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    const saved = localStorage.getItem('kaizen_last_sync_time');
    return saved || '3:39:21 PM';
  });
  const [syncedAdvisorsCount, setSyncedAdvisorsCount] = useState<number>(() => {
    return stationedCount + virtualCount || 20;
  });

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (stationedCount + virtualCount > 0) {
      setSyncedAdvisorsCount(stationedCount + virtualCount);
    }
  }, [stationedCount, virtualCount]);

  // Sync execution
  const executeSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const target = sheetUrl || PRIMARY_DEFAULT_SHEET;
      const res = await syncAllSheetsData(target);
      if (res.success) {
        if (res.stationed && res.stationed.length > 0 && onImportStationedData) {
          onImportStationedData(res.stationed, true);
        }
        if (res.virtual && res.virtual.length > 0 && onImportVirtualData) {
          onImportVirtualData(res.virtual, true);
        }
        const total = (res.stationed?.length || 0) + (res.virtual?.length || 0);
        if (total > 0) setSyncedAdvisorsCount(total);
        const timeStr = new Date().toLocaleTimeString();
        setLastSyncTime(timeStr);
        localStorage.setItem('kaizen_last_sync_time', timeStr);
      }
    } catch (err) {
      console.warn('Sync trigger error:', err);
    } finally {
      setIsSyncing(false);
      setCountdown(12);
    }
  }, [sheetUrl, onImportStationedData, onImportVirtualData]);

  // Auto-polling countdown loop
  useEffect(() => {
    if (isPaused) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          executeSync();
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isPaused, executeSync]);

  const togglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      localStorage.setItem('kaizen_auto_sync_enabled', JSON.stringify(!next));
      return next;
    });
  };

  const [copiedQuickId, setCopiedQuickId] = useState<string | null>(null);

  const handleQuickCopy = (text: string, id: string, name: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuickId(id);
    if (onShowToast) {
      onShowToast(`📋 Copied ${name}'s payment message!`);
    }
    setTimeout(() => setCopiedQuickId(null), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Executive Hub', shortLabel: 'Overview', icon: BarChart3, keyNum: '1' },
    { id: 'stationed', label: 'Stationed Team', shortLabel: 'Stationed', icon: Users, badge: stationedCount || 20, keyNum: '2' },
    { id: 'virtual', label: 'Virtual Team', shortLabel: 'Virtual', icon: Users, badge: virtualCount || 0, keyNum: '3' },
    { id: 'call_records', label: 'Call Records', shortLabel: 'Calls', icon: PhoneCall, badge: callRecordsCount || 5, keyNum: '4' },
    { id: 'tasks', label: 'Task Manager', shortLabel: 'Tasks', icon: CheckSquare, keyNum: '5' },
    { id: 'time', label: 'Time Tracker', shortLabel: 'Time', icon: Clock, keyNum: '6' },
    { id: 'ai_report', label: 'AI Operations', shortLabel: 'AI Audit', icon: Sparkles, isAi: true, keyNum: '7' },
  ] as const;

  // Direct Resource Links (All permanently visible with zero dropdowns or hiding)
  const teamResources = [
    {
      label: 'Station Group',
      url: 'https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0',
      icon: Link2,
      color: 'text-emerald-400',
    },
    {
      label: 'Virtual Group',
      url: 'https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0',
      icon: Link2,
      color: 'text-sky-400',
    },
    {
      label: 'Mirpur Site',
      url: 'https://sites.google.com/view/10msmirpur/home',
      icon: Globe,
      color: 'text-violet-400',
    },
    {
      label: 'VT Site',
      url: 'https://sites.google.com/view/10ms-vt-essential/home',
      icon: Globe,
      color: 'text-blue-400',
    },
    {
      label: 'Good Call',
      url: 'https://drive.google.com/drive/folders/1BGEaDod5zXZ6nvoNfYsGvry02c2oElZk?ths=true',
      icon: Folder,
      color: 'text-teal-400',
    },
    {
      label: 'Follow Up',
      url: 'https://drive.google.com/drive/folders/1Tk2c1pQKVmBhJkZqSeMHizWdeW_cMeah',
      icon: Folder,
      color: 'text-cyan-400',
    },
    {
      label: 'Free Resource',
      url: 'https://docs.google.com/document/d/1GiVK9N2diFGsYuW9RfFeDVxtl3AnZe9wP3LGo2g0g1o/edit?tab=t.0',
      icon: BookOpen,
      color: 'text-amber-400',
    }
  ];

  const formatSyncTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '--:--';
    const ampmMatch = timeStr.match(/(AM|PM|am|pm)/i);
    const ampm = ampmMatch ? ` ${ampmMatch[0].toUpperCase()}` : '';
    const cleanTime = timeStr.replace(/(AM|PM|am|pm)/i, '').trim();
    const parts = cleanTime.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}${ampm}`;
    }
    return timeStr;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#E0F2FE]/95 dark:bg-[#0A1628] backdrop-blur-md border-b border-[#BAE6FD] dark:border-[#1A3154] shadow-md dark:shadow-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 space-y-2">
        
        {/* Tier 1: Unified Executive Command Bar */}
        <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-2">
          
          {/* Top-Left: Brand Identity & Team Leader Tag */}
          <div className="flex items-center gap-2 bg-white/95 dark:bg-[#0F223D] border border-[#BAE6FD] dark:border-[#1E3A5F] px-2.5 py-1.5 rounded-xl shadow-xs shrink-0 min-h-[48px] lg:h-[48px]">
            <div 
              onClick={() => setActiveTab('overview')}
              className="w-8 h-8 bg-sky-50 dark:bg-[#0B1A30] border border-sky-200 dark:border-[#234575] p-1 rounded-lg shadow-inner flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shrink-0"
              title="Team Kaizen Operations Dashboard"
            >
              <KaizenLogo size="sm" />
            </div>

            <div className="flex items-center gap-2 min-w-0 pr-0.5">
              <h1 
                onClick={() => setActiveTab('overview')}
                className="text-sm sm:text-base font-black tracking-wider text-slate-900 dark:text-white uppercase cursor-pointer hover:text-teal-600 dark:hover:text-teal-300 transition-colors leading-tight shrink-0 select-none"
              >
                TEAM KAIZEN
              </h1>
              
              <div className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-sky-50/90 dark:bg-[#162D4E] border border-sky-200 dark:border-[#2B4E7E] shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 stroke-[2.5] shrink-0" />
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider leading-none">TL:</span>
                <span className="text-xs font-black text-slate-900 dark:text-white whitespace-nowrap leading-none">{teamLeaderName}</span>
              </div>
            </div>
          </div>

          {/* Center: Live Google Sheet Sync Status Pill (Fluid, No Overflow, Crisp Alignment) */}
          <div className="flex-1 min-w-0 bg-white/95 dark:bg-[#0F223D] border border-[#BAE6FD] dark:border-[#1E3A5F] rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-2 shadow-xs min-h-[48px] lg:h-[48px]">
            {/* Sync Left Info (Zap + Title + Live badge + Substatus) */}
            <div className="flex items-center gap-2 min-w-0 shrink">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                <Zap className="w-4 h-4 fill-emerald-500/20 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white whitespace-nowrap leading-tight">Google Sheet Sync</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/50 tracking-wider select-none shrink-0 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>LIVE</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-none mt-0.5 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5] shrink-0" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    {syncedAdvisorsCount} synced
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium shrink-0">{formatSyncTimeDisplay(lastSyncTime)}</span>
                  <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">{isPaused ? 'Paused' : `${countdown}s`}</span>
                </div>
              </div>
            </div>

            {/* Sync Action Buttons Group */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Pause / Play Button */}
              <button
                type="button"
                onClick={togglePause}
                title={isPaused ? "Resume auto polling" : "Pause auto polling"}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all border shrink-0 ${
                  isPaused 
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:hover:bg-amber-900/90 dark:text-amber-200 dark:border-amber-500/60' 
                    : 'bg-sky-50 hover:bg-sky-100 text-slate-700 border-sky-200 dark:bg-[#162D4E] dark:hover:bg-[#1E3E6B] dark:text-slate-200 dark:border-[#2B4E7E]'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500 shrink-0" />
                    <span className="hidden sm:inline">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                )}
              </button>

              {/* Manual Refresh / Sync Button */}
              <button
                type="button"
                onClick={executeSync}
                disabled={isSyncing}
                title="Fetch latest data from Google Sheet now"
                className="h-8 px-2.5 bg-sky-50 hover:bg-sky-100 hover:text-teal-700 border border-sky-200 text-slate-700 dark:bg-[#162D4E] dark:hover:bg-[#1E3E6B] dark:hover:text-teal-300 dark:border-[#2B4E7E] dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] shrink-0 ${isSyncing ? 'animate-spin text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`} />
                <span>Sync</span>
              </button>

              {/* Sheet Config Modal Trigger */}
              <button
                type="button"
                onClick={onOpenSheetSync}
                title="Configure Google Sheet URL and Auto-Refresh Settings"
                className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 dark:bg-[#162D4E] dark:hover:bg-[#1E3E6B] dark:hover:border-emerald-500/60 dark:hover:text-emerald-300 dark:border-[#2B4E7E] dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 stroke-[2.5] shrink-0" />
                <span className="hidden sm:inline">Config</span>
              </button>
            </div>
          </div>

          {/* Right Action Controls: Quick Search + Light/Dark Mode + 3D FX + Add Advisor */}
          <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#0F223D] border border-[#BAE6FD] dark:border-[#1E3A5F] px-2 py-1.5 rounded-xl shadow-xs shrink-0 min-h-[48px] lg:h-[48px]">
            {/* Quick Search Trigger (⌘K) */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                title="Search advisors, tasks, tabs, or actions (⌘K / Ctrl+K)"
                className="h-8 px-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 hover:border-sky-400 text-slate-700 hover:text-slate-900 dark:bg-[#162D4E] dark:hover:bg-[#1E3E6B] dark:border-[#2B4E7E] dark:hover:border-sky-500/60 dark:text-slate-200 dark:hover:text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 shrink-0 group"
              >
                <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 stroke-[2.5] shrink-0" />
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-sky-100 dark:bg-[#0A1628] border border-sky-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold shrink-0">⌘K</kbd>
              </button>
            )}

            {/* Light / Dark Mode Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label="Toggle Theme"
                className="h-8 w-8 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-700 dark:bg-[#162D4E] dark:hover:bg-[#1E3E6B] dark:border-[#2B4E7E] dark:text-amber-300 flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-700 stroke-[2.2]" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                )}
              </button>
            )}

            {/* 3D Background FX Experience Trigger */}
            {onOpenThreeBgModal && (
              <button
                type="button"
                onClick={onOpenThreeBgModal}
                title={`Configure 3D Background (${threeBgEnabled ? threeBgStyle : 'Disabled'})`}
                className={`h-8 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0 group ${
                  threeBgEnabled
                    ? 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-800 dark:bg-[#162D4E] dark:hover:bg-[#1E3E6B] dark:border-teal-500/60 dark:text-teal-300'
                    : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-slate-700 dark:bg-[#162D4E] dark:hover:bg-[#1E3E6B] dark:border-[#2B4E7E] dark:text-slate-300'
                }`}
              >
                <Box className={`w-3.5 h-3.5 ${threeBgEnabled ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'} stroke-[2.5] shrink-0`} />
                <span>3D FX</span>
                {threeBgEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0"></span>
                )}
              </button>
            )}

            {/* + Add Advisor Button (Vibrant Emerald Primary Button) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onOpenAddModal}
              className="h-8 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:from-teal-700 active:to-emerald-700 border border-teal-400/50 text-white font-black text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer shrink-0 transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
              <span className="font-black tracking-wide text-white">Add Advisor</span>
            </motion.button>
          </div>

        </div>

        {/* Tier 2: Payment Copy & Team Resources Ribbon (Zero Cutoff, Seamless Alignment, Invisible Scrollbar) */}
        <div className="bg-[#D7ECFD]/95 dark:bg-[#0D1E36] border border-[#BAE6FD] dark:border-[#1E3A5F] rounded-xl px-2 sm:px-2.5 py-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-inner">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-max lg:min-w-0 w-full">
            {/* Left Cluster: 1-Click Payments (Antu, Kayes, Payment Hub) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Antu 1-Click Copy */}
              <button
                type="button"
                onClick={() => handleQuickCopy('আসসালামু আলাইকুম, আমি অন্তু  ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01850890778 ধন্যবাদ।', 'antu_quick', 'Antu')}
                className={`group h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer active:scale-95 transition-all border shrink-0 ${
                  copiedQuickId === 'antu_quick'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-rose-100/90 hover:bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:hover:bg-rose-900 dark:text-rose-100 dark:border-rose-500/50'
                }`}
                title="1-Click copy Bengali bKash message for Antu (01850890778)"
              >
                {copiedQuickId === 'antu_quick' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />
                    <span className="font-extrabold text-white">Copied Antu!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 group-hover:text-rose-900 dark:group-hover:text-rose-300 stroke-[2.5] shrink-0" />
                    <span>Antu</span>
                    <span className="hidden 2xl:inline font-mono text-[10px] opacity-75">(01850890778)</span>
                  </>
                )}
              </button>

              {/* Kayes 1-Click Copy */}
              <button
                type="button"
                onClick={() => handleQuickCopy('আসসালামু আলাইকুম, আমি কায়েস ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা  নগদ  করুন  এই নাম্বারে 01644336738 ধন্যবাদ.', 'kayes_quick', 'Kayes')}
                className={`group h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer active:scale-95 transition-all border shrink-0 ${
                  copiedQuickId === 'kayes_quick'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-amber-100/90 hover:bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:text-amber-100 dark:border-amber-500/50'
                }`}
                title="1-Click copy Bengali bKash message for Kayes (01644336738)"
              >
                {copiedQuickId === 'kayes_quick' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />
                    <span className="font-extrabold text-white">Copied Kayes!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 group-hover:text-amber-900 dark:group-hover:text-amber-300 stroke-[2.5] shrink-0" />
                    <span>Kayes</span>
                    <span className="hidden 2xl:inline font-mono text-[10px] opacity-75">(01644336738)</span>
                  </>
                )}
              </button>

              {/* Payment Hub Modal Trigger */}
              {onOpenPaymentModal && (
                <button
                  type="button"
                  onClick={onOpenPaymentModal}
                  title="Open Full Payment Hub & Message Templates"
                  className="group h-8 px-2.5 bg-rose-100/90 hover:bg-rose-200 border border-rose-300 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:border-rose-500/50 dark:hover:border-rose-400 rounded-lg text-[11px] font-bold text-rose-900 dark:text-rose-200 hover:text-rose-950 dark:hover:text-white flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <CreditCard className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400 stroke-[2.5] shrink-0" />
                  <span>Payment Hub</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse shrink-0"></span>
                </button>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-[#93C5FD] dark:bg-[#234575] shrink-0 mx-0.5" />

            {/* Right Cluster: All 7 Team Resource Links (Directly visible, clean alignment, zero cutoff) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {teamResources.map((res, i) => {
                const Icon = res.icon;
                return (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group h-8 px-2 sm:px-2.5 bg-white/95 hover:bg-white border border-[#BAE6FD] hover:border-teal-500/60 dark:bg-[#132845] dark:hover:bg-[#1A365D] dark:border-[#234575] dark:hover:border-teal-400/50 rounded-lg text-[11px] font-bold text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white flex items-center gap-1 whitespace-nowrap shadow-xs transition-colors shrink-0"
                    title={`Open ${res.label}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${res.color} stroke-[2.4] shrink-0`} />
                    <span>{res.label}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-300 stroke-[2] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tier 3: Core Navigation Tabs (Balanced, Zero Truncation/Ellipses, High Contrast) */}
        <nav className="w-full" aria-label="Main Navigation">
          <div className="bg-[#D0E7FC]/90 dark:bg-[#071324] p-1.5 rounded-xl border border-[#BAE6FD] dark:border-[#162A47] shadow-inner w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5 w-full">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    aria-current={isActive ? 'page' : undefined}
                    title={`${tab.label} (Press ${tab.keyNum} to jump)`}
                    className={`group relative h-9.5 px-2 rounded-xl text-xs xl:text-[13px] flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer select-none w-full min-w-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-md border border-teal-500'
                        : 'bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 font-semibold border border-[#BAE6FD] hover:border-teal-500/50 shadow-xs dark:bg-[#0F223D] dark:hover:bg-[#162D4E] dark:text-slate-200 dark:hover:text-white dark:border-[#1E3A5F] dark:hover:border-teal-400/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-white stroke-[2.4]'
                        : 'text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 stroke-[2]'
                    }`} />

                    <span className={`leading-none whitespace-nowrap ${isActive ? 'font-bold text-white' : 'font-semibold text-slate-700 group-hover:text-slate-950 dark:text-slate-200 dark:group-hover:text-white'}`}>
                      <span className="hidden 2xl:inline">{tab.label}</span>
                      <span className="inline 2xl:hidden">{tab.shortLabel}</span>
                    </span>

                    {tab.isAi && (
                      <span className={`text-[10px] font-black px-1.5 h-[18px] rounded-full font-mono leading-none flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/25 text-white border border-white/40'
                          : 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-900/70 dark:text-purple-200 dark:border-purple-400/50 group-hover:bg-purple-200'
                      }`}>
                        AI
                      </span>
                    )}

                    {tab.badge !== undefined && (
                      <span
                        className={`text-[11px] px-1.5 min-w-[20px] h-[18px] rounded-full font-black font-mono transition-colors leading-none flex items-center justify-center border shrink-0 ${
                          isActive
                            ? 'bg-white/25 text-white border border-white/30'
                            : 'bg-sky-100 dark:bg-[#071324] text-teal-800 dark:text-teal-300 border border-sky-300 dark:border-[#234575] group-hover:border-teal-400/50'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

      </div>
    </header>
  );
});

Header.displayName = 'Header';
