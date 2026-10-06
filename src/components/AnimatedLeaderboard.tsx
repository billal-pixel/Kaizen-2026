import React, { useState } from 'react';
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
import { AnimatedCounter } from './AnimatedCounter';

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

  // Active micro-reward click effect state
  const [activeBurstId, setActiveBurstId] = useState<string | null>(null);

  const handleAdvisorClick = (item: LeaderboardItem, idKey: string) => {
    setActiveBurstId(idKey);
    setTimeout(() => setActiveBurstId(null), 800);
    onSelectAdvisor(item.raw, item.team.toLowerCase() as any);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs space-y-4 flex flex-col justify-between relative overflow-hidden group/card hover:border-amber-400/60 dark:hover:border-amber-500/40 transition-all duration-300"
    >
      {/* Dynamic Animated Ambient Halo in Background */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.45, 0.75, 0.45],
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 18, 
          ease: "linear" 
        }}
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/25 via-sky-400/15 to-transparent blur-3xl pointer-events-none" 
      />

      {/* Subtle Floating Ambient Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { x: '15%', y: '20%', duration: 4, delay: 0 },
          { x: '82%', y: '15%', duration: 5, delay: 1 },
          { x: '70%', y: '65%', duration: 4.5, delay: 2 },
          { x: '25%', y: '80%', duration: 5.5, delay: 0.5 }
        ].map((pt, i) => (
          <motion.div
            key={`ambient-sparkle-${i}`}
            animate={{
              y: [0, -14, 0],
              opacity: [0.1, 0.45, 0.1],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              repeat: Infinity,
              duration: pt.duration,
              delay: pt.delay,
              ease: "easeInOut",
            }}
            style={{ left: pt.x, top: pt.y }}
            className="absolute w-1 h-1 rounded-full bg-amber-400/60 blur-[0.5px]"
          />
        ))}
      </div>

      {/* Header & Segmented Filter Control */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between gap-2 h-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Animated Trophy Icon Container with Orbiting Star */}
            <motion.div 
              whileHover={{ rotate: [-6, 6, -4, 4, 0], scale: 1.12 }}
              transition={{ duration: 0.45 }}
              className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center shadow-xs relative overflow-visible group/trophy"
            >
              <Trophy className="w-4 h-4 text-amber-500 drop-shadow-xs relative z-10" />

              {/* Pulsing Backlight Ring */}
              <motion.div
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.35, 0.05, 0.35],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-xl bg-amber-400/30 pointer-events-none"
              />

              {/* Orbiting Micro-Sparkle around Trophy */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute -inset-1.5 pointer-events-none"
              >
                <motion.div 
                  animate={{ scale: [0.7, 1.2, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                />
              </motion.div>
            </motion.div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 dark:text-white truncate">
                  Top Advisors Leaderboard
                </h3>
                <motion.span
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.25, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 3.5, repeatDelay: 1 }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/60 shrink-0" />
                </motion.span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Merit Rankings (Based on Sales Revenue)
              </p>
            </div>
          </div>

          {/* Animated Top 5 Badge with Rising Fire Embers */}
          <motion.div 
            whileHover={{ scale: 1.06, y: -1 }}
            className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-black px-2.5 py-1 rounded-lg font-mono shrink-0 shadow-2xs relative overflow-hidden"
          >
            <div className="relative flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              {/* Rising Flame Ember Sparks */}
              <motion.span
                animate={{
                  y: [0, -7],
                  x: [0, 2, -1],
                  opacity: [0.9, 0],
                  scale: [1, 0.4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.1,
                  ease: "easeOut",
                }}
                className="absolute w-1 h-1 rounded-full bg-amber-400 pointer-events-none"
              />
            </div>
            <span>Top 5</span>

            {/* Shimmer Light Reflection Sweep */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", repeatDelay: 2 }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none skew-x-12"
            />
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
                  >
                    {/* Active Tab Glimmer */}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1.5 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    />
                  </motion.div>
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
              className="space-y-2.5 flex-1 flex flex-col justify-between"
            >
              {leaderboard.map((item, idx) => {
                const relativeFillPct = topSales > 0 ? Math.min(100, Math.max(12, Math.round((item.sales / topSales) * 100))) : 100;
                const isChampion = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;
                const itemKey = `${item.team}-${item.name}-${idx}`;
                const isBursting = activeBurstId === itemKey;

                return (
                  <motion.div
                    key={itemKey}
                    layout
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      delay: idx * 0.04,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    whileHover={{ 
                      y: -4, 
                      scale: 1.018,
                      transition: { type: 'spring', stiffness: 420, damping: 22 }
                    }}
                    whileTap={{ 
                      scale: 0.985,
                      transition: { type: 'spring', stiffness: 500, damping: 25 }
                    }}
                    onClick={() => handleAdvisorClick(item, itemKey)}
                    className={`relative p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all duration-300 group/item shadow-2xs hover:shadow-lg overflow-hidden ${
                      isChampion
                        ? 'bg-gradient-to-r from-amber-50 via-amber-50/50 to-white dark:from-amber-950/35 dark:via-[#131d33] dark:to-[#0F172A] border-amber-300 dark:border-amber-600/70 hover:border-amber-400 dark:hover:border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/10'
                        : isSecond
                        ? 'bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500/60 ring-1 ring-slate-300/30'
                        : isThird
                        ? 'bg-gradient-to-r from-orange-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-500 ring-1 ring-amber-600/20'
                        : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                    }`}
                  >
                    {/* Champion Perimeter Laser Border Beam */}
                    {isChampion && (
                      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-20">
                        <motion.div
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                          className="w-2/3 h-[2px] absolute top-0 left-0 bg-gradient-to-r from-transparent via-amber-300 to-yellow-400 shadow-[0_0_10px_#f59e0b]"
                        />
                        <motion.div
                          animate={{ x: ['200%', '-100%'] }}
                          transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                          className="w-2/3 h-[2px] absolute bottom-0 left-0 bg-gradient-to-r from-transparent via-amber-300 to-yellow-400 shadow-[0_0_10px_#f59e0b]"
                        />
                      </div>
                    )}

                    {/* Top Performer Radiant Sweep on Champion */}
                    {isChampion && (
                      <motion.div
                        animate={{
                          x: ['-100%', '220%'],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3.2,
                          ease: "easeInOut",
                          repeatDelay: 1.8
                        }}
                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-300/25 to-transparent pointer-events-none skew-x-12 z-10"
                      />
                    )}

                    {/* Interactive Click Confetti Burst / Micro-Reward */}
                    <AnimatePresence>
                      {isBursting && (
                        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                          {[...Array(6)].map((_, pi) => {
                            const angle = (pi / 6) * Math.PI * 2;
                            const dist = 32 + Math.random() * 20;
                            const tx = Math.cos(angle) * dist;
                            const ty = Math.sin(angle) * dist;
                            return (
                              <motion.div
                                key={`burst-${pi}`}
                                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                animate={{ opacity: 0, scale: 1.4, x: tx, y: ty }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_#f59e0b]"
                              />
                            );
                          })}
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Main Row Content */}
                    <div className="flex items-center justify-between gap-3 relative z-10">
                      {/* Left Column: Advisor Rank & Identity */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Rank Badge with Distinctive Styling & Motion */}
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover/item:scale-105 relative ${
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
                              animate={{ 
                                rotate: [0, -8, 8, 0],
                                y: [0, -1.5, 0]
                              }}
                              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                              className="relative"
                            >
                              <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                              
                              {/* Micro Stars Twinkling around Champion Crown */}
                              <motion.span
                                animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1.8, delay: 0.2 }}
                                className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]"
                              />
                            </motion.div>
                          ) : isSecond ? (
                            <motion.div
                              animate={{ y: [0, -1, 0] }}
                              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                            >
                              <span className="font-black text-xs">#2</span>
                            </motion.div>
                          ) : isThird ? (
                            <motion.div
                              animate={{ y: [0, -1, 0] }}
                              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
                            >
                              <span className="font-black text-xs">#3</span>
                            </motion.div>
                          ) : (
                            <span className="text-xs">#{idx + 1}</span>
                          )}

                          {/* Pulsating Golden Aura on Champion */}
                          {isChampion && (
                            <motion.span
                              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ repeat: Infinity, duration: 2.2 }}
                              className="absolute inset-0 rounded-xl bg-amber-400/50 pointer-events-none"
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
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400 border border-amber-400 px-1.5 py-0.5 rounded-md shadow-xs relative overflow-hidden">
                                <Crown className="w-2.5 h-2.5 fill-amber-950 shrink-0" />
                                <span>RANK #1</span>
                                <motion.div
                                  animate={{ x: ['-100%', '200%'] }}
                                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                                />
                              </span>
                            )}
                            {isSecond && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-slate-900 bg-gradient-to-r from-slate-200 to-slate-300 border border-slate-300 px-1.5 py-0.5 rounded-md shadow-xs">
                                <Medal className="w-2.5 h-2.5 shrink-0 text-slate-700" />
                                <span>RANK #2</span>
                              </span>
                            )}
                            {isThird && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-100 bg-gradient-to-r from-amber-700 to-amber-800 border border-amber-600 px-1.5 py-0.5 rounded-md shadow-xs">
                                <Award className="w-2.5 h-2.5 shrink-0 text-amber-200" />
                                <span>RANK #3</span>
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
                            className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tracking-tight whitespace-nowrap flex items-center"
                          >
                            <span>৳</span>
                            <AnimatedCounter 
                              value={item.sales} 
                              duration={800}
                              formatter={(val) => Math.round(val).toLocaleString('en-BD')} 
                            />
                          </motion.span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all" />
                        </div>

                        <div className="flex items-center gap-1 justify-end">
                          {/* KPI Badge */}
                          <span className="font-black text-[9px] sm:text-[10px] font-mono tracking-tight bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded whitespace-nowrap shadow-2xs group-hover/item:border-blue-400 transition-colors">
                            {item.kpiDisplay} KPI
                          </span>

                          {/* Grade Badge */}
                          <span className={`text-[9px] sm:text-[10px] font-black font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide whitespace-nowrap shadow-2xs transition-transform duration-200 group-hover/item:scale-105 ${
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

                    {/* Comparative Relative Revenue Micro-Meter Bar with Dynamic Laser Pulse & Tip Spark */}
                    <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${relativeFillPct}%` }}
                        transition={{ duration: 0.7, delay: 0.08 + idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full relative overflow-hidden ${
                          isChampion
                            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 shadow-xs'
                            : isSecond
                            ? 'bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600'
                            : isThird
                            ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500'
                            : item.team === 'Stationed'
                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        }`}
                      >
                        {/* Continuous Motion Graphic Light Wave travelling across the progress bar */}
                        <motion.div
                          animate={{ x: ['-100%', '250%'] }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: isChampion ? 2.0 : 3.0, 
                            ease: "easeInOut",
                            repeatDelay: 0.5 
                          }}
                          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12"
                        />

                        {/* Glowing Tip Spark at Leading Edge of the Progress Bar */}
                        <motion.div
                          animate={{ 
                            scale: [0.8, 1.4, 0.8],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className={`absolute right-0 top-0 bottom-0 w-2 rounded-full ${
                            isChampion ? 'bg-white shadow-[0_0_8px_#fde047]' : 'bg-white/80 shadow-[0_0_6px_#fff]'
                          }`}
                        />
                      </motion.div>
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

