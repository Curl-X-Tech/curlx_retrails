import {
  apiClient,
  ApiError,
  API_URL,
  TOKEN_KEY,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  type ClientRequestOptions,
} from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";

export {
  API_URL,
  TOKEN_KEY,
  ApiError,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
};

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

export function getAuthHeaders(token?: string): Record<string, string> {
  const authToken = token || getStoredToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  return headers;
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const data = await apiClient<LoginResponse>(ENDPOINTS.authLogin.path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  setStoredToken(data.access_token);
  return data;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient<void>(ENDPOINTS.authForgotPassword.path, {
    method: "POST",
    body: { email },
  });
}

export async function submitPasswordReset(
  token: string,
  password: string
): Promise<void> {
  await apiClient<void>(ENDPOINTS.authResetPassword.path, {
    method: "POST",
    body: { token, password },
  });
}

export async function fetchCurrentUser(
  token?: string,
  signal?: AbortSignal
): Promise<ApiUserResponse> {
  return apiClient<ApiUserResponse>(ENDPOINTS.usersMe.path, {
    method: "GET",
    token,
    signal,
  });
}

export async function listUsersByAdmin(token?: string): Promise<ApiUserResponse[]> {
  return apiClient<ApiUserResponse[]>(ENDPOINTS.usersList.path, { method: "GET", token });
}

export async function createUserByAdmin(
  payload: UserCreatePayload,
  token?: string
): Promise<ApiUserResponse> {
  return apiClient<ApiUserResponse>(ENDPOINTS.usersCreate.path, {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateUserById(
  id: string,
  payload: UserUpdatePayload,
  token?: string
): Promise<ApiUserResponse> {
  return apiClient<ApiUserResponse>(`/users/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function deleteUserById(id: string, token?: string): Promise<void> {
  await apiClient<void>(`/users/${id}`, { method: "DELETE", token });
}

export async function apiRequest<T>(
  endpoint: string,
  options: ClientRequestOptions = {}
): Promise<T> {
  return apiClient<T>(endpoint, options);
}
