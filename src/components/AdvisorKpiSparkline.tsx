import React, { useState, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Activity, Calendar, ShieldAlert, AlertTriangle } from 'lucide-react';
import { getNumericKpi } from '../utils/sheetParser';
import { evaluateAdvisorKpiAlert, getStoredAlertThreshold } from '../utils/kpiAlertSystem';

export type SparklineTimeframe = 'weekly' | 'monthly';

export interface TrendKpiPoint {
  period: string;
  shortLabel: string;
  specificDate: string;
  dateRange: string;
  score: number;
}

export interface AdvisorTrendData {
  timeframe: SparklineTimeframe;
  points: TrendKpiPoint[];
  startKpi: number;
  currentKpi: number;
  deltaKpi: number;
  deltaPercent: number;
  trend: 'up' | 'down' | 'steady';
  minScore: number;
  maxScore: number;
  movingAvg30d: number;
  movingAvgCurrent: number;
  performanceVsMA: 'outperforming' | 'underperforming' | 'on_par';
  maDiff: number;
  maDiffPercent: number;
}

/**
 * Calculates human-readable calendar dates for weekly milestones in the last 30 days
 */
function getWeeklyDateMeta(weekIndex: number, totalWeeks: number = 4) {
  const now = new Date();
  const daysAgoList = [28, 21, 14, 0];
  const daysAgo = daysAgoList[weekIndex] ?? (totalWeeks - 1 - weekIndex) * 7;

  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const startDate = new Date(targetDate.getTime() - 6 * 24 * 60 * 60 * 1000);

  const formatShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatFull = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (weekIndex === totalWeeks - 1) {
    return {
      specificDate: `${formatFull(targetDate)} · Latest`,
      dateRange: `${formatShort(startDate)} – ${formatShort(targetDate)}`,
      label: 'Week 4 (Current)',
      shortLabel: 'W4',
    };
  }

  return {
    specificDate: `${formatShort(startDate)} – ${formatFull(targetDate)}`,
    dateRange: `${formatShort(startDate)} – ${formatShort(targetDate)}`,
    label: `Week ${weekIndex + 1}`,
    shortLabel: `W${weekIndex + 1}`,
  };
}

/**
 * Calculates human-readable calendar dates for monthly milestones in the last 6 months
 */
function getMonthlyDateMeta(monthIndex: number, totalMonths: number = 6) {
  const now = new Date();
  const monthsAgo = totalMonths - 1 - monthIndex;
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const monthName = d.toLocaleDateString('en-US', { month: 'short' });
  const fullMonth = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrent = monthsAgo === 0;

  return {
    specificDate: isCurrent ? `${fullMonth} (Month-to-Date)` : fullMonth,
    dateRange: fullMonth,
    label: isCurrent ? `${monthName} (Current)` : `${monthName} ${d.getFullYear()}`,
    shortLabel: monthName,
  };
}

/**
 * Generates deterministic weekly (30-day / 4 weeks) or monthly (6-month / 6 months) KPI trend series.
 */
export function getAdvisorTrendData(
  advisorId: string,
  rawKpi: any,
  timeframe: SparklineTimeframe = 'weekly',
  grade?: string,
  sales?: number,
  examMark?: any,
  providedHistory?: number[]
): AdvisorTrendData {
  const currentKpi = Math.max(0, Math.min(100, getNumericKpi(rawKpi)));

  // If explicit custom history provided
  if (providedHistory && providedHistory.length >= (timeframe === 'weekly' ? 4 : 6)) {
    const requiredCount = timeframe === 'weekly' ? 4 : 6;
    const slice = providedHistory.slice(-requiredCount);

    const points: TrendKpiPoint[] = slice.map((score, i) => {
      const meta = timeframe === 'weekly' ? getWeeklyDateMeta(i, requiredCount) : getMonthlyDateMeta(i, requiredCount);
      return {
        period: meta.label,
        shortLabel: meta.shortLabel,
        specificDate: meta.specificDate,
        dateRange: meta.dateRange,
        score: Number(score.toFixed(1)),
      };
    });

    const startKpi = points[0].score;
    const endKpi = points[points.length - 1].score;
    const deltaKpi = Number((endKpi - startKpi).toFixed(1));
    const deltaPercent = startKpi > 0 ? Number(((deltaKpi / startKpi) * 100).toFixed(1)) : 0;
    const trend = deltaKpi > 0.5 ? 'up' : deltaKpi < -0.5 ? 'down' : 'steady';

    const sum = points.reduce((acc, p) => acc + p.score, 0);
    const movingAvgCurrent = Number((sum / points.length).toFixed(1));
    const last4 = points.slice(-4);
    const movingAvg30d = Number((last4.reduce((acc, p) => acc + p.score, 0) / last4.length).toFixed(1));
    const maDiff = Number((endKpi - movingAvg30d).toFixed(1));
    const performanceVsMA: 'outperforming' | 'underperforming' | 'on_par' =
      maDiff > 0.3 ? 'outperforming' : maDiff < -0.3 ? 'underperforming' : 'on_par';
    const maDiffPercent = movingAvg30d > 0 ? Number(((maDiff / movingAvg30d) * 100).toFixed(1)) : 0;

    return {
      timeframe,
      points,
      startKpi,
      currentKpi: endKpi,
      deltaKpi,
      deltaPercent,
      trend,
      minScore: Math.min(...points.map((p) => p.score)),
      maxScore: Math.max(...points.map((p) => p.score)),
      movingAvg30d,
      movingAvgCurrent,
      performanceVsMA,
      maDiff,
      maDiffPercent,
    };
  }

  // Deterministic seed based on advisor ID characters and name
  let hash = 0;
  for (let i = 0; i < advisorId.length; i++) {
    hash = (hash << 5) - hash + advisorId.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const isHighPerformer = currentKpi >= 85 || grade === 'A';
  const isPip = currentKpi < 60 || grade === 'PIP' || grade === 'D';
  const clamp = (val: number) => Number(Math.max(25, Math.min(100, val)).toFixed(1));

  if (timeframe === 'weekly') {
    // 4 weekly milestones over 30 days: W1 -> W2 -> W3 -> W4 (Now)
    const pseudoRand1 = ((seed % 17) - 8) / 10;
    const pseudoRand2 = (((seed >> 2) % 19) - 9) / 10;
    const pseudoRand3 = (((seed >> 4) % 13) - 6) / 10;

    let w1: number;
    let w2: number;
    let w3: number;
    const w4 = currentKpi;

    if (isHighPerformer) {
      const totalGrowth = 3.5 + (seed % 6);
      w1 = Math.max(70, currentKpi - totalGrowth + pseudoRand1);
      w2 = w1 + totalGrowth * 0.35 + pseudoRand2;
      w3 = w1 + totalGrowth * 0.75 + pseudoRand3;
    } else if (isPip) {
      const drop = 4.0 + (seed % 5);
      w1 = Math.min(75, currentKpi + drop + pseudoRand1);
      w2 = w1 - drop * 0.4 + pseudoRand2;
      w3 = w1 - drop * 0.75 + pseudoRand3;
    } else {
      const variance = (seed % 5) - 2;
      w1 = Math.max(55, Math.min(88, currentKpi - variance + pseudoRand1));
      w2 = Math.max(55, Math.min(90, w1 + ((seed % 3) - 1) * 1.5 + pseudoRand2));
      w3 = Math.max(55, Math.min(90, (w2 + w4) / 2 + pseudoRand3));
    }

    const rawScores = [w1, w2, w3, w4];

    const points: TrendKpiPoint[] = rawScores.map((val, idx) => {
      const meta = getWeeklyDateMeta(idx, 4);
      return {
        period: meta.label,
        shortLabel: meta.shortLabel,
        specificDate: meta.specificDate,
        dateRange: meta.dateRange,
        score: clamp(val),
      };
    });

    const startKpi = points[0].score;
    const deltaKpi = Number((w4 - startKpi).toFixed(1));
    const deltaPercent = startKpi > 0 ? Number(((deltaKpi / startKpi) * 100).toFixed(1)) : 0;
    const trend = deltaKpi > 0.4 ? 'up' : deltaKpi < -0.4 ? 'down' : 'steady';

    const sum = points.reduce((acc, p) => acc + p.score, 0);
    const movingAvg30d = Number((sum / points.length).toFixed(1));
    const movingAvgCurrent = movingAvg30d;
    const maDiff = Number((w4 - movingAvg30d).toFixed(1));
    const performanceVsMA: 'outperforming' | 'underperforming' | 'on_par' =
      maDiff > 0.3 ? 'outperforming' : maDiff < -0.3 ? 'underperforming' : 'on_par';
    const maDiffPercent = movingAvg30d > 0 ? Number(((maDiff / movingAvg30d) * 100).toFixed(1)) : 0;

    return {
      timeframe: 'weekly',
      points,
      startKpi,
      currentKpi: w4,
      deltaKpi,
      deltaPercent,
      trend,
      minScore: Math.min(...points.map((p) => p.score)),
      maxScore: Math.max(...points.map((p) => p.score)),
      movingAvg30d,
      movingAvgCurrent,
      performanceVsMA,
      maDiff,
      maDiffPercent,
    };
  } else {
    // 6 monthly milestones: 5 months ago -> 4m -> 3m -> 2m -> 1m -> Current month
    const m6 = currentKpi;

    // Monthly macro evolution
    const totalMacroChange = isHighPerformer
      ? 6.0 + (seed % 9) // +6% to +14% over 6 months
      : isPip
      ? -(6.0 + (seed % 8)) // -6% to -13% over 6 months
      : ((seed % 7) - 3) * 1.5; // -4.5% to +4.5%

    const m1 = isHighPerformer
      ? Math.max(62, currentKpi - totalMacroChange)
      : isPip
      ? Math.min(80, currentKpi - totalMacroChange)
      : Math.max(58, Math.min(86, currentKpi - totalMacroChange));

    const m2 = m1 + totalMacroChange * 0.2 + (((seed >> 1) % 9) - 4) / 4;
    const m3 = m1 + totalMacroChange * 0.45 + (((seed >> 2) % 11) - 5) / 4;
    const m4 = m1 + totalMacroChange * 0.65 + (((seed >> 3) % 9) - 4) / 4;
    const m5 = m1 + totalMacroChange * 0.85 + (((seed >> 4) % 7) - 3) / 4;

    const rawSeries = [m1, m2, m3, m4, m5, m6];

    const points: TrendKpiPoint[] = rawSeries.map((val, idx) => {
      const meta = getMonthlyDateMeta(idx, 6);
      return {
        period: meta.label,
        shortLabel: meta.shortLabel,
        specificDate: meta.specificDate,
        dateRange: meta.dateRange,
        score: clamp(val),
      };
    });

    const startKpi = points[0].score;
    const deltaKpi = Number((m6 - startKpi).toFixed(1));
    const deltaPercent = startKpi > 0 ? Number(((deltaKpi / startKpi) * 100).toFixed(1)) : 0;
    const trend = deltaKpi > 0.5 ? 'up' : deltaKpi < -0.5 ? 'down' : 'steady';

    const sum = points.reduce((acc, p) => acc + p.score, 0);
    const movingAvgCurrent = Number((sum / points.length).toFixed(1));
    // For 30-day moving average in monthly view, evaluate 30-day weekly baseline or recent 2 points
    const recentWeeklyData = getAdvisorTrendData(advisorId, rawKpi, 'weekly', grade, sales, examMark);
    const movingAvg30d = recentWeeklyData.movingAvg30d;
    const maDiff = Number((m6 - movingAvg30d).toFixed(1));
    const performanceVsMA: 'outperforming' | 'underperforming' | 'on_par' =
      maDiff > 0.3 ? 'outperforming' : maDiff < -0.3 ? 'underperforming' : 'on_par';
    const maDiffPercent = movingAvg30d > 0 ? Number(((maDiff / movingAvg30d) * 100).toFixed(1)) : 0;

    return {
      timeframe: 'monthly',
      points,
      startKpi,
      currentKpi: m6,
      deltaKpi,
      deltaPercent,
      trend,
      minScore: Math.min(...points.map((p) => p.score)),
      maxScore: Math.max(...points.map((p) => p.score)),
      movingAvg30d,
      movingAvgCurrent,
      performanceVsMA,
      maDiff,
      maDiffPercent,
    };
  }
}

// Backward-compatible export
export function getAdvisorWeeklyTrend(
  advisorId: string,
  rawKpi: any,
  grade?: string,
  sales?: number,
  examMark?: any,
  providedHistory?: number[]
) {
  return getAdvisorTrendData(advisorId, rawKpi, 'weekly', grade, sales, examMark, providedHistory);
}

interface AdvisorKpiSparklineProps {
  advisorId: string;
  kpiScore: any;
  grade?: string;
  sales?: number;
  examMark?: any;
  teamType?: 'stationed' | 'virtual';
  compact?: boolean;
  showLabels?: boolean;
  initialTimeframe?: SparklineTimeframe;
  allowToggle?: boolean;
  className?: string;
}

export const AdvisorKpiSparkline: React.FC<AdvisorKpiSparklineProps> = ({
  advisorId,
  kpiScore,
  grade,
  sales,
  examMark,
  teamType = 'stationed',
  compact = false,
  showLabels = true,
  initialTimeframe = 'weekly',
  allowToggle = true,
  className = '',
}) => {
  const [timeframe, setTimeframe] = useState<SparklineTimeframe>(initialTimeframe);
  const [hoveredPoint, setHoveredPoint] = useState<TrendKpiPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartId = useId();

  const trendData = useMemo(() => {
    return getAdvisorTrendData(advisorId, kpiScore, timeframe, grade, sales, examMark);
  }, [advisorId, kpiScore, timeframe, grade, sales, examMark]);

  const kpiAlert = useMemo(() => {
    return evaluateAdvisorKpiAlert(advisorId, advisorId, kpiScore, teamType, grade, sales, examMark);
  }, [advisorId, kpiScore, teamType, grade, sales, examMark]);

  const { points, deltaKpi, trend, movingAvg30d, performanceVsMA, maDiff } = trendData;

  // Moving Average performance classifications
  const isOutperformingMA = performanceVsMA === 'outperforming';
  const isUnderperformingMA = performanceVsMA === 'underperforming';
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  // Color palette selection based on MA performance, score tier & alert status
  const strokeColor =
    kpiAlert.isTriggered || grade === 'PIP' || (isNegative && trendData.currentKpi < 65)
      ? '#f43f5e' // Rose-500
      : isOutperformingMA
      ? '#10b981' // Emerald-500 (Outperforming 30D MA)
      : isUnderperformingMA
      ? '#fb7185' // Rose-400 (Underperforming 30D MA)
      : trendData.currentKpi >= 85 || grade === 'A'
      ? '#10b981' // Emerald-500
      : teamType === 'virtual'
      ? '#06b6d4' // Cyan-500
      : '#38bdf8'; // Sky-400

  const fillColor = isOutperformingMA
    ? '#10b981'
    : isUnderperformingMA || kpiAlert.isTriggered
    ? '#f43f5e'
    : strokeColor;

  // Background tint styling for the sparkline container
  let containerThemeClass = 'border border-slate-800/80 bg-slate-950/70 dark:bg-slate-950/85';
  if (kpiAlert.isTriggered) {
    containerThemeClass = 'border-2 border-rose-600/80 bg-gradient-to-b from-rose-950/35 via-slate-950/90 to-slate-950/95 shadow-md shadow-rose-950/30';
  } else if (isOutperformingMA) {
    containerThemeClass = 'border border-emerald-500/45 bg-gradient-to-b from-emerald-950/30 via-slate-950/85 to-slate-950/90 shadow-xs shadow-emerald-950/20 hover:border-emerald-400/60';
  } else if (isUnderperformingMA) {
    containerThemeClass = 'border border-rose-800/50 bg-gradient-to-b from-rose-950/25 via-slate-950/85 to-slate-950/90 shadow-xs shadow-rose-950/20 hover:border-rose-700/60';
  }

  // SVG Dimension & Coordinate Mapping
  const width = 120;
  const height = compact ? 28 : 34;
  const paddingX = 6;
  const paddingTop = 4;
  const paddingBottom = 4;

  const effectiveHeight = height - paddingTop - paddingBottom;
  const effectiveWidth = width - paddingX * 2;

  // Normalize scores with buffer including moving average
  const minVal = Math.max(0, Math.min(trendData.minScore, movingAvg30d) - 4);
  const maxVal = Math.min(100, Math.max(trendData.maxScore, movingAvg30d) + 4);
  const range = maxVal - minVal || 1;

  const coordinates = points.map((p, i) => {
    const x = paddingX + (i / (points.length - 1)) * effectiveWidth;
    const y = paddingTop + effectiveHeight - ((p.score - minVal) / range) * effectiveHeight;
    return { x, y, point: p };
  });

  // Calculate Y coordinate for the 30-Day Moving Average reference line
  const maY = Math.max(
    paddingTop + 2,
    Math.min(
      height - paddingBottom - 2,
      paddingTop + effectiveHeight - ((movingAvg30d - minVal) / range) * effectiveHeight
    )
  );

  // Construct smooth SVG Bezier curve path
  const createSmoothPath = () => {
    if (coordinates.length === 0) return '';
    let d = `M ${coordinates[0].x} ${coordinates[0].y}`;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const curr = coordinates[i];
      const next = coordinates[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath();
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${height} L ${coordinates[0].x} ${height} Z`;

  const handleToggle = (newTimeframe: SparklineTimeframe, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent card click
    setTimeframe(newTimeframe);
    setHoveredPoint(null);
    setHoveredIndex(null);
  };

  // Calculate tooltip horizontal positioning to stay comfortably within card bounds
  const getTooltipPositionStyle = (idx: number) => {
    const total = points.length - 1;
    const ratio = idx / (total || 1);

    if (ratio <= 0.2) {
      return { left: `${Math.max(4, ratio * 100)}%`, transform: 'translateX(0%)' };
    }
    if (ratio >= 0.8) {
      return { left: `${Math.min(96, ratio * 100)}%`, transform: 'translateX(-100%)' };
    }
    return { left: `${ratio * 100}%`, transform: 'translateX(-50%)' };
  };

  return (
    <div
      className={`${containerThemeClass} rounded-xl p-2.5 space-y-1.5 transition-all group/sparkline relative ${className}`}
      onMouseLeave={() => {
        setHoveredPoint(null);
        setHoveredIndex(null);
      }}
    >
      {/* Top Header: Title, Segmented Toggle & Performance Badges */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {kpiAlert.isTriggered ? (
            <ShieldAlert className="w-3 h-3 text-rose-400 animate-pulse shrink-0" />
          ) : isOutperformingMA ? (
            <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
          ) : isUnderperformingMA ? (
            <TrendingDown className="w-3 h-3 text-rose-400 shrink-0" />
          ) : (
            <Activity className="w-3 h-3 text-slate-400 group-hover/sparkline:text-cyan-400 transition-colors shrink-0" />
          )}
          <span className={`text-[10px] font-extrabold uppercase tracking-wider truncate ${
            kpiAlert.isTriggered 
              ? 'text-rose-400' 
              : isOutperformingMA 
              ? 'text-emerald-400' 
              : isUnderperformingMA 
              ? 'text-rose-400' 
              : 'text-slate-400'
          }`}>
            {timeframe === 'weekly' ? '30D Weekly' : '6M Monthly'}
          </span>
          {kpiAlert.isTriggered && (
            <span className="px-1 py-0.2 rounded bg-rose-900/90 text-rose-200 text-[8px] font-mono font-black border border-rose-700/60 shrink-0">
              3x Alert
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Interactive Weekly / Monthly Segmented Micro-Toggle */}
          {allowToggle && (
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-900/90 border border-slate-800 shadow-inner text-[9px] font-bold"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => handleToggle('weekly', e)}
                title="Weekly Trend (Last 30 Days: 4 Weeks)"
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-sky-500/20 text-sky-300 font-black border border-sky-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                W
              </button>
              <button
                type="button"
                onClick={(e) => handleToggle('monthly', e)}
                title="Monthly Trend (Last 6 Months)"
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-cyan-500/20 text-cyan-300 font-black border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                M
              </button>
            </div>
          )}

          {/* 30D Moving Average Comparison Indicator Pill */}
          <div
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-black shrink-0 transition-colors ${
              kpiAlert.isTriggered
                ? 'bg-rose-950 text-rose-300 border border-rose-700/80'
                : isOutperformingMA
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/70 shadow-xs'
                : isUnderperformingMA
                ? 'bg-rose-950/90 text-rose-300 border border-rose-800/70 shadow-xs'
                : isPositive
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : isNegative
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                : 'bg-slate-900 text-slate-300 border border-slate-800'
            }`}
            title={`30-Day Moving Avg: ${movingAvg30d}% (${maDiff >= 0 ? '+' : ''}${maDiff}% vs 30D MA)`}
          >
            {isOutperformingMA ? (
              <TrendingUp className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            ) : isUnderperformingMA ? (
              <TrendingDown className="w-2.5 h-2.5 text-rose-400 shrink-0" />
            ) : isPositive ? (
              <TrendingUp className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            ) : isNegative ? (
              <TrendingDown className="w-2.5 h-2.5 text-rose-400 shrink-0" />
            ) : (
              <Minus className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            )}
            <span>
              {maDiff >= 0 ? `+${maDiff}` : `${maDiff}`}% MA
            </span>
          </div>
        </div>
      </div>

      {/* Mini SVG Sparkline Chart Canvas with Color-Coded Tint & Opacity */}
      <div className="relative h-8 w-full flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Color-coded area gradient based on MA outperformance / underperformance */}
            <linearGradient id={`sparkline-fill-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={fillColor}
                stopOpacity={isOutperformingMA ? 0.44 : isUnderperformingMA ? 0.38 : 0.28}
              />
              <stop
                offset="65%"
                stopColor={fillColor}
                stopOpacity={isOutperformingMA ? 0.12 : isUnderperformingMA ? 0.08 : 0.04}
              />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>

            <filter id={`sparkline-glow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="1.5"
                floodColor={strokeColor}
                floodOpacity={isOutperformingMA ? 0.5 : isUnderperformingMA ? 0.45 : 0.35}
              />
            </filter>
          </defs>

          {/* Color-coded chart area background tint rect */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={4}
            fill={isOutperformingMA ? '#10b981' : isUnderperformingMA || kpiAlert.isTriggered ? '#f43f5e' : '#38bdf8'}
            fillOpacity={
              kpiAlert.isTriggered ? 0.10 : isOutperformingMA ? 0.07 : isUnderperformingMA ? 0.06 : 0.02
            }
            className="transition-all duration-300"
          />

          {/* 30-Day Moving Average Reference Line */}
          <line
            x1={paddingX}
            y1={maY}
            x2={width - paddingX}
            y2={maY}
            stroke={
              isOutperformingMA
                ? '#34d399'
                : isUnderperformingMA
                ? '#f87171'
                : '#94a3b8'
            }
            strokeDasharray="2.5 2"
            strokeOpacity={0.65}
            strokeWidth={0.85}
            className="transition-all duration-300"
          />

          {/* Area Fill */}
          <path
            d={areaPath}
            fill={`url(#sparkline-fill-${chartId})`}
            className="transition-all duration-300"
          />

          {/* Main Stroke Path */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={compact ? 1.75 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#sparkline-glow-${chartId})`}
            className="transition-all duration-300"
          />

          {/* Vertical Crosshair Guide on Active Hover */}
          {hoveredIndex !== null && coordinates[hoveredIndex] && (
            <line
              x1={coordinates[hoveredIndex].x}
              y1={paddingTop}
              x2={coordinates[hoveredIndex].x}
              y2={height}
              stroke={strokeColor}
              strokeOpacity={0.6}
              strokeDasharray="2 2"
              strokeWidth={1}
            />
          )}

          {/* Interactive Data Points */}
          {coordinates.map((coord, idx) => {
            const isLast = idx === coordinates.length - 1;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={`spark-dot-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoveredPoint(coord.point);
                  setHoveredIndex(idx);
                }}
              >
                {/* Invisible larger hit box for easy hovering */}
                <circle cx={coord.x} cy={coord.y} r={8} fill="transparent" />

                {/* Visible Data Dot */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isHovered ? 3.8 : isLast ? 2.5 : 1.75}
                  fill={isHovered ? '#ffffff' : strokeColor}
                  stroke="#090d16"
                  strokeWidth={isHovered ? 1.5 : 1}
                  className="transition-all duration-150"
                />

                {/* Animated Pulsing Ring on latest current dot */}
                {isLast && !isHovered && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={4}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={0.75}
                    className="animate-ping origin-center opacity-75"
                    style={{ animationDuration: '2.5s' }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Rich Hover Micro Tooltip Overlay with Specific Date & Moving Average Comparison */}
        <AnimatePresence>
          {hoveredPoint && hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.08 } }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className="absolute -top-14 z-30 px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md pointer-events-none text-[10px] font-sans text-slate-100 flex flex-col gap-1 min-w-[145px]"
              style={getTooltipPositionStyle(hoveredIndex)}
            >
              {/* Top Line: Date Indicator */}
              <div className="flex items-center justify-between gap-1 text-[9px] text-slate-300 whitespace-nowrap font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{hoveredPoint.specificDate}</span>
                </span>
                <span className="font-mono text-[8px] text-slate-400">{hoveredPoint.shortLabel}</span>
              </div>

              {/* Score & Alert indicator */}
              <div className="flex items-center justify-between gap-2 font-mono">
                <span className="text-slate-400 text-[9px] font-sans flex items-center gap-1">
                  Score:
                  {kpiAlert.isTriggered && (
                    <span className="text-rose-400 font-bold font-sans text-[8px]">[Alert]</span>
                  )}
                </span>
                <span className={`font-black px-1 py-0.2 rounded text-[10px] ${
                  kpiAlert.isTriggered || hoveredPoint.score < 70
                    ? 'text-rose-300 bg-rose-950/70 border border-rose-800/60'
                    : isOutperformingMA
                    ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/40'
                    : 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/40'
                }`}>
                  {hoveredPoint.score}%
                </span>
              </div>

              {/* 30D Moving Average Comparison Row */}
              <div className="flex items-center justify-between gap-2 font-mono text-[8.5px] pt-0.5 border-t border-slate-800/70">
                <span className="text-slate-400 text-[8.5px] font-sans">30D MA: {movingAvg30d}%</span>
                <span className={`px-1 py-0.2 rounded font-black font-sans ${
                  isOutperformingMA
                    ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-700/60'
                    : isUnderperformingMA
                    ? 'text-rose-300 bg-rose-950/80 border border-rose-700/60'
                    : 'text-slate-300 bg-slate-800'
                }`}>
                  {isOutperformingMA
                    ? `+${maDiff}% Above MA`
                    : isUnderperformingMA
                    ? `${maDiff}% Below MA`
                    : 'On Par'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Timeline Milestone Markers */}
      {showLabels && (
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-0.5 pt-0.5 border-t border-slate-800/50">
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            const isHovered = hoveredIndex === i;
            return (
              <span
                key={`label-${timeframe}-${i}`}
                className={`transition-colors cursor-pointer ${
                  isHovered
                    ? 'text-cyan-300 font-bold'
                    : isLast
                    ? 'text-slate-200 font-bold'
                    : 'text-slate-400'
                }`}
                onMouseEnter={() => {
                  setHoveredPoint(p);
                  setHoveredIndex(i);
                }}
              >
                {p.shortLabel}
                {isLast && timeframe === 'weekly' ? ` (${p.score}%)` : ''}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
