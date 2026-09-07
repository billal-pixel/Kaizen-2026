import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StationedAdvisor, VirtualAdvisor, TaskItem, TimeLog } from '../types';
import { getNumericKpi, formatKpiDisplay } from '../utils/sheetParser';
import { 
  TrendingUp, 
  Award, 
  Users, 
  Layers, 
  ChevronRight, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  ExternalLink,
  Crown,
  Trophy,
  Activity,
  Sparkles,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { AdvisorKpiComparison } from './AdvisorKpiComparison';

interface ExecutiveCondensedTableProps {
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  tasks: TaskItem[];
  timeLogs: TimeLog[];
  stationedSales: number;
  virtualSales: number;
  totalSales: number;
  avgStationedKpi: number;
  avgVirtualKpi: number;
  overallTeamKpi: number;
  totalStationedReach: number;
  totalVirtualReach: number;
  totalReachCalls: number;
  dailySalesTrendData: Array<{
    date: string;
    fullDate: string;
    stationed: number;
    virtual: number;
    total: number;
  }>;
  onNavigateTab: (tab: 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report') => void;
  onSelectAdvisor: (advisor: any, type: 'stationed' | 'virtual') => void;
  getAdvisorGrade: (kpiVal: any, rawGrade?: string) => string;
}

type SortField = 'rank' | 'name' | 'team' | 'sales' | 'kpi' | 'grade' | 'reach' | 'quality';
type SortOrder = 'asc' | 'desc';

export const ExecutiveCondensedTable: React.FC<ExecutiveCondensedTableProps> = ({
  stationedAdvisors,
  virtualAdvisors,
  tasks,
  stationedSales,
  virtualSales,
  totalSales,
  avgStationedKpi,
  avgVirtualKpi,
  overallTeamKpi,
  totalStationedReach,
  totalVirtualReach,
  totalReachCalls,
  dailySalesTrendData,
  onNavigateTab,
  onSelectAdvisor,
  getAdvisorGrade,
}) => {
  // Table Filters and Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<'all' | 'stationed' | 'virtual'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('sales');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Daily Telemetry Log State
  const [telemetryTimeRange, setTelemetryTimeRange] = useState<'7d' | '30d'>('7d');

  // Grade Counts for Rollup Table
  const stationedGradeCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, PIP: 0 };
    stationedAdvisors.forEach(a => {
      const g = getAdvisorGrade(a.totalKpiScore, a.kpiGrade);
      if (counts[g as keyof typeof counts] !== undefined) {
        counts[g as keyof typeof counts]++;
      }
    });
    return counts;
  }, [stationedAdvisors, getAdvisorGrade]);

  const virtualGradeCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, PIP: 0 };
    virtualAdvisors.forEach(a => {
      const g = getAdvisorGrade(a.overallKpi, typeof a.overallKpi === 'string' ? a.overallKpi : undefined);
      if (counts[g as keyof typeof counts] !== undefined) {
        counts[g as keyof typeof counts]++;
      }
    });
    return counts;
  }, [virtualAdvisors, getAdvisorGrade]);

  const combinedGradeCounts = useMemo(() => {
    return {
      A: stationedGradeCounts.A + virtualGradeCounts.A,
      B: stationedGradeCounts.B + virtualGradeCounts.B,
      C: stationedGradeCounts.C + virtualGradeCounts.C,
      D: stationedGradeCounts.D + virtualGradeCounts.D,
      PIP: stationedGradeCounts.PIP + virtualGradeCounts.PIP,
    };
  }, [stationedGradeCounts, virtualGradeCounts]);

  // Unified Advisor List for Master Table
  const unifiedAdvisors = useMemo(() => {
    const stationed = stationedAdvisors.map(a => ({
      id: a.id || `st-${a.advisorName}`,
      name: a.advisorName,
      designation: a.designation || a.advisorDesignation || 'Stationed Advisor',
      team: 'Stationed' as const,
      sales: a.finalSalesData || 0,
      kpiNum: getNumericKpi(a.totalKpiScore),
      kpiDisplay: formatKpiDisplay(a.totalKpiScore),
      grade: getAdvisorGrade(a.totalKpiScore, a.kpiGrade),
      reach: a.avgReach || 0,
      qualityScore: a.avgExamMark || a.ceCount || 0,
      qualityLabel: a.avgExamMark ? `${a.avgExamMark}% Exam` : `${a.ceCount} CE`,
      talkTime: a.avgTalktime || '-',
      incentive: a.totalIncentive || a.kpiAmount || 0,
      raw: a,
    }));

    const virtual = virtualAdvisors.map(a => ({
      id: a.id || `vt-${a.advisorName}`,
      name: a.advisorName,
      designation: a.designation || a.advisorDesignation || 'Virtual Advisor',
      team: 'Virtual' as const,
      sales: a.finalSales || 0,
      kpiNum: getNumericKpi(a.overallKpi),
      kpiDisplay: formatKpiDisplay(a.overallKpi),
      grade: getAdvisorGrade(a.overallKpi, typeof a.overallKpi === 'string' ? a.overallKpi : undefined),
      reach: a.reachCall || 0,
      qualityScore: typeof a.exam === 'number' ? a.exam : typeof a.exam === 'string' ? parseFloat(a.exam) || 0 : a.ceCount || 0,
      qualityLabel: a.exam ? `${a.exam}% Exam` : `${a.ceCount} CE`,
      talkTime: a.talkTime || a.actualTalkTime || '-',
      incentive: a.finalIncentive || a.totalSalary || 0,
      raw: a,
    }));

    return [...stationed, ...virtual];
  }, [stationedAdvisors, virtualAdvisors, getAdvisorGrade]);

  // Filtered & Sorted Advisors
  const filteredAdvisors = useMemo(() => {
    let result = unifiedAdvisors;

    // Search filter
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.designation.toLowerCase().includes(q)
      );
    }

    // Division filter
    if (divisionFilter === 'stationed') {
      result = result.filter(a => a.team === 'Stationed');
    } else if (divisionFilter === 'virtual') {
      result = result.filter(a => a.team === 'Virtual');
    }

    // Grade filter
    if (gradeFilter !== 'all') {
      result = result.filter(a => a.grade === gradeFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'sales') {
        comparison = a.sales - b.sales;
      } else if (sortField === 'kpi') {
        comparison = a.kpiNum - b.kpiNum;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'team') {
        comparison = a.team.localeCompare(b.team);
      } else if (sortField === 'reach') {
        comparison = a.reach - b.reach;
      } else if (sortField === 'quality') {
        comparison = a.qualityScore - b.qualityScore;
      } else if (sortField === 'grade') {
        const gradeRank: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'PIP': 1 };
        comparison = (gradeRank[a.grade] || 0) - (gradeRank[b.grade] || 0);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [unifiedAdvisors, searchTerm, divisionFilter, gradeFilter, sortField, sortOrder]);

  // Paginated Advisors
  const paginatedAdvisors = useMemo(() => {
    if (pageSize === -1) return filteredAdvisors;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAdvisors.slice(startIndex, startIndex + pageSize);
  }, [filteredAdvisors, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredAdvisors.length / (pageSize || 1));

  // Toggle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Telemetry Log Data (7 or 30 days)
  const displayedTelemetryData = useMemo(() => {
    const list = telemetryTimeRange === '7d' ? dailySalesTrendData.slice(-7) : dailySalesTrendData;
    return list.map((item, idx, arr) => {
      const prevTotal = idx > 0 ? arr[idx - 1].total : item.total;
      const changePct = prevTotal > 0 ? ((item.total - prevTotal) / prevTotal) * 100 : 0;
      return {
        ...item,
        changePct,
      };
    });
  }, [dailySalesTrendData, telemetryTimeRange]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. EXECUTIVE OPERATIONAL ROLLUP MATRIX */}
      <div id="executive-rollup-section" className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#1e2c4a] rounded-2xl shadow-sm dark:shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e2c4a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#15223c]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Executive Division Rollup Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consolidated operational telemetry & revenue distribution across organizational hubs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-[#15223c] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {stationedAdvisors.length + virtualAdvisors.length} Total Reps
            </span>
          </div>
        </div>

        {/* High-Density Rollup Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-[#15223c] text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2c4a]">
                <th className="py-3.5 px-4 font-bold">Operational Unit</th>
                <th className="py-3.5 px-3 text-center font-bold">Headcount</th>
                <th className="py-3.5 px-4 text-right font-bold">Total Revenue</th>
                <th className="py-3.5 px-3 text-right font-bold">Rev Share</th>
                <th className="py-3.5 px-4 text-right font-bold">Avg Rev / Rep</th>
                <th className="py-3.5 px-3 text-center font-bold">Avg KPI</th>
                <th className="py-3.5 px-4 text-center font-bold">Quality Grades (A / B / C / D / PIP)</th>
                <th className="py-3.5 px-3 text-right font-bold">Total Calls</th>
                <th className="py-3.5 px-3 text-right font-bold">Avg Calls</th>
                <th className="py-3.5 px-3 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1e2c4a]/60 font-medium">
              {/* Row 1: Stationed Division */}
              <tr className="hover:bg-indigo-50/50 dark:hover:bg-[#15223c]/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">Stationed Hub</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">On-site Advisor Center</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                  {stationedAdvisors.length}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                  ৳{stationedSales.toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-right">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {totalSales > 0 ? ((stationedSales / totalSales) * 100).toFixed(1) : '0.0'}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                  ৳{Math.round(stationedSales / (stationedAdvisors.length || 1)).toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold ${
                    avgStationedKpi >= 80 
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' 
                      : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                  }`}>
                    {avgStationedKpi.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-[#15223c] rounded-lg border border-slate-200/80 dark:border-[#24355a] text-[10px] font-mono font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300" title="Grade A Count">{stationedGradeCounts.A}A</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300" title="Grade B Count">{stationedGradeCounts.B}B</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300" title="Grade C Count">{stationedGradeCounts.C}C</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300" title="Grade D Count">{stationedGradeCounts.D}D</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300" title="PIP Count">{stationedGradeCounts.PIP}P</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                  {totalStationedReach.toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                  {Math.round(totalStationedReach / (stationedAdvisors.length || 1))}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <button
                    onClick={() => onNavigateTab('stationed')}
                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors cursor-pointer"
                    title="Explore Stationed Hub"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              {/* Row 2: Virtual Division */}
              <tr className="hover:bg-rose-50/50 dark:hover:bg-[#15223c]/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">Virtual Hub</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Remote Operations Center</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                  {virtualAdvisors.length}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                  ৳{virtualSales.toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-right">
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {totalSales > 0 ? ((virtualSales / totalSales) * 100).toFixed(1) : '0.0'}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                  ৳{Math.round(virtualSales / (virtualAdvisors.length || 1)).toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold ${
                    avgVirtualKpi >= 80 
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' 
                      : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                  }`}>
                    {avgVirtualKpi.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-[#15223c] rounded-lg border border-slate-200/80 dark:border-[#24355a] text-[10px] font-mono font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300" title="Grade A Count">{virtualGradeCounts.A}A</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300" title="Grade B Count">{virtualGradeCounts.B}B</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300" title="Grade C Count">{virtualGradeCounts.C}C</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300" title="Grade D Count">{virtualGradeCounts.D}D</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300" title="PIP Count">{virtualGradeCounts.PIP}P</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                  {totalVirtualReach.toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                  {Math.round(totalVirtualReach / (virtualAdvisors.length || 1))}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <button
                    onClick={() => onNavigateTab('virtual')}
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                    title="Explore Virtual Hub"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              {/* Row 3: Consolidated Total Summary */}
              <tr className="bg-slate-100/90 dark:bg-[#15223c] font-extrabold border-t-2 border-slate-300 dark:border-[#24355a]">
                <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-black uppercase tracking-tight">Team Kaizen Consolidated</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Entire Combined Sales Fleet</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-black text-slate-900 dark:text-slate-100">
                  {stationedAdvisors.length + virtualAdvisors.length}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                  ৳{totalSales.toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                  100.0%
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                  ৳{Math.round(totalSales / ((stationedAdvisors.length + virtualAdvisors.length) || 1)).toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {overallTeamKpi.toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-[#10192e] rounded-lg border border-slate-300/80 dark:border-[#24355a] text-[10px] font-mono font-black">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">{combinedGradeCounts.A}A</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200">{combinedGradeCounts.B}B</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200">{combinedGradeCounts.C}C</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">{combinedGradeCounts.D}D</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200">{combinedGradeCounts.PIP}P</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                  {totalReachCalls.toLocaleString('en-BD')}
                </td>
                <td className="py-3.5 px-3 text-right font-mono font-black text-slate-700 dark:text-slate-300">
                  {Math.round(totalReachCalls / ((stationedAdvisors.length + virtualAdvisors.length) || 1))}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">All Active</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. MASTER CONDENSED ALL-ADVISORS PERFORMANCE TABLE */}
      <div id="master-advisor-table-section" className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#1e2c4a] rounded-2xl shadow-sm dark:shadow-xl overflow-hidden space-y-4 p-4 sm:p-5">
        {/* Controls Toolbar: Title, Search, Division Filter, Grade Filter, Page Size */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1e2c4a] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Advisor Performance Roster
              </h2>
              <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-[#15223c] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#24355a]">
                {filteredAdvisors.length} of {unifiedAdvisors.length} Reps
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-density master index with instant search, multi-column sort, and direct profile inspection
            </p>
          </div>

          {/* Filters Grid */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search advisor name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Division Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#15223c] p-1 rounded-xl border border-slate-200 dark:border-[#24355a] text-xs">
              <button
                type="button"
                onClick={() => { setDivisionFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  divisionFilter === 'all'
                    ? 'bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-[#24355a]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => { setDivisionFilter('stationed'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  divisionFilter === 'stationed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Stationed
              </button>
              <button
                type="button"
                onClick={() => { setDivisionFilter('virtual'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  divisionFilter === 'virtual'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Virtual
              </button>
            </div>

            {/* Grade Filter Dropdown */}
            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
              className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] rounded-xl text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Grades</option>
              <option value="A">Grade A (Exceeds)</option>
              <option value="B">Grade B (On Target)</option>
              <option value="C">Grade C (Warning)</option>
              <option value="D">Grade D (Low)</option>
              <option value="PIP">Grade PIP (Critical)</option>
            </select>

            {/* Page Size Density Selector */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="py-1.5 px-2 text-xs bg-slate-50 dark:bg-[#15223c] border border-slate-200 dark:border-[#24355a] rounded-xl text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={10}>10 rows</option>
              <option value={15}>15 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={-1}>All ({filteredAdvisors.length})</option>
            </select>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1e2c4a]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-[#15223c] text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2c4a]">
                <th className="py-3 px-3 text-center w-12 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort('sales')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>#</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Advisor Name</span>
                    {sortField === 'name' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                  </div>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort('team')}>
                  <div className="flex items-center gap-1">
                    <span>Division</span>
                    {sortField === 'team' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort('sales')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Sales Revenue</span>
                    {sortField === 'sales' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort('kpi')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>KPI Score</span>
                    {sortField === 'kpi' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort('grade')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Grade</span>
                    {sortField === 'grade' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                  </div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort('reach')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Reach Calls</span>
                    {sortField === 'reach' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => handleSort('quality')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Quality / Exam</span>
                    {sortField === 'quality' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Talk Time</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1e2c4a]/60 font-medium">
              {paginatedAdvisors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No advisors match the selected search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedAdvisors.map((adv, idx) => {
                  const globalRank = (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1;
                  return (
                    <tr
                      key={adv.id}
                      onClick={() => onSelectAdvisor(adv.raw, adv.team.toLowerCase() as any)}
                      className="hover:bg-slate-50 dark:hover:bg-[#15223c]/50 cursor-pointer transition-colors group"
                    >
                      {/* Rank Column */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          {globalRank === 1 ? (
                            <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-2xs">
                              <Crown className="w-3.5 h-3.5 fill-slate-950" />
                            </span>
                          ) : globalRank === 2 ? (
                            <span className="w-6 h-6 rounded-md bg-slate-300 text-slate-900 flex items-center justify-center font-black text-xs">
                              2
                            </span>
                          ) : globalRank === 3 ? (
                            <span className="w-6 h-6 rounded-md bg-amber-700 text-amber-100 flex items-center justify-center font-black text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                              {globalRank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name Column */}
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            {adv.name}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {adv.designation}
                          </span>
                        </div>
                      </td>

                      {/* Division Column */}
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border font-mono ${
                          adv.team === 'Stationed'
                            ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                            : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${adv.team === 'Stationed' ? 'bg-blue-600' : 'bg-rose-500'}`} />
                          {adv.team}
                        </span>
                      </td>

                      {/* Sales Revenue Column */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            ৳{adv.sales.toLocaleString('en-BD')}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {totalSales > 0 ? ((adv.sales / totalSales) * 100).toFixed(1) : 0}% of fleet
                          </span>
                        </div>
                      </td>

                      {/* KPI Score Column */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#15223c] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#24355a]">
                          {adv.kpiDisplay}
                        </span>
                      </td>

                      {/* Grade Column */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                          adv.grade === 'A'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : adv.grade === 'B'
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                            : adv.grade === 'C'
                            ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30'
                            : adv.grade === 'D'
                            ? 'bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60'
                            : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                        }`}>
                          {adv.grade}
                        </span>
                      </td>

                      {/* Reach Calls Column */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {adv.reach.toLocaleString('en-BD')}
                      </td>

                      {/* Quality / Exam Column */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {adv.qualityLabel}
                      </td>

                      {/* Talk Time Column */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {adv.talkTime}
                      </td>

                      {/* Action Column */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAdvisor(adv.raw, adv.team.toLowerCase() as any);
                          }}
                          className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] transition-colors border border-indigo-200 dark:border-indigo-500/30 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1e2c4a] text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredAdvisors.length} total entries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#24355a] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#15223c] transition-colors font-bold cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#24355a] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#15223c] transition-colors font-bold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. CONDENSED DAILY TELEMETRY LOG TABLE */}
      <div id="daily-telemetry-log-section" className="bg-white dark:bg-[#10192e] border border-slate-200 dark:border-[#1e2c4a] rounded-2xl shadow-sm dark:shadow-xl overflow-hidden p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1e2c4a] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Daily Sales Revenue Telemetry Log
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Condensed historical log of daily revenue and day-over-day growth trajectory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#15223c] p-1 rounded-xl border border-slate-200 dark:border-[#24355a] text-xs">
            <button
              type="button"
              onClick={() => setTelemetryTimeRange('7d')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                telemetryTimeRange === '7d'
                  ? 'bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-[#24355a]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTelemetryTimeRange('30d')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                telemetryTimeRange === '30d'
                  ? 'bg-white dark:bg-[#10192e] text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200 dark:border-[#24355a]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1e2c4a]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-[#15223c] text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2c4a]">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Stationed Sales</th>
                <th className="py-2.5 px-4 text-right">Virtual Sales</th>
                <th className="py-2.5 px-4 text-right">Combined Total</th>
                <th className="py-2.5 px-4 text-right">Stationed Ratio</th>
                <th className="py-2.5 px-4 text-right">Virtual Ratio</th>
                <th className="py-2.5 px-4 text-center">Day-over-Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1e2c4a]/60 font-medium">
              {displayedTelemetryData.map((row, idx) => (
                <tr key={`telemetry-${row.date}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-[#15223c]/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {row.fullDate}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    ৳{row.stationed.toLocaleString('en-BD')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ৳{row.virtual.toLocaleString('en-BD')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                    ৳{row.total.toLocaleString('en-BD')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {row.total > 0 ? ((row.stationed / row.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {row.total > 0 ? ((row.virtual / row.total) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {idx === 0 ? (
                      <span className="text-slate-400 font-mono text-[10px]">Baseline</span>
                    ) : row.changePct >= 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px]">
                        +{row.changePct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-mono font-bold text-[11px]">
                        {row.changePct.toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Advisor KPI Performance Score Comparison Feature */}
      <AdvisorKpiComparison
        stationedAdvisors={stationedAdvisors}
        virtualAdvisors={virtualAdvisors}
        onSelectAdvisor={onSelectAdvisor}
        getAdvisorGrade={getAdvisorGrade}
      />
    </div>
  );
};
