import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import {
  deferOrderMock,
  getDeferralAuditLogsMock,
  getDeferralsMock,
  getDeferralSummaryMock,
  requeueDeferralMock,
} from "./mock";
import type {
  DeferOrderRequest,
  DeferralAuditLog,
  DeferralFilters,
  DeferralSummary,
  DeferredOrder,
  RequeueRequest,
} from "./types";

export async function getDeferrals(
  filters: DeferralFilters = {},
  signal?: AbortSignal
): Promise<DeferredOrder[]> {
  if (shouldUseMock(ENDPOINTS.deferralsList.domain, ENDPOINTS.deferralsList.status)) {
    return getDeferralsMock(filters);
  }
  const params: Record<string, string | number | boolean | undefined> = {};
  if (filters.outlet_id) params.outlet_id = filters.outlet_id;
  if (filters.brand_id) params.brand_id = filters.brand_id;
  if (filters.date || filters.dispatch_date)
    params.date = filters.date || filters.dispatch_date;
  if (filters.reason && filters.reason !== "all") params.reason = filters.reason;
  if (filters.page) params.page = filters.page;
  if (filters.limit || filters.page_size)
    params.limit = filters.limit || filters.page_size;

  return apiClient<DeferredOrder[]>(ENDPOINTS.deferralsList.path, {
    method: ENDPOINTS.deferralsList.method,
    params,
    signal,
  });
}

export async function getDeferralSummary(
  filters: DeferralFilters = {},
  signal?: AbortSignal
): Promise<DeferralSummary> {
  if (
    shouldUseMock(ENDPOINTS.deferralsSummary.domain, ENDPOINTS.deferralsSummary.status)
  ) {
    return getDeferralSummaryMock(filters);
  }
  return apiClient<DeferralSummary>(ENDPOINTS.deferralsSummary.path, {
    method: ENDPOINTS.deferralsSummary.method,
    signal,
  });
}

export async function deferOrder(
  id: string,
  payload: DeferOrderRequest
): Promise<DeferralAuditLog> {
  if (
    shouldUseMock(
      ENDPOINTS.deferralsDeferOrder.domain,
      ENDPOINTS.deferralsDeferOrder.status
    )
  ) {
    return deferOrderMock(id, payload);
  }
  const path = ENDPOINTS.deferralsDeferOrder.path.replace("{id}", encodeURIComponent(id));
  return apiClient<DeferralAuditLog>(path, {
    method: ENDPOINTS.deferralsDeferOrder.method,
    body: payload,
  });
}

export async function requeueDeferral(
  id: string,
  payload?: RequeueRequest
): Promise<{ success: boolean; id: string }> {
  if (
    shouldUseMock(ENDPOINTS.deferralsRequeue.domain, ENDPOINTS.deferralsRequeue.status)
  ) {
    return requeueDeferralMock(id, payload);
  }
  const path = ENDPOINTS.deferralsRequeue.path.replace("{id}", encodeURIComponent(id));
  return apiClient<{ success: boolean; id: string }>(path, {
    method: ENDPOINTS.deferralsRequeue.method,
    body: payload ?? {},
  });
}

export async function getDeferralAuditLogs(
  filters: DeferralFilters = {},
  _signal?: AbortSignal
): Promise<DeferralAuditLog[]> {
  return getDeferralAuditLogsMock(filters);
}
