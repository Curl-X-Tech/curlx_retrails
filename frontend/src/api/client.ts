import { ENDPOINTS, type ApiDomain, type EndpointStatus } from "./endpoints";
import {
  TOKEN_KEY,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from "./auth/tokens";

export { TOKEN_KEY, getStoredToken, setStoredToken, removeStoredToken };

export const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export function isDomainMocked(domain: ApiDomain | string): boolean {
  const flag = import.meta.env.VITE_USE_MOCKS;
  if (!flag || flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return flag
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .includes(domain.toLowerCase());
}

export function shouldUseMock(
  domain: ApiDomain | string,
  status: EndpointStatus
): boolean {
  return isDomainMocked(domain) || status === "pending";
}

export interface ClientRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
}

async function handleUnauthorized(): Promise<boolean> {
  if ((ENDPOINTS.authRefresh.status as string) === "live") {
    try {
      const res = await fetch(`${API_URL}${ENDPOINTS.authRefresh.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = res.ok ? await res.json() : null;
      if (data?.access_token) {
        setStoredToken(data.access_token);
        return true;
      }
    } catch {
      // Refresh failed
    }
  }
  removeStoredToken();
  return false;
}

export async function apiClient<T>(
  path: string,
  options: ClientRequestOptions = {}
): Promise<T> {
  const { body, token, params, headers: customHeaders, ...customOptions } = options;
  let url = path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "")
        searchParams.append(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const authToken = token || getStoredToken();
  const headers = new Headers(customHeaders);
  const isForm = body instanceof FormData || body instanceof URLSearchParams;

  if (!headers.has("Content-Type") && !isForm)
    headers.set("Content-Type", "application/json");
  if (authToken && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${authToken}`);

  const requestInit: RequestInit = { ...customOptions, headers };
  if (body !== undefined) {
    requestInit.body =
      isForm || typeof body === "string" ? (body as BodyInit) : JSON.stringify(body);
  }

  let response = await fetch(url, requestInit);

  if (response.status === 401) {
    const refreshed = await handleUnauthorized();
    if (refreshed) {
      const retryToken = getStoredToken();
      if (retryToken) headers.set("Authorization", `Bearer ${retryToken}`);
      response = await fetch(url, { ...requestInit, headers });
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let data: unknown;
    try {
      data = await response.json();
      if (data && typeof data === "object" && "detail" in data) {
        const d = (data as { detail: unknown }).detail;
        errorDetail = typeof d === "string" ? d : JSON.stringify(d);
      }
    } catch {
      // Fallback
    }
    throw new ApiError(response.status, errorDetail, data);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}
