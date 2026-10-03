export type EntityType =
  "loading_checklist" | "route_leg" | "proof_of_delivery" | "telemetry" | "order";

export type MutationAction = "create" | "update" | "verify";

export type MutationStatus = "queued" | "sending" | "failed";

export interface QueuedMutation {
  created_seq?: number;
  idempotency_key: string;
  entity_type: EntityType;
  action: MutationAction;
  payload: Record<string, unknown>;
  client_timestamp: string;
  user_id: string;
  status: MutationStatus;
  attempts: number;
  last_error?: string | null;
}

export interface SyncBatchRequest {
  client_device_id: string;
  mutations: QueuedMutation[];
}

export interface MutationResult {
  idempotency_key: string;
  status: "applied" | "duplicate_ignored" | "conflict_resolved";
  entity_id?: string;
}

export interface SyncBatchResponse {
  batch_id: string;
  processed_count: number;
  results: MutationResult[];
  server_timestamp: number;
}

export type MutationRecord = QueuedMutation;
