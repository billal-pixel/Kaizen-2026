import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { StationedAdvisor, VirtualAdvisor } from '../types';
import { parseRawRows, parseCsvText, formatKpiDisplay } from '../utils/sheetParser';
import { 
  FileSpreadsheet, 
  Upload, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clipboard, 
  Sparkles, 
  Layers, 
  HelpCircle,
  Eye
} from 'lucide-react';
import { KaizenLogo } from './KaizenLogo';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStationedData: (data: StationedAdvisor[], replace?: boolean) => void;
  onImportVirtualData: (data: VirtualAdvisor[], replace?: boolean) => void;
  sheetUrl?: string;
  onUpdateSheetUrl?: (newUrl: string) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  onImportStationedData,
  onImportVirtualData,
  sheetUrl: externalSheetUrl,
  onUpdateSheetUrl,
}) => {
  const defaultSheetUrl = 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit#gid=0';
  
  const [syncMode, setSyncMode] = useState<'paste' | 'url' | 'upload'>('url');
  const [targetTeam, setTargetTeam] = useState<'auto' | 'stationed' | 'virtual'>('auto');
  const [sheetUrl, setSheetUrl] = useState(externalSheetUrl || defaultSheetUrl);
  const [pastedText, setPastedText] = useState('');
  const [importOption, setImportOption] = useState<'replace' | 'append'>('replace');

  // Quick Sheet Presets
  const sheetPresets = [
    {
      name: 'Primary Kaizen Live Sheet (TEAM KAIZEN)',
      url: 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit#gid=0',
      badge: 'Main Live Sheet'
    },
    {
      name: 'Secondary Sheet (1OenfVVwq4xEk...)',
      url: 'https://docs.google.com/spreadsheets/d/1OenfVVwq4xEk_8s-LoRwxBh2_vMEtwe9COUy9bNa8kM/edit?gid=0#gid=0',
      badge: 'Archive Sheet'
    }
  ];
  
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preview state
  const [previewStationed, setPreviewStationed] = useState<StationedAdvisor[] | null>(null);
  const [previewVirtual, setPreviewVirtual] = useState<VirtualAdvisor[] | null>(null);

  if (!isOpen) return null;

  const processRows = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setErrorMsg('No data rows found. Please check table headers or copy-paste range.');
      setSyncing(false);
      return;
    }

    const result = parseRawRows(rows, targetTeam);

    if (result.virtual.length > 0) {
      setPreviewVirtual(result.virtual);
      setPreviewStationed(null);
      setSuccessMsg(`Successfully parsed ${result.virtual.length} Virtual Advisor records. Review preview below and click Apply.`);
    } else if (result.stationed.length > 0) {
      setPreviewStationed(result.stationed);
      setPreviewVirtual(null);
      setSuccessMsg(`Successfully parsed ${result.stationed.length} Stationed Advisor records. Review preview below and click Apply.`);
    } else {
      setErrorMsg(result.error || 'Failed to detect valid advisor columns in provided data.');
      setPreviewStationed(null);
      setPreviewVirtual(null);
    }

    setSyncing(false);
  };

  const handleFetchSheet = async (overrideUrl?: string) => {
    const urlToFetch = overrideUrl || sheetUrl;
    setSyncing(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    setPreviewStationed(null);
    setPreviewVirtual(null);

    if (onUpdateSheetUrl) {
      onUpdateSheetUrl(urlToFetch);
    }

    try {
      const response = await fetch(`/api/sheets-sync-all?url=${encodeURIComponent(urlToFetch)}`);
      if (!response.ok) {
        throw new Error('Google Sheet is restricted or private. Switch to "Paste Sheet Cells" tab above to paste cells in 1 click!');
      }

      const syncResult = await response.json();
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Failed to fetch Google Sheet data.');
      }

      if (syncResult.isRestricted && Object.keys(syncResult.sheets || {}).length === 0) {
        setErrorMsg('This Google Sheet is currently private or restricted. Set sharing to "Anyone with the link can view", or use "Paste Sheet Cells" to copy rows directly!');
        setSyncing(false);
        return;
      }

      let allStationed: StationedAdvisor[] = [];
      let allVirtual: VirtualAdvisor[] = [];

      for (const gid of Object.keys(syncResult.sheets || {})) {
        const csvText = syncResult.sheets[gid];
        if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('document-root')) continue;

        const parsed = await parseCsvText(csvText, targetTeam);
        if (parsed.stationed.length > 0) allStationed = [...allStationed, ...parsed.stationed];
        if (parsed.virtual.length > 0) allVirtual = [...allVirtual, ...parsed.virtual];
      }

      if (allStationed.length > 0 && allVirtual.length > 0) {
        setPreviewStationed(allStationed);
        setPreviewVirtual(allVirtual);
        setSuccessMsg(`Successfully connected & parsed ${allStationed.length} Stationed Advisors & ${allVirtual.length} Virtual Advisors!`);
      } else if (allVirtual.length > 0) {
        setPreviewVirtual(allVirtual);
        setPreviewStationed(null);
        setSuccessMsg(`Successfully connected & parsed ${allVirtual.length} Virtual Advisors!`);
      } else if (allStationed.length > 0) {
        setPreviewStationed(allStationed);
        setPreviewVirtual(null);
        setSuccessMsg(`Successfully connected & parsed ${allStationed.length} Stationed Advisors!`);
      } else {
        setErrorMsg('Connected sheet URL, but no valid advisor rows were detected in the public response. If this sheet is private, copy cells and paste in "Paste Sheet Cells".');
      }

      setSyncing(false);
    } catch (err: any) {
      console.warn('Sheets proxy warning:', err);
      setErrorMsg(err?.message || 'Failed to fetch sheet data.');
      setSyncing(false);
    }
  };

  const handleParsePastedText = async () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste text copied directly from your Google Sheet or Excel.');
      return;
    }

    setSyncing(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const parsed = await parseCsvText(pastedText, targetTeam);

    if (parsed.stationed.length > 0 && parsed.virtual.length > 0) {
      setPreviewStationed(parsed.stationed);
      setPreviewVirtual(parsed.virtual);
      setSuccessMsg(`Parsed ${parsed.stationed.length} Stationed Advisors & ${parsed.virtual.length} Virtual Advisors!`);
    } else if (parsed.virtual.length > 0) {
      setPreviewVirtual(parsed.virtual);
      setPreviewStationed(null);
      setSuccessMsg(`Parsed ${parsed.virtual.length} Virtual Advisors!`);
    } else if (parsed.stationed.length > 0) {
      setPreviewStationed(parsed.stationed);
      setPreviewVirtual(null);
      setSuccessMsg(`Parsed ${parsed.stationed.length} Stationed Advisors!`);
    } else {
      setErrorMsg(parsed.error || 'Failed to detect valid advisor columns in pasted text.');
    }

    setSyncing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncing(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const parsed = await parseCsvText(text, targetTeam);

      if (parsed.stationed.length > 0 && parsed.virtual.length > 0) {
        setPreviewStationed(parsed.stationed);
        setPreviewVirtual(parsed.virtual);
        setSuccessMsg(`Parsed ${parsed.stationed.length} Stationed Advisors & ${parsed.virtual.length} Virtual Advisors from file!`);
      } else if (parsed.virtual.length > 0) {
        setPreviewVirtual(parsed.virtual);
        setPreviewStationed(null);
        setSuccessMsg(`Parsed ${parsed.virtual.length} Virtual Advisors from file!`);
      } else if (parsed.stationed.length > 0) {
        setPreviewStationed(parsed.stationed);
        setPreviewVirtual(null);
        setSuccessMsg(`Parsed ${parsed.stationed.length} Stationed Advisors from file!`);
      } else {
        setErrorMsg(parsed.error || 'Failed to detect valid advisor columns in file.');
      }

      setSyncing(false);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    const isReplace = importOption === 'replace';
    let applied = false;

    if (previewStationed && previewStationed.length > 0) {
      onImportStationedData(previewStationed, isReplace);
      applied = true;
    }
    
    if (previewVirtual && previewVirtual.length > 0) {
      onImportVirtualData(previewVirtual, isReplace);
      applied = true;
    }

    if (applied) {
      onClose();
    } else {
      setErrorMsg('No parsed advisor data to apply.');
    }
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
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <KaizenLogo size="sm" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Sync Data from Google Sheets</h3>
              <p className="text-[11px] text-slate-400">Kaizen Team Live Metrics & Advisory Performance Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Team & Sync Method Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Target Advisory Team:</span>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setTargetTeam('auto')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  targetTeam === 'auto' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Auto Detect
              </button>
              <button
                type="button"
                onClick={() => setTargetTeam('stationed')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  targetTeam === 'stationed' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stationed Team
              </button>
              <button
                type="button"
                onClick={() => setTargetTeam('virtual')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  targetTeam === 'virtual' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Virtual Team
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setSyncMode('paste')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                syncMode === 'paste' ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30' : 'hover:text-slate-200'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste Sheet Cells (Ctrl+C)</span>
            </button>
            <button
              onClick={() => setSyncMode('url')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                syncMode === 'url' ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30' : 'hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sheet Link URL</span>
            </button>
            <button
              onClick={() => setSyncMode('upload')}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                syncMode === 'upload' ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30' : 'hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Sheet URL */}
        {syncMode === 'url' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">Google Sheet Shareable URL</label>
              <span className="text-[10px] text-cyan-400 font-mono">Select preset or paste URL</span>
            </div>

            {/* Quick Sheet Link Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Connected Sheets:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {sheetPresets.map((preset) => {
                  const isSelected = sheetUrl.includes(preset.url.split('/d/')[1]?.substring(0, 15) || '');
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setSheetUrl(preset.url);
                        handleFetchSheet(preset.url);
                      }}
                      className={`text-left p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all text-xs ${
                        isSelected 
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200' 
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="font-semibold truncate">{preset.name}</span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                        isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {preset.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleFetchSheet()}
                disabled={syncing}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap shadow-md transition-all shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Fetch Sheet</span>
              </button>
            </div>
            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px] text-slate-400">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Ensure your Google Sheet link is set to <strong>"Anyone with the link can view"</strong>. If your sheet is internal/private, switch to the <strong>"Paste Sheet Cells"</strong> tab to copy-paste rows in 1 click!</span>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Paste TSV/CSV */}
        {syncMode === 'paste' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">Copy & Paste Google Sheet Data</label>
              <span className="text-[10px] text-emerald-400 font-mono">Select cells in Google Sheets -&gt; Ctrl+C -&gt; Paste below</span>
            </div>
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste header row and data rows here directly from Google Sheets or Excel...
Example:
Station Advisor	Avg Reach	Avg Talktime	CE Count	Avg Exam Mark	Final Sales Data
Tariqul Islam	142	03:45:20	28	92.5	245000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleParsePastedText}
              disabled={syncing || !pastedText.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Parse & Process Copied Rows</span>
            </button>
          </div>
        )}

        {/* Tab 3: CSV File Upload */}
        {syncMode === 'upload' && (
          <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-6 text-center bg-slate-950/50 transition-colors space-y-2">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-200">Upload CSV File directly</p>
            <p className="text-[11px] text-slate-500">Supports exported .csv sheets matching Kaizen Team column names</p>
            <label className="mt-2 inline-block bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer transition-all">
              Browse CSV File
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* Import Mode Selection */}
        <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Dashboard Sync Strategy:</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="radio"
                name="importOption"
                checked={importOption === 'replace'}
                onChange={() => setImportOption('replace')}
                className="text-cyan-500 focus:ring-0"
              />
              <span>Replace Existing Records</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="radio"
                name="importOption"
                checked={importOption === 'append'}
                onChange={() => setImportOption('append')}
                className="text-cyan-500 focus:ring-0"
              />
              <span>Append to Current Table</span>
            </label>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Parsed Preview Table */}
        {(previewStationed || previewVirtual) && (
          <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-950">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Eye className="w-3.5 h-3.5" />
                <span>Parsed Data Preview ({previewStationed ? 'Stationed Team' : 'Virtual Team'})</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {previewStationed ? `${previewStationed.length} rows` : `${previewVirtual?.length} rows`}
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1">
              {previewStationed && previewStationed.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800 text-slate-300">
                  <span className="font-semibold text-white">{s.advisorName}</span>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Reach: <strong className="text-slate-200">{s.avgReach}</strong></span>
                    <span>Talktime: <strong className="text-slate-200">{s.avgTalktime}</strong></span>
                    <span>Sales: <strong className="text-emerald-400">৳{s.finalSalesData.toLocaleString()}</strong></span>
                    <span>KPI: <strong className="text-cyan-300">{formatKpiDisplay(s.totalKpiScore)} ({s.kpiGrade})</strong></span>
                  </div>
                </div>
              ))}

              {previewVirtual && previewVirtual.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800 text-slate-300">
                  <span className="font-semibold text-white">{v.advisorName}</span>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Reach: <strong className="text-slate-200">{v.reachCall}</strong></span>
                    <span>Sales: <strong className="text-emerald-400">৳{v.finalSales.toLocaleString()}</strong></span>
                    <span>Salary: <strong className="text-amber-400">৳{v.totalSalary.toLocaleString()}</strong></span>
                    <span>KPI: <strong className="text-cyan-300">{formatKpiDisplay(v.overallKpi)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-xl text-xs"
          >
            Cancel
          </button>

          {(previewStationed || previewVirtual) && (
            <button
              onClick={handleApplyImport}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Data to Kaizen Dashboard</span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
};

