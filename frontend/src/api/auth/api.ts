import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { setStoredToken, clearAllAuthTokens } from "./tokens";
import {
  cacheSessionInDexie,
  clearSessionFromDexie,
  getCachedSessionFromDexie,
} from "./session";
import { mockRefreshToken } from "./mock";
import type {
  LoginCredentials,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  GuardResponse,
  UserProfile,
  UpdateProfilePayload,
  Role,
} from "./types";

function normalizeRole(roleStr?: string): Role {
  const lower = (roleStr || "").toLowerCase();
  if (
    lower === "system_admin" ||
    lower === "dispatcher" ||
    lower === "loader" ||
    lower === "driver" ||
    lower === "store_manager"
  ) {
    return lower as Role;
  }
  return "dispatcher";
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const body = new URLSearchParams();
  const username = credentials.username || credentials.email || "";
  body.append("username", username);
  body.append("password", credentials.password);

  const res = await apiClient<LoginResponse>(ENDPOINTS.authLogin.path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const estimatedRole = username.includes("admin")
    ? "system_admin"
    : username.includes("driver")
      ? "driver"
      : username.includes("loader")
        ? "loader"
        : username.includes("store")
          ? "store_manager"
          : "dispatcher";

  setStoredToken(res.access_token, { role: estimatedRole });
  return res;
}

export async function logout(): Promise<void> {
  try {
    await apiClient<void>(ENDPOINTS.authLogout.path, { method: "POST" });
  } catch {
    // Graceful logout
  } finally {
    clearAllAuthTokens();
    await clearSessionFromDexie();
  }
}

export async function refreshToken(
  payload?: RefreshTokenRequest
): Promise<RefreshTokenResponse> {
  if (shouldUseMock(ENDPOINTS.authRefresh.domain, ENDPOINTS.authRefresh.status)) {
    const mockRes = await mockRefreshToken(payload);
    setStoredToken(mockRes.access_token);
    return mockRes;
  }
  const res = await apiClient<RefreshTokenResponse>(ENDPOINTS.authRefresh.path, {
    method: "POST",
    body: payload,
  });
  setStoredToken(res.access_token);
  return res;
}

export async function forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
  await apiClient<void>(ENDPOINTS.authForgotPassword.path, {
    method: "POST",
    body: payload,
  });
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient<void>(ENDPOINTS.authResetPassword.path, {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentUser(signal?: AbortSignal): Promise<UserProfile> {
  try {
    const raw = await apiClient<Record<string, unknown>>(ENDPOINTS.usersMe.path, {
      method: "GET",
      signal,
    });
    const profile: UserProfile = {
      id: String(raw.id || ""),
      email: String(raw.email || ""),
      name: String(raw.name || (raw.email as string)?.split("@")[0] || "User"),
      role: normalizeRole(raw.user_type as string),
      user_type: String(raw.user_type || ""),
      is_active: Boolean(raw.is_active ?? true),
      is_verified: Boolean(raw.is_verified ?? true),
      is_superuser: Boolean(raw.is_superuser ?? false),
      created_at: String(raw.created_at || new Date().toISOString()),
      updated_at: String(raw.updated_at || new Date().toISOString()),
      created_by: (raw.created_by as string) || null,
      updated_by: (raw.updated_by as string) || null,
      depotId: "depot-peliyagoda",
      depotName: "Peliyagoda Hub",
    };
    setStoredToken(localStorage.getItem("curlx_retrails_auth_token") || "", {
      role: profile.role,
    });
    await cacheSessionInDexie(profile);
    return profile;
  } catch (err) {
    const cached = await getCachedSessionFromDexie();
    if (cached) return cached;
    throw err;
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const raw = await apiClient<Record<string, unknown>>(ENDPOINTS.usersUpdateMe.path, {
    method: "PATCH",
    body: payload,
  });
  const profile: UserProfile = {
    id: String(raw.id || ""),
    email: String(raw.email || ""),
    name: String(raw.name || "User"),
    role: normalizeRole(raw.user_type as string),
    user_type: String(raw.user_type || ""),
    is_active: Boolean(raw.is_active ?? true),
    is_verified: Boolean(raw.is_verified ?? true),
    is_superuser: Boolean(raw.is_superuser ?? false),
    created_at: String(raw.created_at || new Date().toISOString()),
    updated_at: String(raw.updated_at || new Date().toISOString()),
    created_by: (raw.created_by as string) || null,
    updated_by: (raw.updated_by as string) || null,
  };
  await cacheSessionInDexie(profile);
  return profile;
}

export async function checkAdminGuard(): Promise<GuardResponse> {
  return apiClient<GuardResponse>(ENDPOINTS.guardAdminOnly.path, { method: "GET" });
}

export async function checkStoreManagerGuard(): Promise<GuardResponse> {
  return apiClient<GuardResponse>(ENDPOINTS.guardStoreManager.path, { method: "GET" });
}

export async function checkDriverGuard(): Promise<GuardResponse> {
  return apiClient<GuardResponse>(ENDPOINTS.guardDriver.path, { method: "GET" });
}
