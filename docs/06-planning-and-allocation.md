# Planning and Allocation

**Project**: ReTrails — Team CurlX

---

## 1. Overview

The allocation engine runs as an on-demand API call (`POST /api/v1/allocations/optimize`) triggered by the Dispatcher. It can also be scheduled to run automatically at the daily 16:00 order cutoff via a cron configuration (`POST /api/v1/allocations/engine/schedule`).

Two solver strategies are available:

| Strategy | Selector | Description |
|---|---|---|
| Heuristic | `solver_type=heuristic` | Greedy priority-ordered, deterministic, sub-second |
| OR-Tools CP-SAT | `solver_type=ortools` | Constraint programming solver (Google OR-Tools 9.10+) |

The default is OR-Tools.

---

## 2. Order Planning

### Orders Available for Planning

The engine fetches orders from `customer_order` where:
- `status IN ('pending', 'deferred')`
- `outlet.depot_id = requested depot_id`
- `order_date <= operating_date` (or explicitly provided `order_ids`)

Deferred orders from previous days are included automatically. If no orders exist for `operating_date`, the engine falls back to all pending/deferred orders for the depot regardless of date.

### Order Priority Scoring

Orders are sorted in descending priority before packing. The priority score (`AllocationOrder.priority_score`) is computed from:

```
deferred_yesterday (1 = highest priority) > days_since_last_served (higher = higher priority) > is_urgent
```

This ensures consecutively deferred orders are served first, satisfying the rule that no outlet may be skipped two days in a row.

### Order Status Transitions

| Status | Meaning |
|---|---|
| pending | Placed by store manager, awaiting allocation |
| allocated | Assigned to a trip by the engine |
| in_transit | Vehicle has departed |
| delivered | POD submitted by driver |
| deferred | Could not be allocated; carry-forward to next day |
| cancelled | Manually cancelled |

### Planning Date

The `operating_date` is passed as a request parameter. The trip's `dispatch_date` is set to this value. Planned start time defaults to 05:00 SLST (Sri Lanka Standard Time, UTC+05:30).

---

## 3. Feasibility Rules (All Enforced by Heuristic Solver)

The heuristic solver enforces seven feasibility rules explicitly derived from the competition booklet:

### Rule 1 — Same Brand and Same District per Trip

Orders are clustered by `(depot_id, brand_id, district_id)` before allocation begins. All orders on a single trip must share brand and district. This is enforced at the database level by `trip.brand_id` and `trip.district_id` columns, and at the schema level by a NOT NULL constraint.

```
Input:   Orders for Mixed brands/districts
Rule:    Group by (depot_id, brand_id, district_id)
Output:  Each trip assigned orders from exactly one brand and one district
```

### Rule 2 — Refrigeration Requirement

```
Input:   Order with temp_requirement = 'chilled'
Rule:    vehicle.temp must be 'reefer'
Decision: If reefer vehicle not available, exclude chilled orders from ambient vehicle candidate pool
Output:  Chilled orders remain unallocated and are deferred with reason=insufficient_reefer_capacity
```

### Rule 3 — Van-Only Outlet Access

```
Input:   Order for outlet with parking_constraint = 'van_only'
Rule:    vehicle.type must be 'van'
Decision: If only trucks are available, exclude van_only orders from truck candidate pool
Output:  Van-only orders remain unallocated and are deferred with reason=van_access_shortage
```

### Rule 4 — Depot-Home Constraint

```
Input:   Vehicle with depot_id = X
Rule:    Vehicle can only be assigned to orders served from depot X
Decision: Vehicle pool is filtered to eligible_vehicles where v.depot_id == depot_id
Output:  Vehicles serve only their home depot's orders
```

### Rule 5 — Whole-Order Handling

```
Input:   An order with N line items
Rule:    The entire order is allocated as a unit; partial allocation is not permitted
Decision: An order either fits entirely within remaining capacity or is excluded
Output:  All items in an order travel together on the same trip
```

### Rule 6 — Capacity Constraints (Weight and Volume)

```
Input:   Candidate order with total_weight_kg and total_volume_m3
Rule:    current_weight + order_weight <= vehicle.weight_cap_kg
         current_volume + order_volume <= vehicle.volume_cap_m3
Decision: If either limit is exceeded, order is not added to the trip
Output:  Trip payload stays within vehicle weight and volume limits
```

### Rule 7 — Time Budget

```
Input:   Candidate order adding a stop to trip
Formula: trip_minutes = depot_to_district_min + (inter_stop_min * (stops - 1)) + sum(service_allowances)
Limits:  Fresh brand: 270 min (03:30 to 08:00)
         Style / Tech: 480 min (standard trading day)
Decision: If used_budget + trial_duration > allowed_budget, order is excluded
Output:  Trip duration stays within daily operating time budget
```

Travel reference tables (hardcoded in `time_budget.py`):

| Route | Depot to District (min) | Inter-Stop (min) |
|---|---|---|
| Peliyagoda -> Colombo | 24.0 | 5.0 |
| Peliyagoda -> Gampaha | 37.5 | 6.0 |
| Peliyagoda -> Kalutara | 54.0 | 7.2 |
| Peliyagoda -> Galle | 93.8 | 5.2 |
| Peliyagoda -> Matara | 120.0 | 5.2 |
| Peliyagoda -> Kurunegala | 114.0 | 7.2 |
| Peliyagoda -> Puttalam | 156.0 | 7.2 |
| Kandy -> Kandy | 16.0 | 5.0 |
| Kandy -> Matale | 33.6 | 7.2 |
| Kandy -> Nuwara Eliya | 156.0 | 10.0 |
| Kandy -> Badulla | 250.0 | 10.0 |
| Kandy -> Kegalle | 54.0 | 7.2 |

Service allowance reference tables:

| Brand | Dock Type | Handling (min) |
|---|---|---|
| Fresh | rear_dock | 20 |
| Fresh | street | 25 |
| Fresh | mall_bay | 35 |
| Style | rear_dock | 25 |
| Style | street | 30 |
| Style | mall_bay | 40 |
| Tech | rear_dock | 30 |
| Tech | street | 35 |
| Tech | mall_bay | 45 |

---

## 4. Vehicle Selection Logic

For each cluster of orders in a given (depot, brand, district), the heuristic solver:

1. Builds `eligible_vehicles` from the vehicle pool where:
   - `v.depot_id == depot_id`
   - `v.trips_assigned < MAX_TRIPS_PER_VEHICLE` (max = 2)
2. For each eligible vehicle, applies Rule 2 (reefer) and Rule 3 (van-only) to filter the candidate order pool.
3. Attempts to pack orders (sorted by priority) into the vehicle under Rule 5 (whole order), Rule 6 (capacity), and Rule 7 (time budget).
4. Selects `best_vehicle` as the vehicle that can accommodate the most orders.
5. If no vehicle can accommodate any orders, all remaining orders in the cluster are deferred.

Maximum trips per vehicle per day: 2. Enforced at database level by `UNIQUE(dispatch_date, vehicle_id, trip_sequence)`.

---

## 5. Trip Creation

After the solver produces `ProposedTrip` records, the engine persists them to the database:

```
Trip record:
  trip_code = TRP-{YYYYMMDD}-{sequence:04d}
  dispatch_date = operating_date
  trip_sequence = 1 or 2 (based on vehicle's existing trips that day)
  vehicle_id = assigned vehicle
  driver_id = vehicle.assigned_driver_id (or depot's first available driver)
  brand_id = cluster brand
  district_id = cluster district
  status = scheduled
  planned_start_time = operating_date 05:00 SLST

Route legs (one per order in the trip):
  seq = 0-indexed
  from_point = DEPOT (seq=0) or previous outlet UUID
  to_outlet_id = outlet serving the order
  order_id = the assigned order
  planned_depart_time = 05:00 + cumulative travel minutes
  planned_arrival_time = planned_depart_time + leg travel minutes
  planned_travel_duration_min = outbound_min (seq=0) or inter_stop_min
  distance_km = 15.0 (fixed placeholder; actual GPS-derived distance is NOT IMPLEMENTED)
  status = pending
```

The `fn_sync_trip_metrics` trigger automatically recomputes `trip.total_distance_km` and `trip.total_trip_duration_min` after route legs are inserted.

---

## 6. Deferred Orders

### When orders are deferred

An order is deferred when it cannot be assigned to any trip due to:
- `fleet_unavailable` — no eligible vehicles remain (all at max trips or in workshop)
- `insufficient_reefer_capacity` — chilled order, no reefer vehicle available
- `van_access_shortage` — van_only outlet, no van available
- `time_budget_limit` — adding the order would exceed the vehicle's time budget

### How deferral is recorded

The engine inserts a `DeferralAuditLog` row per deferred order with:
- `order_id`, `outlet_id`, `dispatch_date`
- `deferral_reason` (one of the four reason codes above)
- `limiting_resource` (fleet_downtime or time_budget)
- `decision_maker_staff_id` (the authenticated dispatcher's staff_profile.id)

The deferred `customer_order` is updated:
- `status = deferred`
- `deferred_yesterday = 1`
- `days_since_last_served += 1`

On the next allocation run, deferred orders appear in the candidate pool with elevated priority.

### How the Dispatcher sees deferred orders

The Dispatcher accesses `GET /api/v1/deferrals` to view the deferral audit log, filterable by `dispatch_date`, `outlet_id`, and `deferral_reason`.

The Dispatcher page `deferrals-page.tsx` renders a table of deferred orders with reason codes and affected outlet details.

### How the Store Manager is informed

The Store Manager views deferred orders on `store-deferrals-page.tsx`, which calls `GET /api/v1/deferrals` scoped to their outlet. The order status is shown as `deferred` on the order list. A deferral reason and the next expected delivery date are displayed.

---

## 7. Manual Allocation

In addition to automated allocation, the Dispatcher can manually allocate specific orders:

`POST /api/v1/allocations/manual`

```json
{
  "order_ids": ["uuid1", "uuid2"],
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "operating_date": "2026-10-05"
}
```

Manual allocation uses `app/services/manual_allocation.py` (`allocate_orders()`). This service does not enforce all seven feasibility rules; it accepts the Dispatcher's override. The resulting trip is committed with `status=scheduled`.

---

## 8. Allocation Confirmation Flow

After the engine creates trips with `status=scheduled`, the Dispatcher reviews them on the Allocation Summary page and calls:

`POST /api/v1/allocations/{trip_id}/confirm`

This:
1. Sets `trip.status = loading`
2. Sets all orders in the trip to `status = allocated`
3. Calls `ensure_checklist()` to pre-create all `loading_checklist_item` rows for the Loader.

---

## 9. Simulation Mode

The engine supports a dry-run simulation: pass `simulation=true` in the optimize request. In simulation mode, no Trip, RouteLeg, DeferralAuditLog, or CustomerOrder records are written to the database. The response contains transient `trip_id` values prefixed `sim-`.

---

## 10. Engine Status

`GET /api/v1/allocations/engine/status` returns the current `SOLVER_STATE`:
- `status` (idle/running/completed/failed)
- `progress_pct`
- `last_run_at`
- `trips_generated`
- `orders_deferred`
- `execution_time_ms`

---

## 11. Fuel Quota Constraint

**NOT YET IMPLEMENTED as an active blocking constraint in the allocation engine.**

The `vehicle.weekly_fuel_quota_l` and `vehicle.consumed_fuel_l` fields exist in the schema and are visible on the Dispatcher Fuel Quotas page (`dispatcher-fuel-quotas-page.tsx`). However, the allocation engine does not currently check `consumed_fuel_l < weekly_fuel_quota_l` before assigning a trip to a vehicle. This is planned as a future constraint.

`fuel_quota_exceeded` appears as a possible deferral reason code in the `deferral_audit_log.deferral_reason` CHECK constraint but is not currently emitted by the solver.
