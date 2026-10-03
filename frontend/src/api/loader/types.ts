export type DockStatus = "empty" | "docked_loading" | "verified_sealed" | "departed";

export type ItemVerificationStatus = "pending" | "verified" | "flagged_shortfall";

export interface CargoBayAllocation {
  id: string;
  bay_number: string;
  depot_id: string;
  vehicle_id: string;
  trip_id: string;
  dock_status: DockStatus;
  started_at: string | null;
  completed_at: string | null;
}

export interface LoadingChecklistItem {
  id: string;
  trip_id: string;
  order_item_id: string;
  package_code: string;
  sku: string;
  item_title: string;
  category: string;
  staging_bay: string;
  crate_count: number;
  gross_weight_kg: number;
  gross_volume_m3: number;
  is_reefer: boolean;
  temperature_req?: string;
  special_handling_code?: string | null;
  verification_status: ItemVerificationStatus;
  verified_by_user_id?: string | null;
  verified_at?: string | null;
  shortfall_qty?: number;
  note?: string;
}

export interface BayWithManifest {
  bay: CargoBayAllocation;
  vehicle: {
    id: string;
    vehicle_id: string;
    reg_number: string;
    model_name: string;
    type: "truck" | "van";
    temp: "reefer" | "ambient";
    weight_cap_kg: number;
    volume_cap_m3: number;
  };
  driver: {
    name: string;
    phone: string;
    license_number?: string;
  };
  trip: {
    id: string;
    trip_code: string;
    dispatch_date: string;
    planned_departure_time: string;
    stops_count: number;
    next_stop_name: string;
    status: string;
  };
  progress: {
    verified_items_count: number;
    total_items_count: number;
    verified_crates_count: number;
    total_crates_count: number;
    payload_kg: number;
    max_payload_kg: number;
    payload_percentage: number;
    volume_m3: number;
    max_volume_m3: number;
    volume_percentage: number;
  };
}

export interface ChecklistWaypoint {
  seq: number;
  outlet_id: string;
  outlet_code: string;
  outlet_name: string;
  dock_type: string;
  parking_constraint: string;
  delivery_window: string;
  is_sealed: boolean;
  sealed_at?: string | null;
  sealed_by_user_id?: string | null;
  items: LoadingChecklistItem[];
}

export interface TripChecklist {
  trip: {
    id: string;
    trip_code: string;
    dispatch_date: string;
    status: string;
    vehicle_id: string;
    vehicle_reg: string;
    driver_name: string;
    depot_id: string;
    dock_bay: string;
    seal_number?: string | null;
  };
  waypoints: ChecklistWaypoint[];
  summary: {
    total_waypoints: number;
    sealed_waypoints: number;
    total_items: number;
    verified_items: number;
    is_ready_for_departure: boolean;
  };
}

export interface VerifyItemRequest {
  status: ItemVerificationStatus;
  shortfall_qty?: number;
  note?: string;
}

export interface SealWaypointRequest {
  notes?: string;
}

export interface ConfirmDepartureRequest {
  seal_number: string;
}

export interface VerifyItemResponse {
  success: boolean;
  item_id: string;
  status: ItemVerificationStatus;
  verified_at: string;
}

export interface SealWaypointResponse {
  success: boolean;
  trip_id: string;
  seq: number;
  is_sealed: boolean;
  sealed_at: string;
}

export interface ConfirmDepartureResponse {
  success: boolean;
  trip_id: string;
  status: string;
  departed_at: string;
}
