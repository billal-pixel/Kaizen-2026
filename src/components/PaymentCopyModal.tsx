import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  X, 
  CreditCard, 
  Smartphone, 
  Send, 
  Building2, 
  Search, 
  Sparkles,
  PhoneCall,
  User,
  Filter
} from 'lucide-react';

interface PaymentCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPitchModal?: () => void;
}

export interface PaymentTemplate {
  id: string;
  advisorName: string;
  banglaName: string;
  phone: string;
  provider: string;
  type: 'mobile' | 'bank';
  fullMessage: string;
  accentColor: string;
  isBank?: boolean;
  bankMeta?: {
    accountName: string;
    accountNo: string;
    routingNo: string;
    bankName: string;
    branch: string;
  };
}

export const PAYMENT_TEMPLATES: PaymentTemplate[] = [
  {
    id: 'rabita_payment',
    advisorName: 'Rabita',
    banglaName: 'রাবিতা',
    phone: '01320676761',
    provider: 'bKash / Nagad',
    type: 'mobile',
    fullMessage: 'আসসালামু আলাইকুম, আমি রাবিতা ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01320676761 ধন্যবাদ।',
    accentColor: 'rose'
  },
  {
    id: 'tahshin_payment',
    advisorName: 'Tahshin',
    banglaName: 'তাহ্শিন',
    phone: '01778336887',
    provider: 'bKash / Nagad',
    type: 'mobile',
    fullMessage: 'আসসালামু আলাইকুম, আমি তাহ্শিন  ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01778336887 ধন্যবাদ।',
    accentColor: 'sky'
  },
  {
    id: 'setu_payment',
    advisorName: 'Setu',
    banglaName: 'সেতু',
    phone: '01304167422',
    provider: 'bKash / Nagad',
    type: 'mobile',
    fullMessage: 'আসসালামু আলাইকুম, আমি সেতু  ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01304167422  ধন্যবাদ।',
    accentColor: 'emerald'
  },
  {
    id: 'anisa_payment',
    advisorName: 'Anisa',
    banglaName: 'আনিসা',
    phone: '01601388897',
    provider: 'bKash / Nagad',
    type: 'mobile',
    fullMessage: 'আসসালামু আলাইকুম, আমি আনিসা ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ অথবা নগদ করুন এই নাম্বারে 01601388897 ধন্যবাদ।',
    accentColor: 'purple'
  },
  {
    id: 'mayida_payment',
    advisorName: 'Mayida',
    banglaName: 'মায়িদা',
    phone: '01756089829',
    provider: 'bKash / Nagad',
    type: 'mobile',
    fullMessage: 'আসসালামু আলাইকুম, আমি মায়িদা ১০ মিনিট স্কুল থেকে,আপনার কাঙ্ক্ষিত কোর্সে ভর্তি হতে বিকাশ বা নগদ করুন এই নাম্বারে 01756089829 ধন্যবাদ।',
    accentColor: 'amber'
  },
  {
    id: 'city_bank_shaikat',
    advisorName: 'City Bank (Shaikat)',
    banglaName: 'সিটি ব্যাংক (শৈকত)',
    phone: '2303373444001',
    provider: 'City Bank Transfer',
    type: 'bank',
    fullMessage: 'কাঙ্ক্ষিত কোর্সে ভর্তি হতে ব্যাংকের মাধ্যমে টাকা পাঠাতে পারেন এই একাউন্টে। A/C Name: Md. Estiak Hossain Shaikat A/C No : 2303373444001 Routing Number 225264300 City Bank, Shyamoli Branch Thank You.',
    accentColor: 'indigo',
    isBank: true,
    bankMeta: {
      accountName: 'Md. Estiak Hossain Shaikat',
      accountNo: '2303373444001',
      routingNo: '225264300',
      bankName: 'City Bank',
      branch: 'Shyamoli Branch'
    }
  }
];

export const PaymentCopyModal: React.FC<PaymentCopyModalProps> = ({ isOpen, onClose, onOpenPitchModal }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mobile' | 'bank'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'message' | 'number' | null>(null);

  const filteredTemplates = useMemo(() => {
    return PAYMENT_TEMPLATES.filter((tmpl) => {
      const matchType = typeFilter === 'all' || tmpl.type === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchType;
      const matchSearch =
        tmpl.advisorName.toLowerCase().includes(q) ||
        tmpl.banglaName.toLowerCase().includes(q) ||
        tmpl.phone.includes(q) ||
        tmpl.provider.toLowerCase().includes(q) ||
        (tmpl.bankMeta && (
          tmpl.bankMeta.accountName.toLowerCase().includes(q) ||
          tmpl.bankMeta.bankName.toLowerCase().includes(q) ||
          tmpl.bankMeta.branch.toLowerCase().includes(q) ||
          tmpl.bankMeta.routingNo.includes(q)
        ));
      return matchType && matchSearch;
    });
  }, [searchQuery, typeFilter]);

  if (!isOpen) return null;

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
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0E1726] border border-slate-200/90 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative space-y-6 my-6 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-2xs">
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Quick Messages & Payment Hub
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                    6 Verified Accounts
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  1-Click copy formatted Bengali payment messages and bank details for students
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {onOpenPitchModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPitchModal();
                  }}
                  className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Switch to Defined Call Pitch Playbook"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                  <span>Call Pitch Playbook</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Distinct Search & Quick Filter Strip */}
          <div className="bg-slate-50/80 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search advisor by name (Rabita, Tahshin...), number, or bank..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/80 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                All (6)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('mobile')}
                className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  typeFilter === 'mobile'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Smartphone className="w-3 h-3 text-rose-500" />
                <span>bKash / Nagad (5)</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('bank')}
                className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  typeFilter === 'bank'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Building2 className="w-3 h-3 text-indigo-500" />
                <span>City Bank (1)</span>
              </button>
            </div>
          </div>

          {/* Contact / Template Cards Grid with Clear Visual Division */}
          <div className="overflow-y-auto space-y-4 flex-1 pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No payment templates match "{searchQuery}"</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try clearing the search query or changing the filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((tmpl) => {
                  const isMessageCopied = copiedId === tmpl.id && copiedType === 'message';
                  const isNumberCopied = copiedId === tmpl.id && copiedType === 'number';

                  return (
                    <div 
                      key={tmpl.id}
                      className="bg-slate-50/70 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-sky-400/70 dark:hover:border-sky-500/70 transition-all"
                    >
                      {/* Contact Identity Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            tmpl.isBank
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {tmpl.isBank ? <Building2 className="w-4 h-4" /> : tmpl.advisorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {tmpl.advisorName}
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                              {tmpl.banglaName}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold border ${
                          tmpl.isBank
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {tmpl.provider}
                        </span>
                      </div>

                      {/* Number Display with Distinct Copy Target */}
                      <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider">
                            {tmpl.isBank ? 'City Bank Account Number' : 'bKash / Nagad Number'}
                          </p>
                          <p className="text-base font-mono font-black text-slate-900 dark:text-white tracking-wider truncate">
                            {tmpl.phone}
                          </p>
                        </div>

                        {/* Enlarged Number Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(tmpl.phone, tmpl.id, 'number')}
                          className={`h-9 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 shrink-0 ${
                            isNumberCopied
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                          }`}
                          title="Copy phone/account number only"
                        >
                          {isNumberCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              <span>Copied No!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy No.</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Bank Transfer Detailed Breakdown (if Bank) */}
                      {tmpl.bankMeta && (
                        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 rounded-xl p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Account Name</span>
                            <span className="font-bold text-slate-900 dark:text-white text-right">{tmpl.bankMeta.accountName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Routing Number</span>
                            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-xs">{tmpl.bankMeta.routingNo}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-indigo-200/60 dark:border-indigo-900/50 text-[11px]">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{tmpl.bankMeta.bankName}</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{tmpl.bankMeta.branch}</span>
                          </div>
                        </div>
                      )}

                      {/* Bengali Message Text Preview Container */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider">
                          Ready-to-Send Bengali Message
                        </label>
                        <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans select-all min-h-[64px]">
                          {tmpl.fullMessage}
                        </div>
                      </div>

                      {/* Large Clickable Target Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(tmpl.fullMessage, tmpl.id, 'message')}
                          className={`flex-1 h-11 sm:h-12 px-5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                            isMessageCopied
                              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                              : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-600 dark:hover:bg-sky-500 dark:text-white'
                          }`}
                          title="Click to copy full message template to clipboard"
                        >
                          {isMessageCopied ? (
                            <>
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Copied Full Message!</span>
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
                          className="h-11 sm:h-12 w-11 sm:w-12 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
                          title="Share directly via WhatsApp"
                        >
                          <Send className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick-Copy Strip at the Bottom */}
          <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
            <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Quick-Copy Numbers:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {PAYMENT_TEMPLATES.map((tmpl) => {
                const isQuickCopied = copiedId === tmpl.id && copiedType === 'number';
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleCopy(tmpl.phone, tmpl.id, 'number')}
                    className={`h-8 px-3 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95 ${
                      isQuickCopied
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isQuickCopied ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <span className="text-slate-400 font-sans font-normal">{tmpl.advisorName}:</span>
                    )}
                    <span>{tmpl.phone}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
