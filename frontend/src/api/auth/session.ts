import { db, type UserSessionRecord } from "@/lib/dexie-db";
import type { UserProfile, Role } from "./types";

const CURRENT_USER_SESSION_ID = "current_user";

export async function cacheSessionInDexie(profile: UserProfile): Promise<void> {
  try {
    const record: UserSessionRecord = {
      id: CURRENT_USER_SESSION_ID,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      userType: profile.user_type || profile.role,
      depotId: profile.depotId,
      depotName: profile.depotName,
      isActive: profile.is_active,
      isVerified: profile.is_verified,
      cachedAt: new Date().toISOString(),
    };
    await db.userSessions.put(record);
  } catch {
    // Dexie offline fallback
  }
}

export async function getCachedSessionFromDexie(): Promise<UserProfile | null> {
  try {
    const record = await db.userSessions.get(CURRENT_USER_SESSION_ID);
    if (!record) return null;
    return {
      id: record.id === CURRENT_USER_SESSION_ID ? "offline-user" : record.id,
      email: record.email,
      name: record.name,
      role: record.role as Role,
      user_type: record.userType || record.role,
      is_active: record.isActive ?? true,
      is_verified: record.isVerified ?? true,
      is_superuser: record.role === "system_admin",
      created_at: record.cachedAt,
      updated_at: record.cachedAt,
      depotId: record.depotId,
      depotName: record.depotName,
    };
  } catch {
    return null;
  }
}

export async function clearSessionFromDexie(): Promise<void> {
  try {
    await db.userSessions.delete(CURRENT_USER_SESSION_ID);
  } catch {
    // Dexie clear fallback
  }
}
