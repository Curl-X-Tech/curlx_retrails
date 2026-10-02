import * as React from "react";
import type { StaffRole } from "@/types/domain";
import {
  ApiError,
  fetchCurrentUser,
  getStoredToken,
  loginWithCredentials,
  removeStoredToken,
  type ApiUserResponse,
} from "@/lib/api";

const USER_STORAGE_KEY = "retrails_user";

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
  refreshUser: () => Promise<void>;
}

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

function getStoredUser(): StaffUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

function persistUser(user: StaffUser | null) {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // LocalStorage write error fallback
  }
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<StaffUser | null>(() => getStoredUser());
  // If stored user exists, don't block the screen with full-page spinner (0ms instant launch)
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

    // If browser is currently offline, preserve local session immediately without network wait
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (storedUser) {
        setUser(storedUser);
      }
      setIsLoading(false);
      return;
    }

    // Timeout network revalidation after 3.5s to prevent hanging on slow/spotty mobile connections
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
      // If 401 or 403, token is strictly invalidated
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        removeStoredToken();
        persistUser(null);
        setUser(null);
      } else {
        // Slow network timeout, connection drop, or server downtime - preserve cached user immediately
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshUser();

    const handleOnline = () => {
      refreshUser();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
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

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
