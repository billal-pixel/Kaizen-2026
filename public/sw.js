// Kaizen Background Sync Service Worker
const CACHE_NAME = 'kaizen-sync-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

let syncInterval = 30000;
let currentSheetUrl = 'https://docs.google.com/spreadsheets/d/1r0_mnl6zERztFzIVU54RvwZ2z5kRVRf2JWLoGUrDzys/edit#gid=0';
let syncTimer = null;

async function notifyClients(message) {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of allClients) {
    client.postMessage(message);
  }
}

async function performBackgroundCheck() {
  if (!currentSheetUrl) return;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    notifyClients({ type: 'BACKGROUND_SYNC_START' });
    const fetchUrl = `/api/sheets-sync-all?url=${encodeURIComponent(currentSheetUrl)}&_t=${Date.now()}`;
    const response = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data && data.success) {
      notifyClients({
        type: 'BACKGROUND_SYNC_SUCCESS',
        payload: data,
        timestamp: Date.now()
      });
    } else {
      notifyClients({
        type: 'BACKGROUND_SYNC_ERROR',
        error: data.error || 'Failed to parse sheet data',
        timestamp: Date.now()
      });
    }
  } catch (err) {
    clearTimeout(timeoutId);
    notifyClients({
      type: 'BACKGROUND_SYNC_ERROR',
      error: err.name === 'AbortError' ? 'Background sync timeout' : (err.message || 'Network error during background sync'),
      timestamp: Date.now()
    });
  }
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'CONFIG_SYNC') {
    if (payload.sheetUrl) currentSheetUrl = payload.sheetUrl;
    if (payload.interval && payload.interval >= 5000) syncInterval = payload.interval;
    
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(() => {
      performBackgroundCheck();
    }, syncInterval);
  } else if (type === 'TRIGGER_SYNC_NOW') {
    performBackgroundCheck();
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'kaizen-sheet-sync') {
    event.waitUntil(performBackgroundCheck());
  }
});
