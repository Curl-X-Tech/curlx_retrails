import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { getSolverStatusMock, runOptimizationMock, scheduleCronMock } from "./mock";
import type {
  OptimizeRequest,
  OptimizeResult,
  ScheduleCronRequest,
  ScheduleCronResponse,
  SolverStatus,
} from "./types";

export async function runOptimization(payload: OptimizeRequest): Promise<OptimizeResult> {
  if (
    shouldUseMock(
      ENDPOINTS.allocationsOptimize.domain,
      ENDPOINTS.allocationsOptimize.status
    )
  ) {
    return runOptimizationMock(payload);
  }
  return apiClient<OptimizeResult>(ENDPOINTS.allocationsOptimize.path, {
    method: ENDPOINTS.allocationsOptimize.method,
    body: payload,
  });
}

export async function getSolverStatus(signal?: AbortSignal): Promise<SolverStatus> {
  if (
    shouldUseMock(
      ENDPOINTS.allocationsSolverStatus.domain,
      ENDPOINTS.allocationsSolverStatus.status
    )
  ) {
    return getSolverStatusMock();
  }
  return apiClient<SolverStatus>(ENDPOINTS.allocationsSolverStatus.path, {
    method: ENDPOINTS.allocationsSolverStatus.method,
    signal,
  });
}

export async function scheduleCron(
  payload: ScheduleCronRequest
): Promise<ScheduleCronResponse> {
  if (
    shouldUseMock(
      ENDPOINTS.allocationsScheduleCron.domain,
      ENDPOINTS.allocationsScheduleCron.status
    )
  ) {
    return scheduleCronMock(payload);
  }
  return apiClient<ScheduleCronResponse>(ENDPOINTS.allocationsScheduleCron.path, {
    method: ENDPOINTS.allocationsScheduleCron.method,
    body: payload,
  });
}
