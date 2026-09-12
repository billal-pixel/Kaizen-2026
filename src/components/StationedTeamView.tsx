import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StationedAdvisor } from '../types';
import { getNumericKpi, formatKpiDisplay } from '../utils/sheetParser';
import { evaluateAdvisorKpiAlert, getStoredAlertThreshold } from '../utils/kpiAlertSystem';
import { AnimatedCounter } from './AnimatedCounter';
import { AdvisorKpiSparkline } from './AdvisorKpiSparkline';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit2, 
  Trash2, 
  Plus, 
  Download, 
  Award, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Briefcase,
  FileSpreadsheet,
  Globe,
  Link2,
  ExternalLink,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  User,
  Activity,
  Zap,
  Sparkles,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

interface StationedTeamViewProps {
  advisors: StationedAdvisor[];
  onUpdateAdvisor: (updated: StationedAdvisor) => void;
  onDeleteAdvisor: (id: string) => void;
  onAddAdvisor: () => void;
  onSelectAdvisor: (advisor: StationedAdvisor) => void;
  onOpenSheetSync?: () => void;
}

// Framer Motion variants for subtle staggered loading & entry effects
const statContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

const statCardVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.96,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22,
      mass: 0.6,
    },
  },
};

const tableBodyVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.02,
    },
  },
};

const tableRowVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 340,
      damping: 28,
      mass: 0.6,
    },
  },
};

const cardGridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const advisorCardVariants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.96,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 23,
      mass: 0.7,
    },
  },
};

export const StationedTeamView: React.FC<StationedTeamViewProps> = ({
  advisors,
  onUpdateAdvisor,
  onDeleteAdvisor,
  onAddAdvisor,
  onSelectAdvisor,
  onOpenSheetSync,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof StationedAdvisor>('finalSalesData');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    return (localStorage.getItem('kaizen_stationed_view_mode') as 'table' | 'cards') || 'table';
  });

  const handleSetViewMode = (mode: 'table' | 'cards') => {
    setViewMode(mode);
    try {
      localStorage.setItem('kaizen_stationed_view_mode', mode);
    } catch {
      // ignore
    }
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StationedAdvisor>>({});

  // Filter & Sort logic
  const filteredAdvisors = useMemo(() => {
    return advisors
      .filter((advisor) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = advisor.advisorName.toLowerCase().includes(query) || (advisor.employeeId && advisor.employeeId.toLowerCase().includes(query));
        
        let matchesGrade = true;
        if (gradeFilter === 'alert') {
          const alertStatus = evaluateAdvisorKpiAlert(
            advisor.id || advisor.advisorName,
            advisor.advisorName,
            advisor.totalKpiScore,
            'stationed',
            advisor.kpiGrade,
            advisor.finalSalesData,
            advisor.avgExamMark
          );
          matchesGrade = alertStatus.isTriggered;
        } else if (gradeFilter !== 'all') {
          matchesGrade = advisor.kpiGrade === gradeFilter;
        }
        
        return matchesSearch && matchesGrade;
      })
      .sort((a, b) => {
        if (sortField === 'totalKpiScore') {
          const numA = getNumericKpi(a.totalKpiScore);
          const numB = getNumericKpi(b.totalKpiScore);
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [advisors, searchTerm, gradeFilter, sortField, sortOrder]);

  const handleSort = (field: keyof StationedAdvisor) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Employee ID', 'Advisor Name', 'TL Team', 'Advisor Designation', 'Lead ID', 
      'Avg Reach', 'Avg Talktime', 'CE Count', 'Avg Exam Mark', 'Avg Briefing Mark', 
      'Final Sales Data', 'Total KPI Score', 'KPI Grade', 'AVG Break', 'AVG MGT', 'AVG Meeting'
    ];

    const rows = filteredAdvisors.map(a => [
      a.employeeId || '',
      `"${a.advisorName.replace(/"/g, '""')}"`,
      `"${a.tlTeam || 'Billal'}"`,
      `"${a.advisorDesignation || 'Trainee Advisor'}"`,
      `"${a.leadId || ''}"`,
      a.avgReach,
      `"${a.avgTalktime}"`,
      a.ceCount,
      `"${a.avgExamMark}"`,
      `"${a.avgBriefingMark}"`,
      a.finalSalesData,
      a.totalKpiScore,
      a.kpiGrade,
      `"${a.avgBreak}"`,
      `"${a.avgMgt}"`,
      `"${a.avgMeeting}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kaizen_Stationed_Advisors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEdit = (advisor: StationedAdvisor) => {
    setEditingId(advisor.id);
    setEditForm({ ...advisor });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm) {
      const kpiScore = editForm.totalKpiScore ?? 0;
      let calculatedGrade: StationedAdvisor['kpiGrade'] = 'C';
      if (kpiScore >= 80) calculatedGrade = 'A';
      else if (kpiScore >= 70) calculatedGrade = 'B';
      else if (kpiScore >= 60) calculatedGrade = 'C';
      else if (kpiScore >= 50) calculatedGrade = 'D';
      else calculatedGrade = 'PIP';

      onUpdateAdvisor({
        ...(editForm as StationedAdvisor),
        kpiGrade: calculatedGrade,
      });
      setEditingId(null);
      setEditForm({});
    }
  };

  // Quick stats calculations
  const totalSales = useMemo(() => advisors.reduce((sum, a) => sum + (a.finalSalesData || 0), 0), [advisors]);
  const avgKpiScore = useMemo(() => {
    if (advisors.length === 0) return 0;
    return advisors.reduce((sum, a) => sum + getNumericKpi(a.totalKpiScore), 0) / advisors.length;
  }, [advisors]);
  const avgReachCount = useMemo(() => {
    if (advisors.length === 0) return 0;
    return Math.round(advisors.reduce((sum, a) => sum + (a.avgReach || 0), 0) / advisors.length);
  }, [advisors]);
  const totalCeCount = useMemo(() => advisors.reduce((sum, a) => sum + (a.ceCount || 0), 0), [advisors]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="main-card container-box bg-white dark:bg-[#10192e] border border-slate-200/90 dark:border-[#1e2c4a] rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Stationed Team
              </span>
              <span className="subtext text-slate-500 dark:text-slate-400 text-xs font-mono font-semibold">Total Members: {advisors.length}</span>
            </div>
            <h2 className="card-title text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight mt-1">
              Station Advisors Performance Hub
            </h2>
            <p className="subtext text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-2xl font-medium">
              Tracking on-site call reach, talktime, customer experience (CE) evaluations, exam & briefing scores, management time, and sales contributions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer group"
            >
              <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Station Group Joining Link</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 opacity-80" />
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="https://sites.google.com/view/10msmirpur/home"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer group"
            >
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" />
              <span>10MS Mirpur Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 opacity-80" />
            </motion.a>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <motion.div 
          variants={statContainerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6"
        >
          <motion.div 
            variants={statCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="kpi-card metric-box bg-white dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] hover:border-blue-500/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 min-w-0 shadow-xs transition-colors"
          >
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shrink-0 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
              <p className="label-text text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider leading-tight truncate">Stationed Sales</p>
              <p className="metric-value text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight leading-tight truncate">
                <AnimatedCounter value={totalSales} prefix="৳" />
              </p>
            </div>
          </motion.div>

          <motion.div 
            variants={statCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="kpi-card metric-box bg-white dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] hover:border-emerald-500/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 min-w-0 shadow-xs transition-colors"
          >
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0 flex items-center justify-center">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
              <p className="label-text text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider leading-tight truncate">Avg KPI Score</p>
              <p className="metric-value text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight leading-tight truncate">
                <AnimatedCounter value={avgKpiScore} decimals={1} suffix="%" />
              </p>
            </div>
          </motion.div>

          <motion.div 
            variants={statCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="kpi-card metric-box bg-white dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] hover:border-cyan-500/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 min-w-0 shadow-xs transition-colors"
          >
            <div className="p-2.5 sm:p-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shrink-0 flex items-center justify-center">
              <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
              <p className="label-text text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider leading-tight truncate">Avg Reach / Advisor</p>
              <p className="metric-value text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight leading-tight truncate">
                <AnimatedCounter value={avgReachCount} />
              </p>
            </div>
          </motion.div>

          <motion.div 
            variants={statCardVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="kpi-card metric-box bg-white dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] hover:border-emerald-500/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 min-w-0 shadow-xs transition-colors"
          >
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
              <p className="label-text text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider leading-tight truncate">Total CE Count</p>
              <p className="metric-value text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight leading-tight truncate">
                <AnimatedCounter value={totalCeCount} />
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Filter & Control Bar */}
      <div className="main-card container-box bg-white dark:bg-[#10192e] border border-slate-200/90 dark:border-[#1e2c4a] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm dark:shadow-lg min-w-0">
        <div className="relative w-full sm:w-80 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search station advisor name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end min-w-0">
          {/* Table / Cards View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] rounded-xl p-1 shrink-0">
            <button
              onClick={() => handleSetViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white border border-slate-200 dark:border-blue-400/40 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => handleSetViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white border border-slate-200 dark:border-blue-400/40 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap shrink-0">
            Showing <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold">{filteredAdvisors.length}</strong> of {advisors.length}
          </span>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] px-3 py-2 rounded-xl shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="shrink-0 font-semibold">Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-transparent text-blue-700 dark:text-blue-300 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">All Grades</option>
              <option value="alert" className="bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">🚨 At-Risk (3x Drop Alert)</option>
              <option value="A" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">A (80%+)</option>
              <option value="B" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">B (70-79%)</option>
              <option value="C" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">C (60-69%)</option>
              <option value="D" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">D (50-59%)</option>
              <option value="PIP" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">PIP (&lt;50%)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] px-3 py-2 rounded-xl shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="shrink-0 font-semibold">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as keyof StationedAdvisor)}
              className="bg-transparent text-blue-700 dark:text-blue-300 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="totalKpiScore" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">Total KPI Score</option>
              <option value="finalSalesData" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">Final Sales</option>
              <option value="avgReach" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">Avg Reach</option>
              <option value="kpiGrade" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">KPI Grade</option>
              <option value="advisorName" className="bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-200">Advisor Name</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              className="ml-1 p-1 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportCsv}
            className="bg-slate-50 dark:bg-[#15223c] hover:bg-slate-100 dark:hover:bg-[#1e2c4a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#24355a] font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
            title="Export Stationed Advisors data to CSV file"
          >
            <Download className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="hidden xs:inline">Export</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddAdvisor}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
            title="Add New Advisor"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span>Add Advisor</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content Area: Table vs Cards */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="stationed-table"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#10192e] border border-slate-200/90 dark:border-[#1e2c4a] rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl"
          >
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/95 dark:bg-[#15223c]/95 backdrop-blur-md text-slate-700 dark:text-slate-300 border-b border-slate-200/90 dark:border-[#1e2c4a] font-extrabold uppercase tracking-wider sticky top-0 z-10">
                    <th className="p-3.5 text-slate-900 dark:text-slate-200 min-w-[170px]">
                      <button onClick={() => handleSort('advisorName')} className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        <span>Station Advisor</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </th>
                    <th className="p-3.5 text-right min-w-[90px]">
                      <button onClick={() => handleSort('avgReach')} className="flex items-center gap-1 justify-end hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        <span>Avg Reach</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </th>
                    <th className="p-3.5 text-right min-w-[100px]">Avg Talktime</th>
                    <th className="p-3.5 text-right min-w-[80px]">
                      <button onClick={() => handleSort('ceCount')} className="flex items-center gap-1 justify-end hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        <span>CE Count</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </th>
                    <th className="p-3.5 text-right min-w-[95px]">Exam Mark</th>
                    <th className="p-3.5 text-right min-w-[95px]">Briefing Mark</th>
                    <th className="p-3.5 text-right min-w-[120px]">
                      <button onClick={() => handleSort('finalSalesData')} className="flex items-center gap-1 justify-end hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        <span>Final Sales</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </th>
                    <th className="p-3.5 text-right min-w-[130px]">
                      <button onClick={() => handleSort('totalKpiScore')} className="flex items-center gap-1 justify-end hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        <span>Total KPI %</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </th>
                    <th className="p-3.5 text-center min-w-[90px]">KPI Grade</th>
                    <th className="p-3.5 text-right min-w-[90px]">AVG Break</th>
                    <th className="p-3.5 text-right min-w-[90px]">AVG MGT</th>
                    <th className="p-3.5 text-right min-w-[90px]">AVG Meeting</th>
                    <th className="p-3.5 text-center min-w-[90px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-[#1e2c4a]/60 text-slate-700 dark:text-slate-300">
                  {filteredAdvisors.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-slate-400 dark:text-slate-500">
                        No station advisors found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAdvisors.map((advisor, index) => {
                      const isEditing = editingId === advisor.id;
                      const kpiNum = getNumericKpi(advisor.totalKpiScore);

                      if (isEditing) {
                        return (
                          <tr key={advisor.id} className="bg-blue-50/50 dark:bg-[#15223c] border-l-2 border-blue-500">
                            <td className="p-2">
                              <input
                                type="text"
                                value={editForm.advisorName ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, advisorName: e.target.value })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-blue-600 dark:text-blue-300 rounded px-2 py-1 w-full font-bold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editForm.avgReach ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, avgReach: Number(e.target.value) })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editForm.avgTalktime ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, avgTalktime: e.target.value })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editForm.ceCount ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, ceCount: Number(e.target.value) })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editForm.avgExamMark ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, avgExamMark: Number(e.target.value) })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editForm.avgBriefingMark ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, avgBriefingMark: Number(e.target.value) })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editForm.finalSalesData ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, finalSalesData: Number(e.target.value) })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.1"
                                value={editForm.totalKpiScore ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, totalKpiScore: Number(e.target.value) })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-emerald-600 dark:text-emerald-400 rounded px-2 py-1 w-full text-right font-mono font-bold"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <span className="text-[11px] text-slate-400 font-semibold">Auto</span>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editForm.avgBreak ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, avgBreak: e.target.value })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editForm.avgMgt ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, avgMgt: e.target.value })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editForm.avgMeeting ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, avgMeeting: e.target.value })}
                                className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#24355a] text-xs text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-full text-right font-mono"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={handleSaveEdit}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 px-2 py-1 rounded text-[10px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const alertStatus = evaluateAdvisorKpiAlert(
                        advisor.id || advisor.advisorName,
                        advisor.advisorName,
                        advisor.totalKpiScore,
                        'stationed',
                        advisor.kpiGrade,
                        advisor.finalSalesData,
                        advisor.avgExamMark
                      );

                      return (
                        <motion.tr 
                          key={advisor.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                          className={`transition-colors group cursor-pointer ${
                            alertStatus.isTriggered
                              ? 'bg-rose-50/60 dark:bg-rose-950/25 hover:bg-rose-100/60 dark:hover:bg-rose-950/45 border-l-4 border-l-rose-500'
                              : 'hover:bg-slate-50 dark:hover:bg-[#15223c]/60'
                          }`}
                          onClick={() => onSelectAdvisor(advisor)}
                        >
                          <td className="p-3.5 font-medium text-slate-900 dark:text-slate-100">
                            <div className="text-left flex flex-col">
                              <span className={`font-bold transition-colors flex items-center gap-1.5 ${
                                alertStatus.isTriggered ? 'text-rose-700 dark:text-rose-200 group-hover:text-rose-800 dark:group-hover:text-rose-100' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
                              }`}>
                                {alertStatus.isTriggered && (
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" title="KPI alert: Dropped below threshold for 3 consecutive updates" />
                                )}
                                {advisor.advisorName}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-500 shrink-0" />
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${alertStatus.isTriggered ? 'bg-rose-500' : 'bg-blue-500/80'}`} />
                                {advisor.employeeId || 'TE-ID'} • {advisor.tlTeam || 'Billal'}
                                {alertStatus.isTriggered && (
                                  <span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-1 rounded border border-rose-300 dark:border-rose-800/60">
                                    3x Alert
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-bold text-blue-600 dark:text-blue-400 font-mono">{advisor.avgReach}</td>
                          <td className="p-3.5 text-right text-slate-600 dark:text-slate-300 font-mono text-[11px]">{advisor.avgTalktime}</td>
                          <td className="p-3.5 text-right font-medium text-slate-800 dark:text-slate-200 font-mono">{advisor.ceCount}</td>
                          <td className="p-3.5 text-right font-medium text-slate-800 dark:text-slate-200 font-mono">{advisor.avgExamMark}</td>
                          <td className="p-3.5 text-right font-medium text-slate-800 dark:text-slate-200 font-mono">{advisor.avgBriefingMark}</td>
                          <td className="p-3.5 text-right font-black text-slate-900 dark:text-slate-100 font-mono">৳{advisor.finalSalesData.toLocaleString('en-BD')}</td>
                          <td className="p-3.5 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatKpiDisplay(advisor.totalKpiScore)}</span>
                              <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                <div 
                                  className={`h-full rounded-full ${
                                    kpiNum >= 80 ? 'bg-emerald-500' : kpiNum >= 70 ? 'bg-blue-500' : kpiNum >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${Math.min(kpiNum, 100)}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md font-black text-[11px] font-mono shadow-2xs border ${
                              advisor.kpiGrade === 'A'
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                : advisor.kpiGrade === 'B'
                                ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                                : advisor.kpiGrade === 'C'
                                ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                                : advisor.kpiGrade === 'D'
                                ? 'bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60'
                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                            }`}>
                              {advisor.kpiGrade}
                            </span>
                          </td>
                          <td className="p-3.5 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">{advisor.avgBreak}</td>
                          <td className="p-3.5 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">{advisor.avgMgt}</td>
                          <td className="p-3.5 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">{advisor.avgMeeting}</td>
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStartEdit(advisor)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1e2c4a] text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onDeleteAdvisor(advisor.id)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1e2c4a] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* Cards / Grid View */
          <motion.div
            key="stationed-cards"
            variants={cardGridVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredAdvisors.map((advisor, index) => {
                const isEditing = editingId === advisor.id;
                const kpiNum = getNumericKpi(advisor.totalKpiScore);
                const alertStatus = evaluateAdvisorKpiAlert(
                  advisor.id || advisor.advisorName,
                  advisor.advisorName,
                  advisor.totalKpiScore,
                  'stationed',
                  advisor.kpiGrade,
                  advisor.finalSalesData,
                  advisor.avgExamMark
                );

                if (isEditing) {
                  return (
                    <motion.div
                      layout
                      key={`edit-${advisor.id}`}
                      initial={{ opacity: 0.85, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 280, damping: 26, mass: 0.75 },
                      }}
                      className="rounded-2xl p-5 shadow-xl bg-white dark:bg-[#10192e] border-2 border-blue-500 flex flex-col justify-between space-y-3.5 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                          <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Quick Edit Advisor</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">ID: {advisor.employeeId || 'TE-ID'}</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Advisor Name</label>
                          <input
                            type="text"
                            value={editForm.advisorName ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, advisorName: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#15223c] font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1">Total KPI Score (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.totalKpiScore !== undefined ? getNumericKpi(editForm.totalKpiScore) : ''}
                              onChange={(e) => setEditForm({ ...editForm, totalKpiScore: Number(e.target.value) })}
                              className="w-full px-2 py-1 rounded-lg border-2 border-blue-400/80 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 font-mono font-black text-blue-700 dark:text-blue-300 focus:outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Final Sales (৳)</label>
                            <input
                              type="number"
                              value={editForm.finalSalesData ?? 0}
                              onChange={(e) => setEditForm({ ...editForm, finalSalesData: Number(e.target.value) })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#15223c] font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Avg Reach (/day)</label>
                            <input
                              type="number"
                              value={editForm.avgReach ?? 0}
                              onChange={(e) => setEditForm({ ...editForm, avgReach: Number(e.target.value) })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#15223c] font-mono text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Exam Mark (%)</label>
                            <input
                              type="number"
                              value={editForm.avgExamMark ?? 0}
                              onChange={(e) => setEditForm({ ...editForm, avgExamMark: Number(e.target.value) })}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#15223c] font-mono text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditForm({}); }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save & Reorder</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    layout
                    key={advisor.id}
                    variants={advisorCardVariants}
                    transition={{
                      layout: {
                        type: 'spring',
                        stiffness: 280,
                        damping: 26,
                        mass: 0.75,
                      },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 },
                    }}
                    whileHover={{ y: -4, transition: { duration: 0.18, ease: "easeOut" } }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectAdvisor(advisor)}
                    className={`rounded-2xl p-5 shadow-xs dark:shadow-lg relative overflow-hidden group cursor-pointer flex flex-col justify-between transition-colors transition-shadow duration-200 ${
                      alertStatus.isTriggered
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-2 border-rose-400 dark:border-rose-500/80 shadow-md shadow-rose-500/10'
                        : 'bg-white dark:bg-[#10192e] border border-slate-200/90 dark:border-[#1e2c4a] hover:border-blue-400 dark:hover:border-blue-500/60'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all ${
                      alertStatus.isTriggered ? 'bg-rose-500/10 dark:bg-rose-500/20' : 'bg-blue-500/5 dark:bg-blue-500/10 group-hover:bg-blue-500/15'
                    }`} />

                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            alertStatus.isTriggered
                              ? 'bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300'
                              : 'bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400'
                          }`}>
                            {alertStatus.isTriggered ? (
                              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-pulse" />
                            ) : (
                              advisor.advisorName.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                #{index + 1}
                              </span>
                              <h4 className={`font-bold text-sm transition-colors truncate ${
                                alertStatus.isTriggered ? 'text-rose-800 dark:text-rose-100' : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                              }`}>
                                {advisor.advisorName}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                              {advisor.employeeId || 'TE-ID'} • TL: {advisor.tlTeam || 'Billal'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg font-black text-xs font-mono shrink-0 border ${
                            advisor.kpiGrade === 'A'
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40'
                              : advisor.kpiGrade === 'B'
                              ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/40'
                              : advisor.kpiGrade === 'C'
                              ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/40'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/80'
                          }`}>
                            Grade {advisor.kpiGrade}
                          </span>
                          {alertStatus.isTriggered && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 text-[9px] font-black font-mono border border-rose-300 dark:border-rose-700/80 animate-pulse">
                              🚨 3x Alert
                            </span>
                          )}
                        </div>
                      </div>

                      {/* KPI & Sales Highlight */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2">
                        <div className="bg-slate-50 dark:bg-[#15223c] p-3 rounded-xl border border-slate-200/90 dark:border-[#24355a]">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Final Sales</span>
                          <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                            ৳{advisor.finalSalesData.toLocaleString('en-BD')}
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#15223c] p-3 rounded-xl border border-slate-200/90 dark:border-[#24355a]">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Total KPI</span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {formatKpiDisplay(advisor.totalKpiScore)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 30-Day Weekly KPI Performance Sparkline */}
                      <AdvisorKpiSparkline
                        advisorId={advisor.id || advisor.advisorName}
                        kpiScore={advisor.totalKpiScore}
                        grade={advisor.kpiGrade}
                        sales={advisor.finalSalesData}
                        examMark={advisor.avgExamMark}
                        teamType="stationed"
                      />

                      {/* Secondary Stats: Operational Metrics & Breakdown with subtle reveal on hover */}
                      <div className="space-y-2 pt-1 transition-all duration-300 ease-out">
                        {/* Operational Metrics Row with smooth fade-in and hover illumination */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px] opacity-75 sm:opacity-50 dark:opacity-45 group-hover:opacity-100 transition-all duration-300 ease-out transform translate-y-0.5 group-hover:translate-y-0">
                          <div className="bg-slate-50/80 dark:bg-[#15223c]/60 p-2 rounded-lg border border-slate-200/80 dark:border-[#24355a] group-hover:border-blue-300/70 dark:group-hover:border-blue-500/50 transition-colors" title="Accurate Average Daily Reach Calls">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Avg Reach</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{advisor.avgReach} <span className="text-[9px] font-normal text-slate-400">/day</span></span>
                          </div>
                          <div className="bg-slate-50/80 dark:bg-[#15223c]/60 p-2 rounded-lg border border-slate-200/80 dark:border-[#24355a] group-hover:border-blue-300/70 dark:group-hover:border-blue-500/50 transition-colors">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Talktime</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{advisor.avgTalktime || '0m'}</span>
                          </div>
                          <div className="bg-slate-50/80 dark:bg-[#15223c]/60 p-2 rounded-lg border border-slate-200/80 dark:border-[#24355a] group-hover:border-blue-300/70 dark:group-hover:border-blue-500/50 transition-colors">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">CE Count</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{advisor.ceCount}</span>
                          </div>
                        </div>

                        {/* Extended Secondary Operational Details (Exam, Briefing, Duties) smoothly revealing on hover */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform -translate-y-1 group-hover:translate-y-0 delay-75">
                          <div className="py-1 px-1.5 rounded-md bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 font-mono">
                            <span className="text-[9px] uppercase block opacity-75">Exam</span>
                            <span className="font-bold">{advisor.avgExamMark}%</span>
                          </div>
                          <div className="py-1 px-1.5 rounded-md bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 font-mono">
                            <span className="text-[9px] uppercase block opacity-75">Briefing</span>
                            <span className="font-bold">{advisor.avgBriefingMark}%</span>
                          </div>
                          <div className="py-1 px-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                            <span className="text-[9px] uppercase block opacity-75">Duties</span>
                            <span className="font-bold">{advisor.dutyCount || 6} shifts</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/90 dark:border-[#1e2c4a] text-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1 font-semibold">
                        View Full Dossier <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStartEdit(advisor)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1e2c4a] text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteAdvisor(advisor.id)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1e2c4a] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
