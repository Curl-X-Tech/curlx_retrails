import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { enqueue } from "@/sync/queue";
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
  const client_timestamp = new Date().toISOString();
  const pings: TelemetryReportPayload[] = Array.isArray(payload) ? payload : [payload];

  await enqueue({
    idempotency_key,
    entity_type: "telemetry",
    action: "create",
    payload: {
      idempotency_key,
      pings,
    },
    client_timestamp,
    user_id: "",
  });

  return { status: "queued", idempotency_key };
}
