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

export {
  API_URL,
  TOKEN_KEY,
  ApiError,
  apiClient,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
};

export function getAuthHeaders(token?: string): Record<string, string> {
  const authToken = token || getStoredToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  return headers;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ClientRequestOptions = {}
): Promise<T> {
  return apiClient<T>(endpoint, options);
}
