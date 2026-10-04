import { refreshSyncQueueCounts } from "./queue";
import { drainMutationQueue, isSyncingActive } from "./drain";
import { useSyncStatus } from "./use-sync-status";
import { SYNC_REQUEST_EVENT, type SyncRequestReason } from "./events";

let isStarted = false;
let syncIntervalId: number | null = null;
let drainTimerId: number | null = null;

function clearDrainTimer(): void {
  if (typeof window === "undefined" || drainTimerId === null) return;
  window.clearTimeout(drainTimerId);
  drainTimerId = null;
}

function scheduleDrain(delayMs = 0): void {
  if (typeof window === "undefined") return;
  clearDrainTimer();
  drainTimerId = window.setTimeout(() => {
    drainTimerId = null;
    void drainNow();
  }, delayMs);
}

async function drainNow(): Promise<void> {
  const syncStatus = useSyncStatus.getState();
  if (!syncStatus.online || isSyncingActive()) return;
  await drainMutationQueue();
}

function handleSyncRequest(event: Event): void {
  const reason = (event as CustomEvent<{ reason: SyncRequestReason }>).detail?.reason;
  scheduleDrain(reason === "enqueue" ? 500 : 0);
}

function handleOnline(): void {
  useSyncStatus.getState().setOnline(true);
  scheduleDrain(0);
}

function handleOffline(): void {
  useSyncStatus.getState().setOnline(false);
  clearDrainTimer();
}

export function startSync(): void {
  if (typeof window === "undefined" || isStarted) return;

  isStarted = true;
  useSyncStatus.getState().setOnline(navigator.onLine);
  void refreshSyncQueueCounts();

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  window.addEventListener(SYNC_REQUEST_EVENT, handleSyncRequest as EventListener);

  syncIntervalId = window.setInterval(() => {
    const syncStatus = useSyncStatus.getState();
    if (
      syncStatus.online &&
      !isSyncingActive() &&
      syncStatus.queueCount + syncStatus.blockedCount > 0
    ) {
      scheduleDrain(0);
    }
  }, 60000);

  scheduleDrain(0);
}

export function stopSync(): void {
  if (typeof window === "undefined" || !isStarted) return;

  isStarted = false;
  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  window.removeEventListener(SYNC_REQUEST_EVENT, handleSyncRequest as EventListener);

  if (syncIntervalId !== null) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
  }

  clearDrainTimer();
}
