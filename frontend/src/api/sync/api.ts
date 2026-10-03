import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import type { SyncBatchRequest, SyncBatchResponse } from "./types";
import { postSyncBatchMock } from "./mock";

export async function postSyncBatch(
  request: SyncBatchRequest
): Promise<SyncBatchResponse> {
  if (shouldUseMock(ENDPOINTS.syncBatch.domain, ENDPOINTS.syncBatch.status)) {
    return postSyncBatchMock(request);
  }

  return apiClient<SyncBatchResponse>(ENDPOINTS.syncBatch.path, {
    method: ENDPOINTS.syncBatch.method,
    body: request as unknown as Record<string, unknown>,
  });
}
