import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";

export type MasterQueryOptions<TQueryFnData, TData = TQueryFnData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData, QueryKey>,
  "queryKey" | "queryFn"
>;

export const MASTER_QUERY_DEFAULTS = {
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 24,
  networkMode: "offlineFirst",
} as const;
