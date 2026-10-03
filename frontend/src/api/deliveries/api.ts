import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { logDiscrepancyMock, recordArrivalMock, submitPodMock } from "./mock";
import type {
  ArriveRequest,
  DiscrepancyReport,
  LogDiscrepancyRequest,
  ProofOfDelivery,
  SubmitPodRequest,
} from "./types";

export async function recordArrival(
  waypointId: string,
  payload: ArriveRequest
): Promise<{ success: boolean; waypoint_id: string; status: string }> {
  const ep = ENDPOINTS.deliveriesArrive;
  if (shouldUseMock(ep.domain, ep.status) || ep.offline) {
    return recordArrivalMock(waypointId, payload);
  }
  const path = ep.path.replace("{waypoint_id}", encodeURIComponent(waypointId));
  return apiClient<{ success: boolean; waypoint_id: string; status: string }>(path, {
    method: ep.method,
    body: payload,
  });
}

export async function submitPod(
  waypointId: string,
  payload: SubmitPodRequest
): Promise<ProofOfDelivery> {
  const ep = ENDPOINTS.deliveriesPod;
  if (shouldUseMock(ep.domain, ep.status) || ep.offline) {
    return submitPodMock(waypointId, payload);
  }
  const path = ep.path.replace("{waypoint_id}", encodeURIComponent(waypointId));
  return apiClient<ProofOfDelivery>(path, {
    method: ep.method,
    body: payload,
  });
}

export async function logDiscrepancy(
  waypointId: string,
  payload: LogDiscrepancyRequest
): Promise<DiscrepancyReport> {
  const ep = ENDPOINTS.deliveriesDiscrepancy;
  if (shouldUseMock(ep.domain, ep.status) || ep.offline) {
    return logDiscrepancyMock(waypointId, payload);
  }
  const path = ep.path.replace("{waypoint_id}", encodeURIComponent(waypointId));
  return apiClient<DiscrepancyReport>(path, {
    method: ep.method,
    body: payload,
  });
}
