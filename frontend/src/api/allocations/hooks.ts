import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allocationsKeys } from "@/api/keys";
import {
  confirmAllocation,
  getAllocationDetail,
  getAllocationKpis,
  getAllocations,
} from "./api";
import type { AllocationFilters } from "./types";

export function useAllocations(filters: AllocationFilters = {}) {
  return useQuery({
    queryKey: allocationsKeys.list(filters as Record<string, unknown>),
    queryFn: ({ signal }) => getAllocations(filters, signal),
  });
}

export function useAllocationDetail(id: string) {
  return useQuery({
    queryKey: allocationsKeys.detail(id),
    queryFn: ({ signal }) => getAllocationDetail(id, signal),
    enabled: Boolean(id),
  });
}

export function useAllocationKpis(filters: AllocationFilters = {}) {
  return useQuery({
    queryKey: allocationsKeys.summary(),
    queryFn: ({ signal }) => getAllocationKpis(filters, signal),
  });
}

export function useConfirmAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmAllocation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
      queryClient.invalidateQueries({ queryKey: allocationsKeys.detail(id) });
    },
  });
}
