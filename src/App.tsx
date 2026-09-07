import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './index.css';
import { 
  StationedAdvisor, 
  VirtualAdvisor, 
  TaskItem, 
  TimeLog,
  CallRecord
} from './types';
import { 
  initialStationedAdvisors, 
  initialVirtualAdvisors, 
  initialTasks, 
  initialTimeLogs,
  initialCallRecords
} from './data/initialData';
import { getNumericKpi } from './utils/sheetParser';
import { deduplicateStationed, deduplicateVirtual } from './utils/sheetSync';
import { Header } from './components/Header';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { StationedTeamView } from './components/StationedTeamView';
import { VirtualTeamView } from './components/VirtualTeamView';
import { TaskManager } from './components/TaskManager';
import { TimeTracker } from './components/TimeTracker';
import { CallRecordsView } from './components/CallRecordsView';
import { AiPerformanceReport } from './components/AiPerformanceReport';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { AdvisorDetailModal } from './components/AdvisorDetailModal';
import { AddAdvisorModal } from './components/AddAdvisorModal';
import { PaymentCopyModal } from './components/PaymentCopyModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { Toast, ToastData } from './components/Toast';
import { SyncErrorAlert } from './components/SyncErrorAlert';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { ThreeBackground, ThreeBgStyle, ThreeBgIntensity } from './components/ThreeBackground';
import { ThreeBgModal } from './components/ThreeBgModal';
import { ThreeBgWidget } from './components/ThreeBgWidget';

export default function App() {
  const teamLeaderName = "Muhammad Billal";

  const PRIMARY_LIVE_SHEET = 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit#gid=0';
  const DATA_VERSION = 'kaizen_v37_stationed_and_virtual_all_tabs_real_data';

  // Snapshot initial version before any state initializers write to localStorage
  const initialSavedVersion = useMemo(() => localStorage.getItem('kaizen_data_version'), []);

  // Google Sheet URL state (connected to requested live sheet)
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    const saved = localStorage.getItem('kaizen_sheet_url');
    const CORRECT_SHEET = 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit#gid=0';
    if (!saved || !saved.includes('1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys')) {
      localStorage.setItem('kaizen_sheet_url', CORRECT_SHEET);
      return CORRECT_SHEET;
    }
    return saved;
  });

  const handleUpdateSheetUrl = (newUrl: string) => {
    setSheetUrl(newUrl);
    localStorage.setItem('kaizen_sheet_url', newUrl);
  };

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report'>('overview');

  // User Selected Theme State ('light' or 'dark') - explicitly set to light theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    localStorage.setItem('kaizen_theme', 'light');
    return 'light';
  });

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('kaizen_theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  // Persistent State with LocalStorage & Automatic Migration to fresh synced data
  const [stationedAdvisors, setStationedAdvisors] = useState<StationedAdvisor[]>(() => {
    const saved = localStorage.getItem('kaizen_stationed_advisors');
    if (initialSavedVersion !== DATA_VERSION || !saved) {
      localStorage.setItem('kaizen_data_version', DATA_VERSION);
      localStorage.setItem('kaizen_stationed_advisors', JSON.stringify(initialStationedAdvisors));
      return deduplicateStationed(initialStationedAdvisors);
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length !== 20 || parsed.some((a: any) => a.advisorName === 'Tariqul Islam' || a.employeeId === 'TE769')) {
        return deduplicateStationed(initialStationedAdvisors);
      }
      return deduplicateStationed(parsed);
    } catch {
      return deduplicateStationed(initialStationedAdvisors);
    }
  });

  const [virtualAdvisors, setVirtualAdvisors] = useState<VirtualAdvisor[]>(() => {
    const saved = localStorage.getItem('kaizen_virtual_advisors');
    if (initialSavedVersion !== DATA_VERSION || !saved) {
      localStorage.setItem('kaizen_virtual_advisors', JSON.stringify(initialVirtualAdvisors));
      return deduplicateVirtual(initialVirtualAdvisors);
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem('kaizen_virtual_advisors', JSON.stringify(initialVirtualAdvisors));
        return deduplicateVirtual(initialVirtualAdvisors);
      }
      return deduplicateVirtual(parsed);
    } catch {
      return deduplicateVirtual(initialVirtualAdvisors);
    }
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('kaizen_tasks');
    if (initialSavedVersion !== DATA_VERSION || !saved) {
      return initialTasks;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.some((t: any) => ['Tariqul Islam', 'Rafiqul Ahmed', 'Nusrat Jahan', 'Mahmudul Hasan', 'Sharmin Akter'].includes(t.assignedAdvisorName))) {
        return initialTasks;
      }
      return parsed;
    } catch {
      return initialTasks;
    }
  });

  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => {
    const saved = localStorage.getItem('kaizen_time_logs');
    if (initialSavedVersion !== DATA_VERSION || !saved) {
      return initialTimeLogs;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.some((l: any) => ['Tariqul Islam', 'Rafiqul Ahmed', 'Tanvir Hossain', 'Mahmudul Hasan'].includes(l.advisorName))) {
        return initialTimeLogs;
      }
      return parsed;
    } catch {
      return initialTimeLogs;
    }
  });

  const [callRecords, setCallRecords] = useState<CallRecord[]>(() => {
    const saved = localStorage.getItem('kaizen_call_records');
    if (initialSavedVersion !== DATA_VERSION || !saved) {
      return initialCallRecords;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.some((r: any) => r.id === 'rec-sheet-1' || (r.recordingUrl && r.recordingUrl.includes('drive.google.com')))) {
        return initialCallRecords;
      }
      return parsed;
    } catch {
      return initialCallRecords;
    }
  });

  // Modal & Active Review States
  const [isSheetSyncOpen, setIsSheetSyncOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<{ advisor: StationedAdvisor | VirtualAdvisor; type: 'stationed' | 'virtual' } | null>(null);

  // Global Toast System
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 2800);
  }, []);

  // 3D Background Experiences State
  const [isThreeBgModalOpen, setIsThreeBgModalOpen] = useState(false);
  const [threeBgEnabled, setThreeBgEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('kaizen_3d_bg_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [threeBgStyle, setThreeBgStyle] = useState<ThreeBgStyle>(() => {
    const saved = localStorage.getItem('kaizen_3d_bg_style') as ThreeBgStyle;
    return saved || 'cyber_grid';
  });
  const [threeBgIntensity, setThreeBgIntensity] = useState<ThreeBgIntensity>(() => {
    const saved = localStorage.getItem('kaizen_3d_bg_intensity') as ThreeBgIntensity;
    return saved || 'balanced';
  });
  const [threeBgSpeed, setThreeBgSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('kaizen_3d_bg_speed');
    return saved ? Number(saved) : 1.0;
  });
  const [threeBgInteractive, setThreeBgInteractive] = useState<boolean>(() => {
    const saved = localStorage.getItem('kaizen_3d_bg_interactive');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleThreeBg = useCallback(() => {
    setThreeBgEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('kaizen_3d_bg_enabled', JSON.stringify(next));
      showToast(next ? '3D Background enabled' : '3D Background turned off', 'info');
      return next;
    });
  }, [showToast]);

  const handleSelectThreeBgStyle = useCallback((style: ThreeBgStyle) => {
    setThreeBgStyle(style);
    localStorage.setItem('kaizen_3d_bg_style', style);
    const styleLabelMap: Record<ThreeBgStyle, string> = {
      cyber_grid: '3D Cyber Grid',
      neural_constellation: '3D Neural Nexus',
      floating_prisms: '3D Geometric Prisms',
      starfield_warp: '3D Starfield Warp',
    };
    showToast(`3D Scene: ${styleLabelMap[style]}`, 'info');
  }, [showToast]);

  const handleSelectThreeBgIntensity = useCallback((intensity: ThreeBgIntensity) => {
    setThreeBgIntensity(intensity);
    localStorage.setItem('kaizen_3d_bg_intensity', intensity);
  }, []);

  const handleSelectThreeBgSpeed = useCallback((speed: number) => {
    setThreeBgSpeed(speed);
    localStorage.setItem('kaizen_3d_bg_speed', String(speed));
  }, []);

  const handleToggleThreeBgInteractive = useCallback(() => {
    setThreeBgInteractive((prev) => {
      const next = !prev;
      localStorage.setItem('kaizen_3d_bg_interactive', JSON.stringify(next));
      showToast(next ? 'Mouse Parallax Tilt: ON' : 'Mouse Parallax Tilt: OFF', 'info');
      return next;
    });
  }, [showToast]);

  // Global Keyboard Shortcuts (⌘K, 1-7 Tab switching)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      // ⌘K or Ctrl+K opens Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // If user is editing a field, don't trigger tab navigation
      if (isEditing) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Quick 1-7 keys to switch tabs
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('overview'); }
        else if (e.key === '2') { e.preventDefault(); setActiveTab('stationed'); }
        else if (e.key === '3') { e.preventDefault(); setActiveTab('virtual'); }
        else if (e.key === '4') { e.preventDefault(); setActiveTab('call_records'); }
        else if (e.key === '5') { e.preventDefault(); setActiveTab('tasks'); }
        else if (e.key === '6') { e.preventDefault(); setActiveTab('time'); }
        else if (e.key === '7') { e.preventDefault(); setActiveTab('ai_report'); }
        else if (e.key === '/') { e.preventDefault(); setIsCommandPaletteOpen(true); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAdvisorDetails = useCallback((advisor: StationedAdvisor | VirtualAdvisor, type: 'stationed' | 'virtual') => {
    setSelectedAdvisor({ advisor, type });
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('kaizen_stationed_advisors', JSON.stringify(stationedAdvisors));
  }, [stationedAdvisors]);

  useEffect(() => {
    localStorage.setItem('kaizen_virtual_advisors', JSON.stringify(virtualAdvisors));
  }, [virtualAdvisors]);

  useEffect(() => {
    localStorage.setItem('kaizen_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('kaizen_time_logs', JSON.stringify(timeLogs));
  }, [timeLogs]);

  useEffect(() => {
    localStorage.setItem('kaizen_call_records', JSON.stringify(callRecords));
  }, [callRecords]);

  // Handlers for Call Records
  const handleAddCallRecord = useCallback((newRecord: Omit<CallRecord, 'id'>) => {
    const id = `rec-${Date.now()}`;
    setCallRecords((prev) => [{ ...newRecord, id }, ...prev]);
  }, []);

  const handleDeleteCallRecord = useCallback((id: string) => {
    setCallRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleUpdateCallRecord = useCallback((updated: CallRecord) => {
    setCallRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  // Handlers for Stationed Team
  const handleUpdateStationed = useCallback((updated: StationedAdvisor) => {
    setStationedAdvisors((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  const handleDeleteStationed = useCallback((id: string) => {
    setStationedAdvisors((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleAddStationed = useCallback((newAdvisor: StationedAdvisor) => {
    setStationedAdvisors((prev) => [newAdvisor, ...prev]);
  }, []);

  // Handlers for Virtual Team
  const handleUpdateVirtual = useCallback((updated: VirtualAdvisor) => {
    setVirtualAdvisors((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  const handleDeleteVirtual = useCallback((id: string) => {
    setVirtualAdvisors((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleAddVirtual = useCallback((newAdvisor: VirtualAdvisor) => {
    setVirtualAdvisors((prev) => [newAdvisor, ...prev]);
  }, []);

  // Handlers for Tasks
  const handleAddTask = useCallback((newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const handleAddBatchTasks = useCallback((newTasks: TaskItem[]) => {
    setTasks((prev) => [...newTasks, ...prev]);
  }, []);

  const handleUpdateTaskStatus = useCallback((id: string, newStatus: TaskItem['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handlers for Time Logs
  const handleAddLog = useCallback((newLog: TimeLog) => {
    setTimeLogs((prev) => [newLog, ...prev]);
  }, []);

  const handleDeleteLog = useCallback((id: string) => {
    setTimeLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // Import handlers from Google Sheet / CSV (with equality check to prevent blinking)
  const handleImportStationedData = useCallback((imported: StationedAdvisor[], replace = true) => {
    const cleanImported = deduplicateStationed(imported);
    if (replace) {
      setStationedAdvisors((prev) => {
        const cleanPrev = deduplicateStationed(prev);
        if (JSON.stringify(cleanPrev) === JSON.stringify(cleanImported)) return cleanPrev;
        return cleanImported;
      });
    } else {
      setStationedAdvisors((prev) => deduplicateStationed([...cleanImported, ...prev]));
    }
  }, []);

  const handleImportVirtualData = useCallback((imported: VirtualAdvisor[], replace = true) => {
    const cleanImported = deduplicateVirtual(imported);
    if (replace) {
      setVirtualAdvisors((prev) => {
        const cleanPrev = deduplicateVirtual(prev);
        if (JSON.stringify(cleanPrev) === JSON.stringify(cleanImported)) return cleanPrev;
        return cleanImported;
      });
    } else {
      setVirtualAdvisors((prev) => deduplicateVirtual([...cleanImported, ...prev]));
    }
  }, []);

  // Dedicated custom hook for 60-second periodic auto-refresh
  const {
    isRefreshing: isAutoRefreshing,
    countdown: autoRefreshCountdown,
    refreshNow: triggerManualRefresh,
    errorMessage: autoRefreshError,
    errorType: autoRefreshErrorType,
    lastErrorAt,
    consecutiveErrors,
    isErrorDismissed,
    dismissError: dismissAutoRefreshError,
  } = useAutoRefresh({
    sheetUrl,
    onImportStationedData: handleImportStationedData,
    onImportVirtualData: handleImportVirtualData,
    intervalSeconds: 60,
    enabled: true,
  });

  const handleResetData = useCallback(() => {
    if (window.confirm("Reset all advisor records, tasks, and time logs back to default Kaizen initial data?")) {
      setStationedAdvisors(initialStationedAdvisors);
      setVirtualAdvisors(initialVirtualAdvisors);
      setTasks(initialTasks);
      setTimeLogs(initialTimeLogs);
      localStorage.removeItem('kaizen_stationed_advisors');
      localStorage.removeItem('kaizen_virtual_advisors');
      localStorage.removeItem('kaizen_tasks');
      localStorage.removeItem('kaizen_time_logs');
    }
  }, []);

  // Summary figures
  const totalStationedSales = stationedAdvisors.reduce((a, c) => a + c.finalSalesData, 0);
  const totalVirtualSales = virtualAdvisors.reduce((a, c) => a + c.finalSales, 0);
  const totalSales = totalStationedSales + totalVirtualSales;

  const avgStationedKpi = stationedAdvisors.length > 0 ? (stationedAdvisors.reduce((a, c) => a + getNumericKpi(c.totalKpiScore), 0) / stationedAdvisors.length) : 0;
  const avgVirtualKpi = virtualAdvisors.length > 0 ? (virtualAdvisors.reduce((a, c) => a + getNumericKpi(c.overallKpi), 0) / virtualAdvisors.length) : 0;
  const totalAdvisorCount = stationedAdvisors.length + virtualAdvisors.length;
  const avgKpi = totalAdvisorCount > 0 ? ((avgStationedKpi * stationedAdvisors.length) + (avgVirtualKpi * virtualAdvisors.length)) / totalAdvisorCount : 0;

  return (
    <div className="relative min-h-screen font-sans bg-[#F8FAFC]/80 dark:bg-[#071324]/80 text-[#0F172A] dark:text-slate-100 selection:bg-[#2D6A65]/15 selection:text-[#2D6A65] transition-colors duration-200 overflow-x-hidden">
      {/* 3D WebGL Background Simulation Canvas Layer */}
      <ThreeBackground
        style={threeBgStyle}
        intensity={threeBgIntensity}
        speed={threeBgSpeed}
        theme={theme}
        interactive={threeBgInteractive}
        enabled={threeBgEnabled}
      />

      {/* Main App Content Layout Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Central Header Navigation */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          teamLeaderName={teamLeaderName}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSheetSync={() => setIsSheetSyncOpen(true)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenThreeBgModal={() => setIsThreeBgModalOpen(true)}
          threeBgEnabled={threeBgEnabled}
          threeBgStyle={threeBgStyle.replace('_', ' ').toUpperCase()}
          onShowToast={showToast}
          onResetData={handleResetData}
          stationedCount={stationedAdvisors.length}
          virtualCount={virtualAdvisors.length}
          callRecordsCount={callRecords.length}
          totalSales={totalSales}
          avgKpi={avgKpi}
          sheetUrl={sheetUrl}
          onUpdateSheetUrl={handleUpdateSheetUrl}
          onImportStationedData={handleImportStationedData}
          onImportVirtualData={handleImportVirtualData}
        />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        {/* Visual Error Alert Banner when Google Sheet Auto-Refresh Fails */}
        <SyncErrorAlert
          errorMessage={autoRefreshError}
          errorType={autoRefreshErrorType}
          lastErrorAt={lastErrorAt}
          consecutiveErrors={consecutiveErrors}
          isRefreshing={isAutoRefreshing}
          isErrorDismissed={isErrorDismissed}
          onRetry={triggerManualRefresh}
          onOpenSyncModal={() => setIsSheetSyncOpen(true)}
          onDismiss={dismissAutoRefreshError}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'overview' && (
              <ExecutiveOverview
                stationedAdvisors={stationedAdvisors}
                virtualAdvisors={virtualAdvisors}
                tasks={tasks}
                timeLogs={timeLogs}
                callRecords={callRecords}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
                onSelectAdvisor={(advisor, type) => handleOpenAdvisorDetails(advisor, type)}
              />
            )}

            {activeTab === 'stationed' && (
              <StationedTeamView
                advisors={stationedAdvisors}
                onUpdateAdvisor={handleUpdateStationed}
                onDeleteAdvisor={handleDeleteStationed}
                onAddAdvisor={() => setIsAddModalOpen(true)}
                onSelectAdvisor={(advisor) => handleOpenAdvisorDetails(advisor, 'stationed')}
                onOpenSheetSync={() => setIsSheetSyncOpen(true)}
              />
            )}

            {activeTab === 'virtual' && (
              <VirtualTeamView
                advisors={virtualAdvisors}
                onUpdateAdvisor={handleUpdateVirtual}
                onDeleteAdvisor={handleDeleteVirtual}
                onAddAdvisor={() => setIsAddModalOpen(true)}
                onSelectAdvisor={(advisor) => handleOpenAdvisorDetails(advisor, 'virtual')}
                onOpenSheetSync={() => setIsSheetSyncOpen(true)}
              />
            )}

            {activeTab === 'call_records' && (
              <CallRecordsView
                records={callRecords}
                stationedAdvisors={stationedAdvisors}
                virtualAdvisors={virtualAdvisors}
                onAddRecord={handleAddCallRecord}
                onDeleteRecord={handleDeleteCallRecord}
                onUpdateRecord={handleUpdateCallRecord}
                onSelectAdvisor={(advisor, type) => handleOpenAdvisorDetails(advisor, type)}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskManager
                tasks={tasks}
                stationedAdvisors={stationedAdvisors}
                virtualAdvisors={virtualAdvisors}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
                onSelectAdvisor={(advisor, type) => handleOpenAdvisorDetails(advisor, type)}
              />
            )}

            {activeTab === 'time' && (
              <TimeTracker
                logs={timeLogs}
                stationedAdvisors={stationedAdvisors}
                virtualAdvisors={virtualAdvisors}
                onAddLog={handleAddLog}
                onDeleteLog={handleDeleteLog}
              />
            )}

            {activeTab === 'ai_report' && (
              <AiPerformanceReport
                stationedAdvisors={stationedAdvisors}
                virtualAdvisors={virtualAdvisors}
                tasks={tasks}
                timeLogs={timeLogs}
                teamLeaderName={teamLeaderName}
                onAddTasks={handleAddBatchTasks}
                onNavigateToTasks={() => setActiveTab('tasks')}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Sleek System Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#475569] font-medium bg-white px-6 py-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs backdrop-blur-md mt-10 gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[#0F172A] font-bold tracking-wider uppercase text-[10px]">SYSTEM STATUS: OPERATIONAL</span>
          </div>
          <div>Team Leader: <span className="text-[#0F172A] font-bold">{teamLeaderName}</span></div>
          <div className="text-[#475569]">Real-Time Performance Dashboard</div>
        </footer>
      </main>
      </div>

      {/* Floating 3D Background Quick Switcher Widget */}
      <ThreeBgWidget
        enabled={threeBgEnabled}
        onToggleEnabled={handleToggleThreeBg}
        style={threeBgStyle}
        onSelectStyle={handleSelectThreeBgStyle}
        intensity={threeBgIntensity}
        onSelectIntensity={handleSelectThreeBgIntensity}
        onOpenModal={() => setIsThreeBgModalOpen(true)}
      />

      {/* 3D Background Experiences Settings Modal */}
      <ThreeBgModal
        isOpen={isThreeBgModalOpen}
        onClose={() => setIsThreeBgModalOpen(false)}
        style={threeBgStyle}
        onSelectStyle={handleSelectThreeBgStyle}
        intensity={threeBgIntensity}
        onSelectIntensity={handleSelectThreeBgIntensity}
        speed={threeBgSpeed}
        onChangeSpeed={handleSelectThreeBgSpeed}
        interactive={threeBgInteractive}
        onToggleInteractive={handleToggleThreeBgInteractive}
        enabled={threeBgEnabled}
        onToggleEnabled={handleToggleThreeBg}
      />

      {/* Modals */}
      <GoogleSheetSyncModal
        isOpen={isSheetSyncOpen}
        onClose={() => setIsSheetSyncOpen(false)}
        onImportStationedData={handleImportStationedData}
        onImportVirtualData={handleImportVirtualData}
        sheetUrl={sheetUrl}
        onUpdateSheetUrl={handleUpdateSheetUrl}
      />

      <AddAdvisorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStationed={handleAddStationed}
        onAddVirtual={handleAddVirtual}
      />

      <PaymentCopyModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      {/* Global Command Search & Action Palette (⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        stationedAdvisors={stationedAdvisors}
        virtualAdvisors={virtualAdvisors}
        tasks={tasks}
        callRecords={callRecords}
        onSelectAdvisor={(advisor, type) => {
          setIsCommandPaletteOpen(false);
          handleOpenAdvisorDetails(advisor, type);
        }}
        onNavigateTab={(tab) => {
          setIsCommandPaletteOpen(false);
          setActiveTab(tab);
        }}
        onOpenAddModal={() => {
          setIsCommandPaletteOpen(false);
          setIsAddModalOpen(true);
        }}
        onOpenSheetSync={() => {
          setIsCommandPaletteOpen(false);
          setIsSheetSyncOpen(true);
        }}
        onOpenPaymentModal={() => {
          setIsCommandPaletteOpen(false);
          setIsPaymentModalOpen(true);
        }}
        onOpenThreeBgModal={() => {
          setIsCommandPaletteOpen(false);
          setIsThreeBgModalOpen(true);
        }}
        onShowToast={showToast}
      />

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {selectedAdvisor && (
        <AdvisorDetailModal
          advisor={selectedAdvisor.advisor}
          type={selectedAdvisor.type}
          tasks={tasks}
          timeLogs={timeLogs}
          callRecords={callRecords}
          onClose={() => setSelectedAdvisor(null)}
          onAddTask={handleAddTask}
          onAddCallRecord={handleAddCallRecord}
          onUpdate={(updated) => {
            if (selectedAdvisor.type === 'stationed') handleUpdateStationed(updated);
            else handleUpdateVirtual(updated);
          }}
        />
      )}
    </div>
  );
}

