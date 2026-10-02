const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "curlx_retrails_auth_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore localStorage access failures
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore localStorage access failures
  }
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiUserResponse {
  id: string;
  email: string;
  name: string;
  user_type: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await fetch(`${API_URL}/auth/jwt/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    let errorDetail = "Login failed. Please check your credentials.";
    try {
      const err = await response.json();
      if (err?.detail) {
        errorDetail =
          typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // Fallback message
    }
    throw new Error(errorDetail);
  }

  const data: LoginResponse = await response.json();
  setStoredToken(data.access_token);
  return data;
}

export async function fetchCurrentUser(token?: string): Promise<ApiUserResponse> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No authentication token available.");
  }

  const response = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeStoredToken();
    }
    throw new Error(`Failed to fetch user profile (${response.status})`);
  }

  return response.json();
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Unable to request password reset.");
  }
}

export async function submitPasswordReset(
  token: string,
  password: string
): Promise<void> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to reset password. The link may have expired.");
  }
}
