import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allocationsKeys, driverKeys, loaderKeys } from "@/api/keys";
import {
  confirmDeparture,
  getBays,
  getTripChecklist,
  sealWaypoint,
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
  });
}

export function useVerifyItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: VerifyItemRequest }) =>
      verifyItem(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loaderKeys.all });
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
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: loaderKeys.checklist(tripId) });
      queryClient.invalidateQueries({ queryKey: loaderKeys.bays() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loaderKeys.all });
      queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
      queryClient.invalidateQueries({ queryKey: driverKeys.currentRoute() });
    },
  });
}
