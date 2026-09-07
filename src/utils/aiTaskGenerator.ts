import { StationedAdvisor, VirtualAdvisor, TaskItem, TeamType } from '../types';
import { getNumericKpi, formatKpiDisplay } from './sheetParser';
import { evaluateAdvisorKpiAlert } from './kpiAlertSystem';

export interface GeneratedFollowUpTask extends TaskItem {
  underperformanceReason: string;
  metricTrigger: string;
  recommendedFocus: string;
  suggestedAction: string;
  advisorMetricsSummary: {
    kpi: string;
    exam: string;
    reach: number;
    sales: number;
    grade?: string;
  };
  selected?: boolean;
}

export interface UnderperformingAdvisorDiagnostic {
  id: string;
  advisorName: string;
  team: TeamType;
  employeeId?: string;
  kpiScore: number;
  kpiDisplay: string;
  grade?: string;
  examScore: number;
  reachCalls: number;
  sales: number;
  is3xAlert: boolean;
  triggers: string[];
  severity: 'urgent' | 'high' | 'medium';
  primaryIssue: string;
  suggestedTasks: GeneratedFollowUpTask[];
}

/**
 * Calculates due date offset (in days from today) formatted as YYYY-MM-DD
 */
function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

/**
 * Client-side intelligent rule engine that parses all stationed & virtual advisors
 * to identify underperformance patterns and generate targeted follow-up tasks.
 */
export function generateAutoTasksFromPerformanceData(
  stationedAdvisors: StationedAdvisor[],
  virtualAdvisors: VirtualAdvisor[],
  existingTasks: TaskItem[] = []
): {
  diagnostics: UnderperformingAdvisorDiagnostic[];
  generatedTasks: GeneratedFollowUpTask[];
  summary: {
    totalUnderperforming: number;
    stationedUnderperforming: number;
    virtualUnderperforming: number;
    urgentCount: number;
    highCount: number;
    mediumCount: number;
  };
} {
  const diagnostics: UnderperformingAdvisorDiagnostic[] = [];
  const allTasks: GeneratedFollowUpTask[] = [];

  const existingTaskTitles = new Set(
    existingTasks.map((t) => `${t.assignedAdvisorId}_${t.category}_${t.title.toLowerCase()}`)
  );

  // 1. Process Stationed Advisors
  stationedAdvisors.forEach((advisor) => {
    const kpiScore = getNumericKpi(advisor.totalKpiScore);
    const examScore = advisor.avgExamMark ?? 0;
    const briefingScore = advisor.avgBriefingMark ?? 0;
    const reach = advisor.avgReach ?? 0;
    const sales = advisor.finalSalesData ?? 0;
    const ce = advisor.ceCount ?? 0;
    const grade = (advisor.kpiGrade || '').toUpperCase();
    const alertStatus = evaluateAdvisorKpiAlert(
      advisor.id || advisor.advisorName,
      advisor.advisorName,
      advisor.totalKpiScore,
      'stationed',
      advisor.kpiGrade,
      advisor.finalSalesData,
      advisor.avgExamMark
    );

    const triggers: string[] = [];
    const advisorTasks: GeneratedFollowUpTask[] = [];

    // Trigger checks
    if (grade === 'PIP' || grade === 'D' || kpiScore < 70) {
      triggers.push(`Critical KPI deficit (${formatKpiDisplay(advisor.totalKpiScore)}, Grade ${grade || 'Low'})`);
    } else if (kpiScore < 80) {
      triggers.push(`Sub-target overall KPI (${formatKpiDisplay(advisor.totalKpiScore)})`);
    }

    if (alertStatus.isTriggered) {
      triggers.push('3x Consecutive KPI Drop Alert triggered');
    }

    if (examScore < 70) {
      triggers.push(`Low exam mark (${examScore}% vs 80% benchmark)`);
    }

    if (briefingScore < 75) {
      triggers.push(`Low briefing participation mark (${briefingScore}%)`);
    }

    if (reach < 35) {
      triggers.push(`Low average reach call volume (${reach} calls/day)`);
    }

    if (ce === 0) {
      triggers.push('Zero CE customer experience audits recorded');
    }

    // Only diagnose if at least one trigger condition met
    if (triggers.length > 0) {
      const isUrgent = grade === 'PIP' || alertStatus.isTriggered || kpiScore < 65;
      const isHigh = !isUrgent && (kpiScore < 75 || examScore < 65 || reach < 30);
      const severity: 'urgent' | 'high' | 'medium' = isUrgent ? 'urgent' : isHigh ? 'high' : 'medium';

      // Generate Tasks for this advisor based on specific gaps:
      if (examScore < 75 || grade === 'PIP') {
        const taskId = `auto-task-st-exam-${advisor.id}-${Date.now()}`;
        advisorTasks.push({
          id: taskId,
          title: `Exam Calibration: Product Knowledge Drill for ${advisor.advisorName}`,
          description: `Score recorded: ${examScore}%. Conduct 1-on-1 syllabus review, test on pricing tiers & objection handling script. Re-test target: 85%+.`,
          team: 'stationed',
          assignedAdvisorId: advisor.id,
          assignedAdvisorName: advisor.advisorName,
          priority: examScore < 60 ? 'urgent' : 'high',
          status: 'todo',
          category: 'Exam Preparation',
          dueDate: getFutureDate(2),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: `Exam score is ${examScore}% (below 80% passing target)`,
          metricTrigger: 'Exam Mark',
          recommendedFocus: 'Product Curriculum & Objection FAQs',
          suggestedAction: 'Schedule 30-min quiz & script calibration session',
          advisorMetricsSummary: {
            kpi: formatKpiDisplay(advisor.totalKpiScore),
            exam: `${examScore}%`,
            reach,
            sales,
            grade: advisor.kpiGrade,
          },
          selected: true,
        });
      }

      if (reach < 40) {
        const taskId = `auto-task-st-reach-${advisor.id}-${Date.now()}`;
        advisorTasks.push({
          id: taskId,
          title: `Reach Surge: Increase Daily Outbound Connects (${advisor.advisorName})`,
          description: `Current reach is ${reach} calls/day (target: 50+). Audit talktime vs idle time, eliminate micro-breaks, and set 15-call hourly blitz milestones.`,
          team: 'stationed',
          assignedAdvisorId: advisor.id,
          assignedAdvisorName: advisor.advisorName,
          priority: reach < 30 ? 'urgent' : 'high',
          status: 'todo',
          category: 'Calling Push',
          dueDate: getFutureDate(3),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: `Daily reach call volume is ${reach} (below team benchmark of 45+)`,
          metricTrigger: 'Reach Volume',
          recommendedFocus: 'Dialer Velocity & Idle Time Reduction',
          suggestedAction: 'Implement hourly call pacing targets during peak 11am-5pm shifts',
          advisorMetricsSummary: {
            kpi: formatKpiDisplay(advisor.totalKpiScore),
            exam: `${examScore}%`,
            reach,
            sales,
            grade: advisor.kpiGrade,
          },
          selected: true,
        });
      }

      if (alertStatus.isTriggered || grade === 'PIP' || kpiScore < 68) {
        const taskId = `auto-task-st-pip-${advisor.id}-${Date.now()}`;
        advisorTasks.push({
          id: taskId,
          title: `PIP / Trend Reversal 1-on-1 Performance Review (${advisor.advisorName})`,
          description: `Advisor flagged for 3 consecutive KPI drops / sub-70% performance (${formatKpiDisplay(advisor.totalKpiScore)}). Complete weekly PIP milestone review and assign daily buddy shadowing.`,
          team: 'stationed',
          assignedAdvisorId: advisor.id,
          assignedAdvisorName: advisor.advisorName,
          priority: 'urgent',
          status: 'todo',
          category: 'Training',
          dueDate: getFutureDate(1),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: alertStatus.isTriggered
            ? '3 consecutive KPI updates below threshold'
            : `Overall KPI score in critical PIP range (${formatKpiDisplay(advisor.totalKpiScore)})`,
          metricTrigger: 'Overall KPI / PIP',
          recommendedFocus: 'Comprehensive Performance Turnaround',
          suggestedAction: 'Formal 1-on-1 review with Team Leader Billal; daily activity sign-off',
          advisorMetricsSummary: {
            kpi: formatKpiDisplay(advisor.totalKpiScore),
            exam: `${examScore}%`,
            reach,
            sales,
            grade: advisor.kpiGrade,
          },
          selected: true,
        });
      } else if (briefingScore < 75) {
        const taskId = `auto-task-st-briefing-${advisor.id}-${Date.now()}`;
        advisorTasks.push({
          id: taskId,
          title: `Briefing Alignment & Pitch Refresh (${advisor.advisorName})`,
          description: `Briefing score at ${briefingScore}%. Review campaign notes, discount tiers, and verify active note-taking during morning syncs.`,
          team: 'stationed',
          assignedAdvisorId: advisor.id,
          assignedAdvisorName: advisor.advisorName,
          priority: 'medium',
          status: 'todo',
          category: 'Briefing',
          dueDate: getFutureDate(3),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: `Briefing mark is ${briefingScore}% (below 80% standard)`,
          metricTrigger: 'Briefing Score',
          recommendedFocus: 'Daily Campaign Memorization & Q&A',
          suggestedAction: 'Active participation in daily Kaizen briefing Q&A',
          advisorMetricsSummary: {
            kpi: formatKpiDisplay(advisor.totalKpiScore),
            exam: `${examScore}%`,
            reach,
            sales,
            grade: advisor.kpiGrade,
          },
          selected: true,
        });
      }

      // Filter out duplicate titles if already assigned recently
      const uniqueAdvisorTasks = advisorTasks.filter(
        (t) => !existingTaskTitles.has(`${t.assignedAdvisorId}_${t.category}_${t.title.toLowerCase()}`)
      );

      diagnostics.push({
        id: advisor.id,
        advisorName: advisor.advisorName,
        team: 'stationed',
        employeeId: advisor.employeeId,
        kpiScore,
        kpiDisplay: formatKpiDisplay(advisor.totalKpiScore),
        grade: advisor.kpiGrade,
        examScore,
        reachCalls: reach,
        sales,
        is3xAlert: alertStatus.isTriggered,
        triggers,
        severity,
        primaryIssue: triggers[0] || 'Operational alignment needed',
        suggestedTasks: uniqueAdvisorTasks.length > 0 ? uniqueAdvisorTasks : advisorTasks,
      });

      (uniqueAdvisorTasks.length > 0 ? uniqueAdvisorTasks : advisorTasks).forEach((t) => allTasks.push(t));
    }
  });

  // 2. Process Virtual Advisors
  virtualAdvisors.forEach((advisor) => {
    const kpiScore = getNumericKpi(advisor.overallKpi);
    const examScore = getNumericKpi(advisor.exam);
    const reach = advisor.reachCall ?? 0;
    const sales = advisor.finalSales ?? 0;
    const ce = advisor.ceCount ?? 0;
    const isPip = String(advisor.overallKpi).toUpperCase().includes('PIP');
    const alertStatus = evaluateAdvisorKpiAlert(
      advisor.id || advisor.advisorName,
      advisor.advisorName,
      advisor.overallKpi,
      'virtual',
      undefined,
      advisor.finalSales,
      advisor.exam
    );

    const triggers: string[] = [];
    const advisorTasks: GeneratedFollowUpTask[] = [];

    if (isPip || kpiScore < 70) {
      triggers.push(`Critical Virtual KPI deficiency (${formatKpiDisplay(advisor.overallKpi)})`);
    } else if (kpiScore < 80) {
      triggers.push(`Sub-target overall KPI (${formatKpiDisplay(advisor.overallKpi)})`);
    }

    if (alertStatus.isTriggered) {
      triggers.push('3x Consecutive KPI Drop Alert triggered');
    }

    if (examScore < 70) {
      triggers.push(`Low exam evaluation (${examScore}%)`);
    }

    if (reach < 30) {
      triggers.push(`Low virtual reach volume (${reach} calls/day)`);
    }

    if (sales < 20000 && reach > 25) {
      triggers.push(`Low sales conversion rate (৳${sales.toLocaleString()} achieved)`);
    }

    if (triggers.length > 0) {
      const isUrgent = isPip || alertStatus.isTriggered || kpiScore < 65;
      const isHigh = !isUrgent && (kpiScore < 75 || examScore < 65 || reach < 25);
      const severity: 'urgent' | 'high' | 'medium' = isUrgent ? 'urgent' : isHigh ? 'high' : 'medium';

      if (examScore < 75 || isPip) {
        const taskId = `auto-task-vt-exam-${advisor.id}-${Date.now()}`;
        advisorTasks.push({
          id: taskId,
          title: `Virtual Exam & Pitch Retraining (${advisor.advisorName})`,
          description: `Exam mark recorded at ${examScore}%. Share updated objection handbook, conduct recorded mock pitch drill, and verify remote telephony setup.`,
          team: 'virtual',
          assignedAdvisorId: advisor.id,
          assignedAdvisorName: advisor.advisorName,
          priority: examScore < 60 ? 'urgent' : 'high',
          status: 'todo',
          category: 'Exam Preparation',
          dueDate: getFutureDate(2),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: `Exam score is ${examScore}% (below 75% virtual benchmark)`,
          metricTrigger: 'Exam Score',
          recommendedFocus: 'Call Scripting & Product Mastery',
          suggestedAction: 'Host Zoom mock pitch drill and re-issue exam',
          advisorMetricsSummary: {
            kpi: formatKpiDisplay(advisor.overallKpi),
            exam: `${examScore}%`,
            reach,
            sales,
            grade: isPip ? 'PIP' : undefined,
          },
          selected: true,
        });
      }

      if (reach < 35) {
        const taskId = `auto-task-vt-reach-${advisor.id}-${Date.now()}`;
        advisorTasks.push({
          id: taskId,
          title: `Virtual Dialing Pace & DISPO Logging Push (${advisor.advisorName})`,
          description: `Daily reach at ${reach} calls. Enforce minimum 40 daily dials, monitor DISPO logging accuracy, and reduce after-call wrap-up times.`,
          team: 'virtual',
          assignedAdvisorId: advisor.id,
          assignedAdvisorName: advisor.advisorName,
          priority: reach < 25 ? 'urgent' : 'high',
          status: 'todo',
          category: 'Calling Push',
          dueDate: getFutureDate(3),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: `Reach call volume is ${reach} (virtual benchmark: 40+)`,
          metricTrigger: 'Dialing Volume',
          recommendedFocus: 'Dialer Utilization & Wrap-up Speed',
          suggestedAction: 'Set two daily check-ins for dial milestones (2pm & 6pm)',
          advisorMetricsSummary: {
            kpi: formatKpiDisplay(advisor.overallKpi),
            exam: `${examScore}%`,
            reach,
            sales,
            grade: isPip ? 'PIP' : undefined,
          },
          selected: true,
        });
      }

      if (sales < 20000 && reach >= 25) {
        const taskId = `auto-task-vt-sales-${advisor.id}-${Date.now()}`;
        advisorTasks.push({
          id: taskId,
          title: `Sales Conversion Audit & Closing Coaching (${advisor.advisorName})`,
          description: `Advisor has volume (${reach} calls) but lower sales (৳${sales.toLocaleString()}). Audit last 5 call recordings with QA team to identify closing drop-offs.`,
          team: 'virtual',
          assignedAdvisorId: advisor.id,
          assignedAdvisorName: advisor.advisorName,
          priority: 'high',
          status: 'todo',
          category: 'Sales Closing',
          dueDate: getFutureDate(4),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: `Sales of ৳${sales.toLocaleString()} with active calling volume`,
          metricTrigger: 'Conversion Rate',
          recommendedFocus: 'Urgency Building & Payment Link Closing',
          suggestedAction: 'Listen to 3 recorded calls; guide through live payment step',
          advisorMetricsSummary: {
            kpi: formatKpiDisplay(advisor.overallKpi),
            exam: `${examScore}%`,
            reach,
            sales,
            grade: isPip ? 'PIP' : undefined,
          },
          selected: true,
        });
      }

      if (alertStatus.isTriggered || isPip || kpiScore < 68) {
        const taskId = `auto-task-vt-pip-${advisor.id}-${Date.now()}`;
        advisorTasks.push({
          id: taskId,
          title: `Virtual Advisor PIP Intervention & Daily Check-In (${advisor.advisorName})`,
          description: `Virtual advisor flagged under 3x alert / PIP status (${formatKpiDisplay(advisor.overallKpi)}). Require morning plan submission and EOD call log review.`,
          team: 'virtual',
          assignedAdvisorId: advisor.id,
          assignedAdvisorName: advisor.advisorName,
          priority: 'urgent',
          status: 'todo',
          category: 'Training',
          dueDate: getFutureDate(1),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: alertStatus.isTriggered
            ? '3 consecutive KPI updates below threshold'
            : `Overall KPI in PIP range (${formatKpiDisplay(advisor.overallKpi)})`,
          metricTrigger: 'Overall KPI / PIP',
          recommendedFocus: 'Virtual Accountability & EOD Reporting',
          suggestedAction: 'Mandatory daily EOD Google Form submission and weekly PIP audit',
          advisorMetricsSummary: {
            kpi: formatKpiDisplay(advisor.overallKpi),
            exam: `${examScore}%`,
            reach,
            sales,
            grade: isPip ? 'PIP' : undefined,
          },
          selected: true,
        });
      }

      const uniqueAdvisorTasks = advisorTasks.filter(
        (t) => !existingTaskTitles.has(`${t.assignedAdvisorId}_${t.category}_${t.title.toLowerCase()}`)
      );

      diagnostics.push({
        id: advisor.id,
        advisorName: advisor.advisorName,
        team: 'virtual',
        employeeId: advisor.employeeId,
        kpiScore,
        kpiDisplay: formatKpiDisplay(advisor.overallKpi),
        grade: isPip ? 'PIP' : undefined,
        examScore,
        reachCalls: reach,
        sales,
        is3xAlert: alertStatus.isTriggered,
        triggers,
        severity,
        primaryIssue: triggers[0] || 'Operational alignment needed',
        suggestedTasks: uniqueAdvisorTasks.length > 0 ? uniqueAdvisorTasks : advisorTasks,
      });

      (uniqueAdvisorTasks.length > 0 ? uniqueAdvisorTasks : advisorTasks).forEach((t) => allTasks.push(t));
    }
  });

  // Sort diagnostics by severity: urgent first, then high, then medium, then lowest KPI score
  diagnostics.sort((a, b) => {
    const scoreMap = { urgent: 3, high: 2, medium: 1 };
    if (scoreMap[b.severity] !== scoreMap[a.severity]) {
      return scoreMap[b.severity] - scoreMap[a.severity];
    }
    return a.kpiScore - b.kpiScore;
  });

  return {
    diagnostics,
    generatedTasks: allTasks,
    summary: {
      totalUnderperforming: diagnostics.length,
      stationedUnderperforming: diagnostics.filter((d) => d.team === 'stationed').length,
      virtualUnderperforming: diagnostics.filter((d) => d.team === 'virtual').length,
      urgentCount: allTasks.filter((t) => t.priority === 'urgent').length,
      highCount: allTasks.filter((t) => t.priority === 'high').length,
      mediumCount: allTasks.filter((t) => t.priority === 'medium').length,
    },
  };
}

/**
 * Server-side AI Task Generation caller with automatic intelligent client fallback
 */
export async function fetchAiGeneratedTasks(
  stationedAdvisors: StationedAdvisor[],
  virtualAdvisors: VirtualAdvisor[],
  existingTasks: TaskItem[] = [],
  teamLeaderName = 'Muhammad Billal'
): Promise<{
  diagnostics: UnderperformingAdvisorDiagnostic[];
  generatedTasks: GeneratedFollowUpTask[];
  source: 'gemini-ai' | 'smart-rule-engine';
  aiNotes?: string;
}> {
  try {
    const res = await fetch('/api/ai-generate-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationedData: stationedAdvisors,
        virtualData: virtualAdvisors,
        existingTasks,
        teamLeader: teamLeaderName,
      }),
    });

    const data = await res.json();
    if (data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
      // Re-map tasks with full metadata
      const clientAnalysis = generateAutoTasksFromPerformanceData(stationedAdvisors, virtualAdvisors, existingTasks);
      
      const serverTasks: GeneratedFollowUpTask[] = data.tasks.map((st: any, idx: number) => {
        const matchingDiag = clientAnalysis.diagnostics.find(
          (d) => d.id === st.assignedAdvisorId || d.advisorName.toLowerCase() === (st.assignedAdvisorName || '').toLowerCase()
        );
        return {
          id: `ai-gen-${Date.now()}-${idx}`,
          title: st.title || `Follow-up Task for ${st.assignedAdvisorName}`,
          description: st.description || 'Targeted coaching and metric recovery follow-up.',
          team: st.team || (matchingDiag?.team ?? 'stationed'),
          assignedAdvisorId: st.assignedAdvisorId || matchingDiag?.id || 'unassigned',
          assignedAdvisorName: st.assignedAdvisorName || matchingDiag?.advisorName || 'Advisor',
          priority: st.priority || matchingDiag?.severity || 'high',
          status: 'todo',
          category: st.category || 'Training',
          dueDate: st.dueDate || getFutureDate(3),
          createdAt: new Date().toISOString().slice(0, 10),
          underperformanceReason: st.underperformanceReason || matchingDiag?.primaryIssue || 'Metric underperformance',
          metricTrigger: st.metricTrigger || 'Overall KPI Deficit',
          recommendedFocus: st.recommendedFocus || 'Targeted Coaching & Drill',
          suggestedAction: st.suggestedAction || 'Execute structured follow-up plan',
          advisorMetricsSummary: matchingDiag
            ? {
                kpi: matchingDiag.kpiDisplay,
                exam: `${matchingDiag.examScore}%`,
                reach: matchingDiag.reachCalls,
                sales: matchingDiag.sales,
                grade: matchingDiag.grade,
              }
            : {
                kpi: '70%',
                exam: '70%',
                reach: 35,
                sales: 15000,
              },
          selected: true,
        };
      });

      return {
        diagnostics: clientAnalysis.diagnostics,
        generatedTasks: serverTasks,
        source: 'gemini-ai',
        aiNotes: data.aiNotes || `Gemini AI synthesized ${serverTasks.length} targeted recovery tasks for underperforming advisors.`,
      };
    }
  } catch (err) {
    console.warn('Backend AI Task Generation fallback activated:', err);
  }

  // Fallback to client-side deterministic rule engine
  const clientEngine = generateAutoTasksFromPerformanceData(stationedAdvisors, virtualAdvisors, existingTasks);
  return {
    diagnostics: clientEngine.diagnostics,
    generatedTasks: clientEngine.generatedTasks,
    source: 'smart-rule-engine',
    aiNotes: `Synthesized ${clientEngine.generatedTasks.length} actionable follow-up tasks across ${clientEngine.diagnostics.length} underperforming advisors.`,
  };
}
