import type { SyncBatchRequest, SyncBatchResponse } from "./types";

export async function postSyncBatchMock(
  request: SyncBatchRequest
): Promise<SyncBatchResponse> {
  const results = request.mutations.map((m) => ({
    idempotency_key: m.idempotency_key,
    status: "applied" as const,
  }));

  return {
    batch_id: `batch-${Date.now()}`,
    processed_count: request.mutations.length,
    results,
    server_timestamp: Math.floor(Date.now() / 1000),
  };
}
