import {
  API_URL,
  getStoredToken,
  removeStoredToken,
  getAuthHeaders,
  ApiError,
} from "./api-token";
import type { ApiUserResponse, UserCreatePayload, UserUpdatePayload } from "./api-types";

export type { ApiUserResponse, UserCreatePayload, UserUpdatePayload };

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
