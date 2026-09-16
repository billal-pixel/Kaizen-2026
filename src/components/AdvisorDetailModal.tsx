import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StationedAdvisor, VirtualAdvisor, TaskItem, TimeLog, CallRecord } from '../types';
import { formatKpiDisplay } from '../utils/sheetParser';
import { AdvisorKpiSparkline } from './AdvisorKpiSparkline';
import { User, Award, PhoneCall, DollarSign, Clock, CheckSquare, X, Edit2, Copy, Check, Zap, Plus, Send } from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';

interface AdvisorDetailModalProps {
  advisor: StationedAdvisor | VirtualAdvisor | null;
  type: 'stationed' | 'virtual';
  tasks: TaskItem[];
  timeLogs: TimeLog[];
  callRecords?: CallRecord[];
  onClose: () => void;
  onUpdate: (updated: any) => void;
  onAddTask?: (task: TaskItem) => void;
  onAddCallRecord?: (record: Omit<CallRecord, 'id'>) => void;
}

export const AdvisorDetailModal: React.FC<AdvisorDetailModalProps> = ({
  advisor,
  type,
  tasks,
  timeLogs,
  callRecords = [],
  onClose,
  onUpdate,
  onAddTask,
  onAddCallRecord,
}) => {
  const [copied, setCopied] = useState(false);
  const [quickActionToast, setQuickActionToast] = useState<string | null>(null);

  if (!advisor) return null;

  const isStationed = type === 'stationed';
  const stAdvisor = advisor as StationedAdvisor;
  const vtAdvisor = advisor as VirtualAdvisor;

  const advisorTasks = tasks.filter((t) => t.assignedAdvisorId === advisor.id);
  const advisorLogs = timeLogs.filter((l) => l.advisorId === advisor.id);
  const advisorCallRecords = callRecords.filter(
    (c) => c.advisorId === advisor.id || c.advisorName.toLowerCase() === advisor.advisorName.toLowerCase()
  );

  const showToast = (msg: string) => {
    setQuickActionToast(msg);
    setTimeout(() => setQuickActionToast(null), 2500);
  };

  const handleQuickAssignCallingPush = () => {
    if (!onAddTask) return;
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: 'Target Calling Push (25 Calls)',
      description: 'Outbound sales follow-up push for active batch enrollments.',
      team: type,
      assignedAdvisorId: advisor.id,
      assignedAdvisorName: advisor.advisorName,
      priority: 'urgent',
      status: 'todo',
      category: 'Calling Push',
      dueDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAddTask(newTask);
    showToast(`⚡ Assigned Calling Push to ${advisor.advisorName}`);
  };

  const handleQuickAssignCeAudit = () => {
    if (!onAddTask) return;
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: 'CE Quality Audit & Script Review',
      description: 'Conduct pitch script calibration and address objections.',
      team: type,
      assignedAdvisorId: advisor.id,
      assignedAdvisorName: advisor.advisorName,
      priority: 'high',
      status: 'todo',
      category: 'CE Audit',
      dueDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAddTask(newTask);
    showToast(`🎧 Assigned CE Audit task to ${advisor.advisorName}`);
  };

  const handleQuickLogConversion = () => {
    if (!onAddCallRecord) return;
    const newRecord: Omit<CallRecord, 'id'> = {
      advisorId: advisor.id,
      advisorName: advisor.advisorName,
      employeeId: advisor.employeeId || (isStationed ? 'ST-ADVISOR' : 'VT-ADVISOR'),
      team: type,
      customerName: 'HSC Candidate Lead',
      customerPhone: '+88017' + Math.floor(10000000 + Math.random() * 90000000),
      callType: 'Sales Closing',
      duration: '05:30',
      durationSeconds: 330,
      disposition: 'Converted',
      callDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      qualityScore: 92,
      notes: 'Course enrollment confirmed. Payment verified via BKash.',
      sheetSource: 'Performance Review Card',
    };
    onAddCallRecord(newRecord);
    showToast(`✅ Logged Converted Call for ${advisor.advisorName}`);
  };

  const handleCopyBrief = () => {
    let brief = '';
    if (isStationed) {
      brief = `📊 KAIZEN PERFORMANCE BRIEF - ${stAdvisor.advisorName} (${stAdvisor.employeeId || 'TE-ID'})
• Division: Stationed Team
• Reach Calls: ${stAdvisor.avgReach} | Talktime: ${stAdvisor.avgTalktime}
• CE Count: ${stAdvisor.ceCount} | Exam: ${stAdvisor.avgExamMark} | Briefing: ${stAdvisor.avgBriefingMark}
• Sales Revenue: ৳${stAdvisor.finalSalesData.toLocaleString('en-BD')}
• Total KPI: ${formatKpiDisplay(stAdvisor.totalKpiScore)} | Grade: ${stAdvisor.kpiGrade}`;
    } else {
      brief = `📊 KAIZEN PERFORMANCE BRIEF - ${vtAdvisor.advisorName} (${vtAdvisor.employeeId || 'TE-ID'})
• Division: Virtual Team
• Reach Calls: ${vtAdvisor.reachCall} | Talktime: ${vtAdvisor.actualTalkTime}
• CE Count: ${vtAdvisor.ceCount} | Exam: ${vtAdvisor.exam}
• Sales Revenue: ৳${vtAdvisor.finalSales.toLocaleString('en-BD')}
• Overall KPI: ${formatKpiDisplay(vtAdvisor.overallKpi)} | Total Salary: ৳${vtAdvisor.totalSalary.toLocaleString('en-BD')}`;
    }

    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {advisor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0B172A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar my-4"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 font-black flex items-center justify-center text-lg font-mono shadow-xs">
                {advisor.advisorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <KaizenLogo size="sm" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{advisor.advisorName}</h3>
                <span className="bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md font-mono">
                  {type}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">{advisor.employeeId || 'TE-ID'}</span>
                <span>•</span>
                <span>{advisor.advisorDesignation || (isStationed ? 'Trainee Advisor Station' : 'Trainee Advisor Virtual')}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 30-Day Weekly KPI Performance Trend Sparkline */}
        <div>
          <AdvisorKpiSparkline
            advisorId={advisor.id || advisor.advisorName}
            kpiScore={isStationed ? stAdvisor.totalKpiScore : vtAdvisor.overallKpi}
            grade={isStationed ? stAdvisor.kpiGrade : undefined}
            sales={isStationed ? stAdvisor.finalSalesData : vtAdvisor.finalSales}
            examMark={isStationed ? stAdvisor.avgExamMark : vtAdvisor.exam}
            teamType={type}
          />
        </div>

        {/* Core Metrics Grid */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Operational Metrics (12 Fields)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
            {isStationed ? (
              <>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Avg Reach</span>
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-400">{stAdvisor.avgReach}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Avg Talktime</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{stAdvisor.avgTalktime}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">CE Count</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stAdvisor.ceCount}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Avg Exam Mark</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stAdvisor.avgExamMark}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Avg Briefing Mark</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stAdvisor.avgBriefingMark}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Final Sales Data</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">৳{stAdvisor.finalSalesData.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total KPI Score</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatKpiDisplay(stAdvisor.totalKpiScore)}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">KPI Grade</span>
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-400">{stAdvisor.kpiGrade}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">AVG Break</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{stAdvisor.avgBreak}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">AVG MGT</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{stAdvisor.avgMgt}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">AVG Meeting</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{stAdvisor.avgMeeting}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Reach</span>
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-400">{vtAdvisor.reachCall}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Talk Time</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{vtAdvisor.talkTime}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Meeting</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{vtAdvisor.meeting}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Actual Talk Time</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{vtAdvisor.actualTalkTime}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">CE Count</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{vtAdvisor.ceCount}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Final Sales</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">৳{vtAdvisor.finalSales.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Overall KPI</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatKpiDisplay(vtAdvisor.overallKpi)}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Exam</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{vtAdvisor.exam}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">TT Amount</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">৳{vtAdvisor.ttAmount.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Final Incentive</span>
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-400">৳{vtAdvisor.finalIncentive.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-slate-50/80 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Salary</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">৳{vtAdvisor.totalSalary.toLocaleString('en-BD')}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 1-Click Review Quick Actions */}
        <div className="bg-slate-50/80 dark:bg-[#111F36] border border-sky-200 dark:border-sky-900/60 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              1-Click Review Quick Actions
            </span>
            {quickActionToast && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                {quickActionToast}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleQuickAssignCallingPush}
              className="flex items-center gap-2 bg-white hover:bg-sky-50 dark:bg-[#0B172A] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-300 px-3 py-2 rounded-xl text-left transition-all group shadow-xs cursor-pointer active:scale-98"
            >
              <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/70 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 block truncate">Assign 25-Call Push</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Calling Target</span>
              </div>
            </button>

            <button
              onClick={handleQuickAssignCeAudit}
              className="flex items-center gap-2 bg-white hover:bg-amber-50 dark:bg-[#0B172A] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 px-3 py-2 rounded-xl text-left transition-all group shadow-xs cursor-pointer active:scale-98"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                🎧
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 block truncate">Assign CE Audit</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Quality Calibration</span>
              </div>
            </button>

            <button
              onClick={handleQuickLogConversion}
              className="flex items-center gap-2 bg-white hover:bg-emerald-50 dark:bg-[#0B172A] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 px-3 py-2 rounded-xl text-left transition-all group shadow-xs cursor-pointer active:scale-98"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                ✅
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 block truncate">Log Converted Call</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">+Course Closing</span>
              </div>
            </button>
          </div>
        </div>

        {/* Assigned Tasks Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Assigned Tasks ({advisorTasks.length})</span>
          </h4>
          {advisorTasks.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-[#111F36] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              No tasks currently assigned to this advisor.
            </p>
          ) : (
            <div className="space-y-2">
              {advisorTasks.map((t) => (
                <div key={t.id} className="bg-slate-50 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.category} • Due: {t.dueDate}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    t.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advisor Call Records Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Call Records ({advisorCallRecords.length})</span>
            </span>
            {advisorCallRecords.length > 0 && (
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-bold">
                {isStationed ? 'Avg Reach' : 'Total Reach'}: {isStationed ? stAdvisor.avgReach : vtAdvisor.reachCall} calls
              </span>
            )}
          </h4>
          {advisorCallRecords.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-[#111F36] p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span>No individual call recordings logged yet for this advisor.</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Total Reach Calls: {isStationed ? stAdvisor.avgReach : vtAdvisor.reachCall}</span>
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {advisorCallRecords.map((rec) => (
                <div key={rec.id} className="bg-slate-50 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{rec.customerName}</span>
                      <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">{rec.customerPhone}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{rec.callType} • {rec.notes}</p>
                  </div>
                  <div className="text-right space-y-0.5 shrink-0">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 block">{rec.duration}</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                      {rec.disposition}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time Tracking Activity History */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Time Logs ({advisorLogs.length})</span>
          </h4>
          {advisorLogs.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-[#111F36] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              No time logs recorded for this advisor.
            </p>
          ) : (
            <div className="space-y-2">
              {advisorLogs.map((l) => (
                <div key={l.id} className="bg-slate-50 dark:bg-[#111F36] border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 mr-2">
                      {l.type}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{l.notes}</span>
                  </div>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    {Math.floor(l.durationSeconds / 60)} mins
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCopyBrief}
            className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/70 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
            <span>{copied ? 'Brief Copied!' : 'Copy Performance Brief'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
          >
            Close Card
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
    </AnimatePresence>
  );
};
