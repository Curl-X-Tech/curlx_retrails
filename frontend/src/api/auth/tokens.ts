import type { Role } from "./types";

export const TOKEN_KEY = "curlx_retrails_auth_token";
export const REFRESH_TOKEN_KEY = "curlx_retrails_refresh_token";
export const TOKEN_EXPIRY_KEY = "curlx_retrails_token_expiry";

const MOBILE_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const DEFAULT_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 1 day

export function getStoredToken(): string | null {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiry && Number(expiry) < Date.now()) {
      clearAllAuthTokens();
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(
  token: string,
  options?: { role?: Role; expiresInSeconds?: number }
): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    const isMobileRole = options?.role === "driver" || options?.role === "loader";
    const durationMs = options?.expiresInSeconds
      ? options.expiresInSeconds * 1000
      : isMobileRole
        ? MOBILE_TOKEN_LIFETIME_MS
        : DEFAULT_TOKEN_LIFETIME_MS;
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + durationMs));
  } catch {
    // Storage quota fallback
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {
    // Storage fallback
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // Storage fallback
  }
}

export function removeRefreshToken(): void {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Storage fallback
  }
}

export function clearAllAuthTokens(): void {
  removeStoredToken();
  removeRefreshToken();
}
