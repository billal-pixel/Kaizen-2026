import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskItem, TeamType, StationedAdvisor, VirtualAdvisor } from '../types';
import { getNumericKpi, formatKpiDisplay } from '../utils/sheetParser';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertCircle, 
  User, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  List, 
  Kanban,
  X,
  Calendar,
  Sparkles,
  Flame,
  AlertTriangle,
  Zap,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';

interface TaskManagerProps {
  tasks: TaskItem[];
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  onAddTask: (task: TaskItem) => void;
  onUpdateTaskStatus: (id: string, newStatus: TaskItem['status']) => void;
  onDeleteTask: (id: string) => void;
  onSelectAdvisor?: (advisor: StationedAdvisor | VirtualAdvisor, type: TeamType) => void;
}

export type UrgencyLevel = 'critical' | 'elevated' | 'moderate' | 'normal' | 'completed';

export interface TaskUrgencyAssessment {
  level: UrgencyLevel;
  isUrgent: boolean;
  score: number;
  daysDiff: number;
  dueText: string;
  reasons: string[];
  primaryReason: string;
  advisor: StationedAdvisor | VirtualAdvisor | null;
  advisorType: TeamType;
  advisorKpi: number;
  isLowKpiAdvisor: boolean;
  badgeLabel: string;
  badgeColors: {
    bg: string;
    border: string;
    text: string;
    dot: string;
    pulseGlow: string;
    rowBg: string;
    leftBorder: string;
  };
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  stationedAdvisors,
  virtualAdvisors,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onSelectAdvisor,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [teamFilter, setTeamFilter] = useState<'all' | TeamType>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'all_urgent' | 'low_kpi' | 'due_soon'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState<TeamType>('stationed');
  const [assignedAdvisorId, setAssignedAdvisorId] = useState('');
  const [category, setCategory] = useState<TaskItem['category']>('Calling Push');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Map advisor helper
  const getAdvisorForTask = (task: TaskItem): { 
    advisor: StationedAdvisor | VirtualAdvisor | null; 
    type: TeamType; 
    kpi: number; 
    isLowKpi: boolean 
  } => {
    let found: StationedAdvisor | VirtualAdvisor | null = null;
    let type: TeamType = task.team;
    let kpi = 0;

    if (task.team === 'stationed') {
      const adv = stationedAdvisors.find(
        (a) => a.id === task.assignedAdvisorId || a.advisorName.toLowerCase() === task.assignedAdvisorName.toLowerCase()
      );
      if (adv) {
        found = adv;
        kpi = getNumericKpi(adv.totalKpiScore);
      }
    } else {
      const adv = virtualAdvisors.find(
        (a) => a.id === task.assignedAdvisorId || a.advisorName.toLowerCase() === task.assignedAdvisorName.toLowerCase()
      );
      if (adv) {
        found = adv;
        kpi = getNumericKpi(adv.overallKpi);
      }
    }

    const isLowKpi = found !== null && kpi > 0 && kpi < 80;
    return { advisor: found, type, kpi, isLowKpi };
  };

  // Comprehensive Urgency & Risk Calculation Engine
  const assessTaskUrgency = (task: TaskItem): TaskUrgencyAssessment => {
    const { advisor, type, kpi, isLowKpi } = getAdvisorForTask(task);

    if (task.status === 'completed') {
      return {
        level: 'completed',
        isUrgent: false,
        score: 0,
        daysDiff: 999,
        dueText: 'Completed',
        reasons: ['Task marked completed'],
        primaryReason: 'Completed',
        advisor,
        advisorType: type,
        advisorKpi: kpi,
        isLowKpiAdvisor: isLowKpi,
        badgeLabel: 'Completed',
        badgeColors: {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          border: 'border-emerald-300 dark:border-emerald-800/60',
          text: 'text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500',
          pulseGlow: '',
          rowBg: 'hover:bg-slate-50 dark:hover:bg-slate-800/30',
          leftBorder: 'border-l-4 border-l-emerald-500',
        },
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysDiff = 999;
    let dueText = 'No Due Date';

    if (task.dueDate) {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffMs = due.getTime() - today.getTime();
      daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) {
        dueText = `Overdue by ${Math.abs(daysDiff)}d`;
      } else if (daysDiff === 0) {
        dueText = 'Due Today';
      } else if (daysDiff === 1) {
        dueText = 'Due Tomorrow';
      } else {
        dueText = `Due in ${daysDiff}d`;
      }
    }

    const reasons: string[] = [];
    let riskScore = 0;

    // 1. Deadline Proximity Evaluation
    if (daysDiff < 0) {
      riskScore += 65 + Math.min(Math.abs(daysDiff) * 5, 25);
      reasons.push(`Overdue by ${Math.abs(daysDiff)}d`);
    } else if (daysDiff === 0) {
      riskScore += 50;
      reasons.push('Deadline is Today');
    } else if (daysDiff === 1) {
      riskScore += 35;
      reasons.push('Due Tomorrow');
    } else if (daysDiff === 2) {
      riskScore += 25;
      reasons.push('Due in 2 days');
    } else if (daysDiff <= 4) {
      riskScore += 15;
      reasons.push(`Due in ${daysDiff} days`);
    }

    // 2. Advisor Performance Risk Evaluation
    if (kpi > 0) {
      if (kpi < 60) {
        riskScore += 35;
        reasons.push(`Critical Advisor Risk (${kpi}% KPI)`);
      } else if (kpi < 75) {
        riskScore += 25;
        reasons.push(`Underperforming Advisor (${kpi}% KPI)`);
      } else if (kpi < 82) {
        riskScore += 15;
        reasons.push(`Advisor Below Target (${kpi}% KPI)`);
      }
    }

    // 3. Task Priority Weight
    if (task.priority === 'urgent') {
      riskScore += 30;
      reasons.push('Explicit Urgent Priority');
    } else if (task.priority === 'high') {
      riskScore += 15;
      reasons.push('High Priority Target');
    }

    // Urgency Classification
    const isCritical =
      daysDiff < 0 ||
      (daysDiff === 0 && (isLowKpi || task.priority === 'urgent' || task.priority === 'high')) ||
      (daysDiff <= 1 && isLowKpi) ||
      (task.priority === 'urgent' && daysDiff <= 3) ||
      riskScore >= 60;

    const isElevated =
      !isCritical &&
      (daysDiff === 0 ||
        daysDiff === 1 ||
        (daysDiff <= 3 && (isLowKpi || task.priority === 'high')) ||
        riskScore >= 35);

    const isModerate =
      !isCritical && !isElevated && (daysDiff <= 5 || task.priority === 'high' || riskScore >= 20);

    let level: UrgencyLevel = 'normal';
    let badgeLabel = 'On Track';
    let badgeColors = {
      bg: 'bg-slate-100 dark:bg-slate-900/60',
      border: 'border-slate-200 dark:border-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-400',
      pulseGlow: '',
      rowBg: 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
      leftBorder: 'border-l-4 border-l-slate-300 dark:border-l-slate-700',
    };

    if (isCritical) {
      level = 'critical';
      badgeLabel = daysDiff < 0 ? 'CRITICAL • Overdue' : 'CRITICAL • Urgent Push';
      badgeColors = {
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        border: 'border-rose-300 dark:border-rose-600/80',
        text: 'text-rose-700 dark:text-rose-300',
        dot: 'bg-rose-500',
        pulseGlow: 'animate-pulse ring-2 ring-rose-500/40 shadow-sm dark:shadow-lg shadow-rose-500/20 dark:shadow-rose-950/60',
        rowBg: 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/30',
        leftBorder: 'border-l-4 border-l-rose-500',
      };
    } else if (isElevated) {
      level = 'elevated';
      badgeLabel = 'ELEVATED • Attention Needed';
      badgeColors = {
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        border: 'border-amber-300 dark:border-amber-600/70',
        text: 'text-amber-800 dark:text-amber-300',
        dot: 'bg-amber-500',
        pulseGlow: 'ring-1 ring-amber-500/30 shadow-sm dark:shadow-md shadow-amber-500/20 dark:shadow-amber-950/30',
        rowBg: 'bg-amber-50/60 dark:bg-amber-950/15 hover:bg-amber-100/60 dark:hover:bg-amber-950/25',
        leftBorder: 'border-l-4 border-l-amber-500',
      };
    } else if (isModerate) {
      level = 'moderate';
      badgeLabel = 'MODERATE • Monitoring';
      badgeColors = {
        bg: 'bg-sky-50 dark:bg-blue-950/40',
        border: 'border-sky-300 dark:border-blue-700/60',
        text: 'text-sky-700 dark:text-blue-300',
        dot: 'bg-sky-500',
        pulseGlow: '',
        rowBg: 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
        leftBorder: 'border-l-4 border-l-sky-500',
      };
    }

    return {
      level,
      isUrgent: isCritical || isElevated,
      score: Math.min(riskScore, 100),
      daysDiff,
      dueText,
      reasons,
      primaryReason: reasons[0] || 'Standard pacing',
      advisor,
      advisorType: type,
      advisorKpi: kpi,
      isLowKpiAdvisor: isLowKpi,
      badgeLabel,
      badgeColors,
    };
  };

  // Map all tasks with their computed urgency assessments
  const tasksWithAssessment = useMemo(() => {
    return tasks.map((task) => ({
      task,
      urgency: assessTaskUrgency(task),
    }));
  }, [tasks, stationedAdvisors, virtualAdvisors]);

  // Urgency Summary KPI Counts
  const summaryStats = useMemo(() => {
    const criticalCount = tasksWithAssessment.filter((t) => t.urgency.level === 'critical').length;
    const elevatedCount = tasksWithAssessment.filter((t) => t.urgency.level === 'elevated').length;
    const lowKpiAssignedCount = tasksWithAssessment.filter(
      (t) => t.task.status !== 'completed' && t.urgency.isLowKpiAdvisor
    ).length;
    const dueSoonCount = tasksWithAssessment.filter(
      (t) => t.task.status !== 'completed' && t.urgency.daysDiff <= 1
    ).length;
    const completedCount = tasksWithAssessment.filter((t) => t.task.status === 'completed').length;

    return {
      criticalCount,
      elevatedCount,
      totalUrgent: criticalCount + elevatedCount,
      lowKpiAssignedCount,
      dueSoonCount,
      completedCount,
    };
  }, [tasksWithAssessment]);

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasksWithAssessment.filter(({ task, urgency }) => {
      const matchesTeam = teamFilter === 'all' || task.team === teamFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      let matchesUrgency = true;
      if (urgencyFilter === 'critical') {
        matchesUrgency = urgency.level === 'critical';
      } else if (urgencyFilter === 'all_urgent') {
        matchesUrgency = urgency.isUrgent;
      } else if (urgencyFilter === 'low_kpi') {
        matchesUrgency = urgency.isLowKpiAdvisor && task.status !== 'completed';
      } else if (urgencyFilter === 'due_soon') {
        matchesUrgency = urgency.daysDiff <= 1 && task.status !== 'completed';
      }

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.assignedAdvisorName.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query) ||
          urgency.reasons.some((r) => r.toLowerCase().includes(query));
      }

      return matchesTeam && matchesPriority && matchesUrgency && matchesSearch;
    });
  }, [tasksWithAssessment, teamFilter, priorityFilter, urgencyFilter, searchQuery]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let advisorName = 'Unassigned';
    if (team === 'stationed') {
      const found = stationedAdvisors.find((a) => a.id === assignedAdvisorId);
      if (found) advisorName = found.advisorName;
    } else {
      const found = virtualAdvisors.find((a) => a.id === assignedAdvisorId);
      if (found) advisorName = found.advisorName;
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      team,
      assignedAdvisorId,
      assignedAdvisorName: advisorName,
      priority,
      status: 'todo',
      category,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onAddTask(newTask);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const statusColumns: { id: TaskItem['status']; label: string; color: string; badgeColor: string }[] = [
    { id: 'todo', label: 'To Do', color: 'border-slate-200 bg-slate-100/70', badgeColor: 'bg-slate-500' },
    { id: 'in_progress', label: 'In Progress', color: 'border-sky-200 bg-sky-50/60', badgeColor: 'bg-sky-600' },
    { id: 'review', label: 'Under Review', color: 'border-amber-200 bg-amber-50/60', badgeColor: 'bg-amber-600' },
    { id: 'completed', label: 'Completed', color: 'border-emerald-200 bg-emerald-50/60', badgeColor: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="main-card container-box bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Smart Operations Hub
            </span>
            <span className="subtext text-slate-500 text-xs font-mono">Total Tasks: {tasks.length}</span>
          </div>
          <h2 className="card-title text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Kaizen Team Task Management
          </h2>
          <p className="subtext text-xs text-slate-600 mt-1 max-w-xl leading-relaxed font-medium">
            Auto-detecting and color-coding urgent operational tasks based on deadline proximity and assigned advisor performance telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Auto-Urgency Telemetry & Risk Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Critical Urgent Count */}
        <button
          onClick={() => setUrgencyFilter(urgencyFilter === 'critical' ? 'all' : 'critical')}
          className={`kpi-card metric-box p-3.5 rounded-2xl border text-left transition-all group cursor-pointer ${
            urgencyFilter === 'critical'
              ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/30 dark:ring-rose-500/40 shadow-sm'
              : 'bg-white dark:bg-slate-900/90 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="label-text text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
              Critical Urgent
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="metric-value text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{summaryStats.criticalCount}</span>
            <span className="subtext text-[10px] text-slate-500 dark:text-slate-400">tasks require immediate action</span>
          </div>
        </button>

        {/* Elevated & Upcoming Attention */}
        <button
          onClick={() => setUrgencyFilter(urgencyFilter === 'all_urgent' ? 'all' : 'all_urgent')}
          className={`kpi-card metric-box p-3.5 rounded-2xl border text-left transition-all group cursor-pointer ${
            urgencyFilter === 'all_urgent'
              ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 dark:border-amber-500 ring-2 ring-amber-500/30 dark:ring-amber-500/40 shadow-sm'
              : 'bg-white dark:bg-slate-900/90 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="label-text text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Total Urgent/Elevated
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="metric-value text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{summaryStats.totalUrgent}</span>
            <span className="subtext text-[10px] text-slate-500 dark:text-slate-400">near deadline or high risk</span>
          </div>
        </button>

        {/* Low KPI Advisor Assigned Tasks */}
        <button
          onClick={() => setUrgencyFilter(urgencyFilter === 'low_kpi' ? 'all' : 'low_kpi')}
          className={`kpi-card metric-box p-3.5 rounded-2xl border text-left transition-all group cursor-pointer ${
            urgencyFilter === 'low_kpi'
              ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/30 dark:ring-indigo-500/40 shadow-sm'
              : 'bg-white dark:bg-slate-900/90 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="label-text text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-indigo-500" />
              Advisor &lt;80% KPI
            </span>
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">Support</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="metric-value text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{summaryStats.lowKpiAssignedCount}</span>
            <span className="subtext text-[10px] text-slate-500 dark:text-slate-400">tasks needing supervision</span>
          </div>
        </button>

        {/* Imminent Deadlines (<= 24-48h) */}
        <button
          onClick={() => setUrgencyFilter(urgencyFilter === 'due_soon' ? 'all' : 'due_soon')}
          className={`kpi-card metric-box p-3.5 rounded-2xl border text-left transition-all group cursor-pointer ${
            urgencyFilter === 'due_soon'
              ? 'bg-sky-50 dark:bg-cyan-950/70 border-sky-400 dark:border-cyan-500 ring-2 ring-sky-500/30 dark:ring-cyan-500/40 shadow-sm'
              : 'bg-white dark:bg-slate-900/90 hover:bg-sky-50/50 dark:hover:bg-cyan-950/30 border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-cyan-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="label-text text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-cyan-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-500 dark:text-cyan-400" />
              Due &le; 48 Hours
            </span>
            <span className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 font-bold">Pacing</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="metric-value text-2xl font-black text-sky-600 dark:text-cyan-400 font-mono">{summaryStats.dueSoonCount}</span>
            <span className="subtext text-[10px] text-slate-500 dark:text-slate-400">due today or tomorrow</span>
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="main-card container-box bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Smart Urgency Filter */}
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Urgency Mode:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="bg-white text-rose-700 border border-slate-200 px-2.5 py-1.5 rounded-lg font-bold focus:outline-none focus:border-rose-400 cursor-pointer shadow-2xs"
            >
              <option value="all">All Tasks</option>
              <option value="critical">🔥 Critical Urgent Only</option>
              <option value="all_urgent">⚡ All Urgent / Elevated</option>
              <option value="low_kpi">📉 Assigned to &lt;80% KPI Advisor</option>
              <option value="due_soon">⏰ Due Today or Tomorrow</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Team:</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value as any)}
              className="bg-white text-indigo-700 border border-slate-200 px-2.5 py-1.5 rounded-lg font-semibold focus:outline-none focus:border-indigo-400 cursor-pointer shadow-2xs"
            >
              <option value="all">All Teams</option>
              <option value="stationed">Stationed Team</option>
              <option value="virtual">Virtual Team</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white text-slate-800 border border-slate-200 px-2.5 py-1.5 rounded-lg font-semibold focus:outline-none focus:border-indigo-400 cursor-pointer shadow-2xs"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Quick Search */}
          <input
            type="text"
            placeholder="Search task, advisor, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-xs w-48 sm:w-56 shadow-2xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
          {urgencyFilter !== 'all' && (
            <button
              onClick={() => setUrgencyFilter('all')}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
            >
              Reset Urgency Filter
            </button>
          )}
          <span>
            Showing <span className="text-slate-900 font-bold">{filteredTasks.length}</span> of {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KANBAN VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {statusColumns.map((col) => {
            const colTasks = filteredTasks.filter(({ task }) => task.status === col.id);

            return (
              <div
                key={col.id}
                className={`border rounded-2xl p-4 min-h-[460px] flex flex-col justify-between ${col.color} transition-all shadow-xs`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-200/80">
                    <span className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.badgeColor} shadow-xs`} />
                      {col.label}
                    </span>
                    <span className="bg-white text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-200 shadow-2xs font-mono">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[80px]">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {colTasks.map(({ task, urgency }) => (
                        <motion.div
                          layout
                          layoutId={task.id}
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.94, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.18 } }}
                          transition={{
                            layout: { type: 'spring', stiffness: 350, damping: 28 },
                            opacity: { duration: 0.2 },
                            scale: { duration: 0.2 },
                          }}
                          className={`border rounded-xl p-3.5 shadow-sm space-y-2.5 transition-all group relative ${
                            urgency.level === 'critical'
                              ? 'bg-rose-50/90 border-rose-300 shadow-rose-500/5 ring-1 ring-rose-400/30'
                              : urgency.level === 'elevated'
                              ? 'bg-amber-50/90 border-amber-300 shadow-amber-500/5 ring-1 ring-amber-400/30'
                              : 'bg-white border-slate-200 hover:border-indigo-400'
                          }`}
                        >
                          {/* Top Urgency & Risk Indicator Chip */}
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Color-Coded Urgency Indicator */}
                            <div
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${urgency.badgeColors.bg} ${urgency.badgeColors.border} ${urgency.badgeColors.text}`}
                              title={urgency.reasons.join(' • ')}
                            >
                              {urgency.level === 'critical' ? (
                                <Flame className="w-3 h-3 text-rose-500 shrink-0 animate-pulse" />
                              ) : urgency.level === 'elevated' ? (
                                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                              ) : urgency.level === 'completed' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : (
                                <span className={`w-1.5 h-1.5 rounded-full ${urgency.badgeColors.dot}`} />
                              )}
                              <span className="truncate max-w-[150px]">{urgency.badgeLabel}</span>
                            </div>

                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="text-slate-400 hover:text-rose-600 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-rose-50 cursor-pointer shrink-0"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Task Title & Description */}
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs leading-snug">{task.title}</h4>
                            {task.description && (
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed font-medium">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Urgency Diagnostic Reason Banner (if critical or elevated) */}
                          {urgency.isUrgent && (
                            <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[10px] shadow-2xs">
                              <span className="text-slate-700 font-medium truncate max-w-[160px]">
                                {urgency.primaryReason}
                              </span>
                              <span
                                className={`font-mono font-bold ${
                                  urgency.daysDiff < 0
                                    ? 'text-rose-600'
                                    : urgency.daysDiff === 0
                                    ? 'text-amber-700'
                                    : 'text-indigo-600'
                                }`}
                              >
                                {urgency.dueText}
                              </span>
                            </div>
                          )}

                          {/* Assigned Advisor Info with Live Performance Indicator */}
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                            <button
                              onClick={() => {
                                if (urgency.advisor && onSelectAdvisor) {
                                  onSelectAdvisor(urgency.advisor, urgency.advisorType);
                                }
                              }}
                              className="flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 font-semibold truncate max-w-[140px] text-left cursor-pointer group/adv"
                              title={`View ${task.assignedAdvisorName}'s performance details`}
                            >
                              <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate group-hover/adv:underline">{task.assignedAdvisorName}</span>
                            </button>

                            {/* Advisor KPI Indicator Tag */}
                            {urgency.advisorKpi > 0 && (
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                  urgency.advisorKpi < 75
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : urgency.advisorKpi < 85
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                                title={`Advisor Current Performance Score: ${urgency.advisorKpi}% KPI`}
                              >
                                {urgency.advisorKpi}% KPI
                              </span>
                            )}
                          </div>

                          {/* Due Date & Category Row */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span className="text-slate-600">{task.category}</span>
                            <span className="flex items-center gap-1 font-mono text-slate-600 font-semibold">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {task.dueDate}
                            </span>
                          </div>

                          {/* Status Change Selector */}
                          <div className="pt-1">
                            <select
                              value={task.status}
                              onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as any)}
                              className="w-full bg-white border border-slate-200 text-[11px] text-slate-900 rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none cursor-pointer hover:border-indigo-400 focus:border-indigo-500 transition-colors shadow-2xs"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="review">Under Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {colTasks.length === 0 && (
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-28 rounded-xl border border-dashed border-slate-800/80 flex flex-col items-center justify-center text-slate-500 text-[11px] gap-1 p-3 text-center"
                      >
                        <CheckSquare className="w-4 h-4 opacity-40" />
                        <span>No tasks in {col.label.toLowerCase()}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* LIST VIEW WITH COLOR-CODED VISUAL INDICATORS */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Smart Urgency & Health</th>
                  <th className="p-3.5">Task Title</th>
                  <th className="p-3.5">Assigned Advisor</th>
                  <th className="p-3.5">Advisor KPI</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Due Date & Proximity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredTasks.map(({ task, urgency }) => (
                    <motion.tr
                      layout
                      layoutId={`row-${task.id}`}
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                      transition={{
                        layout: { type: 'spring', stiffness: 350, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      className={`transition-colors ${urgency.badgeColors.rowBg} ${urgency.badgeColors.leftBorder}`}
                    >
                      {/* Smart Urgency Color-Coded Indicator Column */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border w-fit ${urgency.badgeColors.bg} ${urgency.badgeColors.border} ${urgency.badgeColors.text}`}
                            title={urgency.reasons.join(' • ')}
                          >
                            {urgency.level === 'critical' ? (
                              <Flame className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0 animate-pulse" />
                            ) : urgency.level === 'elevated' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            ) : urgency.level === 'completed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <span className={`w-2 h-2 rounded-full ${urgency.badgeColors.dot}`} />
                            )}
                            <span>{urgency.badgeLabel}</span>
                          </div>
                          {urgency.isUrgent && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                              {urgency.primaryReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="p-3.5 max-w-[220px]">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{task.title}</span>
                        {task.description && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block line-clamp-1 mt-0.5">
                            {task.description}
                          </span>
                        )}
                      </td>

                      {/* Assigned Advisor */}
                      <td className="p-3.5">
                        <button
                          onClick={() => {
                            if (urgency.advisor && onSelectAdvisor) {
                              onSelectAdvisor(urgency.advisor, urgency.advisorType);
                            }
                          }}
                          className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-cyan-300 font-medium text-left cursor-pointer group/adv"
                        >
                          <User className="w-3.5 h-3.5 text-sky-500 dark:text-cyan-400 shrink-0" />
                          <span className="group-hover/adv:underline">{task.assignedAdvisorName}</span>
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                              task.team === 'stationed'
                                ? 'bg-sky-100 dark:bg-cyan-500/20 text-sky-700 dark:text-cyan-300'
                                : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            {task.team === 'stationed' ? 'ST' : 'VT'}
                          </span>
                        </button>
                      </td>

                      {/* Advisor Live KPI Score */}
                      <td className="p-3.5 font-mono font-bold">
                        {urgency.advisorKpi > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${
                              urgency.advisorKpi < 75
                                ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
                                : urgency.advisorKpi < 85
                                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                                : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                            }`}
                          >
                            {urgency.advisorKpi < 80 ? (
                              <TrendingDown className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                            ) : (
                              <TrendingUp className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            )}
                            {urgency.advisorKpi}%
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">{task.category}</td>

                      {/* Priority */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80'
                              : task.priority === 'high'
                              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80'
                              : 'bg-sky-50 dark:bg-cyan-950/80 text-sky-700 dark:text-cyan-300 border border-sky-300 dark:border-cyan-800/80'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Due Date & Proximity */}
                      <td className="p-3.5 font-mono">
                        <div className="flex flex-col">
                          <span className="text-slate-900 dark:text-slate-200">{task.dueDate}</span>
                          <span
                            className={`text-[10px] font-semibold ${
                              urgency.daysDiff < 0
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : urgency.daysDiff === 0
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {urgency.dueText}
                          </span>
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="p-3.5">
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as any)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 focus:outline-hidden cursor-pointer hover:border-sky-400 dark:hover:border-sky-500 focus:border-sky-500"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Under Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                      No tasks found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW TASK MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Assign New Task</h3>
                    <p className="text-[11px] text-slate-500">Set operational goals for advisors</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Complete 150 Reach Calls Sprint"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Specific goals or guidelines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Target Team</label>
                    <select
                      value={team}
                      onChange={(e) => setTeam(e.target.value as TeamType)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs font-medium"
                    >
                      <option value="stationed">Stationed Team</option>
                      <option value="virtual">Virtual Team</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Assigned Advisor</label>
                    <select
                      value={assignedAdvisorId}
                      onChange={(e) => setAssignedAdvisorId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs font-medium"
                    >
                      <option value="">Select Advisor</option>
                      {team === 'stationed'
                        ? stationedAdvisors.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.advisorName} ({getNumericKpi(a.totalKpiScore)}% KPI)
                            </option>
                          ))
                        : virtualAdvisors.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.advisorName} ({getNumericKpi(a.overallKpi)}% KPI)
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs font-medium"
                    >
                      <option value="Calling Push">Calling Push</option>
                      <option value="Exam Preparation">Exam Prep</option>
                      <option value="CE Audit">CE Audit</option>
                      <option value="Briefing">Briefing</option>
                      <option value="Sales Closing">Sales Closing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs font-medium"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
