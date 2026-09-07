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

  return (
    <AnimatePresence>
      {advisor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 shadow-xl relative space-y-6 max-h-[90vh] overflow-y-auto"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-[#3B7A75] font-black flex items-center justify-center text-lg font-mono shadow-xs">
                {advisor.advisorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <KaizenLogo size="sm" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#0F172A]">{advisor.advisorName}</h3>
                <span className="bg-teal-50 text-[#3B7A75] border border-teal-200 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md font-mono">
                  {type}
                </span>
              </div>
              <p className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[#3B7A75] font-semibold">{advisor.employeeId || 'TE-ID'}</span>
                <span>•</span>
                <span>{advisor.advisorDesignation || (isStationed ? 'Trainee Advisor Station' : 'Trainee Advisor Virtual')}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">Operational Metrics (12 Fields)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {isStationed ? (
              <>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Avg Reach</span>
                  <p className="text-sm font-bold text-[#3B7A75]">{stAdvisor.avgReach}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Avg Talktime</span>
                  <p className="text-sm font-bold text-[#0F172A] font-mono">{stAdvisor.avgTalktime}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">CE Count</span>
                  <p className="text-sm font-bold text-[#0F172A]">{stAdvisor.ceCount}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Avg Exam Mark</span>
                  <p className="text-sm font-bold text-[#0F172A]">{stAdvisor.avgExamMark}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Avg Briefing Mark</span>
                  <p className="text-sm font-bold text-[#0F172A]">{stAdvisor.avgBriefingMark}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Final Sales Data</span>
                  <p className="text-sm font-bold text-[#0F172A]">৳{stAdvisor.finalSalesData.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Total KPI Score</span>
                  <p className="text-sm font-bold text-emerald-600">{formatKpiDisplay(stAdvisor.totalKpiScore)}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">KPI Grade</span>
                  <p className="text-sm font-bold text-sky-600">{stAdvisor.kpiGrade}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">AVG Break</span>
                  <p className="text-sm font-bold text-[#0F172A] font-mono">{stAdvisor.avgBreak}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">AVG MGT</span>
                  <p className="text-sm font-bold text-[#0F172A] font-mono">{stAdvisor.avgMgt}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">AVG Meeting</span>
                  <p className="text-sm font-bold text-[#0F172A] font-mono">{stAdvisor.avgMeeting}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Reach Call</span>
                  <p className="text-sm font-bold text-[#3B7A75]">{vtAdvisor.reachCall}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Talk Time</span>
                  <p className="text-sm font-bold text-[#0F172A] font-mono">{vtAdvisor.talkTime}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Meeting</span>
                  <p className="text-sm font-bold text-[#0F172A] font-mono">{vtAdvisor.meeting}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Actual Talk Time</span>
                  <p className="text-sm font-bold text-[#0F172A] font-mono">{vtAdvisor.actualTalkTime}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">CE Count</span>
                  <p className="text-sm font-bold text-[#0F172A]">{vtAdvisor.ceCount}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Final Sales</span>
                  <p className="text-sm font-bold text-[#0F172A]">৳{vtAdvisor.finalSales.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Overall KPI</span>
                  <p className="text-sm font-bold text-emerald-600">{formatKpiDisplay(vtAdvisor.overallKpi)}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Exam</span>
                  <p className="text-sm font-bold text-[#0F172A]">{vtAdvisor.exam}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">TT Amount</span>
                  <p className="text-sm font-bold text-[#0F172A]">৳{vtAdvisor.ttAmount.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Final Incentive</span>
                  <p className="text-sm font-bold text-[#3B7A75]">৳{vtAdvisor.finalIncentive.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold">Total Salary</span>
                  <p className="text-sm font-bold text-[#0F172A]">৳{vtAdvisor.totalSalary.toLocaleString('en-BD')}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 1-Click Review Quick Actions */}
        <div className="bg-[#F6F7F9] border border-teal-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3B7A75] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#3B7A75]" />
              1-Click Review Quick Actions
            </span>
            {quickActionToast && (
              <span className="text-[11px] text-emerald-600 font-semibold animate-pulse">
                {quickActionToast}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleQuickAssignCallingPush}
              className="flex items-center gap-2 bg-white hover:bg-teal-50 border border-[#E2E8F0] hover:border-teal-300 px-3 py-2 rounded-xl text-left transition-all group shadow-xs cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-100 text-[#3B7A75] flex items-center justify-center font-bold text-xs shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#0F172A] group-hover:text-[#3B7A75] block truncate">Assign 25-Call Push</span>
                <span className="text-[10px] text-[#64748B]">Calling Target</span>
              </div>
            </button>

            <button
              onClick={handleQuickAssignCeAudit}
              className="flex items-center gap-2 bg-white hover:bg-amber-50 border border-[#E2E8F0] hover:border-amber-300 px-3 py-2 rounded-xl text-left transition-all group shadow-xs cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                🎧
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#0F172A] group-hover:text-amber-800 block truncate">Assign CE Audit</span>
                <span className="text-[10px] text-[#64748B]">Quality Calibration</span>
              </div>
            </button>

            <button
              onClick={handleQuickLogConversion}
              className="flex items-center gap-2 bg-white hover:bg-emerald-50 border border-[#E2E8F0] hover:border-emerald-300 px-3 py-2 rounded-xl text-left transition-all group shadow-xs cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                ✅
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#0F172A] group-hover:text-emerald-800 block truncate">Log Converted Call</span>
                <span className="text-[10px] text-[#64748B]">+Course Closing</span>
              </div>
            </button>
          </div>
        </div>

        {/* Assigned Tasks Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5 text-[#3B7A75]" />
            <span>Assigned Tasks ({advisorTasks.length})</span>
          </h4>
          {advisorTasks.length === 0 ? (
            <p className="text-xs text-[#64748B] italic bg-[#F6F7F9] p-3 rounded-xl border border-[#E2E8F0]">
              No tasks currently assigned to this advisor.
            </p>
          ) : (
            <div className="space-y-2">
              {advisorTasks.map((t) => (
                <div key={t.id} className="bg-[#F6F7F9] border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#0F172A]">{t.title}</span>
                    <p className="text-[11px] text-[#64748B]">{t.category} • Due: {t.dueDate}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    t.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-teal-100 text-teal-800 border border-teal-200'
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-[#3B7A75]" />
              <span>Call Records ({advisorCallRecords.length})</span>
            </span>
            {advisorCallRecords.length > 0 && (
              <span className="text-[10px] text-[#3B7A75] font-mono font-bold">
                Avg Reach: {isStationed ? stAdvisor.avgReach : vtAdvisor.reachCall} calls
              </span>
            )}
          </h4>
          {advisorCallRecords.length === 0 ? (
            <p className="text-xs text-[#64748B] italic bg-[#F6F7F9] p-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
              <span>No individual call recordings logged yet for this advisor.</span>
              <span className="text-[10px] text-[#64748B] font-mono">Total Reach Calls: {isStationed ? stAdvisor.avgReach : vtAdvisor.reachCall}</span>
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {advisorCallRecords.map((rec) => (
                <div key={rec.id} className="bg-[#F6F7F9] border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F172A]">{rec.customerName}</span>
                      <span className="text-[10px] font-mono text-[#3B7A75]">{rec.customerPhone}</span>
                    </div>
                    <p className="text-[10px] text-[#64748B]">{rec.callType} • {rec.notes}</p>
                  </div>
                  <div className="text-right space-y-0.5 shrink-0">
                    <span className="font-mono font-bold text-[#3B7A75] block">{rec.duration}</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-white border border-[#E2E8F0] text-[#0F172A]">
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#3B7A75]" />
            <span>Time Logs ({advisorLogs.length})</span>
          </h4>
          {advisorLogs.length === 0 ? (
            <p className="text-xs text-[#64748B] italic bg-[#F6F7F9] p-3 rounded-xl border border-[#E2E8F0]">
              No time logs recorded for this advisor.
            </p>
          ) : (
            <div className="space-y-2">
              {advisorLogs.map((l) => (
                <div key={l.id} className="bg-[#F6F7F9] border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#0F172A] uppercase text-[10px] bg-white px-2 py-0.5 rounded border border-[#E2E8F0] mr-2">
                      {l.type}
                    </span>
                    <span className="text-[#64748B]">{l.notes}</span>
                  </div>
                  <span className="font-mono font-bold text-[#3B7A75]">
                    {Math.floor(l.durationSeconds / 60)} mins
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
          <button
            onClick={handleCopyBrief}
            className="bg-teal-50 hover:bg-teal-100 text-[#3B7A75] border border-teal-200 font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#3B7A75]" />}
            <span>{copied ? 'Brief Copied!' : 'Copy Performance Brief'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-[#F6F7F9] hover:bg-slate-200 text-[#0F172A] font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer border border-[#E2E8F0]"
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
