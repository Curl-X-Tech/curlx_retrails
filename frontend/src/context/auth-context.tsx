import * as React from "react";
import type { StaffRole } from "@/types/domain";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  depotId?: string;
  depotName?: string;
}

interface AuthContextType {
  user: StaffUser | null;
  role: StaffRole | null;
  isAuthenticated: boolean;
  login: (role?: StaffRole) => void;
  logout: () => void;
  setRole: (role: StaffRole) => void;
}

const defaultUser: StaffUser = {
  id: "usr-01",
  name: "K. Jayawardena",
  email: "k.jayawardena@curlx.lk",
  role: "dispatcher",
  depotId: "depot-peliyagoda",
  depotName: "Peliyagoda Hub",
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<StaffUser | null>(defaultUser);

  const login = React.useCallback((role: StaffRole = "dispatcher") => {
    setUser({
      ...defaultUser,
      role,
    });
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
  }, []);

  const setRole = React.useCallback((role: StaffRole) => {
    setUser((prev) => (prev ? { ...prev, role } : null));
  }, []);

  const value = React.useMemo<AuthContextType>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      login,
      logout,
      setRole,
    }),
    [user, login, logout, setRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
