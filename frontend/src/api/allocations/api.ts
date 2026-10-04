import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import {
  allocateOrdersManuallyMock,
  optimizeAllocationsMock,
  confirmAllocationMock,
  getAllocationDetailMock,
  getAllocationKpisMock,
  getAllocationsMock,
} from "./mock";
import type {
  AllocationDetail,
  AllocationFilters,
  AllocationKpis,
  AllocationSummary,
  ConfirmAllocationResponse,
  ManualAllocateRequest,
  ManualAllocateResponse,
  OptimizeRequest,
  OptimizeResponse,
} from "./types";

export async function getAllocations(
  filters: AllocationFilters = {},
  signal?: AbortSignal
): Promise<AllocationSummary[]> {
  if (shouldUseMock(ENDPOINTS.allocationsList.domain, ENDPOINTS.allocationsList.status)) {
    return getAllocationsMock(filters);
  }
  const params: Record<string, string | number | boolean | undefined> = {};
  if (filters.dispatch_date) params.dispatch_date = filters.dispatch_date;
  if (filters.depot_id) params.depot_id = filters.depot_id;
  if (filters.brand_id) params.brand_id = filters.brand_id;
  if (filters.district_id) params.district_id = filters.district_id;
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  return apiClient<AllocationSummary[]>(ENDPOINTS.allocationsList.path, {
    method: ENDPOINTS.allocationsList.method,
    params,
    signal,
  });
}

export async function getAllocationDetail(
  id: string,
  signal?: AbortSignal
): Promise<AllocationDetail> {
  if (shouldUseMock(ENDPOINTS.allocationsGet.domain, ENDPOINTS.allocationsGet.status)) {
    return getAllocationDetailMock(id);
  }
  const path = ENDPOINTS.allocationsGet.path.replace("{id}", encodeURIComponent(id));
  return apiClient<AllocationDetail>(path, {
    method: ENDPOINTS.allocationsGet.method,
    signal,
  });
}

export async function getAllocationKpis(
  filters: AllocationFilters = {},
  signal?: AbortSignal
): Promise<AllocationKpis> {
  if (
    shouldUseMock(
      ENDPOINTS.allocationsSummary.domain,
      ENDPOINTS.allocationsSummary.status
    )
  ) {
    return getAllocationKpisMock(filters);
  }
  return apiClient<AllocationKpis>(ENDPOINTS.allocationsSummary.path, {
    method: ENDPOINTS.allocationsSummary.method,
    signal,
  });
}

export async function confirmAllocation(id: string): Promise<ConfirmAllocationResponse> {
  if (
    shouldUseMock(
      ENDPOINTS.allocationsConfirm.domain,
      ENDPOINTS.allocationsConfirm.status
    )
  ) {
    return confirmAllocationMock(id);
  }
  const path = ENDPOINTS.allocationsConfirm.path.replace("{id}", encodeURIComponent(id));
  return apiClient<ConfirmAllocationResponse>(path, {
    method: ENDPOINTS.allocationsConfirm.method,
  });
}

export async function optimizeAllocations(
  body: OptimizeRequest
): Promise<OptimizeResponse> {
  if (
    shouldUseMock(
      ENDPOINTS.allocationsOptimize.domain,
      ENDPOINTS.allocationsOptimize.status
    )
  ) {
    return optimizeAllocationsMock();
  }
  return apiClient<OptimizeResponse>(ENDPOINTS.allocationsOptimize.path, {
    method: ENDPOINTS.allocationsOptimize.method,
    body,
  });
}

export async function allocateOrdersManually(
  body: ManualAllocateRequest
): Promise<ManualAllocateResponse> {
  if (
    shouldUseMock(ENDPOINTS.allocationsManual.domain, ENDPOINTS.allocationsManual.status)
  ) {
    return allocateOrdersManuallyMock(body);
  }
  return apiClient<ManualAllocateResponse>(ENDPOINTS.allocationsManual.path, {
    method: ENDPOINTS.allocationsManual.method,
    body,
  });
}
