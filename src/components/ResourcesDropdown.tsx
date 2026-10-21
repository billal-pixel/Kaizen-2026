import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Link2, 
  ExternalLink, 
  Folder, 
  BookOpen, 
  CreditCard, 
  ChevronDown,
  Layers,
  FileSpreadsheet,
  PhoneCall,
  FileText
} from 'lucide-react';

interface ResourcesDropdownProps {
  onOpenPaymentModal?: () => void;
  onOpenSheetSync?: () => void;
  onOpenPitchModal?: () => void;
  theme?: 'dark' | 'light';
  buttonLabel?: string;
}

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  badge?: string;
  isAction?: boolean;
  actionHandler?: () => void;
}

interface ResourceCategory {
  title: string;
  items: ResourceItem[];
}

export const ResourcesDropdown: React.FC<ResourcesDropdownProps> = ({
  onOpenPaymentModal,
  onOpenSheetSync,
  onOpenPitchModal,
  buttonLabel = 'Workspace Portals',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const categories: ResourceCategory[] = [
    {
      title: 'Telesales Guides & Scripts',
      items: [
        {
          id: 'call-pitch-doc',
          title: 'Defined Call Pitch Journey',
          description: 'HSC 28, OB 26, Objection Handling & Telesales Scripts',
          url: '/assets/aistudio/Defined_Call_Pitch_Journey___Telesales__a819a591',
          icon: PhoneCall,
          iconColor: 'text-rose-600 dark:text-rose-400',
          iconBg: 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800/80',
          badge: 'Pitch Doc',
          ...(onOpenPitchModal ? {
            isAction: true,
            actionHandler: () => {
              setIsOpen(false);
              onOpenPitchModal();
            }
          } : {})
        },
        {
          id: 'free-resource-doc',
          title: 'Free Resource Doc',
          description: 'Academic syllabus, guidelines & student materials',
          url: 'https://docs.google.com/document/d/1GiVK9N2diFGsYuW9RfFeDVxtl3AnZe9wP3LGo2g0g1o/edit?tab=t.0',
          icon: BookOpen,
          iconColor: 'text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/80',
          badge: 'Guide'
        }
      ]
    },
    {
      title: 'Joining Groups & Docs',
      items: [
        {
          id: 'station-group',
          title: 'Station Group Doc',
          description: 'Official joining document for stationed advisors',
          url: 'https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0',
          icon: Link2,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/80',
          badge: 'Station'
        },
        {
          id: 'virtual-group',
          title: 'Virtual Group Doc',
          description: 'Official joining document for virtual advisors',
          url: 'https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0',
          icon: Link2,
          iconColor: 'text-sky-600 dark:text-sky-400',
          iconBg: 'bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800/80',
          badge: 'Virtual'
        }
      ]
    },
    {
      title: 'Portals & Essential Sites',
      items: [
        {
          id: 'station-site',
          title: 'Mirpur Station Site',
          description: '10MS Mirpur station guidelines & links',
          url: 'https://sites.google.com/view/10msmirpur/home',
          icon: Globe,
          iconColor: 'text-violet-600 dark:text-violet-400',
          iconBg: 'bg-violet-50 dark:bg-violet-950/70 border-violet-200 dark:border-violet-800/80',
          badge: 'Portal'
        },
        {
          id: 'vt-site',
          title: 'VT Essential Site',
          description: 'Virtual team resource portal & directory',
          url: 'https://sites.google.com/view/10ms-vt-essential/home',
          icon: Globe,
          iconColor: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800/80',
          badge: 'Portal'
        }
      ]
    },
    {
      title: 'Cloud Drives & Call Archives',
      items: [
        {
          id: 'good-call-drive',
          title: 'Good Call Archive',
          description: 'Exemplary sales call recordings and benchmarks',
          url: 'https://drive.google.com/drive/folders/1BGEaDod5zXZ6nvoNfYsGvry02c2oElZk?ths=true',
          icon: Folder,
          iconColor: 'text-teal-600 dark:text-teal-400',
          iconBg: 'bg-teal-50 dark:bg-teal-950/70 border-teal-200 dark:border-teal-800/80',
          badge: 'Drive'
        },
        {
          id: 'follow-up-drive',
          title: 'Follow Up Drive',
          description: 'Customer follow-up templates & tracking sheets',
          url: 'https://drive.google.com/drive/folders/1Tk2c1pQKVmBhJkZqSeMHizWdeW_cMeah',
          icon: Folder,
          iconColor: 'text-cyan-600 dark:text-cyan-400',
          iconBg: 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-200 dark:border-cyan-800/80',
          badge: 'Drive'
        }
      ]
    },
    {
      title: 'Advisor Utilities',
      items: [
        ...(onOpenPaymentModal ? [{
          id: 'payment-texts',
          title: 'Payment Hub & Messages',
          description: 'Quick bKash & Nagad copy templates for student admissions',
          icon: CreditCard,
          iconColor: 'text-rose-600 dark:text-rose-400',
          iconBg: 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800/80',
          badge: '1-Click',
          isAction: true,
          actionHandler: () => {
            setIsOpen(false);
            onOpenPaymentModal();
          }
        }] : []),
        ...(onOpenSheetSync ? [{
          id: 'sheet-sync',
          title: 'Google Sheet Sync Config',
          description: 'Manage live spreadsheet connection & polling interval',
          icon: FileSpreadsheet,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/80',
          badge: 'Live',
          isAction: true,
          actionHandler: () => {
            setIsOpen(false);
            onOpenSheetSync();
          }
        }] : [])
      ]
    }
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button: High-Contrast Accessible Button */}
      <button
        id="resources-dropdown-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`h-8 px-3 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-400 shadow-xs'
            : 'bg-slate-50/90 hover:bg-white text-slate-800 border-sky-200/80 hover:border-sky-300 dark:bg-[#1C2541] dark:hover:bg-[#253256] dark:text-slate-100 dark:border-slate-700/80'
        }`}
      >
        <Layers className={`w-3.5 h-3.5 ${isOpen ? 'text-white dark:text-slate-950' : 'text-sky-600 dark:text-sky-400'} shrink-0`} />
        <span className="whitespace-nowrap">{buttonLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Categorized Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-[#1C2541] border border-sky-200/90 dark:border-slate-700 shadow-2xl z-50 overflow-hidden focus:outline-hidden"
          >
            {/* Dropdown Header */}
            <div className="px-3.5 py-2.5 bg-sky-50/80 dark:bg-[#141C33] border-b border-sky-100 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Workspace Portals & Docs</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">8 verified team resources & telesales guides</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-[#0B132B] border border-sky-200 dark:border-slate-700 text-sky-800 dark:text-sky-300">
                8 Links
              </span>
            </div>

            {/* Scrollable Categories List */}
            <div className="max-h-[65vh] overflow-y-auto p-2 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((category, catIdx) => (
                <div key={category.title} className={catIdx > 0 ? 'pt-2.5' : ''}>
                  <div className="px-2 pb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                      {category.title}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      
                      if (item.isAction) {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={item.actionHandler}
                            className="w-full group p-2 rounded-lg text-left flex items-start gap-2.5 hover:bg-sky-50/60 dark:hover:bg-[#141C33] transition-colors cursor-pointer border border-transparent hover:border-sky-200 dark:hover:border-slate-700"
                          >
                            <div className={`p-1.5 rounded-lg border ${item.iconBg} ${item.iconColor} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shrink-0 font-mono">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        );
                      }

                      return (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group p-2 rounded-lg text-left flex items-start gap-2.5 hover:bg-sky-50/60 dark:hover:bg-[#141C33] transition-colors cursor-pointer border border-transparent hover:border-sky-200 dark:hover:border-slate-700"
                        >
                          <div className={`p-1.5 rounded-lg border ${item.iconBg} ${item.iconColor} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1">
                                <span>{item.title}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:translate-x-0.5 transition-all" />
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#0B132B] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 font-mono">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Dropdown Footer Quick Link */}
            <div className="p-2.5 bg-slate-50 dark:bg-[#141C33] border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold">10 Minute School Operations</span>
              <a 
                href="/assets/aistudio/Defined_Call_Pitch_Journey___Telesales__a819a591" 
                target="_blank" 
                rel="noreferrer" 
                className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>Call Pitch Guide</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
