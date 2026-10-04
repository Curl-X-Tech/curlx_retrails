import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { allocationsKeys, ordersKeys } from "@/api/keys";
import { createOrder, getOrder, getOrders, updateOrderStatus } from "./api";
import type {
  CreateOrderRequest,
  CustomerOrder,
  OrderDetail,
  OrderFilters,
  UpdateOrderStatusRequest,
} from "./types";

const ORDERS_STALE_TIME = 1000 * 30;

export function useOrders<TData = CustomerOrder[]>(
  filters: OrderFilters = {},
  options: Omit<
    UseQueryOptions<CustomerOrder[], Error, TData>,
    "queryKey" | "queryFn"
  > = {}
) {
  return useQuery({
    staleTime: ORDERS_STALE_TIME,
    ...options,
    queryKey: [...ordersKeys.lists(), filters],
    queryFn: ({ signal }) => getOrders(filters, signal),
  });
}

export function useOrder<TData = OrderDetail>(
  id: string,
  options: Omit<UseQueryOptions<OrderDetail, Error, TData>, "queryKey" | "queryFn"> = {}
) {
  return useQuery({
    staleTime: ORDERS_STALE_TIME,
    ...options,
    queryKey: ordersKeys.detail(id),
    queryFn: ({ signal }) => getOrder(id, signal),
    enabled: Boolean(id) && options.enabled !== false,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderStatusRequest }) =>
      updateOrderStatus(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: allocationsKeys.all });
    },
  });
}
