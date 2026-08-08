import React, { useState, useMemo } from 'react';
import { StationedAdvisor } from '../types';
import { getNumericKpi, formatKpiDisplay } from '../utils/sheetParser';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit2, 
  Trash2, 
  Plus, 
  Download, 
  Award, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Briefcase,
  FileSpreadsheet,
  Globe,
  ExternalLink
} from 'lucide-react';

interface StationedTeamViewProps {
  advisors: StationedAdvisor[];
  onUpdateAdvisor: (updated: StationedAdvisor) => void;
  onDeleteAdvisor: (id: string) => void;
  onAddAdvisor: () => void;
  onSelectAdvisor: (advisor: StationedAdvisor) => void;
  onOpenSheetSync?: () => void;
}

export const StationedTeamView: React.FC<StationedTeamViewProps> = ({
  advisors,
  onUpdateAdvisor,
  onDeleteAdvisor,
  onAddAdvisor,
  onSelectAdvisor,
  onOpenSheetSync,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof StationedAdvisor>('finalSalesData');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StationedAdvisor>>({});

  // Filter & Sort logic
  const filteredAdvisors = useMemo(() => {
    return advisors
      .filter((advisor) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = advisor.advisorName.toLowerCase().includes(query) || (advisor.employeeId && advisor.employeeId.toLowerCase().includes(query));
        const matchesGrade = gradeFilter === 'all' || advisor.kpiGrade === gradeFilter;
        return matchesSearch && matchesGrade;
      })
      .sort((a, b) => {
        if (sortField === 'totalKpiScore') {
          const numA = getNumericKpi(a.totalKpiScore);
          const numB = getNumericKpi(b.totalKpiScore);
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
  }, [advisors, searchTerm, gradeFilter, sortField, sortOrder]);

  const handleSort = (field: keyof StationedAdvisor) => {
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
      'Avg Reach', 'Avg Talktime', 'CE Count', 'Avg Exam Mark', 'Avg Briefing Mark', 
      'Final Sales Data', 'Total KPI Score', 'KPI Grade', 'AVG Break', 'AVG MGT', 'AVG Meeting'
    ];

    const rows = filteredAdvisors.map(a => [
      a.employeeId || '',
      `"${a.advisorName.replace(/"/g, '""')}"`,
      `"${a.tlTeam || 'Billal'}"`,
      `"${a.advisorDesignation || 'Trainee Advisor'}"`,
      `"${a.leadId || ''}"`,
      a.avgReach,
      `"${a.avgTalktime}"`,
      a.ceCount,
      `"${a.avgExamMark}"`,
      `"${a.avgBriefingMark}"`,
      a.finalSalesData,
      a.totalKpiScore,
      a.kpiGrade,
      `"${a.avgBreak}"`,
      `"${a.avgMgt}"`,
      `"${a.avgMeeting}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kaizen_Stationed_Advisors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEdit = (advisor: StationedAdvisor) => {
    setEditingId(advisor.id);
    setEditForm({ ...advisor });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm) {
      // Auto-recalculate KPI Grade based on totalKpiScore if modified
      const kpiScore = editForm.totalKpiScore ?? 0;
      let calculatedGrade: StationedAdvisor['kpiGrade'] = 'C';
      if (kpiScore >= 80) calculatedGrade = 'A';
      else if (kpiScore >= 70) calculatedGrade = 'B';
      else if (kpiScore >= 60) calculatedGrade = 'C';
      else if (kpiScore >= 50) calculatedGrade = 'D';
      else calculatedGrade = 'PIP';

      onUpdateAdvisor({
        ...(editForm as StationedAdvisor),
        kpiGrade: calculatedGrade,
      });
      setEditingId(null);
      setEditForm({});
    }
  };

  const exportToCsv = () => {
    const headers = [
      'Station Advisor Name',
      'Avg Reach',
      'Avg Talktime',
      'CE Count',
      'Avg Exam Mark',
      'Avg Briefing Mark',
      'Final Sales Data',
      'Total KPI Score (%)',
      'KPI Grade',
      'AVG Break',
      'AVG MGT',
      'AVG Meeting'
    ];

    const rows = filteredAdvisors.map(a => [
      `"${a.advisorName}"`,
      a.avgReach,
      `"${a.avgTalktime}"`,
      a.ceCount,
      a.avgExamMark,
      a.avgBriefingMark,
      a.finalSalesData,
      a.totalKpiScore,
      a.kpiGrade,
      `"${a.avgBreak}"`,
      `"${a.avgMgt}"`,
      `"${a.avgMeeting}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stationed_team_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary Metrics
  const totalSales = advisors.reduce((acc, curr) => acc + curr.finalSalesData, 0);
  const avgKpiScore = advisors.length > 0 ? (advisors.reduce((acc, curr) => acc + getNumericKpi(curr.totalKpiScore), 0) / advisors.length) : 0;
  const avgReachCount = advisors.length > 0 ? Math.round(advisors.reduce((acc, curr) => acc + curr.avgReach, 0) / advisors.length) : 0;
  const totalCeCount = advisors.reduce((acc, curr) => acc + curr.ceCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Section Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-cyan-950 text-cyan-400 border border-cyan-800/80 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase">
                Stationed Division
              </span>
              <span className="text-slate-400 text-xs">Total Members: {advisors.length}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
              Station Advisors Performance Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Tracking on-site call reach, talktime, customer experience (CE) evaluations, exam & briefing scores, management time, and sales contributions.
            </p>
          </div>

          <a
            href="https://sites.google.com/view/10msmirpur/home"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-cyan-500/10 shrink-0 cursor-pointer group"
          >
            <Globe className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>10MS Mirpur Station Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-80" />
          </a>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Stationed Sales</p>
              <p className="text-lg font-bold text-slate-100">৳{totalSales.toLocaleString('en-BD')}</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Avg KPI Score</p>
              <p className="text-lg font-bold text-emerald-400">{avgKpiScore.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/50">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Avg Reach / Advisor</p>
              <p className="text-lg font-bold text-slate-100">{avgReachCount}</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/50">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total CE Audits</p>
              <p className="text-lg font-bold text-slate-100">{totalCeCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search station advisor name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
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

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-cyan-300 font-mono">{filteredAdvisors.length}</strong> of {advisors.length}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Grade:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Grades</option>
              <option value="A" className="bg-slate-900 text-slate-200">A (80%+)</option>
              <option value="B" className="bg-slate-900 text-slate-200">B (70-79%)</option>
              <option value="C" className="bg-slate-900 text-slate-200">C (60-69%)</option>
              <option value="D" className="bg-slate-900 text-slate-200">D (50-59%)</option>
              <option value="PIP" className="bg-slate-900 text-slate-200">PIP (&lt;50%)</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
            title="Export Stationed Advisors data to CSV file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
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
                    <span>Station Advisor</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-right min-w-[90px]">
                  <button onClick={() => handleSort('avgReach')} className="flex items-center gap-1 justify-end hover:text-cyan-300 transition-colors">
                    <span>Avg Reach</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-right min-w-[100px]">Avg Talktime</th>
                <th className="p-3.5 text-right min-w-[80px]">
                  <button onClick={() => handleSort('ceCount')} className="flex items-center gap-1 justify-end hover:text-cyan-300 transition-colors">
                    <span>CE Count</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-right min-w-[100px]">Exam Mark</th>
                <th className="p-3.5 text-right min-w-[100px]">Briefing Mark</th>
                <th className="p-3.5 text-right min-w-[120px]">
                  <button onClick={() => handleSort('finalSalesData')} className="flex items-center gap-1 justify-end hover:text-cyan-300 transition-colors">
                    <span>Final Sales</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-right min-w-[110px]">
                  <button onClick={() => handleSort('totalKpiScore')} className="flex items-center gap-1 justify-end hover:text-cyan-300 transition-colors">
                    <span>Total KPI %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="p-3.5 text-center min-w-[90px]">KPI Grade</th>
                <th className="p-3.5 text-right min-w-[90px]">AVG Break</th>
                <th className="p-3.5 text-right min-w-[90px]">AVG MGT</th>
                <th className="p-3.5 text-right min-w-[90px]">AVG Meeting</th>
                <th className="p-3.5 text-center min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredAdvisors.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-500">
                    No station advisors found matching criteria.
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
                            value={editForm.avgReach ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, avgReach: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.avgTalktime ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, avgTalktime: e.target.value })}
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
                            value={editForm.avgExamMark ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, avgExamMark: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.avgBriefingMark ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, avgBriefingMark: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editForm.finalSalesData ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, finalSalesData: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.totalKpiScore ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, totalKpiScore: Number(e.target.value) })}
                            className="bg-slate-900 border border-slate-700 text-xs text-emerald-400 rounded px-2 py-1 w-full text-right font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-[11px] text-slate-400">Auto</span>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.avgBreak ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, avgBreak: e.target.value })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.avgMgt ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, avgMgt: e.target.value })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={editForm.avgMeeting ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, avgMeeting: e.target.value })}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 w-full text-right"
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
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/80" />
                            {advisor.employeeId || 'TE-ID'}
                          </span>
                        </button>
                      </td>
                      <td className="p-3.5 text-right font-semibold text-cyan-300">{advisor.avgReach}</td>
                      <td className="p-3.5 text-right text-slate-300 font-mono text-[11px]">{advisor.avgTalktime}</td>
                      <td className="p-3.5 text-right font-medium text-slate-200">{advisor.ceCount}</td>
                      <td className="p-3.5 text-right font-medium text-slate-200">{advisor.avgExamMark}</td>
                      <td className="p-3.5 text-right font-medium text-slate-200">{advisor.avgBriefingMark}</td>
                      <td className="p-3.5 text-right font-semibold text-slate-100">৳{advisor.finalSalesData.toLocaleString('en-BD')}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">{formatKpiDisplay(advisor.totalKpiScore)}</td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-black text-[11px] ${
                          advisor.kpiGrade === 'A'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                            : advisor.kpiGrade === 'B'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800/80'
                            : advisor.kpiGrade === 'C'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                            : advisor.kpiGrade === 'D'
                            ? 'bg-orange-950 text-orange-400 border border-orange-800/80'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                        }`}>
                          {advisor.kpiGrade}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">{advisor.avgBreak}</td>
                      <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">{advisor.avgMgt}</td>
                      <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">{advisor.avgMeeting}</td>
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
