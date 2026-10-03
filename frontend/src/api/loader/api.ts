import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import {
  confirmDepartureMock,
  getBaysMock,
  getTripChecklistMock,
  sealWaypointMock,
  verifyItemMock,
} from "./mock";
import type {
  BayWithManifest,
  ConfirmDepartureRequest,
  ConfirmDepartureResponse,
  SealWaypointRequest,
  SealWaypointResponse,
  TripChecklist,
  VerifyItemRequest,
  VerifyItemResponse,
} from "./types";

export async function getBays(
  depotId?: string,
  signal?: AbortSignal
): Promise<BayWithManifest[]> {
  if (shouldUseMock(ENDPOINTS.loaderBays.domain, ENDPOINTS.loaderBays.status)) {
    return getBaysMock(depotId);
  }
  const params: Record<string, string | undefined> = {};
  if (depotId) params.depot_id = depotId;

  return apiClient<BayWithManifest[]>(ENDPOINTS.loaderBays.path, {
    method: ENDPOINTS.loaderBays.method,
    params,
    signal,
  });
}

export async function getTripChecklist(
  tripId: string,
  signal?: AbortSignal
): Promise<TripChecklist> {
  if (shouldUseMock(ENDPOINTS.loaderChecklist.domain, ENDPOINTS.loaderChecklist.status)) {
    return getTripChecklistMock(tripId);
  }
  const path = ENDPOINTS.loaderChecklist.path.replace(
    "{trip_id}",
    encodeURIComponent(tripId)
  );
  return apiClient<TripChecklist>(path, {
    method: ENDPOINTS.loaderChecklist.method,
    signal,
  });
}

export async function verifyItem(
  itemId: string,
  payload: VerifyItemRequest
): Promise<VerifyItemResponse> {
  if (
    shouldUseMock(ENDPOINTS.loaderVerifyItem.domain, ENDPOINTS.loaderVerifyItem.status)
  ) {
    return verifyItemMock(itemId, payload);
  }
  const path = ENDPOINTS.loaderVerifyItem.path.replace(
    "{item_id}",
    encodeURIComponent(itemId)
  );
  return apiClient<VerifyItemResponse>(path, {
    method: ENDPOINTS.loaderVerifyItem.method,
    body: payload,
  });
}

export async function sealWaypoint(
  tripId: string,
  seq: number,
  payload?: SealWaypointRequest
): Promise<SealWaypointResponse> {
  if (
    shouldUseMock(
      ENDPOINTS.loaderSealWaypoint.domain,
      ENDPOINTS.loaderSealWaypoint.status
    )
  ) {
    return sealWaypointMock(tripId, seq, payload);
  }
  const path = ENDPOINTS.loaderSealWaypoint.path
    .replace("{trip_id}", encodeURIComponent(tripId))
    .replace("{seq}", encodeURIComponent(String(seq)));

  return apiClient<SealWaypointResponse>(path, {
    method: ENDPOINTS.loaderSealWaypoint.method,
    body: payload ?? {},
  });
}

export async function confirmDeparture(
  tripId: string,
  payload: ConfirmDepartureRequest
): Promise<ConfirmDepartureResponse> {
  if (
    shouldUseMock(
      ENDPOINTS.loaderConfirmDeparture.domain,
      ENDPOINTS.loaderConfirmDeparture.status
    )
  ) {
    return confirmDepartureMock(tripId, payload);
  }
  const path = ENDPOINTS.loaderConfirmDeparture.path.replace(
    "{trip_id}",
    encodeURIComponent(tripId)
  );
  return apiClient<ConfirmDepartureResponse>(path, {
    method: ENDPOINTS.loaderConfirmDeparture.method,
    body: payload,
  });
}
