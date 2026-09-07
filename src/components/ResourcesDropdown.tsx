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
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface ResourcesDropdownProps {
  onOpenPaymentModal?: () => void;
  onOpenSheetSync?: () => void;
  theme?: 'dark' | 'light';
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
      title: 'Joining Groups & Docs',
      items: [
        {
          id: 'station-group',
          title: 'Station Group Doc',
          description: 'Official joining document for stationed advisors',
          url: 'https://docs.google.com/document/d/1jaGIrl5ewYbilQj38ZIqf6Cz6AVeQedGyDeuWP7lK7Q/edit?tab=t.0',
          icon: Link2,
          iconColor: 'text-emerald-700 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/60',
        },
        {
          id: 'virtual-group',
          title: 'Virtual Group Doc',
          description: 'Official joining document for virtual advisors',
          url: 'https://docs.google.com/document/d/1KVLOt1nOmNAsXCtCsxF4TYobUt8zfSGJ3mYq920s1UA/edit?tab=t.0',
          icon: Link2,
          iconColor: 'text-indigo-700 dark:text-indigo-400',
          iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800/60',
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
          iconColor: 'text-blue-700 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800/60',
        },
        {
          id: 'vt-site',
          title: 'VT Essential Site',
          description: 'Virtual team resource portal & directory',
          url: 'https://sites.google.com/view/10ms-vt-essential/home',
          icon: Globe,
          iconColor: 'text-cyan-700 dark:text-cyan-400',
          iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800/60',
        }
      ]
    },
    {
      title: 'Drives & Reference Material',
      items: [
        {
          id: 'good-call-drive',
          title: 'Good Call Archive',
          description: 'Exemplary sales call recordings and benchmarks',
          url: 'https://drive.google.com/drive/folders/1BGEaDod5zXZ6nvoNfYsGvry02c2oElZk?ths=true',
          icon: Folder,
          iconColor: 'text-emerald-700 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/60',
          badge: 'Audio'
        },
        {
          id: 'follow-up-drive',
          title: 'Follow Up Drive',
          description: 'Customer follow-up templates & tracking sheets',
          url: 'https://drive.google.com/drive/folders/1Tk2c1pQKVmBhJkZqSeMHizWdeW_cMeah',
          icon: Folder,
          iconColor: 'text-indigo-700 dark:text-indigo-400',
          iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800/60',
        },
        {
          id: 'free-resource-doc',
          title: 'Free Resource Doc',
          description: 'Learning materials and student resources',
          url: 'https://docs.google.com/document/d/1GiVK9N2diFGsYuW9RfFeDVxtl3AnZe9wP3LGo2g0g1o/edit?tab=t.0',
          icon: BookOpen,
          iconColor: 'text-amber-700 dark:text-amber-400',
          iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/60',
        }
      ]
    },
    {
      title: 'Advisor Utilities',
      items: [
        ...(onOpenPaymentModal ? [{
          id: 'payment-texts',
          title: 'Payment Copy Texts',
          description: 'Quick bKash & Nagad copy templates for student admissions',
          icon: CreditCard,
          iconColor: 'text-rose-700 dark:text-rose-400',
          iconBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/60',
          badge: 'Quick Copy',
          isAction: true,
          actionHandler: () => {
            setIsOpen(false);
            onOpenPaymentModal();
          }
        }] : []),
        ...(onOpenSheetSync ? [{
          id: 'sheet-sync',
          title: 'Sheet Sync Center',
          description: 'Manage live Google Sheet connection & manual cells paste',
          icon: FileSpreadsheet,
          iconColor: 'text-emerald-700 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/60',
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
        className={`h-9 px-3.5 rounded-xl border text-xs font-black inline-flex items-center gap-2 transition-all cursor-pointer select-none shadow-xs ${
          isOpen
            ? 'bg-slate-100 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/30'
            : 'bg-white hover:bg-slate-100 border-slate-400 hover:border-slate-600 text-[#0F172A]'
        }`}
      >
        <Layers className="w-4 h-4 text-indigo-700 shrink-0" />
        <span className="whitespace-nowrap font-black text-[#0F172A]">Resources & Portals</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#0F172A] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Categorized Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border-2 border-slate-400 shadow-2xl z-50 overflow-hidden focus:outline-hidden"
          >
            {/* Dropdown Header */}
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-400 text-indigo-700">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#0F172A]">Team Resources & Portals</h4>
                  <p className="text-[10px] text-[#0F172A] font-bold">Quick access to official links, documents & tools</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-200 border border-slate-400 text-[#0F172A]">
                8 Links
              </span>
            </div>

            {/* Scrollable Categories List */}
            <div className="max-h-[70vh] overflow-y-auto p-2 space-y-3 divide-y divide-slate-200">
              {categories.map((category, catIdx) => (
                <div key={category.title} className={catIdx > 0 ? 'pt-2.5' : ''}>
                  <div className="px-2 pb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] font-mono">
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
                            className="w-full group p-2 rounded-xl text-left flex items-start gap-2.5 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-400"
                          >
                            <div className={`p-2 rounded-xl border ${item.iconBg} ${item.iconColor} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-black text-[#0F172A] group-hover:text-indigo-700 transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-400 shrink-0 font-mono">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#0F172A] font-semibold leading-snug line-clamp-1">
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
                          className="group p-2 rounded-xl text-left flex items-start gap-2.5 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-400"
                        >
                          <div className={`p-2 rounded-xl border ${item.iconBg} ${item.iconColor} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-black text-[#0F172A] group-hover:text-indigo-700 transition-colors flex items-center gap-1">
                                <span>{item.title}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#0F172A] group-hover:translate-x-0.5 transition-all" />
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-200 text-[#0F172A] border border-slate-400 shrink-0 font-mono">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#0F172A] font-semibold leading-snug line-clamp-1">
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
            <div className="p-2.5 bg-slate-100 border-t border-slate-300 text-center">
              <span className="text-[10px] text-[#0F172A] font-extrabold">
                Team Kaizen • 10 Minute School Operations Portal
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
