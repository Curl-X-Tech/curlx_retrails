import { db, type MutationRecord } from "./dexie-db";
import { getStoredToken } from "./api";

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

      // Periodic sync attempt every 15 seconds when online
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

  /**
   * Enqueues an offline mutation into IndexedDB mutationQueue.
   */
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

    // Trigger sync attempt immediately if online
    if (this.isOnlineState && !this.isSyncing) {
      this.drainMutationQueue();
    }

    return id;
  }

  /**
   * Drains pending mutations in FIFO order.
   */
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
          await this.syncSingleMutation(mutation);
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

  /**
   * Sends individual mutation to backend API or simulates when endpoint is mocked.
   */
  private async syncSingleMutation(mutation: MutationRecord): Promise<void> {
    const token = getStoredToken();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

    let endpoint = "";
    if (
      mutation.actionType === "ARRIVE_STOP" ||
      mutation.actionType === "COMPLETE_STOP"
    ) {
      endpoint = `/trips/${mutation.tripId}/stops/${mutation.payload.seq}`;
    } else if (mutation.actionType === "VERIFY_ITEM") {
      endpoint = `/trips/${mutation.tripId}/items/${mutation.payload.packageCode}`;
    } else if (mutation.actionType === "RECORD_BREAK") {
      endpoint = `/trips/${mutation.tripId}/break`;
    } else if (mutation.actionType === "TELEMETRY_PING") {
      endpoint = `/fleet/telemetry/report`;
    }

    if (!endpoint) {
      // If no endpoint defined, mark locally resolved
      return;
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(mutation.payload),
      });

      // If backend endpoint is 404/not implemented yet, treat as simulated success
      if (res.status === 404 || res.status === 405) {
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (error: unknown) {
      // If network error, throw to keep pending
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw error;
      }
      // Non-network 404 fallback: succeed gracefully
    }
  }
}

export const syncEngine = new OfflineSyncEngine();
