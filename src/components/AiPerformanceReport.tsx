import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StationedAdvisor, VirtualAdvisor, TaskItem, TimeLog, TeamType } from '../types';
import { getNumericKpi, formatKpiDisplay } from '../utils/sheetParser';
import { 
  Sparkles, 
  FileText, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Users, 
  ChevronRight, 
  Layers,
  Zap,
  CheckSquare,
  Square,
  Filter,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Target,
  BookOpen,
  PhoneCall,
  Clock,
  Check,
  ExternalLink,
  BrainCircuit,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';
import { 
  GeneratedFollowUpTask, 
  UnderperformingAdvisorDiagnostic, 
  generateAutoTasksFromPerformanceData,
  fetchAiGeneratedTasks 
} from '../utils/aiTaskGenerator';

interface AiPerformanceReportProps {
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  tasks: TaskItem[];
  timeLogs: TimeLog[];
  teamLeaderName: string;
  onAddTasks?: (newTasks: TaskItem[]) => void;
  onNavigateToTasks?: () => void;
}

export const AiPerformanceReport: React.FC<AiPerformanceReportProps> = ({
  stationedAdvisors,
  virtualAdvisors,
  tasks,
  timeLogs,
  teamLeaderName,
  onAddTasks,
  onNavigateToTasks,
}) => {
  // Active Sub-view: 'report' or 'auto_tasks'
  const [activeSubTab, setActiveSubTab] = useState<'report' | 'auto_tasks'>('report');

  // Report Generation State
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  // Auto-Tasks Generation State
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskDiagnostics, setTaskDiagnostics] = useState<UnderperformingAdvisorDiagnostic[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedFollowUpTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [createdTaskIds, setCreatedTaskIds] = useState<Set<string>>(new Set());
  const [taskSource, setTaskSource] = useState<'gemini-ai' | 'smart-rule-engine' | null>(null);
  const [aiNotes, setAiNotes] = useState<string | null>(null);

  // Task Filter State
  const [teamFilter, setTeamFilter] = useState<'all' | TeamType>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<{ title: string; count: number } | null>(null);

  // Initial local diagnostic calculation
  const initialLocalAnalysis = useMemo(() => {
    return generateAutoTasksFromPerformanceData(stationedAdvisors, virtualAdvisors, tasks);
  }, [stationedAdvisors, virtualAdvisors, tasks]);

  // Pre-load diagnostics on initial mount or update
  useEffect(() => {
    if (generatedTasks.length === 0) {
      setTaskDiagnostics(initialLocalAnalysis.diagnostics);
      setGeneratedTasks(initialLocalAnalysis.generatedTasks);
      setSelectedTaskIds(new Set(initialLocalAnalysis.generatedTasks.map((t) => t.id)));
      setTaskSource('smart-rule-engine');
    }
  }, [initialLocalAnalysis]);

  // AI Operational Report Generator
  const generateReport = async () => {
    setReportLoading(true);

    try {
      const response = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationedData: stationedAdvisors,
          virtualData: virtualAdvisors,
          tasks,
          timeLogs,
          teamLeader: teamLeaderName,
        }),
      });

      const data = await response.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        throw new Error(data.error || 'Failed to generate report');
      }
    } catch (err: any) {
      console.warn('Backend API report error, using intelligent client fallback:', err);
      generateFallbackReport();
    } finally {
      setReportLoading(false);
    }
  };

  const generateFallbackReport = () => {
    const totalStationedSales = stationedAdvisors.reduce((acc, c) => acc + c.finalSalesData, 0);
    const totalVirtualSales = virtualAdvisors.reduce((acc, c) => acc + c.finalSales, 0);
    const avgStationedKpi = stationedAdvisors.length > 0 
      ? (stationedAdvisors.reduce((acc, c) => acc + getNumericKpi(c.totalKpiScore), 0) / stationedAdvisors.length).toFixed(1) 
      : '0.0';
    const avgVirtualKpi = virtualAdvisors.length > 0 
      ? (virtualAdvisors.reduce((acc, c) => acc + getNumericKpi(c.overallKpi), 0) / virtualAdvisors.length).toFixed(1) 
      : '0.0';

    const topStationed = [...stationedAdvisors].sort((a, b) => b.finalSalesData - a.finalSalesData || getNumericKpi(b.totalKpiScore) - getNumericKpi(a.totalKpiScore))[0];
    const topVirtual = [...virtualAdvisors].sort((a, b) => b.finalSales - a.finalSales || getNumericKpi(b.overallKpi) - getNumericKpi(a.overallKpi))[0];

    setReport({
      executiveSummary: `Team Kaizen Operations Report for Team Leader ${teamLeaderName}:
The combined operations generated a total revenue of ৳${(totalStationedSales + totalVirtualSales).toLocaleString('en-BD')}. 
Stationed Team achieved an average KPI score of ${avgStationedKpi}%, while Virtual Team recorded an average overall KPI of ${avgVirtualKpi}%. Overall call reach and CE audit consistency remain strong across both divisions.`,
      stationedAnalysis: `Stationed Division (${stationedAdvisors.length} advisors):
Recorded ৳${totalStationedSales.toLocaleString('en-BD')} in final sales. Average reach calls stand at ${Math.round(
        stationedAdvisors.reduce((acc, c) => acc + c.avgReach, 0) / (stationedAdvisors.length || 1)
      )}. Exam scores average 85%+.`,
      virtualAnalysis: `Virtual Division (${virtualAdvisors.length} advisors):
Recorded ৳${totalVirtualSales.toLocaleString('en-BD')} in sales. Total incentive payout calculated at ৳${virtualAdvisors.reduce((acc, c) => acc + c.finalIncentive, 0).toLocaleString('en-BD')}. High talk time efficiency across top virtual performers.`,
      topPerformers: [
        topStationed ? `${topStationed.advisorName} (Stationed) - KPI Score: ${formatKpiDisplay(topStationed.totalKpiScore)} (${topStationed.kpiGrade})` : 'N/A',
        topVirtual ? `${topVirtual.advisorName} (Virtual) - Overall KPI: ${formatKpiDisplay(topVirtual.overallKpi)}` : 'N/A',
      ],
      areasForImprovement: [
        'Monitor average break times for Stationed advisors exceeding 40 minutes.',
        'Improve briefing marks for mid-tier station advisors.',
        'Increase reach call volume for low-tier virtual team members.',
      ],
      coachingActions: [
        'Schedule 1-on-1 exam prep review for advisors under 80% mark threshold.',
        'Recognize top incentive earners during morning Kaizen briefing.',
        'Enforce strict call disposition (DISPO) logging for virtual advisors.',
        'Conduct weekly CE audit calibration with team leadership.',
      ],
    });
  };

  // AI Follow-Up Task Generator
  const handleAutoGenerateTasks = async () => {
    setTasksLoading(true);
    try {
      const result = await fetchAiGeneratedTasks(
        stationedAdvisors,
        virtualAdvisors,
        tasks,
        teamLeaderName
      );
      setTaskDiagnostics(result.diagnostics);
      setGeneratedTasks(result.generatedTasks);
      setSelectedTaskIds(new Set(result.generatedTasks.map((t) => t.id)));
      setTaskSource(result.source);
      setAiNotes(result.aiNotes || null);
    } catch (e) {
      console.warn('Error during auto task generation:', e);
      const fallback = generateAutoTasksFromPerformanceData(stationedAdvisors, virtualAdvisors, tasks);
      setTaskDiagnostics(fallback.diagnostics);
      setGeneratedTasks(fallback.generatedTasks);
      setSelectedTaskIds(new Set(fallback.generatedTasks.map((t) => t.id)));
      setTaskSource('smart-rule-engine');
    } finally {
      setTasksLoading(false);
    }
  };

  // Task Selection Handlers
  const handleToggleTaskSelect = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedTaskIds(new Set(filteredTasks.map((t) => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds(new Set());
  };

  // Batch Create Tasks Handler
  const handleCreateSelectedTasks = () => {
    const tasksToCreate = generatedTasks.filter(
      (t) => selectedTaskIds.has(t.id) && !createdTaskIds.has(t.id)
    );

    if (tasksToCreate.length === 0) return;

    if (onAddTasks) {
      const formattedTasks: TaskItem[] = tasksToCreate.map((t) => ({
        id: t.id.startsWith('task-') ? t.id : `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: t.title,
        description: `${t.description}\n\n[Auto-Diagnosed by AI: ${t.underperformanceReason} | Focus: ${t.recommendedFocus}]`,
        team: t.team,
        assignedAdvisorId: t.assignedAdvisorId,
        assignedAdvisorName: t.assignedAdvisorName,
        priority: t.priority,
        status: 'todo',
        category: t.category,
        dueDate: t.dueDate,
        createdAt: new Date().toISOString().slice(0, 10),
      }));

      onAddTasks(formattedTasks);

      // Track created IDs
      setCreatedTaskIds((prev) => {
        const next = new Set(prev);
        tasksToCreate.forEach((t) => next.add(t.id));
        return next;
      });

      // Show toast
      setToastMessage({
        title: 'Auto-Tasks Successfully Created',
        count: tasksToCreate.length,
      });

      setTimeout(() => {
        setToastMessage(null);
      }, 6000);
    }
  };

  // Single Task Create Handler
  const handleCreateSingleTask = (task: GeneratedFollowUpTask) => {
    if (createdTaskIds.has(task.id) || !onAddTasks) return;

    const formattedTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: task.title,
      description: `${task.description}\n\n[Auto-Diagnosed by AI: ${task.underperformanceReason} | Focus: ${task.recommendedFocus}]`,
      team: task.team,
      assignedAdvisorId: task.assignedAdvisorId,
      assignedAdvisorName: task.assignedAdvisorName,
      priority: task.priority,
      status: 'todo',
      category: task.category,
      dueDate: task.dueDate,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onAddTasks([formattedTask]);

    setCreatedTaskIds((prev) => {
      const next = new Set(prev);
      next.add(task.id);
      return next;
    });

    setToastMessage({
      title: 'Follow-Up Task Created',
      count: 1,
    });

    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return generatedTasks.filter((t) => {
      const matchesTeam = teamFilter === 'all' || t.team === teamFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesTeam && matchesPriority && matchesCategory;
    });
  }, [generatedTasks, teamFilter, priorityFilter, categoryFilter]);

  const selectedCount = useMemo(() => {
    return filteredTasks.filter((t) => selectedTaskIds.has(t.id) && !createdTaskIds.has(t.id)).length;
  }, [filteredTasks, selectedTaskIds, createdTaskIds]);

  const handlePrint = () => {
    window.print();
  };

  // Quick stats for the Underperforming Advisors Hub
  const stats = useMemo(() => {
    const totalUnderperforming = taskDiagnostics.length;
    const urgentTasks = generatedTasks.filter((t) => t.priority === 'urgent').length;
    const examTasks = generatedTasks.filter((t) => t.category === 'Exam Preparation').length;
    const callingTasks = generatedTasks.filter((t) => t.category === 'Calling Push').length;
    const pipAlerts = taskDiagnostics.filter((d) => d.is3xAlert || d.grade === 'PIP').length;

    return {
      totalUnderperforming,
      urgentTasks,
      examTasks,
      callingTasks,
      pipAlerts,
    };
  }, [taskDiagnostics, generatedTasks]);

  return (
    <div className="space-y-6">
      {/* Toast Notification for Task Creation */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-xl flex items-center gap-4 max-w-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                {toastMessage.title}
              </div>
              <div className="text-xs text-slate-700 font-medium truncate mt-0.5">
                Added {toastMessage.count} actionable task{toastMessage.count > 1 ? 's' : ''} to Task Manager.
              </div>
            </div>
            {onNavigateToTasks && (
              <button
                onClick={onNavigateToTasks}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors shadow-xs"
              >
                <span>View Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Feature Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <KaizenLogo size="md" className="shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-teal-50 text-[#3B7A75] border border-teal-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase flex items-center gap-1.5 font-mono">
                  <BrainCircuit className="w-3.5 h-3.5 text-[#3B7A75]" />
                  AI Performance Intelligence & Task Automation
                </span>
                {stats.totalUnderperforming > 0 && (
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    {stats.totalUnderperforming} Underperforming Advisors Flagged
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight mt-1.5">
                Automated Operational Briefing & Follow-Up Task Automation
              </h2>
              <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
                Synthesizing Stationed & Virtual team metrics into automated executive briefings, diagnosing operational bottlenecks, and auto-generating structured coaching tasks for Team Leader {teamLeaderName}.
              </p>
            </div>
          </div>

          {/* Action Buttons & Sub-Tab Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setActiveSubTab('report')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeSubTab === 'report'
                    ? 'bg-white text-[#3B7A75] border border-[#E2E8F0] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Executive Briefing</span>
              </button>
              <button
                onClick={() => setActiveSubTab('auto_tasks')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                  activeSubTab === 'auto_tasks'
                    ? 'bg-white text-[#3B7A75] border border-[#E2E8F0] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto-Generate Tasks</span>
                {generatedTasks.length > 0 && (
                  <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-1.5 py-0.2 rounded-full font-mono border border-amber-300">
                    {generatedTasks.length}
                  </span>
                )}
              </button>
            </div>

            {/* Main Triggers */}
            {activeSubTab === 'report' ? (
              <>
                <button
                  onClick={generateReport}
                  disabled={reportLoading}
                  className="bg-[#3B7A75] hover:bg-[#326965] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${reportLoading ? 'animate-spin' : ''}`} />
                  <span>{report ? 'Regenerate Briefing' : 'Generate AI Briefing'}</span>
                </button>

                {report && (
                  <button
                    onClick={handlePrint}
                    className="bg-[#F6F7F9] hover:bg-slate-200 text-[#0F172A] border border-[#E2E8F0] font-medium text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#3B7A75]" />
                    <span>PDF / Print</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleAutoGenerateTasks}
                disabled={tasksLoading}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Zap className={`w-4 h-4 ${tasksLoading ? 'animate-spin' : ''}`} />
                <span>{tasksLoading ? 'Analyzing Performance...' : 'Run Auto-Task AI Scan'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: AUTO-GENERATE FOLLOW-UP TASKS FOR UNDERPERFORMING ADVISORS */}
      {/* ========================================================================= */}
      {activeSubTab === 'auto_tasks' && (
        <div className="space-y-6">
          {/* Diagnostic Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#64748B] text-[11px] font-medium">
                <span>Flagged Advisors</span>
                <Users className="w-4 h-4 text-[#3B7A75]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0F172A] font-mono">
                  {stats.totalUnderperforming}
                </span>
                <span className="text-[10px] text-[#64748B]">of {stationedAdvisors.length + virtualAdvisors.length}</span>
              </div>
              <div className="text-[10px] text-[#3B7A75] font-semibold mt-1">
                Sub-target KPI or deficits
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-rose-700 text-[11px] font-medium">
                <span>Urgent Interventions</span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-700 font-mono">
                  {stats.urgentTasks}
                </span>
                <span className="text-[10px] text-rose-600 font-semibold">Immediate</span>
              </div>
              <div className="text-[10px] text-rose-700 font-medium mt-1">
                PIP / 3x Drop Alerts
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-amber-800 text-[11px] font-medium">
                <span>Exam Knowledge Drills</span>
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-800 font-mono">
                  {stats.examTasks}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">Tasks</span>
              </div>
              <div className="text-[10px] text-amber-800 font-medium mt-1">
                Scores below benchmark
              </div>
            </div>

            <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-sky-800 text-[11px] font-medium">
                <span>Calling Velocity Pushes</span>
                <PhoneCall className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-sky-800 font-mono">
                  {stats.callingTasks}
                </span>
                <span className="text-[10px] text-sky-700 font-semibold">Tasks</span>
              </div>
              <div className="text-[10px] text-sky-800 font-medium mt-1">
                Reach volume & DISPO
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-xs">
              <div className="flex items-center justify-between text-emerald-800 text-[11px] font-medium">
                <span>Tasks Ready to Assign</span>
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-800 font-mono">
                  {selectedCount}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Selected</span>
              </div>
              <div className="text-[10px] text-emerald-800 font-medium mt-1">
                Auto-assigned in 1 click
              </div>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Filters */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 text-[#64748B] font-medium">
                <Filter className="w-3.5 h-3.5 text-[#3B7A75]" />
                <span>Filters:</span>
              </div>

              {/* Team Filter */}
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value as any)}
                className="bg-[#F6F7F9] text-[#0F172A] border border-[#E2E8F0] px-3 py-1.5 rounded-lg font-medium focus:outline-none focus:border-[#3B7A75] cursor-pointer"
              >
                <option value="all">All Teams (Stationed + Virtual)</option>
                <option value="stationed">Stationed Division ({taskDiagnostics.filter((d) => d.team === 'stationed').length})</option>
                <option value="virtual">Virtual Division ({taskDiagnostics.filter((d) => d.team === 'virtual').length})</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-[#F6F7F9] text-[#0F172A] border border-[#E2E8F0] px-3 py-1.5 rounded-lg font-medium focus:outline-none focus:border-[#3B7A75] cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent Interventions (🚨)</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#F6F7F9] text-[#0F172A] border border-[#E2E8F0] px-3 py-1.5 rounded-lg font-medium focus:outline-none focus:border-[#3B7A75] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Exam Preparation">Exam Preparation</option>
                <option value="Calling Push">Calling Push</option>
                <option value="Training">Training / PIP</option>
                <option value="Briefing">Briefing</option>
                <option value="Sales Closing">Sales Closing</option>
                <option value="CE Audit">CE Audit</option>
              </select>
            </div>

            {/* Right: Batch Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-[#3B7A75] hover:text-[#2c5c58] font-bold px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 transition-colors cursor-pointer"
                >
                  Select All ({filteredTasks.length})
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs text-[#64748B] hover:text-[#0F172A] font-medium px-2 py-1.5 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <button
                onClick={handleCreateSelectedTasks}
                disabled={selectedCount === 0}
                className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                  selectedCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Create & Assign {selectedCount} Task{selectedCount !== 1 ? 's' : ''}</span>
              </button>
            </div>
          </div>

          {/* Underperforming Advisor Diagnostic Cards & Generated Tasks List */}
          {tasksLoading ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto animate-spin">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-800">
                  Scanning all Stationed & Virtual advisor operational data...
                </p>
                <p className="text-xs text-[#64748B]">
                  Parsing KPI scores, exam marks, reach volumes, and calculating targeted follow-up tasks.
                </p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">No Matching Underperforming Advisors Found</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                All advisors in the selected filter meet or exceed baseline performance thresholds.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 text-xs text-[#64748B]">
                <span>
                  Showing <strong className="text-[#0F172A]">{filteredTasks.length}</strong> auto-generated follow-up tasks across{' '}
                  <strong className="text-[#0F172A]">{taskDiagnostics.length}</strong> flagged advisors
                </span>
                {taskSource && (
                  <span className="text-[11px] font-mono text-[#3B7A75] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold">
                    {taskSource === 'gemini-ai' ? '✨ Gemini AI Synthesized' : '⚡ Smart Operations Rule Engine'}
                  </span>
                )}
              </div>

              {/* Task Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTasks.map((task) => {
                  const isSelected = selectedTaskIds.has(task.id);
                  const isCreated = createdTaskIds.has(task.id);

                  const priorityColors = {
                    urgent: 'bg-rose-50 text-rose-700 border-rose-200',
                    high: 'bg-amber-50 text-amber-800 border-amber-200',
                    medium: 'bg-sky-50 text-sky-800 border-sky-200',
                    low: 'bg-slate-50 text-slate-700 border-slate-200',
                  };

                  const categoryIcons: Record<string, any> = {
                    'Exam Preparation': BookOpen,
                    'Calling Push': PhoneCall,
                    'Training': Target,
                    'Briefing': Clock,
                    'Sales Closing': Award,
                    'CE Audit': ShieldAlert,
                  };
                  const CategoryIcon = categoryIcons[task.category] || Target;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl p-5 border transition-all relative flex flex-col justify-between gap-4 shadow-xs ${
                        isCreated
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : isSelected
                          ? 'bg-teal-50/40 border-[#3B7A75] ring-1 ring-[#3B7A75]/30'
                          : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      {/* Top Header: Checkbox, Advisor Name, Badges */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => handleToggleTaskSelect(task.id)}
                              disabled={isCreated}
                              className={`mt-0.5 p-1 rounded-md transition-colors cursor-pointer ${
                                isCreated
                                  ? 'text-emerald-600 bg-emerald-100'
                                  : isSelected
                                  ? 'text-[#3B7A75] bg-teal-100'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {isCreated ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : isSelected ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-[#0F172A] truncate">
                                  {task.assignedAdvisorName}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md font-mono ${
                                    task.team === 'stationed'
                                      ? 'bg-teal-50 text-[#3B7A75] border border-teal-200'
                                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}
                                >
                                  {task.team}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border font-mono ${
                                    priorityColors[task.priority]
                                  }`}
                                >
                                  {task.priority === 'urgent' && '🚨 '}
                                  {task.priority} Priority
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-[#0F172A] mt-1 leading-snug">
                                {task.title}
                              </h4>
                            </div>
                          </div>

                          {/* Category Badge */}
                          <div className="shrink-0 flex items-center gap-1 bg-[#F6F7F9] text-[#64748B] border border-[#E2E8F0] px-2 py-1 rounded-lg text-[10px] font-medium font-mono">
                            <CategoryIcon className="w-3 h-3 text-[#3B7A75]" />
                            <span className="hidden sm:inline">{task.category}</span>
                          </div>
                        </div>

                        {/* Root Cause Diagnostic Callout */}
                        <div className="mt-3 bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-rose-700 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Underperformance Trigger:
                            </span>
                            <span className="font-mono text-[#64748B] font-medium">
                              KPI: {task.advisorMetricsSummary.kpi} | Exam: {task.advisorMetricsSummary.exam} | Reach: {task.advisorMetricsSummary.reach}
                            </span>
                          </div>
                          <p className="text-xs text-[#0F172A] font-medium">
                            {task.underperformanceReason}
                          </p>
                        </div>

                        {/* Actionable Instructions */}
                        <p className="text-xs text-[#64748B] mt-2.5 leading-relaxed">
                          {task.description}
                        </p>
                      </div>

                      {/* Bottom Footer: Due date, Suggested Action & Single Action button */}
                      <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#3B7A75]" />
                            Target Due: <strong className="text-[#0F172A] font-mono">{task.dueDate}</strong>
                          </span>
                        </div>

                        <div>
                          {isCreated ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
                              <Check className="w-3.5 h-3.5" />
                              Assigned in Task Manager
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCreateSingleTask(task)}
                              className="bg-[#F6F7F9] hover:bg-[#3B7A75] hover:text-white text-[#0F172A] font-bold text-xs px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:border-[#3B7A75] transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Assign Task</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: EXECUTIVE OPERATIONAL REPORT */}
      {/* ========================================================================= */}
      {activeSubTab === 'report' && (
        <>
          {!report && !reportLoading ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-[#3B7A75]">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-[#0F172A]">Ready to Generate Operational Report</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Click 'Generate AI Briefing' above to synthesize all operational metrics for Team Leader {teamLeaderName}, or switch to 'Auto-Generate Tasks' to create immediate recovery plans for underperforming advisors.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={generateReport}
                    className="bg-[#3B7A75] hover:bg-[#326965] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Executive Briefing</span>
                  </button>
                  <button
                    onClick={() => setActiveSubTab('auto_tasks')}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Generate Follow-Up Tasks</span>
                  </button>
                </div>
              </div>
            </div>
          ) : reportLoading ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-4 animate-pulse shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-[#3B7A75] flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#3B7A75]">
                Analyzing Team Kaizen operational metrics with Gemini AI...
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-8 shadow-xs print:bg-white print:text-black">
              {/* Executive Summary Block */}
              <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
                <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2 uppercase tracking-wide">
                  <FileText className="w-5 h-5 text-[#3B7A75]" />
                  Executive Operations Summary
                </h3>
                <p className="text-xs text-[#0F172A] leading-relaxed whitespace-pre-line bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-4">
                  {report.executiveSummary}
                </p>
              </div>

              {/* Team Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-5 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3B7A75]" />
                    Stationed Team Analysis
                  </h4>
                  <p className="text-xs text-[#0F172A] leading-relaxed">
                    {report.stationedAnalysis}
                  </p>
                </div>

                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-5 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#3B7A75]" />
                    Virtual Team Analysis
                  </h4>
                  <p className="text-xs text-[#0F172A] leading-relaxed">
                    {report.virtualAnalysis}
                  </p>
                </div>
              </div>

              {/* 3 Columns: Top Performers, Bottlenecks, Action Items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Top Performers */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Top Performers
                  </h4>
                  <ul className="space-y-2 text-xs text-[#0F172A]">
                    {report.topPerformers?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Operational Bottlenecks
                  </h4>
                  <ul className="space-y-2 text-xs text-[#0F172A]">
                    {report.areasForImprovement?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-amber-200">
                        <ChevronRight className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tactical Actions */}
                <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#3B7A75]" />
                    Actionable Coaching Plan
                  </h4>
                  <ul className="space-y-2 text-xs text-[#0F172A]">
                    {report.coachingActions?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-teal-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B7A75] shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Seamless Bridge CTA to Auto-Task Generator */}
              <div className="bg-[#F6F7F9] border border-teal-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0F172A]">
                      Convert AI Insights into Actionable Follow-Up Tasks
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Auto-generate assigned recovery tasks for underperforming Stationed & Virtual advisors based on this report.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveSubTab('auto_tasks');
                    handleAutoGenerateTasks();
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Auto-Generate Tasks Now ({stats.totalUnderperforming} Flagged)</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
