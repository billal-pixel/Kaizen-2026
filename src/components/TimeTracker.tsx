import React, { useState, useEffect } from 'react';
import { TimeLog, TeamType, StationedAdvisor, VirtualAdvisor } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Clock, 
  Calendar, 
  User, 
  Coffee, 
  PhoneCall, 
  Users, 
  Briefcase, 
  Trash2 
} from 'lucide-react';

interface TimeTrackerProps {
  logs: TimeLog[];
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  onAddLog: (log: TimeLog) => void;
  onDeleteLog: (id: string) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  logs,
  stationedAdvisors,
  virtualAdvisors,
  onAddLog,
  onDeleteLog,
}) => {
  // Timer State
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [activeType, setActiveType] = useState<TimeLog['type']>('talktime');
  const [activeTeam, setActiveTeam] = useState<TeamType>('stationed');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveTimerLog = () => {
    if (seconds === 0) return;

    let advisorName = 'Unassigned';
    if (activeTeam === 'stationed') {
      const found = stationedAdvisors.find((a) => a.id === selectedAdvisorId);
      if (found) advisorName = found.advisorName;
    } else {
      const found = virtualAdvisors.find((a) => a.id === selectedAdvisorId);
      if (found) advisorName = found.advisorName;
    }

    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      advisorId: selectedAdvisorId,
      advisorName,
      team: activeTeam,
      type: activeType,
      durationSeconds: seconds,
      notes: logNotes || `${activeType.toUpperCase()} session logged`,
      timestamp: new Date().toLocaleString(),
    };

    onAddLog(newLog);
    setIsRunning(false);
    setSeconds(0);
    setLogNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Live Operational Stopwatch Card */}
      <div className="main-card container-box bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase font-mono">
              Operational Time Tracker
            </span>
            <h2 className="card-title text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Live Activity & Break Timer
            </h2>
            <p className="subtext text-xs text-slate-600 mt-1 max-w-xl font-medium">
              Log exact talktime, break durations, management (MGT) tasks, and team briefings to calculate precise daily average operational times.
            </p>

            {/* Timer Type Selector Buttons */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setActiveType('talktime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeType === 'talktime'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Talktime</span>
              </button>

              <button
                onClick={() => setActiveType('break')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeType === 'break'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Break Time</span>
              </button>

              <button
                onClick={() => setActiveType('meeting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeType === 'meeting'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Meeting</span>
              </button>

              <button
                onClick={() => setActiveType('mgt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeType === 'mgt'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Management (MGT)</span>
              </button>
            </div>
          </div>

          {/* Stopwatch Display */}
          <div className="kpi-card metric-box bg-slate-50/90 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[280px] shadow-xs relative">
            {isRunning && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
            )}
            <span className="metric-value text-4xl sm:text-5xl font-mono font-black tracking-wider text-slate-900">
              {formatSeconds(seconds)}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mt-2 flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              Active Session: <strong className="text-indigo-600">{activeType.toUpperCase()}</strong>
            </span>

            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isRunning ? 'Pause Timer' : 'Start Timer'}</span>
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setSeconds(0);
                }}
                className="p-2.5 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advisor & Notes Assignment Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="label-text block text-slate-700 font-bold mb-1">Target Team</label>
            <select
              value={activeTeam}
              onChange={(e) => setActiveTeam(e.target.value as TeamType)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-2xs"
            >
              <option value="stationed">Stationed Team</option>
              <option value="virtual">Virtual Team</option>
            </select>
          </div>

          <div>
            <label className="label-text block text-slate-700 font-bold mb-1">Select Advisor</label>
            <select
              value={selectedAdvisorId}
              onChange={(e) => setSelectedAdvisorId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-2xs"
            >
              <option value="">Select Advisor Name</option>
              {activeTeam === 'stationed'
                ? stationedAdvisors.map((a) => (
                    <option key={a.id} value={a.id}>{a.advisorName}</option>
                  ))
                : virtualAdvisors.map((a) => (
                    <option key={a.id} value={a.id}>{a.advisorName}</option>
                  ))}
            </select>
          </div>

          <div>
            <label className="label-text block text-slate-700 font-bold mb-1">Session Notes</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Outbound call block 1"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
              />
              <button
                onClick={handleSaveTimerLog}
                disabled={seconds === 0}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Log Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Tracking History Log Table */}
      <div className="main-card container-box bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="card-title font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Activity Logs & Operational Records ({logs.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-bold text-[11px]">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Advisor</th>
                <th className="p-3.5">Team</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5 text-right">Duration</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No activity logs recorded yet. Use the timer above to log operational sessions.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="p-3.5 text-slate-600 font-mono text-[11px] font-medium">{log.timestamp}</td>
                    <td className="p-3.5 font-bold text-slate-900">{log.advisorName}</td>
                    <td className="p-3.5 uppercase text-indigo-600 font-bold text-[11px]">{log.team}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
                        log.type === 'talktime'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : log.type === 'break'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : log.type === 'meeting'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-slate-900">
                      {formatSeconds(log.durationSeconds)}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">{log.notes}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
