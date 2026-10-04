export type OrderLifecycleStatus =
  "pending" | "allocated" | "in_transit" | "delivered" | "deferred" | "cancelled";

export type SpecialHandlingCode = "COL" | "FRG" | "MAL" | "HAZ" | "GEN";

export interface CustomerOrder {
  id: string;
  order_ref: string;
  outlet_id: string;
  brand_id: string;
  order_date: string;
  temp_requirement: "chilled" | "ambient";
  status: OrderLifecycleStatus;
  total_weight_kg: number;
  total_volume_m3: number;
  total_price_lkr: number;
  created_at: string;
  updated_at?: string;
  required_date?: string;
  is_urgent?: boolean;
  deferred_yesterday?: number;
  days_since_last_served?: number;
  created_by_staff_id?: string | null;
  sync_status?: "pending" | "synced";
  outlet_name?: string;
  outlet_address?: string;
  brand?: string;
  district?: string;
  dock_type?: string;
  parking_constraint?: string;
  delivery_window?: string;
  total_packages?: number;
  total_items?: number;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  item_id: string;
  package_code?: string;
  requested_qty: number;
  loaded_qty?: number;
  delivered_qty?: number;
  unit_weight_kg: number;
  unit_volume_m3: number;
  unit_price: number;
  special_handling_code?: SpecialHandlingCode | null;
  item_name?: string;
  category?: string;
  created_at?: string;
}

export interface OrderFulfillmentHistory {
  id: string;
  order_id: string;
  status: OrderLifecycleStatus;
  changed_at: string;
  changed_by?: string;
  notes?: string;
}

export interface OrderDetail extends CustomerOrder {
  items: OrderItem[];
  outlet_name?: string;
  outlet_address?: string;
  district?: string;
  depot?: string;
  dock_type?: string;
  parking_constraint?: string;
  delivery_window?: string;
  fulfillment_history?: OrderFulfillmentHistory[];
}

export interface CreateOrderItemRequest {
  item_id: string;
  requested_qty: number;
  special_handling_code?: SpecialHandlingCode | null;
}

export interface CreateOrderRequest {
  outlet_id: string;
  order_date: string;
  required_date?: string;
  temp_requirement?: "chilled" | "ambient";
  is_urgent?: boolean;
  items: CreateOrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  status: OrderLifecycleStatus;
  notes?: string;
}

export interface OrderFilters {
  date?: string;
  order_date?: string;
  required_date?: string;
  outlet_id?: string;
  brand_id?: string;
  status?: OrderLifecycleStatus | "all" | string;
  temp_requirement?: "chilled" | "ambient" | "all";
  search?: string;
  page?: number;
  limit?: number;
  page_size?: number;
}
