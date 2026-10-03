import { create } from "zustand";
import type { StoreOrderRecord } from "./types";

interface StoreUIState {
  activeDetailOrder: StoreOrderRecord | null;
  selectedOrderIds: string[];
  isPrintPreviewOpen: boolean;
  isSuccessModalOpen: boolean;

  setActiveDetailOrder: (order: StoreOrderRecord | null) => void;
  setSelectedOrderIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  toggleSelectOrderId: (id: string) => void;
  setIsPrintPreviewOpen: (open: boolean) => void;
  setIsSuccessModalOpen: (open: boolean) => void;
}

export const useStoreUIState = create<StoreUIState>((set) => ({
  activeDetailOrder: null,
  selectedOrderIds: [],
  isPrintPreviewOpen: false,
  isSuccessModalOpen: false,

  setActiveDetailOrder: (order) => set({ activeDetailOrder: order }),
  setSelectedOrderIds: (ids) =>
    set((state) => ({
      selectedOrderIds: typeof ids === "function" ? ids(state.selectedOrderIds) : ids,
    })),
  toggleSelectOrderId: (id) =>
    set((state) => ({
      selectedOrderIds: state.selectedOrderIds.includes(id)
        ? state.selectedOrderIds.filter((i) => i !== id)
        : [...state.selectedOrderIds, id],
    })),
  setIsPrintPreviewOpen: (open) => set({ isPrintPreviewOpen: open }),
  setIsSuccessModalOpen: (open) => set({ isSuccessModalOpen: open }),
}));

export const useActiveDetailOrder = () => useStoreUIState((s) => s.activeDetailOrder);
export const useSelectedStoreOrderIds = () => useStoreUIState((s) => s.selectedOrderIds);
