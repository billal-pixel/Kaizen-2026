import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Crown, 
  Medal,
  Sparkles, 
  Flame, 
  ChevronRight, 
  TrendingUp, 
  Award,
  Zap,
  Star
} from 'lucide-react';

interface LeaderboardItem {
  id?: string;
  name: string;
  designation?: string;
  team: 'Stationed' | 'Virtual';
  sales: number;
  kpiDisplay: string;
  kpiNum?: number;
  grade: string;
  raw: any;
}

interface AnimatedLeaderboardProps {
  leaderboard: LeaderboardItem[];
  leaderboardFilter: 'combined' | 'stationed' | 'virtual';
  setLeaderboardFilter: (filter: 'combined' | 'stationed' | 'virtual') => void;
  stationedCount: number;
  virtualCount: number;
  totalCount: number;
  onSelectAdvisor: (advisor: any, type: 'stationed' | 'virtual') => void;
}

export const AnimatedLeaderboard: React.FC<AnimatedLeaderboardProps> = ({
  leaderboard,
  leaderboardFilter,
  setLeaderboardFilter,
  stationedCount,
  virtualCount,
  totalCount,
  onSelectAdvisor,
}) => {
  // Find top sales figure for comparative relative bar fill
  const topSales = leaderboard.length > 0 ? Math.max(...leaderboard.map(i => i.sales)) : 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between relative overflow-hidden group/card hover:border-amber-400/60 dark:hover:border-amber-500/40 transition-all duration-300"
    >
      {/* Subtle Ambient Golden Corner Glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-gradient-to-br from-amber-300/20 via-indigo-200/10 to-transparent blur-2xl pointer-events-none transition-opacity duration-500 group-hover/card:opacity-100 opacity-60" />

      {/* Header & Segmented Filter Control */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between gap-2 h-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Animated Trophy Icon Container */}
            <motion.div 
              whileHover={{ rotate: [-5, 5, -5, 0], scale: 1.1 }}
              transition={{ duration: 0.4 }}
              className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center shadow-xs relative"
            >
              <Trophy className="w-4 h-4 text-amber-500 drop-shadow-xs" />
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-xl bg-amber-400/20 pointer-events-none"
              />
            </motion.div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white truncate">
                  Top Advisors Leaderboard
                </h3>
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
                >
                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400/50 shrink-0" />
                </motion.span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Merit Rankings (Based on Sales Revenue)
              </p>
            </div>
          </div>

          {/* Animated Top 5 Badge */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-black px-2.5 py-1 rounded-lg font-mono shrink-0 shadow-2xs"
          >
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse shrink-0" />
            <span>Top 5</span>
          </motion.div>
        </div>

        {/* Liquid Animated Segmented Filter Bar */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner w-full h-9 sm:h-10 relative">
          {(['combined', 'stationed', 'virtual'] as const).map((tabKey) => {
            const isActive = leaderboardFilter === tabKey;
            const label = tabKey === 'combined' ? 'Combined' : tabKey === 'stationed' ? 'Stationed' : 'Virtual';
            const count = tabKey === 'combined' ? totalCount : tabKey === 'stationed' ? stationedCount : virtualCount;

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setLeaderboardFilter(tabKey)}
                className={`relative flex-1 py-1 rounded-lg text-xs font-extrabold transition-colors text-center cursor-pointer z-10 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {/* Active Sliding Pill Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeLeaderboardFilterPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className={`absolute inset-0 rounded-lg shadow-sm border ${
                      tabKey === 'combined'
                        ? 'bg-teal-700 border-teal-700 text-white'
                        : tabKey === 'stationed'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-emerald-600 text-white border-emerald-600'
                    }`}
                  />
                )}
                <span className="relative z-10">{label}</span>
                <span className={`relative z-10 text-[9px] font-mono font-bold px-1 rounded ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard List with Staggered Fluid Motion */}
      <div className="space-y-2 flex-1 flex flex-col justify-between relative z-10 my-1">
        <AnimatePresence mode="wait">
          {leaderboard.length === 0 ? (
            <motion.div
              key="empty-leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs text-slate-500 dark:text-slate-400 text-center py-8"
            >
              No advisors found in this division.
            </motion.div>
          ) : (
            <motion.div
              key={`leaderboard-list-${leaderboardFilter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2 flex-1 flex flex-col justify-between"
            >
              {leaderboard.map((item, idx) => {
                const relativeFillPct = topSales > 0 ? Math.min(100, Math.max(10, Math.round((item.sales / topSales) * 100))) : 100;
                const isChampion = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                return (
                  <motion.div
                    key={`${item.team}-${item.name}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.28,
                      delay: idx * 0.05,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    whileHover={{ 
                      y: -2.5, 
                      scale: 1.015,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => onSelectAdvisor(item.raw, item.team.toLowerCase() as any)}
                    className={`relative p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 cursor-pointer transition-all duration-200 group/item shadow-2xs hover:shadow-md overflow-hidden ${
                      isChampion
                        ? 'bg-gradient-to-r from-amber-50 via-amber-50/50 to-white dark:from-amber-950/30 dark:via-slate-800/80 dark:to-slate-900 border-amber-300 dark:border-amber-700/60 hover:border-amber-400 dark:hover:border-amber-500 ring-1 ring-amber-400/30'
                        : isSecond
                        ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                        : isThird
                        ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                    }`}
                  >
                    {/* Top Performer Radiant Sweep on Champion */}
                    {isChampion && (
                      <motion.div
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3.5,
                          ease: "easeInOut",
                          repeatDelay: 1.5
                        }}
                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent pointer-events-none skew-x-12"
                      />
                    )}

                    {/* Main Row Content */}
                    <div className="flex items-center justify-between gap-3 relative z-10">
                      {/* Left Column: Advisor Rank & Identity */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Rank Badge with Distinctive Luxury Styling */}
                        <div
                          className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 group-hover/item:scale-110 relative ${
                            isChampion 
                              ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow-md ring-2 ring-amber-400/50' 
                              : isSecond 
                              ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 shadow-xs ring-1 ring-slate-300/40' 
                              : isThird 
                              ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 shadow-xs ring-1 ring-amber-600/30' 
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-extrabold'
                          }`}
                        >
                          {isChampion ? (
                            <motion.div
                              animate={{ rotate: [0, -6, 6, 0] }}
                              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            >
                              <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                            </motion.div>
                          ) : (
                            <span>#{idx + 1}</span>
                          )}

                          {/* Subtle pulsating aura for champion */}
                          {isChampion && (
                            <motion.span
                              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute inset-0 rounded-lg bg-amber-400/40 pointer-events-none"
                            />
                          )}
                        </div>

                        {/* Name & Division Tag */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors truncate leading-tight">
                              {item.name}
                            </h4>
                            {isChampion && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 border border-amber-400 px-1.5 py-0.2 rounded-md shadow-xs">
                                <Crown className="w-2.5 h-2.5 fill-amber-950 shrink-0" />
                                Rank #1
                              </span>
                            )}
                            {isSecond && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-slate-900 bg-gradient-to-r from-slate-200 to-slate-300 border border-slate-300 px-1.5 py-0.2 rounded-md shadow-xs">
                                <Medal className="w-2.5 h-2.5 shrink-0" />
                                Rank #2
                              </span>
                            )}
                            {isThird && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-100 bg-gradient-to-r from-amber-700 to-amber-800 border border-amber-600 px-1.5 py-0.2 rounded-md shadow-xs">
                                <Award className="w-2.5 h-2.5 shrink-0" />
                                Rank #3
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.2 rounded border font-mono tracking-tight whitespace-nowrap transition-transform duration-200 group-hover/item:scale-105 ${
                              item.team === 'Stationed'
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.team === 'Stationed' ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
                              {item.team}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Grade, Sales & KPI Metrics */}
                      <div className="text-right shrink-0 flex flex-col items-end justify-center space-y-1">
                        <div className="flex items-center gap-1">
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tracking-tight whitespace-nowrap"
                          >
                            ৳{item.sales.toLocaleString('en-BD')}
                          </motion.span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all" />
                        </div>

                        <div className="flex items-center gap-1 justify-end">
                          {/* KPI Badge */}
                          <span className="font-black text-[9px] sm:text-[10px] font-mono tracking-tight bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded whitespace-nowrap shadow-2xs">
                            {item.kpiDisplay} KPI
                          </span>

                          {/* Grade Badge */}
                          <span className={`text-[9px] sm:text-[10px] font-black font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide whitespace-nowrap shadow-2xs ${
                            item.grade === 'A'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : item.grade === 'B'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                              : item.grade === 'C'
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                              : item.grade === 'D'
                              ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                          }`}>
                            {item.grade} GRADE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comparative Relative Revenue Micro-Meter Bar */}
                    <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 h-1 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${relativeFillPct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 + idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${
                          isChampion
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-xs'
                            : item.team === 'Stationed'
                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
