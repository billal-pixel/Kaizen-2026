import React, { useState, useMemo } from 'react';
import { VirtualAdvisor } from '../types';
import { getNumericKpi, formatKpiDisplay } from '../utils/sheetParser';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit2, 
  Trash2, 
  Plus, 
  Download, 
  PhoneCall, 
  Award, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Briefcase,
  FileSpreadsheet,
  Globe,
  Link2,
  ExternalLink
} from 'lucide-react';

interface VirtualTeamViewProps {
  advisors: VirtualAdvisor[];
  onUpdateAdvisor: (updated: VirtualAdvisor) => void;
  onDeleteAdvisor: (id: string) => void;
  onAddAdvisor: () => void;
  onSelectAdvisor: (advisor: VirtualAdvisor) => void;
  onOpenSheetSync?: () => void;
}

export const VirtualTeamView: React.FC<VirtualTeamViewProps> = ({
  advisors,
  onUpdateAdvisor,
  onDeleteAdvisor,
  onAddAdvisor,
  onSelectAdvisor,
  onOpenSheetSync,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kpiFilter, setKpiFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof VirtualAdvisor>('finalSales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VirtualAdvisor>>({});

  const filteredAdvisors = useMemo(() => {
    return advisors
      .filter((advisor) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = advisor.advisorName.toLowerCase().includes(query) || (advisor.employeeId && advisor.employeeId.toLowerCase().includes(query));
        let matchesKpi = true;
        const numKpi = getNumericKpi(advisor.overallKpi);
        if (kpiFilter === 'high') matchesKpi = numKpi >= 90;
        if (kpiFilter === 'medium') matchesKpi = numKpi >= 80 && numKpi < 90;
        if (kpiFilter === 'low') matchesKpi = numKpi < 80;
        return matchesSearch && matchesKpi;
      })
      .sort((a, b) => {
        if (sortField === 'overallKpi') {
          const numA = getNumericKpi(a.overallKpi);
          const numB = getNumericKpi(b.overallKpi);
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [advisors, searchTerm, kpiFilter, sortField, sortOrder]);

  const handleSort = (field: keyof VirtualAdvisor) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Employee ID', 'Advisor Name', 'TL Team', 'Advisor Designation', 'Lead ID', 
      'Reach Call', 'Talk Time', 'Meeting', 'Actual Talk Time', 'CE Count', 
      'Final Sales', 'Overall KPI', 'Exam', 'TT Amount', 'Final Incentive', 'Total Salary'
    ];

    const rows = filteredAdvisors.map(a => [
      a.employeeId || '',
      `"${a.advisorName.replace(/"/g, '""')}"`,
      `"${a.tlTeam || 'Billal'}"`,
      `"${a.advisorDesignation || 'Trainee Advisor Virtual'}"`,
      `"${a.leadId || ''}"`,
      a.reachCall,
      `"${a.talkTime}"`,
      `"${a.meeting}"`,
      `"${a.actualTalkTime}"`,
      a.ceCount,
      a.finalSales,
      a.overallKpi,
      `"${a.exam}"`,
      a.ttAmount,
      a.finalIncentive,
      a.totalSalary
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kaizen_Virtual_Advisors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEdit = (advisor: VirtualAdvisor) => {
    setEditingId(advisor.id);
    setEditForm({ ...advisor });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm) {
      onUpdateAdvisor(editForm as VirtualAdvisor);
      setEditingId(null);
      setEditForm({});
    }
  };

  const exportToCsv = () => {
    const headers = [
      'Virtual Advisor Name',
      'Reach Call',
      'Talk Time',
      'Meeting',
      'Actual Talk Time (Call Duration, PD, DISPO)',
      'CE Count',
      'Final Sales',
      'Overall KPI (%)',
      'Exam Mark',
      'TT Amount',
      'Final Incentive',
      'Total Salary'
    ];

    const rows = filteredAdvisors.map(a => [
      `"${a.advisorName}"`,
      a.reachCall,
      `"${a.talkTime}"`,
      `"${a.meeting}"`,
      `"${a.actualTalkTime}"`,
      a.ceCount,
      a.finalSales,
      a.overallKpi,
      a.exam,
      a.ttAmount,
      a.finalIncentive,
      a.totalSalary
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `virtual_team_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary Metrics
  const totalSales = advisors.reduce((acc, curr) => acc + curr.finalSales, 0);
  const avgOverallKpi = advisors.length > 0 ? (advisors.reduce((acc, curr) => acc + getNumericKpi(curr.overallKpi), 0) / advisors.length) : 0;
  const totalIncentives = advisors.reduce((acc, curr) => acc + curr.finalIncentive, 0);
  const totalPayroll = advisors.reduce((acc, curr) => acc + curr.totalSalary, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#30AFFF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#30AFFF]/15 text-[#92EEFF] border border-[#30AFFF]/30 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase">
                Virtual Team
              </span>
              <span className="text-slate-400 text-xs">Total Members: {advisors.length}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
              Virtual Advisors Performance Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Tracking virtual reach calls, total talk time, meeting durations, actual call disposition times, CE counts, final sales, TT amounts, incentives, and total payroll.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 hover:text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/10 cursor-pointer group"
            >
              <Link2 className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
              <span>Virtual Group Joining Link</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-400 opacity-80" />
            </a>

            <a
              href="https://sites.google.com/view/10ms-vt-essential/home"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer group"
            >
              <Globe className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Virtual Essential Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-80" />
            </a>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-6">
          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-sky-500/40 rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 min-w-0 shadow-xs transition-colors">
            <div className="p-2 sm:p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-extrabold uppercase tracking-wider leading-tight truncate">Virtual Sales</p>
              <p className="text-base sm:text-lg font-black text-slate-100 font-mono tracking-tight leading-tight truncate">৳{totalSales.toLocaleString('en-BD')}</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 min-w-0 shadow-xs transition-colors">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-extrabold uppercase tracking-wider leading-tight truncate">Overall KPI Avg</p>
              <p className="text-base sm:text-lg font-black text-emerald-400 font-mono tracking-tight leading-tight truncate">{avgOverallKpi.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 min-w-0 shadow-xs transition-colors">
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-extrabold uppercase tracking-wider leading-tight truncate">Total Incentives</p>
              <p className="text-base sm:text-lg font-black text-cyan-400 font-mono tracking-tight leading-tight truncate">৳{totalIncentives.toLocaleString('en-BD')}</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 min-w-0 shadow-xs transition-colors">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-extrabold uppercase tracking-wider leading-tight truncate">Total Salary Payroll</p>
              <p className="text-base sm:text-lg font-black text-slate-100 font-mono tracking-tight leading-tight truncate">৳{totalPayroll.toLocaleString('en-BD')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg min-w-0">
        <div className="relative w-full sm:w-80 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search virtual advisor name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#30AFFF] focus:ring-2 focus:ring-[#30AFFF]/20 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end min-w-0">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
            Showing <strong className="text-[#92EEFF] font-mono">{filteredAdvisors.length}</strong> of {advisors.length}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#30AFFF] shrink-0" />
            <span className="shrink-0">KPI Tier:</span>
            <select
              value={kpiFilter}
              onChange={(e) => setKpiFilter(e.target.value)}
              className="bg-transparent text-[#92EEFF] font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Tiers</option>
              <option value="high" className="bg-slate-900 text-slate-200">High (90%+)</option>
              <option value="medium" className="bg-slate-900 text-slate-200">Mid (80-89%)</option>
              <option value="low" className="bg-slate-900 text-slate-200">Needs Help (&lt;80%)</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
            title="Export Virtual Advisors data to CSV file"
          >
            <Download className="w-3.5 h-3.5 text-[#30AFFF] shrink-0" />
            <span className="hidden xs:inline">Export</span>
          </button>

          <button
            onClick={onAddAdvisor}
            className="bg-[#30AFFF]/15 hover:bg-[#30AFFF]/25 text-[#92EEFF] hover:text-white border border-[#30AFFF]/40 hover:border-[#30AFFF]/70 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
            title="Add New Advisor"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span>Add Advisor</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/95 backdrop-blur-md text-slate-300 border-b border-slate-800/80 font-extrabold uppercase tracking-wider sticky top-0 z-10">
                <th className="p-3.5 text-slate-200 min-w-[160px]">
                  <button onClick={() => handleSort('advisorName')} className="flex items-center gap-1 hover:text-cyan-300 transition-colors">
                    <span>Virtual Advisor</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-right min-w-[90px]">
                  <button onClick={() => handleSort('reachCall')} className="flex items-center gap-1 justify-end hover:text-cyan-300 transition-colors">
                    <span>Reach Call</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-right min-w-[90px]">Talk Time</th>
                <th className="p-3.5 text-right min-w-[90px]">Meeting</th>
                <th className="p-3.5 text-right min-w-[140px]">Actual Talk Time</th>
                <th className="p-3.5 text-right min-w-[80px]">CE Count</th>
                <th className="p-3.5 text-right min-w-[110px]">
                  <button onClick={() => handleSort('finalSales')} className="flex items-center gap-1 justify-end hover:text-cyan-300 transition-colors">
                    <span>Final Sales</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-right min-w-[100px]">
                  <button onClick={() => handleSort('overallKpi')} className="flex items-center gap-1 justify-end hover:text-cyan-300 transition-colors">
                    <span>Overall KPI</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-right min-w-[80px]">Exam</th>
                <th className="p-3.5 text-right min-w-[110px]">TT Amount</th>
                <th className="p-3.5 text-right min-w-[110px]">Final Incentive</th>
                <th className="p-3.5 text-right min-w-[110px]">Total Salary</th>
                <th className="p-3.5 text-center min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredAdvisors.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-500">
                    No virtual advisors found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAdvisors.map((advisor) => {
                  const isEditing = editingId === advisor.id;

                  if (isEditing) {
                    return (
                      <tr key={advisor.id} className="bg-slate-950/90 border-l-2 border-cyan-400">
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.advisorName ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, advisorName: e.target.value })}
                            className="bg-slate-900 border border-slate-700 text-xs text-cyan-300 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.reachCall ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, reachCall: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.talkTime ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, talkTime: e.target.value })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.meeting ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, meeting: e.target.value })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.actualTalkTime ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, actualTalkTime: e.target.value })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.ceCount ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, ceCount: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.finalSales ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, finalSales: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.overallKpi ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, overallKpi: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-emerald-400 rounded px-2 py-1 w-full text-right font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.exam ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, exam: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.ttAmount ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, ttAmount: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.finalIncentive ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, finalIncentive: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-purple-300 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.totalSalary ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, totalSalary: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-100 rounded px-2 py-1 w-full text-right font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr 
                      key={advisor.id} 
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="p-3.5 font-medium text-slate-100">
                        <button 
                          onClick={() => onSelectAdvisor(advisor)}
                          className="hover:text-cyan-400 text-left transition-colors flex flex-col"
                        >
                          <span className="font-semibold">{advisor.advisorName}</span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
                            {advisor.employeeId || 'VT-ID'}
                          </span>
                        </button>
                      </td>
                      <td className="p-3.5 text-right font-semibold text-cyan-300">{advisor.reachCall}</td>
                      <td className="p-3.5 text-right text-slate-300 font-mono text-[11px]">{advisor.talkTime}</td>
                      <td className="p-3.5 text-right text-slate-300 font-mono text-[11px]">{advisor.meeting}</td>
                      <td className="p-3.5 text-right text-slate-300 font-mono text-[11px]">{advisor.actualTalkTime}</td>
                      <td className="p-3.5 text-right font-medium text-slate-200">{advisor.ceCount}</td>
                      <td className="p-3.5 text-right font-semibold text-slate-100">৳{advisor.finalSales.toLocaleString('en-BD')}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">{formatKpiDisplay(advisor.overallKpi)}</td>
                      <td className="p-3.5 text-right font-medium text-slate-200">{advisor.exam}</td>
                      <td className="p-3.5 text-right font-mono text-slate-300">৳{advisor.ttAmount.toLocaleString('en-BD')}</td>
                      <td className="p-3.5 text-right font-semibold text-purple-300">৳{advisor.finalIncentive.toLocaleString('en-BD')}</td>
                      <td className="p-3.5 text-right font-bold text-slate-100">৳{advisor.totalSalary.toLocaleString('en-BD')}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => handleStartEdit(advisor)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteAdvisor(advisor.id)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
