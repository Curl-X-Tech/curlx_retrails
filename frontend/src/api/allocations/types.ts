export type TripStatus =
  "scheduled" | "loading" | "dispatched" | "in_transit" | "completed" | "cancelled";

export type RouteLegStatus =
  "pending" | "in_transit" | "arrived" | "completed" | "skipped" | "newly_added";

export interface Trip {
  id: string;
  trip_code: string;
  dispatch_date: string; // 'YYYY-MM-DD'
  trip_sequence: 1 | 2;
  vehicle_id: string;
  driver_id: string;
  depot_id: string;
  brand_id: string;
  district_id: string;
  status: TripStatus;
  outbound_travel_min: number;
  inter_stop_travel_min: number;
  total_handling_min: number;
  total_trip_duration_min: number;
  total_distance_km?: number;
  seal_number?: string | null;
  planned_start_time?: string | null;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RouteLeg {
  id: string;
  trip_id: string;
  seq: number; // 0-indexed
  from_point: string; // 'DEPOT' or outlet_id
  to_outlet_id: string;
  order_id?: string | null;
  distance_km: number;
  planned_depart_time: string; // TIME string "05:00:00"
  planned_arrival_time: string; // TIME string "06:15:00"
  status: RouteLegStatus;
  planned_travel_duration_min?: number;
  actual_depart_time?: string | null;
  actual_travel_duration_min?: number | null;
  arrival_time?: string | null;
  leave_outlet_time?: string | null;
  is_post_dispatch_added?: boolean;
}

export interface AllocationSummary extends Trip {
  weight_utilization_pct: number;
  volume_utilization_pct: number;
  total_packages: number;
  total_orders?: number;
  cargo_value_lkr: number;
  total_payload_kg?: number;
  total_volume_m3?: number;
  weight_cap_kg?: number;
  volume_cap_m3?: number;
  vehicle_reg_number?: string;
  vehicle_model?: string;
  vehicle_type?: string;
  driver_name?: string;
  driver_phone?: string;
  depot_name?: string;
  brand_name?: string;
  district_name?: string;
}

export interface AllocationDetailCrate {
  id: string;
  order_id: string;
  order_item_id: string;
  sku: string;
  item_name: string;
  package_code: string;
  requested_qty: number;
  unit_weight_kg: number;
  unit_volume_m3: number;
  unit_price: number;
  special_handling_code?: string | null;
}

export interface AllocationDetailLeg extends RouteLeg {
  outlet_name: string;
  outlet_code?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  dock_type?: string;
  parking_constraint?: string;
  window_open_time: string; // TIME string
  window_close_time: string; // TIME string
  contact_phone?: string;
  crates_count: number;
  items?: AllocationDetailCrate[];
}

export interface AllocationDetail {
  trip: Trip;
  vehicle: {
    id: string;
    vehicle_id: string;
    reg_number: string;
    model_name: string;
    type: "truck" | "van";
    temp: "reefer" | "ambient";
    weight_cap_kg: number;
    volume_cap_m3: number;
    km_per_l?: number;
    weekly_fuel_quota_l?: number;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
    license_number?: string;
  };
  depot: {
    id: string;
    code: string;
    name: string;
  };
  brand: {
    id: string;
    code: string;
    name: string;
  };
  district: {
    id: string;
    name: string;
  };
  legs: AllocationDetailLeg[];
  summary: {
    total_orders: number;
    total_packages: number;
    total_payload_kg: number;
    total_volume_m3: number;
    cargo_value_lkr: number;
    weight_utilization_pct: number;
    volume_utilization_pct: number;
  };
}

export interface AllocationKpis {
  total_trips: number;
  active_trips: number;
  completed_trips: number;
  total_packages_allocated: number;
  total_weight_kg: number;
  total_volume_m3: number;
  total_cargo_value_lkr: number;
  avg_weight_utilization_pct: number;
  avg_volume_utilization_pct: number;
  fully_utilized_trips: number;
}

export interface AllocationFilters {
  dispatch_date?: string;
  depot_id?: string;
  brand_id?: string;
  district_id?: string;
  status?: TripStatus | "all" | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConfirmAllocationResponse {
  success: boolean;
  trip_id: string;
  status: TripStatus;
  confirmed_at: string;
}

export interface OptimizeRequest {
  operating_date: string;
  depot_id: string;
  order_ids?: string[];
}

export interface OptimizeResponse {
  summary: {
    total_orders_processed: number;
    allocated_orders_count: number;
    deferred_orders_count: number;
    total_trips_created: number;
  };
}

export interface ManualAllocateRequest {
  order_ids: string[];
  vehicle_id: string;
  driver_id?: string;
  operating_date: string;
}

export interface ManualAllocateResponse {
  success: boolean;
  trip_id: string;
  trip_code: string;
  status: TripStatus;
  allocated_order_count: number;
}
