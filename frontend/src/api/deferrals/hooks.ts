import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { allocationsKeys, deferralsKeys, ordersKeys } from "@/api/keys";
import {
  deferOrder,
  getDeferralAuditLogs,
  getDeferrals,
  getDeferralSummary,
  requeueDeferral,
} from "./api";
import type { DeferOrderRequest, DeferralFilters, RequeueRequest } from "./types";

export function useDeferrals(filters: DeferralFilters = {}) {
  return useQuery({
    queryKey: deferralsKeys.list(filters as Record<string, unknown>),
    queryFn: ({ signal }) => getDeferrals(filters, signal),
  });
}

export function useDeferralSummary(filters: DeferralFilters = {}) {
  return useQuery({
    queryKey: deferralsKeys.summary(),
    queryFn: ({ signal }) => getDeferralSummary(filters, signal),
  });
}

export function useDeferralAuditLogs(filters: DeferralFilters = {}) {
  return useQuery({
    queryKey: [...deferralsKeys.all, "audit-logs", filters],
    queryFn: ({ signal }) => getDeferralAuditLogs(filters, signal),
  });
}

export function useDeferOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DeferOrderRequest }) =>
      deferOrder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deferralsKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
    },
  });
}

export function useRequeueDeferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: RequeueRequest }) =>
      requeueDeferral(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deferralsKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
    },
  });
}

export function useStoreDeferrals(filters: DeferralFilters = {}) {
  return useDeferrals(filters);
}
