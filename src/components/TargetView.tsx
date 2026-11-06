import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Edit2,
  Check,
  X,
  ChevronRight,
  PhoneCall
} from 'lucide-react';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import { MonthlyTargetPlanner } from './MonthlyTargetPlanner';

interface TargetViewProps {
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  onUpdateStationed: (updated: StationedAdvisor) => void;
  onUpdateVirtual: (updated: VirtualAdvisor) => void;
  onBatchUpdateTargets: (
    updates: Array<{ id: string; division: 'stationed' | 'virtual'; salesTarget: number; callTarget: number }>
  ) => void;
  onSelectAdvisor: (advisor: StationedAdvisor | VirtualAdvisor, type: 'stationed' | 'virtual') => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

type DivisionFilter = 'all' | 'stationed' | 'virtual';
type SortKey = 'attainment' | 'callAttainment' | 'target' | 'achieved' | 'gap';

interface UnifiedTargetRow {
  id: string;
  employeeId: string;
  advisorName: string;
  designation: string;
  subTeam: string;
  division: 'stationed' | 'virtual';
  salesTarget: number;
  achievedSales: number;
  callTarget: number;
  achievedCalls: number;
  remainingGap: number;
  attainmentPct: number;
  kpiScore: string | number;
  kpiGrade: string;
  rawAdvisor: StationedAdvisor | VirtualAdvisor;
}

export const TargetView: React.FC<TargetViewProps> = ({
  stationedAdvisors,
  virtualAdvisors,
  onUpdateStationed,
  onUpdateVirtual,
  onBatchUpdateTargets,
  onSelectAdvisor,
  onShowToast,
}) => {
  const [divisionFilter, setDivisionFilter] = useState<DivisionFilter>('all');
  const [subTeamFilter, setSubTeamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortKey>('attainment');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Inline target editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSalesValue, setEditingSalesValue] = useState<string>('');
  const [editingCallsValue, setEditingCallsValue] = useState<string>('');
  const [spotlightAdvisorId, setSpotlightAdvisorId] = useState<string>('');
  const [spotlightDivision, setSpotlightDivision] = useState<DivisionFilter>('all');
  const [spotlightSubTeam, setSpotlightSubTeam] = useState<string>('all');

  // Build unified rows
  const allRows = useMemo<UnifiedTargetRow[]>(() => {
    const stationedRows: UnifiedTargetRow[] = stationedAdvisors.map((adv) => {
      const target = adv.advisorSalesTarget ?? 0;
      const achieved = adv.finalSalesData ?? 0;
      const callTarget = adv.advisorCallTarget ?? 80;
      const achievedCalls = adv.avgReach ?? 0;
      const gap = Math.max(0, target - achieved);
      const attainment = target > 0 ? (achieved / target) * 100 : 0;

      return {
        id: adv.id,
        employeeId: adv.employeeId || '—',
        advisorName: adv.advisorName,
        designation: adv.advisorDesignation || adv.designation || 'Advisor',
        subTeam: adv.subTeam || 'General',
        division: 'stationed',
        salesTarget: target,
        achievedSales: achieved,
        callTarget,
        achievedCalls,
        remainingGap: gap,
        attainmentPct: attainment,
        kpiScore: adv.totalKpiScore,
        kpiGrade: adv.kpiGrade,
        rawAdvisor: adv,
      };
    });

    const virtualRows: UnifiedTargetRow[] = virtualAdvisors.map((adv) => {
      const target = adv.advisorSalesTarget ?? 0;
      const achieved = adv.finalSales ?? 0;
      const callTarget = adv.advisorCallTarget ?? 100;
      const achievedCalls = adv.reachCall ?? 0;
      const gap = Math.max(0, target - achieved);
      const attainment = target > 0 ? (achieved / target) * 100 : 0;

      return {
        id: adv.id,
        employeeId: adv.employeeId || '—',
        advisorName: adv.advisorName,
        designation: adv.advisorDesignation || adv.designation || 'Virtual Advisor',
        subTeam: adv.subTeam || 'Virtual',
        division: 'virtual',
        salesTarget: target,
        achievedSales: achieved,
        callTarget,
        achievedCalls,
        remainingGap: gap,
        attainmentPct: attainment,
        kpiScore: adv.overallKpi,
        kpiGrade: typeof adv.overallKpi === 'string' ? adv.overallKpi : '—',
        rawAdvisor: adv,
      };
    });

    return [...stationedRows, ...virtualRows];
  }, [stationedAdvisors, virtualAdvisors]);

  // Available sub-teams
  const subTeams = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => {
      if (divisionFilter === 'all' || r.division === divisionFilter) {
        if (r.subTeam) set.add(r.subTeam);
      }
    });
    return ['all', ...Array.from(set)];
  }, [allRows, divisionFilter]);

  // Filtered & sorted rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRows
      .filter((r) => {
        if (divisionFilter !== 'all' && r.division !== divisionFilter) return false;
        if (subTeamFilter !== 'all' && r.subTeam.toLowerCase() !== subTeamFilter.toLowerCase()) return false;
        if (q) {
          const matchName = r.advisorName.toLowerCase().includes(q);
          const matchId = r.employeeId.toLowerCase().includes(q);
          const matchSub = r.subTeam.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchSub) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'attainment') diff = a.attainmentPct - b.attainmentPct;
        else if (sortBy === 'callAttainment') {
          const callA = a.callTarget > 0 ? (a.achievedCalls / a.callTarget) * 100 : 0;
          const callB = b.callTarget > 0 ? (b.achievedCalls / b.callTarget) * 100 : 0;
          diff = callA - callB;
        }
        else if (sortBy === 'target') diff = a.salesTarget - b.salesTarget;
        else if (sortBy === 'achieved') diff = a.achievedSales - b.achievedSales;
        else if (sortBy === 'gap') diff = a.remainingGap - b.remainingGap;
        return sortDir === 'desc' ? -diff : diff;
      });
  }, [allRows, divisionFilter, subTeamFilter, searchQuery, sortBy, sortDir]);

  // Summary totals for active filter
  const summary = useMemo(() => {
    const totalTarget = filteredRows.reduce((acc, r) => acc + r.salesTarget, 0);
    const totalAchieved = filteredRows.reduce((acc, r) => acc + r.achievedSales, 0);
    const totalGap = Math.max(0, totalTarget - totalAchieved);
    const attainmentPct = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
    const onTrackCount = filteredRows.filter((r) => r.salesTarget > 0 && r.attainmentPct >= 50).length;
    const withTargetCount = filteredRows.filter((r) => r.salesTarget > 0).length;

    return {
      totalTarget,
      totalAchieved,
      totalGap,
      attainmentPct,
      onTrackCount,
      withTargetCount,
    };
  }, [filteredRows]);

  // Main Team (Station vs Virtual) breakdown
  const mainTeamBreakdown = useMemo(() => {
    const divisions: Array<{ key: 'stationed' | 'virtual'; label: string }> = [
      { key: 'stationed', label: 'Station Team' },
      { key: 'virtual', label: 'Virtual Team' },
    ];
    return divisions.map(({ key, label }) => {
      const rows = allRows.filter((r) => r.division === key);
      const salesTarget = rows.reduce((acc, r) => acc + r.salesTarget, 0);
      const achievedSales = rows.reduce((acc, r) => acc + r.achievedSales, 0);
      const callTarget = rows.reduce((acc, r) => acc + r.callTarget, 0);
      const achievedCalls = rows.reduce((acc, r) => acc + r.achievedCalls, 0);
      return {
        key,
        label,
        count: rows.length,
        salesTarget,
        achievedSales,
        callTarget,
        achievedCalls,
      };
    });
  }, [allRows]);

  // Sub-team breakdown cards (for rows with targets or stationed sub-teams)
  const subTeamBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; target: number; achieved: number; callTarget: number; achievedCalls: number }
    >();
    filteredRows.forEach((r) => {
      const key = r.subTeam || 'General';
      const existing = map.get(key) || {
        name: key,
        count: 0,
        target: 0,
        achieved: 0,
        callTarget: 0,
        achievedCalls: 0,
      };
      existing.count += 1;
      existing.target += r.salesTarget;
      existing.achieved += r.achievedSales;
      existing.callTarget += r.callTarget;
      existing.achievedCalls += r.achievedCalls;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.target - a.target);
  }, [filteredRows]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const startEditing = (row: UnifiedTargetRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(row.id);
    setEditingSalesValue(String(row.salesTarget));
    setEditingCallsValue(String(row.callTarget));
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingSalesValue('');
    setEditingCallsValue('');
  };

  const saveEditing = (row: UnifiedTargetRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const numericSales = Math.max(0, Math.round(Number(editingSalesValue.replace(/[^0-9.]/g, '')) || 0));
    const numericCalls = Math.max(0, Math.round(Number(editingCallsValue.replace(/[^0-9.]/g, '')) || 0));
    if (row.division === 'stationed') {
      onUpdateStationed({
        ...(row.rawAdvisor as StationedAdvisor),
        advisorSalesTarget: numericSales,
        advisorCallTarget: numericCalls,
      });
    } else {
      onUpdateVirtual({
        ...(row.rawAdvisor as VirtualAdvisor),
        advisorSalesTarget: numericSales,
        advisorCallTarget: numericCalls,
      });
    }
    setEditingId(null);
    setEditingSalesValue('');
    setEditingCallsValue('');
    if (onShowToast) {
      onShowToast(
        `Updated ${row.advisorName}: ৳${numericSales.toLocaleString()} sales · ${numericCalls} calls`,
        'success'
      );
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Top Executive Target Hero Card */}
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold">Quota & Revenue Pacing</span>
              <span aria-hidden="true">·</span>
              <span>{filteredRows.length} Advisors</span>
              <span aria-hidden="true">·</span>
              <span>{summary.withTargetCount} Assigned Targets</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Advisor Sales Target & Attainment
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Track individual monthly sales quotas, MTD revenue attainment, remaining quota gaps, and sub-team pacing. Click any target amount to adjust inline.
            </p>
          </div>

          {/* Interactive Division Segmented Control */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              {(['all', 'stationed', 'virtual'] as DivisionFilter[]).map((div) => {
                const label = div === 'all' ? 'All Divisions' : div === 'stationed' ? 'Stationed' : 'Virtual';
                const active = divisionFilter === div;
                return (
                  <button
                    key={div}
                    type="button"
                    onClick={() => {
                      setDivisionFilter(div);
                      setSubTeamFilter('all');
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6 sm:mt-8">
          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Sales Target
              </span>
              <Target className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-2">
              <AnimatedCounter value={summary.totalTarget} prefix="৳" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Across {summary.withTargetCount} advisors with active quotas
            </p>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Achieved Sales (MTD)
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-2">
              <AnimatedCounter value={summary.totalAchieved} prefix="৳" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Verified final sales data
            </p>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quota Attainment
              </span>
              {summary.attainmentPct >= 50 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight mt-2">
              <AnimatedCounter value={summary.attainmentPct} decimals={1} suffix="%" />
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.attainmentPct >= 80
                    ? 'bg-emerald-500'
                    : summary.attainmentPct >= 40
                    ? 'bg-sky-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, summary.attainmentPct))}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Remaining Quota Gap
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight mt-2">
              <AnimatedCounter value={summary.totalGap} prefix="৳" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Needed to reach 100% team target
            </p>
          </div>
        </div>
      </motion.section>

      {/* Advisor Self-Check: Personal, Sub-Team & Main Team Target Achievement Progress */}
      {allRows.length > 0 && (() => {
        const spotlightSubTeams = Array.from(
          new Set(
            allRows
              .filter((r) => spotlightDivision === 'all' || r.division === spotlightDivision)
              .map((r) => r.subTeam)
              .filter(Boolean)
          )
        );

        const spotlightFilteredRows = allRows.filter((r) => {
          if (spotlightDivision !== 'all' && r.division !== spotlightDivision) return false;
          if (spotlightSubTeam !== 'all' && r.subTeam.toLowerCase() !== spotlightSubTeam.toLowerCase()) return false;
          return true;
        });

        const activeAdvisor =
          spotlightFilteredRows.find((r) => r.id === spotlightAdvisorId) ||
          [...spotlightFilteredRows].sort((a, b) => b.attainmentPct - a.attainmentPct)[0] ||
          allRows[0];
        if (!activeAdvisor) return null;

        const salesPct = activeAdvisor.salesTarget > 0 ? (activeAdvisor.achievedSales / activeAdvisor.salesTarget) * 100 : 0;
        const salesClamped = Math.min(100, Math.max(0, salesPct));
        const callsPct = activeAdvisor.callTarget > 0 ? (activeAdvisor.achievedCalls / activeAdvisor.callTarget) * 100 : 0;
        const callsClamped = Math.min(100, Math.max(0, callsPct));
        const callsGap = Math.max(0, activeAdvisor.callTarget - activeAdvisor.achievedCalls);

        // Main Team (Station or Virtual) totals for activeAdvisor
        const mainTeamRows = allRows.filter((r) => r.division === activeAdvisor.division);
        const mainTeamSalesTarget = mainTeamRows.reduce((acc, r) => acc + r.salesTarget, 0);
        const mainTeamSalesAchieved = mainTeamRows.reduce((acc, r) => acc + r.achievedSales, 0);
        const mainTeamSalesPct = mainTeamSalesTarget > 0 ? (mainTeamSalesAchieved / mainTeamSalesTarget) * 100 : 0;
        const mainTeamCallTarget = mainTeamRows.reduce((acc, r) => acc + r.callTarget, 0);
        const mainTeamCallAchieved = mainTeamRows.reduce((acc, r) => acc + r.achievedCalls, 0);
        const mainTeamCallPct = mainTeamCallTarget > 0 ? (mainTeamCallAchieved / mainTeamCallTarget) * 100 : 0;

        // Sub-Team totals for activeAdvisor (within their Main Team)
        const subTeamRows = allRows.filter(
          (r) =>
            r.division === activeAdvisor.division &&
            r.subTeam.toLowerCase() === activeAdvisor.subTeam.toLowerCase()
        );
        const subTeamSalesTarget = subTeamRows.reduce((acc, r) => acc + r.salesTarget, 0);
        const subTeamSalesAchieved = subTeamRows.reduce((acc, r) => acc + r.achievedSales, 0);
        const subTeamSalesPct = subTeamSalesTarget > 0 ? (subTeamSalesAchieved / subTeamSalesTarget) * 100 : 0;
        const subTeamCallTarget = subTeamRows.reduce((acc, r) => acc + r.callTarget, 0);
        const subTeamCallAchieved = subTeamRows.reduce((acc, r) => acc + r.achievedCalls, 0);
        const subTeamCallPct = subTeamCallTarget > 0 ? (subTeamCallAchieved / subTeamCallTarget) * 100 : 0;

        const getBarColor = (pct: number) =>
          pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-sky-500' : pct > 0 ? 'bg-amber-500' : 'bg-rose-500';
        const getTextColor = (pct: number) =>
          pct >= 80
            ? 'text-emerald-600 dark:text-emerald-400'
            : pct >= 40
            ? 'text-sky-600 dark:text-sky-400'
            : pct > 0
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-rose-600 dark:text-rose-400';

        const mainTeamLabel = activeAdvisor.division === 'stationed' ? 'Station Team' : 'Virtual Team';

        return (
          <section className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold">
                    Advisor Progress Check
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{activeAdvisor.employeeId}</span>
                  <span aria-hidden="true">·</span>
                  <span>{mainTeamLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeAdvisor.subTeam} Sub-Team</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                  {activeAdvisor.advisorName}&apos;s Target Achievement
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Main Team Filter (All / Station / Virtual) */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  {(['all', 'stationed', 'virtual'] as DivisionFilter[]).map((div) => {
                    const label = div === 'all' ? 'All' : div === 'stationed' ? 'Station' : 'Virtual';
                    const active = spotlightDivision === div;
                    return (
                      <button
                        key={div}
                        type="button"
                        onClick={() => {
                          setSpotlightDivision(div);
                          setSpotlightSubTeam('all');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Team Filter */}
                <select
                  value={spotlightSubTeam}
                  onChange={(e) => setSpotlightSubTeam(e.target.value)}
                  aria-label="Filter Advisor by Sub-Team"
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="all">All Sub-Teams</option>
                  {spotlightSubTeams.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                {/* Advisor Selector */}
                <select
                  value={activeAdvisor.id}
                  onChange={(e) => setSpotlightAdvisorId(e.target.value)}
                  aria-label="Select Advisor to View Target Progress"
                  className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                >
                  {spotlightFilteredRows.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.advisorName} ({r.division === 'stationed' ? 'Station' : 'Virtual'} · {r.subTeam})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onSelectAdvisor(activeAdvisor.rawAdvisor, activeAdvisor.division)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <span>Full Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Row 1: Personal Sales & Call Target Achievement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              {/* Personal Sales Target Achievement */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Personal Sales Target
                  </span>
                  <span className={`text-sm font-mono font-black ${getTextColor(salesPct)}`}>
                    {activeAdvisor.salesTarget > 0 ? `${salesPct.toFixed(1)}%` : '—'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 font-mono">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    ৳{activeAdvisor.achievedSales.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    of ৳{activeAdvisor.salesTarget.toLocaleString()} target
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(salesPct)}`}
                    style={{ width: `${salesClamped}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {activeAdvisor.salesTarget > 0
                    ? activeAdvisor.remainingGap === 0
                      ? '100% of monthly sales target achieved!'
                      : `৳${activeAdvisor.remainingGap.toLocaleString()} remaining to reach 100% sales target`
                    : 'No monthly sales target assigned yet'}
                </p>
              </div>

              {/* Personal Call Target Achievement */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Personal Call Target
                  </span>
                  <span className={`text-sm font-mono font-black ${getTextColor(callsPct)}`}>
                    {activeAdvisor.callTarget > 0 ? `${callsPct.toFixed(0)}%` : '—'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 font-mono">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {activeAdvisor.achievedCalls} calls
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    of {activeAdvisor.callTarget} call target
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(callsPct)}`}
                    style={{ width: `${callsClamped}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {activeAdvisor.callTarget > 0
                    ? callsGap === 0
                      ? '100% of call reach target achieved!'
                      : `${callsGap} more calls needed to reach 100% call target`
                    : 'No call target assigned yet'}
                </p>
              </div>
            </div>

            {/* Row 2: Main Team (Station / Virtual) & Sub-Team Target Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              {/* Main Team Target Progress */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Main Team · {mainTeamLabel}
                    </span>
                    <span className="ml-2 text-[11px] font-mono text-slate-400">
                      ({mainTeamRows.length} advisors)
                    </span>
                  </div>
                  <span className={`text-sm font-mono font-black ${getTextColor(mainTeamSalesPct)}`}>
                    {mainTeamSalesTarget > 0 ? `${mainTeamSalesPct.toFixed(1)}%` : '—'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 font-mono">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    ৳{mainTeamSalesAchieved.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    of ৳{mainTeamSalesTarget.toLocaleString()} team sales
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(mainTeamSalesPct)}`}
                    style={{ width: `${Math.min(100, Math.max(0, mainTeamSalesPct))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  <span>
                    Calls: <strong className="text-slate-700 dark:text-slate-200">{mainTeamCallAchieved.toLocaleString()}</strong> / {mainTeamCallTarget.toLocaleString()}
                  </span>
                  <span className={`font-bold ${getTextColor(mainTeamCallPct)}`}>
                    {mainTeamCallTarget > 0 ? `${mainTeamCallPct.toFixed(0)}% calls` : '—'}
                  </span>
                </div>
              </div>

              {/* Sub-Team Target Progress */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Sub-Team · {activeAdvisor.subTeam}
                    </span>
                    <span className="ml-2 text-[11px] font-mono text-slate-400">
                      ({subTeamRows.length} {subTeamRows.length === 1 ? 'advisor' : 'advisors'})
                    </span>
                  </div>
                  <span className={`text-sm font-mono font-black ${getTextColor(subTeamSalesPct)}`}>
                    {subTeamSalesTarget > 0 ? `${subTeamSalesPct.toFixed(1)}%` : '—'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 font-mono">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    ৳{subTeamSalesAchieved.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    of ৳{subTeamSalesTarget.toLocaleString()} sub-team sales
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(subTeamSalesPct)}`}
                    style={{ width: `${Math.min(100, Math.max(0, subTeamSalesPct))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  <span>
                    Calls: <strong className="text-slate-700 dark:text-slate-200">{subTeamCallAchieved.toLocaleString()}</strong> / {subTeamCallTarget.toLocaleString()}
                  </span>
                  <span className={`font-bold ${getTextColor(subTeamCallPct)}`}>
                    {subTeamCallTarget > 0 ? `${subTeamCallPct.toFixed(0)}% calls` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Monthly Performance Target Planner (Team & Individual) */}
      <MonthlyTargetPlanner
        stationedAdvisors={stationedAdvisors}
        virtualAdvisors={virtualAdvisors}
        onBatchUpdateTargets={onBatchUpdateTargets}
        onShowToast={onShowToast}
      />

      {/* Main Team (Station vs Virtual) & Sub-Team Quota Breakdown */}
      {subTeamBreakdown.length > 0 && (
        <section className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Main Team Pacing (Station vs Virtual) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Main Team Target Pacing (Station vs Virtual)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click Station Team or Virtual Team to filter by main division
                </p>
              </div>
              {divisionFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setDivisionFilter('all');
                    setSubTeamFilter('all');
                  }}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Show Both Teams
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mainTeamBreakdown.map((mt) => {
                const salesPct = mt.salesTarget > 0 ? (mt.achievedSales / mt.salesTarget) * 100 : 0;
                const callsPct = mt.callTarget > 0 ? (mt.achievedCalls / mt.callTarget) * 100 : 0;
                const isSelected = divisionFilter === mt.key;
                return (
                  <button
                    key={mt.key}
                    type="button"
                    onClick={() => {
                      setDivisionFilter(isSelected ? 'all' : mt.key);
                      setSubTeamFilter('all');
                    }}
                    className={`text-left p-5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 dark:border-sky-400 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{mt.label}</span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {mt.count} advisors
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                        ৳{mt.achievedSales.toLocaleString()}
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        / ৳{mt.salesTarget.toLocaleString()} ({salesPct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          salesPct >= 80 ? 'bg-emerald-500' : salesPct >= 40 ? 'bg-sky-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(mt.achievedSales > 0 ? 3 : 0, salesPct))}%` }}
                      />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span>Calls: {mt.achievedCalls.toLocaleString()} / {mt.callTarget.toLocaleString()}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{callsPct.toFixed(0)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Team Target Pacing */}
          <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Sub-Team Target Pacing
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any sub-team card to filter the advisor target table below
                </p>
              </div>
              {subTeamFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSubTeamFilter('all')}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Reset Sub-Team Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subTeamBreakdown.map((st) => {
                const pct = st.target > 0 ? (st.achieved / st.target) * 100 : 0;
                const callPct = st.callTarget > 0 ? (st.achievedCalls / st.callTarget) * 100 : 0;
                const isSelected = subTeamFilter.toLowerCase() === st.name.toLowerCase();
                return (
                  <button
                    key={st.name}
                    type="button"
                    onClick={() => setSubTeamFilter(isSelected ? 'all' : st.name)}
                    className={`text-left p-5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 dark:border-sky-400 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{st.name}</span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {st.count} {st.count === 1 ? 'advisor' : 'advisors'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      <span className="text-base font-black font-mono text-slate-900 dark:text-slate-100">
                        ৳{st.achieved.toLocaleString()}
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        / ৳{st.target.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2.5">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-sky-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(st.achieved > 0 ? 3 : 0, pct))}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Sales Attainment</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span>Calls: {st.achievedCalls}/{st.callTarget}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{callPct.toFixed(0)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Advisor Target & Attainment Table */}
      <section className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by advisor name, TE ID, or sub-team..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sub-Team Segmented Filter */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
              {subTeams.map((st) => {
                const active = subTeamFilter.toLowerCase() === st.toLowerCase();
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSubTeamFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'All Sub-Teams' : st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-3 w-10">#</th>
                <th className="py-3.5 px-3">Advisor</th>
                <th className="py-3.5 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('target')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>Sales Target</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('achieved')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>Achieved Sales</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('gap')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>Remaining Gap</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-3 min-w-[165px]">
                  <button
                    type="button"
                    onClick={() => handleSort('callAttainment')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>Calls Progress</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-3 min-w-[175px]">
                  <button
                    type="button"
                    onClick={() => handleSort('attainment')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>Sales Progress</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80 text-sm">
              {filteredRows.map((row, idx) => {
                const isEditing = editingId === row.id;
                const callPctRaw = row.callTarget > 0 ? (row.achievedCalls / row.callTarget) * 100 : 0;
                const callPctClamped = Math.min(100, Math.max(0, callPctRaw));
                const salesPctClamped = Math.min(100, Math.max(0, row.attainmentPct));

                const getProgressColors = (pct: number) => {
                  if (pct >= 80) {
                    return {
                      text: 'text-emerald-600 dark:text-emerald-400',
                      bar: 'bg-emerald-500',
                    };
                  }
                  if (pct >= 40) {
                    return {
                      text: 'text-sky-600 dark:text-sky-400',
                      bar: 'bg-sky-500',
                    };
                  }
                  if (pct > 0) {
                    return {
                      text: 'text-amber-600 dark:text-amber-400',
                      bar: 'bg-amber-500',
                    };
                  }
                  return {
                    text: 'text-rose-600 dark:text-rose-400',
                    bar: 'bg-rose-500',
                  };
                };

                const callColors = getProgressColors(callPctRaw);
                const salesColors = getProgressColors(row.attainmentPct);

                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectAdvisor(row.rawAdvisor, row.division)}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-3 font-mono text-xs font-bold text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    <td className="py-4 px-3">
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {row.advisorName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{row.employeeId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{row.subTeam}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{row.division}</span>
                      </div>
                    </td>

                    <td className="py-4 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            value={editingSalesValue}
                            onChange={(e) => setEditingSalesValue(e.target.value)}
                            aria-label="Edit Sales Target"
                            className="w-28 px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-950 border border-sky-500 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>৳{row.salesTarget.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={(e) => startEditing(row, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity cursor-pointer"
                            title="Edit Sales & Call Targets"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{row.achievedSales.toLocaleString()}
                    </td>

                    <td className="py-4 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {row.salesTarget > 0 ? `৳${row.remainingGap.toLocaleString()}` : '—'}
                    </td>

                    {/* Compact Color-Coded Calls Progress Bar */}
                    <td className="py-4 px-3 font-mono text-xs">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            value={editingCallsValue}
                            onChange={(e) => setEditingCallsValue(e.target.value)}
                            aria-label="Edit Call Target"
                            className="w-20 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-950 border border-sky-500 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={(e) => saveEditing(row, e)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                            title="Save Targets"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : row.callTarget > 0 ? (
                        <div className="space-y-1 max-w-[150px]">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {row.achievedCalls}
                              <span className="text-slate-400 font-normal">/{row.callTarget}</span>
                            </span>
                            <span className={`font-bold ${callColors.text}`}>
                              {callPctRaw.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${callColors.bar}`}
                              style={{ width: `${callPctClamped}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No call quota</span>
                      )}
                    </td>

                    {/* Compact Color-Coded Sales Progress Bar */}
                    <td className="py-4 px-3 font-mono text-xs">
                      {row.salesTarget > 0 ? (
                        <div className="space-y-1 max-w-[165px]">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              ৳{row.achievedSales.toLocaleString()}
                            </span>
                            <span className={`font-bold ${salesColors.text}`}>
                              {row.attainmentPct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${salesColors.bar}`}
                              style={{ width: `${salesPctClamped}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No sales quota</span>
                      )}
                    </td>

                    <td className="py-4 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAdvisor(row.rawAdvisor, row.division);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No advisors match the selected target filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
