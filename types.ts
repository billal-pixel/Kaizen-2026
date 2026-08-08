export type TeamType = 'stationed' | 'virtual';

export interface StationedAdvisor {
  id: string;
  advisorName: string;
  employeeId?: string;
  designation?: string;
  advisorDesignation?: string;
  teamLead?: string;
  tlTeam?: string;
  leadId?: string;
  avgReach: number; // Avg reach call count
  avgTalktime: string; // e.g. "02:15:30" or minutes
  ceCount: number; // Customer Experience count
  avgExamMark: number; // e.g. 85.5
  avgBriefingMark: number; // e.g. 90.0
  finalSalesData: number; // e.g. 150000 (BDT)
  totalKpiScore: number; // percentage, e.g., 92.5
  kpiGrade: string; // e.g. 'A' | 'B' | 'C' | 'D' | 'PIP'
  kpiAmount?: number;
  totalIncentive?: number;
  dutyCount?: number;
  avgBreak: string; // e.g. "00:35:00"
  avgMgt: string; // e.g. "00:45:00"
  avgMeeting: string; // e.g. "00:30:00"
  status?: 'active' | 'on_break' | 'in_meeting' | 'offline';
  notes?: string;
}

export interface VirtualAdvisor {
  id: string;
  advisorName: string;
  employeeId?: string;
  designation?: string;
  advisorDesignation?: string;
  teamLead?: string;
  tlTeam?: string;
  leadId?: string;
  reachCall: number;
  talkTime: string; // e.g. "04:20:15"
  meeting: string; // e.g. "01:00:00" or count
  actualTalkTime: string; // Call Duration, PD, DISPO
  ceCount: number;
  finalSales: number; // Sales amount
  overallKpi: string | number; // e.g., "PIP" or 88.0
  exam: string | number; // Exam mark, e.g. "0%" or 80
  ttAmount: number; // Target / Talktime Amount in currency or hours
  initialIncentive?: number;
  finalIncentive: number; // BDT
  totalSalary: number; // BDT
  status?: 'active' | 'on_break' | 'in_meeting' | 'offline';
  notes?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  team: TeamType;
  assignedAdvisorId: string; // Advisor ID or 'all'
  assignedAdvisorName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  category: 'Calling Push' | 'Exam Preparation' | 'CE Audit' | 'Briefing' | 'Sales Closing' | 'Training';
  dueDate: string;
  createdAt: string;
}

export interface TimeLog {
  id: string;
  advisorId: string;
  advisorName: string;
  team: TeamType;
  type: 'talktime' | 'break' | 'meeting' | 'mgt';
  durationSeconds: number;
  notes: string;
  timestamp: string;
}

export interface CallRecord {
  id: string;
  advisorId: string;
  advisorName: string;
  employeeId?: string;
  team: TeamType;
  customerName: string;
  customerPhone: string;
  callType: 'Outbound Reach' | 'Inbound Query' | 'Sales Closing' | 'CE Audit Call' | 'Follow-Up Call';
  duration: string; // e.g. "04:25"
  durationSeconds: number;
  disposition: 'Converted' | 'Interested' | 'Follow-Up Needed' | 'No Answer' | 'Not Interested' | 'Escalated';
  callDate: string; // e.g. "2026-08-05 10:14 AM"
  recordingUrl?: string;
  qualityScore?: number; // e.g. 95 (CE audit mark)
  notes?: string;
  sheetSource?: string; // e.g. "Google Sheet Row #18" or "Live Telephony"
}

export interface PerformanceReportSummary {
  id: string;
  date: string;
  teamLeader: string;
  stationedCount: number;
  virtualCount: number;
  totalStationedSales: number;
  totalVirtualSales: number;
  avgStationedKpi: number;
  avgVirtualKpi: number;
  aiExecutiveSummary?: string;
  keyInsights?: string[];
  recommendations?: string[];
}
