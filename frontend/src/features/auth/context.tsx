import * as React from "react";
import type { StaffRole } from "@/types/domain";
import {
  ApiError,
  fetchCurrentUser,
  getStoredToken,
  loginWithCredentials,
  removeStoredToken,
} from "@/lib/api";
import type { AuthContextType, LoginCredentials, StaffUser } from "./types";
import {
  getStoredUser,
  mapApiUserToStaffUser,
  persistUser,
} from "./auth-helpers";

export const AuthContext = React.createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<StaffUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = React.useState<boolean>(
    () => !getStoredUser() && !!getStoredToken()
  );

  const refreshUser = React.useCallback(async () => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token) {
      if (storedUser) {
        setUser(storedUser);
      } else {
        persistUser(null);
        setUser(null);
      }
      setIsLoading(false);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (storedUser) {
        setUser(storedUser);
      }
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3500);

    try {
      const apiUser = await fetchCurrentUser(token, controller.signal);
      window.clearTimeout(timeoutId);
      const mapped = mapApiUserToStaffUser(apiUser);
      setUser(mapped);
      persistUser(mapped);
    } catch (err: unknown) {
      window.clearTimeout(timeoutId);
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        removeStoredToken();
        persistUser(null);
        setUser(null);
      } else if (storedUser) {
        setUser(storedUser);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshUser();
    const handleOnline = () => refreshUser();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refreshUser]);

  const login = React.useCallback(
    async (param: StaffRole | LoginCredentials = "dispatcher") => {
      if (typeof param === "object" && "email" in param && "password" in param) {
        setIsLoading(true);
        try {
          await loginWithCredentials(param.email, param.password);
          const apiUser = await fetchCurrentUser();
          const mapped = mapApiUserToStaffUser(apiUser);
          setUser(mapped);
          persistUser(mapped);
        } finally {
          setIsLoading(false);
        }
      } else {
        const role = typeof param === "string" ? param : "dispatcher";
        const roleUser: StaffUser = {
          id: `usr-${role}`,
          name:
            role === "system_admin"
              ? "System Administrator"
              : role === "dispatcher"
                ? "K. Jayawardena"
                : role === "store_manager"
                  ? "Store Manager"
                  : role === "loader"
                    ? "Station Loader"
                    : "Delivery Driver",
          email: `${role.replace("_", ".")}@curlx.tech`,
          role,
          depotId: "depot-peliyagoda",
          depotName: "Peliyagoda Hub",
        };
        setUser(roleUser);
        persistUser(roleUser);
      }
    },
    []
  );

  const logout = React.useCallback(() => {
    removeStoredToken();
    persistUser(null);
    try {
      sessionStorage.clear();
    } catch {
      // SessionStorage error fallback
    }
    setUser(null);
  }, []);

  const value = React.useMemo<AuthContextType>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
