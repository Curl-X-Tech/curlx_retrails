const API_URL = import.meta.env.VITE_API_URL || "/api/v1";
const TOKEN_KEY = "curlx_retrails_auth_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string): void {
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

export interface UserCreatePayload {
  email: string;
  name: string;
  user_type: string;
  password: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  name?: string;
  user_type?: string;
  password?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface GuardCheckResponse {
  message: string;
  user_id: string;
}

export interface HealthCheckResponse {
  status: string;
}

export interface RootResponse {
  message: string;
}

function getAuthHeaders(token?: string): Record<string, string> {
  const authToken = token || getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
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

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function fetchCurrentUser(
  token?: string,
  signal?: AbortSignal
): Promise<ApiUserResponse> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new ApiError(401, "No authentication token available.");
  }

  const response = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: getAuthHeaders(authToken),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeStoredToken();
    }
    throw new ApiError(
      response.status,
      `Failed to fetch user profile (${response.status})`
    );
  }

  return response.json();
}


export async function listUsersByAdmin(token?: string): Promise<ApiUserResponse[]> {
  const response = await fetch(`${API_URL}/users`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Failed to list users (${response.status})`);
  }

  return response.json();
}

export async function createUserByAdmin(
  payload: UserCreatePayload,
  token?: string
): Promise<ApiUserResponse> {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = "Failed to create user.";
    try {
      const err = await response.json();
      if (err?.detail) {
        errorDetail =
          typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}


export async function updateUserById(
  id: string,
  payload: UserUpdatePayload,
  token?: string
): Promise<ApiUserResponse> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = "Failed to update user.";
    try {
      const err = await response.json();
      if (err?.detail) {
        errorDetail =
          typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function deleteUserById(id: string, token?: string): Promise<void> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok && response.status !== 204) {
    let errorDetail = "Failed to delete user.";
    try {
      const err = await response.json();
      if (err?.detail) {
        errorDetail =
          typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }
}

export async function checkAdminOnlyGuard(token?: string): Promise<GuardCheckResponse> {
  const response = await fetch(`${API_URL}/guards/admin-only`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Admin guard check failed (${response.status})`);
  }

  return response.json();
}

export async function checkStoreManagerGuard(
  token?: string
): Promise<GuardCheckResponse> {
  const response = await fetch(`${API_URL}/guards/store-manager`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Store manager guard check failed (${response.status})`);
  }

  return response.json();
}

export async function checkDriverGuard(token?: string): Promise<GuardCheckResponse> {
  const response = await fetch(`${API_URL}/guards/driver`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Driver guard check failed (${response.status})`);
  }

  return response.json();
}

export async function checkHealth(): Promise<HealthCheckResponse> {
  const rootBase = API_URL.replace(/\/api\/v1\/?$/, "");
  const response = await fetch(`${rootBase}/health`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`);
  }

  return response.json();
}

export async function checkRoot(): Promise<RootResponse> {
  const rootBase = API_URL.replace(/\/api\/v1\/?$/, "");
  const response = await fetch(`${rootBase}/`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Root check failed (${response.status})`);
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
