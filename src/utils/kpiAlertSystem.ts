import { getNumericKpi } from './sheetParser';
import { getAdvisorTrendData, TrendKpiPoint } from '../components/AdvisorKpiSparkline';
import { StationedAdvisor, VirtualAdvisor } from '../types';

export const DEFAULT_KPI_ALERT_THRESHOLD = 70;
export const DEFAULT_CONSECUTIVE_UPDATES = 3;

export interface KpiAlertStatus {
  isTriggered: boolean;
  advisorId: string;
  advisorName: string;
  teamType: 'stationed' | 'virtual';
  currentKpi: number;
  threshold: number;
  consecutiveDrops: number;
  recentScores: number[];
  recentLabels: string[];
  recentDates: string[];
  severity: 'critical' | 'warning' | 'normal';
  alertMessage: string;
  recommendation: string;
  reason: 'consecutive_below_threshold' | 'consecutive_declines' | 'none';
}

/**
 * Retrieves the user-configured alert threshold from localStorage or defaults to 70%
 */
export function getStoredAlertThreshold(): number {
  try {
    const saved = localStorage.getItem('kaizen_kpi_alert_threshold');
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 40 && num <= 95) return num;
    }
  } catch {
    // ignore
  }
  return DEFAULT_KPI_ALERT_THRESHOLD;
}

/**
 * Saves the user-configured alert threshold into localStorage
 */
export function setStoredAlertThreshold(threshold: number): void {
  try {
    localStorage.setItem('kaizen_kpi_alert_threshold', String(threshold));
  } catch {
    // ignore
  }
}

/**
 * Evaluates whether an advisor's KPI trend has dropped below a given threshold for 3 consecutive updates.
 * Analyzes the 4-milestone weekly performance trajectory (W1, W2, W3, W4).
 */
export function evaluateAdvisorKpiAlert(
  advisorId: string,
  advisorName: string,
  rawKpi: any,
  teamType: 'stationed' | 'virtual',
  grade?: string,
  sales?: number,
  examMark?: any,
  threshold: number = getStoredAlertThreshold(),
  consecutiveRequired: number = DEFAULT_CONSECUTIVE_UPDATES
): KpiAlertStatus {
  const currentKpi = Math.max(0, Math.min(100, getNumericKpi(rawKpi)));
  const isExplicitPip = grade === 'PIP' || grade === 'D' || String(rawKpi).toUpperCase().includes('PIP');

  // Fetch deterministic weekly trend series (4 points: W1, W2, W3, W4)
  const trend = getAdvisorTrendData(advisorId, rawKpi, 'weekly', grade, sales, examMark);
  const points: TrendKpiPoint[] = trend.points;

  const scores = points.map((p) => p.score);
  const labels = points.map((p) => p.shortLabel);
  const dates = points.map((p) => p.specificDate || p.dateRange);

  // Check 1: Are the last 3 consecutive updates all below the threshold?
  // Window of 3 points: [W2, W3, W4] (indices 1, 2, 3) or [W1, W2, W3] (indices 0, 1, 2)
  const last3Scores = scores.slice(-consecutiveRequired); // Last 3 updates (W2, W3, W4)
  const allLast3BelowThreshold = last3Scores.length >= consecutiveRequired && last3Scores.every((s) => s < threshold);

  // Check 2: 3 consecutive declining updates that end up below threshold
  // e.g. W2 < W1 && W3 < W2 && W4 < threshold
  const isConsecutivelyDeclining =
    scores.length >= 4 &&
    scores[1] <= scores[0] &&
    scores[2] <= scores[1] &&
    scores[3] < threshold;

  // Check 3: Any 3 consecutive scores below threshold in the window
  let windowCountBelow = 0;
  let maxConsecutiveBelow = 0;
  for (const s of scores) {
    if (s < threshold) {
      windowCountBelow++;
      if (windowCountBelow > maxConsecutiveBelow) maxConsecutiveBelow = windowCountBelow;
    } else {
      windowCountBelow = 0;
    }
  }

  const isTriggered = allLast3BelowThreshold || isConsecutivelyDeclining || maxConsecutiveBelow >= consecutiveRequired || isExplicitPip;

  let reason: KpiAlertStatus['reason'] = 'none';
  let alertMessage = '';
  let recommendation = '';
  let severity: KpiAlertStatus['severity'] = 'normal';

  if (isTriggered) {
    severity = 'critical';
    if (allLast3BelowThreshold || maxConsecutiveBelow >= consecutiveRequired) {
      reason = 'consecutive_below_threshold';
      alertMessage = `KPI trend below ${threshold}% threshold for 3 consecutive updates (${last3Scores.map((s) => `${s}%`).join(' → ')})`;
      recommendation = `Immediate 1-on-1 coaching session & CE audit required for ${advisorName}.`;
    } else if (isConsecutivelyDeclining) {
      reason = 'consecutive_declines';
      alertMessage = `3 consecutive downward drops in KPI score below ${threshold}% (${scores.map((s) => `${s}%`).join(' → ')})`;
      recommendation = `Review call disposition logs and schedule refresher sales training.`;
    } else {
      reason = 'consecutive_below_threshold';
      alertMessage = `Critical performance alert: Under PIP status and below ${threshold}% benchmark.`;
      recommendation = `Assign structured daily calling goals and monitor duty adherence.`;
    }
  } else if (currentKpi < threshold + 5) {
    severity = 'warning';
    alertMessage = `Approaching alert threshold (${currentKpi}% vs ${threshold}% limit).`;
    recommendation = `Monitor upcoming weekly KPI update.`;
  }

  return {
    isTriggered,
    advisorId,
    advisorName,
    teamType,
    currentKpi,
    threshold,
    consecutiveDrops: maxConsecutiveBelow,
    recentScores: scores,
    recentLabels: labels,
    recentDates: dates,
    severity,
    alertMessage,
    recommendation,
    reason,
  };
}

/**
 * Returns a list of all Stationed and Virtual advisors who have triggered the 3-consecutive-drop KPI alert.
 */
export function getAllTriggeredAlerts(
  stationedAdvisors: StationedAdvisor[],
  virtualAdvisors: VirtualAdvisor[],
  threshold: number = getStoredAlertThreshold()
): KpiAlertStatus[] {
  const alerts: KpiAlertStatus[] = [];

  stationedAdvisors.forEach((advisor) => {
    const alert = evaluateAdvisorKpiAlert(
      advisor.id || advisor.advisorName,
      advisor.advisorName,
      advisor.totalKpiScore,
      'stationed',
      advisor.kpiGrade,
      advisor.finalSalesData,
      advisor.avgExamMark,
      threshold
    );
    if (alert.isTriggered) {
      alerts.push(alert);
    }
  });

  virtualAdvisors.forEach((advisor) => {
    const alert = evaluateAdvisorKpiAlert(
      advisor.id || advisor.advisorName,
      advisor.advisorName,
      advisor.overallKpi,
      'virtual',
      typeof advisor.overallKpi === 'string' ? advisor.overallKpi : undefined,
      advisor.finalSales,
      advisor.exam,
      threshold
    );
    if (alert.isTriggered) {
      alerts.push(alert);
    }
  });

  // Sort primarily by lowest current KPI
  return alerts.sort((a, b) => a.currentKpi - b.currentKpi);
}
