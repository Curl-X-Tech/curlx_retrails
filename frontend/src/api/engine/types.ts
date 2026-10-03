export interface VehicleOverride {
  vehicle_id: string;
  status: "available" | "in_workshop";
}

export interface OptimizeRequest {
  operating_date: string; // 'YYYY-MM-DD'
  depot_id: string;
  order_ids?: string[];
  vehicle_overrides?: VehicleOverride[];
}

export interface ProposedTrip {
  trip_code: string;
  brand_id: string;
  district_id: string;
  vehicle_id: string;
  driver_id: string;
  order_ids: string[];
  route_leg_count: number;
  total_weight_kg: number;
  total_volume_m3: number;
  estimated_duration_min: number;
}

export interface DeferredOrderReason {
  order_id: string;
  order_ref: string;
  outlet_id: string;
  reason_code: string;
  limiting_resource: string;
  notes?: string;
}

export interface OptimizeResult {
  proposed_trips: ProposedTrip[];
  deferred_orders: DeferredOrderReason[];
  execution_time_ms: number;
  feasibility_passed: boolean;
  solver_status: "optimal" | "feasible" | "infeasible" | "error";
  summary: {
    total_orders_processed: number;
    allocated_orders_count: number;
    deferred_orders_count: number;
    total_trips_created: number;
  };
}

export interface SolverStatus {
  status: "idle" | "running" | "completed" | "failed";
  progress_pct: number;
  operating_date: string;
  last_run_at: string | null;
  trips_generated: number;
  orders_deferred: number;
  execution_time_ms: number;
}

export interface ScheduleCronRequest {
  cutoff_time: string; // "16:00"
  timezone: string; // "Asia/Colombo"
  is_enabled: boolean;
}

export interface ScheduleCronResponse {
  success: boolean;
  scheduled_at: string;
  cron_expression: string;
  message: string;
}
