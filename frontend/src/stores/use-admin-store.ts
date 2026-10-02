import { create } from "zustand";

export type AdminHubFilter = "ALL" | "PEL" | "KDY";
export type AdminBrandFilter = "ALL" | "FRESH" | "STYLE" | "TECH";

interface AdminState {
  selectedHub: AdminHubFilter;
  selectedBrand: AdminBrandFilter;
  searchQuery: string;
  selectedDate: string;
  isQuickActionModalOpen: boolean;
  activeQuickAction: "outlet" | "item" | "price" | "calendar" | null;

  setSelectedHub: (hub: AdminHubFilter) => void;
  setSelectedBrand: (brand: AdminBrandFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: string) => void;
  openQuickAction: (action: "outlet" | "item" | "price" | "calendar") => void;
  closeQuickAction: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  selectedHub: "ALL",
  selectedBrand: "ALL",
  searchQuery: "",
  selectedDate: new Date().toISOString().split("T")[0],
  isQuickActionModalOpen: false,
  activeQuickAction: null,

  setSelectedHub: (hub) => set({ selectedHub: hub }),
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  openQuickAction: (action) =>
    set({ isQuickActionModalOpen: true, activeQuickAction: action }),
  closeQuickAction: () => set({ isQuickActionModalOpen: false, activeQuickAction: null }),
}));
