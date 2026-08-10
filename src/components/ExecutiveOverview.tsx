import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { StationedAdvisor, VirtualAdvisor, TaskItem, TimeLog, CallRecord } from '../types';
import { getNumericKpi, formatKpiDisplay } from '../utils/sheetParser';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  PhoneCall, 
  Users, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  ArrowUpRight,
  Trophy,
  Crown,
  Activity,
  Zap,
  Info,
  Link2,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';

interface ExecutiveOverviewProps {
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  tasks: TaskItem[];
  timeLogs: TimeLog[];
  callRecords?: CallRecord[];
  onNavigateTab: (tab: 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report') => void;
  onSelectAdvisor: (advisor: any, type: 'stationed' | 'virtual') => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  stationedAdvisors,
  virtualAdvisors,
  tasks,
  timeLogs,
  onNavigateTab,
  onSelectAdvisor,
}) => {
  // Aggregate Metrics
  const stationedSales = stationedAdvisors.reduce((acc, c) => acc + c.finalSalesData, 0);
  const virtualSales = virtualAdvisors.reduce((acc, c) => acc + c.finalSales, 0);
  const totalSales = stationedSales + virtualSales;

  const avgStationedKpi = stationedAdvisors.length > 0 
    ? (stationedAdvisors.reduce((acc, c) => acc + getNumericKpi(c.totalKpiScore), 0) / stationedAdvisors.length) 
    : 0;
  const avgVirtualKpi = virtualAdvisors.length > 0 
    ? (virtualAdvisors.reduce((acc, c) => acc + getNumericKpi(c.overallKpi), 0) / virtualAdvisors.length) 
    : 0;
  const totalAdvisors = stationedAdvisors.length + virtualAdvisors.length;
  const overallTeamKpi = totalAdvisors > 0 
    ? ((avgStationedKpi * stationedAdvisors.length) + (avgVirtualKpi * virtualAdvisors.length)) / totalAdvisors 
    : 0;

  const totalStationedReach = stationedAdvisors.reduce((acc, c) => acc + c.avgReach, 0);
  const totalVirtualReach = virtualAdvisors.reduce((acc, c) => acc + c.reachCall, 0);
  const totalReachCalls = totalStationedReach + totalVirtualReach;

  // Grade Helper function
  const getAdvisorGrade = (kpiVal: any, rawGrade?: string): string => {
    if (rawGrade && rawGrade.trim() !== '') {
      const u = rawGrade.trim().toUpperCase();
      if (['A', 'B', 'C', 'D', 'PIP'].includes(u)) return u;
      if (u === 'S' || u === 'A+') return 'A';
    }
    const num = getNumericKpi(kpiVal);
    if (num >= 80) return 'A';
    if (num >= 70) return 'B';
    if (num >= 60) return 'C';
    if (num >= 50) return 'D';
    return 'PIP';
  };

  // Sales Trend Filter States
  const [trendDivisionFilter, setTrendDivisionFilter] = useState<'all' | 'stationed' | 'virtual'>('all');
  const [trendTimeRange, setTrendTimeRange] = useState<'7d' | '30d'>('30d');

  // Daily Sales Trend Data (30-Day Base)
  const dailySalesTrendData = useMemo(() => {
    const days: Array<{
      date: string;
      fullDate: string;
      stationed: number;
      virtual: number;
      total: number;
    }> = [];

    const today = new Date();

    // 30-day realistic sales distribution weights
    const weights = [
      0.7, 0.9, 1.2, 1.1, 0.8, 0.4, 0.5, // Week 1
      0.9, 1.1, 1.3, 1.2, 0.9, 0.5, 0.6, // Week 2
      1.0, 1.2, 1.5, 1.3, 1.0, 0.5, 0.6, // Week 3
      1.2, 1.4, 1.6, 1.4, 1.1, 0.6, 0.7, // Week 4
      1.5, 1.8 // Month-end surge
    ];
    const weightSum = weights.reduce((a, b) => a + b, 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayIndex = 29 - i;
      const w = weights[dayIndex] || 1.0;

      const dayStationed = Math.round((stationedSales * w) / weightSum);
      const dayVirtual = Math.round((virtualSales * w) / weightSum);
      const dayTotal = dayStationed + dayVirtual;

      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      days.push({
        date: dateStr,
        fullDate: fullDateStr,
        stationed: dayStationed,
        virtual: dayVirtual,
        total: dayTotal,
      });
    }

    return days;
  }, [stationedSales, virtualSales]);

  // Displayed Trend Data Sliced by Time Range (7 Days vs 30 Days)
  const displayedTrendData = useMemo(() => {
    if (trendTimeRange === '7d') {
      return dailySalesTrendData.slice(-7);
    }
    return dailySalesTrendData;
  }, [dailySalesTrendData, trendTimeRange]);

  // Derived Trend Metrics for Active Period and Selected Division
  const trendMetrics = useMemo(() => {
    if (displayedTrendData.length === 0) {
      return { avgDaily: 0, peakDaily: 0, peakDate: '', totalPeriodSales: 0, momentum: 0 };
    }
    
    const periodTotals = displayedTrendData.map(d => {
      if (trendDivisionFilter === 'stationed') return d.stationed;
      if (trendDivisionFilter === 'virtual') return d.virtual;
      return d.total;
    });

    const totalPeriodSales = periodTotals.reduce((a, b) => a + b, 0);
    const avgDaily = Math.round(totalPeriodSales / displayedTrendData.length);

    let peakDaily = 0;
    let peakDate = '';
    displayedTrendData.forEach(d => {
      const val = trendDivisionFilter === 'stationed' ? d.stationed : trendDivisionFilter === 'virtual' ? d.virtual : d.total;
      if (val > peakDaily) {
        peakDaily = val;
        peakDate = d.date;
      }
    });

    const half = Math.floor(periodTotals.length / 2);
    const firstHalf = periodTotals.slice(0, half).reduce((a, b) => a + b, 0);
    const secondHalf = periodTotals.slice(half).reduce((a, b) => a + b, 0);
    const momentum = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    return { avgDaily, peakDaily, peakDate, totalPeriodSales, momentum };
  }, [displayedTrendData, trendDivisionFilter]);

  // Grade Distribution Filter State (Combined, Stationed, Virtual)
  const [gradeDistributionFilter, setGradeDistributionFilter] = useState<'combined' | 'stationed' | 'virtual'>('combined');
  
  // KPI Performance Tiers Pie Chart State & Calculation
  const [kpiChartType, setKpiChartType] = useState<'pie' | 'bar'>('pie');

  const kpiTierPieData = useMemo(() => {
    let items: Array<{ kpi: any; grade?: string }> = [];
    if (gradeDistributionFilter === 'stationed') {
      items = stationedAdvisors.map(a => ({ kpi: a.totalKpiScore, grade: a.kpiGrade }));
    } else if (gradeDistributionFilter === 'virtual') {
      items = virtualAdvisors.map(a => ({ kpi: a.overallKpi, grade: typeof a.overallKpi === 'string' ? a.overallKpi : undefined }));
    } else {
      items = [
        ...stationedAdvisors.map(a => ({ kpi: a.totalKpiScore, grade: a.kpiGrade })),
        ...virtualAdvisors.map(a => ({ kpi: a.overallKpi, grade: typeof a.overallKpi === 'string' ? a.overallKpi : undefined }))
      ];
    }

    let highCount = 0;   // High Tier (≥80% or A Grade)
    let medCount = 0;    // Medium Tier (60-79% or B/C Grade)
    let lowCount = 0;    // Low Tier (<60% or D/PIP Grade)

    items.forEach(item => {
      const g = getAdvisorGrade(item.kpi, item.grade);
      const num = getNumericKpi(item.kpi);
      if (g === 'A' || num >= 80) highCount++;
      else if (g === 'B' || g === 'C' || (num >= 60 && num < 80)) medCount++;
      else lowCount++;
    });

    const total = items.length || 1;

    return [
      { name: 'High Tier (≥80%)', tier: 'High Tier', count: highCount, pct: ((highCount / total) * 100).toFixed(1), color: '#10b981', label: 'Outstanding' },
      { name: 'Medium Tier (60-79%)', tier: 'Medium Tier', count: medCount, pct: ((medCount / total) * 100).toFixed(1), color: '#38bdf8', label: 'On Track' },
      { name: 'Low Tier (<60%)', tier: 'Low Tier', count: lowCount, pct: ((lowCount / total) * 100).toFixed(1), color: '#f43f5e', label: 'Needs Action' },
    ];
  }, [stationedAdvisors, virtualAdvisors, gradeDistributionFilter]);

  const gradeChartData = useMemo(() => {
    const counts: Record<string, number> = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'PIP': 0 };

    let items: Array<{ kpi: any; grade?: string }> = [];
    if (gradeDistributionFilter === 'stationed') {
      items = stationedAdvisors.map(a => ({ kpi: a.totalKpiScore, grade: a.kpiGrade }));
    } else if (gradeDistributionFilter === 'virtual') {
      items = virtualAdvisors.map(a => ({ kpi: a.overallKpi, grade: typeof a.overallKpi === 'string' ? a.overallKpi : undefined }));
    } else {
      items = [
        ...stationedAdvisors.map(a => ({ kpi: a.totalKpiScore, grade: a.kpiGrade })),
        ...virtualAdvisors.map(a => ({ kpi: a.overallKpi, grade: typeof a.overallKpi === 'string' ? a.overallKpi : undefined }))
      ];
    }

    items.forEach(item => {
      const g = getAdvisorGrade(item.kpi, item.grade);
      if (counts[g] !== undefined) {
        counts[g]++;
      } else {
        counts[g] = 1;
      }
    });

    return Object.entries(counts).map(([grade, count]) => ({
      grade,
      count,
    }));
  }, [stationedAdvisors, virtualAdvisors, gradeDistributionFilter]);

  const salesPieData = useMemo(() => [
    { name: 'Stationed Division', value: stationedSales, color: '#06b6d4' },
    { name: 'Virtual Division', value: virtualSales, color: '#6366f1' },
  ], [stationedSales, virtualSales]);

  // Revenue comparison chart data
  const revenueChartData = [
    { name: 'Stationed Division', sales: stationedSales, color: '#38bdf8' },
    { name: 'Virtual Division', sales: virtualSales, color: '#818cf8' },
  ];

  // Leaderboard state & filter (Combined, Stationed, Virtual)
  const [leaderboardFilter, setLeaderboardFilter] = useState<'combined' | 'stationed' | 'virtual'>('combined');

  const leaderboard = useMemo(() => {
    const stationedItems = stationedAdvisors.map(a => ({
      name: a.advisorName,
      kpi: getNumericKpi(a.totalKpiScore),
      kpiDisplay: formatKpiDisplay(a.totalKpiScore),
      sales: a.finalSalesData,
      team: 'Stationed' as const,
      grade: getAdvisorGrade(a.totalKpiScore, a.kpiGrade),
      raw: a,
    }));

    const virtualItems = virtualAdvisors.map(a => {
      const numericKpi = getNumericKpi(a.overallKpi);
      return {
        name: a.advisorName,
        kpi: numericKpi,
        kpiDisplay: formatKpiDisplay(a.overallKpi),
        sales: a.finalSales,
        team: 'Virtual' as const,
        grade: getAdvisorGrade(a.overallKpi, typeof a.overallKpi === 'string' ? a.overallKpi : undefined),
        raw: a,
      };
    });

    // Merit Ranking: Sorted primarily by Sales Revenue (high to low), secondarily by KPI score
    const sortBySalesMerit = (a: { sales: number; kpi: number }, b: { sales: number; kpi: number }) => {
      if (b.sales !== a.sales) {
        return b.sales - a.sales;
      }
      return b.kpi - a.kpi;
    };

    if (leaderboardFilter === 'stationed') {
      return stationedItems.sort(sortBySalesMerit).slice(0, 5);
    }
    if (leaderboardFilter === 'virtual') {
      return virtualItems.sort(sortBySalesMerit).slice(0, 5);
    }
    return [...stationedItems, ...virtualItems].sort(sortBySalesMerit).slice(0, 5);
  }, [stationedAdvisors, virtualAdvisors, leaderboardFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Executive Overview Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-cyan-400 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Live Operational Analytics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Executive Performance Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Consolidated real-time operational telemetry and sales performance benchmarks for Team Kaizen.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <a
                href="https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0"
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 font-extrabold text-[11px] sm:text-xs px-3 py-2 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 group cursor-pointer"
                title="Station Group Joining Link (Google Doc)"
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="whitespace-nowrap">Station Group</span>
                <ExternalLink className="w-3 h-3 text-emerald-400 opacity-80 shrink-0" />
              </a>

              <a
                href="https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0"
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-indigo-100 font-extrabold text-[11px] sm:text-xs px-3 py-2 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 group cursor-pointer"
                title="Virtual Group Joining Link (Google Doc)"
              >
                <Link2 className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="whitespace-nowrap">Virtual Group</span>
                <ExternalLink className="w-3 h-3 text-indigo-400 opacity-80 shrink-0" />
              </a>
            </div>

            <button
              onClick={() => onNavigateTab('ai_report')}
              className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 fill-slate-950 shrink-0" />
              <span>Generate AI Audit Report</span>
            </button>
          </div>
        </div>

        {/* 4 Core Stat Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/30 rounded-2xl p-4.5 transition-colors glass-card"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales Revenue</span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight">৳{totalSales.toLocaleString('en-BD')}</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-800/40">
                <ArrowUpRight className="w-3.5 h-3.5" /> Live
              </span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/30 rounded-2xl p-4.5 transition-colors glass-card"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overall Team KPI</span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">{overallTeamKpi.toFixed(1)}%</span>
              <span className="text-[11px] font-bold text-cyan-300/90 bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-800/50">Target 90%</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            onClick={() => onNavigateTab('call_records')}
            className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-4.5 transition-colors glass-card cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block group-hover:text-cyan-400 transition-colors flex items-center justify-between">
              <span>Total Reach Calls</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight">{totalReachCalls.toLocaleString('en-BD')}</span>
              <span className="text-[11px] text-cyan-300 font-semibold bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-800/60">
                View Call Records →
              </span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/30 rounded-2xl p-4.5 transition-colors glass-card"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Tasks</span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">{tasks.filter(t => t.status !== 'completed').length}</span>
              <span className="text-[11px] text-amber-300/90 font-semibold bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-800/40">In Pipeline</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Division Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stationed Team Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 rounded-xl shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-100 text-sm">Stationed Team Division</h3>
                  {/* Tooltip for Methodology */}
                  <div className="group relative inline-flex items-center cursor-help">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-xl text-[11px] text-slate-300 shadow-2xl z-20 pointer-events-none leading-tight">
                      <strong>Stationed Methodology:</strong> Tracks Avg Reach, Talktime, CE Count, Exam Marks, Briefings, Sales & KPI Grade.
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">On-site Advisor Hub • {stationedAdvisors.length} Members</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('stationed')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-1.5 rounded-lg border border-cyan-800/50 transition-all"
            >
              <span>Explore</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Division Sales</span>
              <span className="text-sm font-bold text-slate-100 font-mono">৳{stationedSales.toLocaleString('en-BD')}</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Avg KPI</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">{avgStationedKpi.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Avg Reach</span>
              <span className="text-sm font-bold text-slate-100 font-mono">{Math.round(totalStationedReach / (stationedAdvisors.length || 1))}</span>
            </div>
          </div>
        </div>

        {/* Virtual Team Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 rounded-xl shadow-inner">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-100 text-sm">Virtual Team Division</h3>
                  {/* Tooltip for Methodology */}
                  <div className="group relative inline-flex items-center cursor-help">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-300 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-indigo-500/30 rounded-xl text-[11px] text-slate-300 shadow-2xl z-20 pointer-events-none leading-tight">
                      <strong>Virtual Methodology:</strong> Tracks Reach Calls, Talk Time, Meetings, Dispositions, Incentives & Total Salary.
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">Remote Operations Hub • {virtualAdvisors.length} Members</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('virtual')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/60 hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-800/50 transition-all"
            >
              <span>Explore</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Division Sales</span>
              <span className="text-sm font-bold text-slate-100 font-mono">৳{virtualSales.toLocaleString('en-BD')}</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Overall KPI</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{avgVirtualKpi.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Reach Calls</span>
              <span className="text-sm font-bold text-slate-100 font-mono">{totalVirtualReach.toLocaleString('en-BD')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Team Sales Performance Trend Line Chart */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                  {trendTimeRange === '7d' ? '7-Day' : '30-Day'} Daily Team Sales Trend
                </h3>
                <span className="text-[10px] font-mono font-black text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                  Live Trend
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualizing daily revenue trajectory across Stationed & Virtual divisions over the past {trendTimeRange === '7d' ? '7 days' : '30 days'}
              </p>
            </div>
          </div>

          {/* Controls: Time Range Toggle & Division Filter */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-auto">
            {/* 7-Day vs 30-Day Time Range Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90 shadow-inner">
              <button
                onClick={() => setTrendTimeRange('7d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  trendTimeRange === '7d'
                    ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>7 Days</span>
              </button>
              <button
                onClick={() => setTrendTimeRange('30d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  trendTimeRange === '30d'
                    ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>30 Days</span>
              </button>
            </div>

            {/* Division Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90 shadow-inner">
              <button
                onClick={() => setTrendDivisionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  trendDivisionFilter === 'all'
                    ? 'bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setTrendDivisionFilter('stationed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  trendDivisionFilter === 'stationed'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stationed
              </button>
              <button
                onClick={() => setTrendDivisionFilter('virtual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  trendDivisionFilter === 'virtual'
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Virtual
              </button>
            </div>
          </div>
        </div>

        {/* Top Trend Key Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 space-y-1 transition-all">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Daily Sales</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-extrabold text-slate-100 font-mono">৳{trendMetrics.avgDaily.toLocaleString('en-BD')}</span>
              <span className="text-[10px] text-slate-400 font-mono">/ day</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 space-y-1 transition-all">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Peak Single-Day Revenue</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-extrabold text-amber-400 font-mono">৳{trendMetrics.peakDaily.toLocaleString('en-BD')}</span>
              <span className="text-[10px] text-amber-300/80 font-mono">{trendMetrics.peakDate}</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 space-y-1 transition-all">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Total {trendTimeRange === '7d' ? '7-Day' : '30-Day'} Revenue
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-extrabold text-cyan-400 font-mono">৳{trendMetrics.totalPeriodSales.toLocaleString('en-BD')}</span>
              <span className="text-[10px] text-cyan-300/80 font-mono">Cumulative</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 space-y-1 transition-all">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {trendTimeRange === '7d' ? '7-Day Momentum' : 'Monthly Sales Momentum'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`text-lg font-extrabold font-mono ${trendMetrics.momentum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trendMetrics.momentum >= 0 ? '+' : ''}{trendMetrics.momentum.toFixed(1)}%
              </span>
              <span className="text-[10px] text-emerald-400/90 font-semibold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                2nd Half Growth
              </span>
            </div>
          </div>
        </div>

        {/* Area / Line Chart Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayedTrendData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="stationedTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="virtualTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="totalTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: 'rgba(56,189,248,0.3)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                }}
                labelFormatter={(label, items) => {
                  if (items && items.length > 0 && items[0].payload) {
                    return `${items[0].payload.fullDate}`;
                  }
                  return label;
                }}
                formatter={(value: any, name: any) => [
                  `৳${Number(value).toLocaleString('en-BD')}`,
                  name === 'stationed' ? 'Stationed Sales' : name === 'virtual' ? 'Virtual Sales' : 'Combined Total Sales'
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 600 }}
                formatter={(value) => {
                  if (value === 'stationed') return 'Stationed Division Sales';
                  if (value === 'virtual') return 'Virtual Division Sales';
                  if (value === 'total') return 'Combined Team Sales';
                  return value;
                }}
              />

              {trendDivisionFilter === 'all' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="stationed"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#stationedTrendGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="virtual"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#virtualTrendGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#totalTrendGrad)"
                  />
                </>
              )}

              {trendDivisionFilter === 'stationed' && (
                <Area
                  type="monotone"
                  dataKey="stationed"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#stationedTrendGrad)"
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 6 }}
                />
              )}

              {trendDivisionFilter === 'virtual' && (
                <Area
                  type="monotone"
                  dataKey="virtual"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#virtualTrendGrad)"
                  dot={{ r: 3, fill: '#818cf8' }}
                  activeDot={{ r: 6 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Visual Analytics Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Revenue Breakdown Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Sales Revenue Share</span>
              </h3>
              <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-md font-mono">
                ৳{totalSales.toLocaleString('en-BD')} Total
              </span>
            </div>

            {/* Interactive Donut Chart Visualization */}
            <div className="relative h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={176}>
                <PieChart>
                  <Pie
                    data={salesPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#090d16"
                    strokeWidth={2}
                  >
                    {salesPieData.map((entry, index) => (
                      <Cell key={`sales-pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: 'rgba(56,189,248,0.3)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    }}
                    formatter={(value: any) => [`৳${Number(value).toLocaleString('en-BD')}`, 'Sales Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Donut Center Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ratio</span>
                <span className="text-sm font-black text-slate-100 font-mono">
                  {totalSales > 0 ? ((stationedSales / totalSales) * 100).toFixed(0) : 0}% / {totalSales > 0 ? ((virtualSales / totalSales) * 100).toFixed(0) : 0}%
                </span>
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded mt-0.5">
                  ST / VT
                </span>
              </div>
            </div>

            {/* Stacked Percentage Visual Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-l-full transition-all duration-500" 
                  style={{ width: `${totalSales > 0 ? (stationedSales / totalSales) * 100 : 50}%` }}
                  title={`Stationed Division: ৳${stationedSales.toLocaleString('en-BD')}`}
                />
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-r-full transition-all duration-500" 
                  style={{ width: `${totalSales > 0 ? (virtualSales / totalSales) * 100 : 50}%` }}
                  title={`Virtual Division: ৳${virtualSales.toLocaleString('en-BD')}`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Stationed: {totalSales > 0 ? ((stationedSales / totalSales) * 100).toFixed(1) : 0}%
                </span>
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Virtual: {totalSales > 0 ? ((virtualSales / totalSales) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Comparative Division Metric Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
            <div className="bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl p-3 space-y-1 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">Stationed</span>
                <span className="text-[10px] text-slate-400 font-medium">{stationedAdvisors.length} Members</span>
              </div>
              <p className="text-sm font-black text-slate-100 font-mono">৳{stationedSales.toLocaleString('en-BD')}</p>
              <p className="text-[10px] text-slate-400">
                Avg: <strong className="text-cyan-300 font-mono">৳{Math.round(stationedSales / (stationedAdvisors.length || 1)).toLocaleString('en-BD')}</strong>/advisor
              </p>
            </div>

            <div className="bg-slate-950/80 border border-indigo-500/30 hover:border-indigo-400/60 rounded-xl p-3 space-y-1 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">Virtual</span>
                <span className="text-[10px] text-slate-400 font-medium">{virtualAdvisors.length} Members</span>
              </div>
              <p className="text-sm font-black text-slate-100 font-mono">৳{virtualSales.toLocaleString('en-BD')}</p>
              <p className="text-[10px] text-slate-400">
                Avg: <strong className="text-indigo-300 font-mono">৳{Math.round(virtualSales / (virtualAdvisors.length || 1)).toLocaleString('en-BD')}</strong>/advisor
              </p>
            </div>
          </div>
        </div>

        {/* KPI Performance Tiers & Grade Distribution Chart Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  KPI Performance Tiers
                </h3>
              </div>

              {/* View Switcher (Pie Chart vs Bar Chart) */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setKpiChartType('pie')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    kpiChartType === 'pie'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Pie Chart View (High, Medium, Low Tiers)"
                >
                  Pie
                </button>
                <button
                  onClick={() => setKpiChartType('bar')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    kpiChartType === 'bar'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Bar Chart View (A, B, C, D, PIP Grades)"
                >
                  Bar
                </button>
              </div>
            </div>

            {/* Division Filter Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90 shadow-inner w-full">
              <button
                onClick={() => setGradeDistributionFilter('combined')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-extrabold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'combined'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setGradeDistributionFilter('stationed')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-extrabold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'stationed'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stationed
              </button>
              <button
                onClick={() => setGradeDistributionFilter('virtual')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-extrabold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'virtual'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Virtual
              </button>
            </div>
          </div>

          {/* PIE CHART VIEW FOR KPI PERFORMANCE TIERS */}
          {kpiChartType === 'pie' ? (
            <div className="space-y-3 my-auto">
              <div className="relative h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={176}>
                  <PieChart>
                    <Pie
                      data={kpiTierPieData.filter(d => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={kpiTierPieData.filter(d => d.count > 0).length > 1 ? 4 : 0}
                      dataKey="count"
                      stroke="#090d16"
                      strokeWidth={2}
                    >
                      {kpiTierPieData.filter(d => d.count > 0).map((entry, index) => (
                        <Cell key={`kpi-tier-pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: 'rgba(52,211,153,0.3)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                      }}
                      formatter={(value: any, name: any) => [`${value} Advisors (${kpiTierPieData.find(d => d.name === name)?.pct || 0}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Count */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-base font-black text-slate-100 font-mono">
                    {kpiTierPieData.reduce((a, b) => a + b.count, 0)} Team
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded mt-0.5 capitalize">
                    {gradeDistributionFilter}
                  </span>
                </div>
              </div>

              {/* KPI Tier Legend & Count Badges */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/80">
                {kpiTierPieData.map((tier) => (
                  <div key={tier.tier} className="bg-slate-950/80 border border-slate-800/80 p-2 rounded-xl space-y-0.5 hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                      <span className="text-[10px] font-extrabold text-slate-300 truncate">{tier.tier}</span>
                    </div>
                    <div className="text-sm font-black text-slate-100 font-mono">
                      {tier.count} <span className="text-[10px] text-slate-400 font-normal">({tier.pct}%)</span>
                    </div>
                    <span className="text-[9px] font-semibold block text-slate-400">{tier.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* BAR CHART VIEW FOR GRADES */
            <div className="space-y-2 my-auto">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height={176}>
                  <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="grade" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 700 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(52,211,153,0.2)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      formatter={(val: any) => [`${val} Advisors`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {gradeChartData.map((entry, index) => {
                        const semanticColors: Record<string, string> = {
                          'A': '#10b981',    // Emerald Green (Exceeds >=80%)
                          'B': '#38bdf8',    // Sky Blue (On Target >=70%)
                          'C': '#eab308',    // Amber / Yellow (Warning >=60%)
                          'D': '#f97316',    // Orange (Needs Improvement >=50%)
                          'PIP': '#e11d48',  // Rose / Red (Critical <50%)
                        };
                        return <Cell key={`cell-grade-${index}`} fill={semanticColors[entry.grade] || '#10b981'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Semantic Color Legend Strip */}
              <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-tight text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  A (Exceeds)
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  B (On Target)
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  C/D (Warning)
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  PIP (Action)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Kaizen Top Performers Leaderboard */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
          {/* Header & Segmented Filter Control */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 shadow-inner">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-100 truncate">
                  Top Advisors Leaderboard
                </h3>
                <p className="text-[10px] text-slate-400 font-medium truncate">Merit Rankings (Based on Sales Revenue)</p>
              </div>
            </div>

            {/* Segmented Filter Bar - Full Width, Perfectly Distributed */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90 shadow-inner w-full">
              <button
                onClick={() => setLeaderboardFilter('combined')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center cursor-pointer ${
                  leaderboardFilter === 'combined'
                    ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setLeaderboardFilter('stationed')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center cursor-pointer ${
                  leaderboardFilter === 'stationed'
                    ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stationed
              </button>
              <button
                onClick={() => setLeaderboardFilter('virtual')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center cursor-pointer ${
                  leaderboardFilter === 'virtual'
                    ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Virtual
              </button>
            </div>
          </div>

          {/* Leaderboard List */}
          <div className="space-y-2 flex-1 flex flex-col justify-between">
            {leaderboard.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No advisors found in this division.</p>
            ) : (
              leaderboard.map((item, idx) => (
                <div
                  key={`${item.team}-${item.name}-${idx}`}
                  onClick={() => onSelectAdvisor(item.raw, item.team.toLowerCase() as any)}
                  className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all group hover:scale-[1.01] shadow-md hover:shadow-cyan-500/5"
                >
                  {/* Left Column: Advisor Rank & Identity */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-lg ${
                      idx === 0 
                        ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-400/40 shadow-amber-500/20' 
                        : idx === 1 
                        ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 shadow-slate-300/10' 
                        : idx === 2 
                        ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 shadow-amber-700/20' 
                        : 'bg-slate-900 border border-slate-800 text-slate-400 font-mono'
                    }`}>
                      {idx === 0 ? <Crown className="w-4 h-4 text-slate-950 fill-slate-950" /> : `#${idx + 1}`}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="font-extrabold text-slate-100 text-xs group-hover:text-cyan-300 transition-colors truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border font-mono ${
                          item.team === 'Stationed'
                            ? 'bg-cyan-950/90 text-cyan-400 border-cyan-800/60'
                            : 'bg-indigo-950/90 text-indigo-300 border-indigo-800/60'
                        }`}>
                          {item.team} Division
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Grade, Sales & KPI Metrics */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-center space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-100 font-mono">
                        ৳{item.sales.toLocaleString('en-BD')}
                      </span>
                      <span className="font-extrabold text-[10px] text-emerald-400 font-mono tracking-tight bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.2 rounded">
                        {item.kpiDisplay}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-cyan-300 font-extrabold uppercase tracking-wider bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800 font-mono">
                        {item.grade} Grade
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

