import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  ArrowRight, 
  Users, 
  BarChart3, 
  PhoneCall, 
  CheckSquare, 
  Clock, 
  Sparkles, 
  Zap, 
  Copy, 
  Plus, 
  CreditCard, 
  Sun, 
  Moon, 
  RefreshCw,
  FileSpreadsheet,
  CornerDownLeft,
  ChevronRight,
  Sliders,
  ExternalLink,
  ShieldAlert,
  Box
} from 'lucide-react';
import { StationedAdvisor, VirtualAdvisor, TaskItem, CallRecord } from '../types';
import { getNumericKpi, formatKpiDisplay } from '../utils/sheetParser';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  tasks: TaskItem[];
  callRecords?: CallRecord[];
  onSelectAdvisor: (advisor: any, type: 'stationed' | 'virtual') => void;
  onNavigateTab: (tab: 'overview' | 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report') => void;
  onOpenSheetSync: () => void;
  onOpenAddModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenThreeBgModal?: () => void;
  onToggleTheme?: () => void;
  onSyncNow?: () => void;
  onShowToast: (msg: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  stationedAdvisors,
  virtualAdvisors,
  tasks,
  callRecords = [],
  onSelectAdvisor,
  onNavigateTab,
  onOpenSheetSync,
  onOpenAddModal,
  onOpenPaymentModal,
  onOpenThreeBgModal,
  onToggleTheme,
  onSyncNow,
  onShowToast,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build Results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Navigation items
    const navItems = [
      { id: 'nav-overview', type: 'nav', title: 'Executive Hub (Overview)', sub: 'High-level telemetry & velocity', tab: 'overview' as const, icon: BarChart3 },
      { id: 'nav-stationed', type: 'nav', title: 'Stationed Team View', sub: `${stationedAdvisors.length} advisors`, tab: 'stationed' as const, icon: Users },
      { id: 'nav-virtual', type: 'nav', title: 'Virtual Team View', sub: `${virtualAdvisors.length} advisors`, tab: 'virtual' as const, icon: Users },
      { id: 'nav-calls', type: 'nav', title: 'Call Records Directory', sub: `${callRecords.length} recorded calls`, tab: 'call_records' as const, icon: PhoneCall },
      { id: 'nav-tasks', type: 'nav', title: 'Task Manager (Kanban)', sub: `${tasks.length} tasks`, tab: 'tasks' as const, icon: CheckSquare },
      { id: 'nav-time', type: 'nav', title: 'Time Tracker', sub: 'Break, MGT, and attendance logs', tab: 'time' as const, icon: Clock },
      { id: 'nav-ai', type: 'nav', title: 'AI Operations & Audit', sub: 'Executive automated performance review', tab: 'ai_report' as const, icon: Sparkles },
    ];

    // 2. Action items
    const actionItems = [
      {
        id: 'act-sync-now',
        type: 'action',
        title: 'Sync Google Sheet Now',
        sub: 'Force refresh real-time data from primary sheet',
        icon: RefreshCw,
        action: () => {
          if (onSyncNow) onSyncNow();
          onShowToast('🔄 Google Sheet synchronization initiated');
        },
      },
      {
        id: 'act-copy-antu',
        type: 'action',
        title: 'Copy Antu Payment Text (01850890778)',
        sub: 'bKash / Nagad admission message in Bengali',
        icon: Copy,
        action: () => {
          navigator.clipboard.writeText('আসসালামু আলাইকুম, আমি অন্তু  ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01850890778 ধন্যবাদ।');
          onShowToast('📋 Copied Antu\'s Payment message (01850890778)!');
        },
      },
      {
        id: 'act-copy-kayes',
        type: 'action',
        title: 'Copy Kayes Payment Text (01644336738)',
        sub: 'bKash / Nagad admission message in Bengali',
        icon: Copy,
        action: () => {
          navigator.clipboard.writeText('আসসালামু আলাইকুম, আমি কায়েস ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা  নগদ  করুন  এই নাম্বারে 01644336738 ধন্যবাদ.');
          onShowToast('📋 Copied Kayes\'s Payment message (01644336738)!');
        },
      },
      {
        id: 'act-add-advisor',
        type: 'action',
        title: '+ Add New Advisor',
        sub: 'Register a new rep to Stationed or Virtual Hub',
        icon: Plus,
        action: () => onOpenAddModal(),
      },
      {
        id: 'act-sheet-config',
        type: 'action',
        title: 'Google Sheet URL & Mapping Config',
        sub: 'Configure live spreadsheet connection and auto-sync',
        icon: FileSpreadsheet,
        action: () => onOpenSheetSync(),
      },
      {
        id: 'act-payment-modal',
        type: 'action',
        title: 'Open Payment Messages Center',
        sub: 'View all bKash and Nagad templates and numbers',
        icon: CreditCard,
        action: () => onOpenPaymentModal(),
      },
      ...(onOpenThreeBgModal ? [{
        id: 'act-three-bg-modal',
        type: 'action',
        title: '3D Background Experiences (WebGL Presets)',
        sub: 'Choose Cyber Grid, Neural Nexus, Prisms, or Starfield Warp',
        icon: Box,
        action: () => onOpenThreeBgModal(),
      }] : []),
      ...(onToggleTheme ? [{
        id: 'act-toggle-theme',
        type: 'action',
        title: 'Toggle Light / Dark Mode',
        sub: 'Switch between themes',
        icon: Sun,
        action: () => onToggleTheme(),
      }] : []),
    ];

    // 3. Advisor items
    const stationedItems = stationedAdvisors.map(a => ({
      id: `advisor-${a.id}`,
      type: 'advisor' as const,
      advisorType: 'stationed' as const,
      name: a.advisorName,
      employeeId: a.employeeId || 'TE-ID',
      sales: a.finalSalesData,
      kpi: getNumericKpi(a.totalKpiScore),
      grade: a.kpiGrade || 'B',
      raw: a,
    }));

    const virtualItems = virtualAdvisors.map(a => ({
      id: `advisor-${a.id}`,
      type: 'advisor' as const,
      advisorType: 'virtual' as const,
      name: a.advisorName,
      employeeId: a.employeeId || 'VT-ID',
      sales: a.finalSales,
      kpi: getNumericKpi(a.overallKpi),
      grade: typeof a.overallKpi === 'string' && ['A','B','C','D','PIP'].includes(a.overallKpi) ? a.overallKpi : 'B',
      raw: a,
    }));

    // Filter if search query exists
    if (!q) {
      // Return default recommended list
      return [
        ...actionItems.slice(0, 3),
        ...navItems,
        ...stationedItems.slice(0, 4),
        ...virtualItems.slice(0, 2),
      ];
    }

    const filteredActions = actionItems.filter(item => 
      item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    );

    const filteredNav = navItems.filter(item => 
      item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    );

    const filteredStationed = stationedItems.filter(item => 
      item.name.toLowerCase().includes(q) || item.employeeId.toLowerCase().includes(q)
    );

    const filteredVirtual = virtualItems.filter(item => 
      item.name.toLowerCase().includes(q) || item.employeeId.toLowerCase().includes(q)
    );

    const filteredTasks = tasks.filter(t => 
      t.title.toLowerCase().includes(q) || t.assignedAdvisorName?.toLowerCase().includes(q)
    ).slice(0, 4).map(t => ({
      id: `task-${t.id}`,
      type: 'task' as const,
      title: t.title,
      sub: `Assigned: ${t.assignedAdvisorName || 'Unassigned'} • Status: ${t.status}`,
      raw: t,
    }));

    return [
      ...filteredActions,
      ...filteredNav,
      ...filteredStationed,
      ...filteredVirtual,
      ...filteredTasks,
    ];
  }, [
    query, 
    stationedAdvisors, 
    virtualAdvisors, 
    tasks, 
    callRecords, 
    onSyncNow, 
    onOpenAddModal, 
    onOpenSheetSync, 
    onOpenPaymentModal, 
    onOpenThreeBgModal,
    onToggleTheme, 
    onShowToast
  ]);

  // Adjust selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleSelect = (item: any) => {
    if (!item) return;
    onClose();

    if (item.type === 'action') {
      item.action();
    } else if (item.type === 'nav') {
      onNavigateTab(item.tab);
    } else if (item.type === 'advisor') {
      onSelectAdvisor(item.raw, item.advisorType);
    } else if (item.type === 'task') {
      onNavigateTab('tasks');
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 sm:pt-16 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-[#1A3154] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Top Search Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-[#1A3154] bg-slate-50/70 dark:bg-[#071324]">
            <Search className="w-5 h-5 text-slate-400 dark:text-sky-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search advisors, tabs, tasks, payment copy, or type actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F223D] px-1.5 py-0.5 rounded shadow-2xs">
                ESC
              </span>
            )}
          </div>

          {/* Results List */}
          <div 
            ref={listRef} 
            className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/40 no-scrollbar"
          >
            {results.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No matches found for "{query}"
                </p>
                <p className="text-xs text-slate-400">
                  Try searching by advisor name, employee ID, "Antu", "Kayes", "Tasks", or "Sync".
                </p>
              </div>
            ) : (
              results.map((item: any, index: number) => {
                const isSelected = selectedIndex === index;

                if (item.type === 'action') {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-[#132845] border border-blue-200 dark:border-[#2B4E7E] text-blue-900 dark:text-white' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#0D1E36] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.sub}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Action
                      </span>
                    </div>
                  );
                }

                if (item.type === 'nav') {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-[#132845] border border-blue-200 dark:border-[#2B4E7E] text-blue-900 dark:text-white' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#0D1E36] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.sub}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 shrink-0">
                        Jump to Tab
                      </span>
                    </div>
                  );
                }

                if (item.type === 'advisor') {
                  const isStationed = item.advisorType === 'stationed';
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-[#132845] border border-blue-200 dark:border-[#2B4E7E]' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#0D1E36]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs font-mono shrink-0 ${
                          isStationed
                            ? 'bg-blue-100 dark:bg-[#0E2A4D] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                            : 'bg-emerald-100 dark:bg-[#0D332D] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                        }`}>
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {item.name}
                            </p>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase font-mono ${
                              isStationed 
                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {item.advisorType}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            ID: {item.employeeId} • Sales: ৳{item.sales.toLocaleString('en-BD')} • KPI: {item.kpi.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black font-mono border ${
                          item.grade === 'A'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                            : item.grade === 'B'
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                        }`}>
                          Grade {item.grade}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                }

                if (item.type === 'task') {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-[#132845] border border-blue-200 dark:border-[#2B4E7E]' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#0D1E36]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {item.sub}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 shrink-0">
                        Task
                      </span>
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-[#1A3154] bg-slate-50 dark:bg-[#071324] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#1e2c4a] text-[10px] font-mono font-bold">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#1e2c4a] text-[10px] font-mono font-bold">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#1e2c4a] text-[10px] font-mono font-bold">↵</kbd>
                <span>Select</span>
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#1e2c4a] font-bold">1-7</kbd> on any screen to switch tabs</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
