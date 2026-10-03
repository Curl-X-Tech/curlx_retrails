import { create } from "zustand";

interface DriverUIState {
  currentWaypointIndex: number;
  expandedItemIds: string[];
  isFlagModalOpen: boolean;
  flaggedItemId: string | null;
  flagReason: string;
  isPodModalOpen: boolean;
  podMode: "signature" | "photo";

  setCurrentWaypointIndex: (index: number) => void;
  toggleExpandedItem: (itemId: string) => void;
  setExpandedItemIds: (itemIds: string[]) => void;
  openFlagModal: (itemId?: string) => void;
  closeFlagModal: () => void;
  setFlagReason: (reason: string) => void;
  openPodModal: () => void;
  closePodModal: () => void;
  setPodMode: (mode: "signature" | "photo") => void;
}

export const useDriverUIStore = create<DriverUIState>((set) => ({
  currentWaypointIndex: 0,
  expandedItemIds: [],
  isFlagModalOpen: false,
  flaggedItemId: null,
  flagReason: "Damaged crates on arrival",
  isPodModalOpen: false,
  podMode: "signature",

  setCurrentWaypointIndex: (index) => set({ currentWaypointIndex: index }),
  toggleExpandedItem: (itemId) =>
    set((state) => ({
      expandedItemIds: state.expandedItemIds.includes(itemId)
        ? state.expandedItemIds.filter((id) => id !== itemId)
        : [...state.expandedItemIds, itemId],
    })),
  setExpandedItemIds: (itemIds) => set({ expandedItemIds: itemIds }),
  openFlagModal: (itemId) =>
    set({ isFlagModalOpen: true, flaggedItemId: itemId || null }),
  closeFlagModal: () => set({ isFlagModalOpen: false, flaggedItemId: null }),
  setFlagReason: (reason) => set({ flagReason: reason }),
  openPodModal: () => set({ isPodModalOpen: true }),
  closePodModal: () => set({ isPodModalOpen: false }),
  setPodMode: (mode) => set({ podMode: mode }),
}));
