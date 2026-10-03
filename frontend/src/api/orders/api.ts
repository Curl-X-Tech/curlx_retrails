import { apiClient, shouldUseMock } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import { ordersKeys } from "@/api/keys";
import { enqueue, listByEntity } from "@/sync/queue";
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
  OrderItem,
  UpdateOrderStatusRequest,
} from "./types";

async function mergeLocalPendingOrders(
  orders: CustomerOrder[],
  filters: OrderFilters
): Promise<CustomerOrder[]> {
  try {
    const pendingMutations = await listByEntity("order");
    const pendingQueued = pendingMutations.filter(
      (m) => m.status === "queued" || m.status === "sending"
    );

    const existingIds = new Set(orders.map((o) => o.id));
    const localOrders: CustomerOrder[] = [];

    for (const m of pendingQueued) {
      const payload = m.payload as Partial<CreateOrderRequest> & {
        idempotency_key?: string;
      };
      const id =
        payload.idempotency_key || m.idempotency_key || `pending-order-${m.created_seq}`;
      if (existingIds.has(id)) continue;

      const items: OrderItem[] = (payload.items || []).map((item, idx) => ({
        id: `item-${id}-${idx}`,
        order_id: id,
        item_id: item.item_id,
        requested_qty: item.requested_qty || 1,
        unit_weight_kg: 2.5,
        unit_volume_m3: 0.01,
        unit_price: 1500,
        special_handling_code: item.special_handling_code || "GEN",
        item_name: `Item ${item.item_id}`,
      }));

      const totalWeightKg = (payload.items || []).reduce(
        (sum, i) => sum + (i.requested_qty || 1) * 2.5,
        0
      );
      const totalVolumeM3 = (payload.items || []).reduce(
        (sum, i) => sum + (i.requested_qty || 1) * 0.01,
        0
      );

      const localOrder: CustomerOrder = {
        id,
        order_ref: `ORD-OFF-${m.idempotency_key.substring(0, 6).toUpperCase()}`,
        outlet_id: payload.outlet_id || "outlet-01",
        brand_id: "brand-fresh",
        order_date: payload.order_date || new Date().toISOString().substring(0, 10),
        required_date: payload.required_date || new Date().toISOString().substring(0, 10),
        temp_requirement: payload.temp_requirement || "ambient",
        status: "pending",
        total_weight_kg: totalWeightKg,
        total_volume_m3: totalVolumeM3,
        total_price_lkr: items.reduce(
          (sum, i) => sum + i.unit_price * i.requested_qty,
          0
        ),
        created_at: m.client_timestamp,
        updated_at: m.client_timestamp,
      };

      if (filters.outlet_id && localOrder.outlet_id !== filters.outlet_id) {
        continue;
      }
      if (filters.status && localOrder.status !== filters.status) {
        continue;
      }

      localOrders.push(localOrder);
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
  return readThroughOrders(
    ordersKeys.list(filters as unknown as Record<string, unknown>),
    async () => {
      if (shouldUseMock(ENDPOINTS.ordersList.domain, ENDPOINTS.ordersList.status)) {
        const mockList = await getOrdersMock(filters);
        return mergeLocalPendingOrders(mockList, filters);
      }
      const params = new URLSearchParams();
      if (filters.outlet_id) params.set("outlet_id", filters.outlet_id);
      if (filters.status) params.set("status", filters.status);
      if (filters.order_date) params.set("order_date", filters.order_date);
      if (filters.brand_id) params.set("brand_id", filters.brand_id);

      const queryString = params.toString();
      const path = queryString
        ? `${ENDPOINTS.ordersList.path}?${queryString}`
        : ENDPOINTS.ordersList.path;

      const list = await apiClient<CustomerOrder[]>(path, {
        method: ENDPOINTS.ordersList.method,
        signal,
      });
      return mergeLocalPendingOrders(list, filters);
    }
  );
}

export async function getOrder(id: string, signal?: AbortSignal): Promise<OrderDetail> {
  return readThroughOrders(ordersKeys.detail(id), async () => {
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
  const client_timestamp = new Date().toISOString();

  await enqueue({
    idempotency_key,
    entity_type: "order",
    action: "create",
    payload: {
      idempotency_key,
      ...payload,
    },
    client_timestamp,
  });

  if (shouldUseMock(ENDPOINTS.ordersCreate.domain, ENDPOINTS.ordersCreate.status)) {
    return createOrderMock(payload, idempotency_key);
  }

  return apiClient<CustomerOrder>(ENDPOINTS.ordersCreate.path, {
    method: ENDPOINTS.ordersCreate.method,
    body: {
      ...payload,
      idempotency_key,
    } as unknown as Record<string, unknown>,
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
    body: payload as unknown as Record<string, unknown>,
  });
}
