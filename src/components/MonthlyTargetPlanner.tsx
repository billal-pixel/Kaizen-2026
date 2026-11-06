import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  Users,
  User,
  PhoneCall,
  DollarSign,
  Check,
  Sliders,
  Sparkles,
  Calendar
} from 'lucide-react';
import { StationedAdvisor, VirtualAdvisor } from '../types';

interface MonthlyTargetPlannerProps {
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  onBatchUpdateTargets: (
    updates: Array<{ id: string; division: 'stationed' | 'virtual'; salesTarget: number; callTarget: number }>
  ) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

type AssignmentScope = 'team' | 'individual';
type TeamGroup = 'all' | 'stationed' | 'virtual' | 'Star' | 'Elite' | 'Achiever' | 'Newbie';
type DistributionMode = 'per_advisor' | 'split_total';

export const MonthlyTargetPlanner: React.FC<MonthlyTargetPlannerProps> = ({
  stationedAdvisors,
  virtualAdvisors,
  onBatchUpdateTargets,
  onShowToast,
}) => {
  const [scope, setScope] = useState<AssignmentScope>('team');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');

  // Team / Sub-team state
  const [teamGroup, setTeamGroup] = useState<TeamGroup>('stationed');
  const [distributionMode, setDistributionMode] = useState<DistributionMode>('per_advisor');
  const [teamSalesInput, setTeamSalesInput] = useState<string>('150000');
  const [teamCallsInput, setTeamCallsInput] = useState<string>('80');

  // Individual advisor state
  const allAdvisors = useMemo(() => {
    const st = stationedAdvisors.map((a) => ({
      id: a.id,
      name: a.advisorName,
      employeeId: a.employeeId || '—',
      subTeam: a.subTeam || 'General',
      division: 'stationed' as const,
      currentSales: a.finalSalesData || 0,
      currentCalls: a.avgReach || 0,
      salesTarget: a.advisorSalesTarget ?? 0,
      callTarget: a.advisorCallTarget ?? 80,
    }));
    const vt = virtualAdvisors.map((a) => ({
      id: a.id,
      name: a.advisorName,
      employeeId: a.employeeId || '—',
      subTeam: a.subTeam || 'Virtual',
      division: 'virtual' as const,
      currentSales: a.finalSales || 0,
      currentCalls: a.reachCall || 0,
      salesTarget: a.advisorSalesTarget ?? 0,
      callTarget: a.advisorCallTarget ?? 100,
    }));
    return [...st, ...vt];
  }, [stationedAdvisors, virtualAdvisors]);

  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>(() => allAdvisors[0]?.id || '');
  const [indivSalesInput, setIndivSalesInput] = useState<string>('0');
  const [indivCallsInput, setIndivCallsInput] = useState<string>('80');

  // Sync individual inputs when selectedAdvisorId changes
  useEffect(() => {
    const found = allAdvisors.find((a) => a.id === selectedAdvisorId) || allAdvisors[0];
    if (found) {
      if (found.id !== selectedAdvisorId) setSelectedAdvisorId(found.id);
      setIndivSalesInput(String(found.salesTarget));
      setIndivCallsInput(String(found.callTarget));
    }
  }, [selectedAdvisorId, allAdvisors]);

  // Matching advisors for Team scope
  const matchingTeamAdvisors = useMemo(() => {
    return allAdvisors.filter((a) => {
      if (teamGroup === 'all') return true;
      if (teamGroup === 'stationed') return a.division === 'stationed';
      if (teamGroup === 'virtual') return a.division === 'virtual';
      return a.subTeam.toLowerCase() === teamGroup.toLowerCase();
    });
  }, [allAdvisors, teamGroup]);

  // Computed preview values
  const teamPreview = useMemo(() => {
    const count = matchingTeamAdvisors.length;
    const rawSales = Math.max(0, Number(teamSalesInput) || 0);
    const rawCalls = Math.max(0, Number(teamCallsInput) || 0);

    if (count === 0) {
      return { count: 0, perAdvisorSales: 0, perAdvisorCalls: 0, totalSales: 0, totalCalls: 0 };
    }

    if (distributionMode === 'per_advisor') {
      return {
        count,
        perAdvisorSales: Math.round(rawSales),
        perAdvisorCalls: Math.round(rawCalls),
        totalSales: Math.round(rawSales * count),
        totalCalls: Math.round(rawCalls * count),
      };
    } else {
      const perSales = Math.round(rawSales / count);
      const perCalls = Math.round(rawCalls / count);
      return {
        count,
        perAdvisorSales: perSales,
        perAdvisorCalls: perCalls,
        totalSales: Math.round(rawSales),
        totalCalls: Math.round(rawCalls),
      };
    }
  }, [matchingTeamAdvisors.length, teamSalesInput, teamCallsInput, distributionMode]);

  const selectedAdvisor = useMemo(
    () => allAdvisors.find((a) => a.id === selectedAdvisorId) || allAdvisors[0],
    [allAdvisors, selectedAdvisorId]
  );

  const handleApplyTeamTargets = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchingTeamAdvisors.length === 0) return;

    const updates = matchingTeamAdvisors.map((adv) => ({
      id: adv.id,
      division: adv.division,
      salesTarget: teamPreview.perAdvisorSales,
      callTarget: teamPreview.perAdvisorCalls,
    }));

    onBatchUpdateTargets(updates);
    if (onShowToast) {
      onShowToast(
        `Applied monthly targets (৳${teamPreview.perAdvisorSales.toLocaleString()} sales · ${teamPreview.perAdvisorCalls} calls) to ${updates.length} advisors`,
        'success'
      );
    }
  };

  const handleApplyIndividualTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvisor) return;

    const salesVal = Math.max(0, Math.round(Number(indivSalesInput) || 0));
    const callsVal = Math.max(0, Math.round(Number(indivCallsInput) || 0));

    onBatchUpdateTargets([
      {
        id: selectedAdvisor.id,
        division: selectedAdvisor.division,
        salesTarget: salesVal,
        callTarget: callsVal,
      },
    ]);

    if (onShowToast) {
      onShowToast(
        `Updated ${selectedAdvisor.name}'s monthly target: ৳${salesVal.toLocaleString()} sales · ${callsVal} calls`,
        'success'
      );
    }
  };

  const monthLabel = useMemo(() => {
    const [yr, mo] = selectedMonth.split('-');
    const date = new Date(Number(yr), Number(mo) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  return (
    <section className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold">
              Target Configurator
            </span>
            <span aria-hidden="true">·</span>
            <span>{monthLabel}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Set Monthly Performance Targets
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure monthly sales volume (৳) and call reach quotas for an entire team/sub-team or an individual advisor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Target Month"
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Scope Segmented Control: Entire Team vs Individual Advisor */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setScope('team')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                scope === 'team'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team / Sub-Team</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('individual')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                scope === 'individual'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Individual Advisor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Body */}
      {scope === 'team' ? (
        <form onSubmit={handleApplyTeamTargets} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Target Group */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Target Group
              </label>
              <select
                value={teamGroup}
                onChange={(e) => setTeamGroup(e.target.value as TeamGroup)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value="all">All Advisors ({allAdvisors.length})</option>
                <option value="stationed">Stationed Team ({stationedAdvisors.length})</option>
                <option value="virtual">Virtual Team ({virtualAdvisors.length})</option>
                <option value="Star">Sub-Team: Star</option>
                <option value="Elite">Sub-Team: Elite</option>
                <option value="Achiever">Sub-Team: Achiever</option>
                <option value="Newbie">Sub-Team: Newbie</option>
              </select>
            </div>

            {/* Allocation Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Allocation Method
              </label>
              <select
                value={distributionMode}
                onChange={(e) => setDistributionMode(e.target.value as DistributionMode)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value="per_advisor">Same Quota Per Advisor</option>
                <option value="split_total">Split Team Total Evenly</option>
              </select>
            </div>

            {/* Sales Volume Target Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {distributionMode === 'per_advisor' ? 'Sales Target / Advisor (৳)' : 'Total Team Sales Target (৳)'}
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={teamSalesInput}
                  onChange={(e) => setTeamSalesInput(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Call Count Target Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {distributionMode === 'per_advisor' ? 'Call Target / Advisor' : 'Total Team Call Target'}
              </label>
              <div className="relative">
                <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={teamCallsInput}
                  onChange={(e) => setTeamCallsInput(e.target.value)}
                  placeholder="e.g. 80"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Live Preview & Submit Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Advisors Affected: </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{teamPreview.count}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Per Advisor: </span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  ৳{teamPreview.perAdvisorSales.toLocaleString()}
                </span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {teamPreview.perAdvisorCalls} calls
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Combined Group Quota: </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ৳{teamPreview.totalSales.toLocaleString()}
                </span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {teamPreview.totalCalls.toLocaleString()} calls
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={teamPreview.count === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Apply to {teamPreview.count} Advisors</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleApplyIndividualTarget} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Advisor Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Select Advisor
              </label>
              <select
                value={selectedAdvisorId}
                onChange={(e) => setSelectedAdvisorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                {allAdvisors.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.name} ({adv.employeeId} · {adv.subTeam})
                  </option>
                ))}
              </select>
            </div>

            {/* Individual Sales Volume Target */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Monthly Sales Target (৳)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={indivSalesInput}
                  onChange={(e) => setIndivSalesInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Individual Call Count Target */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Monthly Call Reach Target
              </label>
              <div className="relative">
                <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={indivCallsInput}
                  onChange={(e) => setIndivCallsInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Selected Advisor Current Performance Context & Submit */}
          {selectedAdvisor && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Current MTD Sales: </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{selectedAdvisor.currentSales.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Current Reach Calls: </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedAdvisor.currentCalls}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Previous Quota: </span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    ৳{selectedAdvisor.salesTarget.toLocaleString()} · {selectedAdvisor.callTarget} calls
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Update {selectedAdvisor.name.split(' ')[0]}'s Target</span>
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
};
