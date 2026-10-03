import { create } from "zustand";

interface DispatcherUIState {
  selectedOrderRef: string | null;
  selectedAllocationId: string | null;
  isCargoListOpen: boolean;

  setSelectedOrderRef: (ref: string | null) => void;
  setSelectedAllocationId: (id: string | null) => void;
  setIsCargoListOpen: (open: boolean) => void;
}

export const useDispatcherUIStore = create<DispatcherUIState>((set) => ({
  selectedOrderRef: null,
  selectedAllocationId: null,
  isCargoListOpen: false,

  setSelectedOrderRef: (ref) => set({ selectedOrderRef: ref }),
  setSelectedAllocationId: (id) => set({ selectedAllocationId: id }),
  setIsCargoListOpen: (open) => set({ isCargoListOpen: open }),
}));

export const useSelectedOrderRef = () =>
  useDispatcherUIStore((s) => s.selectedOrderRef);
export const useSelectedAllocationId = () =>
  useDispatcherUIStore((s) => s.selectedAllocationId);
export const useIsCargoListOpen = () =>
  useDispatcherUIStore((s) => s.isCargoListOpen);
