import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StationedAdvisor, VirtualAdvisor, TaskItem, TimeLog, CallRecord } from '../types';
import { formatKpiDisplay } from '../utils/sheetParser';
import { User, Award, PhoneCall, DollarSign, Clock, CheckSquare, X, Edit2, Copy, Check } from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';

interface AdvisorDetailModalProps {
  advisor: StationedAdvisor | VirtualAdvisor | null;
  type: 'stationed' | 'virtual';
  tasks: TaskItem[];
  timeLogs: TimeLog[];
  callRecords?: CallRecord[];
  onClose: () => void;
  onUpdate: (updated: any) => void;
}

export const AdvisorDetailModal: React.FC<AdvisorDetailModalProps> = ({
  advisor,
  type,
  tasks,
  timeLogs,
  callRecords = [],
  onClose,
  onUpdate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!advisor) return null;

  const isStationed = type === 'stationed';
  const stAdvisor = advisor as StationedAdvisor;
  const vtAdvisor = advisor as VirtualAdvisor;

  const advisorTasks = tasks.filter((t) => t.assignedAdvisorId === advisor.id);
  const advisorLogs = timeLogs.filter((l) => l.advisorId === advisor.id);
  const advisorCallRecords = callRecords.filter(
    (c) => c.advisorId === advisor.id || c.advisorName.toLowerCase() === advisor.advisorName.toLowerCase()
  );

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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-[#30AFFF]/15 border border-[#30AFFF]/30 text-[#92EEFF] font-black flex items-center justify-center text-lg font-mono shadow-md">
                {advisor.advisorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <KaizenLogo size="sm" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{advisor.advisorName}</h3>
                <span className="bg-[#30AFFF]/15 text-[#92EEFF] border border-[#30AFFF]/30 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md font-mono">
                  {type}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[#92EEFF] font-semibold">{advisor.employeeId || 'TE-ID'}</span>
                <span>•</span>
                <span>{advisor.advisorDesignation || (isStationed ? 'Trainee Advisor Station' : 'Trainee Advisor Virtual')}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Metrics Grid */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Operational Metrics (12 Fields)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {isStationed ? (
              <>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Reach</span>
                  <p className="text-sm font-bold text-cyan-400">{stAdvisor.avgReach}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Talktime</span>
                  <p className="text-sm font-bold text-slate-200 font-mono">{stAdvisor.avgTalktime}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">CE Count</span>
                  <p className="text-sm font-bold text-slate-200">{stAdvisor.ceCount}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Exam Mark</span>
                  <p className="text-sm font-bold text-slate-200">{stAdvisor.avgExamMark}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Avg Briefing Mark</span>
                  <p className="text-sm font-bold text-slate-200">{stAdvisor.avgBriefingMark}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Final Sales Data</span>
                  <p className="text-sm font-bold text-slate-100">৳{stAdvisor.finalSalesData.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total KPI Score</span>
                  <p className="text-sm font-bold text-emerald-400">{formatKpiDisplay(stAdvisor.totalKpiScore)}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">KPI Grade</span>
                  <p className="text-sm font-bold text-sky-400">{stAdvisor.kpiGrade}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">AVG Break</span>
                  <p className="text-sm font-bold text-slate-300 font-mono">{stAdvisor.avgBreak}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">AVG MGT</span>
                  <p className="text-sm font-bold text-slate-300 font-mono">{stAdvisor.avgMgt}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">AVG Meeting</span>
                  <p className="text-sm font-bold text-slate-300 font-mono">{stAdvisor.avgMeeting}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Reach Call</span>
                  <p className="text-sm font-bold text-cyan-400">{vtAdvisor.reachCall}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Talk Time</span>
                  <p className="text-sm font-bold text-slate-200 font-mono">{vtAdvisor.talkTime}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Meeting</span>
                  <p className="text-sm font-bold text-slate-200 font-mono">{vtAdvisor.meeting}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Actual Talk Time</span>
                  <p className="text-sm font-bold text-slate-200 font-mono">{vtAdvisor.actualTalkTime}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">CE Count</span>
                  <p className="text-sm font-bold text-slate-200">{vtAdvisor.ceCount}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Final Sales</span>
                  <p className="text-sm font-bold text-slate-100">৳{vtAdvisor.finalSales.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Overall KPI</span>
                  <p className="text-sm font-bold text-emerald-400">{formatKpiDisplay(vtAdvisor.overallKpi)}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Exam</span>
                  <p className="text-sm font-bold text-slate-200">{vtAdvisor.exam}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">TT Amount</span>
                  <p className="text-sm font-bold text-slate-200">৳{vtAdvisor.ttAmount.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Final Incentive</span>
                  <p className="text-sm font-bold text-cyan-400">৳{vtAdvisor.finalIncentive.toLocaleString('en-BD')}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Salary</span>
                  <p className="text-sm font-bold text-slate-100">৳{vtAdvisor.totalSalary.toLocaleString('en-BD')}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Assigned Tasks Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span>Assigned Tasks ({advisorTasks.length})</span>
          </h4>
          {advisorTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
              No tasks currently assigned to this advisor.
            </p>
          ) : (
            <div className="space-y-2">
              {advisorTasks.map((t) => (
                <div key={t.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{t.title}</span>
                    <p className="text-[11px] text-slate-400">{t.category} • Due: {t.dueDate}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    t.status === 'completed' ? 'bg-[#C4F7CA]/15 text-[#C4F7CA] border border-[#C4F7CA]/30' : 'bg-[#30AFFF]/15 text-[#92EEFF] border border-[#30AFFF]/30'
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-[#30AFFF]" />
              <span>Call Records ({advisorCallRecords.length})</span>
            </span>
            {advisorCallRecords.length > 0 && (
              <span className="text-[10px] text-[#92EEFF] font-mono">
                Avg Reach: {isStationed ? stAdvisor.avgReach : vtAdvisor.reachCall} calls
              </span>
            )}
          </h4>
          {advisorCallRecords.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 flex items-center justify-between">
              <span>No individual call recordings logged yet for this advisor.</span>
              <span className="text-[10px] text-slate-400 font-mono">Total Reach Calls: {isStationed ? stAdvisor.avgReach : vtAdvisor.reachCall}</span>
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {advisorCallRecords.map((rec) => (
                <div key={rec.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{rec.customerName}</span>
                      <span className="text-[10px] font-mono text-[#92EEFF]">{rec.customerPhone}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{rec.callType} • {rec.notes}</p>
                  </div>
                  <div className="text-right space-y-0.5 shrink-0">
                    <span className="font-mono font-bold text-[#92EEFF] block">{rec.duration}</span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#30AFFF]" />
            <span>Time Logs ({advisorLogs.length})</span>
          </h4>
          {advisorLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
              No time logs recorded for this advisor.
            </p>
          ) : (
            <div className="space-y-2">
              {advisorLogs.map((l) => (
                <div key={l.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 uppercase text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 mr-2">
                      {l.type}
                    </span>
                    <span className="text-slate-300">{l.notes}</span>
                  </div>
                  <span className="font-mono font-bold text-[#92EEFF]">
                    {Math.floor(l.durationSeconds / 60)} mins
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleCopyBrief}
            className="bg-[#30AFFF]/15 hover:bg-[#30AFFF]/25 text-[#92EEFF] hover:text-white border border-[#30AFFF]/40 font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#C4F7CA]" /> : <Copy className="w-4 h-4 text-[#30AFFF]" />}
            <span>{copied ? 'Brief Copied!' : 'Copy Performance Brief'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
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
