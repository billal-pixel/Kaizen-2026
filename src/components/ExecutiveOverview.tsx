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
  Cell 
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
  Info
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

  // Grade Distribution Filter State (Combined, Stationed, Virtual)
  const [gradeDistributionFilter, setGradeDistributionFilter] = useState<'combined' | 'stationed' | 'virtual'>('combined');

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

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('ai_report')}
              className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95"
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

      {/* Visual Analytics Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Revenue Breakdown Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col">
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
          <div className="relative h-44 w-full flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
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
            </div>
          </div>

          {/* Stacked Percentage Visual Bar */}
          <div className="space-y-2">
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

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
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

          {/* Comparative Division Metric Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2 mt-auto">
            <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Stationed</span>
                <span className="text-[10px] text-slate-400 font-medium">{stationedAdvisors.length} Members</span>
              </div>
              <p className="text-sm font-black text-slate-100 font-mono">৳{stationedSales.toLocaleString('en-BD')}</p>
              <p className="text-[10px] text-slate-400">
                Avg: <strong className="text-slate-200 font-mono">৳{Math.round(stationedSales / (stationedAdvisors.length || 1)).toLocaleString('en-BD')}</strong>/advisor
              </p>
            </div>

            <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Virtual</span>
                <span className="text-[10px] text-slate-400 font-medium">{virtualAdvisors.length} Members</span>
              </div>
              <p className="text-sm font-black text-slate-100 font-mono">৳{virtualSales.toLocaleString('en-BD')}</p>
              <p className="text-[10px] text-slate-400">
                Avg: <strong className="text-slate-200 font-mono">৳{Math.round(virtualSales / (virtualAdvisors.length || 1)).toLocaleString('en-BD')}</strong>/advisor
              </p>
            </div>
          </div>
        </div>

        {/* KPI Grade Distribution Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Grade Distribution
                </h3>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90 shadow-inner w-full">
              <button
                onClick={() => setGradeDistributionFilter('combined')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-extrabold transition-all text-center ${
                  gradeDistributionFilter === 'combined'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setGradeDistributionFilter('stationed')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-extrabold transition-all text-center ${
                  gradeDistributionFilter === 'stationed'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stationed
              </button>
              <button
                onClick={() => setGradeDistributionFilter('virtual')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-extrabold transition-all text-center ${
                  gradeDistributionFilter === 'virtual'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Virtual
              </button>
            </div>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
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
          <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-tight text-slate-400 pt-1 border-t border-slate-800/60">
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

        {/* Kaizen Top Performers Leaderboard */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
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
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center ${
                  leaderboardFilter === 'combined'
                    ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setLeaderboardFilter('stationed')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center ${
                  leaderboardFilter === 'stationed'
                    ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stationed
              </button>
              <button
                onClick={() => setLeaderboardFilter('virtual')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all text-center ${
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
          <div className="space-y-2.5">
            {leaderboard.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No advisors found in this division.</p>
            ) : (
              leaderboard.map((item, idx) => (
                <div
                  key={`${item.team}-${item.name}-${idx}`}
                  onClick={() => onSelectAdvisor(item.raw, item.team.toLowerCase() as any)}
                  className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all group hover:scale-[1.01] shadow-md hover:shadow-cyan-500/5"
                >
                  {/* Left Column: Advisor Rank & Identity */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-lg ${
                      idx === 0 
                        ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-400/40 shadow-amber-500/20' 
                        : idx === 1 
                        ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 shadow-slate-300/10' 
                        : idx === 2 
                        ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 shadow-amber-700/20' 
                        : 'bg-slate-900 border border-slate-800 text-slate-400 font-mono'
                    }`}>
                      {idx === 0 ? <Crown className="w-4.5 h-4.5 text-slate-950 fill-slate-950" /> : `#${idx + 1}`}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="font-extrabold text-slate-100 text-xs sm:text-sm group-hover:text-cyan-300 transition-colors truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border font-mono ${
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
                  <div className="text-right shrink-0 flex flex-col items-end justify-center space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-100 font-mono">
                        ৳{item.sales.toLocaleString('en-BD')}
                      </span>
                      <span className="font-extrabold text-xs text-emerald-400 font-mono tracking-tight bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                        {item.kpiDisplay}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-cyan-300 font-extrabold uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 font-mono">
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

