import * as React from "react";
import type { StaffRole } from "@/types/domain";
import {
  fetchCurrentUser,
  getStoredToken,
  loginWithCredentials,
  removeStoredToken,
  type ApiUserResponse,
} from "@/lib/api";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  depotId?: string;
  depotName?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: StaffUser | null;
  role: StaffRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (param?: StaffRole | LoginCredentials) => Promise<void> | void;
  logout: () => void;
  setRole: (role: StaffRole) => void;
  refreshUser: () => Promise<void>;
}

const defaultUser: StaffUser = {
  id: "usr-01",
  name: "K. Jayawardena",
  email: "k.jayawardena@curlx.lk",
  role: "dispatcher",
  depotId: "depot-peliyagoda",
  depotName: "Peliyagoda Hub",
};

function normalizeRole(roleStr: string): StaffRole {
  const lower = roleStr.toLowerCase();
  if (
    lower === "system_admin" ||
    lower === "dispatcher" ||
    lower === "loader" ||
    lower === "driver" ||
    lower === "store_manager"
  ) {
    return lower as StaffRole;
  }
  return "dispatcher";
}

function mapApiUserToStaffUser(apiUser: ApiUserResponse): StaffUser {
  return {
    id: apiUser.id,
    name: apiUser.name || apiUser.email.split("@")[0],
    email: apiUser.email,
    role: normalizeRole(apiUser.user_type),
    depotId: "depot-peliyagoda",
    depotName: "Peliyagoda Hub",
  };
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<StaffUser | null>(defaultUser);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const refreshUser = React.useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const apiUser = await fetchCurrentUser(token);
      setUser(mapApiUserToStaffUser(apiUser));
    } catch {
      // Fall back to default local user if offline or development mode
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = React.useCallback(
    async (param: StaffRole | LoginCredentials = "dispatcher") => {
      if (typeof param === "object" && "email" in param && "password" in param) {
        setIsLoading(true);
        try {
          await loginWithCredentials(param.email, param.password);
          const apiUser = await fetchCurrentUser();
          setUser(mapApiUserToStaffUser(apiUser));
        } finally {
          setIsLoading(false);
        }
      } else {
        const role = typeof param === "string" ? param : "dispatcher";
        setUser({
          ...defaultUser,
          role,
        });
      }
    },
    []
  );

  const logout = React.useCallback(() => {
    removeStoredToken();
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
      isLoading,
      login,
      logout,
      setRole,
      refreshUser,
    }),
    [user, isLoading, login, logout, setRole, refreshUser]
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
