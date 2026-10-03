import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { getCurrentRouteMock } from "./mock";
import type { CurrentRoute } from "./types";

export async function getCurrentRoute(signal?: AbortSignal): Promise<CurrentRoute> {
  const ep = ENDPOINTS.driverCurrentRoute;
  if (shouldUseMock(ep.domain, ep.status)) {
    return getCurrentRouteMock();
  }
  return apiClient<CurrentRoute>(ep.path, {
    method: ep.method,
    signal,
  });
}
