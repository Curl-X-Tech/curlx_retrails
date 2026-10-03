import type { OptimizeResult, ScheduleCronResponse, SolverStatus } from "./types";

export const MOCK_SOLVER_STATUS: SolverStatus = {
  status: "idle",
  progress_pct: 100,
  operating_date: "2026-10-03",
  last_run_at: "2026-10-03T16:00:00.000Z",
  trips_generated: 4,
  orders_deferred: 1,
  execution_time_ms: 1240,
};

export const MOCK_OPTIMIZE_RESULT: OptimizeResult = {
  proposed_trips: [
    {
      trip_code: "RT-14",
      brand_id: "brand-fresh",
      district_id: "dist-colombo",
      vehicle_id: "veh-01",
      driver_id: "drv-01",
      order_ids: ["ord-101", "ord-102", "ord-103"],
      route_leg_count: 3,
      total_weight_kg: 3360,
      total_volume_m3: 22.4,
      estimated_duration_min: 135,
    },
    {
      trip_code: "RT-08",
      brand_id: "brand-style",
      district_id: "dist-gampaha",
      vehicle_id: "veh-02",
      driver_id: "drv-02",
      order_ids: ["ord-201", "ord-202"],
      route_leg_count: 2,
      total_weight_kg: 4920,
      total_volume_m3: 17.8,
      estimated_duration_min: 195,
    },
  ],
  deferred_orders: [
    {
      order_id: "ord-999",
      order_ref: "ORD-2026-0921-99",
      outlet_id: "out-099",
      reason_code: "insufficient_reefer_capacity",
      limiting_resource: "weight_cap",
      notes: "Demand exceeded available reefer truck capacity for Fresh Colombo route",
    },
  ],
  execution_time_ms: 1240,
  feasibility_passed: true,
  solver_status: "optimal",
  summary: {
    total_orders_processed: 6,
    allocated_orders_count: 5,
    deferred_orders_count: 1,
    total_trips_created: 2,
  },
};

export const MOCK_SCHEDULE_CRON_RESPONSE: ScheduleCronResponse = {
  success: true,
  scheduled_at: "2026-10-03T16:00:00.000Z",
  cron_expression: "0 16 * * 1-6",
  message: "Automated 4:00 PM cutoff solver cron scheduled successfully",
};
