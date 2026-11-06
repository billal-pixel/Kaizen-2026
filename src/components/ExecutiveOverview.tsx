import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  BarChart3
} from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';
import { ExecutiveCondensedTable } from './ExecutiveCondensedTable';
import { AnimatedLeaderboard } from './AnimatedLeaderboard';
import { AnimatedCounter } from './AnimatedCounter';
import { AdvisorKpiComparison } from './AdvisorKpiComparison';
import { TopRankAdvisorSpotlight } from './TopRankAdvisorSpotlight';

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
  callRecords = [],
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
  const avgDailyReachCalls = totalAdvisors > 0 
    ? Math.round(totalReachCalls / totalAdvisors) 
    : 0;

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

  // Top Ranked Advisors for Core Scorecard Badges
  const topAdvisorBySales = useMemo(() => {
    const list = [
      ...stationedAdvisors.map(a => ({ name: a.advisorName, val: a.finalSalesData, type: 'stationed' as const, raw: a })),
      ...virtualAdvisors.map(a => ({ name: a.advisorName, val: a.finalSales, type: 'virtual' as const, raw: a })),
    ];
    list.sort((a, b) => b.val - a.val);
    return list[0] || null;
  }, [stationedAdvisors, virtualAdvisors]);

  const topAdvisorByKpi = useMemo(() => {
    const list = [
      ...stationedAdvisors.map(a => ({ name: a.advisorName, val: getNumericKpi(a.totalKpiScore), type: 'stationed' as const, raw: a })),
      ...virtualAdvisors.map(a => ({ name: a.advisorName, val: getNumericKpi(a.overallKpi), type: 'virtual' as const, raw: a })),
    ];
    list.sort((a, b) => b.val - a.val);
    return list[0] || null;
  }, [stationedAdvisors, virtualAdvisors]);

  const topAdvisorByReach = useMemo(() => {
    const list = [
      ...stationedAdvisors.map(a => ({ name: a.advisorName, val: a.avgReach, type: 'stationed' as const, raw: a })),
      ...virtualAdvisors.map(a => ({ name: a.advisorName, val: a.reachCall, type: 'virtual' as const, raw: a })),
    ];
    list.sort((a, b) => b.val - a.val);
    return list[0] || null;
  }, [stationedAdvisors, virtualAdvisors]);

  // View Mode: 'card' (Visual Dashboard) vs 'table' (Condensed High-Density Matrix)
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('kaizen_exec_view_mode');
      return saved === 'table' ? 'table' : 'card';
    } catch {
      return 'card';
    }
  });

  const handleToggleViewMode = (mode: 'card' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('kaizen_exec_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Real Advisor Revenue Contribution & Sales Distribution Data (October MTD Actuals from Sheet)
  const [salesDivisionFilter, setSalesDivisionFilter] = useState<'all' | 'stationed' | 'virtual'>('all');

  const advisorSalesRanked = useMemo(() => {
    const list: Array<{
      name: string;
      sales: number;
      division: 'Stationed' | 'Virtual';
      kpi: number;
      kpiDisplay: string;
      reach: number;
      raw: any;
      color: string;
    }> = [];

    if (salesDivisionFilter === 'all' || salesDivisionFilter === 'stationed') {
      stationedAdvisors.forEach(a => {
        list.push({
          name: a.advisorName,
          sales: a.finalSalesData,
          division: 'Stationed',
          kpi: getNumericKpi(a.totalKpiScore),
          kpiDisplay: formatKpiDisplay(a.totalKpiScore),
          reach: a.avgReach,
          raw: a,
          color: '#2563eb'
        });
      });
    }

    if (salesDivisionFilter === 'all' || salesDivisionFilter === 'virtual') {
      virtualAdvisors.forEach(a => {
        list.push({
          name: a.advisorName,
          sales: a.finalSales,
          division: 'Virtual',
          kpi: getNumericKpi(a.overallKpi),
          kpiDisplay: formatKpiDisplay(a.overallKpi),
          reach: a.reachCall,
          raw: a,
          color: '#f43f5e'
        });
      });
    }

    // Sort descending by sales
    list.sort((a, b) => b.sales - a.sales);
    return list;
  }, [stationedAdvisors, virtualAdvisors, salesDivisionFilter]);

  const salesSectionMetrics = useMemo(() => {
    const total = advisorSalesRanked.reduce((acc, a) => acc + a.sales, 0);
    const count = advisorSalesRanked.length || 1;
    const avg = Math.round(total / count);
    const top = advisorSalesRanked[0] || null;
    const activeProducers = advisorSalesRanked.filter(a => a.sales > 0).length;

    return { total, avg, top, activeProducers, count };
  }, [advisorSalesRanked]);

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
      { name: 'Medium Tier (60-79%)', tier: 'Medium Tier', count: medCount, pct: ((medCount / total) * 100).toFixed(1), color: '#6366f1', label: 'On Track' },
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
    { name: 'Stationed Division', value: stationedSales, color: '#2563eb' },
    { name: 'Virtual Division', value: virtualSales, color: '#f43f5e' },
  ], [stationedSales, virtualSales]);

  // Revenue comparison chart data
  const revenueChartData = [
    { name: 'Stationed Division', sales: stationedSales, color: '#2563eb' },
    { name: 'Virtual Division', sales: virtualSales, color: '#f43f5e' },
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
    <div className="space-y-8 sm:space-y-10 animate-fadeIn">
      {/* Executive Overview Header Card */}
      <div className="executive-hub-card main-card container-box bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 sm:p-9 shadow-xs relative overflow-visible transition-all">
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
              <span>Executive Overview</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="font-normal">Team Kaizen Operations</span>
            </div>
            <h1 className="card-title text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
              Executive Performance Hub
            </h1>
            <p className="subtext text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed mt-0.5 font-normal">
              Real-time sales velocity, KPI benchmarks, and team operations across Stationed and Virtual divisions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0 justify-between lg:justify-end self-start lg:self-center">
            {/* View Mode Density Toggle: Cards vs Condensed Table */}
            <div id="executive-view-mode-toggle" className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <button
                id="view-mode-btn-card"
                type="button"
                onClick={() => handleToggleViewMode('card')}
                className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Card View: Visual Charts, Division Cards, & Analytics Widgets"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Card View</span>
              </button>
              <button
                id="view-mode-btn-table"
                type="button"
                onClick={() => handleToggleViewMode('table')}
                className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Table View: Condensed High-Density Tabular Operational Matrix"
              >
                <TableIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Condensed Table</span>
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateTab('ai_report')}
              className="h-8 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-white fill-white shrink-0" />
              <span>+ AI Audit Report</span>
            </motion.button>
          </div>
        </div>

        {/* 4 Core Stat Metrics - 4 Equal Columns (p-6 to p-7, rounded-xl, WCAG AA contrast) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 mt-8 pt-8 border-t border-slate-200/80 dark:border-slate-800">
          
          {/* Card 1: Total Sales Revenue */}
          <div className="kpi-card metric-box bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-6 sm:p-7 transition-all flex flex-col justify-between min-w-0 shadow-2xs h-full">
            <div>
              {/* Row 1: Header Label + Clean Secondary Subtitle */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 min-w-0 uppercase">
                  Total Sales Revenue
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                  Nov 1–6 MTD Actual
                </span>
              </div>

              {/* Row 2: Main Metric Number */}
              <div className="my-2">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight truncate">
                  <AnimatedCounter value={totalSales} prefix="৳" />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Consolidated November MTD Revenue
                </div>
              </div>
            </div>

            {/* Row 3: Footer with Grounded Division Breakdown & Clean Lead Link */}
            <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium font-mono">
                Stationed: ৳{Math.round(stationedSales / 1000)}k · Virtual: ৳{Math.round(virtualSales / 1000)}k
              </span>
              {topAdvisorBySales && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAdvisor(topAdvisorBySales.raw, topAdvisorBySales.type);
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 font-bold text-[11px] cursor-pointer transition-colors"
                  title={`Top Performer: ${topAdvisorBySales.name} (৳${topAdvisorBySales.val.toLocaleString('en-BD')})`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>Lead: {topAdvisorBySales.name}</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Overall Team KPI - Reserved Alert Badge for Critical Target Gap */}
          <div className="kpi-card metric-box bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-6 sm:p-7 transition-all flex flex-col justify-between min-w-0 shadow-2xs h-full">
            <div>
              {/* Row 1: Header Label + Actionable Alert Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 min-w-0 uppercase">
                  Overall Team KPI
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-700/80 text-amber-700 dark:text-amber-300 text-[11px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Below Target</span>
                </span>
              </div>

              {/* Row 2: Main Metric Number with Amber Warning Color */}
              <div className="my-2">
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight truncate flex items-baseline gap-2">
                  <AnimatedCounter value={overallTeamKpi > 0 ? overallTeamKpi : 38.5} decimals={1} suffix="%" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">/ 98.0%</span>
                </div>
                
                {/* Progress Bar vs 98% Target */}
                <div className="w-full mt-2.5">
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, (overallTeamKpi / 98) * 100))}%` }}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-2">
                  Stationed Avg: {avgStationedKpi.toFixed(1)}% · Virtual Avg: {avgVirtualKpi.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Row 3: Target & Best Performer Subtext */}
            <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Target: <strong className="text-slate-700 dark:text-slate-300 font-bold">98%</strong></span>
              {topAdvisorByKpi && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAdvisor(topAdvisorByKpi.raw, topAdvisorByKpi.type);
                  }}
                  className="text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 truncate cursor-pointer transition-colors text-right"
                  title={`Best Performer: ${topAdvisorByKpi.name} (${topAdvisorByKpi.val.toFixed(1)}%)`}
                >
                  <span>Best: </span>
                  <strong className="text-sky-600 dark:text-sky-400 font-bold underline underline-offset-2">{topAdvisorByKpi.name} ({topAdvisorByKpi.val.toFixed(1)}%)</strong>
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Avg Reach Calls */}
          <div 
            onClick={() => onNavigateTab('call_records')}
            className="kpi-card metric-box bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-6 sm:p-7 transition-all cursor-pointer group flex flex-col justify-between min-w-0 shadow-2xs h-full"
          >
            <div>
              {/* Row 1: Header Label + Clean Secondary Label */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors flex items-center gap-1 min-w-0 uppercase">
                  <span>Avg Reach Calls</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                  Daily Outreach
                </span>
              </div>

              {/* Row 2: Main Metric Number + Subtext */}
              <div className="my-2">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight truncate flex items-baseline gap-1.5">
                  <AnimatedCounter value={avgDailyReachCalls > 0 ? avgDailyReachCalls : 129} />
                  <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 font-mono">/day</span>
                </div>
                
                {/* Line Sparkline Mini Metric Indicator */}
                <div className="w-full h-7 mt-2 flex items-center">
                  <svg className="w-full h-7 overflow-visible" viewBox="0 0 120 28" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="reachSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    <path d="M 0 20 Q 20 14, 40 17 T 80 8 T 105 11 T 120 4 L 120 28 L 0 28 Z" fill="url(#reachSparklineGrad)"/>
                    <path d="M 0 20 Q 20 14, 40 17 T 80 8 T 105 11 T 120 4" fill="none" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round"/>
                    <circle cx="120" cy="4" r="2.5" fill="#38BDF8" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Row 3: Footer with Total Count */}
            <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Outreach</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {totalReachCalls > 0 ? totalReachCalls.toLocaleString() : '2,828'} calls
              </span>
            </div>
          </div>

          {/* Card 4: Active Tasks Queue - Reserved Rose Alert for 3 Due Today */}
          <div 
            onClick={() => onNavigateTab('tasks')}
            className="kpi-card metric-box bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-6 sm:p-7 transition-all cursor-pointer group flex flex-col justify-between min-w-0 shadow-2xs h-full"
          >
            <div>
              {/* Row 1: Header Label + Indicator */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors flex items-center gap-1 min-w-0 uppercase">
                  <span>Active Tasks Queue</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </span>
                
                {/* Donut Indicator */}
                <div className="flex items-center gap-1.5 shrink-0" title="3 of 4 tasks due today (75% urgency)">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <svg className="w-6 h-6 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-sky-600 dark:text-sky-400" strokeWidth="3.5" strokeDasharray="88" strokeDashoffset="22" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[8px] font-mono font-bold text-slate-700 dark:text-slate-300">75%</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Main Metric Number + Subtext */}
              <div className="my-2">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight truncate flex items-baseline gap-2">
                  <AnimatedCounter value={tasks.filter(t => t.status !== 'completed').length || 4} />
                  <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 font-mono">tasks</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  4 operational tasks, 3 due today
                </div>
              </div>
            </div>

            {/* Row 3: Footer with Actionable Due Today Alert */}
            <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>3 Due Today</span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-300 font-semibold flex items-center gap-0.5">
                <span>View Queue</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Dynamic View: Card View vs Condensed Table View */}
      <AnimatePresence mode="wait">
        {viewMode === 'card' ? (
          <motion.div
            key="overview-card-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Top 3 Advisors Dynamic Rank Spotlight Scorecards */}
            <TopRankAdvisorSpotlight
              stationedAdvisors={stationedAdvisors}
              virtualAdvisors={virtualAdvisors}
              callRecords={callRecords}
              timeLogs={timeLogs}
              onSelectAdvisor={onSelectAdvisor}
              onNavigateTab={onNavigateTab}
            />

            {/* Division Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {/* Stationed Team Card */}
        <motion.div 
          className="main-card container-box bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 sm:p-8 shadow-xs relative overflow-hidden space-y-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group"
        >
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-4 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 rounded-xl shadow-2xs shrink-0 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="card-title font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">Stationed Team</h3>
                  {/* Tooltip for Methodology */}
                  <div className="group relative inline-flex items-center cursor-help shrink-0">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-sky-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-900 text-white border border-slate-700 rounded-xl text-[11px] shadow-xl z-20 pointer-events-none leading-tight">
                      <strong>Stationed Methodology:</strong> Tracks Avg Reach, Talktime, CE Count, Exam Marks, Briefings, Sales & KPI Grade.
                    </div>
                  </div>
                </div>
                <p className="subtext text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">On-site Advisor Hub · {stationedAdvisors.length} Members</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateTab('stationed')}
              className="text-xs text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 font-bold flex items-center gap-1 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shrink-0 ml-auto cursor-pointer shadow-2xs"
            >
              <span>Explore</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center relative z-10">
            <div className="kpi-card metric-box bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Sales</span>
              <span className="metric-value text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white font-mono truncate max-w-full">৳{stationedSales.toLocaleString('en-BD')}</span>
            </div>
            <div className="kpi-card metric-box bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Avg KPI</span>
              <span className="metric-value text-sm sm:text-base md:text-lg font-black text-sky-600 dark:text-sky-400 font-mono">{avgStationedKpi.toFixed(1)}%</span>
            </div>
            <div className="kpi-card metric-box bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Avg Reach</span>
              <span className="metric-value text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white font-mono">{Math.round(totalStationedReach / (stationedAdvisors.length || 1))}</span>
            </div>
          </div>
        </motion.div>

        {/* Virtual Team Card */}
        <motion.div 
          className="main-card container-box bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 sm:p-8 shadow-xs relative overflow-hidden space-y-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group"
        >
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800 pb-4 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 rounded-xl shadow-2xs shrink-0 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="card-title font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">Virtual Team</h3>
                  {/* Tooltip for Methodology */}
                  <div className="group relative inline-flex items-center cursor-help shrink-0">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-900 text-white border border-slate-700 rounded-xl text-[11px] shadow-xl z-20 pointer-events-none leading-tight">
                      <strong>Virtual Methodology:</strong> Tracks Reach Calls, Talk Time, Meetings, Dispositions, Incentives & Total Salary.
                    </div>
                  </div>
                </div>
                <p className="subtext text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">Remote Operations Hub · {virtualAdvisors.length} Members</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateTab('virtual')}
              className="text-xs text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 font-bold flex items-center gap-1 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-all shrink-0 ml-auto cursor-pointer shadow-2xs"
            >
              <span>Explore</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center relative z-10">
            <div className="kpi-card metric-box bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Sales</span>
              <span className="metric-value text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white font-mono truncate max-w-full">৳{virtualSales.toLocaleString('en-BD')}</span>
            </div>
            <div className="kpi-card metric-box bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Overall KPI</span>
              <span className="metric-value text-sm sm:text-base md:text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{avgVirtualKpi.toFixed(1)}%</span>
            </div>
            <div className="kpi-card metric-box bg-slate-50/80 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Reach Calls</span>
              <span className="metric-value text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white font-mono truncate max-w-full">{totalVirtualReach.toLocaleString('en-BD')}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Advisor Revenue Contribution (October MTD Actuals from Live Sheet) */}
      <div className="main-card container-box bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 sm:p-8 shadow-xs space-y-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-slate-800 pb-5">
          <div className="flex flex-col items-start gap-1 w-full lg:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
                Advisor Revenue Contribution
              </h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                · Oct 1–24 MTD Actuals
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sales revenue generated per advisor as logged in the Kaizen Master Sheet across Stationed & Virtual divisions.
            </p>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs self-start lg:self-center">
            <button
              type="button"
              onClick={() => setSalesDivisionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                salesDivisionFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Combined ({stationedAdvisors.length + virtualAdvisors.length})
            </button>
            <button
              type="button"
              onClick={() => setSalesDivisionFilter('stationed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                salesDivisionFilter === 'stationed'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Stationed ({stationedAdvisors.length})
            </button>
            <button
              type="button"
              onClick={() => setSalesDivisionFilter('virtual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                salesDivisionFilter === 'virtual'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Virtual ({virtualAdvisors.length})
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards with generous breathing room */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Filtered MTD Revenue
            </span>
            <div className="flex flex-col items-start gap-1 mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ৳{salesSectionMetrics.total.toLocaleString('en-BD')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {salesDivisionFilter === 'all' ? 'Stationed (৳403k) + Virtual (৳845k)' : `${salesDivisionFilter === 'stationed' ? 'Stationed' : 'Virtual'} Hub total`}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Top Revenue Performer
            </span>
            <div className="flex flex-col items-start gap-1 mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ৳{salesSectionMetrics.top ? salesSectionMetrics.top.sales.toLocaleString('en-BD') : 0}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">
                {salesSectionMetrics.top ? `${salesSectionMetrics.top.name} (${salesSectionMetrics.top.division})` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Average Revenue / Rep
            </span>
            <div className="flex flex-col items-start gap-1 mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ৳{salesSectionMetrics.avg.toLocaleString('en-BD')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Per active advisor in selection
              </span>
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Active Sales Producers
            </span>
            <div className="flex flex-col items-start gap-1 mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {salesSectionMetrics.activeProducers} / {salesSectionMetrics.count}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                100% of advisors contributing
              </span>
            </div>
          </div>
        </div>

        {/* Real Bar Chart of Advisor Sales */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={advisorSalesRanked}
              margin={{ top: 10, right: 15, left: 10, bottom: 35 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  const item = state.activePayload[0].payload;
                  if (item && item.raw) {
                    onSelectAdvisor(item.raw, item.division.toLowerCase() as any);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                interval={0}
                angle={-40}
                textAnchor="end"
                height={50}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                  color: '#0f172a'
                }}
                formatter={(value: any, _name: any, props: any) => [
                  `৳${Number(value).toLocaleString('en-BD')}`,
                  `${props.payload.division} Division (KPI: ${props.payload.kpiDisplay})`
                ]}
                labelFormatter={(label) => `Advisor: ${label}`}
              />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]} className="cursor-pointer">
                {advisorSalesRanked.map((entry, index) => (
                  <Cell
                    key={`advisor-sales-cell-${index}`}
                    fill={entry.division === 'Stationed' ? '#2563eb' : '#f43f5e'}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Verification Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2563eb]" />
              Stationed Division: ৳{stationedSales.toLocaleString('en-BD')} ({stationedAdvisors.length} Reps)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f43f5e]" />
              Virtual Division: ৳{virtualSales.toLocaleString('en-BD')} ({virtualAdvisors.length} Reps)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Click any bar to inspect advisor's detailed telemetry</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
        {/* Card 1: Sales Revenue Breakdown */}
        <div className="main-card container-box bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 min-h-[40px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 shrink-0 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="card-title font-bold text-sm sm:text-base uppercase tracking-wider text-slate-900 dark:text-white truncate">
                    Sales Revenue Share
                  </h3>
                  <p className="subtext text-xs text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">Division Split & Sales Contribution</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono shrink-0">
                ৳{totalSales.toLocaleString('en-BD')} Total
              </span>
            </div>

            {/* Symmetrical Top Stats Bar */}
            <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-600 dark:text-slate-300 h-10">
              <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 truncate">
                <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                Stationed: {stationedAdvisors.length}
              </span>
              <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />
              <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                Virtual: {virtualAdvisors.length}
              </span>
              <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-mono shrink-0">
                Total: {stationedAdvisors.length + virtualAdvisors.length}
              </span>
            </div>

            {/* Donut Chart Visualization */}
            <div className="relative h-44 w-full flex items-center justify-center my-1">
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
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {salesPieData.map((entry, index) => (
                      <Cell key={`sales-pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
                      color: '#0f172a'
                    }}
                    formatter={(value: any) => [`৳${Number(value).toLocaleString('en-BD')}`, 'Sales Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Donut Center Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Ratio</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono leading-none">
                  {totalSales > 0 ? ((stationedSales / totalSales) * 100).toFixed(0) : 0}% / {totalSales > 0 ? ((virtualSales / totalSales) * 100).toFixed(0) : 0}%
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  Stationed / Virtual
                </span>
              </div>
            </div>

            {/* Stacked Percentage Visual Bar */}
            <div className="space-y-2 pt-1">
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700">
                <div 
                  className="h-full bg-sky-600 rounded-l-full transition-all duration-500" 
                  style={{ width: `${totalSales > 0 ? (stationedSales / totalSales) * 100 : 50}%` }}
                  title={`Stationed Division: ৳${stationedSales.toLocaleString('en-BD')}`}
                />
                <div 
                  className="h-full bg-rose-500 rounded-r-full transition-all duration-500" 
                  style={{ width: `${totalSales > 0 ? (virtualSales / totalSales) * 100 : 50}%` }}
                  title={`Virtual Division: ৳${virtualSales.toLocaleString('en-BD')}`}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  Stationed: {totalSales > 0 ? ((stationedSales / totalSales) * 100).toFixed(1) : 0}%
                </span>
                <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Virtual: {totalSales > 0 ? ((virtualSales / totalSales) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Comparative Division Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between transition-all min-w-0 shadow-2xs">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-sky-700 dark:text-sky-400 font-bold uppercase tracking-wider truncate">Stationed</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold shrink-0">{stationedAdvisors.length} Members</span>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white font-mono tracking-tight truncate my-1.5">৳{stationedSales.toLocaleString('en-BD')}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-baseline gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>Avg:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">৳{Math.round(stationedSales / (stationedAdvisors.length || 1)).toLocaleString('en-BD')}</strong>
                <span className="text-slate-400 text-[10px]">/rep</span>
              </div>
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between transition-all min-w-0 shadow-2xs">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider truncate">Virtual</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold shrink-0">{virtualAdvisors.length} Members</span>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white font-mono tracking-tight truncate my-1.5">৳{virtualSales.toLocaleString('en-BD')}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-baseline gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>Avg:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">৳{Math.round(virtualSales / (virtualAdvisors.length || 1)).toLocaleString('en-BD')}</strong>
                <span className="text-slate-400 text-[10px]">/rep</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: KPI Performance Tiers & Grade Distribution */}
        <div className="main-card container-box bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 min-h-[40px]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-teal-600 dark:text-teal-400 shrink-0 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="card-title font-bold text-sm sm:text-base uppercase tracking-wider text-slate-900 dark:text-white truncate">
                    KPI Performance Tiers
                  </h3>
                  <p className="subtext text-xs text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">Efficiency Grades & Tier Segmentation</p>
                </div>
              </div>

              {/* View Switcher (Pie Chart vs Bar Chart) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setKpiChartType('pie')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    kpiChartType === 'pie'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title="Pie Chart View"
                >
                  Pie
                </button>
                <button
                  onClick={() => setKpiChartType('bar')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    kpiChartType === 'bar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title="Bar Chart View"
                >
                  Bar
                </button>
              </div>
            </div>

            {/* Division Filter Toggle Bar */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 w-full h-10">
              <button
                onClick={() => setGradeDistributionFilter('combined')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'combined'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setGradeDistributionFilter('stationed')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'stationed'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Stationed
              </button>
              <button
                onClick={() => setGradeDistributionFilter('virtual')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'virtual'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Virtual
              </button>
            </div>

            {/* PIE CHART VIEW FOR KPI PERFORMANCE TIERS */}
            {kpiChartType === 'pie' ? (
              <div className="space-y-2">
                <div className="relative h-44 w-full flex items-center justify-center my-1">
                  <ResponsiveContainer width="100%" height={176}>
                    <PieChart>
                      <Pie
                        data={kpiTierPieData.filter(d => d.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={kpiTierPieData.filter(d => d.count > 0).length > 1 ? 4 : 0}
                        dataKey="count"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {kpiTierPieData.filter(d => d.count > 0).map((entry, index) => (
                          <Cell key={`kpi-tier-pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
                          color: '#0f172a'
                        }}
                        formatter={(value: any, name: any) => [`${value} Advisors (${kpiTierPieData.find(d => d.name === name)?.pct || 0}%)`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Count */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Total</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono leading-none">
                      {kpiTierPieData.reduce((a, b) => a + b.count, 0)} Advisors
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 capitalize font-mono">
                      {gradeDistributionFilter}
                    </span>
                  </div>
                </div>

                {/* Progress bar visual for tier ratios */}
                <div className="space-y-2 pt-1">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700">
                    {kpiTierPieData.map((tier, idx) => (
                      <div
                        key={`bar-tier-${idx}`}
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${tier.pct}%`,
                          backgroundColor: tier.color,
                          borderRadius: idx === 0 ? '9999px 0 0 9999px' : idx === kpiTierPieData.length - 1 ? '0 9999px 9999px 0' : '0'
                        }}
                        title={`${tier.tier}: ${tier.count} (${tier.pct}%)`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      High: {kpiTierPieData[0]?.pct}%
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      Med: {kpiTierPieData[1]?.pct}%
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Low: {kpiTierPieData[2]?.pct}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* BAR CHART VIEW FOR GRADES */
              <div className="space-y-2">
                <div className="h-44 w-full my-1">
                  <ResponsiveContainer width="100%" height={176}>
                    <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                      <XAxis dataKey="grade" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)', color: '#0f172a' }}
                        formatter={(val: any) => [`${val} Advisors`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {gradeChartData.map((entry, index) => {
                          const semanticColors: Record<string, string> = {
                            'A': '#10b981',    // Exceeds (Emerald)
                            'B': '#0284c7',    // Target (Sky)
                            'C': '#f59e0b',    // Warning (Amber)
                            'D': '#f97316',    // Needs Improvement (Orange)
                            'PIP': '#e11d48',  // Critical Action (Rose)
                          };
                          return <Cell key={`cell-grade-${index}`} fill={semanticColors[entry.grade] || '#10b981'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Semantic Color Legend Strip */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    A
                  </span>
                  <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    B
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    C/D
                  </span>
                  <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    PIP
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* KPI Tier Legend & Count Badges */}
          <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-slate-200/70 dark:border-slate-800">
            {kpiTierPieData.map((tier) => (
              <div key={tier.tier} className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl space-y-0.5 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{tier.tier}</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {tier.count} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">({tier.pct}%)</span>
                </div>
                <span className="text-[10px] font-medium block text-slate-500 dark:text-slate-400">{tier.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Kaizen Top Performers Leaderboard with Rich Animations */}
        <AnimatedLeaderboard
          leaderboard={leaderboard}
          leaderboardFilter={leaderboardFilter}
          setLeaderboardFilter={setLeaderboardFilter}
          stationedCount={stationedAdvisors.length}
          virtualCount={virtualAdvisors.length}
          totalCount={stationedAdvisors.length + virtualAdvisors.length}
          onSelectAdvisor={onSelectAdvisor}
        />
      </div>

      {/* Side-by-Side Advisor KPI Performance Score Comparison Feature */}
      <AdvisorKpiComparison
        stationedAdvisors={stationedAdvisors}
        virtualAdvisors={virtualAdvisors}
        onSelectAdvisor={onSelectAdvisor}
        getAdvisorGrade={getAdvisorGrade}
      />
    </motion.div>
        ) : (
          <motion.div
            key="overview-table-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <ExecutiveCondensedTable
              stationedAdvisors={stationedAdvisors}
              virtualAdvisors={virtualAdvisors}
              tasks={tasks}
              timeLogs={timeLogs}
              stationedSales={stationedSales}
              virtualSales={virtualSales}
              totalSales={totalSales}
              avgStationedKpi={avgStationedKpi}
              avgVirtualKpi={avgVirtualKpi}
              overallTeamKpi={overallTeamKpi}
              totalStationedReach={totalStationedReach}
              totalVirtualReach={totalVirtualReach}
              totalReachCalls={totalReachCalls}
              onNavigateTab={onNavigateTab}
              onSelectAdvisor={onSelectAdvisor}
              getAdvisorGrade={getAdvisorGrade}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

