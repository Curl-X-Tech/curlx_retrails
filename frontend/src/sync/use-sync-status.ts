import { create } from "zustand";

interface SyncStatusState {
  online: boolean;
  draining: boolean;
  queueCount: number;
  blockedCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  setOnline: (online: boolean) => void;
  setDraining: (draining: boolean) => void;
  setCounts: (counts: Pick<SyncStatusState, "queueCount" | "blockedCount">) => void;
  setLastSyncAt: (lastSyncAt: string | null) => void;
  setLastError: (lastError: string | null) => void;
}

export const useSyncStatus = create<SyncStatusState>((set) => ({
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  draining: false,
  queueCount: 0,
  blockedCount: 0,
  lastSyncAt: null,
  lastError: null,
  setOnline: (online) => set({ online }),
  setDraining: (draining) => set({ draining }),
  setCounts: (counts) => set(counts),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setLastError: (lastError) => set({ lastError }),
}));
