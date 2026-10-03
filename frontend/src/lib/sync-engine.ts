import { count, enqueue } from "@/sync/queue";
import { drainMutationQueue, isSyncingActive } from "@/sync/drain";
import type { EntityType, MutationAction } from "@/api/sync/types";

export type SyncState = "online" | "offline" | "syncing" | "synced" | "error";

type SyncListener = (state: SyncState, pendingCount: number) => void;

class OfflineSyncEngine {
  private isOnlineState: boolean =
    typeof navigator !== "undefined" ? navigator.onLine : true;
  private listeners: Set<SyncListener> = new Set();
  private syncIntervalId: number | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);

      this.syncIntervalId = window.setInterval(() => {
        if (this.isOnlineState && !isSyncingActive()) {
          this.drainMutationQueue();
        }
      }, 15000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
      if (this.syncIntervalId !== null) {
        window.clearInterval(this.syncIntervalId);
        this.syncIntervalId = null;
      }
    }
  }

  public get isOnline(): boolean {
    return this.isOnlineState;
  }

  private handleOnline = () => {
    this.isOnlineState = true;
    this.notify();
    this.drainMutationQueue();
  };

  private handleOffline = () => {
    this.isOnlineState = false;
    this.notify();
  };

  private async notify() {
    const pendingCount = await count();
    const isSyncing = isSyncingActive();

    const currentState: SyncState = !this.isOnlineState
      ? "offline"
      : isSyncing
        ? "syncing"
        : pendingCount > 0
          ? "online"
          : "synced";

    this.listeners.forEach((listener) => listener(currentState, pendingCount));
  }

  public async queueMutation(
    tripId: string,
    entityType: string,
    actionType: string,
    payload: Record<string, unknown>
  ): Promise<number> {
    const entity_type: EntityType =
      entityType === "item"
        ? "loading_checklist"
        : entityType === "stop" || entityType === "trip"
          ? "route_leg"
          : entityType === "telemetry"
            ? "telemetry"
            : entityType === "order"
              ? "order"
              : "route_leg";

    const action: MutationAction =
      actionType === "VERIFY_ITEM"
        ? "verify"
        : actionType === "CREATE_ORDER" || actionType === "TELEMETRY_PING"
          ? "create"
          : "update";

    const id = await enqueue({
      idempotency_key: (payload.idempotency_key as string) || crypto.randomUUID(),
      entity_type,
      action,
      payload: { trip_id: tripId, ...payload },
      client_timestamp: new Date().toISOString(),
    });

    this.notify();

    if (this.isOnlineState && !isSyncingActive()) {
      this.drainMutationQueue();
    }

    return id;
  }

  public async drainMutationQueue(): Promise<void> {
    if (!this.isOnlineState) return;

    this.notify();
    try {
      await drainMutationQueue();
    } finally {
      this.notify();
    }
  }
}

export const syncEngine = new OfflineSyncEngine();
