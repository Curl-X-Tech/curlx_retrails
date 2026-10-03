import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncKeys } from "@/api/keys";
import { postSyncBatch } from "./api";
import type { SyncBatchRequest, SyncBatchResponse } from "./types";

export function useSyncBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation<SyncBatchResponse, Error, SyncBatchRequest>({
    mutationFn: (request) => postSyncBatch(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: syncKeys.all });
    },
  });
}
