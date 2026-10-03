import { db } from "@/lib/dexie-db";
import type { QueuedMutation, EntityType, MutationStatus } from "@/api/sync/types";
import { requestSyncDrain } from "./events";
import { useSyncStatus } from "./use-sync-status";

export type EnqueuePayload = Omit<
  QueuedMutation,
  "created_seq" | "status" | "attempts" | "user_id"
> &
  Partial<
    Pick<
      QueuedMutation,
      "status" | "attempts" | "idempotency_key" | "client_timestamp" | "user_id"
    >
  >;

export async function enqueue(mutation: EnqueuePayload): Promise<number> {
  const record: QueuedMutation = {
    idempotency_key: mutation.idempotency_key || crypto.randomUUID(),
    entity_type: mutation.entity_type,
    action: mutation.action,
    payload: mutation.payload,
    client_timestamp: mutation.client_timestamp || new Date().toISOString(),
    user_id: mutation.user_id || "",
    status: mutation.status || "queued",
    attempts: mutation.attempts ?? 0,
    last_error: mutation.last_error ?? null,
  };

  const id = await db.mutationQueue.add(record);
  await refreshSyncQueueCounts();
  requestSyncDrain("enqueue");
  return id;
}

export async function peekBatch(limit = 20): Promise<QueuedMutation[]> {
  const records = await db.mutationQueue
    .where("status")
    .anyOf(["queued", "failed"] as MutationStatus[])
    .sortBy("created_seq");
  return records.slice(0, limit);
}

export async function markSent(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await db.mutationQueue
    .where("idempotency_key")
    .anyOf(keys)
    .modify({ status: "sending" });
  await refreshSyncQueueCounts();
}

export async function markApplied(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await db.mutationQueue.where("idempotency_key").anyOf(keys).delete();
  await refreshSyncQueueCounts();
}

export async function markFailed(
  key: string,
  attempts: number,
  error: string
): Promise<void> {
  await db.mutationQueue
    .where("idempotency_key")
    .equals(key)
    .modify({ status: "failed", attempts, last_error: error });
  await refreshSyncQueueCounts();
}

export async function retryMutation(idempotencyKey: string): Promise<void> {
  await db.mutationQueue
    .where("idempotency_key")
    .equals(idempotencyKey)
    .modify({ status: "queued", last_error: null });
  await refreshSyncQueueCounts();
  requestSyncDrain("retry");
}

export async function count(): Promise<number> {
  return db.mutationQueue
    .where("status")
    .anyOf(["queued", "sending", "failed"] as MutationStatus[])
    .count();
}

export async function refreshSyncQueueCounts(): Promise<void> {
  const [queueCount, blockedCount] = await Promise.all([
    db.mutationQueue
      .where("status")
      .anyOf(["queued", "sending"] as MutationStatus[])
      .count(),
    db.mutationQueue.where("status").equals("failed").count(),
  ]);

  useSyncStatus.setState({ queueCount, blockedCount });
}

export async function listByEntity(entityType: EntityType): Promise<QueuedMutation[]> {
  return db.mutationQueue.where("entity_type").equals(entityType).sortBy("created_seq");
}
