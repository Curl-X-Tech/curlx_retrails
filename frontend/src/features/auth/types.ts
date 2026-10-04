import type { StaffRole } from "@/types/domain";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  depotId?: string;
  depotName?: string;
  outletId?: string;
  outletCode?: string;
  outletName?: string;
  location?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: StaffUser | null;
  role: StaffRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (param?: StaffRole | LoginCredentials) => Promise<void> | void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export type AuthViewState = "login" | "forgot" | "reset";
