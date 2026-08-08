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
import { useAutoRefresh } from './hooks/useAutoRefresh';

export default function App() {
  const teamLeaderName = "Muhammad Billal";

  const PRIMARY_LIVE_SHEET = 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit?gid=1487776310#gid=1487776310';
  const DATA_VERSION = 'kaizen_v12_live_sheet_1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys';

  // Snapshot initial version before any state initializers write to localStorage
  const initialSavedVersion = useMemo(() => localStorage.getItem('kaizen_data_version'), []);

  // Google Sheet URL state (connected to requested live sheet)
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    const saved = localStorage.getItem('kaizen_sheet_url');
    if (!saved || saved.includes('1OenfVVwq4xEk_8s-LoRwxBh2_vMEtwe9COUy9bNa8kM')) {
      localStorage.setItem('kaizen_sheet_url', PRIMARY_LIVE_SHEET);
      return PRIMARY_LIVE_SHEET;
    }
    return saved;
  });

  const handleUpdateSheetUrl = (newUrl: string) => {
    setSheetUrl(newUrl);
    localStorage.setItem('kaizen_sheet_url', newUrl);
  };

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report'>('overview');

  // User Selected Theme State ('dark' or 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('kaizen_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
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
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Persistent State with LocalStorage & Automatic Migration to fresh synced data
  const [stationedAdvisors, setStationedAdvisors] = useState<StationedAdvisor[]>(() => {
    const saved = localStorage.getItem('kaizen_stationed_advisors');
    if (initialSavedVersion !== DATA_VERSION || !saved) {
      localStorage.setItem('kaizen_data_version', DATA_VERSION);
      return initialStationedAdvisors;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length < 10 || parsed.some((a: any) => a.advisorName === 'Tariqul Islam')) {
        return initialStationedAdvisors;
      }
      return parsed;
    } catch {
      return initialStationedAdvisors;
    }
  });

  const [virtualAdvisors, setVirtualAdvisors] = useState<VirtualAdvisor[]>(() => {
    const saved = localStorage.getItem('kaizen_virtual_advisors');
    if (initialSavedVersion !== DATA_VERSION || !saved) {
      return initialVirtualAdvisors;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length < 5 || parsed.some((a: any) => a.advisorName === 'Rafiqul Ahmed')) {
        return initialVirtualAdvisors;
      }
      return parsed;
    } catch {
      return initialVirtualAdvisors;
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

  // Modal States
  const [isSheetSyncOpen, setIsSheetSyncOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<{ advisor: StationedAdvisor | VirtualAdvisor; type: 'stationed' | 'virtual' } | null>(null);

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
    if (replace) {
      setStationedAdvisors((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(imported)) return prev;
        return imported;
      });
    } else {
      setStationedAdvisors((prev) => [...imported, ...prev]);
    }
  }, []);

  const handleImportVirtualData = useCallback((imported: VirtualAdvisor[], replace = true) => {
    if (replace) {
      setVirtualAdvisors((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(imported)) return prev;
        return imported;
      });
    } else {
      setVirtualAdvisors((prev) => [...imported, ...prev]);
    }
  }, []);

  // Dedicated custom hook for 60-second periodic auto-refresh
  const {
    isRefreshing: isAutoRefreshing,
    countdown: autoRefreshCountdown,
    refreshNow: triggerManualRefresh,
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
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      theme === 'light'
        ? 'bg-slate-100 text-slate-900 selection:bg-cyan-500 selection:text-slate-900 light-theme'
        : 'bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950'
    }`}>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
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
                onSelectAdvisor={(advisor, type) => setSelectedAdvisor({ advisor, type })}
              />
            )}

            {activeTab === 'stationed' && (
              <StationedTeamView
                advisors={stationedAdvisors}
                onUpdateAdvisor={handleUpdateStationed}
                onDeleteAdvisor={handleDeleteStationed}
                onAddAdvisor={() => setIsAddModalOpen(true)}
                onSelectAdvisor={(advisor) => setSelectedAdvisor({ advisor, type: 'stationed' })}
                onOpenSheetSync={() => setIsSheetSyncOpen(true)}
              />
            )}

            {activeTab === 'virtual' && (
              <VirtualTeamView
                advisors={virtualAdvisors}
                onUpdateAdvisor={handleUpdateVirtual}
                onDeleteAdvisor={handleDeleteVirtual}
                onAddAdvisor={() => setIsAddModalOpen(true)}
                onSelectAdvisor={(advisor) => setSelectedAdvisor({ advisor, type: 'virtual' })}
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
                onSelectAdvisor={(advisor, type) => setSelectedAdvisor({ advisor, type })}
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
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Sleek System Footer */}
        <footer className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 font-medium bg-slate-900/80 px-6 py-3.5 rounded-2xl border border-slate-800 backdrop-blur-md mt-10 gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-semibold tracking-wider uppercase text-[10px]">SYSTEM STATUS: OPERATIONAL</span>
          </div>
          <div>Team Leader: <span className="text-slate-200 font-semibold">{teamLeaderName}</span></div>
          <div className="text-slate-400">Real-Time Performance Dashboard</div>
        </footer>
      </main>

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

      {selectedAdvisor && (
        <AdvisorDetailModal
          advisor={selectedAdvisor.advisor}
          type={selectedAdvisor.type}
          tasks={tasks}
          timeLogs={timeLogs}
          callRecords={callRecords}
          onClose={() => setSelectedAdvisor(null)}
          onUpdate={(updated) => {
            if (selectedAdvisor.type === 'stationed') handleUpdateStationed(updated);
            else handleUpdateVirtual(updated);
          }}
        />
      )}
    </div>
  );
}

