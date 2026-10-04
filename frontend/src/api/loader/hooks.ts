import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allocationsKeys, driverKeys, loaderKeys } from "@/api/keys";
import { toast } from "@/components/ui/sonner";
import {
  confirmDeparture,
  getBays,
  getTripChecklist,
  sealWaypoint,
  startLoading,
  verifyItem,
} from "./api";
import type {
  ConfirmDepartureRequest,
  SealWaypointRequest,
  VerifyItemRequest,
} from "./types";

export function useBays(depotId?: string) {
  return useQuery({
    queryKey: [...loaderKeys.bays(), depotId || "all"],
    queryFn: ({ signal }) => getBays(depotId, signal),
    refetchInterval: 15000,
  });
}

export function useTripChecklist(tripId: string) {
  return useQuery({
    queryKey: loaderKeys.checklist(tripId),
    queryFn: ({ signal }) => getTripChecklist(tripId, signal),
    enabled: Boolean(tripId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useVerifyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: VerifyItemRequest }) =>
      verifyItem(itemId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loaderKeys.all });
      if (data.status === "verified") {
        toast.success("Item verified", { description: "Package checked into bay" });
      } else if (data.status === "flagged_shortfall") {
        toast.warning("Shortfall flagged", {
          description: "Discrepancy logged for supervisor",
        });
      }
    },
    onError: (err: Error) => {
      toast.error("Verification failed", { description: err.message });
    },
  });
}

export function useSealWaypoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      seq,
      payload,
    }: {
      tripId: string;
      seq: number;
      payload?: SealWaypointRequest;
    }) => sealWaypoint(tripId, seq, payload),
    onSuccess: (_, { tripId, seq }) => {
      queryClient.invalidateQueries({ queryKey: loaderKeys.checklist(tripId) });
      queryClient.invalidateQueries({ queryKey: loaderKeys.bays() });
      toast.success(`Stop ${seq} Sealed`, {
        description: "Waypoint cargo lock verified",
      });
    },
    onError: (err: Error) => {
      toast.error("Seal failed", { description: err.message });
    },
  });
}

export function useStartLoading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => startLoading(tripId),
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: loaderKeys.all });
      queryClient.invalidateQueries({ queryKey: loaderKeys.checklist(tripId) });
      toast.success("Loading Started", {
        description: "Dock bay active for verification",
      });
    },
    onError: (err: Error) => {
      toast.error("Could not start loading", { description: err.message });
    },
  });
}

export function useConfirmDeparture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      payload,
    }: {
      tripId: string;
      payload: ConfirmDepartureRequest;
    }) => confirmDeparture(tripId, payload),
    onSuccess: (_, { payload }) => {
      queryClient.invalidateQueries({ queryKey: loaderKeys.all });
      queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
      queryClient.invalidateQueries({ queryKey: driverKeys.currentRoute() });
      toast.success("Departure Confirmed", {
        description: `Trip dispatched under seal ${payload.seal_number}`,
      });
    },
    onError: (err: Error) => {
      toast.error("Departure confirmation failed", { description: err.message });
    },
  });
}
