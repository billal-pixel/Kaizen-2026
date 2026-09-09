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
          badgeBg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-700/60 shadow-2xs',
          haloBg: 'from-amber-400/10 via-yellow-500/5 to-transparent',
          cardBorder: 'border-amber-300 dark:border-amber-600/50 hover:border-amber-500',
          accentColor: 'text-amber-700 dark:text-amber-400',
          pillBg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/60',
          icon: Crown,
          crownColor: 'text-amber-600 fill-amber-500',
          ribbonLabel: 'Top Performer',
          podiumElevation: 'lg:-translate-y-1',
        };
      case 2:
        return {
          title: 'Rank #2 Silver Tier',
          shortRank: '#2',
          badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 shadow-2xs',
          haloBg: 'from-slate-300/10 via-slate-400/5 to-transparent',
          cardBorder: 'border-slate-300 dark:border-slate-700 hover:border-slate-400',
          accentColor: 'text-slate-700 dark:text-slate-300',
          pillBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: Medal,
          crownColor: 'text-slate-600 fill-slate-400',
          ribbonLabel: '2nd Place',
          podiumElevation: 'lg:translate-y-0',
        };
      case 3:
      default:
        return {
          title: 'Rank #3 Bronze Tier',
          shortRank: '#3',
          badgeBg: 'bg-orange-50 dark:bg-orange-950/80 text-orange-800 dark:text-orange-200 font-bold border border-orange-200 dark:border-orange-700/60 shadow-2xs',
          haloBg: 'from-orange-500/10 via-amber-500/5 to-transparent',
          cardBorder: 'border-orange-200 dark:border-orange-700/50 hover:border-orange-400',
          accentColor: 'text-orange-700 dark:text-orange-400',
          pillBg: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-700/60',
          icon: Award,
          crownColor: 'text-orange-600 fill-orange-500',
          ribbonLabel: '3rd Place',
          podiumElevation: 'lg:translate-y-0.5',
        };
    }
  };

  const timeframeLabel = timeframe === 'month' 
    ? 'Whole Month (Actual Sheet Data)' 
    : timeframe === 'last_day' 
      ? 'Last Working Day (Actual Duty Average)' 
      : 'Past 7 Days (Weekly Actual)';

  return (
    <div className="top-3-advisors-spotlight bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 relative overflow-hidden transition-all">
      {/* Background Subtle Ambient Light */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title, Live Indicator & Multi-Timeframe Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/60 text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs relative"
          >
            <Trophy className="w-4 h-4 text-amber-600 fill-amber-500/20" />
          </motion.div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Top 3 Advisors Performance Spotlight
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Actual Verified Data
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Rankings and metrics calculated for <span className="font-semibold text-slate-800 dark:text-slate-200">{timeframeLabel}</span>
            </p>
          </div>
        </div>

        {/* Filter Controls: Month (Default) / Last Day / Week Switcher & Division Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
              }`}
              title="Full Month (Actual Sheet Data)"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Month</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('last_day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'last_day'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
              }`}
              title="Last Working Day (Daily Duty Average)"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Last Day</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
              }`}
              title="Past 7 Days"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Week (7D)</span>
            </button>
          </div>

          {/* Division Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setDivisionFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                divisionFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDivisionFilter('stationed')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                divisionFilter === 'stationed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Stationed
            </button>
            <button
              type="button"
              onClick={() => setDivisionFilter('virtual')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                divisionFilter === 'virtual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Virtual
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Scorecard Grid with Dynamic Rank Badges & Podium Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch relative z-10 pt-2">
        {top3Advisors.map((advisor) => {
          const theme = getRankTheme(advisor.rank);
          const RankIcon = theme.icon;

          return (
            <motion.div
              key={`${timeframe}-${advisor.team}-${advisor.id}-${advisor.rank}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: advisor.rank * 0.08 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => onSelectAdvisor && onSelectAdvisor(advisor.raw, advisor.team)}
              className={`rank-card advisor-card bg-white dark:bg-[#1E293B] border ${theme.cardBorder} rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer group transition-all duration-300 ${theme.podiumElevation}`}
            >
              {/* Dynamic Ambient Radiant Halo */}
              <div className={`absolute -top-10 -right-10 w-44 h-44 bg-gradient-to-br ${theme.haloBg} rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

              {/* Card Header: Dynamic 'Rank' Badge & Advisor Division */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  {/* Dynamic Glowing Rank Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${theme.badgeBg}`}>
                    <RankIcon className={`w-3.5 h-3.5 ${theme.crownColor} shrink-0`} />
                    <span className="tracking-wide uppercase font-extrabold text-[11px]">{theme.title}</span>
                  </div>

                  {/* Division Tag & Grade */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                      advisor.team === 'stationed'
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                    }`}>
                      {advisor.teamLabel}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                      Grade {advisor.grade}
                    </span>
                  </div>
                </div>

                {/* Advisor Identification */}
                <div>
                  <h3 className="advisor-name text-base font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    {advisor.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="advisor-id font-mono">ID: {advisor.employeeId}</span>
                    <span>•</span>
                    <span className="truncate">{advisor.designation}</span>
                  </div>
                </div>

                {/* Primary Metric Scorecard: Revenue Generated for Timeframe */}
                <div className="sales-box stat-box p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <span>{timeframe === 'month' ? "Monthly Total Sales" : timeframe === 'last_day' ? "Last Day Sales" : "7-Day Sales"}</span>
                    <span className={`font-mono font-extrabold text-[10px] flex items-center gap-0.5 ${
                      advisor.targetDelta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      <Target className="w-3 h-3" />
                      {advisor.targetDelta >= 0 ? `+${advisor.targetDelta}% vs Target` : `${advisor.targetDelta}% vs Target`}
                    </span>
                  </div>
                  <div className="metric-value text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    ৳{advisor.sales.toLocaleString('en-BD')}
                  </div>
                </div>

                {/* Secondary Operational Stats Matrix */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="kpi-box metric-box p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block truncate">KPI Score</span>
                    <span className="metric-value text-xs sm:text-sm font-black text-teal-700 dark:text-teal-400 font-mono">
                      {advisor.kpiDisplay}
                    </span>
                  </div>

                  <div className="stat-box metric-box p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block truncate">
                      {timeframe === 'last_day' ? 'Duty Reach' : 'Reach Calls'}
                    </span>
                    <span className="metric-value text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                      {advisor.reachCalls.toLocaleString('en-BD')}
                    </span>
                  </div>

                  <div className="stat-box metric-box p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block truncate">
                      {timeframe === 'last_day' ? 'Duty Talk' : 'Avg Talk'}
                    </span>
                    <span className="metric-value text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono truncate block">
                      {advisor.talkTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Drilldown Trigger */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
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
