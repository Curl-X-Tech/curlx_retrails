import { postSyncBatch } from "@/api/sync/api";
import { peekBatch, markSent, markApplied, markFailed } from "./queue";
import { shouldRetry } from "./backoff";

let isDraining = false;

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
  const limit = options?.batchSize ?? 20;
  const deviceId = options?.deviceId ?? getDeviceId();

  try {
    const batch = await peekBatch(limit);
    if (batch.length === 0) {
      return { processed: 0, remaining: 0 };
    }

    const keys = batch.map((m) => m.idempotency_key);
    await markSent(keys);

    try {
      const response = await postSyncBatch({
        client_device_id: deviceId,
        mutations: batch,
      });

      const appliedKeys: string[] = [];
      const failedMap = new Map<string, string>();

      for (const res of response.results) {
        if (
          res.status === "applied" ||
          res.status === "duplicate_ignored" ||
          res.status === "conflict_resolved"
        ) {
          appliedKeys.push(res.idempotency_key);
        } else {
          failedMap.set(res.idempotency_key, `Server status: ${res.status}`);
        }
      }

      await markApplied(appliedKeys);

      for (const [key, errorMsg] of failedMap.entries()) {
        const item = batch.find((m) => m.idempotency_key === key);
        const attempts = (item?.attempts ?? 0) + 1;
        await markFailed(key, attempts, errorMsg);
      }

      const remainingBatch = await peekBatch(1);
      return {
        processed: appliedKeys.length,
        remaining: remainingBatch.length,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      for (const item of batch) {
        const attempts = item.attempts + 1;
        if (shouldRetry(attempts)) {
          await markFailed(item.idempotency_key, attempts, errorMsg);
        } else {
          await markFailed(
            item.idempotency_key,
            attempts,
            `Max attempts reached: ${errorMsg}`
          );
        }
      }
      return { processed: 0, remaining: batch.length };
    }
  } finally {
    isDraining = false;
  }
}

export function isSyncingActive(): boolean {
  return isDraining;
}
