import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS, type ApiEndpoint } from "@/api/endpoints";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export function resolvePath(endpoint: ApiEndpoint, params: Record<string, string> = {}) {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`{${key}}`, encodeURIComponent(value)),
    endpoint.path
  );
}

export function callEndpoint<T>(
  endpoint: ApiEndpoint,
  options: {
    path?: Record<string, string>;
    query?: QueryParams;
    body?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  return apiClient<T>(resolvePath(endpoint, options.path), {
    method: endpoint.method,
    params: options.query,
    body: options.body,
    signal: options.signal,
  });
}

export function isPending(endpoint: ApiEndpoint): boolean {
  return shouldUseMock(endpoint.domain, endpoint.status);
}

export { ENDPOINTS };
