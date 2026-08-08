import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  X, 
  CreditCard, 
  Phone, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Smartphone,
  ExternalLink,
  Info,
  Globe
} from 'lucide-react';

interface PaymentCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface PaymentTemplate {
  id: string;
  advisorName: string;
  phone: string;
  provider: string;
  fullMessage: string;
  badgeColor: string;
}

export const PAYMENT_TEMPLATES: PaymentTemplate[] = [
  {
    id: 'antu_payment',
    advisorName: 'Antu (অন্তু)',
    phone: '01850890778',
    provider: 'bKash / Nagad',
    fullMessage: 'আসসালামু আলাইকুম, আমি অন্তু  ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01850890778 ধন্যবাদ।',
    badgeColor: 'from-pink-500 to-rose-600'
  },
  {
    id: 'kayes_payment',
    advisorName: 'Kayes (কায়েস)',
    phone: '01644336738',
    provider: 'bKash / Nagad',
    fullMessage: 'আসসালামু আলাইকুম, আমি কায়েস ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা  নগদ  করুন  এই নাম্বারে 01644336738 ধন্যবাদ.',
    badgeColor: 'from-amber-500 to-orange-600'
  }
];

export const PaymentCopyModal: React.FC<PaymentCopyModalProps> = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'message' | 'number' | null>(null);
  const [customStudentName, setCustomStudentName] = useState('');

  const handleCopy = (text: string, id: string, type: 'message' | 'number') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const getWhatsAppLink = (text: string) => {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 my-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-pink-500/20 via-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 rounded-xl">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>10MS Payment Sharing Messages</span>
                    <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono px-2 py-0.5 rounded-md uppercase font-bold">
                      bKash & Nagad
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Copy pre-formatted Bengali payment messages for Antu & Kayes to share directly with students.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Banner */}
            <div className="bg-cyan-950/40 border border-cyan-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-cyan-200/90 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong>Advisor Direct Payment Instructions:</strong> Advisors can click <strong className="text-cyan-300">"Copy Full Message"</strong> to paste directly into SMS, WhatsApp, or Messenger for student admissions.
              </div>
            </div>

            {/* Payment Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAYMENT_TEMPLATES.map((tmpl) => {
                const isMessageCopied = copiedId === tmpl.id && copiedType === 'message';
                const isNumberCopied = copiedId === tmpl.id && copiedType === 'number';

                return (
                  <div 
                    key={tmpl.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-inner relative overflow-hidden group hover:border-cyan-500/40 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${tmpl.badgeColor} animate-pulse`} />
                        <h3 className="text-sm font-bold text-slate-100">{tmpl.advisorName}</h3>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                        {tmpl.provider}
                      </span>
                    </div>

                    {/* Number Box */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-pink-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Payment Number</p>
                          <p className="text-sm font-mono font-black text-cyan-300 tracking-wider">{tmpl.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(tmpl.phone, tmpl.id, 'number')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                        title="Copy Number Only"
                      >
                        {isNumberCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy No.</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Message Preview */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Bengali Message Text
                      </label>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed font-sans select-all">
                        {tmpl.fullMessage}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopy(tmpl.fullMessage, tmpl.id, 'message')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                          isMessageCopied
                            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                        }`}
                      >
                        {isMessageCopied ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Copied Full Text!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Full Message</span>
                          </>
                        )}
                      </button>

                      <a
                        href={getWhatsAppLink(tmpl.fullMessage)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                        title="Share directly via WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct Quick Copy Strip */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                Quick Copy Phone Numbers:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('01850890778', 'quick_antu', 'number')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Antu: 01850890778
                </button>
                <button
                  onClick={() => handleCopy('01644336738', 'quick_kayes', 'number')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Kayes: 01644336738
                </button>
              </div>
            </div>

            {/* Official Google Sites Portals Banner */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Official Team Google Sites:</span>
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href="https://sites.google.com/view/10msmirpur/home"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Essential Link (Station)</span>
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                </a>
                <a
                  href="https://sites.google.com/view/10ms-vt-essential/home"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Virtual Link (Virtual)</span>
                  <ExternalLink className="w-3 h-3 text-sky-400" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
