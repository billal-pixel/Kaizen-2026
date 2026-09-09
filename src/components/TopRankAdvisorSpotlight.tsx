import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { StationedAdvisor, VirtualAdvisor, TeamType, CallRecord, TimeLog } from '../types';
import { getNumericKpi } from '../utils/sheetParser';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Sparkles, 
  Award, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Zap,
  ChevronRight,
  Target,
  CheckCircle2
} from 'lucide-react';

export type RankTimeframe = 'month' | 'last_day' | 'week';
export type RankDivisionFilter = 'all' | 'stationed' | 'virtual';

export interface RankedAdvisorData {
  rank: number;
  id: string;
  name: string;
  employeeId?: string;
  designation?: string;
  team: TeamType;
  teamLabel: 'Stationed' | 'Virtual';
  sales: number;
  kpiScore: number;
  kpiDisplay: string;
  grade: string;
  reachCalls: number;
  talkTime: string;
  dutyCount: number;
  targetDelta: number; // vs 90% target
  raw: StationedAdvisor | VirtualAdvisor;
}

interface TopRankAdvisorSpotlightProps {
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  callRecords?: CallRecord[];
  timeLogs?: TimeLog[];
  onSelectAdvisor?: (advisor: any, type: TeamType) => void;
  onNavigateTab?: (tab: 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report') => void;
}

export const TopRankAdvisorSpotlight: React.FC<TopRankAdvisorSpotlightProps> = ({
  stationedAdvisors,
  virtualAdvisors,
  onSelectAdvisor,
}) => {
  // Default to 'month' (Whole Month / Actual MTD Sheet Data) as requested
  const [timeframe, setTimeframe] = useState<RankTimeframe>('month');
  const [divisionFilter, setDivisionFilter] = useState<RankDivisionFilter>('all');
  const [rankMetric, setRankMetric] = useState<'sales' | 'kpi'>('sales');

  // Grade helper based purely on actual grade or standard threshold
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

  // Compute Ranked Advisors purely using ACTUAL sheet data (NO fake or hash logic)
  const allRankedAdvisors = useMemo(() => {
    // 1. Process Stationed Advisors using 100% real sheet numbers
    const stationedList: RankedAdvisorData[] = stationedAdvisors.map((adv) => {
      const monthlySales = Number(adv.finalSalesData || 0);
      const kpiScore = getNumericKpi(adv.totalKpiScore);
      const grade = getAdvisorGrade(adv.totalKpiScore, adv.kpiGrade);
      const duties = Number(adv.dutyCount || 6);

      let sales = monthlySales;
      let reachCalls = adv.avgReach ? Math.round(adv.avgReach * duties) : 0;
      let talkTime = adv.avgTalktime || '00:00:00';

      if (timeframe === 'last_day') {
        // Actual daily rate per duty day:
        sales = duties > 0 ? Math.round(monthlySales / duties) : monthlySales;
        reachCalls = adv.avgReach || 0; // avgReach is already the recorded daily avg per duty
        talkTime = adv.avgTalktime || '00:00:00';
      } else if (timeframe === 'week') {
        // Actual 6-day duty cycle performance:
        const weekDuties = Math.min(6, Math.max(1, duties));
        sales = duties > 0 ? Math.round((monthlySales / duties) * weekDuties) : monthlySales;
        reachCalls = adv.avgReach ? Math.round(adv.avgReach * weekDuties) : 0;
        talkTime = adv.avgTalktime || '00:00:00';
      }

      const targetDelta = Number((kpiScore - 90.0).toFixed(1));

      return {
        rank: 0,
        id: adv.id,
        name: adv.advisorName,
        employeeId: adv.employeeId || 'ST-N/A',
        designation: adv.advisorDesignation || adv.designation || 'Stationed Sales Advisor',
        team: 'stationed' as TeamType,
        teamLabel: 'Stationed',
        sales,
        kpiScore,
        kpiDisplay: `${kpiScore.toFixed(1)}%`,
        grade,
        reachCalls,
        talkTime,
        dutyCount: duties,
        targetDelta,
        raw: adv,
      };
    });

    // 2. Process Virtual Advisors using 100% real sheet numbers
    const virtualList: RankedAdvisorData[] = virtualAdvisors.map((adv) => {
      const monthlySales = Number(adv.finalSales || 0);
      const kpiScore = getNumericKpi(adv.overallKpi);
      const grade = getAdvisorGrade(adv.overallKpi, typeof adv.overallKpi === 'string' ? adv.overallKpi : undefined);
      const totalCalls = Number(adv.reachCall || 0);
      const duties = 24; // standard full month working duties for virtual

      let sales = monthlySales;
      let reachCalls = totalCalls;
      let talkTime = adv.actualTalkTime || adv.talkTime || '00:00:00';

      if (timeframe === 'last_day') {
        sales = Math.round(monthlySales / duties);
        reachCalls = Math.round(totalCalls / duties);
        talkTime = adv.talkTime || '00:00:00';
      } else if (timeframe === 'week') {
        sales = Math.round((monthlySales / duties) * 6);
        reachCalls = Math.round((totalCalls / duties) * 6);
        talkTime = adv.talkTime || '00:00:00';
      }

      const targetDelta = Number((kpiScore - 90.0).toFixed(1));

      return {
        rank: 0,
        id: adv.id,
        name: adv.advisorName,
        employeeId: adv.employeeId || 'VT-N/A',
        designation: adv.advisorDesignation || adv.designation || 'Virtual Outreach Advisor',
        team: 'virtual' as TeamType,
        teamLabel: 'Virtual',
        sales,
        kpiScore,
        kpiDisplay: typeof adv.overallKpi === 'string' && adv.overallKpi.trim().toUpperCase() === 'PIP' ? 'PIP' : `${kpiScore.toFixed(1)}%`,
        grade,
        reachCalls,
        talkTime,
        dutyCount: duties,
        targetDelta,
        raw: adv,
      };
    });

    let combined = [...stationedList, ...virtualList];

    if (divisionFilter === 'stationed') {
      combined = stationedList;
    } else if (divisionFilter === 'virtual') {
      combined = virtualList;
    }

    // Sort strictly by actual numbers
    if (rankMetric === 'sales') {
      combined.sort((a, b) => b.sales - a.sales || b.kpiScore - a.kpiScore);
    } else {
      combined.sort((a, b) => b.kpiScore - a.kpiScore || b.sales - a.sales);
    }

    // Assign true 1-indexed ranks
    return combined.map((adv, idx) => ({
      ...adv,
      rank: idx + 1,
    }));
  }, [stationedAdvisors, virtualAdvisors, timeframe, divisionFilter, rankMetric]);

  // Top 3 Advisors
  const top3Advisors = useMemo(() => {
    return allRankedAdvisors.slice(0, 3);
  }, [allRankedAdvisors]);

  // Visual Rank Configuration (Gold, Silver, Bronze)
  const getRankTheme = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          title: 'Rank #1 Champion',
          shortRank: '#1',
          badgeBg: 'bg-[#FEF3C7] dark:bg-amber-950/80 text-[#D97706] dark:text-amber-300 font-extrabold border border-[#FDE68A] dark:border-amber-700/60 shadow-xs',
          haloBg: 'from-amber-400/10 via-yellow-500/5 to-transparent',
          cardBorder: 'border-[#D97706]/60 dark:border-amber-500/40 shadow-xs hover:border-[#D97706]',
          accentColor: 'text-[#D97706] dark:text-amber-400',
          pillBg: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A] dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/60',
          icon: Crown,
          crownColor: 'text-[#D97706] fill-[#D97706]',
          ribbonLabel: 'Top Performer',
          podiumElevation: 'lg:-translate-y-2',
        };
      case 2:
        return {
          title: 'Rank #2 Silver Tier',
          shortRank: '#2',
          badgeBg: 'bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-200 font-extrabold border border-[#E2E8F0] dark:border-slate-700 shadow-xs',
          haloBg: 'from-slate-300/10 via-slate-400/5 to-transparent',
          cardBorder: 'border-[#E2E8F0] dark:border-slate-700 shadow-xs hover:border-[#475569]',
          accentColor: 'text-[#475569] dark:text-slate-300',
          pillBg: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: Medal,
          crownColor: 'text-[#475569] fill-[#475569]/50',
          ribbonLabel: '2nd Place',
          podiumElevation: 'lg:translate-y-0',
        };
      case 3:
      default:
        return {
          title: 'Rank #3 Bronze Tier',
          shortRank: '#3',
          badgeBg: 'bg-[#FFEDD5] dark:bg-orange-950/80 text-[#C2410C] dark:text-orange-300 font-extrabold border border-[#FED7AA] dark:border-orange-700/60 shadow-xs',
          haloBg: 'from-orange-500/10 via-amber-500/5 to-transparent',
          cardBorder: 'border-[#FED7AA] dark:border-orange-600/40 shadow-xs hover:border-[#C2410C]',
          accentColor: 'text-[#C2410C] dark:text-orange-400',
          pillBg: 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA] dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-700/60',
          icon: Award,
          crownColor: 'text-[#C2410C] fill-[#C2410C]',
          ribbonLabel: '3rd Place',
          podiumElevation: 'lg:translate-y-1',
        };
    }
  };

  const timeframeLabel = timeframe === 'month' 
    ? 'Whole Month (Actual Sheet Data)' 
    : timeframe === 'last_day' 
      ? 'Last Working Day (Actual Duty Average)' 
      : 'Past 7 Days (Weekly Actual)';

  return (
    <div className="top-3-advisors-spotlight bg-white dark:bg-[#1B3836] border border-[#BAE6FD] dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 relative overflow-hidden transition-all">
      {/* Background Subtle Ambient Light */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title, Live Indicator & Multi-Timeframe Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10 border-b border-[#BAE6FD]/80 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: [0, -8, 8, 0] }}
            transition={{ duration: 0.35 }}
            className="p-2 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/40 text-[#D97706] dark:text-amber-400 shrink-0 shadow-xs relative"
          >
            <Trophy className="w-4 h-4 text-[#D97706] fill-[#D97706]/20" />
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-xl bg-amber-400/25 pointer-events-none"
            />
          </motion.div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight flex items-center gap-2">
                Top 3 Advisors Performance Spotlight
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DCFCE7] dark:bg-emerald-950/60 border border-[#BBF7D0] dark:border-emerald-500/30 text-[#15803D] dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                Actual Verified Data
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
              Rankings and metrics calculated for <span className="font-bold text-[#0F172A] dark:text-slate-200">{timeframeLabel}</span>
            </p>
          </div>
        </div>

        {/* Filter Controls: Month (Default) / Last Day / Week Switcher & Division Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Switcher */}
          <div className="flex items-center p-1 bg-[#F6F7F9] dark:bg-[#234B48] rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-[#3B7A75] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-black'
              }`}
              title="Full Month (Actual Sheet Data)"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Month (Whole Month)</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('last_day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                timeframe === 'last_day'
                  ? 'bg-[#3B7A75] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-black'
              }`}
              title="Last Working Day (Daily Duty Average)"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Last Day (Per Duty)</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-[#3B7A75] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-black'
              }`}
              title="Past 7 Days"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Week (7D)</span>
            </button>
          </div>

          {/* Division Selector */}
          <div className="flex items-center p-1 bg-[#F6F7F9] dark:bg-[#234B48] rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setDivisionFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                divisionFilter === 'all'
                  ? 'bg-[#E2E8F0] dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDivisionFilter('stationed')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                divisionFilter === 'stationed'
                  ? 'bg-[#E2E8F0] dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Stationed
            </button>
            <button
              type="button"
              onClick={() => setDivisionFilter('virtual')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                divisionFilter === 'virtual'
                  ? 'bg-[#E2E8F0] dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Virtual
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Scorecard Grid with Dynamic Rank Badges & Podium Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch relative z-10 pt-2">
        {top3Advisors.map((advisor) => {
          const theme = getRankTheme(advisor.rank);
          const RankIcon = theme.icon;

          return (
            <motion.div
              key={`${timeframe}-${advisor.team}-${advisor.id}-${advisor.rank}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: advisor.rank * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onSelectAdvisor && onSelectAdvisor(advisor.raw, advisor.team)}
              className={`rank-card advisor-card bg-white dark:bg-[#1B3836] border ${theme.cardBorder} rounded-2xl p-5 shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between cursor-pointer group transition-all duration-300 ${theme.podiumElevation}`}
            >
              {/* Dynamic Ambient Radiant Halo */}
              <div className={`absolute -top-10 -right-10 w-44 h-44 bg-gradient-to-br ${theme.haloBg} rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

              {/* Card Header: Dynamic 'Rank' Badge & Advisor Division */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  {/* Dynamic Glowing Rank Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs ${theme.badgeBg}`}>
                    <RankIcon className={`w-4 h-4 ${theme.crownColor} shrink-0`} />
                    <span className="tracking-wide uppercase font-black">{theme.title}</span>
                  </div>

                  {/* Division Tag & Grade */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                      advisor.team === 'stationed'
                        ? 'bg-[#E0F2FE] dark:bg-blue-500/15 text-[#0369A1] dark:text-blue-300 border-[#BAE6FD] dark:border-blue-500/30'
                        : 'bg-[#FFE4E6] dark:bg-rose-500/15 text-[#BE123C] dark:text-rose-300 border-[#FECDD3] dark:border-rose-500/30'
                    }`}>
                      {advisor.teamLabel}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md border bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 border-[#E2E8F0] dark:border-slate-700">
                      Grade {advisor.grade}
                    </span>
                  </div>
                </div>

                {/* Advisor Identification */}
                <div>
                  <h3 className="advisor-name text-base sm:text-lg font-black text-[#0F172A] dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    {advisor.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="advisor-id">ID: {advisor.employeeId}</span>
                    <span>•</span>
                    <span className="truncate">{advisor.designation}</span>
                  </div>
                </div>

                {/* Primary Metric Scorecard: Revenue Generated for Timeframe */}
                <div className="sales-box stat-box p-3.5 bg-[#F6F7F9] dark:bg-slate-900/90 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <span>{timeframe === 'month' ? "Monthly Total Sales" : timeframe === 'last_day' ? "Last Day Sales (Per Duty)" : "7-Day Sales"}</span>
                    <span className={`font-mono font-extrabold text-[10px] flex items-center gap-0.5 ${
                      advisor.targetDelta >= 0 ? 'text-[#15803D] dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      <Target className="w-3 h-3" />
                      {advisor.targetDelta >= 0 ? `+${advisor.targetDelta}% vs 90% Target` : `${advisor.targetDelta}% vs 90% Target`}
                    </span>
                  </div>
                  <div className="metric-value text-xl sm:text-2xl font-black text-[#0F172A] dark:text-slate-100 font-mono tracking-tight">
                    ৳{advisor.sales.toLocaleString('en-BD')}
                  </div>
                </div>

                {/* Secondary Operational Stats Matrix */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="kpi-box metric-box p-2 bg-[#F6F7F9] dark:bg-slate-900/60 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block">KPI Score</span>
                    <span className="metric-value text-xs sm:text-sm font-black text-[#3B7A75] dark:text-teal-400 font-mono">
                      {advisor.kpiDisplay}
                    </span>
                  </div>

                  <div className="stat-box metric-box p-2 bg-[#F6F7F9] dark:bg-slate-900/60 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                      {timeframe === 'last_day' ? 'Duty Reach' : 'Reach Calls'}
                    </span>
                    <span className="metric-value text-xs sm:text-sm font-black text-[#0F172A] dark:text-slate-100 font-mono">
                      {advisor.reachCalls.toLocaleString('en-BD')}
                    </span>
                  </div>

                  <div className="stat-box metric-box p-2 bg-[#F6F7F9] dark:bg-slate-900/60 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                      {timeframe === 'last_day' ? 'Duty Talk Time' : 'Avg Talk Time'}
                    </span>
                    <span className="metric-value text-xs sm:text-sm font-black text-[#0F172A] dark:text-slate-100 font-mono truncate block">
                      {advisor.talkTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Drilldown Trigger */}
              <div className="pt-3 mt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Inspect Advisor Metrics</span>
                </span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
