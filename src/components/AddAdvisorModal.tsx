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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Add New Advisor to Team Kaizen</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Select Team *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTeamType('stationed')}
                className={`py-2 rounded-lg font-bold border text-xs transition-all ${
                  teamType === 'stationed'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Stationed Team
              </button>
              <button
                type="button"
                onClick={() => setTeamType('virtual')}
                className={`py-2 rounded-lg font-bold border text-xs transition-all ${
                  teamType === 'virtual'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Virtual Team
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Advisor Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Anisur Rahman"
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {teamType === 'stationed' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Avg Reach</label>
                <input
                  type="number"
                  value={avgReach}
                  onChange={(e) => setAvgReach(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Avg Talktime</label>
                <input
                  type="text"
                  value={avgTalktime}
                  onChange={(e) => setAvgTalktime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">CE Count</label>
                <input
                  type="number"
                  value={ceCount}
                  onChange={(e) => setCeCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Avg Exam Mark</label>
                <input
                  type="number"
                  value={avgExamMark}
                  onChange={(e) => setAvgExamMark(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Avg Briefing Mark</label>
                <input
                  type="number"
                  value={avgBriefingMark}
                  onChange={(e) => setAvgBriefingMark(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Final Sales (BDT)</label>
                <input
                  type="number"
                  value={finalSalesData}
                  onChange={(e) => setFinalSalesData(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Total KPI Score (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={totalKpiScore}
                  onChange={(e) => setTotalKpiScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">AVG Break</label>
                <input
                  type="text"
                  value={avgBreak}
                  onChange={(e) => setAvgBreak(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">AVG MGT</label>
                <input
                  type="text"
                  value={avgMgt}
                  onChange={(e) => setAvgMgt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">AVG Meeting</label>
                <input
                  type="text"
                  value={avgMeeting}
                  onChange={(e) => setAvgMeeting(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Reach Call</label>
                <input
                  type="number"
                  value={reachCall}
                  onChange={(e) => setReachCall(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Talk Time</label>
                <input
                  type="text"
                  value={talkTime}
                  onChange={(e) => setTalkTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Meeting</label>
                <input
                  type="text"
                  value={meeting}
                  onChange={(e) => setMeeting(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Actual Talk Time</label>
                <input
                  type="text"
                  value={actualTalkTime}
                  onChange={(e) => setActualTalkTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">CE Count</label>
                <input
                  type="number"
                  value={ceCount}
                  onChange={(e) => setCeCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Final Sales (BDT)</label>
                <input
                  type="number"
                  value={finalSales}
                  onChange={(e) => setFinalSales(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Overall KPI (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={overallKpi}
                  onChange={(e) => setOverallKpi(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Exam Mark</label>
                <input
                  type="number"
                  value={exam}
                  onChange={(e) => setExam(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">TT Amount</label>
                <input
                  type="number"
                  value={ttAmount}
                  onChange={(e) => setTtAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Final Incentive</label>
                <input
                  type="number"
                  value={finalIncentive}
                  onChange={(e) => setFinalIncentive(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Total Salary</label>
                <input
                  type="number"
                  value={totalSalary}
                  onChange={(e) => setTotalSalary(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-bold"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 text-slate-300 font-medium px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg shadow-md"
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
