export type DeferralReason =
  | "insufficient_reefer_capacity"
  | "van_access_shortage"
  | "time_budget_limit"
  | "fuel_quota_exceeded"
  | "manual_dispatcher_override";

export type LimitingResource =
  "weight_cap" | "volume_cap" | "time_budget" | "fleet_downtime";

export interface DeferralAuditLog {
  id: string;
  order_id: string;
  outlet_id: string;
  dispatch_date: string;
  deferral_reason: DeferralReason;
  limiting_resource: LimitingResource;
  decision_maker_staff_id: string;
  notes?: string | null;
  created_at: string;
  order_ref?: string;
  outlet_name?: string;
  brand?: string;
  brand_id?: string;
  district?: string;
  decision_maker_name?: string;
  decision_maker_role?: string;
  total_weight_kg?: number;
  total_volume_m3?: number;
  total_value_lkr?: number;
  temp_requirement?: "chilled" | "ambient";
  dock_type?: string;
}

export interface DeferredOrder {
  id: string;
  order_ref: string;
  outlet_id: string;
  brand_id: string;
  order_date: string;
  temp_requirement: "chilled" | "ambient";
  status: "deferred" | string;
  total_weight_kg: number;
  total_volume_m3: number;
  total_price_lkr: number;
  created_at: string;
  updated_at?: string;
  required_date?: string;
  is_urgent?: boolean;
  days_since_last_served: number;
  deferred_yesterday: number;
  deferral_reason?: DeferralReason | string;
  latest_reason?: DeferralReason | string;
  limiting_resource?: LimitingResource | string;
  outlet_name?: string;
  brand?: string;
  district?: string;
  dock_type?: string;
  parking_constraint?: string;
  total_items?: number;
  suggested_vehicle_category?: string;
  notes?: string;
}

export interface DeferralSummary {
  total_deferred_orders: number;
  critical_escalations_count: number;
  total_weight_kg: number;
  total_volume_m3: number;
  total_value_lkr: number;
  chilled_orders_count: number;
  ambient_orders_count: number;
  van_restricted_count: number;
  reasons_breakdown: Record<DeferralReason, number>;
}

export interface DeferOrderRequest {
  reason: DeferralReason;
  limiting_resource: LimitingResource;
  notes?: string;
  dispatch_date?: string;
  decision_maker_staff_id?: string;
}

export interface RequeueRequest {
  priority?: number;
  notes?: string;
}

export interface DeferralFilters {
  date?: string;
  dispatch_date?: string;
  outlet_id?: string;
  brand_id?: string;
  reason?: DeferralReason | "all" | string;
  limiting_resource?: LimitingResource | "all" | string;
  search?: string;
  page?: number;
  limit?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}
