import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  PhoneCall, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  FileText, 
  BookOpen, 
  Sparkles,
  HelpCircle,
  MessageSquare,
  Award,
  CreditCard,
  Target
} from 'lucide-react';

interface CallPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  onOpenPaymentModal?: () => void;
}

interface PitchSection {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  targetAudience: string;
  highlights: string[];
  scriptOpening: string;
  objectionHandling?: { issue: string; response: string }[];
  cta: string;
}

const PITCH_SECTIONS: PitchSection[] = [
  {
    id: 'hsc-28',
    category: 'HSC 28',
    title: 'HSC 2028 Online Batch [Pitch Direction]',
    subtitle: 'Transition from SSC to Full-Syllabus HSC Preparation',
    targetAudience: 'SSC Graduates & Guardians (KS Event Attendees & Web Leads)',
    highlights: [
      'HSC ও Admission Preparation একসাথে',
      'Admission Question Bank Included & Top College Analysis',
      'Masterbook USP: Theory, Revision, MCQ Explanation & Shortcut Hacks',
      'TenTen 24/7 AI Doubt Solver Support',
      'Early Bird Offer: সর্বোচ্চ ডিসকাউন্ট (June 30), Basic Building Classes & T-Shirt'
    ],
    scriptOpening: 'হ্যালো [শিক্ষার্থীর নাম], আমি [Advisor Name] টেন মিনিট স্কুল থেকে বলছি। তুমি কি কথা বলছ? তুমি কি ৯ অক্টোবরের Mega কৃতী শিক্ষার্থী সংবর্ধনার Slot 2-তে এসেছিলে? অনুষ্ঠানটা কেমন লেগেছিল তোমার? এখন কলেজে ভর্তি বা কলেজের পড়াশোনা নিয়ে কী ভাবছ?',
    objectionHandling: [
      {
        issue: 'অনেক শিক্ষার্থী ফলাফল প্রকাশের অপেক্ষায় রয়েছে / প্র্যাকটিক্যাল শেষ হয়েছে',
        response: 'পরে নিতে চাইলেও প্রবলেম নাই, কিন্তু এখনি ভর্তি করলে সর্বোচ্চ আর্লি বার্ড অফার আর বেসিক বিল্ডিং ক্লাসের সুবিধা পাওয়া যাবে।'
      },
      {
        issue: 'গ্রুপ পরিবর্তন করার পরিকল্পনা আছে (সায়েন্স/কমার্স/আর্টস)',
        response: 'আমরা ৩টি গ্রুপের শিক্ষার্থীদের জন্যই কোর্স অফার করছি। পরবর্তীতে গ্রুপ পরিবর্তন করলেও অনায়াসে গ্রুপ অনুযায়ী কোর্সে মাইগ্রেট করার সুবিধা রয়েছে।'
      },
      {
        issue: 'অনলাইন বনাম অফলাইন কোচিং নিয়ে দ্বিধা',
        response: 'অনলাইনে সবচেয়ে বড় সুবিধা হলো রেকর্ডেড ক্লাস বারবার 2X স্পিডে দেখার সুযোগ। কলেজের ব্যস্ত সময়ে অফলাইনে যাতায়াতের প্রতিদিন ২-৩ ঘণ্টা সময় বেঁচে যায়।'
      }
    ],
    cta: 'Early Bird এনরোলমেন্ট: Cycle 0 Pre-book / Full Course + ASE Bundle + টি-শার্ট ও এক্সক্লুসিভ গিফট।'
  },
  {
    id: 'ob-26',
    category: 'Online Batch 2026',
    title: 'Class 6-10 Online Batch 2026',
    subtitle: 'Full Academic Curriculum with MAP Methodology',
    targetAudience: 'Students (Class 6-10) and Parents',
    highlights: [
      'ক্লাস রুটিন: ৬-৮ প্রতিদিন ২টি ক্লাস (১ ঘণ্টা), ৯-১০ প্রতিদিন ২টি ক্লাস (১.৫ ঘণ্টা)',
      'MAP পদ্ধতি: M-Master (CQ/MCQ/SQ), A-Apply (Daily HW & Quiz), P-Prove (Full Model Test)',
      'AI Super Solve (24/7 Math & Science Solution)',
      'Printed Masterbook সরাসরি বাসায় ফ্রি হোম ডেলিভারি',
      'Monthly Parent-Teacher Meeting (PTM) & App Learning Report'
    ],
    scriptOpening: 'হ্যালো! আমি [Advisor Name] টেন মিনিট স্কুল থেকে বলছি। আপনি আমাদের অনলাইন ব্যাচের জন্য রেজিস্ট্রেশন করেছিলেন। কার সাথে কথা বলছি একটু জানাবেন? স্টুডেন্ট নাকি গার্ডিয়ান?',
    objectionHandling: [
      {
        issue: 'ক্লাস বড় হলে self-study করার সময় পায় না',
        response: 'এবার শিডিউল অপটিমাইজড—ক্লাস ছোট (১ থেকে ১.৫ ঘণ্টা), রাত ৯টার আগেই সব ক্লাস শেষ এবং সপ্তাহে ২ দিন বন্ধ যাতে ডেডিকেটেড self-study করতে পারে।'
      },
      {
        issue: 'বাসায় প্রাইভেট টিউটর আছে',
        response: 'আমাদের কোর্সে কঠিন বিষয়ে extra support, Full Revision Week, Recorded Library এবং সার্বক্ষণিক AI Doubt Solve পাওয়ায় আলাদা টিউটরের আর প্রয়োজনই পড়ে না।'
      }
    ],
    cta: 'মাত্র ১,০০০ টাকায় প্রি-বুক করে স্পেশাল ডিসকাউন্ট ও গিফট লক করুন। ৩ মাসের কিস্তিতে EMI সুবিধা প্রযোজ্য।'
  },
  {
    id: 'ssc-26-smp',
    category: 'SSC 2026 SMP',
    title: 'SSC 2026 শেষ মুহূর্তের প্রস্তুতি কোর্স (SMP)',
    subtitle: 'Final Board Exam Preparation with 100% Common Suggestions',
    targetAudience: 'SSC 2026 Candidates (Science, Commerce, Humanities)',
    highlights: [
      '৭০+ ডিটেইলড লাইভ ক্লাস (প্রতিটি বিষয়ে ২ ঘণ্টার হাই-ভোল্টেজ সেশন)',
      'অধ্যায়ভিত্তিক হাই ভোল্টেজ CQ-MCQ সাজেশন + Annotated Slides',
      'Full 100 Marks CQ+MCQ Final Model Test এবং শিক্ষক দ্বারা খাতা মূল্যায়ন',
      '২৫ ব্যাচের ৫,১৭৯ জন GPA-5 অর্জনের পর এবার ১০ হাজার শিক্ষার্থীর A+ ব্লু-প্রিন্ট'
    ],
    scriptOpening: 'হ্যালো [Student Name], আমি টেন মিনিট স্কুল থেকে কল করেছি সামনে তোমার SSC পরীক্ষার জন্য কিছু গুরুত্বপূর্ণ guideline এবং ফাইনাল সাজেশন দেওয়ার জন্য। কেমন চলছে তোমার প্রস্তুতি?',
    objectionHandling: [
      {
        issue: 'সিলেবাস কি সময়মতো শেষ হবে?',
        response: 'হ্যাঁ, সম্পূর্ণ রুটিন তৈরি করা হয়েছে যাতে বোর্ড পরীক্ষার আগেই প্রতিটি অধ্যায় ২ বার রিভিশন ও মডেল টেস্ট সম্পন্ন হয়।'
      }
    ],
    cta: 'সম্পূর্ণ বান্ডেল কোর্সে ডিসকাউন্টসহ এনরোলমেন্ট অথবা ফ্রি স্পেশাল ফেসবুক গ্রুপে সাজেশন সংগ্রহ।'
  },
  {
    id: 'varsity-2025',
    category: 'Varsity Admission',
    title: 'ভার্সিটি এডমিশন কোর্স ২০২৫ (A, B, C Unit)',
    subtitle: 'DU, JU, RU, CU & 22+ Public Universities Complete Preparation',
    targetAudience: 'HSC Passed Students & Prospective University Candidates',
    highlights: [
      'A Unit (Science): ১৬৬টি লাইভ ক্লাস, DU Written Special সেশন, ৩২টি স্পেশাল ক্লাস',
      'B Unit (Humanities): ৮০টি লাইভ ক্লাস, Goldmine GK Book PDF ফ্রি, সার্বক্ষণিক মেন্টরশিপ',
      'C Unit (Business): ৮৮টি লাইভ ক্লাস, FBS DU মেন্টর প্যানেল, DU & GST কোশ্চেন ব্যাংক',
      'Admission 2024 এ ৪০২+ জন শীর্ষ ১০০ তে চান্স পেয়েছে (DMC-তে ২৫ জন, DU B Unit-এ ১২তম সহ)'
    ],
    scriptOpening: 'আসসালামু আলাইকুম, আমি টেন মিনিট স্কুল থেকে বলছি। আপনার HSC পরীক্ষার পর এডমিশনের প্রস্তুতি কেমন চলছে? কোন বিশ্ববিদ্যালয় ও ইউনিট আপনার মূল টার্গেট?',
    objectionHandling: [
      {
        issue: 'ফার্মগেট বা অফলাইনে কোচিং করার চিন্তা করছি',
        response: 'অফলাইনে প্রতিদিন ট্রাফিক জ্যামে ৩-৪ ঘণ্টা নষ্ট হয়। আমাদের ক্লাসে টপ ঢাকা বিশ্ববিদ্যালয়ের মেন্টররা সরাসরি লাইভ ক্লাস নেন এবং প্রতিটি ক্লাস লাইব্রেরিতে সেভ থাকে।'
      }
    ],
    cta: 'ভার্সিটি এডমিশন কোর্সে স্পেশাল অ্যাডভাইজর ডিসকাউন্ট সহ সরাসরি ভর্তি।'
  },
  {
    id: 'ielts-offline',
    category: 'IELTS & SEJ',
    title: 'IELTS Offline & Spoken English Junior (SEJ)',
    subtitle: '10MS English Centre Branches (Uttara, Panthapath, Mirpur, Mogbazar, CTG)',
    targetAudience: 'Study Abroad Seekers, Job Aspirants & School-Going English Learners',
    highlights: [
      'IELTS: ব্রিটিশ কাউন্সিল সার্টিফাইড ৮-৮.৫ ব্যান্ড স্কোরার ট্রেইনার, আনলিমিটেড মক টেস্ট ও CBT ল্যাব',
      'SEJ: প্লে-বেসড অ্যাক্টিভিটি লার্নিং (Lecture < Task < Experience)',
      'প্যারেন্টসদের জন্য লাইভ ক্লাসরুম মনিটরিং স্ক্রিন সুবিধা ও পার্সোনাল ফিডব্যাক',
      'কমপ্লিমেন্টারি ফ্রি স্পিকিং টেস্ট, লেভেল অ্যাসেসমেন্ট ও গিফট হ্যাম্পার'
    ],
    scriptOpening: 'আসসালামু আলাইকুম! টেন মিনিট স্কুল থেকে আমি [Advisor Name] বলছি। বিদেশে উচ্চশিক্ষা বা IELTS প্রস্তুতি নিয়ে একটু কথা বলতে চাচ্ছিলাম, আপনার কি একটু সময় হবে?',
    objectionHandling: [
      {
        issue: 'ব্রাঞ্চ দূরে হলে কীভাবে ক্লাস করবে?',
        response: 'আমাদের উত্তরা, পান্থপথ, মিরপুর, মগবাজার ও চট্টগ্রামে আধুনিক সেন্টার রয়েছে। আপনি সুবিধাজনক সেন্টারে ফ্রি এসেসমেন্ট দিতে পারেন।'
      }
    ],
    cta: 'নিকটস্থ অফলাইন সেন্টারে ফ্রি স্পিকিং টেস্ট ও ডেমো ক্লাসের স্লট কনফার্মেশন।'
  }
];

export const CallPitchModal: React.FC<CallPitchModalProps> = ({ 
  isOpen, 
  onClose, 
  onShowToast,
  onOpenPaymentModal 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['All', 'HSC 28', 'Online Batch 2026', 'SSC 2026 SMP', 'Varsity Admission', 'IELTS & SEJ'];

  const filteredPitches = PITCH_SECTIONS.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCat;
    const matchSearch = 
      p.title.toLowerCase().includes(q) ||
      p.subtitle.toLowerCase().includes(q) ||
      p.scriptOpening.toLowerCase().includes(q) ||
      p.highlights.some(h => h.toLowerCase().includes(q)) ||
      (p.objectionHandling && p.objectionHandling.some(o => o.issue.toLowerCase().includes(q) || o.response.toLowerCase().includes(q)));
    return matchCat && matchSearch;
  });

  const handleCopyText = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onShowToast) {
      onShowToast(`📋 Copied ${label} to clipboard!`);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const originalDocUrl = '/assets/aistudio/Defined_Call_Pitch_Journey___Telesales__a819a591';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0E1726] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
                <PhoneCall className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Defined Call Pitch Journey
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                    Telesales Playbook
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  Comprehensive opening scripts, objection responses, value propositions & campaigns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenPaymentModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPaymentModal();
                  }}
                  className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Switch to Quick Payment Messages"
                >
                  <CreditCard className="w-3.5 h-3.5 text-sky-500" />
                  <span className="hidden sm:inline">Payment Messages</span>
                </button>
              )}

              <a
                href={originalDocUrl}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                title="Open raw telesales document transcript in a new tab"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Doc</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Distinct Search & Category Filter Toolbar */}
          <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scripts, objections, campaigns, courses (e.g. HSC 28, EMI, offline)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/80 shadow-2xs"
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

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-8 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pitches List Content with Clear Visual Division */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {filteredPitches.map((pitch) => (
              <div 
                key={pitch.id} 
                className="bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Title & Target Audience Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/60">
                        {pitch.category}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {pitch.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{pitch.subtitle}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Target className="w-3.5 h-3.5 text-sky-500" />
                        Target: {pitch.targetAudience}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                    {pitch.highlights.length} USPs
                  </span>
                </div>

                {/* Opening Call Script Box with Large Target Copy Button */}
                <div className="bg-sky-50/70 dark:bg-slate-800/80 border border-sky-200/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-900 dark:text-sky-300">
                      <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Live Call Opening Script & Rapport Building</span>
                    </div>

                    {/* Enlarged Clickable Target for Copying Opening Script */}
                    <button
                      type="button"
                      onClick={() => handleCopyText(pitch.scriptOpening, `${pitch.id}-opening`, `${pitch.title} script`)}
                      className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 border ${
                        copiedId === `${pitch.id}-opening`
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white hover:bg-slate-50 text-slate-800 hover:text-sky-700 border-sky-200/80 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white dark:border-slate-600'
                      }`}
                      title="Copy opening call script"
                    >
                      {copiedId === `${pitch.id}-opening` ? (
                        <>
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                          <span>Copied Script!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-400" />
                          <span>Copy Opening Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-sky-100 dark:border-slate-800 font-sans select-all">
                    {pitch.scriptOpening}
                  </p>
                </div>

                {/* Key USPs & Selling Points */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Product USPs & Core Strengths</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {pitch.highlights.map((h, i) => (
                      <div key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                        <span className="leading-snug">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Objection Handling Cards with Dedicated Copy Buttons */}
                {pitch.objectionHandling && pitch.objectionHandling.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      <span>Objection Handling Quick Reference</span>
                    </div>
                    <div className="space-y-2.5">
                      {pitch.objectionHandling.map((obj, i) => {
                        const objCopyId = `${pitch.id}-obj-${i}`;
                        const isObjCopied = copiedId === objCopyId;

                        return (
                          <div key={i} className="bg-white dark:bg-slate-800/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 shadow-2xs">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                Objection: {obj.issue}
                              </p>

                              <button
                                type="button"
                                onClick={() => handleCopyText(obj.response, objCopyId, 'objection response')}
                                className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 shrink-0 ${
                                  isObjCopied
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                                }`}
                                title="Copy response to clipboard"
                              >
                                {isObjCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy Response</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                              {obj.response}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Closing Call to Action (CTA) */}
                <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-amber-950 dark:text-amber-200 font-medium">
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span><strong>Closing Call to Action:</strong> {pitch.cta}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyText(pitch.cta, `${pitch.id}-cta`, 'Closing CTA')}
                    className="h-8 px-3 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 text-amber-900 dark:text-amber-100 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === `${pitch.id}-cta` ? 'Copied CTA!' : 'Copy CTA'}</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredPitches.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No pitch script matching "{searchQuery}"</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try searching for HSC, OB, IELTS, or admission</p>
              </div>
            )}
          </div>

          {/* Footer with link to transcript */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <span>Source document:</span>
              <code className="font-mono text-[11px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Defined_Call_Pitch_Journey___Telesales
              </code>
            </span>
            <a
              href={originalDocUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>View full 6,900+ lines playbook</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
