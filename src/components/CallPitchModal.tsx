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
  Award
} from 'lucide-react';

interface CallPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
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
    cta: 'নিকটস্থ অফলাইন সেন্টারে ফ্রি স্পিকিং টেস্ট ও ডেমো ক্লাসের স্লট কনফার্মেশন।'
  }
];

export const CallPitchModal: React.FC<CallPitchModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['All', 'HSC 28', 'Online Batch 2026', 'SSC 2026 SMP', 'Varsity Admission', 'IELTS & SEJ'];

  const filteredPitches = PITCH_SECTIONS.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.scriptOpening.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleCopyText = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onShowToast) {
      onShowToast(`📋 Copied ${label} script to clipboard!`);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const originalDocUrl = '/assets/aistudio/Defined_Call_Pitch_Journey___Telesales__a819a591';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#1C2541] border border-sky-200/80 dark:border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#141C33]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
                <PhoneCall className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Defined Call Pitch Journey
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                    Telesales Playbook
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  Comprehensive scripts, objection handling, value propositions & campaigns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={originalDocUrl}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                title="Open raw telesales document in a new tab"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Full Doc</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#1C2541] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scripts, objections, campaigns, courses..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-[#141C33] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-7 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#141C33] dark:hover:bg-[#253256] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pitches List Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPitches.map((pitch) => (
              <div key={pitch.id} className="pt-6 first:pt-0 space-y-4">
                {/* Title & Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                        {pitch.category}
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {pitch.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {pitch.subtitle} • Target: <span className="text-slate-700 dark:text-slate-300 font-bold">{pitch.targetAudience}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyText(pitch.scriptOpening, pitch.id, pitch.title)}
                    className="self-start sm:self-auto h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#141C33] hover:bg-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Copy opening script"
                  >
                    {copiedId === pitch.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Opening Call Script Box */}
                <div className="bg-sky-50/70 dark:bg-[#141C33]/90 border border-sky-200/80 dark:border-slate-700/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-sky-800 dark:text-sky-300">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Live Call Opening & Rapport Building</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-white/80 dark:bg-[#0B132B]/80 p-3 rounded-lg border border-sky-100 dark:border-slate-800">
                    {pitch.scriptOpening}
                  </p>
                </div>

                {/* Key USPs & Selling Points */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Product USPs & Core Strengths</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pitch.highlights.map((h, i) => (
                      <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-[#141C33] p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Objection Handling (if available) */}
                {pitch.objectionHandling && pitch.objectionHandling.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Objection Handling Quick Guide</span>
                    </div>
                    <div className="space-y-2">
                      {pitch.objectionHandling.map((obj, i) => (
                        <div key={i} className="text-xs bg-slate-50/70 dark:bg-[#141C33]/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                          <p className="font-bold text-rose-700 dark:text-rose-400">
                            Q: {obj.issue}
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            A: {obj.response}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Call-to-action */}
                <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span><strong>Closing Call to Action:</strong> {pitch.cta}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredPitches.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">No pitch matching "{searchQuery}"</p>
                <p className="text-xs text-slate-500 mt-1">Try searching for HSC, OB, IELTS, or admission</p>
              </div>
            )}
          </div>

          {/* Footer note & link to original file */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#141C33] border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Original document:</span>
              <code className="font-mono text-[11px] bg-slate-200 dark:bg-[#0B132B] px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                Defined_Call_Pitch_Journey___Telesales
              </code>
            </span>
            <a
              href={originalDocUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>View full 6,900+ lines transcript</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
