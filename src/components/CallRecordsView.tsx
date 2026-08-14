import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CallRecord, StationedAdvisor, VirtualAdvisor, TeamType } from '../types';
import { 
  PhoneCall, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Play, 
  Pause, 
  Clock, 
  Award, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Volume2, 
  Trash2, 
  Copy, 
  Check, 
  FileSpreadsheet,
  PhoneOutgoing,
  ShieldCheck,
  User,
  X,
  ExternalLink,
  MessageSquare,
  FileAudio,
  Folder,
  CreditCard,
  Globe
} from 'lucide-react';

interface CallRecordsViewProps {
  records: CallRecord[];
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  onAddRecord: (record: Omit<CallRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord?: (record: CallRecord) => void;
  onSelectAdvisor: (advisor: StationedAdvisor | VirtualAdvisor, type: TeamType) => void;
}

export const CallRecordsView: React.FC<CallRecordsViewProps> = ({
  records,
  stationedAdvisors,
  virtualAdvisors,
  onAddRecord,
  onDeleteRecord,
  onUpdateRecord,
  onSelectAdvisor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<'all' | TeamType>('all');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('all');
  const [callTypeFilter, setCallTypeFilter] = useState<string>('all');
  const [dispositionFilter, setDispositionFilter] = useState<string>('all');

  // Helper to detect URL type
  const isFolderUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.includes('/folders/') || url.includes('/drive/folders/') || (url.includes('drive.google.com') && url.includes('folders'));
  };
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [driveEmbedRecord, setDriveEmbedRecord] = useState<CallRecord | null>(null);
  const [editUrlInput, setEditUrlInput] = useState<string>('');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [copiedPaymentTag, setCopiedPaymentTag] = useState<string | null>(null);

  const handleCopyPaymentMsg = (text: string, tag: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPaymentTag(tag);
    setTimeout(() => setCopiedPaymentTag(null), 2000);
  };

  useEffect(() => {
    if (driveEmbedRecord) {
      setEditUrlInput(driveEmbedRecord.recordingUrl || '');
      setIsEditingUrl(false);
    }
  }, [driveEmbedRecord]);

  // Real Web Audio Tone Generator & Speech Synthesizer
  const playAudioSynthTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(880, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Audio synth error:', e);
    }
  };

  const speakCallAuditNotes = (rec: CallRecord) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Call audit audio for ${rec.advisorName}. Customer: ${rec.customerName}. Disposition: ${rec.disposition}. Quality score: ${rec.qualityScore || 80} percent. Notes: ${rec.notes || 'No notes.'}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTogglePlay = (rec: CallRecord) => {
    if (activePlayingId === rec.id) {
      setActivePlayingId(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setActivePlayingId(rec.id);
      setPlaybackProgress(0);
      playAudioSynthTone();
      speakCallAuditNotes(rec);
    }
  };

  // Add Call Record Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Record Form State
  const [newTeam, setNewTeam] = useState<TeamType>('stationed');
  const [newAdvisorId, setNewAdvisorId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCallType, setNewCallType] = useState<CallRecord['callType']>('Outbound Reach');
  const [newDurationMin, setNewDurationMin] = useState('03');
  const [newDurationSec, setNewDurationSec] = useState('45');
  const [newDisposition, setNewDisposition] = useState<CallRecord['disposition']>('Interested');
  const [newQualityScore, setNewQualityScore] = useState('92');
  const [newNotes, setNewNotes] = useState('');
  const [newRecordingUrl, setNewRecordingUrl] = useState('https://drive.google.com/drive/folders/1Q9HLlE66in1e5mkT5GA_sWDouogLM8yu?ths=true');

  // Audio simulation timer
  React.useEffect(() => {
    let interval: any;
    if (activePlayingId) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setActivePlayingId(null);
            return 0;
          }
          return prev + 5;
        });
      }, 400);
    } else {
      setPlaybackProgress(0);
    }
    return () => clearInterval(interval);
  }, [activePlayingId]);

  // Combine advisors for filtering
  const allAdvisors = useMemo(() => {
    return [
      ...stationedAdvisors.map((a) => ({ ...a, teamType: 'stationed' as TeamType })),
      ...virtualAdvisors.map((a) => ({ ...a, teamType: 'virtual' as TeamType })),
    ];
  }, [stationedAdvisors, virtualAdvisors]);

  // Filtered Call Records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Team filter
      if (teamFilter !== 'all' && rec.team !== teamFilter) return false;
      // Advisor filter
      if (selectedAdvisorId !== 'all' && rec.advisorId !== selectedAdvisorId) return false;
      // Call type filter
      if (callTypeFilter !== 'all' && rec.callType !== callTypeFilter) return false;
      // Disposition filter
      if (dispositionFilter !== 'all' && rec.disposition !== dispositionFilter) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesAdvisor = rec.advisorName.toLowerCase().includes(query);
        const matchesCustomer = rec.customerName.toLowerCase().includes(query);
        const matchesPhone = rec.customerPhone.toLowerCase().includes(query);
        const matchesNotes = (rec.notes || '').toLowerCase().includes(query);
        const matchesEmp = (rec.employeeId || '').toLowerCase().includes(query);
        return matchesAdvisor || matchesCustomer || matchesPhone || matchesNotes || matchesEmp;
      }

      return true;
    });
  }, [records, teamFilter, selectedAdvisorId, callTypeFilter, dispositionFilter, searchTerm]);

  // Telemetry Calculations
  const totalCalls = filteredRecords.length;
  
  const totalSeconds = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.durationSeconds || 0), 0);
  }, [filteredRecords]);

  const avgSeconds = totalCalls > 0 ? Math.round(totalSeconds / totalCalls) : 0;
  const avgDurationFormatted = `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`;

  const convertedCount = filteredRecords.filter((r) => r.disposition === 'Converted').length;
  const conversionRate = totalCalls > 0 ? ((convertedCount / totalCalls) * 100).toFixed(1) : '0.0';

  const avgQualityScore = useMemo(() => {
    const scored = filteredRecords.filter((r) => r.qualityScore !== undefined);
    if (scored.length === 0) return 0;
    const sum = scored.reduce((acc, r) => acc + (r.qualityScore || 0), 0);
    return (sum / scored.length).toFixed(1);
  }, [filteredRecords]);

  // Handle Export CSV
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Call ID', 'Advisor Name', 'Employee ID', 'Team', 'Customer Name', 'Customer Phone', 'Call Type', 'Duration', 'Disposition', 'Quality Score', 'Call Date', 'Notes'];
    const rows = filteredRecords.map((r) => [
      r.id,
      `"${r.advisorName}"`,
      r.employeeId || '',
      r.team,
      `"${r.customerName}"`,
      `"${r.customerPhone}"`,
      r.callType,
      r.duration,
      r.disposition,
      r.qualityScore || '',
      `"${r.callDate}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Team_Kaizen_Call_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Submit New Record
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) return;

    let selectedAdvisorName = 'Unassigned';
    let employeeId = 'TE-ID';

    if (newTeam === 'stationed') {
      const adv = stationedAdvisors.find((a) => a.id === newAdvisorId) || stationedAdvisors[0];
      if (adv) {
        selectedAdvisorName = adv.advisorName;
        employeeId = adv.employeeId || 'TE-ID';
      }
    } else {
      const adv = virtualAdvisors.find((a) => a.id === newAdvisorId) || virtualAdvisors[0];
      if (adv) {
        selectedAdvisorName = adv.advisorName;
        employeeId = adv.employeeId || 'TE-ID';
      }
    }

    const durMin = parseInt(newDurationMin) || 0;
    const durSec = parseInt(newDurationSec) || 0;
    const totalSec = durMin * 60 + durSec;
    const formattedDuration = `${String(durMin).padStart(2, '0')}:${String(durSec).padStart(2, '0')}`;

    const nowStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    onAddRecord({
      advisorId: newAdvisorId || (newTeam === 'stationed' ? stationedAdvisors[0]?.id || 'st-1' : virtualAdvisors[0]?.id || 'vt-1'),
      advisorName: selectedAdvisorName,
      employeeId,
      team: newTeam,
      customerName: newCustomerName,
      customerPhone: newCustomerPhone,
      callType: newCallType,
      duration: formattedDuration,
      durationSeconds: totalSec,
      disposition: newDisposition,
      callDate: nowStr,
      qualityScore: parseInt(newQualityScore) || 90,
      recordingUrl: newRecordingUrl,
      notes: newNotes || 'Manual Telephony log entry.',
      sheetSource: 'Manual Telephony Log'
    });

    setIsModalOpen(false);
    // Reset form
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewNotes('');
    setNewRecordingUrl('https://drive.google.com/drive/folders/1Q9HLlE66in1e5mkT5GA_sWDouogLM8yu?ths=true');
  };

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDispositionBadge = (disposition: CallRecord['disposition']) => {
    switch (disposition) {
      case 'Converted':
        return <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Converted</span>;
      case 'Interested':
        return <span className="inline-flex items-center gap-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold"><UserCheck className="w-3 h-3 text-cyan-400" /> Interested</span>;
      case 'Follow-Up Needed':
        return <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold"><Clock className="w-3 h-3 text-amber-400" /> Follow-Up Needed</span>;
      case 'No Answer':
        return <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold"><PhoneOutgoing className="w-3 h-3 text-slate-400" /> No Answer</span>;
      case 'Not Interested':
        return <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold"><XCircle className="w-3 h-3 text-rose-400" /> Not Interested</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">{disposition}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#30AFFF]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[#92EEFF] text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <PhoneCall className="w-4 h-4 text-[#30AFFF] animate-pulse" />
              <span>Telephony & Call Audit Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Advisor Call Records & Audio Logs
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Real-time audit directory mapping reach calls, customer talktime, disposition outcomes, CE quality marks, and playback recordings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://drive.google.com/drive/folders/1BGEaDod5zXZ6nvoNfYsGvry02c2oElZk?ths=true"
              target="_blank"
              rel="noreferrer"
              className="bg-[#C4F7CA]/15 hover:bg-[#C4F7CA]/25 text-[#D8FFC5] hover:text-white border border-[#C4F7CA]/40 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
              title="Open Good Call Drive Folder"
            >
              <Folder className="w-4 h-4 text-[#C4F7CA] shrink-0" />
              <span className="whitespace-nowrap">Good Call</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#C4F7CA] opacity-80 shrink-0" />
            </a>

            <a
              href="https://drive.google.com/drive/folders/1Tk2c1pQKVmBhJkZqSeMHizWdeW_cMeah"
              target="_blank"
              rel="noreferrer"
              className="bg-[#30AFFF]/15 hover:bg-[#30AFFF]/25 text-[#92EEFF] hover:text-white border border-[#30AFFF]/40 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
              title="Open Follow Up Drive Folder"
            >
              <Folder className="w-4 h-4 text-[#30AFFF] shrink-0" />
              <span className="whitespace-nowrap">Follow Up</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#30AFFF] opacity-80 shrink-0" />
            </a>

            <button
              onClick={handleExportCsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#30AFFF]" />
              <span>Export CSV</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-[#30AFFF] via-[#92EEFF] to-[#C4F7CA] hover:brightness-110 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#30AFFF]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Call Record</span>
            </motion.button>
          </div>
        </div>

        {/* Top Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-[#30AFFF]/40 rounded-xl p-3.5 transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logged Calls</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">{totalCalls}</span>
              <span className="text-[10px] text-[#92EEFF] bg-[#30AFFF]/15 border border-[#30AFFF]/30 px-1.5 py-0.5 rounded font-mono font-bold">Live</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-[#92EEFF]/40 rounded-xl p-3.5 transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Duration</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-100 font-mono">{avgDurationFormatted}</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-[#C4F7CA]/40 rounded-xl p-3.5 transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conversion Rate</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#C4F7CA] font-mono">{conversionRate}%</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C4F7CA]" />
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 hover:border-[#D8FFC5]/40 rounded-xl p-3.5 transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg CE Audit Grade</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#D8FFC5] font-mono">{avgQualityScore}%</span>
              <Award className="w-3.5 h-3.5 text-[#D8FFC5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by advisor name, customer name, phone number, or notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#30AFFF] focus:ring-2 focus:ring-[#30AFFF]/20 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Team Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setTeamFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                teamFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Teams
            </button>
            <button
              onClick={() => setTeamFilter('stationed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                teamFilter === 'stationed'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stationed Team
            </button>
            <button
              onClick={() => setTeamFilter('virtual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                teamFilter === 'virtual'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Virtual Team
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Advisor</label>
            <select
              value={selectedAdvisorId}
              onChange={(e) => setSelectedAdvisorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Advisors ({allAdvisors.length})</option>
              <optgroup label="Stationed Team">
                {stationedAdvisors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.advisorName} ({a.employeeId || 'ST'})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Virtual Team">
                {virtualAdvisors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.advisorName} ({a.employeeId || 'VT'})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Call Type</label>
            <select
              value={callTypeFilter}
              onChange={(e) => setCallTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Call Types</option>
              <option value="Sales Closing">Sales Closing</option>
              <option value="Outbound Reach">Outbound Reach</option>
              <option value="CE Audit Call">CE Audit Call</option>
              <option value="Inbound Query">Inbound Query</option>
              <option value="Follow-Up Call">Follow-Up Call</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Advisor Payment Sharing Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 border border-pink-500/30 rounded-xl shrink-0">
            <CreditCard className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>Quick Advisor Payment Messages</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                10MS bKash/Nagad
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              1-Click copy payment messages for advisors Antu & Kayes to send to students.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Antu Payment Copy */}
          <button
            onClick={() => handleCopyPaymentMsg(
              'আসসালামু আলাইকুম, আমি অন্তু  ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01850890778 ধন্যবাদ।',
              'antu'
            )}
            className="flex-1 md:flex-none px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-pink-300 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Copy Antu's Payment Message"
          >
            {copiedPaymentTag === 'antu' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Antu (01850890778)!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-pink-400" />
                <span>Antu: 01850890778</span>
              </>
            )}
          </button>

          {/* Kayes Payment Copy */}
          <button
            onClick={() => handleCopyPaymentMsg(
              'আসসালামু আলাইকুম, আমি কায়েস ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা  নগদ  করুন  এই নাম্বারে 01644336738 ধন্যবাদ.',
              'kayes'
            )}
            className="flex-1 md:flex-none px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Copy Kayes's Payment Message"
          >
            {copiedPaymentTag === 'kayes' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Kayes (01644336738)!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Kayes: 01644336738</span>
              </>
            )}
          </button>

          {/* Quick Portal Links */}
          <div className="flex flex-wrap items-center gap-1.5 border-l border-slate-800 pl-2">
            <a
              href="https://drive.google.com/drive/folders/1BGEaDod5zXZ6nvoNfYsGvry02c2oElZk?ths=true"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              title="Good Call Drive Folder"
            >
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
              <span>Good Call</span>
              <ExternalLink className="w-3 h-3 text-emerald-400 opacity-70" />
            </a>

            <a
              href="https://drive.google.com/drive/folders/1Tk2c1pQKVmBhJkZqSeMHizWdeW_cMeah"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              title="Follow Up Drive Folder"
            >
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Follow Up</span>
              <ExternalLink className="w-3 h-3 text-indigo-400 opacity-70" />
            </a>

            <a
              href="https://sites.google.com/view/10msmirpur/home"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              title="10MS Mirpur Essential Link Google Site"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Essential Link</span>
              <ExternalLink className="w-3 h-3 text-cyan-400 opacity-70" />
            </a>

            <a
              href="https://sites.google.com/view/10ms-vt-essential/home"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-2 bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              title="Virtual Team Essential Links Google Site"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Virtual Link</span>
              <ExternalLink className="w-3 h-3 text-sky-400 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">Call Directory ({filteredRecords.length} records)</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Showing {filteredRecords.length} of {records.length} records
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <PhoneCall className="w-10 h-10 text-slate-600 mx-auto stroke-1" />
            <p className="text-sm font-semibold text-slate-400">No call records match your active search or filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setTeamFilter('all');
                setSelectedAdvisorId('all');
                setCallTypeFilter('all');
                setDispositionFilter('all');
              }}
              className="text-xs text-cyan-400 font-bold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Advisor & Team</th>
                  <th className="py-3 px-4">Call Details</th>
                  <th className="py-3 px-4">CE Audit & Notes</th>
                  <th className="py-3 px-4 min-w-[190px]">Drive Recording & Player</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {filteredRecords.map((rec) => {
                  const isPlaying = activePlayingId === rec.id;
                  const isStationed = rec.team === 'stationed';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Advisor column */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            if (isStationed) {
                              const adv = stationedAdvisors.find((a) => a.id === rec.advisorId || a.advisorName === rec.advisorName);
                              if (adv) onSelectAdvisor(adv, 'stationed');
                            } else {
                              const adv = virtualAdvisors.find((a) => a.id === rec.advisorId || a.advisorName === rec.advisorName);
                              if (adv) onSelectAdvisor(adv, 'virtual');
                            }
                          }}
                          className="flex items-center gap-2.5 group text-left cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs font-mono shrink-0 ${
                            isStationed ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
                          }`}>
                            {rec.advisorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors block">
                              {rec.advisorName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">{rec.employeeId || 'TE-ID'}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase font-mono ${
                                isStationed ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-sky-950 text-sky-400 border border-sky-800'
                              }`}>
                                {rec.team}
                              </span>
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* Call Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-200 block text-xs">{rec.callType}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {rec.callDate} • {rec.duration}
                          </span>
                        </div>
                      </td>

                      {/* CE Audit Score & Remarks Notes */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {rec.qualityScore !== undefined ? (
                              <span className={`font-mono font-extrabold px-2 py-0.5 rounded-md text-[11px] border ${
                                rec.qualityScore >= 90
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : rec.qualityScore >= 75
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}>
                                Grade: {rec.qualityScore}%
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px] italic">Not Audited</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">{rec.callDate}</span>
                          </div>

                          {rec.notes && (
                            <p className="text-[11px] text-slate-300 bg-slate-950/90 border border-slate-800 p-2 rounded-lg leading-relaxed flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{rec.notes}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Interactive Audio Player & Google Drive Recording Button */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-2">
                          {rec.recordingUrl && (
                            <div className="flex items-center gap-1.5">
                              {isFolderUrl(rec.recordingUrl) ? (
                                <>
                                  <a
                                    href={rec.recordingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 inline-flex items-center gap-1.5 text-xs bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm group justify-center cursor-pointer"
                                  >
                                    <Folder className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span>Open Drive Folder</span>
                                    <ExternalLink className="w-3 h-3 text-amber-400 opacity-80" />
                                  </a>
                                  <button
                                    onClick={() => setDriveEmbedRecord(rec)}
                                    title="View Audit Details & Voice Reader"
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 rounded-xl transition-colors shrink-0 cursor-pointer"
                                  >
                                    <FileAudio className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setDriveEmbedRecord(rec)}
                                    className="flex-1 inline-flex items-center gap-1.5 text-xs bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm group justify-center cursor-pointer"
                                  >
                                    <FileAudio className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                                    <span>Play Drive Player</span>
                                  </button>
                                  <a
                                    href={rec.recordingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open Drive File in New Tab"
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-colors shrink-0"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                                  </a>
                                </>
                              )}
                            </div>
                          )}

                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center gap-2">
                            <button
                              onClick={() => handleTogglePlay(rec)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isPlaying 
                                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 animate-pulse' 
                                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
                              }`}
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-slate-950" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-cyan-400 translate-x-0.5" />
                              )}
                            </button>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                                <span className="text-cyan-400 font-bold">{isPlaying ? '🔊 AUDIO ACTIVE' : 'AUDIO LOG'}</span>
                                <span>{isPlaying ? `${Math.round((playbackProgress / 100) * 10)}s` : rec.duration}</span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-400 to-sky-400 transition-all duration-300"
                                  style={{ width: isPlaying ? `${playbackProgress}%` : '0%' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          title="Delete Call Record"
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Call Record Modal */}
      <AnimatePresence>
        {isModalOpen && (
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
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-slate-100">Log New Advisor Call Record</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {/* Team Selection */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Select Advisor Team</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewTeam('stationed');
                        if (stationedAdvisors.length > 0) setNewAdvisorId(stationedAdvisors[0].id);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        newTeam === 'stationed'
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Stationed Advisor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewTeam('virtual');
                        if (virtualAdvisors.length > 0) setNewAdvisorId(virtualAdvisors[0].id);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        newTeam === 'virtual'
                          ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Virtual Advisor
                    </button>
                  </div>
                </div>

                {/* Advisor dropdown */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Advisor Name</label>
                  <select
                    value={newAdvisorId}
                    onChange={(e) => setNewAdvisorId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  >
                    {newTeam === 'stationed'
                      ? stationedAdvisors.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.advisorName} ({a.employeeId || 'ST'})
                          </option>
                        ))
                      : virtualAdvisors.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.advisorName} ({a.employeeId || 'VT'})
                          </option>
                        ))}
                  </select>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="e.g. Tanvir Hossain"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Customer Phone *</label>
                    <input
                      type="text"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="+880 1712-345678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                {/* Call Type & Disposition */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Call Type</label>
                    <select
                      value={newCallType}
                      onChange={(e) => setNewCallType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Outbound Reach">Outbound Reach</option>
                      <option value="Sales Closing">Sales Closing</option>
                      <option value="Inbound Query">Inbound Query</option>
                      <option value="CE Audit Call">CE Audit Call</option>
                      <option value="Follow-Up Call">Follow-Up Call</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Disposition Outcome</label>
                    <select
                      value={newDisposition}
                      onChange={(e) => setNewDisposition(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Converted">Converted</option>
                      <option value="Interested">Interested</option>
                      <option value="Follow-Up Needed">Follow-Up Needed</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                </div>

                {/* Duration & Quality Mark */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Duration (Min)</label>
                    <input
                      type="number"
                      min="0"
                      value={newDurationMin}
                      onChange={(e) => setNewDurationMin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Duration (Sec)</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={newDurationSec}
                      onChange={(e) => setNewDurationSec(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">CE Mark (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newQualityScore}
                      onChange={(e) => setNewQualityScore(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Google Drive Link */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Google Drive Recording / Folder URL</label>
                  <input
                    type="text"
                    value={newRecordingUrl}
                    onChange={(e) => setNewRecordingUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/... or file link"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-cyan-300 font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Call Notes */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Call Notes & Remarks</label>
                  <textarea
                    rows={3}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Enter call outcome details, student course interest, payment method..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save Call Record
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Drive Call Recording Embedded Player Modal */}
      <AnimatePresence>
        {driveEmbedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileAudio className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{driveEmbedRecord.advisorName}</h3>
                    <p className="text-xs text-slate-400">Google Drive Call Audit Player</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDriveEmbedRecord(null)} 
                  className="text-slate-500 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* In-App Direct Audio Player Engine */}
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    IN-APP AUDIO PLAYER ENGINE
                  </span>
                  <span className="text-slate-400">{driveEmbedRecord.duration}</span>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => handleTogglePlay(driveEmbedRecord)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activePlayingId === driveEmbedRecord.id
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {activePlayingId === driveEmbedRecord.id ? (
                      <>
                        <Pause className="w-4 h-4 fill-white" />
                        <span>Stop Voice Audit</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Play Voice Audit Aloud</span>
                      </>
                    )}
                  </button>

                  <div className="flex-1 space-y-1 text-right">
                    <p className="text-[10px] text-cyan-300 font-semibold truncate">
                      {activePlayingId === driveEmbedRecord.id ? '🔊 Playing Audio & Speech Output...' : 'Ready to stream audio'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">Web Audio Synth + Voice Synthesizer</p>
                  </div>
                </div>
              </div>

              {/* Google Drive Embedded Player & Notice */}
              <div className="space-y-3">
                {driveEmbedRecord.recordingUrl ? (
                  isFolderUrl(driveEmbedRecord.recordingUrl) ? (
                    <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="w-5 h-5 text-amber-400 shrink-0" />
                          <span className="font-mono text-amber-300 font-bold text-xs uppercase tracking-wider">
                            GOOGLE DRIVE CALL AUDIO FOLDER
                          </span>
                        </div>
                        <span className="text-[10px] bg-amber-950 border border-amber-800 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                          Folder Link
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        This link points to a <strong>Google Drive Call Audio Folder</strong> containing team call recordings. Click below to open and listen to the files inside Drive:
                      </p>

                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs font-mono text-cyan-300 truncate">
                        {driveEmbedRecord.recordingUrl}
                      </div>

                      <a
                        href={driveEmbedRecord.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                      >
                        <Folder className="w-4 h-4 fill-slate-950/20" />
                        <span>Open Drive Call Recordings Folder (New Tab)</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-mono text-cyan-400 font-bold">GOOGLE DRIVE EMBEDDED STREAM</span>
                        <a
                          href={driveEmbedRecord.recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline text-[11px] flex items-center gap-1"
                        >
                          <span>Open Drive File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <iframe
                        src={driveEmbedRecord.recordingUrl.replace('/view', '/preview').replace('/edit', '/preview')}
                        width="100%"
                        height="150"
                        allow="autoplay"
                        title="Google Drive Call Recording Player"
                        className="rounded-xl border border-slate-800 bg-slate-950 shadow-inner"
                      />
                    </div>
                  )
                ) : (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                    No Google Drive recording link configured for this record.
                  </div>
                )}

                {/* Drive Link Notice & Troubleshooting */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-200/90 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Google Drive Access & Link Permission</span>
                  </div>
                  <p>
                    If Google Drive displays <strong className="text-amber-100 font-mono">"Sorry, the file you have requested does not exist"</strong>, please ensure:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-200/80 text-[10.5px]">
                    <li>The file sharing in Google Drive is set to <strong>"Anyone with the link can view"</strong>.</li>
                    <li>Or paste a valid, shared Drive / MP3 link in the link editor below.</li>
                  </ul>
                </div>
              </div>

              {/* Link Editor */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">Recording Link URL</label>
                  <button
                    onClick={() => setIsEditingUrl(!isEditingUrl)}
                    className="text-[10px] text-cyan-400 hover:underline font-semibold"
                  >
                    {isEditingUrl ? 'Cancel Edit' : 'Edit Recording Link'}
                  </button>
                </div>

                {isEditingUrl ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editUrlInput}
                      onChange={(e) => setEditUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../view or direct MP3 link"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      onClick={() => {
                        const updated = { ...driveEmbedRecord, recordingUrl: editUrlInput };
                        setDriveEmbedRecord(updated);
                        if (onUpdateRecord) {
                          onUpdateRecord(updated);
                        }
                        setIsEditingUrl(false);
                      }}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Save Updated Recording URL
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-mono truncate bg-slate-900 p-2 rounded-lg border border-slate-850">
                    {driveEmbedRecord.recordingUrl || 'No URL configured'}
                  </p>
                )}
              </div>

              {/* Details summary */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span>Call Type: <strong>{driveEmbedRecord.callType}</strong></span>
                  <span className="text-emerald-400 font-bold">Grade: {driveEmbedRecord.qualityScore}%</span>
                </div>
                {driveEmbedRecord.notes && (
                  <p className="text-slate-300 text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong>Audit Remarks:</strong> {driveEmbedRecord.notes}
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 pt-1">
                {driveEmbedRecord.recordingUrl && (
                  <a
                    href={driveEmbedRecord.recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <span>Open in Drive New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setDriveEmbedRecord(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
