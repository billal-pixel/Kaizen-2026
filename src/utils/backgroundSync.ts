// Background Sync Manager for Service Worker integration & tab focus auto-sync
import { syncAllSheetsData, PRIMARY_DEFAULT_SHEET } from './sheetSync';
import { StationedAdvisor, VirtualAdvisor } from '../types';

export interface BackgroundSyncStatus {
  isSupported: boolean;
  isRegistered: boolean;
  lastSyncedAt: Date | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error: string | null;
}

class BackgroundSyncManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private status: BackgroundSyncStatus = {
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isRegistered: false,
    lastSyncedAt: null,
    status: 'idle',
    error: null,
  };

  private listeners: Set<(status: BackgroundSyncStatus) => void> = new Set();
  private dataCallbacks: Set<(data: { stationed: StationedAdvisor[]; virtual: VirtualAdvisor[] }) => void> = new Set();
  private currentSheetUrl: string = PRIMARY_DEFAULT_SHEET;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initServiceWorker();
      this.initVisibilityListener();
    }
  }

  public subscribeStatus(callback: (status: BackgroundSyncStatus) => void) {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  public subscribeData(callback: (data: { stationed: StationedAdvisor[]; virtual: VirtualAdvisor[] }) => void) {
    this.dataCallbacks.add(callback);
    return () => this.dataCallbacks.delete(callback);
  }

  public getStatus(): BackgroundSyncStatus {
    return { ...this.status };
  }

  public setSheetUrl(url: string, intervalMs = 30000) {
    this.currentSheetUrl = url || PRIMARY_DEFAULT_SHEET;
    if (this.swRegistration && this.swRegistration.active) {
      this.swRegistration.active.postMessage({
        type: 'CONFIG_SYNC',
        payload: { sheetUrl: this.currentSheetUrl, interval: intervalMs },
      });
    }
  }

  private async initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      this.status.isRegistered = true;
      this.notifyStatus();

      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload, error } = event.data || {};
        if (type === 'BACKGROUND_SYNC_START') {
          this.updateStatus({ status: 'syncing', error: null });
        } else if (type === 'BACKGROUND_SYNC_SUCCESS' && payload) {
          this.handleWorkerData(payload);
        } else if (type === 'BACKGROUND_SYNC_ERROR') {
          this.updateStatus({ status: 'error', error: error || 'Service worker background sync error' });
        }
      });

      if (reg.active) {
        reg.active.postMessage({
          type: 'CONFIG_SYNC',
          payload: { sheetUrl: this.currentSheetUrl, interval: 30000 },
        });
      }
    } catch (err) {
      console.warn('Service worker registration error:', err);
    }
  }

  private initVisibilityListener() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Trigger sync when tab comes back to focus
        this.triggerSyncNow();
      }
    });
  }

  public async triggerSyncNow(sheetUrl?: string) {
    const url = sheetUrl || this.currentSheetUrl;
    this.updateStatus({ status: 'syncing', error: null });

    if (this.swRegistration && this.swRegistration.active) {
      this.swRegistration.active.postMessage({
        type: 'TRIGGER_SYNC_NOW',
        payload: { sheetUrl: url },
      });
    }

    // Also perform immediate client-side sync to guarantee instant update
    try {
      const res = await syncAllSheetsData(url);
      if (res.success && (res.stationed.length > 0 || res.virtual.length > 0)) {
        this.notifyData({ stationed: res.stationed, virtual: res.virtual });
        this.updateStatus({
          status: 'success',
          lastSyncedAt: new Date(),
          error: null,
        });
      } else {
        this.updateStatus({
          status: 'error',
          error: res.error || 'Failed to sync with live Google Sheet.',
        });
      }
    } catch (err: any) {
      this.updateStatus({
        status: 'error',
        error: err?.message || 'Sync error',
      });
    }
  }

  private handleWorkerData(payload: any) {
    if (payload.sheets && Object.keys(payload.sheets).length > 0) {
      // Re-trigger syncAllSheetsData parsing or direct notification
      this.triggerSyncNow();
    }
  }

  private updateStatus(partial: Partial<BackgroundSyncStatus>) {
    this.status = { ...this.status, ...partial };
    this.notifyStatus();
  }

  private notifyStatus() {
    this.listeners.forEach((cb) => cb(this.getStatus()));
  }

  private notifyData(data: { stationed: StationedAdvisor[]; virtual: VirtualAdvisor[] }) {
    this.dataCallbacks.forEach((cb) => cb(data));
  }
}

export const backgroundSync = new BackgroundSyncManager();
