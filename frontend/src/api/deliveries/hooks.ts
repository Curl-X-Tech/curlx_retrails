import { useMutation, useQueryClient } from "@tanstack/react-query";
import { allocationsKeys, driverKeys, ordersKeys } from "../keys";
import { logDiscrepancy, recordArrival, submitPod } from "./api";
import type { ArriveRequest, LogDiscrepancyRequest, SubmitPodRequest } from "./types";

export function useArrive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      waypointId,
      payload,
    }: {
      waypointId: string;
      payload: ArriveRequest;
    }) => recordArrival(waypointId, payload),
    networkMode: "always",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: driverKeys.currentRoute() });
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      void queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
    },
  });
}

export function useSubmitPod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      waypointId,
      payload,
    }: {
      waypointId: string;
      payload: SubmitPodRequest;
    }) => submitPod(waypointId, payload),
    networkMode: "always",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: driverKeys.currentRoute() });
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      void queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
    },
  });
}

export function useLogDiscrepancy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      waypointId,
      payload,
    }: {
      waypointId: string;
      payload: LogDiscrepancyRequest;
    }) => logDiscrepancy(waypointId, payload),
    networkMode: "always",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: driverKeys.currentRoute() });
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}
