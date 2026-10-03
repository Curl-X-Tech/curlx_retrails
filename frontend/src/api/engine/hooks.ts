import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allocationsKeys, deferralsKeys, engineKeys, ordersKeys } from "@/api/keys";
import { getSolverStatus, runOptimization, scheduleCron } from "./api";
import type { OptimizeRequest, ScheduleCronRequest } from "./types";

export function useRunOptimization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OptimizeRequest) => runOptimization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      queryClient.invalidateQueries({ queryKey: deferralsKeys.all });
      queryClient.invalidateQueries({ queryKey: engineKeys.all });
    },
  });
}

export function useSolverStatus() {
  return useQuery({
    queryKey: engineKeys.status(),
    queryFn: ({ signal }) => getSolverStatus(signal),
    refetchInterval: 5000,
  });
}

export function useScheduleCron() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScheduleCronRequest) => scheduleCron(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineKeys.all });
    },
  });
}
