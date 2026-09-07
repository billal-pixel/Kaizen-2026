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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-6 shadow-xl relative space-y-5 my-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl">
                  <CreditCard className="w-5 h-5 text-[#3B7A75]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                    <span>10MS Payment Sharing Messages</span>
                    <span className="text-[10px] bg-teal-50 border border-teal-200 text-[#3B7A75] font-mono px-2 py-0.5 rounded-md uppercase font-bold">
                      bKash & Nagad
                    </span>
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Copy pre-formatted Bengali payment messages for Antu & Kayes to share directly with students.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Banner */}
            <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#0F172A] leading-relaxed">
              <Info className="w-4 h-4 text-[#3B7A75] shrink-0 mt-0.5" />
              <div>
                <strong>Advisor Direct Payment Instructions:</strong> Advisors can click <strong className="text-[#3B7A75]">"Copy Full Message"</strong> to paste directly into SMS, WhatsApp, or Messenger for student admissions.
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
                    className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden group hover:border-[#3B7A75]/50 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${tmpl.badgeColor} animate-pulse`} />
                        <h3 className="text-sm font-bold text-[#0F172A]">{tmpl.advisorName}</h3>
                      </div>
                      <span className="text-[10px] font-mono bg-white border border-[#E2E8F0] text-[#64748B] px-2 py-0.5 rounded-md font-bold">
                        {tmpl.provider}
                      </span>
                    </div>

                    {/* Number Box */}
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-rose-500 shrink-0" />
                        <div>
                          <p className="text-[10px] text-[#64748B] uppercase font-mono font-bold">Payment Number</p>
                          <p className="text-sm font-mono font-black text-[#0F172A] tracking-wider">{tmpl.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(tmpl.phone, tmpl.id, 'number')}
                        className="px-2.5 py-1.5 bg-[#F6F7F9] hover:bg-slate-200 text-[#0F172A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-[#E2E8F0]"
                        title="Copy Number Only"
                      >
                        {isNumberCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy No.</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Message Preview */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">
                        Bengali Message Text
                      </label>
                      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0F172A] leading-relaxed font-sans select-all">
                        {tmpl.fullMessage}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopy(tmpl.fullMessage, tmpl.id, 'message')}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                          isMessageCopied
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-[#3B7A75] hover:bg-[#326965] text-white shadow-[#3B7A75]/20'
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
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
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
            <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
              <span className="text-[#0F172A] font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3B7A75] shrink-0" />
                Quick Copy Phone Numbers:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('01850890778', 'quick_antu', 'number')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-mono font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Antu: 01850890778
                </button>
                <button
                  onClick={() => handleCopy('01644336738', 'quick_kayes', 'number')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-mono font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Kayes: 01644336738
                </button>
              </div>
            </div>

            {/* Official Google Sites Portals Banner */}
            <div className="bg-[#F6F7F9] border border-[#E2E8F0] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#3B7A75] shrink-0" />
                <span>Official Team Google Sites:</span>
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href="https://sites.google.com/view/10msmirpur/home"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Essential Link (Station)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <a
                  href="https://sites.google.com/view/10ms-vt-essential/home"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Virtual Link (Virtual)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#F6F7F9] hover:bg-slate-200 text-[#0F172A] font-bold rounded-xl text-xs transition-colors cursor-pointer border border-[#E2E8F0]"
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
