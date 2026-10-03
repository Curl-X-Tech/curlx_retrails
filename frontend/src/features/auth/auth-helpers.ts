import type { StaffRole } from "@/types/domain";
import type { UserProfile } from "@/api/auth";
import type { StaffUser } from "./types";

export const USER_STORAGE_KEY = "retrails_user";

export function normalizeRole(roleStr: string): StaffRole {
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

export function mapApiUserToStaffUser(apiUser: UserProfile): StaffUser {
  return {
    id: apiUser.id,
    name: apiUser.name || apiUser.email.split("@")[0],
    email: apiUser.email,
    role: normalizeRole(apiUser.user_type || apiUser.role),
    depotId: apiUser.depotId || "depot-peliyagoda",
    depotName: apiUser.depotName || "Peliyagoda Hub",
  };
}

export function getStoredUser(): StaffUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

export function persistUser(user: StaffUser | null): void {
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
