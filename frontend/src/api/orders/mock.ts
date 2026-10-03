import { mockDelay } from "@/api/_mock-delay";
import { INITIAL_SEED_ORDERS, MOCK_CATALOG_PRODUCTS } from "./mock-data";
import type {
  CreateOrderRequest,
  CustomerOrder,
  OrderDetail,
  OrderFilters,
  OrderItem,
  OrderLifecycleStatus,
  UpdateOrderStatusRequest,
} from "./types";

let ordersState: OrderDetail[] = [...INITIAL_SEED_ORDERS];

const VALID_TRANSITIONS: Record<OrderLifecycleStatus, OrderLifecycleStatus[]> = {
  pending: ["allocated", "deferred"],
  allocated: ["in_transit", "pending", "deferred"],
  in_transit: ["delivered"],
  deferred: ["pending"],
  delivered: [],
};

export async function getOrdersMock(
  filters: OrderFilters = {}
): Promise<CustomerOrder[]> {
  await mockDelay();
  let list = [...ordersState];

  if (filters.outlet_id) {
    list = list.filter((o) => o.outlet_id === filters.outlet_id);
  }
  if (filters.brand_id) {
    list = list.filter((o) => o.brand_id === filters.brand_id);
  }
  if (filters.order_date || filters.date) {
    const targetDate = filters.order_date || filters.date;
    list = list.filter((o) => o.order_date === targetDate);
  }
  if (filters.status && filters.status !== "all") {
    list = list.filter((o) => o.status === filters.status);
  }
  if (filters.temp_requirement && filters.temp_requirement !== "all") {
    list = list.filter((o) => o.temp_requirement === filters.temp_requirement);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.order_ref.toLowerCase().includes(q) ||
        o.outlet_name?.toLowerCase().includes(q) ||
        o.outlet_id.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    if (a.is_urgent && !b.is_urgent) return -1;
    if (!a.is_urgent && b.is_urgent) return 1;
    if (a.deferred_yesterday && !b.deferred_yesterday) return -1;
    if (!a.deferred_yesterday && b.deferred_yesterday) return 1;
    return b.created_at.localeCompare(a.created_at);
  });

  if (filters.page && filters.limit) {
    const start = (filters.page - 1) * filters.limit;
    list = list.slice(start, start + filters.limit);
  }

  return list.map(({ items: _, fulfillment_history: __, ...order }) => order);
}

export async function getOrderMock(id: string): Promise<OrderDetail> {
  await mockDelay();
  const order = ordersState.find((o) => o.id === id || o.order_ref === id);
  if (!order) {
    throw new Error(`Order ${id} not found`);
  }
  return order;
}

export async function createOrderMock(
  payload: CreateOrderRequest,
  idempotencyKey?: string
): Promise<CustomerOrder> {
  await mockDelay();
  const id = idempotencyKey || `ord-${Date.now()}`;
  const order_ref = `ORD-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  let hasChilled = false;
  let totalWeight = 0;
  let totalVolume = 0;
  let totalPrice = 0;

  const items: OrderItem[] = payload.items.map((itemReq, idx) => {
    const catalogItem = MOCK_CATALOG_PRODUCTS.find((p) => p.id === itemReq.item_id);
    const unitWeight = catalogItem?.unit_weight_kg ?? 10.0;
    const unitVolume = catalogItem?.unit_volume_m3 ?? 0.05;
    const unitPrice = catalogItem?.unit_price ?? 5000;
    const shc =
      itemReq.special_handling_code ?? catalogItem?.special_handling_code ?? null;

    if (catalogItem?.requires_cold_chain || shc === "COL") {
      hasChilled = true;
    }

    const itemWeight = Number((unitWeight * itemReq.requested_qty).toFixed(2));
    const itemVolume = Number((unitVolume * itemReq.requested_qty).toFixed(4));
    const itemPrice = Number((unitPrice * itemReq.requested_qty).toFixed(2));

    totalWeight += itemWeight;
    totalVolume += itemVolume;
    totalPrice += itemPrice;

    return {
      id: `oi-${Date.now()}-${idx}`,
      order_id: id,
      item_id: itemReq.item_id,
      package_code: `PKG-${Date.now().toString().slice(-5)}-${idx + 1}`,
      item_name: catalogItem?.name ?? `Item ${itemReq.item_id}`,
      category: catalogItem?.category ?? "General",
      requested_qty: itemReq.requested_qty,
      loaded_qty: 0,
      delivered_qty: 0,
      unit_weight_kg: unitWeight,
      unit_volume_m3: unitVolume,
      unit_price: unitPrice,
      special_handling_code: shc,
      created_at: now,
    };
  });

  const createdOrder: OrderDetail = {
    id,
    order_ref,
    outlet_id: payload.outlet_id,
    brand_id: "brand-fresh-01",
    order_date: payload.order_date,
    required_date: payload.required_date ?? payload.order_date,
    temp_requirement: payload.temp_requirement ?? (hasChilled ? "chilled" : "ambient"),
    status: "pending",
    is_urgent: payload.is_urgent ?? false,
    deferred_yesterday: 0,
    days_since_last_served: 0,
    total_weight_kg: Number(totalWeight.toFixed(2)),
    total_volume_m3: Number(totalVolume.toFixed(4)),
    total_price_lkr: Number(totalPrice.toFixed(2)),
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    items,
    fulfillment_history: [
      {
        id: `fh-${Date.now()}`,
        order_id: id,
        status: "pending",
        changed_at: now,
        changed_by: "Store Manager",
      },
    ],
  };

  ordersState = [createdOrder, ...ordersState];
  const { items: _, fulfillment_history: __, ...header } = createdOrder;
  return header;
}

export async function updateOrderStatusMock(
  id: string,
  payload: UpdateOrderStatusRequest
): Promise<CustomerOrder> {
  await mockDelay();
  const index = ordersState.findIndex((o) => o.id === id || o.order_ref === id);
  if (index === -1) {
    throw new Error(`Order ${id} not found`);
  }

  const current = ordersState[index];
  const allowed = VALID_TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(payload.status)) {
    throw new Error(
      `Invalid order status transition from ${current.status} to ${payload.status}`
    );
  }

  const now = new Date().toISOString();
  const updatedHistory = [
    ...(current.fulfillment_history ?? []),
    {
      id: `fh-${Date.now()}`,
      order_id: current.id,
      status: payload.status,
      changed_at: now,
      changed_by: "Dispatcher",
      notes: payload.notes,
    },
  ];

  const updated: OrderDetail = {
    ...current,
    status: payload.status,
    updated_at: now,
    fulfillment_history: updatedHistory,
  };

  ordersState[index] = updated;
  const { items: _, fulfillment_history: __, ...header } = updated;
  return header;
}
