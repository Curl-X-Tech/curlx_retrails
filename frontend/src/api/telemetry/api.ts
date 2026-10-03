import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { db } from "@/lib/dexie-db";
import { getLiveTelemetryMock, getVehicleLatestTelemetryMock } from "./mock";
import type {
  LiveVehicleTelemetry,
  TelemetryReportPayload,
  TelemetryReportRequest,
  VehicleTelemetry,
} from "./types";

export async function getLiveTelemetry(
  signal?: AbortSignal
): Promise<LiveVehicleTelemetry[]> {
  if (shouldUseMock(ENDPOINTS.telemetryLive.domain, ENDPOINTS.telemetryLive.status)) {
    return getLiveTelemetryMock();
  }
  return apiClient<LiveVehicleTelemetry[]>(ENDPOINTS.telemetryLive.path, {
    method: ENDPOINTS.telemetryLive.method,
    signal,
  });
}

export async function getLatestTelemetry(
  vehicleId: string,
  signal?: AbortSignal
): Promise<VehicleTelemetry> {
  if (
    shouldUseMock(
      ENDPOINTS.telemetryVehicleLatest.domain,
      ENDPOINTS.telemetryVehicleLatest.status
    )
  ) {
    return getVehicleLatestTelemetryMock(vehicleId);
  }
  const path = ENDPOINTS.telemetryVehicleLatest.path.replace(
    "{id}",
    encodeURIComponent(vehicleId)
  );
  return apiClient<VehicleTelemetry>(path, {
    method: ENDPOINTS.telemetryVehicleLatest.method,
    signal,
  });
}

export async function reportTelemetry(
  payload: TelemetryReportRequest
): Promise<{ status: "queued"; idempotency_key: string }> {
  const idempotency_key = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const pings: TelemetryReportPayload[] = Array.isArray(payload) ? payload : [payload];

  await db.mutationQueue.add({
    tripId: pings[0]?.trip_id || "",
    entityType: "telemetry",
    actionType: "TELEMETRY_PING",
    payload: {
      idempotency_key,
      action: "create",
      pings,
    },
    timestamp,
    syncStatus: "pending",
    retryCount: 0,
  });

  return { status: "queued", idempotency_key };
}
