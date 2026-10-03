export interface ProofOfDelivery {
  id: string;
  route_leg_id: string;
  order_id: string;
  recipient_name: string;
  signature_data_url: string;
  photo_proof_url?: string;
  arrived_at: string;
  completed_at: string;
}

export type DiscrepancyIssueType =
  "damaged_in_transit" | "missing_crate" | "rejected_by_store" | "temp_spoilage";

export interface DiscrepancyReport {
  id: string;
  pod_id: string;
  item_id: string;
  issue_type: DiscrepancyIssueType;
  reported_qty: number;
  notes?: string;
}

export interface ArriveRequest {
  arrived_at: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface LogDiscrepancyRequest {
  item_id: string;
  issue_type: DiscrepancyIssueType;
  reported_qty: number;
  notes?: string;
}

export interface SubmitPodRequest {
  recipient_name: string;
  signature_data_url: string;
  photo_proof_url?: string;
  arrived_at: string;
  completed_at: string;
  discrepancies?: LogDiscrepancyRequest[];
}

export interface OfflineMutationRecord {
  id?: number;
  idempotency_key: string;
  entity_type:
    "route_leg" | "proof_of_delivery" | "telemetry" | "order" | "loading_checklist";
  action: "create" | "update" | "verify" | string;
  payload: Record<string, unknown>;
  client_timestamp: string;
  user_id: string;
  sync_status: "pending" | "syncing" | "synced" | "failed";
  error_message?: string;
}

export interface TelemetryRecord {
  id?: number;
  trip_id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  reefer_temp_c?: number;
  fuel_remaining_l?: number;
  recorded_at: string;
  sync_status: "pending" | "synced";
}

export type MutationRecord = OfflineMutationRecord;
export type LocalTelemetryRecord = TelemetryRecord;
