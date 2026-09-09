import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  Users, 
  Award, 
  TrendingUp, 
  PhoneCall, 
  CheckCircle2, 
  Trophy, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  ArrowLeftRight, 
  Search, 
  ChevronDown, 
  ExternalLink, 
  Check, 
  Zap, 
  Shuffle, 
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  GraduationCap,
  DollarSign,
  Clock
} from 'lucide-react';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { getNumericKpi, formatKpiDisplay, cleanNum } from '../utils/sheetParser';

export interface UnifiedAdvisorItem {
  id: string;
  name: string;
  employeeId?: string;
  designation?: string;
  teamLead?: string;
  team: 'stationed' | 'virtual';
  kpiScore: number;
  kpiDisplay: string;
  grade: string;
  sales: number;
  reach: number;
  ceCount: number;
  examMark: number;
  briefingOrMeeting: number | string;
  incentive: number;
  raw: StationedAdvisor | VirtualAdvisor;
}

interface AdvisorKpiComparisonProps {
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  onSelectAdvisor?: (advisor: any, type: 'stationed' | 'virtual') => void;
  getAdvisorGrade?: (kpiVal: any, rawGrade?: string) => string;
}

export const AdvisorKpiComparison: React.FC<AdvisorKpiComparisonProps> = ({
  stationedAdvisors,
  virtualAdvisors,
  onSelectAdvisor,
  getAdvisorGrade = (kpiVal: any, rawGrade?: string) => {
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
  }
}) => {
  // Normalize all advisors into unified structure
  const allAdvisors: UnifiedAdvisorItem[] = useMemo(() => {
    const list: UnifiedAdvisorItem[] = [];

    stationedAdvisors.forEach(a => {
      list.push({
        id: a.id || `st-${a.advisorName}`,
        name: a.advisorName,
        employeeId: a.employeeId || 'N/A',
        designation: a.designation || a.advisorDesignation || 'Stationed Advisor',
        teamLead: a.teamLead || 'Billal',
        team: 'stationed',
        kpiScore: getNumericKpi(a.totalKpiScore),
        kpiDisplay: formatKpiDisplay(a.totalKpiScore),
        grade: getAdvisorGrade(a.totalKpiScore, a.kpiGrade),
        sales: a.finalSalesData || 0,
        reach: a.avgReach || 0,
        ceCount: a.ceCount || 0,
        examMark: cleanNum(a.avgExamMark),
        briefingOrMeeting: a.avgBriefingMark || 0,
        incentive: a.totalIncentive || 0,
        raw: a,
      });
    });

    virtualAdvisors.forEach(a => {
      list.push({
        id: a.id || `vt-${a.advisorName}`,
        name: a.advisorName,
        employeeId: a.employeeId || 'N/A',
        designation: a.designation || a.advisorDesignation || 'Virtual Advisor',
        teamLead: a.teamLead || 'Billal',
        team: 'virtual',
        kpiScore: getNumericKpi(a.overallKpi),
        kpiDisplay: formatKpiDisplay(a.overallKpi),
        grade: getAdvisorGrade(a.overallKpi, typeof a.overallKpi === 'string' ? a.overallKpi : undefined),
        sales: a.finalSales || 0,
        reach: a.reachCall || 0,
        ceCount: a.ceCount || 0,
        examMark: cleanNum(a.exam),
        briefingOrMeeting: a.meeting || '0',
        incentive: a.finalIncentive || 0,
        raw: a,
      });
    });

    return list;
  }, [stationedAdvisors, virtualAdvisors, getAdvisorGrade]);

  // Ranked advisors (by sales and then KPI) to pick sensible defaults
  const rankedAdvisors = useMemo(() => {
    return [...allAdvisors].sort((a, b) => {
      if (b.sales !== a.sales) return b.sales - a.sales;
      return b.kpiScore - a.kpiScore;
    });
  }, [allAdvisors]);

  // Selected Advisor IDs (Default to top 2 ranked)
  const [advisor1Id, setAdvisor1Id] = useState<string>(() => {
    return rankedAdvisors[0]?.id || allAdvisors[0]?.id || '';
  });

  const [advisor2Id, setAdvisor2Id] = useState<string>(() => {
    return rankedAdvisors[1]?.id || allAdvisors[1]?.id || '';
  });

  // Ensure valid IDs if advisors list changes
  useEffect(() => {
    if (allAdvisors.length > 0) {
      if (!allAdvisors.some(a => a.id === advisor1Id)) {
        setAdvisor1Id(rankedAdvisors[0]?.id || allAdvisors[0]?.id);
      }
      if (!allAdvisors.some(a => a.id === advisor2Id)) {
        const fallback = rankedAdvisors.find(a => a.id !== (rankedAdvisors[0]?.id || ''))?.id || allAdvisors[1]?.id || allAdvisors[0]?.id;
        setAdvisor2Id(fallback);
      }
    }
  }, [allAdvisors, rankedAdvisors, advisor1Id, advisor2Id]);

  // Find selected advisor objects
  const advisor1 = useMemo(() => allAdvisors.find(a => a.id === advisor1Id) || allAdvisors[0] || null, [allAdvisors, advisor1Id]);
  const advisor2 = useMemo(() => allAdvisors.find(a => a.id === advisor2Id) || allAdvisors[1] || allAdvisors[0] || null, [allAdvisors, advisor2Id]);

  // Chart Metric Mode: 'normalized' (0-100 benchmark) | 'absolute' (direct multi-metric) | 'focus'
  const [chartMode, setChartMode] = useState<'normalized' | 'absolute'>('normalized');
  const [focusMetric, setFocusMetric] = useState<'all' | 'kpi' | 'sales' | 'reach' | 'exam' | 'ce'>('all');

  // Search & Filter Dropdown State for Selector 1 & Selector 2
  const [openSelector, setOpenSelector] = useState<'none' | 'adv1' | 'adv2'>('none');
  const [searchQuery1, setSearchQuery1] = useState('');
  const [searchQuery2, setSearchQuery2] = useState('');
  const [teamFilter1, setTeamFilter1] = useState<'all' | 'stationed' | 'virtual'>('all');
  const [teamFilter2, setTeamFilter2] = useState<'all' | 'stationed' | 'virtual'>('all');

  const dropdownRef1 = useRef<HTMLDivElement>(null);
  const dropdownRef2 = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openSelector === 'adv1' &&
        dropdownRef1.current &&
        !dropdownRef1.current.contains(e.target as Node)
      ) {
        setOpenSelector('none');
      } else if (
        openSelector === 'adv2' &&
        dropdownRef2.current &&
        !dropdownRef2.current.contains(e.target as Node)
      ) {
        setOpenSelector('none');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSelector]);

  // Filtered lists for selectors
  const filteredList1 = useMemo(() => {
    return allAdvisors.filter(a => {
      if (teamFilter1 !== 'all' && a.team !== teamFilter1) return false;
      if (!searchQuery1.trim()) return true;
      const q = searchQuery1.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        (a.employeeId && a.employeeId.toLowerCase().includes(q)) ||
        a.designation?.toLowerCase().includes(q)
      );
    });
  }, [allAdvisors, teamFilter1, searchQuery1]);

  const filteredList2 = useMemo(() => {
    return allAdvisors.filter(a => {
      if (teamFilter2 !== 'all' && a.team !== teamFilter2) return false;
      if (!searchQuery2.trim()) return true;
      const q = searchQuery2.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        (a.employeeId && a.employeeId.toLowerCase().includes(q)) ||
        a.designation?.toLowerCase().includes(q)
      );
    });
  }, [allAdvisors, teamFilter2, searchQuery2]);

  // Quick Action Presets
  const handleSelectTop2 = () => {
    if (rankedAdvisors.length >= 2) {
      setAdvisor1Id(rankedAdvisors[0].id);
      setAdvisor2Id(rankedAdvisors[1].id);
    }
  };

  const handleSelectStationedVsVirtual = () => {
    const topStationed = rankedAdvisors.find(a => a.team === 'stationed');
    const topVirtual = rankedAdvisors.find(a => a.team === 'virtual');
    if (topStationed) setAdvisor1Id(topStationed.id);
    if (topVirtual) setAdvisor2Id(topVirtual.id);
  };

  const handleSwapAdvisors = () => {
    const temp = advisor1Id;
    setAdvisor1Id(advisor2Id);
    setAdvisor2Id(temp);
  };

  const handleRandomMatchup = () => {
    if (allAdvisors.length < 2) return;
    const idx1 = Math.floor(Math.random() * allAdvisors.length);
    let idx2 = Math.floor(Math.random() * allAdvisors.length);
    while (idx2 === idx1 && allAdvisors.length > 1) {
      idx2 = Math.floor(Math.random() * allAdvisors.length);
    }
    setAdvisor1Id(allAdvisors[idx1].id);
    setAdvisor2Id(allAdvisors[idx2].id);
  };

  // Max bounds across dataset for normalization
  const maxSales = useMemo(() => Math.max(...allAdvisors.map(a => a.sales), 100000), [allAdvisors]);
  const maxReach = useMemo(() => Math.max(...allAdvisors.map(a => a.reach), 200), [allAdvisors]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    if (!advisor1 || !advisor2) return [];

    const name1 = advisor1.name.split(' ')[0] || 'Advisor 1';
    const name2 = advisor2.name.split(' ')[0] || 'Advisor 2';

    if (chartMode === 'normalized') {
      // Benchmark normalized metrics (0-100%)
      const salesPct1 = maxSales > 0 ? Math.min(100, Math.round((advisor1.sales / maxSales) * 100)) : 0;
      const salesPct2 = maxSales > 0 ? Math.min(100, Math.round((advisor2.sales / maxSales) * 100)) : 0;

      const reachPct1 = maxReach > 0 ? Math.min(100, Math.round((advisor1.reach / maxReach) * 100)) : 0;
      const reachPct2 = maxReach > 0 ? Math.min(100, Math.round((advisor2.reach / maxReach) * 100)) : 0;

      const examPct1 = Math.min(100, advisor1.examMark);
      const examPct2 = Math.min(100, advisor2.examMark);

      const cePct1 = Math.min(100, advisor1.ceCount > 0 ? 100 : (advisor1.kpiScore >= 70 ? 85 : 50));
      const cePct2 = Math.min(100, advisor2.ceCount > 0 ? 100 : (advisor2.kpiScore >= 70 ? 85 : 50));

      const rawMetrics = [
        {
          key: 'kpi',
          metric: 'Overall KPI',
          metricFull: 'Overall KPI Score (%)',
          [name1]: advisor1.kpiScore,
          [name2]: advisor2.kpiScore,
          val1: `${advisor1.kpiScore.toFixed(1)}%`,
          val2: `${advisor2.kpiScore.toFixed(1)}%`,
          unit: '%',
          higherIsBetter: true,
          delta: advisor1.kpiScore - advisor2.kpiScore,
        },
        {
          key: 'sales',
          metric: 'Sales Benchmark',
          metricFull: 'Sales Revenue vs Top Target',
          [name1]: salesPct1,
          [name2]: salesPct2,
          val1: `৳${advisor1.sales.toLocaleString('en-BD')}`,
          val2: `৳${advisor2.sales.toLocaleString('en-BD')}`,
          unit: '% of Max',
          higherIsBetter: true,
          delta: salesPct1 - salesPct2,
        },
        {
          key: 'reach',
          metric: 'Reach Volume',
          metricFull: 'Reach Call Volume vs Peak',
          [name1]: reachPct1,
          [name2]: reachPct2,
          val1: `${advisor1.reach} calls`,
          val2: `${advisor2.reach} calls`,
          unit: '% of Max',
          higherIsBetter: true,
          delta: reachPct1 - reachPct2,
        },
        {
          key: 'exam',
          metric: 'Exam / Audit',
          metricFull: 'Assessment & Audit Mark',
          [name1]: examPct1,
          [name2]: examPct2,
          val1: `${advisor1.examMark}%`,
          val2: `${advisor2.examMark}%`,
          unit: '%',
          higherIsBetter: true,
          delta: examPct1 - examPct2,
        },
        {
          key: 'quality',
          metric: 'Quality & CE',
          metricFull: 'Quality Compliance Rating',
          [name1]: cePct1,
          [name2]: cePct2,
          val1: `${advisor1.ceCount} audits`,
          val2: `${advisor2.ceCount} audits`,
          unit: 'Score',
          higherIsBetter: true,
          delta: cePct1 - cePct2,
        },
      ];

      if (focusMetric !== 'all') {
        return rawMetrics.filter(m => m.key === focusMetric);
      }
      return rawMetrics;
    } else {
      // Direct Absolute Metrics
      const rawMetrics = [
        {
          key: 'kpi',
          metric: 'KPI Score (%)',
          metricFull: 'Overall KPI Score',
          [name1]: advisor1.kpiScore,
          [name2]: advisor2.kpiScore,
          val1: `${advisor1.kpiScore.toFixed(1)}%`,
          val2: `${advisor2.kpiScore.toFixed(1)}%`,
          unit: '%',
          higherIsBetter: true,
          delta: advisor1.kpiScore - advisor2.kpiScore,
        },
        {
          key: 'sales',
          metric: 'Sales (in ৳k)',
          metricFull: 'Final Sales Revenue',
          [name1]: Math.round(advisor1.sales / 1000),
          [name2]: Math.round(advisor2.sales / 1000),
          val1: `৳${advisor1.sales.toLocaleString('en-BD')}`,
          val2: `৳${advisor2.sales.toLocaleString('en-BD')}`,
          unit: 'k ৳',
          higherIsBetter: true,
          delta: (advisor1.sales - advisor2.sales) / 1000,
        },
        {
          key: 'reach',
          metric: 'Reach Calls',
          metricFull: 'Average Reach Calls',
          [name1]: advisor1.reach,
          [name2]: advisor2.reach,
          val1: `${advisor1.reach} calls`,
          val2: `${advisor2.reach} calls`,
          unit: 'Calls',
          higherIsBetter: true,
          delta: advisor1.reach - advisor2.reach,
        },
        {
          key: 'exam',
          metric: 'Exam Mark',
          metricFull: 'Exam Assessment Mark',
          [name1]: advisor1.examMark,
          [name2]: advisor2.examMark,
          val1: `${advisor1.examMark}%`,
          val2: `${advisor2.examMark}%`,
          unit: 'Marks',
          higherIsBetter: true,
          delta: advisor1.examMark - advisor2.examMark,
        },
      ];

      if (focusMetric !== 'all') {
        return rawMetrics.filter(m => m.key === focusMetric);
      }
      return rawMetrics;
    }
  }, [advisor1, advisor2, chartMode, maxSales, maxReach, focusMetric]);

  // Calculate Head-to-Head Win Counts
  const headToHead = useMemo(() => {
    if (!advisor1 || !advisor2) {
      return { wins1: 0, wins2: 0, ties: 0, total: 0 };
    }

    let wins1 = 0;
    let wins2 = 0;
    let ties = 0;

    // 1. KPI Score
    if (advisor1.kpiScore > advisor2.kpiScore) wins1++;
    else if (advisor2.kpiScore > advisor1.kpiScore) wins2++;
    else ties++;

    // 2. Sales
    if (advisor1.sales > advisor2.sales) wins1++;
    else if (advisor2.sales > advisor1.sales) wins2++;
    else ties++;

    // 3. Reach Calls
    if (advisor1.reach > advisor2.reach) wins1++;
    else if (advisor2.reach > advisor1.reach) wins2++;
    else ties++;

    // 4. Exam Mark
    if (advisor1.examMark > advisor2.examMark) wins1++;
    else if (advisor2.examMark > advisor1.examMark) wins2++;
    else ties++;

    // 5. Incentive
    if (advisor1.incentive > advisor2.incentive) wins1++;
    else if (advisor2.incentive > advisor1.incentive) wins2++;
    else ties++;

    return { wins1, wins2, ties, total: 5 };
  }, [advisor1, advisor2]);

  // Semantic Grade badge helper
  const getGradeStyle = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
      case 'B':
        return 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30';
      case 'C':
        return 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30';
      case 'D':
        return 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
      case 'PIP':
      default:
        return 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30';
    }
  };

  const name1 = advisor1?.name.split(' ')[0] || 'Advisor 1';
  const name2 = advisor2?.name.split(' ')[0] || 'Advisor 2';

  if (!advisor1 || !advisor2) {
    return null;
  }

  return (
    <motion.div
      id="advisor-kpi-comparison-section"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 relative overflow-hidden transition-all"
    >
      {/* Background Ambient Gradient Accents */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex flex-col items-start gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Advisor KPI Head-to-Head Comparison
            </h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60 font-mono shadow-2xs">
              Side-by-Side Analytics
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Select any two advisors across Stationed and Virtual divisions to contrast overall KPI performance scores, sales revenue, and operational velocity.
          </p>
        </div>

        {/* Quick Matchup Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">Presets:</span>
          
          <button
            type="button"
            onClick={handleSelectTop2}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Compare the #1 and #2 overall performers"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Top 2 Overall</span>
          </button>

          <button
            type="button"
            onClick={handleSelectStationedVsVirtual}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Compare Top Stationed Performer vs Top Virtual Performer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>ST #1 vs VT #1</span>
          </button>

          <button
            type="button"
            onClick={handleRandomMatchup}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-[#1E293B] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Pick a random pair of advisors"
          >
            <Shuffle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Random</span>
          </button>

          <button
            type="button"
            onClick={handleSwapAdvisors}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 transition-all cursor-pointer shadow-2xs"
            title="Swap Advisor 1 and Advisor 2"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
        </div>
      </div>

      {/* Dual Selector Bar & Head-to-Head Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Advisor 1 Selector & Card (Left Column - 5 Cols) */}
        <div className="md:col-span-5 relative" ref={dropdownRef1}>
          <div className="bg-white dark:bg-[#1E293B] border-2 border-sky-300 dark:border-sky-600/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs relative overflow-hidden transition-all">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 to-cyan-400" />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  1
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  Primary Advisor
                </span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase font-mono ${getGradeStyle(advisor1.grade)}`}>
                Grade {advisor1.grade}
              </span>
            </div>

            {/* Custom Dropdown Trigger */}
            <button
              type="button"
              id="advisor-1-selector-btn"
              onClick={() => setOpenSelector(openSelector === 'adv1' ? 'none' : 'adv1')}
              className="w-full flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-400 p-3 rounded-xl shadow-2xs text-left cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/70 text-sky-700 dark:text-sky-300 font-black text-sm flex items-center justify-center shrink-0">
                  {advisor1.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-slate-900 dark:text-white truncate group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                      {advisor1.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({advisor1.employeeId})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="capitalize text-sky-700 dark:text-sky-400 font-bold">{advisor1.team} Team</span>
                    <span>•</span>
                    <span className="truncate">{advisor1.designation}</span>
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openSelector === 'adv1' ? 'rotate-180 text-sky-500' : ''}`} />
            </button>

            {/* Quick Metrics Bar for Advisor 1 */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">KPI Score</span>
                <span className="text-base font-black text-sky-700 dark:text-sky-400 font-mono">{advisor1.kpiDisplay}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Sales</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono truncate block">৳{(advisor1.sales / 1000).toFixed(0)}k</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Reach</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{advisor1.reach}</span>
              </div>
            </div>

            {/* View Profile Action */}
            {onSelectAdvisor && (
              <button
                type="button"
                onClick={() => onSelectAdvisor(advisor1.raw, advisor1.team)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition-colors cursor-pointer"
              >
                <span>View Full Advisor Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Searchable Dropdown Overlay 1 */}
          <AnimatePresence>
            {openSelector === 'adv1' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden p-3 space-y-2.5 max-h-96 flex flex-col"
              >
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery1}
                    onChange={(e) => setSearchQuery1(e.target.value)}
                    placeholder="Search advisor by name or ID..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-sky-500"
                    autoFocus
                  />
                </div>

                {/* Team Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTeamFilter1('all')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                      teamFilter1 === 'all' ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    All ({allAdvisors.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamFilter1('stationed')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                      teamFilter1 === 'stationed' ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Stationed ({stationedAdvisors.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamFilter1('virtual')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                      teamFilter1 === 'virtual' ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Virtual ({virtualAdvisors.length})
                  </button>
                </div>

                {/* Advisors Scroll List */}
                <div className="overflow-y-auto space-y-1 flex-1 pr-1 max-h-56">
                  {filteredList1.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No advisors match your search.
                    </div>
                  ) : (
                    filteredList1.map(adv => (
                      <button
                        key={`select-adv1-${adv.id}`}
                        type="button"
                        onClick={() => {
                          setAdvisor1Id(adv.id);
                          setOpenSelector('none');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                          adv.id === advisor1Id
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {adv.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold truncate">{adv.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {adv.team === 'stationed' ? 'Stationed' : 'Virtual'} • KPI: {adv.kpiDisplay} • ৳{adv.sales.toLocaleString('en-BD')}
                            </div>
                          </div>
                        </div>
                        {adv.id === advisor1Id && (
                          <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center VS Matchup Badge (Center Column - 1 Col) */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-amber-400 font-black text-xs flex items-center justify-center shadow-lg transform rotate-45">
              <span className="transform -rotate-45 font-mono tracking-tighter">VS</span>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute -inset-1 rounded-2xl border border-dashed border-sky-400/30 pointer-events-none"
            />
          </div>
          
          <div className="mt-3 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-mono">
              Score
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
              {headToHead.wins1} - {headToHead.wins2}
            </span>
          </div>
        </div>

        {/* Advisor 2 Selector & Card (Right Column - 5 Cols) */}
        <div className="md:col-span-5 relative" ref={dropdownRef2}>
          <div className="bg-white dark:bg-[#1E293B] border-2 border-emerald-300 dark:border-emerald-600/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs relative overflow-hidden transition-all">
            {/* Top Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Comparison Advisor
                </span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase font-mono ${getGradeStyle(advisor2.grade)}`}>
                Grade {advisor2.grade}
              </span>
            </div>

            {/* Custom Dropdown Trigger */}
            <button
              type="button"
              id="advisor-2-selector-btn"
              onClick={() => setOpenSelector(openSelector === 'adv2' ? 'none' : 'adv2')}
              className="w-full flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-400 p-3 rounded-xl shadow-2xs text-left cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 font-black text-sm flex items-center justify-center shrink-0">
                  {advisor2.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {advisor2.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({advisor2.employeeId})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="capitalize text-emerald-700 dark:text-emerald-400 font-bold">{advisor2.team} Team</span>
                    <span>•</span>
                    <span className="truncate">{advisor2.designation}</span>
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openSelector === 'adv2' ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>

            {/* Quick Metrics Bar for Advisor 2 */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">KPI Score</span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">{advisor2.kpiDisplay}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Sales</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono truncate block">৳{(advisor2.sales / 1000).toFixed(0)}k</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Reach</span>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{advisor2.reach}</span>
              </div>
            </div>

            {/* View Profile Action */}
            {onSelectAdvisor && (
              <button
                type="button"
                onClick={() => onSelectAdvisor(advisor2.raw, advisor2.team)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <span>View Full Advisor Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Searchable Dropdown Overlay 2 */}
          <AnimatePresence>
            {openSelector === 'adv2' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden p-3 space-y-2.5 max-h-96 flex flex-col"
              >
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery2}
                    onChange={(e) => setSearchQuery2(e.target.value)}
                    placeholder="Search advisor by name or ID..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                {/* Team Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTeamFilter2('all')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                      teamFilter2 === 'all' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    All ({allAdvisors.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamFilter2('stationed')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                      teamFilter2 === 'stationed' ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Stationed ({stationedAdvisors.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamFilter2('virtual')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                      teamFilter2 === 'virtual' ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Virtual ({virtualAdvisors.length})
                  </button>
                </div>

                {/* Advisors Scroll List */}
                <div className="overflow-y-auto space-y-1 flex-1 pr-1 max-h-56">
                  {filteredList2.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No advisors match your search.
                    </div>
                  ) : (
                    filteredList2.map(adv => (
                      <button
                        key={`select-adv2-${adv.id}`}
                        type="button"
                        onClick={() => {
                          setAdvisor2Id(adv.id);
                          setOpenSelector('none');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                          adv.id === advisor2Id
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {adv.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold truncate">{adv.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {adv.team === 'stationed' ? 'Stationed' : 'Virtual'} • KPI: {adv.kpiDisplay} • ৳{adv.sales.toLocaleString('en-BD')}
                            </div>
                          </div>
                        </div>
                        {adv.id === advisor2Id && (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Side-by-Side Bar Chart Component */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Comparative KPI Metrics Chart
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              ({chartMode === 'normalized' ? '0-100% Normalized Scale' : 'Raw Values Scale'})
            </span>
          </div>

          {/* Chart Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setChartMode('normalized')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                  chartMode === 'normalized'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Normalized 0-100% scale for direct multi-KPI comparison"
              >
                Benchmark (0-100%)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('absolute')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                  chartMode === 'absolute'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Raw operational numbers"
              >
                Raw Metrics
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
              barGap={6}
            >
              <defs>
                <linearGradient id="advisor1BarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="advisor2BarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis
                dataKey="metric"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                domain={chartMode === 'normalized' ? [0, 100] : ['auto', 'auto']}
                unit={chartMode === 'normalized' ? '%' : ''}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const itemData = payload[0].payload;
                    const val1 = payload[0].value;
                    const val2 = payload[1]?.value;
                    const isAdv1Leader = Number(val1) > Number(val2);
                    const isAdv2Leader = Number(val2) > Number(val1);

                    return (
                      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs space-y-2 max-w-xs text-slate-900 dark:text-white">
                        <div className="font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1.5 flex items-center justify-between">
                          <span>{itemData.metricFull || label}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{itemData.unit}</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold">
                              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                              <span>{advisor1.name}:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-black text-slate-900 dark:text-white">{itemData.val1}</span>
                              {isAdv1Leader && <Crown className="w-3 h-3 text-amber-500 fill-amber-400 inline" />}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                              <span>{advisor2.name}:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-black text-slate-900 dark:text-white">{itemData.val2}</span>
                              {isAdv2Leader && <Crown className="w-3 h-3 text-amber-500 fill-amber-400 inline" />}
                            </div>
                          </div>
                        </div>

                        {/* Delta Advantage Indicator */}
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500 dark:text-slate-400">Difference:</span>
                          <span className={Number(val1) >= Number(val2) ? 'text-sky-700 dark:text-sky-400 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
                            {Number(val1) > Number(val2) 
                              ? `${advisor1.name.split(' ')[0]} +${Math.abs(Number(val1) - Number(val2)).toFixed(1)}${itemData.unit === '%' ? '%' : ''}`
                              : Number(val2) > Number(val1)
                              ? `${advisor2.name.split(' ')[0]} +${Math.abs(Number(val2) - Number(val1)).toFixed(1)}${itemData.unit === '%' ? '%' : ''}`
                              : 'Equal Tie'}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}
                formatter={(value) => {
                  if (value === name1) return `${advisor1.name} (${advisor1.team.toUpperCase()})`;
                  if (value === name2) return `${advisor2.name} (${advisor2.team.toUpperCase()})`;
                  return value;
                }}
              />

              {/* Bar 1 for Advisor 1 (Sky Blue) */}
              <Bar
                dataKey={name1}
                fill="url(#advisor1BarGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                animationDuration={600}
              />

              {/* Bar 2 for Advisor 2 (Emerald Green) */}
              <Bar
                dataKey={name2}
                fill="url(#advisor2BarGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                animationDuration={600}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Head-to-Head Detailed KPI Scorecard Matrix */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3 px-4">Performance Metric</th>
              <th className="py-3 px-4 text-sky-700 dark:text-sky-400 font-black">
                {advisor1.name} <span className="font-normal font-mono opacity-80">({advisor1.team})</span>
              </th>
              <th className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-black">
                {advisor2.name} <span className="font-normal font-mono opacity-80">({advisor2.team})</span>
              </th>
              <th className="py-3 px-4 text-center">Variance / Delta</th>
              <th className="py-3 px-4 text-right">Advantage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
            {/* 1. Overall KPI */}
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="py-3 px-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Overall KPI Score</span>
              </td>
              <td className="py-3 px-4 font-mono font-bold text-sky-700 dark:text-sky-400">
                {advisor1.kpiDisplay}
              </td>
              <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {advisor2.kpiDisplay}
              </td>
              <td className="py-3 px-4 text-center font-mono font-bold">
                {advisor1.kpiScore !== advisor2.kpiScore ? (
                  <span className={advisor1.kpiScore > advisor2.kpiScore ? 'text-sky-700 dark:text-sky-400' : 'text-emerald-700 dark:text-emerald-400'}>
                    {advisor1.kpiScore > advisor2.kpiScore ? '+' : ''}{(advisor1.kpiScore - advisor2.kpiScore).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-slate-400">0.0%</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                {advisor1.kpiScore > advisor2.kpiScore ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> {advisor1.name.split(' ')[0]} (+{(advisor1.kpiScore - advisor2.kpiScore).toFixed(1)}%)
                  </span>
                ) : advisor2.kpiScore > advisor1.kpiScore ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> {advisor2.name.split(' ')[0]} (+{(advisor2.kpiScore - advisor1.kpiScore).toFixed(1)}%)
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Tied</span>
                )}
              </td>
            </tr>

            {/* 2. Sales Revenue */}
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="py-3 px-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Final Sales Revenue</span>
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                ৳{advisor1.sales.toLocaleString('en-BD')}
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                ৳{advisor2.sales.toLocaleString('en-BD')}
              </td>
              <td className="py-3 px-4 text-center font-mono font-bold">
                {advisor1.sales !== advisor2.sales ? (
                  <span className={advisor1.sales > advisor2.sales ? 'text-sky-700 dark:text-sky-400' : 'text-emerald-700 dark:text-emerald-400'}>
                    {advisor1.sales > advisor2.sales ? '+' : ''}৳{(advisor1.sales - advisor2.sales).toLocaleString('en-BD')}
                  </span>
                ) : (
                  <span className="text-slate-400">৳0</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                {advisor1.sales > advisor2.sales ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> {advisor1.name.split(' ')[0]} (+৳{(advisor1.sales - advisor2.sales).toLocaleString('en-BD')})
                  </span>
                ) : advisor2.sales > advisor1.sales ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> {advisor2.name.split(' ')[0]} (+৳{(advisor2.sales - advisor1.sales).toLocaleString('en-BD')})
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Tied</span>
                )}
              </td>
            </tr>

            {/* 3. Reach Calls */}
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="py-3 px-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <PhoneCall className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Reach Call Count</span>
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                {advisor1.reach} calls
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                {advisor2.reach} calls
              </td>
              <td className="py-3 px-4 text-center font-mono font-bold">
                {advisor1.reach !== advisor2.reach ? (
                  <span className={advisor1.reach > advisor2.reach ? 'text-sky-700 dark:text-sky-400' : 'text-emerald-700 dark:text-emerald-400'}>
                    {advisor1.reach > advisor2.reach ? '+' : ''}{advisor1.reach - advisor2.reach}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                {advisor1.reach > advisor2.reach ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> {advisor1.name.split(' ')[0]} (+{advisor1.reach - advisor2.reach})
                  </span>
                ) : advisor2.reach > advisor1.reach ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> {advisor2.name.split(' ')[0]} (+{advisor2.reach - advisor1.reach})
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Tied</span>
                )}
              </td>
            </tr>

            {/* 4. Exam / Knowledge Audit */}
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="py-3 px-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Exam Mark</span>
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                {advisor1.examMark}%
              </td>
              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                {advisor2.examMark}%
              </td>
              <td className="py-3 px-4 text-center font-mono font-bold">
                {advisor1.examMark !== advisor2.examMark ? (
                  <span className={advisor1.examMark > advisor2.examMark ? 'text-sky-700 dark:text-sky-400' : 'text-emerald-700 dark:text-emerald-400'}>
                    {advisor1.examMark > advisor2.examMark ? '+' : ''}{(advisor1.examMark - advisor2.examMark).toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-slate-400">0%</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                {advisor1.examMark > advisor2.examMark ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> {advisor1.name.split(' ')[0]} (+{(advisor1.examMark - advisor2.examMark).toFixed(0)}%)
                  </span>
                ) : advisor2.examMark > advisor1.examMark ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> {advisor2.name.split(' ')[0]} (+{(advisor2.examMark - advisor1.examMark).toFixed(0)}%)
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Tied</span>
                )}
              </td>
            </tr>

            {/* 5. Performance Grade */}
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="py-3 px-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Performance Tier / Grade</span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase font-mono ${getGradeStyle(advisor1.grade)}`}>
                  Grade {advisor1.grade}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase font-mono ${getGradeStyle(advisor2.grade)}`}>
                  Grade {advisor2.grade}
                </span>
              </td>
              <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                {advisor1.grade === advisor2.grade ? 'Same Tier' : `${advisor1.grade} vs ${advisor2.grade}`}
              </td>
              <td className="py-3 px-4 text-right">
                {advisor1.grade < advisor2.grade ? (
                  <span className="text-sky-700 dark:text-sky-400 font-bold text-[11px]">
                    {advisor1.name.split(' ')[0]} Higher Tier
                  </span>
                ) : advisor2.grade < advisor1.grade ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                    {advisor2.name.split(' ')[0]} Higher Tier
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Equal Tier</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
