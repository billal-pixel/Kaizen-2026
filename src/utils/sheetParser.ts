import Papa from 'papaparse';
import { StationedAdvisor, VirtualAdvisor } from '../types';

export const cleanNum = (val: any, defaultVal = 0): number => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? defaultVal : parsed;
};

export const cleanStr = (val: any, defaultVal = ''): string => {
  if (val === undefined || val === null) return defaultVal;
  return String(val).trim() || defaultVal;
};

export const getNumericKpi = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    if (val > 0 && val <= 1) return Number((val * 100).toFixed(1));
    if (val > 100 && val <= 1000) return Number((val / 10).toFixed(1));
    return Number(val.toFixed(1));
  }
  const str = String(val).trim();
  const cleaned = str.replace(/[^0-9.-]/g, '');
  if (cleaned !== '') {
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      if (parsed > 0 && parsed <= 1) return Number((parsed * 100).toFixed(1));
      if (parsed > 100 && parsed <= 1000) return Number((parsed / 10).toFixed(1));
      return Number(parsed.toFixed(1));
    }
  }
  const upper = str.toUpperCase();
  if (upper === 'S' || upper === 'A+' || upper === 'A') return 85;
  if (upper === 'B') return 75;
  if (upper === 'C') return 65;
  if (upper === 'D') return 55;
  if (upper === 'PIP' || upper === 'F') return 45;
  return 0;
};

export const formatKpiDisplay = (val: any): string => {
  if (val === undefined || val === null || val === '') return '0%';
  if (typeof val === 'number') {
    return isNaN(val) ? '0%' : `${val.toFixed(1)}%`;
  }
  const str = String(val).trim();
  if (str.toUpperCase() === 'PIP') return 'PIP';
  const num = getNumericKpi(str);
  if (num > 0 || str === '0' || str === '0%') {
    return `${num.toFixed(num % 1 === 0 ? 0 : 1)}%`;
  }
  return str;
};

// Find matching header column index by keywords, with strict exclusion of false positives
export const findHeaderIndex = (headers: string[], positiveKeywords: string[], negativeKeywords: string[] = []): number => {
  // First pass: exact normalized match
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!h) continue;

    const hasNegative = negativeKeywords.some(neg => {
      const n = neg.toLowerCase().replace(/[^a-z0-9]/g, '');
      return h.includes(n);
    });
    if (hasNegative) continue;

    for (const pos of positiveKeywords) {
      const p = pos.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (h === p) {
        return i;
      }
    }
  }

  // Second pass: substring match with negative keyword exclusion
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!h) continue;

    const hasNegative = negativeKeywords.some(neg => {
      const n = neg.toLowerCase().replace(/[^a-z0-9]/g, '');
      return h.includes(n);
    });
    if (hasNegative) continue;

    for (const pos of positiveKeywords) {
      const p = pos.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (h.includes(p)) {
        return i;
      }
    }
  }
  return -1;
};

export interface ParseResult {
  stationed: StationedAdvisor[];
  virtual: VirtualAdvisor[];
  error?: string;
}

export const parseMatrixData = (rawData: any[][], targetTeam: 'auto' | 'stationed' | 'virtual' = 'auto'): ParseResult => {
  if (!rawData || rawData.length < 2) return { stationed: [], virtual: [] };

  // Find the real column header row
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(10, rawData.length); r++) {
    const row = rawData[r] || [];
    const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
    if (
      (rowStr.includes('advisor name') || rowStr.includes('employee id') || rowStr.includes('avg reach') || rowStr.includes('reach call')) &&
      !rowStr.includes('advisor basic information')
    ) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // If no header row found with keywords, check if row 0 or row 1 contains basic headers
    headerRowIndex = 0;
  }

  const headers = (rawData[headerRowIndex] || []).map(c => String(c || '').trim());

  // Determine if this is a stationed or virtual sheet
  const allHeadersStr = headers.join(' ').toLowerCase();
  const allRowsStr = rawData.slice(headerRowIndex + 1, headerRowIndex + 5).map(r => (r || []).join(' ')).join(' ').toLowerCase();

  let isStationed = true;
  if (targetTeam === 'virtual') {
    isStationed = false;
  } else if (targetTeam === 'stationed') {
    isStationed = true;
  } else {
    if (allHeadersStr.includes('actual talk') || allHeadersStr.includes('tt amount') || allHeadersStr.includes('total salary') || allRowsStr.includes('virtual')) {
      isStationed = false;
    } else {
      isStationed = true;
    }
  }

  const stationed: StationedAdvisor[] = [];
  const virtual: VirtualAdvisor[] = [];

  if (isStationed) {
    // Column lookups with strict exclusions
    const nameCol = findHeaderIndex(headers, ['advisor name', 'advisorname', 'name'], ['trainer', 'qa', 'tl', 'lead']);
    const empIdCol = findHeaderIndex(headers, ['employee id', 'employeeid', 'empid', 'id'], ['auth', 'service', 'lead']);
    const desigCol = findHeaderIndex(headers, ['advisor designation', 'designation', 'role']);
    const tlCol = findHeaderIndex(headers, ['tl team', 'teamlead', 'tl', 'team leader']);
    const reachCol = findHeaderIndex(headers, ['avg reach', 'avgreach', 'reach']);
    const talktimeCol = findHeaderIndex(headers, ['avg talktime', 'avgtalktime', 'talktime', 'talk time']);
    const ceCol = findHeaderIndex(headers, ['ce count', 'cecount', 'ce']);
    const examCol = findHeaderIndex(headers, ['avg exam mark', 'exam mark', 'exam']);
    const briefingCol = findHeaderIndex(headers, ['avg briefing mark', 'briefing mark', 'briefing']);
    const salesCol = findHeaderIndex(headers, ['final sales data', 'final sales', 'sales data', 'sales bdt', 'final sales']);
    const kpiCol = findHeaderIndex(headers, ['total kpi score', 'kpi score', 'total kpi', 'kpi %']);
    const gradeCol = findHeaderIndex(headers, ['kpi grade', 'grade', 'rating']);
    const kpiAmtCol = findHeaderIndex(headers, ['kpi amount', 'kpi amt']);
    const dutyCol = findHeaderIndex(headers, ['duty count', 'duty']);
    const breakCol = findHeaderIndex(headers, ['avg break', 'break']);
    const mgtCol = findHeaderIndex(headers, ['avg mgt', 'mgt']);
    const meetingCol = findHeaderIndex(headers, ['avg meeting', 'meeting']);
    const incentiveCol = findHeaderIndex(headers, ['total incentive', 'final incentive', 'incentive']);

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0) continue;

      // Extract advisor name safely
      let name = '';
      if (nameCol !== -1 && row[nameCol] !== undefined) {
        name = cleanStr(row[nameCol]);
      } else if (row[5] !== undefined) {
        name = cleanStr(row[5]);
      }

      if (!name || ['advisor name', 'name', 'total', 'average', 'summary', 'remarks', 'tl team', 'trainer team', 'qa team'].includes(name.toLowerCase())) {
        continue;
      }

      const empId = empIdCol !== -1 && row[empIdCol] !== undefined ? cleanStr(row[empIdCol]) : (row[4] ? cleanStr(row[4]) : `TE${800 + r}`);
      const desig = desigCol !== -1 && row[desigCol] !== undefined ? cleanStr(row[desigCol]) : 'Traine Advisor New';
      const tl = tlCol !== -1 && row[tlCol] !== undefined ? cleanStr(row[tlCol]) : 'Billal';
      const avgReach = reachCol !== -1 && row[reachCol] !== undefined ? cleanNum(row[reachCol]) : cleanNum(row[10]);
      const avgTalktime = talktimeCol !== -1 && row[talktimeCol] !== undefined ? cleanStr(row[talktimeCol], '00:00:00') : cleanStr(row[12], '00:00:00');
      const ceCount = ceCol !== -1 && row[ceCol] !== undefined ? cleanNum(row[ceCol]) : cleanNum(row[14]);
      const avgExamMark = examCol !== -1 && row[examCol] !== undefined ? cleanNum(row[examCol]) : cleanNum(row[16]);
      const avgBriefingMark = briefingCol !== -1 && row[briefingCol] !== undefined ? cleanNum(row[briefingCol]) : cleanNum(row[18]);
      const finalSalesData = salesCol !== -1 && row[salesCol] !== undefined ? cleanNum(row[salesCol]) : cleanNum(row[25]);
      const totalKpiScore = kpiCol !== -1 && row[kpiCol] !== undefined ? cleanNum(row[kpiCol]) : cleanNum(row[27]);
      let kpiGrade = gradeCol !== -1 && row[gradeCol] !== undefined ? cleanStr(row[gradeCol]) : cleanStr(row[28], 'D');
      if (!kpiGrade || kpiGrade === '0') {
        if (totalKpiScore >= 80) kpiGrade = 'A';
        else if (totalKpiScore >= 70) kpiGrade = 'B';
        else if (totalKpiScore >= 60) kpiGrade = 'C';
        else if (totalKpiScore >= 50) kpiGrade = 'D';
        else kpiGrade = 'PIP';
      }
      const kpiAmount = kpiAmtCol !== -1 && row[kpiAmtCol] !== undefined ? cleanNum(row[kpiAmtCol]) : cleanNum(row[29]);
      const dutyCount = dutyCol !== -1 && row[dutyCol] !== undefined ? cleanNum(row[dutyCol]) : cleanNum(row[31]);
      const avgBreak = breakCol !== -1 && row[breakCol] !== undefined ? cleanStr(row[breakCol], '00:00:00') : cleanStr(row[32], '00:00:00');
      const avgMgt = mgtCol !== -1 && row[mgtCol] !== undefined ? cleanStr(row[mgtCol], '00:00:00') : cleanStr(row[33], '00:00:00');
      const avgMeeting = meetingCol !== -1 && row[meetingCol] !== undefined ? cleanStr(row[meetingCol], '00:00:00') : cleanStr(row[34], '00:00:00');
      const totalIncentive = incentiveCol !== -1 && row[incentiveCol] !== undefined ? cleanNum(row[incentiveCol]) : cleanNum(row[46]);

      stationed.push({
        id: `st-${empId.toLowerCase().replace(/[^a-z0-9]/g, '') || String(r)}`,
        advisorName: name,
        employeeId: empId,
        designation: desig,
        teamLead: tl,
        avgReach,
        avgTalktime,
        ceCount,
        avgExamMark,
        avgBriefingMark,
        finalSalesData,
        totalKpiScore,
        kpiGrade,
        kpiAmount,
        totalIncentive,
        dutyCount,
        avgBreak,
        avgMgt,
        avgMeeting,
        status: 'active',
        notes: row[30] ? cleanStr(row[30]) : ''
      });
    }
  } else {
    // Virtual advisors column parsing
    const nameCol = findHeaderIndex(headers, ['advisor name', 'advisorname', 'name'], ['trainer', 'qa', 'tl', 'lead']);
    const empIdCol = findHeaderIndex(headers, ['employee id', 'employeeid', 'empid', 'id'], ['auth', 'service', 'lead']);
    const desigCol = findHeaderIndex(headers, ['advisor designation', 'designation', 'role']);
    const tlCol = findHeaderIndex(headers, ['tl team', 'teamlead', 'tl', 'team leader']);
    const reachCol = findHeaderIndex(headers, ['reach call', 'reach calls', 'reach']);
    const talktimeCol = findHeaderIndex(headers, ['talk time', 'talktime'], ['actual']);
    const meetingCol = findHeaderIndex(headers, ['meeting', 'meeting time']);
    const actualTtCol = findHeaderIndex(headers, ['actual talk time', 'actual talktime', 'actual talk', 'pd/dispo']);
    const ceCol = findHeaderIndex(headers, ['ce count', 'cecount'], ['service', 'auth', 'device', 'licence']);
    const salesCol = findHeaderIndex(headers, ['final sales', 'final sales data', 'sales'], ['yesterday', 'raw', 'mismatch', 'overlap', 'offline', 'refund']);
    const kpiCol = findHeaderIndex(headers, ['overall kpi', 'total kpi'], ['sales']);
    const examCol = findHeaderIndex(headers, ['exam', 'exam mark', 'avg exam mark']);
    const ttAmtCol = findHeaderIndex(headers, ['tt amount', 'tt sales', 'tt']);
    const initIncCol = findHeaderIndex(headers, ['initial incentive'], ['final']);
    const finIncCol = findHeaderIndex(headers, ['final incentive'], ['initial', 'flat', 'slab', 'remarks']);
    const salaryCol = findHeaderIndex(headers, ['total salary', 'salary', 'pay']);

    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0) continue;

      let name = '';
      if (nameCol !== -1 && row[nameCol] !== undefined) {
        name = cleanStr(row[nameCol]);
      } else if (row[3] !== undefined) {
        name = cleanStr(row[3]);
      }

      if (!name || ['advisor name', 'name', 'total', 'average', 'summary', 'remarks', 'tl team', 'trainer team', 'qa team'].includes(name.toLowerCase())) {
        continue;
      }

      const empId = empIdCol !== -1 && row[empIdCol] !== undefined ? cleanStr(row[empIdCol]) : `VT${760 + r}`;
      const desig = desigCol !== -1 && row[desigCol] !== undefined ? cleanStr(row[desigCol]) : 'Trainee Advisor Virtual';
      const tl = tlCol !== -1 && row[tlCol] !== undefined ? cleanStr(row[tlCol]) : 'Billal';
      const reachCall = reachCol !== -1 && row[reachCol] !== undefined ? cleanNum(row[reachCol]) : 0;
      const talkTime = talktimeCol !== -1 && row[talktimeCol] !== undefined ? cleanStr(row[talktimeCol], '00:00:00') : '00:00:00';
      const meeting = meetingCol !== -1 && row[meetingCol] !== undefined ? cleanStr(row[meetingCol], '00:00:00') : '00:00:00';
      const actualTalkTime = actualTtCol !== -1 && row[actualTtCol] !== undefined ? cleanStr(row[actualTtCol], talkTime) : talkTime;
      const ceCount = ceCol !== -1 && row[ceCol] !== undefined ? cleanNum(row[ceCol]) : 0;
      const finalSales = salesCol !== -1 && row[salesCol] !== undefined ? cleanNum(row[salesCol]) : 0;
      const overallKpi = kpiCol !== -1 && row[kpiCol] !== undefined ? cleanStr(row[kpiCol], 'PIP') : 'PIP';
      const exam = examCol !== -1 && row[examCol] !== undefined ? cleanStr(row[examCol], '0%') : '0%';
      const ttAmount = ttAmtCol !== -1 && row[ttAmtCol] !== undefined ? cleanNum(row[ttAmtCol]) : 0;
      const initialIncentive = initIncCol !== -1 && row[initIncCol] !== undefined ? cleanNum(row[initIncCol]) : 0;
      const finalIncentive = finIncCol !== -1 && row[finIncCol] !== undefined ? cleanNum(row[finIncCol]) : 0;
      const totalSalary = salaryCol !== -1 && row[salaryCol] !== undefined ? cleanNum(row[salaryCol]) : 0;

      virtual.push({
        id: `vt-${empId.toLowerCase().replace(/[^a-z0-9]/g, '') || String(r)}`,
        advisorName: name,
        employeeId: empId,
        designation: desig,
        teamLead: tl,
        reachCall,
        talkTime,
        meeting,
        actualTalkTime,
        ceCount,
        finalSales,
        overallKpi,
        exam,
        ttAmount,
        initialIncentive,
        finalIncentive,
        totalSalary,
        status: 'active',
        notes: 'Synced from Google Sheet'
      });
    }
  }

  const dedupeStationed = (list: StationedAdvisor[]): StationedAdvisor[] => {
    const seen = new Set<string>();
    return list.filter(item => {
      const key = (item.employeeId && item.employeeId.trim() !== '' ? item.employeeId.trim() : item.advisorName.trim()).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const dedupeVirtual = (list: VirtualAdvisor[]): VirtualAdvisor[] => {
    const seen = new Set<string>();
    return list.filter(item => {
      const key = (item.employeeId && item.employeeId.trim() !== '' ? item.employeeId.trim() : item.advisorName.trim()).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return { stationed: dedupeStationed(stationed), virtual: dedupeVirtual(virtual) };
};

export const parseRawRows = (rows: any[], targetTeam: 'auto' | 'stationed' | 'virtual' = 'auto'): ParseResult => {
  if (!rows || rows.length === 0) return { stationed: [], virtual: [] };

  // If rows is array of arrays
  if (Array.isArray(rows[0])) {
    return parseMatrixData(rows, targetTeam);
  }

  // If rows is array of objects, convert keys and values to matrix
  const headers = Object.keys(rows[0] || {});
  const matrix: any[][] = [headers];
  for (const row of rows) {
    matrix.push(headers.map(h => row[h]));
  }

  return parseMatrixData(matrix, targetTeam);
};

export const parseCsvText = (csvText: string, targetTeam: 'auto' | 'stationed' | 'virtual' = 'auto'): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as any[][];
        const result = parseMatrixData(rawData, targetTeam);
        resolve(result);
      },
      error: (err) => {
        resolve({ stationed: [], virtual: [], error: err.message });
      }
    });
  });
};
