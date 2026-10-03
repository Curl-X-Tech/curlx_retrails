import { getStoredToken, removeStoredToken, ApiError } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, token, params, headers: customHeaders, ...customOptions } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const authToken = token || getStoredToken();
  const headers = new Headers(customHeaders);

  if (!headers.has("Content-Type") && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const requestInit: RequestInit = {
    ...customOptions,
    headers,
  };

  if (body !== undefined) {
    requestInit.body =
      body instanceof FormData || typeof body === "string"
        ? body
        : JSON.stringify(body);
  }

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    if (response.status === 401) {
      removeStoredToken();
    }

    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) {
        errorMessage =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      } else if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Fallback
    }

    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
