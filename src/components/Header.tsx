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

  return (
    <header className="sticky top-0 z-40 bg-[#0A1628] border-b border-[#1A3154] shadow-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 space-y-2">
        
        {/* Tier 1: Unified Executive Command Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          
          {/* Top-Left: Brand Identity & Team Leader Tag */}
          <div className="flex items-center gap-2.5 bg-[#0F223D] border border-[#1E3A5F] px-3 py-1.5 rounded-xl shadow-xs shrink-0 min-h-[46px]">
            <div 
              onClick={() => setActiveTab('overview')}
              className="w-8 h-8 bg-[#0B1A30] border border-[#234575] p-1 rounded-lg shadow-inner flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shrink-0"
              title="Team Kaizen Operations Dashboard"
            >
              <KaizenLogo size="sm" />
            </div>

            <div className="flex items-center gap-2.5 min-w-0 pr-0.5">
              <h1 
                onClick={() => setActiveTab('overview')}
                className="text-sm sm:text-base font-black tracking-tight text-white uppercase cursor-pointer hover:text-sky-300 transition-colors leading-none"
              >
                TEAM KAIZEN
              </h1>
              
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#162D4E] border border-[#2B4E7E]">
                <ShieldCheck className="w-3 h-3 text-sky-400 stroke-[2.4] shrink-0" />
                <span className="text-[9px] font-bold text-sky-300/80 uppercase tracking-wider">TL:</span>
                <span className="text-[11px] font-black text-white truncate max-w-[130px]">{teamLeaderName}</span>
              </div>
            </div>
          </div>

          {/* Center: Live Google Sheet Sync Status Pill (High-Precision, No Overflow) */}
          <div className="flex-1 bg-[#0F223D] border border-[#1E3A5F] rounded-xl px-3 py-1.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-xs min-h-[46px]">
            {/* Sync Left Info (Zap + Title + Live badge + Substatus) */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                <Zap className="w-3.5 h-3.5 fill-emerald-400/20 text-emerald-400 stroke-[2.5]" />
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white whitespace-nowrap">Google Sheet Sync</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 select-none cursor-default">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>LIVE</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold leading-none mt-0.5 whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 stroke-[2.5] shrink-0" />
                  <span className="font-bold text-emerald-300">
                    {syncedAdvisorsCount} synced
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 text-[10px]">{lastSyncTime}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-medium text-[10px]">{isPaused ? 'Paused' : `Poll: ${countdown}s`}</span>
                </div>
              </div>
            </div>

            {/* Sync Action Buttons Group */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
              {/* Pause / Play Button */}
              <button
                type="button"
                onClick={togglePause}
                title={isPaused ? "Resume auto polling" : "Pause auto polling"}
                className={`h-7 px-2 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all border ${
                  isPaused 
                    ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border-amber-500/50' 
                    : 'bg-[#162D4E] hover:bg-[#1E3E6B] text-slate-200 border-[#2B4E7E]'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-slate-300" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              {/* Manual Refresh / Sync Button */}
              <button
                type="button"
                onClick={executeSync}
                disabled={isSyncing}
                title="Fetch latest data from Google Sheet now"
                className="h-7 px-2.5 bg-[#162D4E] hover:bg-[#1E3E6B] hover:text-sky-300 border border-[#2B4E7E] rounded-lg text-[11px] font-bold text-slate-200 flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 stroke-[2.5] ${isSyncing ? 'animate-spin text-sky-400' : 'text-slate-300'}`} />
                <span>Sync Now</span>
              </button>

              {/* Sheet Config Modal Trigger */}
              <button
                type="button"
                onClick={onOpenSheetSync}
                title="Configure Google Sheet URL and Auto-Refresh Settings"
                className="h-7 px-2 bg-[#162D4E] hover:bg-[#1E3E6B] hover:border-emerald-500/50 hover:text-emerald-300 border border-[#2B4E7E] rounded-lg text-[11px] font-bold text-emerald-400 flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                <span>Config</span>
              </button>
            </div>
          </div>

          {/* Right Action Controls: Quick Search + Light/Dark Mode + Add Advisor (Structured in a matching 46px card) */}
          <div className="flex items-center gap-1.5 bg-[#0F223D] border border-[#1E3A5F] px-2.5 py-1.5 rounded-xl shadow-xs shrink-0 min-h-[46px]">
            {/* Quick Search Trigger (⌘K) */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                title="Search advisors, tasks, tabs, or actions (⌘K / Ctrl+K)"
                className="h-7 px-2.5 bg-[#162D4E] hover:bg-[#1E3E6B] border border-[#2B4E7E] hover:border-sky-500/60 text-slate-200 hover:text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95 group"
              >
                <Search className="w-3.5 h-3.5 text-sky-400 group-hover:text-sky-300 stroke-[2.5]" />
                <span className="hidden xl:inline">Search</span>
                <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 bg-[#0A1628] border border-slate-700 text-slate-400 rounded">⌘K</kbd>
              </button>
            )}

            {/* Light / Dark Mode Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label="Toggle Theme"
                className="h-7 px-2.5 rounded-lg bg-[#162D4E] hover:bg-[#1E3E6B] border border-[#2B4E7E] text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                    <span className="hidden xl:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                    <span className="hidden xl:inline">Dark</span>
                  </>
                )}
              </button>
            )}

            {/* 3D Background FX Experience Trigger */}
            {onOpenThreeBgModal && (
              <button
                type="button"
                onClick={onOpenThreeBgModal}
                title={`Configure 3D Background (${threeBgEnabled ? threeBgStyle : 'Disabled'})`}
                className={`h-7 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all group ${
                  threeBgEnabled
                    ? 'bg-[#162D4E] hover:bg-[#1E3E6B] border-teal-500/50 text-teal-300 hover:text-white'
                    : 'bg-[#162D4E] hover:bg-[#1E3E6B] border-[#2B4E7E] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Box className={`w-3.5 h-3.5 ${threeBgEnabled ? 'text-teal-400' : 'text-slate-400'} stroke-[2.5]`} />
                <span className="hidden xl:inline">3D FX</span>
                {threeBgEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                )}
              </button>
            )}

            {/* + Add Advisor Button (Refined Primary Button) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onOpenAddModal}
              className="h-7 px-3 bg-[#2D6A65] hover:bg-[#255753] active:bg-[#1C4340] border border-teal-500/40 text-white font-black text-xs rounded-lg flex items-center gap-1.5 shadow-sm shadow-black/20 cursor-pointer shrink-0 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="whitespace-nowrap font-black tracking-wide text-white">Add Advisor</span>
            </motion.button>
          </div>

        </div>

        {/* Tier 2: Payment Copy & Team Resources Ribbon (All items directly accessible, zero dropdown, zero hidden) */}
        <div className="bg-[#0D1E36] border border-[#1E3A5F] rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-inner overflow-x-auto scrollbar-none">
          
          {/* Left Cluster: 1-Click Payments (Antu, Kayes, Payment Hub) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Antu 1-Click Copy */}
            <button
              type="button"
              onClick={() => handleQuickCopy('আসসালামু আলাইকুম, আমি অন্তু  ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01850890778 ধন্যবাদ।', 'antu_quick', 'Antu')}
              className={`group h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer active:scale-95 transition-all border shrink-0 ${
                copiedQuickId === 'antu_quick'
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 hover:text-white border-rose-500/40'
              }`}
              title="1-Click copy Bengali bKash message for Antu (01850890778)"
            >
              {copiedQuickId === 'antu_quick' ? (
                <>
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                  <span className="font-extrabold text-white">Copied Antu!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-rose-400 group-hover:text-rose-300 stroke-[2.5]" />
                  <span>Antu (01850890778)</span>
                </>
              )}
            </button>

            {/* Kayes 1-Click Copy */}
            <button
              type="button"
              onClick={() => handleQuickCopy('আসসালামু আলাইকুম, আমি কায়েস ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা  নগদ  করুন  এই নাম্বারে 01644336738 ধন্যবাদ.', 'kayes_quick', 'Kayes')}
              className={`group h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer active:scale-95 transition-all border shrink-0 ${
                copiedQuickId === 'kayes_quick'
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 hover:text-white border-amber-500/40'
              }`}
              title="1-Click copy Bengali bKash message for Kayes (01644336738)"
            >
              {copiedQuickId === 'kayes_quick' ? (
                <>
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                  <span className="font-extrabold text-white">Copied Kayes!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-amber-400 group-hover:text-amber-300 stroke-[2.5]" />
                  <span>Kayes (01644336738)</span>
                </>
              )}
            </button>

            {/* Payment Hub Modal Trigger */}
            {onOpenPaymentModal && (
              <button
                type="button"
                onClick={onOpenPaymentModal}
                title="Open Full Payment Hub & Message Templates"
                className="group h-7 px-2.5 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/40 hover:border-rose-400 rounded-lg text-[11px] font-bold text-rose-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
              >
                <CreditCard className="w-3 h-3 text-rose-400 stroke-[2.5]" />
                <span className="hidden sm:inline">Payment Hub</span>
                <span className="inline sm:hidden">Pay Hub</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
              </button>
            )}
          </div>

          {/* Clean Vertical Divider */}
          <div className="h-5 w-px bg-slate-700/80 shrink-0 mx-1 hidden md:block" />

          {/* Right Cluster: All 7 Team Resource Links (Directly visible, no dropdown) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {teamResources.map((res, i) => {
              const Icon = res.icon;
              return (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group h-7 px-2 bg-[#132845] hover:bg-[#1A365D] border border-[#234575] hover:border-sky-400/50 rounded-lg text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1 whitespace-nowrap shadow-xs transition-colors shrink-0"
                  title={`Open ${res.label}`}
                >
                  <Icon className={`w-3 h-3 ${res.color} stroke-[2.4] shrink-0`} />
                  <span>{res.label}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-sky-300 stroke-[2] shrink-0" />
                </a>
              );
            })}
          </div>

        </div>

        {/* Tier 3: Core Navigation Tabs (Balanced, Zero Descender Clipping, No Overflow Clipping) */}
        <nav className="w-full overflow-hidden" aria-label="Main Navigation">
          <div className="bg-[#071324] p-1.5 rounded-xl border border-[#162A47] shadow-inner w-full">
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
                    className={`group relative h-9 px-1.5 sm:px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer select-none w-full min-w-0 ${
                      isActive
                        ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-950/60 border border-blue-400/50'
                        : 'bg-[#0F223D] hover:bg-[#162D4E] text-slate-200 hover:text-white font-bold border border-[#1E3A5F] hover:border-sky-400/50 shadow-xs hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-white stroke-[2.5]'
                        : 'text-sky-400 group-hover:text-sky-300 stroke-[2]'
                    }`} />

                    <span className={`truncate min-w-0 leading-normal pt-0.5 ${isActive ? 'font-black text-white' : 'font-bold text-slate-200 group-hover:text-white'}`}>
                      <span className="hidden xl:inline">{tab.label}</span>
                      <span className="inline xl:hidden">{tab.shortLabel}</span>
                    </span>

                    {tab.isAi && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono leading-none shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-purple-900/60 text-purple-200 border border-purple-400/40 group-hover:bg-purple-800'
                      }`}>
                        AI
                      </span>
                    )}

                    {tab.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 min-w-[20px] h-4 rounded-full font-black font-mono transition-colors leading-none flex items-center justify-center border shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white border border-white/25'
                            : 'bg-[#071324] group-hover:bg-[#0B1A30] text-sky-300 group-hover:text-sky-200 border border-[#234575] group-hover:border-sky-400/50'
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
