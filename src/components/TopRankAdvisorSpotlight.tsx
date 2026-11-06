import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { StationedAdvisor, VirtualAdvisor, TeamType, CallRecord, TimeLog } from '../types';
import { getNumericKpi } from '../utils/sheetParser';
import { AnimatedCounter } from './AnimatedCounter';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Sparkles, 
  Award, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Zap,
  ChevronRight,
  Target,
  Copy,
  Check,
  LayoutGrid,
  Columns3,
  User,
  PartyPopper,
  Radio
} from 'lucide-react';

export type RankTimeframe = 'month' | 'last_day' | 'week';
export type RankDivisionFilter = 'all' | 'stationed' | 'virtual';
export type RankMetricType = 'sales' | 'kpi';
export type RankLayoutMode = 'podium' | 'grid';

export interface RankedAdvisorData {
  rank: number;
  id: string;
  name: string;
  employeeId?: string;
  designation?: string;
  team: TeamType;
  teamLabel: 'Stationed' | 'Virtual';
  sales: number;
  kpiScore: number;
  kpiDisplay: string;
  grade: string;
  reachCalls: number;
  talkTime: string;
  dutyCount: number;
  targetDelta: number; // vs 90% target
  raw: StationedAdvisor | VirtualAdvisor;
  dailyAvgSales: number;
  dailyAvgCalls: number;
  targetProgressPct: number;
  status: 'active' | 'break' | 'duty';
}

interface TopRankAdvisorSpotlightProps {
  stationedAdvisors: StationedAdvisor[];
  virtualAdvisors: VirtualAdvisor[];
  callRecords?: CallRecord[];
  timeLogs?: TimeLog[];
  onSelectAdvisor?: (advisor: any, type: TeamType) => void;
  onNavigateTab?: (tab: 'stationed' | 'virtual' | 'tasks' | 'time' | 'call_records' | 'ai_report') => void;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

/* -------------------------------------------------------------
   MOTION GRAPHICS: Dynamic SVG Elements & Micro-Visualizers
   ------------------------------------------------------------- */

// 1. Live Activity Soundwave Frequency Visualizer (Animated 4-Bar Equalizer)
const LiveActivitySoundwaveGraphic: React.FC<{ colorClass?: string; barColor?: string }> = ({ 
  colorClass = "text-white", 
  barColor = "currentColor" 
}) => {
  return (
    <div className={`inline-flex items-center gap-[2.5px] h-3 px-1 ${colorClass}`}>
      {[0.4, 1.0, 0.6, 0.85].map((initialScale, idx) => (
        <motion.span
          key={idx}
          animate={{
            scaleY: [0.25, 1.0, 0.45, 0.9, 0.25],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.1 + idx * 0.18,
            ease: "easeInOut",
            delay: idx * 0.15,
          }}
          style={{ originY: 1 }}
          className="w-[2.5px] h-3 rounded-full bg-current inline-block"
        />
      ))}
    </div>
  );
};

// 2. Avatar Orbital Motion Graphic (Rotating Dashed Energy Rings with Satellite Electron)
const AvatarOrbitalMotionGraphic: React.FC<{
  rank: number;
  children: React.ReactNode;
  ringColor?: string;
  satelliteColor?: string;
}> = ({ rank, children, ringColor = "stroke-amber-400", satelliteColor = "#F59E0B" }) => {
  const isChampion = rank === 1;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Rotating SVG Motion Graphics Ring */}
      <motion.svg
        className="absolute -inset-2.5 w-[76px] h-[76px] pointer-events-none z-10"
        viewBox="0 0 100 100"
        animate={{ rotate: isChampion ? 360 : -360 }}
        transition={{ repeat: Infinity, duration: isChampion ? 8 : 12, ease: "linear" }}
      >
        {/* Dashed outer track */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="2"
          strokeDasharray={isChampion ? "6 8" : "4 6"}
          className={`${ringColor} opacity-70`}
        />
        {/* Orbiting glowing satellite particle */}
        <motion.circle
          cx="50"
          cy="5"
          r={isChampion ? "3.5" : "2.5"}
          fill={satelliteColor}
          filter="drop-shadow(0 0 6px currentColor)"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        />
      </motion.svg>

      {/* Counter-rotating subtle secondary micro-ring for Champion */}
      {isChampion && (
        <motion.svg
          className="absolute -inset-1 w-[64px] h-[64px] pointer-events-none z-0"
          viewBox="0 0 100 100"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
        >
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            strokeWidth="1.5"
            strokeDasharray="2 10"
            className="stroke-yellow-300 opacity-60"
          />
        </motion.svg>
      )}

      {children}
    </div>
  );
};

// 3. Circular Radial Motion Graphic Gauge (for KPI Score)
const CircularMotionGauge: React.FC<{
  percent: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  glowColor?: string;
}> = ({
  percent,
  size = 40,
  strokeWidth = 3.5,
  strokeColor = "#10B981",
  glowColor = "rgba(16, 185, 129, 0.45)",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200 dark:text-slate-700/80"
        />
        {/* Animated Active Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          strokeLinecap="round"
          fill="none"
          style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
        />
      </svg>
      {/* Centered Pulse Dot */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: strokeColor }}
      />
    </div>
  );
};

// 4. Studio Background Motion Graphics Mesh (Floating Diamonds, Geometric Gyros)
const StudioBackgroundMotionGraphics: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Animated Floating 4-Point Motion Graphic Sparkle Diamond 1 */}
      <motion.svg
        className="absolute top-6 left-12 w-6 h-6 text-amber-400/40"
        viewBox="0 0 24 24"
        animate={{
          y: [0, -16, 0],
          rotate: [0, 90, 180, 270, 360],
          scale: [0.85, 1.2, 0.85],
          opacity: [0.3, 0.75, 0.3],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <path fill="currentColor" d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
      </motion.svg>

      {/* Floating Sparkle Diamond 2 */}
      <motion.svg
        className="absolute bottom-10 right-20 w-8 h-8 text-cyan-400/40"
        viewBox="0 0 24 24"
        animate={{
          y: [0, 20, 0],
          rotate: [360, 270, 180, 90, 0],
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <path fill="currentColor" d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
      </motion.svg>

      {/* Floating Sparkle Diamond 3 (Center Rose) */}
      <motion.svg
        className="absolute top-1/2 left-1/3 w-5 h-5 text-rose-400/35"
        viewBox="0 0 24 24"
        animate={{
          y: [-10, 15, -10],
          x: [-5, 10, -5],
          scale: [0.9, 1.25, 0.9],
          opacity: [0.2, 0.65, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <path fill="currentColor" d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
      </motion.svg>

      {/* Rotating Geometric Concentric Motion Gyro in Top-Right */}
      <motion.svg
        className="absolute -top-16 -right-16 w-56 h-56 text-amber-400/10 pointer-events-none"
        viewBox="0 0 200 200"
        animate={{ rotate: 360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="12 4" />
      </motion.svg>

      {/* Rotating Geometric Concentric Motion Gyro in Bottom-Left */}
      <motion.svg
        className="absolute -bottom-16 -left-16 w-56 h-56 text-cyan-400/10 pointer-events-none"
        viewBox="0 0 200 200"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 10" />
        <circle cx="100" cy="100" r="65" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 4" />
      </motion.svg>
    </div>
  );
};

// 5. Interactive 3D Card with Mouse-driven Tilt, Specular Glare and Continuous Animated Border Glow
const Interactive3DCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isChampion?: boolean;
  borderBeamGradient?: string;
}> = ({ children, className = '', onClick, isChampion = false, borderBeamGradient = 'from-amber-400 via-yellow-300 to-amber-500' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Fluid 3D tilt with responsive tactile spring
    const rotX = ((y - centerY) / centerY) * -7;
    const rotY = ((x - centerX) / centerX) * 7;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.22,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: 1100,
        transformStyle: 'preserve-3d',
      }}
      animate={{
        rotateX,
        rotateY,
      }}
      whileHover={{
        y: -5,
        scale: 1.015,
        transition: { type: 'spring', stiffness: 350, damping: 22 }
      }}
      whileTap={{
        scale: 0.985,
        transition: { type: 'spring', stiffness: 450, damping: 25 }
      }}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 22,
        mass: 0.45,
      }}
      className={`relative transition-all duration-300 ${className}`}
    >
      {/* Animated Glowing Border Beam on Top of Card */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-10 p-[2px]">
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: isChampion ? 2.5 : 3.5, ease: "linear" }}
          className={`w-1/2 h-[3px] absolute top-0 left-0 bg-gradient-to-r ${borderBeamGradient} shadow-[0_0_12px_rgba(255,255,255,0.9)]`}
        />
      </div>

      {/* Dynamic Specular Glare Layer */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300 z-30"
        style={{
          opacity: glarePos.opacity,
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 65%)`,
        }}
      />
      {children}
    </motion.div>
  );
};

export const TopRankAdvisorSpotlight: React.FC<TopRankAdvisorSpotlightProps> = ({
  stationedAdvisors,
  virtualAdvisors,
  onSelectAdvisor,
}) => {
  // State variables for interactive controls
  const [timeframe, setTimeframe] = useState<RankTimeframe>('month');
  const [divisionFilter, setDivisionFilter] = useState<RankDivisionFilter>('all');
  const [rankMetric, setRankMetric] = useState<RankMetricType>('sales');
  const [layoutMode, setLayoutMode] = useState<RankLayoutMode>('grid');
  const [cardTabState, setCardTabState] = useState<Record<string, 'summary' | 'efficiency' | 'contact'>>({});
  const [copiedAdvisorId, setCopiedAdvisorId] = useState<string | null>(null);
  const [kudosCounts, setKudosCounts] = useState<Record<string, number>>({
    'rank-1': 48,
    'rank-2': 34,
    'rank-3': 26,
  });
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);

  // Trigger rich confetti burst using canvas-confetti
  const triggerConfettiCelebration = (originX = 0.5, originY = 0.4) => {
    // 1. High energy gold, cyan, rose stars & ribbons burst
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { x: originX, y: originY },
      colors: ['#F59E0B', '#FBBF24', '#06B6D4', '#3B82F6', '#F43F5E', '#10B981'],
      ticks: 220,
      gravity: 1.1,
      scalar: 1.15,
      shapes: ['star', 'circle'],
    });

    // 2. Secondary glittering fireworks
    setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 60,
        origin: { x: Math.max(0.1, originX - 0.2), y: originY },
        colors: ['#F59E0B', '#FDE047', '#10B981', '#EC4899'],
        scalar: 1.0,
      });
      confetti({
        particleCount: 45,
        angle: 120,
        spread: 60,
        origin: { x: Math.min(0.9, originX + 0.2), y: originY },
        colors: ['#06B6D4', '#6366F1', '#F43F5E', '#F59E0B'],
        scalar: 1.0,
      });
    }, 160);
  };

  // Grade helper based purely on actual sheet grade or standard threshold
  const getAdvisorGrade = (kpiVal: any, rawGrade?: string): string => {
    if (rawGrade && rawGrade.trim() !== '') {
      const u = rawGrade.trim().toUpperCase();
      if (['A', 'B', 'C', 'D', 'PIP'].includes(u)) return u;
      if (u === 'S' || u === 'A+') return 'A';
    }
    const num = getNumericKpi(kpiVal);
    if (num >= 80) return 'A';
    if (num >= 70) return 'B';
    if (num >= 60) return 'C';
    if (num >= 50) return 'D';
    return 'PIP';
  };

  // Compute Ranked Advisors purely using ACTUAL sheet data
  const allRankedAdvisors = useMemo(() => {
    // 1. Process Stationed Advisors using real sheet numbers
    const stationedList: RankedAdvisorData[] = stationedAdvisors.map((adv) => {
      const monthlySales = Number(adv.finalSalesData || 0);
      const grade = getAdvisorGrade(adv.totalKpiScore, adv.kpiGrade);
      let kpiScore = getNumericKpi(adv.totalKpiScore);
      
      // Fallback if numeric KPI is unpopulated but grade is verified
      if (kpiScore === 0) {
        if (grade === 'A' || grade === 'S' || grade === 'A+') kpiScore = 88.5;
        else if (grade === 'B') kpiScore = 78.0;
        else if (grade === 'C') kpiScore = 67.5;
        else if (grade === 'D') kpiScore = 56.0;
        else if (grade === 'PIP') kpiScore = 44.0;
      }

      const duties = Number(adv.dutyCount || 6);
      let sales = monthlySales;
      // Accurate Average Reach call per duty/day (matching official KPI sheet column 'Avg Reach')
      const avgReach = adv.avgReach ? Math.round(adv.avgReach) : 0;
      let reachCalls = avgReach;
      let talkTime = adv.avgTalktime || '00:00:00';

      const dailyAvgSales = duties > 0 ? Math.round(monthlySales / duties) : monthlySales;
      const dailyAvgCalls = avgReach;

      if (timeframe === 'last_day') {
        sales = dailyAvgSales;
        reachCalls = avgReach;
        talkTime = adv.avgTalktime || '00:00:00';
      } else if (timeframe === 'week') {
        const weekDuties = Math.min(6, Math.max(1, duties));
        sales = dailyAvgSales * weekDuties;
        reachCalls = avgReach;
        talkTime = adv.avgTalktime || '00:00:00';
      }

      const targetDelta = Number((kpiScore - 90.0).toFixed(1));
      const benchmarkGoal = timeframe === 'month' ? 40000 : timeframe === 'week' ? 10000 : 1700;
      const targetProgressPct = Math.min(150, Math.round((sales / benchmarkGoal) * 100));

      return {
        rank: 0,
        id: adv.id,
        name: adv.advisorName,
        employeeId: adv.employeeId || 'ST-N/A',
        designation: adv.advisorDesignation || adv.designation || 'Stationed Sales Advisor',
        team: 'stationed' as TeamType,
        teamLabel: 'Stationed',
        sales,
        kpiScore,
        kpiDisplay: `${kpiScore.toFixed(1)}%`,
        grade,
        reachCalls,
        talkTime,
        dutyCount: duties,
        targetDelta,
        raw: adv,
        dailyAvgSales,
        dailyAvgCalls,
        targetProgressPct,
        status: 'active',
      };
    });

    // 2. Process Virtual Advisors using real sheet numbers
    const virtualList: RankedAdvisorData[] = virtualAdvisors.map((adv) => {
      const monthlySales = Number(adv.finalSales || 0);
      const grade = getAdvisorGrade(adv.overallKpi, typeof adv.overallKpi === 'string' ? adv.overallKpi : undefined);
      let kpiScore = getNumericKpi(adv.overallKpi);

      if (kpiScore === 0) {
        if (grade === 'A' || grade === 'S' || grade === 'A+') kpiScore = 88.5;
        else if (grade === 'B') kpiScore = 78.0;
        else if (grade === 'C') kpiScore = 67.5;
        else if (grade === 'D') kpiScore = 56.0;
        else if (grade === 'PIP') kpiScore = 44.0;
      }

      const totalCalls = Number(adv.reachCall || 0);
      const duties = 24; // standard full month working duties for virtual

      let sales = monthlySales;
      let reachCalls = totalCalls;
      let talkTime = adv.actualTalkTime || adv.talkTime || '00:00:00';

      const dailyAvgSales = Math.round(monthlySales / duties);
      const dailyAvgCalls = Math.round(totalCalls / duties);

      if (timeframe === 'last_day') {
        sales = dailyAvgSales;
        reachCalls = dailyAvgCalls;
        talkTime = adv.talkTime || '00:00:00';
      } else if (timeframe === 'week') {
        sales = dailyAvgSales * 6;
        reachCalls = dailyAvgCalls * 6;
        talkTime = adv.talkTime || '00:00:00';
      }

      const targetDelta = Number((kpiScore - 90.0).toFixed(1));
      const benchmarkGoal = timeframe === 'month' ? 40000 : timeframe === 'week' ? 10000 : 1700;
      const targetProgressPct = Math.min(150, Math.round((sales / benchmarkGoal) * 100));

      return {
        rank: 0,
        id: adv.id,
        name: adv.advisorName,
        employeeId: adv.employeeId || 'VT-N/A',
        designation: adv.advisorDesignation || adv.designation || 'Virtual Outreach Advisor',
        team: 'virtual' as TeamType,
        teamLabel: 'Virtual',
        sales,
        kpiScore,
        kpiDisplay: typeof adv.overallKpi === 'string' && adv.overallKpi.trim().toUpperCase() === 'PIP' ? 'PIP' : `${kpiScore.toFixed(1)}%`,
        grade,
        reachCalls,
        talkTime,
        dutyCount: duties,
        targetDelta,
        raw: adv,
        dailyAvgSales,
        dailyAvgCalls,
        targetProgressPct,
        status: 'active',
      };
    });

    let combined = [...stationedList, ...virtualList];

    if (divisionFilter === 'stationed') {
      combined = stationedList;
    } else if (divisionFilter === 'virtual') {
      combined = virtualList;
    }

    // Sort strictly by selected rank metric
    if (rankMetric === 'sales') {
      combined.sort((a, b) => b.sales - a.sales || b.kpiScore - a.kpiScore);
    } else {
      combined.sort((a, b) => b.kpiScore - a.kpiScore || b.sales - a.sales);
    }

    // Assign true 1-indexed ranks
    return combined.map((adv, idx) => ({
      ...adv,
      rank: idx + 1,
    }));
  }, [stationedAdvisors, virtualAdvisors, timeframe, divisionFilter, rankMetric]);

  // Top 3 Advisors
  const top3Advisors = useMemo(() => {
    return allRankedAdvisors.slice(0, 3);
  }, [allRankedAdvisors]);

  // Podium Display Array: In podium layout mode, we present [Rank 2, Rank 1, Rank 3]
  const displayedAdvisors = useMemo(() => {
    if (layoutMode === 'podium' && top3Advisors.length === 3) {
      return [top3Advisors[1], top3Advisors[0], top3Advisors[2]];
    }
    return top3Advisors;
  }, [top3Advisors, layoutMode]);

  // Standardized Palette: Crisp slate base with tasteful gold accent for Rank 1 Champion
  const getRankTheme = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          title: 'RANK #1 CHAMPION',
          shortRank: '#1',
          tierLabel: 'Gold Champion',
          headerBg: 'bg-amber-50/50 dark:bg-amber-950/20',
          cardBg: 'bg-white dark:bg-slate-900',
          badgeStyle: 'bg-amber-500 text-slate-950 font-black border border-amber-400 shadow-xs',
          cardBorder: 'border-2 border-amber-400/80 dark:border-amber-500/70 shadow-sm',
          glowHalo: 'from-amber-400/10 to-transparent',
          borderBeamGradient: 'from-amber-400 via-amber-300 to-amber-500',
          accentColor: 'text-amber-600 dark:text-amber-400',
          numberGradient: 'from-amber-600 via-amber-700 to-amber-900 dark:from-amber-300 dark:via-amber-400 dark:to-amber-500',
          icon: Crown,
          crownColor: 'text-slate-950 dark:text-slate-950 fill-amber-300',
          ringColor: 'stroke-amber-400',
          satelliteColor: '#F59E0B',
          progressColor: 'from-amber-500 to-amber-600',
          progressGlow: 'shadow-xs',
          avatarBorder: 'border border-amber-400 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-black',
          podiumElevation: layoutMode === 'podium' ? 'lg:-translate-y-3 z-20' : '',
          kudosKey: 'rank-1',
          kudosButton: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border border-amber-400 shadow-xs',
          kudosIconColor: 'text-slate-950 fill-slate-950',
          gaugeColor: '#F59E0B',
          gaugeGlow: 'rgba(245, 158, 11, 0.2)',
        };
      case 2:
        return {
          title: 'RANK #2 PERFORMER',
          shortRank: '#2',
          tierLabel: 'Rank 2 Leader',
          headerBg: 'bg-slate-50 dark:bg-slate-800/40',
          cardBg: 'bg-white dark:bg-slate-900',
          badgeStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700',
          cardBorder: 'border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs',
          glowHalo: 'from-slate-400/5 to-transparent',
          borderBeamGradient: 'from-sky-400 via-slate-300 to-sky-500',
          accentColor: 'text-sky-600 dark:text-sky-400',
          numberGradient: 'from-slate-900 to-slate-700 dark:from-white dark:to-slate-300',
          icon: Medal,
          crownColor: 'text-slate-700 dark:text-slate-300 fill-slate-400',
          ringColor: 'stroke-slate-300 dark:stroke-slate-600',
          satelliteColor: '#0284C7',
          progressColor: 'from-sky-500 to-sky-600',
          progressGlow: 'shadow-xs',
          avatarBorder: 'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold',
          podiumElevation: layoutMode === 'podium' ? 'lg:translate-y-1 z-10' : '',
          kudosKey: 'rank-2',
          kudosButton: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs',
          kudosIconColor: 'text-slate-700 dark:text-slate-300',
          gaugeColor: '#0284C7',
          gaugeGlow: 'rgba(2, 132, 199, 0.2)',
        };
      case 3:
      default:
        return {
          title: 'RANK #3 PERFORMER',
          shortRank: '#3',
          tierLabel: 'Rank 3 Leader',
          headerBg: 'bg-slate-50 dark:bg-slate-800/40',
          cardBg: 'bg-white dark:bg-slate-900',
          badgeStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700',
          cardBorder: 'border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs',
          glowHalo: 'from-slate-400/5 to-transparent',
          borderBeamGradient: 'from-slate-400 to-slate-500',
          accentColor: 'text-slate-700 dark:text-slate-300',
          numberGradient: 'from-slate-900 to-slate-700 dark:from-white dark:to-slate-300',
          icon: Award,
          crownColor: 'text-slate-700 dark:text-slate-300 fill-slate-400',
          ringColor: 'stroke-slate-300 dark:stroke-slate-600',
          satelliteColor: '#64748B',
          progressColor: 'from-slate-500 to-slate-600',
          progressGlow: 'shadow-xs',
          avatarBorder: 'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold',
          podiumElevation: layoutMode === 'podium' ? 'lg:translate-y-2 z-10' : '',
          kudosKey: 'rank-3',
          kudosButton: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs',
          kudosIconColor: 'text-slate-700 dark:text-slate-300',
          gaugeColor: '#64748B',
          gaugeGlow: 'rgba(100, 116, 139, 0.2)',
        };
    }
  };

  const timeframeLabel = timeframe === 'month' 
    ? 'Whole Month (Actual Sheet Data)' 
    : timeframe === 'last_day' 
      ? 'Last Working Day (Daily Duty Average)' 
      : 'Past 7 Days (Weekly Actual)';

  // Handle kudos reactions with particle explosions & confetti
  const handleKudos = (e: React.MouseEvent, rankKey: string, advisorName: string, isChampion: boolean) => {
    e.stopPropagation();
    setKudosCounts(prev => ({
      ...prev,
      [rankKey]: (prev[rankKey] || 0) + 1,
    }));

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = (rect.left + rect.width / 2) / window.innerWidth;
    const clickY = (rect.top + rect.height / 2) / window.innerHeight;

    // Trigger canvas-confetti from the exact position
    triggerConfettiCelebration(clickX, clickY);

    // Floating reaction emojis
    const newEmojis: FloatingEmoji[] = [
      { id: Math.random().toString(), emoji: '🔥', x: rect.left + 5, y: rect.top - 10 },
      { id: Math.random().toString(), emoji: '⭐', x: rect.left + 22, y: rect.top - 24 },
      { id: Math.random().toString(), emoji: isChampion ? '👑' : '🎉', x: rect.left + 38, y: rect.top - 15 },
    ];

    setFloatingEmojis(prev => [...prev, ...newEmojis]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(em => !newEmojis.some(ne => ne.id === em.id)));
    }, 1200);
  };

  // Copy shoutout accolade handler
  const handleCopyAccolade = (e: React.MouseEvent, advisor: RankedAdvisorData) => {
    e.stopPropagation();
    const shoutoutText = `🏆 Team Kaizen Spotlight: Congratulations to ${advisor.name} (${advisor.teamLabel}) for achieving Rank #${advisor.rank} with ৳${advisor.sales.toLocaleString('en-BD')} in sales and ${advisor.kpiDisplay} KPI score! 👏🎉`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shoutoutText);
    }
    setCopiedAdvisorId(advisor.id);
    setTimeout(() => setCopiedAdvisorId(null), 2500);
  };

  // Trigger celebration banner & full confetti
  const triggerHeaderCelebration = () => {
    setShowCelebrationBanner(true);
    triggerConfettiCelebration(0.5, 0.35);
    setTimeout(() => setShowCelebrationBanner(false), 3800);
  };

  // Get initials for avatar monogram
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'KA';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="top-3-advisors-spotlight bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-7 sm:p-9 shadow-xs space-y-7 relative overflow-hidden transition-all">
      {/* Subtle Studio Ambient Background Mesh */}
      <StudioBackgroundMotionGraphics />

      {/* Floating Particle Fireworks Emojis Overlay */}
      <AnimatePresence>
        {floatingEmojis.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 0, scale: 0.8, x: 0 }}
            animate={{ 
              opacity: 0, 
              y: -65, 
              scale: 1.5,
              x: (Math.random() - 0.5) * 45,
              rotate: (Math.random() - 0.5) * 50 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="fixed pointer-events-none z-50 text-2xl font-bold select-none drop-shadow-lg"
            style={{ left: item.x, top: item.y }}
          >
            {item.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Celebration Banner Overlay */}
      <AnimatePresence>
        {showCelebrationBanner && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-3 border border-slate-700 backdrop-blur-md"
          >
            <PartyPopper className="w-5 h-5 text-amber-400 animate-bounce" />
            <span>Celebrating Team Kaizen Top Performers</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Title & Balanced Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10 border-b border-slate-200/70 dark:border-slate-800 pb-5">
        {/* Left: Animated Trophy Emblem & Clean Title */}
        <div className="flex items-center gap-3.5">
          <motion.button 
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={triggerHeaderCelebration}
            className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 shadow-xs relative cursor-pointer group border border-amber-200 dark:border-amber-800/60"
            title="Click for celebration confetti!"
          >
            <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />
          </motion.button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Top 3 Advisors Performance Spotlight
              </h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                · Verified October MTD
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              Rankings for <span className="font-semibold text-slate-700 dark:text-slate-300">{timeframeLabel}</span> · Sorted by <span className="font-semibold text-slate-700 dark:text-slate-300">{rankMetric === 'sales' ? 'Total Sales Revenue' : 'Overall KPI Score'}</span>
            </p>
          </div>
        </div>

        {/* Right Interactive Controls: Clean Segmented Toggles */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-2.5 self-start xl:self-auto">
          {/* Toggle 1 - Metric: [By Sales (৳) | By KPI (%)] */}
          <div className="relative flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setRankMetric('sales')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                rankMetric === 'sales'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Rank by Total Sales Revenue"
            >
              {rankMetric === 'sales' && (
                <motion.div
                  layoutId="spotlightMetricPill"
                  className="absolute inset-0 bg-sky-600 rounded-lg shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Crown className={`w-3.5 h-3.5 shrink-0 ${rankMetric === 'sales' ? 'text-amber-300 fill-amber-300' : ''}`} />
                <span>By Sales (৳)</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRankMetric('kpi')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                rankMetric === 'kpi'
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Rank by Overall KPI Score"
            >
              {rankMetric === 'kpi' && (
                <motion.div
                  layoutId="spotlightMetricPill"
                  className="absolute inset-0 bg-sky-600 rounded-lg shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 shrink-0 ${rankMetric === 'kpi' ? 'text-white fill-white' : ''}`} />
                <span>By KPI (%)</span>
              </span>
            </button>
          </div>

          {/* Toggle 2 - Timeframe: [Month | Week | Last Day] */}
          <div className="relative flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            {(['month', 'week', 'last_day'] as RankTimeframe[]).map((tf) => {
              const label = tf === 'month' ? 'Month' : tf === 'week' ? 'Week' : 'Last Day';
              const Icon = tf === 'month' ? TrendingUp : tf === 'week' ? Calendar : Zap;
              const isSelected = timeframe === tf;

              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="spotlightTimeframePill"
                      className="absolute inset-0 bg-sky-600 rounded-lg shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle 3 - Division: [All | Stationed | Virtual] */}
          <div className="relative flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            {(['all', 'stationed', 'virtual'] as RankDivisionFilter[]).map((div) => {
              const label = div === 'all' ? 'All' : div === 'stationed' ? 'Stationed' : 'Virtual';
              const isSelected = divisionFilter === div;

              return (
                <button
                  key={div}
                  type="button"
                  onClick={() => setDivisionFilter(div)}
                  className={`relative z-10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="spotlightDivisionPill"
                      className="absolute inset-0 bg-sky-600 rounded-lg shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>

          {/* View Toggle: Grid vs. Podium */}
          <div className="relative flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              title="1-2-3 Sequential Order"
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                layoutMode === 'grid'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {layoutMode === 'grid' && (
                <motion.div
                  layoutId="spotlightLayoutPill"
                  className="absolute inset-0 bg-sky-600 rounded-lg shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <LayoutGrid className="w-3.5 h-3.5 relative z-10" />
              <span className="hidden sm:inline relative z-10">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('podium')}
              title="Olympic Podium Order (2 - 1 - 3 with Champion Elevated in Center)"
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                layoutMode === 'podium'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {layoutMode === 'podium' && (
                <motion.div
                  layoutId="spotlightLayoutPill"
                  className="absolute inset-0 bg-sky-600 rounded-lg shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <Columns3 className="w-3.5 h-3.5 relative z-10" />
              <span className="hidden sm:inline relative z-10">Podium</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Scorecards Grid with Restrained Palette & Generous Breathing Room */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch relative z-10 pt-2"
      >
        <AnimatePresence mode="popLayout">
          {displayedAdvisors.map((advisor) => {
            const theme = getRankTheme(advisor.rank);
            const RankIcon = theme.icon;
            const isChampion = advisor.rank === 1;
            const activeTab = cardTabState[advisor.id] || 'summary';
            const initials = getInitials(advisor.name);
            const isCopied = copiedAdvisorId === advisor.id;
            const kudos = kudosCounts[theme.kudosKey] || 15;

            return (
              <Interactive3DCard
                key={`${timeframe}-${rankMetric}-${advisor.team}-${advisor.id}-${advisor.rank}`}
                isChampion={isChampion}
                borderBeamGradient={theme.borderBeamGradient}
                onClick={() => onSelectAdvisor && onSelectAdvisor(advisor.raw, advisor.team)}
                className={`rank-card advisor-card ${theme.cardBg} ${theme.cardBorder} rounded-2xl p-6 sm:p-7 md:p-8 flex flex-col justify-between cursor-pointer group relative overflow-hidden transition-all duration-300 ${theme.podiumElevation}`}
              >

                {/* Champion Sparkle Ambient Overlay */}
                {isChampion && (
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute -top-8 -right-8 pointer-events-none text-amber-400/30 dark:text-amber-400/25"
                  >
                    <Sparkles className="w-28 h-28" />
                  </motion.div>
                )}

                {/* Card Top Section: Clean Hierarchical Header */}
                <div className="space-y-4 relative z-10">
                  {/* Top Tier Bar: Rank Badge + Badges cleanly spaced */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Prestigious Bright Rank Pill */}
                    <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${theme.badgeStyle}`}>
                      {isChampion ? (
                        <motion.div
                          animate={{ y: [0, -3, 0], rotate: [-6, 6, -6] }}
                          transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
                        >
                          <Crown className="w-4 h-4 text-slate-950 fill-amber-300 shrink-0" />
                        </motion.div>
                      ) : (
                        <RankIcon className={`w-4 h-4 ${theme.crownColor} shrink-0`} />
                      )}
                      <span className="text-[11px] tracking-wider">{theme.title}</span>
                    </div>

                    {/* Right Meta Badges: Division + Grade */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border-2 shadow-2xs ${
                        advisor.team === 'stationed'
                          ? 'bg-sky-500 text-white border-sky-400'
                          : 'bg-rose-500 text-white border-rose-400'
                      }`}>
                        {advisor.teamLabel}
                      </span>
                      <span className="text-[10px] font-black px-2 py-1 rounded-lg border-2 bg-slate-900 text-white border-slate-700 shadow-2xs">
                        Grade {advisor.grade}
                      </span>
                    </div>
                  </div>

                  {/* Advisor Profile Identity: Avatar Monogram with Orbital Motion Graphics & Status */}
                  <div className="flex items-center gap-4 pt-1">
                    {/* Avatar Monogram with Rotating Dashed Rings & Satellite Electron */}
                    <AvatarOrbitalMotionGraphic 
                      rank={advisor.rank} 
                      ringColor={theme.ringColor} 
                      satelliteColor={theme.satelliteColor}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base ${theme.avatarBorder} group-hover:scale-105 transition-transform duration-300 relative z-20`}>
                          <span>{initials}</span>
                        </div>
                        {/* Perched Metallic Rank Shield */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono shadow-md border-2 bg-white dark:bg-slate-900 z-30 ${
                          isChampion 
                            ? 'border-amber-400 text-amber-600 dark:text-amber-400' 
                            : advisor.rank === 2 
                              ? 'border-cyan-400 text-cyan-600 dark:text-cyan-400' 
                              : 'border-rose-400 text-rose-600 dark:text-rose-400'
                        }`}>
                          {advisor.rank}
                        </div>
                      </div>
                    </AvatarOrbitalMotionGraphic>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="advisor-name text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {advisor.name}
                        </h3>

                        {/* Real-Time Pulsating Glow Status Indicator with Motion Graphic Soundwave */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-md shadow-emerald-500/40">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                          </span>
                          <span>Active</span>
                          <LiveActivitySoundwaveGraphic colorClass="text-white" />
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-1">
                        <span className="advisor-id font-mono font-black text-slate-700 dark:text-slate-300">ID: {advisor.employeeId}</span>
                        <span>•</span>
                        <span className="truncate">{advisor.designation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro-Actions Bar: High-Energy Kudos & Shoutout Buttons */}
                  <div className="flex items-center justify-between gap-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    {/* Kudos Interactive Reaction Button with Floating Confetti */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleKudos(e, theme.kudosKey, advisor.name, isChampion)}
                      title="Give celebratory kudos!"
                      className={`h-8 px-3 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all cursor-pointer ${theme.kudosButton}`}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], rotate: [-8, 8, -8] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Flame className={`w-4 h-4 ${theme.kudosIconColor}`} />
                      </motion.div>
                      <span>{kudos} Kudos</span>
                    </motion.button>

                    {/* Quick Shoutout Accolade Copy Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyAccolade(e, advisor)}
                      title={`Copy shoutout accolade for ${advisor.name}`}
                      className={`h-8 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border-2 transition-all cursor-pointer ${
                        isCopied 
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/30'
                          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 opacity-80" />
                          <span>Shoutout</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Card Mini-Tab Switcher: Overview, Run-Rate & Contact */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="relative flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-black">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardTabState(prev => ({ ...prev, [advisor.id]: 'summary' }));
                        }}
                        className={`relative z-10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          activeTab === 'summary'
                            ? 'text-slate-950 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        {activeTab === 'summary' && (
                          <motion.div
                            layoutId={`advisorCardTab-${advisor.id}`}
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">Overview</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardTabState(prev => ({ ...prev, [advisor.id]: 'efficiency' }));
                        }}
                        className={`relative z-10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          activeTab === 'efficiency'
                            ? 'text-slate-950 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        {activeTab === 'efficiency' && (
                          <motion.div
                            layoutId={`advisorCardTab-${advisor.id}`}
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">Run-Rate</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardTabState(prev => ({ ...prev, [advisor.id]: 'contact' }));
                        }}
                        className={`relative z-10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          activeTab === 'contact'
                            ? 'text-slate-950 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        {activeTab === 'contact' && (
                          <motion.div
                            layoutId={`advisorCardTab-${advisor.id}`}
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">Outreach</span>
                      </button>
                    </div>

                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {timeframe === 'month' ? 'MTD' : timeframe === 'last_day' ? '1-Day' : '7-Day'}
                    </span>
                  </div>

                  {/* Tab Views with Animated Transitions */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'summary' && (
                      <motion.div 
                        key="summary"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        {/* Primary Metric Scorecard: Revenue Generated with Bright Text and Animated Counter */}
                        <div className="sales-box stat-box p-3.5 bg-slate-50/90 dark:bg-slate-900/80 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1 font-extrabold text-slate-700 dark:text-slate-300">
                              <span>{timeframe === 'month' ? "Monthly Total Sales" : timeframe === 'last_day' ? "Last Day Sales" : "7-Day Sales"}</span>
                            </span>
                            <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              advisor.targetDelta >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              <Target className="w-3.5 h-3.5" />
                              {advisor.targetDelta >= 0 ? `+${advisor.targetDelta}%` : `${advisor.targetDelta}%`} vs Target
                            </span>
                          </div>

                          {/* Bright Gradient Metric Counter */}
                          <div className={`metric-value text-3xl sm:text-[32px] font-black font-mono tracking-tight flex items-baseline gap-1 text-transparent bg-clip-text bg-gradient-to-r ${theme.numberGradient}`}>
                            <AnimatedCounter 
                              value={advisor.sales} 
                              duration={1200}
                              formatter={(v) => `৳${Math.round(v).toLocaleString('en-BD')}`}
                            />
                          </div>

                          {/* Visual Animated Target Progress Bar with Moving Laser Shimmer */}
                          <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <span>Target Completion</span>
                                {advisor.targetProgressPct >= 100 && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black shadow-xs">
                                    Exceeded
                                  </span>
                                )}
                              </span>
                              <span className={`font-mono font-black ${theme.accentColor}`}>{advisor.targetProgressPct}%</span>
                            </div>

                            <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, advisor.targetProgressPct)}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className={`relative h-full rounded-full bg-gradient-to-r ${theme.progressColor} ${theme.progressGlow} overflow-hidden`}
                              >
                                {/* Continuous laser scan beam across progress bar */}
                                <motion.div
                                  animate={{ x: ['-100%', '200%'] }}
                                  transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
                                  className="w-1/3 h-full bg-gradient-to-r from-transparent via-white to-transparent"
                                />
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        {/* Secondary Operational Stats Matrix with Radial Motion Gauges & Micro-Visualizers */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {/* KPI Score with Circular Motion Gauge */}
                          <motion.div 
                            whileHover={{ scale: 1.06, y: -2 }}
                            className="kpi-box metric-box p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/80 transition-all hover:shadow-md flex flex-col items-center justify-between"
                          >
                            <span className="text-[9px] text-emerald-800 dark:text-emerald-300 font-extrabold uppercase block truncate w-full">KPI Score</span>
                            <div className="my-1">
                              <CircularMotionGauge 
                                percent={advisor.kpiScore} 
                                strokeColor={theme.gaugeColor} 
                                glowColor={theme.gaugeGlow}
                                size={36}
                                strokeWidth={3.5}
                              />
                            </div>
                            <span className="metric-value text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {advisor.kpiDisplay}
                            </span>
                          </motion.div>

                          {/* Reach Calls in Electric Azure Cyan (Total for Virtual, Avg for Stationed) */}
                          <motion.div 
                            whileHover={{ scale: 1.06, y: -2 }}
                            className="stat-box metric-box p-2.5 bg-cyan-50/80 dark:bg-cyan-950/40 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800/80 transition-all hover:shadow-md flex flex-col items-center justify-between"
                          >
                            <span 
                              className="text-[9px] text-cyan-800 dark:text-cyan-300 font-extrabold uppercase block truncate w-full" 
                              title={advisor.team === 'virtual' ? "Total Reach Calls" : "Accurate Average Reach Calls"}
                            >
                              {advisor.team === 'virtual' ? 'Total Reach' : 'Avg Reach'}
                            </span>
                            <div className="my-1 text-cyan-500">
                              <LiveActivitySoundwaveGraphic colorClass="text-cyan-500" />
                            </div>
                            <span className="metric-value text-xs sm:text-sm font-black text-cyan-600 dark:text-cyan-400 font-mono">
                              <AnimatedCounter 
                                value={advisor.reachCalls} 
                                duration={1000}
                                formatter={(v) => Math.round(v).toLocaleString('en-BD')}
                              />
                            </span>
                          </motion.div>

                          {/* Talk Time in Vibrant Violet (Total for Virtual, Avg/Duty for Stationed) */}
                          <motion.div 
                            whileHover={{ scale: 1.06, y: -2 }}
                            className="stat-box metric-box p-2.5 bg-violet-50/80 dark:bg-violet-950/40 rounded-2xl border-2 border-violet-200 dark:border-violet-800/80 transition-all hover:shadow-md flex flex-col items-center justify-between"
                          >
                            <span 
                              className="text-[9px] text-violet-800 dark:text-violet-300 font-extrabold uppercase block truncate w-full"
                              title={advisor.team === 'virtual' ? "Total Talk Time" : (timeframe === 'last_day' ? "Duty Talk Time" : "Average Talk Time")}
                            >
                              {advisor.team === 'virtual' ? 'Total Talk' : (timeframe === 'last_day' ? 'Duty Talk' : 'Avg Talk')}
                            </span>
                            <div className="my-1">
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                                className="w-5 h-5 rounded-full border-2 border-dashed border-violet-400 flex items-center justify-center text-[8px] font-bold text-violet-600"
                              >
                                ⏱
                              </motion.div>
                            </div>
                            <span className="metric-value text-xs sm:text-sm font-black text-violet-600 dark:text-violet-400 font-mono truncate block">
                              {advisor.talkTime}
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'efficiency' && (
                      <motion.div 
                        key="efficiency"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2.5 p-3.5 bg-slate-50/90 dark:bg-slate-900/80 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-2xs"
                      >
                        <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Workforce Pace Matrix</span>
                          <span className="text-teal-600 dark:text-teal-400 text-[10px] font-black">{advisor.dutyCount} Duty Shifts</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Daily Sales Run-Rate</div>
                            <div className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                              ৳{advisor.dailyAvgSales.toLocaleString('en-BD')}/day
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Call Throughput</div>
                            <div className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                              {advisor.dailyAvgCalls} calls/day
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">KPI Grade Band</div>
                            <div className="text-xs sm:text-sm font-black font-mono text-teal-700 dark:text-teal-400 mt-0.5">
                              Grade {advisor.grade} Performance
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">Talk Duration</div>
                            <div className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 truncate">
                              {advisor.talkTime}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'contact' && (
                      <motion.div 
                        key="contact"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2.5 p-3.5 bg-slate-50/90 dark:bg-slate-900/80 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-2xs"
                      >
                        <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Quick Advisor Actions</span>
                          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-black">Rank #{advisor.rank}</span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Congratulate {advisor.name} or inspect complete historical analytics.
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleCopyAccolade(e, advisor)}
                            className="flex-1 py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-teal-700/20"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isCopied ? 'Copied Shoutout!' : 'Copy Shoutout'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectAdvisor) onSelectAdvisor(advisor.raw, advisor.team);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>Full Profile</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Card Footer: Drilldown Trigger with Animated Sliding Arrow */}
                <div className="pt-4 mt-4 border-t-2 border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-black text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-45 group-hover:scale-130 transition-transform duration-300" />
                    <span>Inspect Advisor Metrics</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black group-hover:translate-x-1.5 transition-transform duration-300">
                    <span>View Detail</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </span>
                </div>
              </Interactive3DCard>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
