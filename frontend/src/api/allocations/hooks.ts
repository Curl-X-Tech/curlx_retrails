import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allocationsKeys, ordersKeys } from "@/api/keys";
import {
  allocateOrdersManually,
  optimizeAllocations,
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
    queryKey: allocationsKeys.summary(filters as Record<string, unknown>),
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

import { toast } from "@/components/ui/sonner";

function useRefreshAfterAllocation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
    queryClient.invalidateQueries({ queryKey: ordersKeys.all });
  };
}

let activeAllocationToastId: string | number | undefined;

export function useOptimizeAllocations() {
  const refresh = useRefreshAfterAllocation();
  return useMutation({
    mutationFn: optimizeAllocations,
    onMutate: () => {
      activeAllocationToastId = toast.loading("Auto-allocating fleet routes...", {
        description:
          "Optimizing 3D volumetric pack, vehicle weight limits, and delivery windows",
      });
    },
    onSuccess: (data) => {
      refresh();
      const count = data?.summary?.total_trips_created ?? 0;
      const allocated = data?.summary?.allocated_orders_count ?? 0;
      const deferred = data?.summary?.deferred_orders_count ?? 0;
      toast.success("Auto-Allocation Confirmed", {
        id: activeAllocationToastId,
        description: `${count} trips generated with ${allocated} orders allocated (${deferred} deferred).`,
        action: {
          label: "Open in New Tab ↗",
          onClick: () => window.open("/dispatcher/allocations", "_blank"),
        },
        duration: 8000,
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Auto-allocation failed", {
        id: activeAllocationToastId,
      });
    },
  });
}

export function useManualAllocation() {
  const refresh = useRefreshAfterAllocation();
  return useMutation({ mutationFn: allocateOrdersManually, onSuccess: refresh });
}
