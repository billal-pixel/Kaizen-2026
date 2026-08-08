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
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  const cleaned = str.replace(/[^0-9.-]/g, '');
  if (cleaned !== '') {
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) return parsed;
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

export const getValueByKeywords = (row: Record<string, any>, possibleKeys: string[]): any => {
  const rowKeys = Object.keys(row);

  // 1. Exact normalized match
  for (const pKey of possibleKeys) {
    const target = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const rKey of rowKeys) {
      if (rKey.toLowerCase().replace(/[^a-z0-9]/g, '') === target) {
        if (row[rKey] !== undefined && row[rKey] !== null && String(row[rKey]).trim() !== '') {
          return row[rKey];
        }
      }
    }
  }

  // 2. Substring match
  for (const pKey of possibleKeys) {
    const target = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (target.length < 2) continue;
    for (const rKey of rowKeys) {
      const cleanedRowKey = rKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanedRowKey.includes(target) || target.includes(cleanedRowKey)) {
        if (row[rKey] !== undefined && row[rKey] !== null && String(row[rKey]).trim() !== '') {
          return row[rKey];
        }
      }
    }
  }

  return undefined;
};

export const isVirtualRow = (row: Record<string, any>): boolean => {
  const rowKeysStr = Object.keys(row).join(' ').toLowerCase();
  const rowValsStr = Object.values(row).join(' ').toLowerCase();

  // 1. Check for explicit Stationed team markers first
  const isStationed = (
    rowKeysStr.includes('avg reach') ||
    rowKeysStr.includes('avg talktime') ||
    rowKeysStr.includes('avg exam mark') ||
    rowKeysStr.includes('avg briefing mark') ||
    rowKeysStr.includes('final sales data') ||
    rowKeysStr.includes('duty count') ||
    rowKeysStr.includes('avg break') ||
    rowKeysStr.includes('avg mgt') ||
    rowValsStr.includes('station') ||
    rowValsStr.includes('traine advisor new')
  );

  if (isStationed) return false;

  // 2. Virtual team markers
  return (
    rowKeysStr.includes('actual talk') ||
    rowKeysStr.includes('tt amount') ||
    rowKeysStr.includes('reach call') ||
    rowKeysStr.includes('total salary') ||
    rowKeysStr.includes('initial incentive') ||
    rowValsStr.includes('virtual')
  );
};

export interface ParseResult {
  stationed: StationedAdvisor[];
  virtual: VirtualAdvisor[];
  error?: string;
}

export const parseRawRows = (rows: any[], targetTeam: 'auto' | 'stationed' | 'virtual' = 'auto'): ParseResult => {
  if (!rows || rows.length === 0) {
    return { stationed: [], virtual: [], error: 'No data rows found.' };
  }

  const parsedStationed: StationedAdvisor[] = [];
  const parsedVirtual: VirtualAdvisor[] = [];

  rows.forEach((r, i) => {
    const rowKeysStr = Object.keys(r).join(' ').toLowerCase();
    const rowValsStr = Object.values(r).join(' ').toLowerCase();

    // Determine row classification
    let isVirtual = false;
    if (targetTeam === 'virtual') {
      isVirtual = true;
    } else if (targetTeam === 'stationed') {
      isVirtual = false;
    } else {
      isVirtual = isVirtualRow(r);
    }

    if (isVirtual) {
      const name = cleanStr(
        getValueByKeywords(r, ['advisor name', 'virtual advisor', 'advisor', 'name', 'member', 'employee', 'staff']),
        ''
      );

      if (!name || ['advisor', 'name', 'advisor name', 'total', 'average', 'summary', 'remarks', 'tl team'].includes(name.toLowerCase())) {
        return;
      }

      const employeeId = cleanStr(getValueByKeywords(r, ['employee id', 'id', 'emp id']), `TE${760 + i}`);
      const designation = cleanStr(getValueByKeywords(r, ['advisor designation', 'designation']), 'Trainee Advisor Virtual');
      const teamLead = cleanStr(getValueByKeywords(r, ['tl team', 'tl', 'team leader']), 'Billal');

      const reachCall = cleanNum(getValueByKeywords(r, ['reach call', 'reach calls', 'reach', 'call reach', 'total reach', 'calls']));
      const talkTime = cleanStr(getValueByKeywords(r, ['talk time', 'talktime', 'total talk time', 'avg talktime', 'duration', 'talk']), '00:00:00');
      const meeting = cleanStr(getValueByKeywords(r, ['meeting', 'meeting time', 'avg meeting']), '00:00:00');
      const actualTalkTime = cleanStr(getValueByKeywords(r, ['actual talk time', 'actual talktime', 'pd/dispo', 'dispo', 'actual talk']), '00:00:00');
      const ceCount = cleanNum(getValueByKeywords(r, ['ce count', 'ce', 'ce audit', 'ce score', 'quality']));
      const finalSales = cleanNum(getValueByKeywords(r, ['final sales', 'sales', 'final sales data', 'total sales', 'sales bdt', 'revenue', 'bdt']));
      const overallKpiRaw = getValueByKeywords(r, ['overall kpi', 'kpi', 'sales kpi', 'kpi score', 'total kpi score', 'kpi %']);
      const overallKpi = overallKpiRaw !== undefined && overallKpiRaw !== null && String(overallKpiRaw).trim() !== '' ? String(overallKpiRaw).trim() : 'PIP';
      
      const examRaw = getValueByKeywords(r, ['exam', 'exam mark', 'avg exam mark', 'exam score']);
      const exam = examRaw !== undefined && examRaw !== null && String(examRaw).trim() !== '' ? String(examRaw).trim() : '0%';

      const ttAmount = cleanNum(getValueByKeywords(r, ['tt amount', 'tt sales', 'tt amt', 'target sales', 'tt']));
      const initialIncentive = cleanNum(getValueByKeywords(r, ['initial incentive', 'initial 50%']));
      const finalIncentive = cleanNum(getValueByKeywords(r, ['final incentive', 'incentive', 'incentive amount', 'bonus']));
      const totalSalary = cleanNum(getValueByKeywords(r, ['total salary', 'salary', 'net salary', 'gross salary', 'pay']));

      parsedVirtual.push({
        id: `vt-auto-${name.replace(/\s+/g, '-').toLowerCase()}-${i}`,
        advisorName: name,
        employeeId,
        designation,
        teamLead,
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
    } else {
      const name = cleanStr(
        getValueByKeywords(r, ['advisor name', 'station advisor', 'stationed advisor', 'advisor', 'name', 'member', 'employee', 'staff']),
        ''
      );

      if (!name || ['advisor', 'name', 'advisor name', 'total', 'average', 'summary', 'remarks', 'tl team'].includes(name.toLowerCase())) {
        return;
      }

      const employeeId = cleanStr(getValueByKeywords(r, ['employee id', 'id', 'emp id']), `TE${760 + i}`);
      const designation = cleanStr(getValueByKeywords(r, ['advisor designation', 'designation']), 'Traine Advisor New');
      const teamLead = cleanStr(getValueByKeywords(r, ['tl team', 'tl', 'team leader']), 'Billal');

      const avgReach = cleanNum(getValueByKeywords(r, ['avg reach', 'reach', 'reach call', 'total reach', 'reach count', 'calls']));
      const avgTalktime = cleanStr(getValueByKeywords(r, ['avg talktime', 'avg talk time', 'talktime', 'talk time', 'total talktime', 'duration']), '00:00:00');
      const ceCount = cleanNum(getValueByKeywords(r, ['ce count', 'ce', 'ce audit', 'ce score', 'customer experience', 'quality']));
      const avgExamMark = cleanNum(getValueByKeywords(r, ['avg exam mark', 'exam mark', 'exam', 'avg exam', 'exam score']), 0);
      const avgBriefingMark = cleanNum(getValueByKeywords(r, ['avg briefing mark', 'briefing mark', 'briefing', 'avg briefing', 'briefing score']), 0);
      const finalSalesData = cleanNum(getValueByKeywords(r, ['final sales data', 'final sales', 'sales', 'sales data', 'total sales', 'sales bdt', 'revenue', 'bdt']));
      const totalKpiScore = cleanNum(getValueByKeywords(r, ['total kpi score', 'kpi score', 'total kpi', 'kpi', 'kpi %', 'overall kpi']), 0);

      let kpiGrade = cleanStr(getValueByKeywords(r, ['kpi grade', 'grade', 'rating', 'kpi rating']), '');
      if (!kpiGrade) {
        if (totalKpiScore >= 80) kpiGrade = 'A';
        else if (totalKpiScore >= 70) kpiGrade = 'B';
        else if (totalKpiScore >= 60) kpiGrade = 'C';
        else if (totalKpiScore >= 50) kpiGrade = 'D';
        else kpiGrade = 'PIP';
      }

      const kpiAmount = cleanNum(getValueByKeywords(r, ['kpi amount']));
      const totalIncentive = cleanNum(getValueByKeywords(r, ['total incentive', 'final incentive', 'incentive']));
      const dutyCount = cleanNum(getValueByKeywords(r, ['duty count']));

      const avgBreak = cleanStr(getValueByKeywords(r, ['avg break', 'break', 'break time', 'avg break time']), '00:00:00');
      const avgMgt = cleanStr(getValueByKeywords(r, ['avg mgt', 'mgt', 'management', 'mgt time']), '00:00:00');
      const avgMeeting = cleanStr(getValueByKeywords(r, ['avg meeting', 'meeting', 'meeting time']), '00:00:00');

      parsedStationed.push({
        id: `st-auto-${name.replace(/\s+/g, '-').toLowerCase()}-${i}`,
        advisorName: name,
        employeeId,
        designation,
        teamLead,
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
        notes: 'Synced from Google Sheet'
      });
    }
  });

  return { stationed: parsedStationed, virtual: parsedVirtual };
};

export const convertToObjects = (unparsedMatrix: any[][]): Record<string, any>[] => {
  if (!unparsedMatrix || unparsedMatrix.length < 1) return [];

  let headerIndex = 0;
  for (let i = 0; i < Math.min(6, unparsedMatrix.length); i++) {
    const rowStr = (unparsedMatrix[i] || []).map((c) => String(c).toLowerCase()).join(' ');
    const hasNameOrId = rowStr.includes('advisor name') || rowStr.includes('employee id') || rowStr.includes('reach call') || rowStr.includes('avg reach');
    const isCategoryHeader = rowStr.includes('advisor basic information') || rowStr.includes('utilization part');

    if (hasNameOrId && !isCategoryHeader) {
      headerIndex = i;
      break;
    }
  }

  const headers = (unparsedMatrix[headerIndex] || []).map((h, colIdx) => String(h).trim() || `col_${colIdx}`);
  const objects: Record<string, any>[] = [];

  for (let r = headerIndex + 1; r < unparsedMatrix.length; r++) {
    const row = unparsedMatrix[r];
    if (!row || row.length === 0 || row.every((c) => !String(c).trim())) continue;

    const obj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      const key = obj[h] !== undefined ? `${h}_${colIdx}` : h;
      obj[key] = row[colIdx] !== undefined ? row[colIdx] : '';
    });
    objects.push(obj);
  }

  return objects;
};

export const parseMatrixData = (rawData: any[][], targetTeam: 'auto' | 'stationed' | 'virtual' = 'auto'): ParseResult => {
  if (!rawData || rawData.length < 2) return { stationed: [], virtual: [] };

  const row0Str = (rawData[0] || []).join(' ').toLowerCase();
  const row1Str = (rawData[1] || []).join(' ').toLowerCase();
  const row2Str = (rawData[2] || []).join(' ').toLowerCase();

  let isStationedMatrix = false;
  let isVirtualMatrix = false;

  if (
    row0Str.includes('utilization part') ||
    row0Str.includes('advisor basic information') ||
    row1Str.includes('traine advisor new') ||
    row2Str.includes('station')
  ) {
    isStationedMatrix = true;
  } else if (
    row0Str.includes('reach call') ||
    row0Str.includes('actual talk time') ||
    row1Str.includes('virtual')
  ) {
    isVirtualMatrix = true;
  }

  if (targetTeam === 'stationed') {
    isStationedMatrix = true;
    isVirtualMatrix = false;
  } else if (targetTeam === 'virtual') {
    isVirtualMatrix = true;
    isStationedMatrix = false;
  }

  const stationed: StationedAdvisor[] = [];
  const virtual: VirtualAdvisor[] = [];

  if (isStationedMatrix) {
    const startRow = (row0Str.includes('utilization part') || row0Str.includes('advisor basic information')) ? 2 : 1;
    for (let r = startRow; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length < 4) continue;

      const name = cleanStr(row[3]);
      if (!name || ['advisor name', 'name', 'total', 'average', 'summary', 'remarks', 'tl team'].includes(name.toLowerCase())) {
        continue;
      }

      const employeeId = cleanStr(row[2], `TE${760 + r}`);
      const designation = cleanStr(row[4], 'Traine Advisor New');
      const teamLead = cleanStr(row[1], 'Billal');

      const avgReach = cleanNum(row[6]);
      const avgTalktime = cleanStr(row[8], '00:00:00');
      const ceCount = cleanNum(row[11]);
      const avgExamMark = cleanNum(row[13]);
      const avgBriefingMark = cleanNum(row[14]);
      const dutyCount = cleanNum(row[15]);
      const finalSalesData = cleanNum(row[21]) || cleanNum(row[16]);
      const totalKpiScore = cleanNum(row[23]) || cleanNum(row[22]);

      let kpiGrade = cleanStr(row[24], '');
      if (!kpiGrade || kpiGrade === '0') {
        if (totalKpiScore >= 80) kpiGrade = 'A';
        else if (totalKpiScore >= 70) kpiGrade = 'B';
        else if (totalKpiScore >= 60) kpiGrade = 'C';
        else if (totalKpiScore >= 50) kpiGrade = 'D';
        else kpiGrade = 'PIP';
      }

      const kpiAmount = cleanNum(row[25]);
      const avgBreak = cleanStr(row[28], '00:00:00');
      const avgMgt = cleanStr(row[29], '00:00:00');
      const avgMeeting = cleanStr(row[30], '00:00:00');
      const totalIncentive = cleanNum(row[42]) || cleanNum(row[38]);

      stationed.push({
        id: `st-auto-${name.replace(/\s+/g, '-').toLowerCase()}-${r}`,
        advisorName: name,
        employeeId,
        designation,
        teamLead,
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
        notes: 'Synced from Google Sheet'
      });
    }
  } else if (isVirtualMatrix) {
    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length < 4) continue;

      const name = cleanStr(row[3]);
      if (!name || ['advisor name', 'name', 'total', 'average', 'summary', 'remarks', 'tl team'].includes(name.toLowerCase())) {
        continue;
      }

      const employeeId = cleanStr(row[2], `TE${760 + r}`);
      const designation = cleanStr(row[4], 'Trainee Advisor Virtual');
      const teamLead = cleanStr(row[1], 'Billal');

      const reachCall = cleanNum(row[6]);
      const talkTime = cleanStr(row[8], '00:00:00');
      const meeting = cleanStr(row[9], '00:00:00');
      const actualTalkTime = cleanStr(row[11], '00:00:00');
      const ceCount = cleanNum(row[13]);
      const finalSales = cleanNum(row[20]) || cleanNum(row[15]);
      const overallKpi = cleanStr(row[22]) || cleanStr(row[21], 'PIP');
      const exam = cleanStr(row[23], '0%');
      const ttAmount = cleanNum(row[24]);
      const initialIncentive = cleanNum(row[25]);
      const finalIncentive = cleanNum(row[29]);
      const totalSalary = cleanNum(row[30]);

      virtual.push({
        id: `vt-auto-${name.replace(/\s+/g, '-').toLowerCase()}-${r}`,
        advisorName: name,
        employeeId,
        designation,
        teamLead,
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

export const parseCsvText = (csvText: string, targetTeam: 'auto' | 'stationed' | 'virtual' = 'auto'): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as any[][];
        
        // Try positional matrix parsing first
        const matrixResult = parseMatrixData(rawData, targetTeam);
        if (matrixResult.stationed.length > 0 || matrixResult.virtual.length > 0) {
          resolve(matrixResult);
          return;
        }

        // Fallback to object-key parsing
        const rows = convertToObjects(rawData);
        const result = parseRawRows(rows, targetTeam);
        resolve(result);
      },
      error: (err) => {
        resolve({ stationed: [], virtual: [], error: err.message });
      }
    });
  });
};
