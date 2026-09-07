import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StationedAdvisor, VirtualAdvisor, TeamType } from '../types';
import { UserPlus, X } from 'lucide-react';

interface AddAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStationed: (advisor: StationedAdvisor) => void;
  onAddVirtual: (advisor: VirtualAdvisor) => void;
}

export const AddAdvisorModal: React.FC<AddAdvisorModalProps> = ({
  isOpen,
  onClose,
  onAddStationed,
  onAddVirtual,
}) => {
  const [teamType, setTeamType] = useState<TeamType>('stationed');
  const [advisorName, setAdvisorName] = useState('');

  // Stationed Fields
  const [avgReach, setAvgReach] = useState(120);
  const [avgTalktime, setAvgTalktime] = useState('03:00:00');
  const [ceCount, setCeCount] = useState(0);
  const [avgExamMark, setAvgExamMark] = useState(85);
  const [avgBriefingMark, setAvgBriefingMark] = useState(88);
  const [finalSalesData, setFinalSalesData] = useState(150000);
  const [totalKpiScore, setTotalKpiScore] = useState(85);
  const [avgBreak, setAvgBreak] = useState('00:35:00');
  const [avgMgt, setAvgMgt] = useState('00:45:00');
  const [avgMeeting, setAvgMeeting] = useState('00:30:00');

  // Virtual Fields
  const [reachCall, setReachCall] = useState(140);
  const [talkTime, setTalkTime] = useState('04:00:00');
  const [meeting, setMeeting] = useState('01:00:00');
  const [actualTalkTime, setActualTalkTime] = useState('03:30:00');
  const [finalSales, setFinalSales] = useState(200000);
  const [overallKpi, setOverallKpi] = useState(88);
  const [exam, setExam] = useState(85);
  const [ttAmount, setTtAmount] = useState(220000);
  const [finalIncentive, setFinalIncentive] = useState(10000);
  const [totalSalary, setTotalSalary] = useState(40000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorName.trim()) return;

    if (teamType === 'stationed') {
      let grade: StationedAdvisor['kpiGrade'] = 'A';
      if (totalKpiScore >= 80) grade = 'A';
      else if (totalKpiScore >= 70) grade = 'B';
      else if (totalKpiScore >= 60) grade = 'C';
      else if (totalKpiScore >= 50) grade = 'D';
      else grade = 'PIP';

      const newAdvisor: StationedAdvisor = {
        id: `st-${Date.now()}`,
        advisorName,
        avgReach,
        avgTalktime,
        ceCount,
        avgExamMark,
        avgBriefingMark,
        finalSalesData,
        totalKpiScore,
        kpiGrade: grade,
        avgBreak,
        avgMgt,
        avgMeeting,
        status: 'active',
      };
      onAddStationed(newAdvisor);
    } else {
      const newAdvisor: VirtualAdvisor = {
        id: `vt-${Date.now()}`,
        advisorName,
        reachCall,
        talkTime,
        meeting,
        actualTalkTime,
        ceCount,
        finalSales,
        overallKpi,
        exam,
        ttAmount,
        finalIncentive,
        totalSalary,
        status: 'active',
      };
      onAddVirtual(newAdvisor);
    }

    onClose();
    setAdvisorName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#3B7A75]" />
            <h3 className="text-base font-bold text-[#0F172A]">Add New Advisor to Team Kaizen</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Team *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTeamType('stationed')}
                className={`py-2 rounded-lg font-bold border text-xs transition-all ${
                  teamType === 'stationed'
                    ? 'bg-[#3B7A75]/10 text-[#3B7A75] border-[#3B7A75]'
                    : 'bg-[#F6F7F9] text-slate-600 border-[#E2E8F0] hover:text-slate-900'
                }`}
              >
                Stationed Team
              </button>
              <button
                type="button"
                onClick={() => setTeamType('virtual')}
                className={`py-2 rounded-lg font-bold border text-xs transition-all ${
                  teamType === 'virtual'
                    ? 'bg-[#3B7A75]/10 text-[#3B7A75] border-[#3B7A75]'
                    : 'bg-[#F6F7F9] text-slate-600 border-[#E2E8F0] hover:text-slate-900'
                }`}
              >
                Virtual Team
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Advisor Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Anisur Rahman"
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2.5 text-[#0F172A] focus:outline-none focus:border-[#3B7A75]"
            />
          </div>

          {teamType === 'stationed' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Avg Reach</label>
                <input
                  type="number"
                  value={avgReach}
                  onChange={(e) => setAvgReach(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Avg Talktime</label>
                <input
                  type="text"
                  value={avgTalktime}
                  onChange={(e) => setAvgTalktime(e.target.value)}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">CE Count</label>
                <input
                  type="number"
                  value={ceCount}
                  onChange={(e) => setCeCount(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Avg Exam Mark</label>
                <input
                  type="number"
                  value={avgExamMark}
                  onChange={(e) => setAvgExamMark(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Avg Briefing Mark</label>
                <input
                  type="number"
                  value={avgBriefingMark}
                  onChange={(e) => setAvgBriefingMark(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Final Sales (BDT)</label>
                <input
                  type="number"
                  value={finalSalesData}
                  onChange={(e) => setFinalSalesData(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Total KPI Score (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={totalKpiScore}
                  onChange={(e) => setTotalKpiScore(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">AVG Break</label>
                <input
                  type="text"
                  value={avgBreak}
                  onChange={(e) => setAvgBreak(e.target.value)}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">AVG MGT</label>
                <input
                  type="text"
                  value={avgMgt}
                  onChange={(e) => setAvgMgt(e.target.value)}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">AVG Meeting</label>
                <input
                  type="text"
                  value={avgMeeting}
                  onChange={(e) => setAvgMeeting(e.target.value)}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reach Call</label>
                <input
                  type="number"
                  value={reachCall}
                  onChange={(e) => setReachCall(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Talk Time</label>
                <input
                  type="text"
                  value={talkTime}
                  onChange={(e) => setTalkTime(e.target.value)}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Meeting</label>
                <input
                  type="text"
                  value={meeting}
                  onChange={(e) => setMeeting(e.target.value)}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Actual Talk Time</label>
                <input
                  type="text"
                  value={actualTalkTime}
                  onChange={(e) => setActualTalkTime(e.target.value)}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">CE Count</label>
                <input
                  type="number"
                  value={ceCount}
                  onChange={(e) => setCeCount(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Final Sales (BDT)</label>
                <input
                  type="number"
                  value={finalSales}
                  onChange={(e) => setFinalSales(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Overall KPI (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={overallKpi}
                  onChange={(e) => setOverallKpi(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Exam Mark</label>
                <input
                  type="number"
                  value={exam}
                  onChange={(e) => setExam(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">TT Amount</label>
                <input
                  type="number"
                  value={ttAmount}
                  onChange={(e) => setTtAmount(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Final Incentive</label>
                <input
                  type="number"
                  value={finalIncentive}
                  onChange={(e) => setFinalIncentive(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Total Salary</label>
                <input
                  type="number"
                  value={totalSalary}
                  onChange={(e) => setTotalSalary(Number(e.target.value))}
                  className="w-full bg-[#F6F7F9] border border-[#E2E8F0] rounded-lg p-2 text-[#0F172A] font-bold"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#F6F7F9] hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-lg border border-[#E2E8F0] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#3B7A75] hover:opacity-90 text-white font-bold px-4 py-2 rounded-lg shadow-sm cursor-pointer"
            >
              Add Advisor
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
};
