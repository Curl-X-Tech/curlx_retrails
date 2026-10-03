import * as React from "react";
import { count } from "./queue";
import { drainMutationQueue, isSyncingActive } from "./drain";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  triggerSync: () => Promise<void>;
}

export function useSyncStatus(): SyncStatus {
  const [isOnline, setIsOnline] = React.useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = React.useState<number>(0);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);

  const refreshCount = React.useCallback(async () => {
    try {
      const c = await count();
      setPendingCount(c);
      setIsSyncing(isSyncingActive());
    } catch {
      // Ignore count error if DB is busy
    }
  }, []);

  const triggerSync = React.useCallback(async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      const { processed } = await drainMutationQueue();
      if (processed > 0) {
        setLastSyncedAt(new Date().toISOString());
      }
    } finally {
      setIsSyncing(false);
      await refreshCount();
    }
  }, [isOnline, refreshCount]);

  React.useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
      refreshCount();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    const intervalId = setInterval(() => {
      refreshCount();
      if (isOnline && !isSyncingActive()) {
        triggerSync();
      }
    }, 10000);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
      clearInterval(intervalId);
    };
  }, [isOnline, refreshCount, triggerSync]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    triggerSync,
  };
}
