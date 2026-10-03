import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { ordersKeys } from "@/api/keys";
import { db } from "@/lib/dexie-db";
import { readThroughOrders } from "./cache";
import {
  createOrderMock,
  getOrderMock,
  getOrdersMock,
  updateOrderStatusMock,
} from "./mock";
import type {
  CreateOrderRequest,
  CustomerOrder,
  OrderDetail,
  OrderFilters,
  UpdateOrderStatusRequest,
} from "./types";

async function mergeLocalPendingOrders(
  orders: CustomerOrder[],
  filters: OrderFilters
): Promise<CustomerOrder[]> {
  try {
    const pendingMutations = await db.mutationQueue
      .where("entityType")
      .equals("order")
      .and((m) => m.syncStatus === "pending")
      .toArray();

    const existingIds = new Set(orders.map((o) => o.id));
    const localOrders: CustomerOrder[] = [];

    for (const m of pendingMutations) {
      const payload = m.payload as Partial<CreateOrderRequest> & {
        idempotency_key?: string;
        action?: string;
      };
      const id = payload.idempotency_key || `pending-order-${m.id}`;
      if (existingIds.has(id)) continue;

      if (
        filters.outlet_id &&
        payload.outlet_id &&
        payload.outlet_id !== filters.outlet_id
      ) {
        continue;
      }

      localOrders.push({
        id,
        order_ref: `ORD-${m.timestamp.slice(0, 10).replace(/-/g, "")}-PND`,
        outlet_id: payload.outlet_id || "LOCAL_OUTLET",
        brand_id: "FRESH",
        order_date: payload.order_date || m.timestamp.slice(0, 10),
        temp_requirement: payload.temp_requirement || "ambient",
        status: "pending",
        total_weight_kg: 0,
        total_volume_m3: 0,
        total_price_lkr: 0,
        created_at: m.timestamp,
        sync_status: "pending",
        is_urgent: payload.is_urgent,
      });
    }

    return [...localOrders, ...orders];
  } catch {
    return orders;
  }
}

export async function getOrders(
  filters: OrderFilters = {},
  signal?: AbortSignal
): Promise<CustomerOrder[]> {
  const queryKey = [...ordersKeys.lists(), filters];
  const list = await readThroughOrders(queryKey, async () => {
    if (shouldUseMock(ENDPOINTS.ordersList.domain, ENDPOINTS.ordersList.status)) {
      return getOrdersMock(filters);
    }
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters.outlet_id) params.outlet_id = filters.outlet_id;
    if (filters.brand_id) params.brand_id = filters.brand_id;
    if (filters.order_date || filters.date)
      params.date = filters.order_date || filters.date;
    if (filters.status) params.status = filters.status;
    if (filters.temp_requirement) params.temp_requirement = filters.temp_requirement;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    return apiClient<CustomerOrder[]>(ENDPOINTS.ordersList.path, {
      method: ENDPOINTS.ordersList.method,
      params,
      signal,
    });
  });

  return mergeLocalPendingOrders(list, filters);
}

export async function getOrder(id: string, signal?: AbortSignal): Promise<OrderDetail> {
  const queryKey = ordersKeys.detail(id);
  return readThroughOrders(queryKey, async () => {
    if (shouldUseMock(ENDPOINTS.ordersGet.domain, ENDPOINTS.ordersGet.status)) {
      return getOrderMock(id);
    }
    const path = ENDPOINTS.ordersGet.path.replace("{id}", encodeURIComponent(id));
    return apiClient<OrderDetail>(path, {
      method: ENDPOINTS.ordersGet.method,
      signal,
    });
  });
}

export async function createOrder(payload: CreateOrderRequest): Promise<CustomerOrder> {
  const idempotency_key = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await db.mutationQueue.add({
    tripId: "",
    entityType: "order",
    actionType: "CREATE_ORDER",
    payload: {
      idempotency_key,
      action: "create",
      ...payload,
    },
    timestamp,
    syncStatus: "pending",
    retryCount: 0,
  });

  if (shouldUseMock(ENDPOINTS.ordersCreate.domain, ENDPOINTS.ordersCreate.status)) {
    return createOrderMock(payload, idempotency_key);
  }

  return apiClient<CustomerOrder>(ENDPOINTS.ordersCreate.path, {
    method: ENDPOINTS.ordersCreate.method,
    body: {
      ...payload,
      idempotency_key,
    },
  });
}

export async function updateOrderStatus(
  id: string,
  payload: UpdateOrderStatusRequest
): Promise<CustomerOrder> {
  if (
    shouldUseMock(
      ENDPOINTS.ordersUpdateStatus.domain,
      ENDPOINTS.ordersUpdateStatus.status
    )
  ) {
    return updateOrderStatusMock(id, payload);
  }
  const path = ENDPOINTS.ordersUpdateStatus.path.replace("{id}", encodeURIComponent(id));
  return apiClient<CustomerOrder>(path, {
    method: ENDPOINTS.ordersUpdateStatus.method,
    body: payload,
  });
}
