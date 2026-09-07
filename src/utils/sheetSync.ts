import { StationedAdvisor, VirtualAdvisor } from '../types';
import { parseCsvText } from './sheetParser';

export const PRIMARY_DEFAULT_SHEET = 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit#gid=0';
export const VIRTUAL_DEFAULT_SHEET = 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit#gid=1487776310';
export const PRIMARY_DOC_ID = '1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys';
export const PRIMARY_STATIONED_GID = '0';
export const PRIMARY_VIRTUAL_GID = '1487776310';

export interface SyncSheetsResult {
  success: boolean;
  stationed: StationedAdvisor[];
  virtual: VirtualAdvisor[];
  sheetsCount: number;
  error?: string;
  source: 'api' | 'direct_cors';
}

export async function directBrowserFetchSheets(sheetUrl: string): Promise<Record<string, string>> {
  let docId = PRIMARY_DOC_ID;
  if (sheetUrl) {
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) docId = match[1];
  }
  const userGidMatch = sheetUrl ? sheetUrl.match(/gid=([0-9]+)/) : null;
  const userGid = userGidMatch ? userGidMatch[1] : '0';

  // Always fetch both primary tabs (Stationed gid=0 and Virtual gid=1487776310) plus user's requested GID
  const gids = Array.from(new Set([userGid, PRIMARY_STATIONED_GID, PRIMARY_VIRTUAL_GID]));
  const sheetsMap: Record<string, string> = {};

  // Fetch gids directly using Google Sheets gviz CORS endpoint
  await Promise.all(
    gids.map(async (gid) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const url = `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&gid=${gid}`;
        
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const txt = await res.text();
          if (txt && !txt.includes('<!DOCTYPE html>') && txt.length > 20) {
            sheetsMap[gid] = txt;
          }
        }
      } catch {
        clearTimeout(timeoutId);
        // Ignore individual tab timeout/failure
      }
    })
  );

  return sheetsMap;
}

export function deduplicateStationed(advisors: StationedAdvisor[]): StationedAdvisor[] {
  const seen = new Set<string>();
  const result: StationedAdvisor[] = [];
  for (const adv of advisors) {
    const key = (adv.employeeId && adv.employeeId.trim() !== '' ? adv.employeeId.trim() : adv.advisorName.trim()).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(adv);
    }
  }
  return result;
}

export function deduplicateVirtual(advisors: VirtualAdvisor[]): VirtualAdvisor[] {
  const seen = new Set<string>();
  const result: VirtualAdvisor[] = [];
  for (const adv of advisors) {
    const key = (adv.employeeId && adv.employeeId.trim() !== '' ? adv.employeeId.trim() : adv.advisorName.trim()).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(adv);
    }
  }
  return result;
}

export async function syncAllSheetsData(sheetUrl: string): Promise<SyncSheetsResult> {
  const targetUrl = sheetUrl || PRIMARY_DEFAULT_SHEET;
  let sheetContentsMap: Record<string, string> = {};
  let source: 'api' | 'direct_cors' = 'api';

  // Step 1: Attempt Server API
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const fetchUrl = `${origin}/api/sheets-sync-all?url=${encodeURIComponent(targetUrl)}&_t=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.sheets && Object.keys(data.sheets).length > 0) {
        sheetContentsMap = data.sheets;
      }
    }
  } catch (err) {
    console.warn('Server API sync fallback triggered:', err);
  }

  // Step 2: Fallback to Direct Browser Fetch if API failed or returned empty
  if (Object.keys(sheetContentsMap).length === 0) {
    source = 'direct_cors';
    sheetContentsMap = await directBrowserFetchSheets(targetUrl);
  }

  if (Object.keys(sheetContentsMap).length === 0) {
    return {
      success: false,
      stationed: [],
      virtual: [],
      sheetsCount: 0,
      source,
      error: 'Google Sheet link is restricted or private. Use "Paste Sheet Cells" to manually sync!',
    };
  }

  let allStationed: StationedAdvisor[] = [];
  let allVirtual: VirtualAdvisor[] = [];

  for (const gid of Object.keys(sheetContentsMap)) {
    const csvText = sheetContentsMap[gid];
    if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('document-root')) continue;

    const parsed = await parseCsvText(csvText, 'auto');
    if (parsed.stationed && parsed.stationed.length > 0) {
      allStationed = [...allStationed, ...parsed.stationed];
    }
    if (parsed.virtual && parsed.virtual.length > 0) {
      allVirtual = [...allVirtual, ...parsed.virtual];
    }
  }

  const uniqueStationed = deduplicateStationed(allStationed);
  const uniqueVirtual = deduplicateVirtual(allVirtual);

  return {
    success: true,
    stationed: uniqueStationed,
    virtual: uniqueVirtual,
    sheetsCount: Object.keys(sheetContentsMap).length,
    source,
  };
}
