import { MOCK_USERS_SEED, type MockUserWithMeta } from "@/data/mock-users";
import type { UserCreate } from "@/api/users";

const LOCAL_USERS_KEY = "retrails_cached_users_v1";

export function getLocalUsers(): MockUserWithMeta[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse errors
  }
  return MOCK_USERS_SEED;
}

export function saveLocalUsers(users: MockUserWithMeta[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage write errors
  }
}

export function createSimulatedUser(
  payload: UserCreate & {
    department?: string;
    phone?: string;
    location?: string;
  }
): MockUserWithMeta {
  return {
    id: `u-${Date.now()}`,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    user_type: payload.user_type || "dispatcher",
    is_active: payload.is_active ?? true,
    is_verified: payload.is_verified ?? true,
    is_superuser: payload.user_type === "system_admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    department: payload.department || "Operations",
    phone: payload.phone || "+94 77 000 0000",
    location: payload.location || "Colombo HQ",
  };
}
