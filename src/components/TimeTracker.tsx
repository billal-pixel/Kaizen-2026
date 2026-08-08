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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="bg-cyan-950 text-cyan-400 border border-cyan-800/80 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase">
              Operational Time Tracker
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight mt-1">
              Live Activity & Break Timer
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Log exact talktime, break durations, management (MGT) tasks, and team briefings to calculate precise daily average operational times.
            </p>

            {/* Timer Type Selector Buttons */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setActiveType('talktime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeType === 'talktime'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Talktime</span>
              </button>

              <button
                onClick={() => setActiveType('break')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeType === 'break'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Break Time</span>
              </button>

              <button
                onClick={() => setActiveType('meeting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeType === 'meeting'
                    ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Meeting</span>
              </button>

              <button
                onClick={() => setActiveType('mgt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeType === 'mgt'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Management (MGT)</span>
              </button>
            </div>
          </div>

          {/* Stopwatch Display */}
          <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[280px] shadow-2xl relative">
            {isRunning && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            )}
            <span className="text-4xl sm:text-5xl font-mono font-black tracking-wider text-cyan-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              {formatSeconds(seconds)}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-2 flex items-center gap-1.5 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
              Active Session: <strong className="text-cyan-300">{activeType.toUpperCase()}</strong>
            </span>

            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 ${
                  isRunning
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20'
                    : 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 shadow-lg shadow-cyan-500/25'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>{isRunning ? 'Pause Timer' : 'Start Timer'}</span>
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  setSeconds(0);
                }}
                className="p-2.5 bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-all active:scale-95"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advisor & Notes Assignment Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Target Team</label>
            <select
              value={activeTeam}
              onChange={(e) => setActiveTeam(e.target.value as TeamType)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="stationed">Stationed Team</option>
              <option value="virtual">Virtual Team</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Select Advisor</label>
            <select
              value={selectedAdvisorId}
              onChange={(e) => setSelectedAdvisorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none"
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
            <label className="block text-slate-400 font-medium mb-1">Session Notes</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Outbound call block 1"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:outline-none"
              />
              <button
                onClick={handleSaveTimerLog}
                disabled={seconds === 0}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-md"
              >
                Log Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Tracking History Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Activity Logs & Operational Records ({logs.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-medium">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Advisor</th>
                <th className="p-3.5">Division</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5 text-right">Duration</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No activity logs recorded yet. Use the timer above to log operational sessions.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="p-3.5 font-semibold text-slate-200">{log.advisorName}</td>
                    <td className="p-3.5 uppercase text-cyan-400 font-medium text-[11px]">{log.team}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        log.type === 'talktime'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : log.type === 'break'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : log.type === 'meeting'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                      {formatSeconds(log.durationSeconds)}
                    </td>
                    <td className="p-3.5 text-slate-400">{log.notes}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
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
