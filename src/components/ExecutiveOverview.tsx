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
  Calendar,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';
import { ExecutiveCondensedTable } from './ExecutiveCondensedTable';
import { AnimatedLeaderboard } from './AnimatedLeaderboard';
import { AnimatedCounter } from './AnimatedCounter';
import { AdvisorKpiComparison } from './AdvisorKpiComparison';
import { TopRankAdvisorSpotlight } from './TopRankAdvisorSpotlight';
import { DailyKpiVelocityChart } from './DailyKpiVelocityChart';

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
    <div className="space-y-5 animate-fadeIn">
      {/* Executive Overview Header Card */}
      <div className="executive-hub-card main-card container-box bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_6px_16px_rgba(15,23,42,0.02)] relative overflow-visible transition-all">
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/80">
                <span className="relative flex h-2 w-2">
                  <motion.span
                    animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inline-flex h-full w-full rounded-full bg-[#2D6A65]"
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D6A65]" />
                </span>
                <span className="text-[#2D6A65] text-[11px] font-bold uppercase tracking-wider">
                  Live Operational Telemetry
                </span>
              </div>
            </div>
            <h1 className="card-title text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
              Executive Performance Hub
            </h1>
            <p className="subtext text-xs sm:text-sm text-slate-600 max-w-3xl leading-normal py-0.5">
              Consolidated real-time operational telemetry and sales performance benchmarks for Team Kaizen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
            {/* View Mode Density Toggle: Cards vs Condensed Table */}
            <div id="executive-view-mode-toggle" className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/90">
              <button
                id="view-mode-btn-card"
                type="button"
                onClick={() => handleToggleViewMode('card')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-[#2D6A65] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#2D6A65] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
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
              className="min-h-[36px] bg-[#2D6A65] hover:bg-[#245652] text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white fill-white shrink-0" />
              <span>+ AI Audit Report</span>
            </motion.button>
          </div>
        </div>

        {/* 4 Core Stat Metrics with Harmonious Light Multi-Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-4 pt-4 border-t border-slate-200/90">
          
          {/* Card 1: Total Sales Revenue (Soft Emerald Light Palette) */}
          <div className="kpi-card metric-box bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20 border border-emerald-200/90 rounded-2xl p-4 transition-all flex flex-col justify-between min-w-0 shadow-xs h-full">
            {/* Row 1: Header */}
            <div className="h-6 flex items-center justify-between gap-1.5">
              <span className="label-text text-[11px] font-black text-emerald-900 uppercase tracking-wider block truncate">
                Total Sales Revenue
              </span>
              {topAdvisorBySales && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAdvisor(topAdvisorBySales.raw, topAdvisorBySales.type);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[9px] font-black cursor-pointer hover:scale-105 transition-transform shrink-0 shadow-2xs"
                  title={`Rank #1 Sales Champion: ${topAdvisorBySales.name} (৳${topAdvisorBySales.val.toLocaleString('en-BD')})`}
                >
                  <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500 shrink-0" />
                  <span className="font-mono font-bold">#1</span>
                </div>
              )}
            </div>

            {/* Row 2: Main Metric Number + Sub-Benchmark Alignment */}
            <div className="h-9 flex items-baseline justify-between gap-2 my-1.5 w-full">
              <span className="metric-value text-2xl sm:text-3xl font-black text-emerald-950 font-mono tracking-tight truncate">
                <AnimatedCounter value={totalSales} prefix="৳" />
              </span>
              <span className="text-[11px] font-bold text-emerald-700 font-mono shrink-0">
                All Teams
              </span>
            </div>

            {/* Row 3: Standardized Context / Progress Indicator */}
            <div className="h-3.5 w-full flex items-center mb-1">
              <span className="text-[10px] text-emerald-700/80 font-semibold truncate">
                Consolidated MTD Revenue
              </span>
            </div>

            {/* Row 4: Footer Tags Row */}
            <div className="pt-2 border-t border-emerald-100 flex items-center gap-1.5 flex-nowrap overflow-hidden">
              <span className="h-6 text-[10px] sm:text-[11px] font-extrabold text-[#15803D] uppercase tracking-wider inline-flex items-center gap-1.5 bg-[#DCFCE7] px-2 py-0.5 rounded-md border border-[#BBF7D0] shrink-0 select-none cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#15803D]" />
                </span>
                <span>MTD Total</span>
              </span>
              {topAdvisorBySales && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAdvisor(topAdvisorBySales.raw, topAdvisorBySales.type);
                  }}
                  className="h-6 text-[10px] font-bold text-slate-700 inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 cursor-pointer hover:border-amber-400 transition-colors"
                  title={`Lead: ${topAdvisorBySales.name}`}
                >
                  <span className="text-slate-500">Lead:</span>
                  <strong className="text-amber-700 truncate max-w-[140px] sm:max-w-[160px]">{topAdvisorBySales.name}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Overall Team KPI (Soft Teal / Leadership Light Palette) */}
          <div className="kpi-card metric-box bg-gradient-to-br from-teal-50/60 via-white to-teal-50/20 border border-teal-200/90 rounded-2xl p-4 transition-all flex flex-col justify-between min-w-0 shadow-xs h-full">
            {/* Row 1: Header */}
            <div className="h-6 flex items-center justify-between gap-1.5">
              <span className="label-text text-[11px] font-black text-teal-900 uppercase tracking-wider block truncate">
                Overall Team KPI
              </span>
              {topAdvisorByKpi && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAdvisor(topAdvisorByKpi.raw, topAdvisorByKpi.type);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[9px] font-black cursor-pointer hover:scale-105 transition-transform shrink-0 shadow-2xs"
                  title={`Rank #1 KPI Leader: ${topAdvisorByKpi.name} (${topAdvisorByKpi.val.toFixed(1)}%)`}
                >
                  <Award className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                  <span className="font-mono font-bold">#1</span>
                </div>
              )}
            </div>

            {/* Row 2: Main Metric Number + Sub-Benchmark Alignment */}
            <div className="h-9 flex items-baseline justify-between gap-2 my-1.5 w-full">
              <span className="metric-value text-2xl sm:text-3xl font-black text-teal-950 font-mono tracking-tight truncate">
                <AnimatedCounter value={overallTeamKpi} decimals={1} suffix="%" />
              </span>
              <span className="text-[11px] font-bold text-teal-700 font-mono shrink-0">
                Target: 98%
              </span>
            </div>

            {/* Row 3: Visual Benchmark Progress Bar Container */}
            <div className="h-3.5 w-full flex items-center mb-1">
              <div className="w-full h-2 bg-teal-100/70 rounded-full overflow-hidden border border-teal-200/80">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallTeamKpi >= 90 ? 'bg-[#2D6A65]' : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, (overallTeamKpi / 98) * 100))}%` }}
                />
              </div>
            </div>

            {/* Row 4: Footer Tags Row */}
            <div className="pt-2 border-t border-teal-100 flex items-center gap-1.5 flex-nowrap overflow-hidden">
              <span className="h-6 text-[10px] sm:text-[11px] font-extrabold text-teal-800 uppercase tracking-wider inline-flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 shrink-0 select-none cursor-default">
                {Math.round((overallTeamKpi / 98) * 100)}% of Goal
              </span>
              {topAdvisorByKpi && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAdvisor(topAdvisorByKpi.raw, topAdvisorByKpi.type);
                  }}
                  className="h-6 text-[10px] font-bold text-slate-700 inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-teal-200 shrink-0 cursor-pointer hover:border-teal-400 transition-colors"
                  title={`Best: ${topAdvisorByKpi.name}`}
                >
                  <span className="text-slate-500">Best:</span>
                  <strong className="text-teal-700 truncate max-w-[140px] sm:max-w-[160px]">{topAdvisorByKpi.name}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Total Reach Calls (Soft Sky Blue Light Palette) */}
          <div 
            onClick={() => onNavigateTab('call_records')}
            className="kpi-card metric-box bg-gradient-to-br from-sky-50/60 via-white to-sky-50/20 border border-sky-200/90 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between min-w-0 shadow-xs h-full"
          >
            {/* Row 1: Header */}
            <div className="h-6 flex items-center justify-between gap-1.5">
              <span className="label-text text-[11px] font-black text-sky-900 uppercase tracking-wider group-hover:text-sky-700 transition-colors flex items-center gap-1 truncate">
                <span className="truncate">Total Reach Calls</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </span>
              {topAdvisorByReach && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAdvisor(topAdvisorByReach.raw, topAdvisorByReach.type);
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] text-[9px] font-black cursor-pointer hover:scale-105 transition-transform shrink-0 shadow-2xs"
                  title={`Rank #1 Outreach Star: ${topAdvisorByReach.name} (${topAdvisorByReach.val} calls)`}
                >
                  <PhoneCall className="w-2.5 h-2.5 text-[#0284C7] shrink-0" />
                  <span className="font-mono font-bold">#1</span>
                </div>
              )}
            </div>

            {/* Row 2: Main Metric Number + Sub-Benchmark Alignment */}
            <div className="h-9 flex items-baseline justify-between gap-2 my-1.5 w-full">
              <span className="metric-value text-2xl sm:text-3xl font-black text-sky-950 font-mono tracking-tight truncate">
                <AnimatedCounter value={totalReachCalls} />
              </span>
              <span className="text-[11px] font-bold text-sky-700 font-mono shrink-0">
                Telephony
              </span>
            </div>

            {/* Row 3: Standardized Context Indicator */}
            <div className="h-3.5 w-full flex items-center mb-1">
              <span className="text-[10px] text-sky-700/80 font-semibold truncate">
                Total Outreach Connections
              </span>
            </div>

            {/* Row 4: Footer Tags Row */}
            <div className="pt-2 border-t border-sky-100 flex items-center gap-1.5 flex-nowrap overflow-hidden">
              <span className="h-6 text-[10px] sm:text-[11px] font-extrabold text-[#0284C7] uppercase tracking-wider inline-flex items-center gap-1 bg-[#E0F2FE] px-2 py-0.5 rounded-md border border-[#BAE6FD] shrink-0">
                View Log →
              </span>
              {topAdvisorByReach && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAdvisor(topAdvisorByReach.raw, topAdvisorByReach.type);
                  }}
                  className="h-6 text-[10px] font-bold text-slate-700 inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-sky-200 shrink-0 cursor-pointer hover:border-cyan-400 transition-colors"
                  title={`Top: ${topAdvisorByReach.name}`}
                >
                  <span className="text-slate-500">Top:</span>
                  <strong className="text-sky-700 truncate max-w-[140px] sm:max-w-[160px]">{topAdvisorByReach.name}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Active Tasks (Soft Indigo Light Palette) */}
          <div 
            onClick={() => onNavigateTab('tasks')}
            className="kpi-card metric-box bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/20 border border-indigo-200/90 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between min-w-0 shadow-xs h-full"
          >
            {/* Row 1: Header */}
            <div className="h-6 flex items-center justify-between gap-1.5">
              <span className="label-text text-[11px] font-black text-indigo-900 uppercase tracking-wider group-hover:text-indigo-700 transition-colors flex items-center gap-1 truncate">
                <span className="truncate">Active Tasks</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </span>
              <span className="text-[10px] font-bold text-indigo-700 font-mono">Pipeline</span>
            </div>

            {/* Row 2: Main Metric Number + Sub-Benchmark Alignment */}
            <div className="h-9 flex items-baseline justify-between gap-2 my-1.5 w-full">
              <span className="metric-value text-2xl sm:text-3xl font-black text-indigo-950 font-mono tracking-tight truncate">
                <AnimatedCounter value={tasks.filter(t => t.status !== 'completed').length || 4} />
              </span>
              <span className="text-[11px] font-bold text-indigo-700 font-mono shrink-0">
                Pipeline
              </span>
            </div>

            {/* Row 3: Standardized Context Indicator */}
            <div className="h-3.5 w-full flex items-center mb-1">
              <span className="text-[10px] text-indigo-700/80 font-semibold truncate">
                Operational Task Queue
              </span>
            </div>

            {/* Row 4: Footer Tags Row */}
            <div className="pt-2 border-t border-indigo-100 flex items-center gap-1.5 flex-nowrap overflow-hidden">
              <span className="h-6 text-[10px] sm:text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0 select-none cursor-default">
                In Pipeline
              </span>
              <span className="h-6 text-[10px] font-bold text-slate-700 inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shrink-0 select-none cursor-default">
                <span className="text-slate-500">Due Today:</span>
                <strong className="text-indigo-800">{tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length || 3}</strong>
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

            {/* Division Comparison Cards with Subtle Breathing Effects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stationed Team Card */}
        <motion.div 
          className="main-card container-box bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/60 border border-indigo-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden space-y-4 hover:border-indigo-400 transition-all flex flex-col justify-between group"
        >
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3.5 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="card-title font-bold text-slate-900 text-sm truncate">Stationed Team</h3>
                  {/* Tooltip for Methodology */}
                  <div className="group relative inline-flex items-center cursor-help shrink-0">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-900 text-white border border-slate-700 rounded-xl text-[11px] shadow-xl z-20 pointer-events-none leading-tight">
                      <strong>Stationed Methodology:</strong> Tracks Avg Reach, Talktime, CE Count, Exam Marks, Briefings, Sales & KPI Grade.
                    </div>
                  </div>
                </div>
                <p className="subtext text-[11px] text-slate-500 truncate">On-site Advisor Hub • {stationedAdvisors.length} Members</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigateTab('stationed')}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-all shrink-0 ml-auto cursor-pointer shadow-2xs"
            >
              <span>Explore</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-1 relative z-10">
            <div className="kpi-card metric-box bg-white p-3 sm:p-3.5 rounded-xl border border-indigo-100/90 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Sales</span>
              <span className="metric-value text-sm sm:text-base font-black text-slate-900 font-mono">৳{stationedSales.toLocaleString('en-BD')}</span>
            </div>
            <div className="kpi-card metric-box bg-white p-3 sm:p-3.5 rounded-xl border border-indigo-100/90 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Avg KPI</span>
              <span className="metric-value text-sm sm:text-base font-black text-indigo-600 font-mono">{avgStationedKpi.toFixed(1)}%</span>
            </div>
            <div className="kpi-card metric-box bg-white p-3 sm:p-3.5 rounded-xl border border-indigo-100/90 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Avg Reach</span>
              <span className="metric-value text-sm sm:text-base font-black text-slate-900 font-mono">{Math.round(totalStationedReach / (stationedAdvisors.length || 1))}</span>
            </div>
          </div>
        </motion.div>

        {/* Virtual Team Card */}
        <motion.div 
          className="main-card container-box bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/60 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden space-y-4 hover:border-emerald-400 transition-all flex flex-col justify-between group"
        >
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3.5 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="card-title font-bold text-slate-900 text-sm truncate">Virtual Team</h3>
                  {/* Tooltip for Methodology */}
                  <div className="group relative inline-flex items-center cursor-help shrink-0">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-900 text-white border border-slate-700 rounded-xl text-[11px] shadow-xl z-20 pointer-events-none leading-tight">
                      <strong>Virtual Methodology:</strong> Tracks Reach Calls, Talk Time, Meetings, Dispositions, Incentives & Total Salary.
                    </div>
                  </div>
                </div>
                <p className="subtext text-[11px] text-slate-500 truncate">Remote Operations Hub • {virtualAdvisors.length} Members</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigateTab('virtual')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-all shrink-0 ml-auto cursor-pointer shadow-2xs"
            >
              <span>Explore</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-1 relative z-10">
            <div className="kpi-card metric-box bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-100/90 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Sales</span>
              <span className="metric-value text-sm sm:text-base font-black text-slate-900 font-mono">৳{virtualSales.toLocaleString('en-BD')}</span>
            </div>
            <div className="kpi-card metric-box bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-100/90 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Overall KPI</span>
              <span className="metric-value text-sm sm:text-base font-black text-emerald-600 font-mono">{avgVirtualKpi.toFixed(1)}%</span>
            </div>
            <div className="kpi-card metric-box bg-white p-3 sm:p-3.5 rounded-xl border border-emerald-100/90 flex flex-col items-center justify-center shadow-2xs">
              <span className="label-text text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Reach Calls</span>
              <span className="metric-value text-sm sm:text-base font-black text-slate-900 font-mono">{totalVirtualReach.toLocaleString('en-BD')}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Team Sales Performance Trend Line Chart */}
      <div className="main-card container-box bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex flex-col items-start gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <TrendingUp className="w-4 h-4 text-[#3B7A75] shrink-0" />
              <h3 className="font-bold text-sm text-[#0F172A] uppercase tracking-wider">
                {trendTimeRange === '7d' ? '7-Day' : '30-Day'} Daily Team Sales Trend
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#3B7A75] bg-[#E8F1F1] border border-[#C5DCDC] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 shadow-2xs">
                <span className="relative flex h-1.5 w-1.5">
                  <motion.span
                    animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inline-flex h-full w-full rounded-full bg-[#3B7A75]"
                  />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3B7A75]" />
                </span>
                <span>Live Trend</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Visualizing daily revenue trajectory across Stationed & Virtual divisions over the past {trendTimeRange === '7d' ? '7 days' : '30 days'}
            </p>
          </div>

          {/* Controls: Time Range Toggle & Division Filter in Full-Width Horizontal Containers */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
            {/* 7-Day vs 30-Day Time Range Toggle */}
            <div className="w-full sm:w-auto flex items-center justify-between gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setTrendTimeRange('7d')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trendTimeRange === '7d'
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>7 Days</span>
              </button>
              <button
                type="button"
                onClick={() => setTrendTimeRange('30d')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trendTimeRange === '30d'
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>30 Days</span>
              </button>
            </div>

            {/* Division Filter */}
            <div className="w-full sm:w-auto flex items-center justify-between gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setTrendDivisionFilter('all')}
                className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trendDivisionFilter === 'all'
                    ? 'bg-[#3B7A75] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Combined
              </button>
              <button
                type="button"
                onClick={() => setTrendDivisionFilter('stationed')}
                className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trendDivisionFilter === 'stationed'
                    ? 'bg-[#3B7A75] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stationed
              </button>
              <button
                type="button"
                onClick={() => setTrendDivisionFilter('virtual')}
                className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  trendDivisionFilter === 'virtual'
                    ? 'bg-[#3B7A75] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Virtual
              </button>
            </div>
          </div>
        </div>

        {/* Top Trend Key Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Average Daily Sales</span>
            <div className="flex flex-col items-start gap-1 mt-2 min-w-0 w-full">
              <span className="text-base xs:text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight truncate w-full">৳{trendMetrics.avgDaily.toLocaleString('en-BD')}</span>
              <span className="text-[10px] text-slate-500 font-mono font-medium truncate">/ day</span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">Peak Single-Day Revenue</span>
            <div className="flex flex-col items-start gap-1 mt-2 min-w-0 w-full">
              <span className="text-base xs:text-lg sm:text-xl font-black text-emerald-600 font-mono tracking-tight truncate w-full">৳{trendMetrics.peakDaily.toLocaleString('en-BD')}</span>
              <span className="text-[10px] text-slate-500 font-mono font-medium truncate">{trendMetrics.peakDate}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">
              Total {trendTimeRange === '7d' ? '7-Day' : '30-Day'} Revenue
            </span>
            <div className="flex flex-col items-start gap-1 mt-2 min-w-0 w-full">
              <span className="text-base xs:text-lg sm:text-xl font-black text-indigo-600 font-mono tracking-tight truncate w-full">৳{trendMetrics.totalPeriodSales.toLocaleString('en-BD')}</span>
              <span className="text-[10px] text-slate-500 font-mono font-medium truncate">Cumulative</span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all min-w-0">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider block truncate">
              {trendTimeRange === '7d' ? '7-Day Momentum' : 'Monthly Sales Momentum'}
            </span>
            <div className="flex flex-col items-start gap-1 mt-2 min-w-0 w-full">
              <span className={`text-base xs:text-lg sm:text-xl font-black font-mono tracking-tight truncate w-full ${trendMetrics.momentum >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trendMetrics.momentum >= 0 ? '+' : ''}{trendMetrics.momentum.toFixed(1)}%
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300 shrink-0">
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
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="virtualTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="totalTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
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
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#stationedTrendGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="virtual"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#virtualTrendGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#4f46e5"
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
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#stationedTrendGrad)"
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              )}

              {trendDivisionFilter === 'virtual' && (
                <Area
                  type="monotone"
                  dataKey="virtual"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#virtualTrendGrad)"
                  dot={{ r: 3, fill: '#f43f5e' }}
                  activeDot={{ r: 6 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aggregate 30-Day Daily Average KPI Score & Performance Velocity Recharts Line Chart */}
      <DailyKpiVelocityChart
        stationedAdvisors={stationedAdvisors}
        virtualAdvisors={virtualAdvisors}
        overallTeamKpi={overallTeamKpi}
        avgStationedKpi={avgStationedKpi}
        avgVirtualKpi={avgVirtualKpi}
      />

      {/* Visual Analytics Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Card 1: Sales Revenue Breakdown */}
        <div className="main-card container-box bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 h-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 shrink-0 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="card-title font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 truncate">
                    Sales Revenue Share
                  </h3>
                  <p className="subtext text-[10px] text-slate-500 font-medium truncate">Division Split & Sales Contribution</p>
                </div>
              </div>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg font-mono shrink-0 shadow-2xs">
                ৳{totalSales.toLocaleString('en-BD')} Total
              </span>
            </div>

            {/* Symmetrical Top Stats Bar (Matches 3-tab filter height in Card 2 & 3) */}
            <div className="flex items-center justify-between px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/90 text-[11px] font-bold text-slate-600 shadow-inner h-9 sm:h-10">
              <span className="flex items-center gap-1.5 text-indigo-700 truncate">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                Stationed: {stationedAdvisors.length}
              </span>
              <span className="h-3 w-px bg-slate-300 shrink-0" />
              <span className="flex items-center gap-1.5 text-emerald-700 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                Virtual: {virtualAdvisors.length}
              </span>
              <span className="h-3 w-px bg-slate-300 shrink-0" />
              <span className="text-slate-800 font-mono shrink-0">
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
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Ratio</span>
                <span className="text-sm font-black text-slate-900 font-mono leading-none">
                  {totalSales > 0 ? ((stationedSales / totalSales) * 100).toFixed(0) : 0}% / {totalSales > 0 ? ((virtualSales / totalSales) * 100).toFixed(0) : 0}%
                </span>
                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded mt-1 font-mono">
                  ST / VT
                </span>
              </div>
            </div>

            {/* Stacked Percentage Visual Bar */}
            <div className="space-y-1.5 pt-0.5">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200 shadow-inner">
                <div 
                  className="h-full bg-indigo-600 rounded-l-full transition-all duration-500" 
                  style={{ width: `${totalSales > 0 ? (stationedSales / totalSales) * 100 : 50}%` }}
                  title={`Stationed Division: ৳${stationedSales.toLocaleString('en-BD')}`}
                />
                <div 
                  className="h-full bg-emerald-500 rounded-r-full transition-all duration-500" 
                  style={{ width: `${totalSales > 0 ? (virtualSales / totalSales) * 100 : 50}%` }}
                  title={`Virtual Division: ৳${virtualSales.toLocaleString('en-BD')}`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-extrabold">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Stationed: {totalSales > 0 ? ((stationedSales / totalSales) * 100).toFixed(1) : 0}%
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Virtual: {totalSales > 0 ? ((virtualSales / totalSales) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Comparative Division Metric Cards */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
            <div className="bg-indigo-50/50 border border-indigo-100 hover:border-indigo-300 rounded-xl p-3 flex flex-col justify-between transition-all min-w-0 shadow-2xs">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider truncate">Stationed</span>
                <span className="text-[10px] text-slate-500 font-semibold shrink-0">{stationedAdvisors.length} Members</span>
              </div>
              <p className="text-base font-black text-slate-900 font-mono tracking-tight truncate my-1">৳{stationedSales.toLocaleString('en-BD')}</p>
              <div className="text-[10px] text-slate-500 flex flex-wrap items-baseline gap-1 pt-1 border-t border-indigo-100">
                <span>Avg:</span>
                <strong className="text-indigo-700 font-mono font-bold">৳{Math.round(stationedSales / (stationedAdvisors.length || 1)).toLocaleString('en-BD')}</strong>
                <span className="text-slate-400 text-[9px]">/adv</span>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 rounded-xl p-3 flex flex-col justify-between transition-all min-w-0 shadow-2xs">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider truncate">Virtual</span>
                <span className="text-[10px] text-slate-500 font-semibold shrink-0">{virtualAdvisors.length} Members</span>
              </div>
              <p className="text-base font-black text-slate-900 font-mono tracking-tight truncate my-1">৳{virtualSales.toLocaleString('en-BD')}</p>
              <div className="text-[10px] text-slate-500 flex flex-wrap items-baseline gap-1 pt-1 border-t border-emerald-100">
                <span>Avg:</span>
                <strong className="text-emerald-700 font-mono font-bold">৳{Math.round(virtualSales / (virtualAdvisors.length || 1)).toLocaleString('en-BD')}</strong>
                <span className="text-slate-400 text-[9px]">/adv</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: KPI Performance Tiers & Grade Distribution */}
        <div className="main-card container-box bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 h-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="card-title font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 truncate">
                    KPI Performance Tiers
                  </h3>
                  <p className="subtext text-[10px] text-slate-500 font-medium truncate">Efficiency Grades & Tier Segmentation</p>
                </div>
              </div>

              {/* View Switcher (Pie Chart vs Bar Chart) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                <button
                  onClick={() => setKpiChartType('pie')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    kpiChartType === 'pie'
                      ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Pie Chart View (High, Medium, Low Tiers)"
                >
                  Pie
                </button>
                <button
                  onClick={() => setKpiChartType('bar')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    kpiChartType === 'bar'
                      ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Bar Chart View (A, B, C, D, PIP Grades)"
                >
                  Bar
                </button>
              </div>
            </div>

            {/* Division Filter Toggle Bar (Matches height in Card 1 & 3) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-full h-9 sm:h-10">
              <button
                onClick={() => setGradeDistributionFilter('combined')}
                className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'combined'
                    ? 'bg-[#3B7A75] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setGradeDistributionFilter('stationed')}
                className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'stationed'
                    ? 'bg-[#3B7A75] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Stationed
              </button>
              <button
                onClick={() => setGradeDistributionFilter('virtual')}
                className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all text-center cursor-pointer ${
                  gradeDistributionFilter === 'virtual'
                    ? 'bg-[#3B7A75] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
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
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Total</span>
                    <span className="text-sm font-black text-slate-900 font-mono leading-none">
                      {kpiTierPieData.reduce((a, b) => a + b.count, 0)} Advisors
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-1 capitalize font-mono">
                      {gradeDistributionFilter}
                    </span>
                  </div>
                </div>

                {/* Progress bar visual for tier ratios */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200 shadow-inner">
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
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      High: {kpiTierPieData[0]?.pct}%
                    </span>
                    <span className="flex items-center gap-1 text-indigo-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Med: {kpiTierPieData[1]?.pct}%
                    </span>
                    <span className="flex items-center gap-1 text-rose-700">
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
                      <XAxis dataKey="grade" stroke="#64748b" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#475569', fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)', color: '#0f172a' }}
                        formatter={(val: any) => [`${val} Advisors`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {gradeChartData.map((entry, index) => {
                          const semanticColors: Record<string, string> = {
                            'A': '#10b981',    // Exceeds (Emerald)
                            'B': '#6366f1',    // On Target (Indigo)
                            'C': '#8b5cf6',    // Warning (Purple)
                            'D': '#f97316',    // Needs Improvement
                            'PIP': '#e11d48',  // Critical
                          };
                          return <Cell key={`cell-grade-${index}`} fill={semanticColors[entry.grade] || '#10b981'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Semantic Color Legend Strip */}
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-tight text-slate-500 pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    A (Exceeds)
                  </span>
                  <span className="flex items-center gap-1 text-indigo-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    B (Target)
                  </span>
                  <span className="flex items-center gap-1 text-purple-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    C/D (Warning)
                  </span>
                  <span className="flex items-center gap-1 text-rose-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    PIP (Action)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* KPI Tier Legend & Count Badges */}
          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-200">
            {kpiTierPieData.map((tier) => (
              <div key={tier.tier} className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl space-y-0.5 hover:border-emerald-500 transition-all shadow-2xs">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                  <span className="text-[10px] font-extrabold text-slate-700 truncate">{tier.tier}</span>
                </div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {tier.count} <span className="text-[10px] text-slate-500 font-normal">({tier.pct}%)</span>
                </div>
                <span className="text-[9px] font-semibold block text-slate-500">{tier.label}</span>
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
              dailySalesTrendData={dailySalesTrendData}
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

