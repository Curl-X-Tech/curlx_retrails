import { db, type MutationRecord } from "./dexie-db";
import { syncSingleMutation } from "./sync-mutation-handler";

export type SyncState = "online" | "offline" | "syncing" | "synced" | "error";

type SyncListener = (state: SyncState, pendingCount: number) => void;

class OfflineSyncEngine {
  private isOnlineState: boolean =
    typeof navigator !== "undefined" ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncListener> = new Set();
  private syncIntervalId: number | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);

      this.syncIntervalId = window.setInterval(() => {
        if (this.isOnlineState && !this.isSyncing) {
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
    const pendingCount = await db.mutationQueue
      .where("syncStatus")
      .equals("pending")
      .count();

    const currentState: SyncState = !this.isOnlineState
      ? "offline"
      : this.isSyncing
        ? "syncing"
        : pendingCount > 0
          ? "online"
          : "synced";

    this.listeners.forEach((listener) => listener(currentState, pendingCount));
  }

  public async queueMutation(
    tripId: string,
    entityType: MutationRecord["entityType"],
    actionType: string,
    payload: Record<string, unknown>
  ): Promise<number> {
    const id = await db.mutationQueue.add({
      tripId,
      entityType,
      actionType,
      payload,
      timestamp: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    });

    this.notify();

    if (this.isOnlineState && !this.isSyncing) {
      this.drainMutationQueue();
    }

    return id;
  }

  public async drainMutationQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnlineState) return;

    this.isSyncing = true;
    this.notify();

    try {
      const pendingMutations = await db.mutationQueue
        .where("syncStatus")
        .equals("pending")
        .sortBy("timestamp");

      for (const mutation of pendingMutations) {
        if (!this.isOnlineState) break;

        try {
          await syncSingleMutation(mutation);
          await db.mutationQueue.update(mutation.id!, {
            syncStatus: "synced",
          });
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const newRetryCount = (mutation.retryCount || 0) + 1;
          await db.mutationQueue.update(mutation.id!, {
            retryCount: newRetryCount,
            errorMessage: errorMsg,
            syncStatus: newRetryCount > 5 ? "failed" : "pending",
          });
        }
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }
}

export const syncEngine = new OfflineSyncEngine();
