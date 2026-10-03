import { postSyncBatch } from "@/api/sync/api";
import { peekBatch, markSent, markApplied, markFailed } from "./queue";
import { calculateBackoffDelay, shouldRetry } from "./backoff";
import { useSyncStatus } from "./use-sync-status";

let isDraining = false;
let retryTimerId: number | null = null;

function clearRetryTimer(): void {
  if (typeof window === "undefined" || retryTimerId === null) return;
  window.clearTimeout(retryTimerId);
  retryTimerId = null;
}

function scheduleRetry(delayMs: number): void {
  if (typeof window === "undefined") return;
  clearRetryTimer();
  retryTimerId = window.setTimeout(() => {
    retryTimerId = null;
    void drainMutationQueue();
  }, delayMs);
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "server-node";
  let deviceId = localStorage.getItem("retrails_device_id");
  if (!deviceId) {
    deviceId = `dev-${crypto.randomUUID()}`;
    localStorage.setItem("retrails_device_id", deviceId);
  }
  return deviceId;
}

export async function drainMutationQueue(options?: {
  batchSize?: number;
  deviceId?: string;
}): Promise<{ processed: number; remaining: number }> {
  if (isDraining) return { processed: 0, remaining: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { processed: 0, remaining: 0 };
  }

  isDraining = true;
  useSyncStatus.getState().setDraining(true);
  clearRetryTimer();
  const limit = options?.batchSize ?? 20;
  const deviceId = options?.deviceId ?? getDeviceId();
  let processed = 0;

  try {
    while (true) {
      const batch = await peekBatch(limit);
      if (batch.length === 0) {
        useSyncStatus.getState().setLastSyncAt(new Date().toISOString());
        useSyncStatus.getState().setLastError(null);
        clearRetryTimer();
        return { processed, remaining: 0 };
      }

      const keys = batch.map((m) => m.idempotency_key);
      await markSent(keys);

      try {
        const response = await postSyncBatch({
          client_device_id: deviceId,
          mutations: batch,
        });

        const appliedKeys: string[] = [];
        const failedItems: Array<{ key: string; attempts: number; error: string }> = [];

        for (const res of response.results) {
          if (
            res.status === "applied" ||
            res.status === "duplicate_ignored" ||
            res.status === "conflict_resolved"
          ) {
            appliedKeys.push(res.idempotency_key);
          } else {
            const item = batch.find((m) => m.idempotency_key === res.idempotency_key);
            failedItems.push({
              key: res.idempotency_key,
              attempts: (item?.attempts ?? 0) + 1,
              error: `Server status: ${res.status}`,
            });
          }
        }

        await markApplied(appliedKeys);

        for (const failed of failedItems) {
          await markFailed(failed.key, failed.attempts, failed.error);
        }

        processed += appliedKeys.length;

        if (failedItems.length > 0) {
          const retryable = failedItems.filter((item) => shouldRetry(item.attempts));
          if (retryable.length > 0) {
            const retryDelay = Math.max(
              ...retryable.map((item) => calculateBackoffDelay(item.attempts))
            );
            useSyncStatus.getState().setLastError(retryable[0]?.error ?? null);
            scheduleRetry(retryDelay);
          } else {
            useSyncStatus.getState().setLastError(failedItems[0]?.error ?? null);
          }

          const remainingBatch = await peekBatch(1);
          if (remainingBatch.length === 0) {
            clearRetryTimer();
          }
          return { processed, remaining: remainingBatch.length };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        let maxRetryDelay = 0;
        let hasRetryable = false;

        for (const item of batch) {
          const attempts = item.attempts + 1;
          if (shouldRetry(attempts)) {
            hasRetryable = true;
            maxRetryDelay = Math.max(maxRetryDelay, calculateBackoffDelay(attempts));
            await markFailed(item.idempotency_key, attempts, errorMsg);
          } else {
            await markFailed(
              item.idempotency_key,
              attempts,
              `Max attempts reached: ${errorMsg}`
            );
          }
        }

        useSyncStatus.getState().setLastError(errorMsg);
        if (hasRetryable) {
          scheduleRetry(maxRetryDelay);
        }

        const remainingBatch = await peekBatch(1);
        if (remainingBatch.length === 0) {
          clearRetryTimer();
        }
        return { processed, remaining: remainingBatch.length };
      }
    }
  } finally {
    isDraining = false;
    useSyncStatus.getState().setDraining(false);
  }
}

export function isSyncingActive(): boolean {
  return isDraining;
}
