# Data Model

**Project**: ReTrails — Team CurlX

All entities listed here exist in `docs/schema/schema.sql` and are mapped via SQLAlchemy 2.0 ORM models in `backend/app/entities/`.

---

## 1. ER Diagram (Textual)

```
depot (1) ---< district (many)
depot (1) ---< outlet (many)
depot (1) ---< vehicle (many)
depot (1) ---< staff_profile (many)

brand (1) ---< outlet (many)
brand (1) ---< item (many)

outlet (1) ---< customer_order (many)
outlet (1) ---< route_leg (many) [to_outlet_id]

staff_profile (1) ---< customer_order (many) [created_by]
staff_profile (1) ---< trip (many) [driver_id]
staff_profile (1) ---< deferral_audit_log (many) [decision_maker]
staff_profile (1) ---< loading_checklist_item (many) [verified_by]
staff_profile (1) ---< discrepancy_report (many) [reported_by]

vehicle (1) ---< trip (many)

customer_order (1) ---< order_item (many)
customer_order (1) ---< deferral_audit_log (many)
customer_order (1) ---< route_leg (many) [order_id]

item (1) ---< order_item (many)
item (1) ---< price_list (many)

trip (1) ---< route_leg (many)
trip (1) ---< loading_checklist_item (many)
trip (1) ---< proof_of_delivery (many)
trip (1) ---< discrepancy_report (many)
trip (1) ---< vehicle_telemetry (many)
trip (1) ---< cargo_bay_allocation (many)

route_leg (1) ---< proof_of_delivery (1)

order_item (1) ---< loading_checklist_item (many)
order_item (1) ---< cargo_bay_allocation (many)
order_item (1) ---< discrepancy_report (many)

sync_batch_log (1) ---< sync_mutation_audit_log (many)

calendar_day (1) ---< customer_order (many) [order_date]
calendar_day (1) ---< trip (many) [dispatch_date]
calendar_day (1) ---< deferral_audit_log (many) [dispatch_date]
```

---

## 2. Entity Descriptions

### 2.1 depot

| Field | Description |
|---|---|
| Purpose | Represents a physical distribution center. Two depots: Peliyagoda (PEL) and Kandy (KDY). |
| Primary Key | `id` (UUID) |
| Important Attributes | `code` (PEL/KDY), `name`, `latitude`, `longitude`, `address`, `is_active` |
| Relationships | Referenced by district, outlet, vehicle, staff_profile, trip |

### 2.2 district

| Field | Description |
|---|---|
| Purpose | One of 12 geographic districts served (e.g. Colombo, Gampaha, Kandy). |
| Primary Key | `id` (UUID) |
| Important Attributes | `name`, `province` (Western/Central), `assigned_depot_id` |
| Relationships | Belongs to depot; referenced by outlet, trip, allocation solver |

### 2.3 brand

| Field | Description |
|---|---|
| Purpose | One of three Waypoint brands (Fresh, Style, Tech). |
| Primary Key | `id` (UUID) |
| Important Attributes | `code` (FRESH/STYLE/TECH), `name`, `delivery_window_type`, `requires_cold_chain`, `daily_time_budget_min` |
| Relationships | Referenced by outlet, item, trip |

### 2.4 calendar_day

| Field | Description |
|---|---|
| Purpose | Operating calendar with festival demand surge, monsoon, and payday flags. |
| Primary Key | `date` (DATE) |
| Important Attributes | `dow`, `is_weekend`, `is_payday`, `festival`, `festival_ramp`, `is_holiday`, `monsoon`, `is_operating` |
| Relationships | Referenced by customer_order.order_date, trip.dispatch_date, deferral_audit_log.dispatch_date |

### 2.5 outlet

| Field | Description |
|---|---|
| Purpose | A retail outlet (store). 120 outlets: OUT001-OUT120. |
| Primary Key | `id` (UUID) |
| Important Attributes | `outlet_id` (OUT001...), `brand_id`, `district_id`, `depot_id`, `dock_type` (rear_dock/street/mall_bay), `parking_constraint` (normal/van_only/mall_dock), `mall_window`, `window_open_time`, `window_close_time`, `latitude`, `longitude`, `contact_phone` |
| Relationships | Belongs to brand, district, depot; referenced by customer_order, route_leg, staff_profile |

### 2.6 item

| Field | Description |
|---|---|
| Purpose | A catalog SKU (product). |
| Primary Key | `id` (UUID) |
| Important Attributes | `sku`, `brand_id`, `name`, `category`, `unit` (Crate/Box/Nos/Pack/Kg/Carton), `unit_weight_kg`, `unit_volume_m3`, `requires_cold_chain`, `special_handling_code` (COL/FRG/MAL/HAZ) |
| Relationships | Belongs to brand; referenced by order_item, price_list |

### 2.7 price_list

| Field | Description |
|---|---|
| Purpose | Temporal price entry per item. The view `v_active_price_list` returns the current active price. |
| Primary Key | `id` (UUID) |
| Important Attributes | `item_id`, `cost_price`, `unit_price` (LKR), `currency` (LKR), `effective_from`, `effective_to`, `price_change_reason`, `is_active` |
| Relationships | Belongs to item. Trigger `fn_auto_lock_order_item_price` locks price into order_item at insert time. |

### 2.8 users

| Field | Description |
|---|---|
| Purpose | Login account managed by fastapi-users. |
| Primary Key | `id` (UUID) |
| Important Attributes | `email`, `hashed_password`, `is_active`, `is_verified`, `user_type` (role enum) |
| Relationships | 1-to-1 with staff_profile |

### 2.9 staff_profile

| Field | Description |
|---|---|
| Purpose | Employee profile enriching the User account with operational data. |
| Primary Key | `id` (UUID) |
| Important Attributes | `user_id`, `employee_code`, `first_name`, `last_name`, `email`, `phone`, `role` (system_admin/dispatcher/loader/driver/store_manager), `depot_id`, `outlet_id`, `blood_group`, `license_number`, `license_class`, `license_expiry`, `safety_rating`, `total_completed_trips` |
| Relationships | Belongs to User, Depot, Outlet. Referenced by trip (driver), deferral_audit_log, loading_checklist_item, discrepancy_report, proof_of_delivery |

### 2.10 vehicle

| Field | Description |
|---|---|
| Purpose | Fleet vehicle. 60 vehicles: VEH001-VEH060. |
| Primary Key | `id` (UUID) |
| Important Attributes | `vehicle_id` (VEH001...), `reg_number`, `model_name`, `type` (truck/van), `temp` (reefer/ambient), `weight_cap_kg`, `volume_cap_m3`, `fuel_type`, `km_per_l`, `weekly_fuel_quota_l`, `consumed_fuel_l`, `depot_id`, `assigned_driver_id`, `status` (available/loading/in_transit/in_workshop/breakdown) |
| Relationships | Belongs to depot; referenced by trip, vehicle_telemetry |

Fleet composition: 12 Reefer Trucks, 40 Dry Trucks, 4 Reefer Vans, 4 Ambient Vans.

### 2.11 customer_order

| Field | Description |
|---|---|
| Purpose | An order placed by a store manager for delivery on a target date. |
| Primary Key | `id` (UUID) |
| Important Attributes | `order_ref` (e.g. S1-000), `outlet_id`, `created_by_staff_id`, `order_date`, `required_date`, `temp_requirement` (chilled/ambient), `status` (pending/allocated/in_transit/delivered/deferred/cancelled), `idempotency_key`, `is_urgent`, `deferred_yesterday` (0/1), `days_since_last_served` |
| Relationships | Belongs to outlet, staff_profile, calendar_day. Has order_item, deferral_audit_log, route_leg |

### 2.12 order_item

| Field | Description |
|---|---|
| Purpose | A line item in an order with locked physical dimensions and price. |
| Primary Key | `id` (UUID) |
| Important Attributes | `order_id`, `item_id`, `package_code` (PKG-xxxxx-A), `requested_qty`, `loaded_qty`, `delivered_qty`, `unit_weight_kg`, `unit_volume_m3`, `unit_price` (LKR, auto-locked by trigger), `special_handling_code` |
| Relationships | Belongs to customer_order, item. Referenced by loading_checklist_item, cargo_bay_allocation, discrepancy_report |

View `v_customer_order_summary` aggregates totals (total_weight_kg, total_volume_m3, total_order_value_lkr, loaded_weight_kg, loaded_volume_m3) dynamically.

### 2.13 deferral_audit_log

| Field | Description |
|---|---|
| Purpose | Immutable record of why an order was deferred on a given dispatch date. |
| Primary Key | `id` (UUID) |
| Important Attributes | `order_id`, `outlet_id`, `dispatch_date`, `deferral_reason` (insufficient_reefer_capacity/van_access_shortage/time_budget_limit/fuel_quota_exceeded/fleet_unavailable), `limiting_resource`, `decision_maker_staff_id`, `notes` |
| Relationships | Belongs to customer_order, outlet, staff_profile, calendar_day |

### 2.14 trip

| Field | Description |
|---|---|
| Purpose | A planned vehicle dispatch for a single day. Maximum 2 trips per vehicle per day enforced by unique constraint. |
| Primary Key | `id` (UUID) |
| Important Attributes | `trip_code` (TRP-YYYYMMDD-NNNN), `dispatch_date`, `trip_sequence` (1 or 2), `vehicle_id`, `driver_id`, `depot_id`, `brand_id`, `district_id`, `seal_number`, `status` (scheduled/loading/dispatched/in_transit/completed/cancelled), `planned_start_time`, `actual_start_time`, `actual_end_time`, `outbound_travel_min`, `inter_stop_travel_min`, `total_handling_min`, `total_trip_duration_min`, `total_distance_km` |
| Relationships | Belongs to vehicle, driver (staff_profile), depot, brand, district. Has route_leg, loading_checklist_item, proof_of_delivery, discrepancy_report, vehicle_telemetry |
| Constraint | UNIQUE(dispatch_date, vehicle_id, trip_sequence) enforces the 2-trip-per-vehicle rule. |

### 2.15 route_leg

| Field | Description |
|---|---|
| Purpose | A single stop (waypoint) on a trip route with planned and actual timestamps. |
| Primary Key | `id` (UUID) |
| Important Attributes | `leg_id` (TRP-...-N), `trip_id`, `seq` (0-indexed), `from_point` (DEPOT or previous outlet UUID), `to_outlet_id`, `order_id`, `distance_km`, `planned_depart_time`, `planned_travel_duration_min`, `planned_arrival_time`, `actual_depart_time`, `arrival_time`, `leave_outlet_time`, `status` (pending/in_transit/arrived/completed/skipped/newly_added), `sealed_at`, `sealed_by_staff_id` |
| Relationships | Belongs to trip, outlet, customer_order |

Trigger `fn_sync_trip_metrics` fires AFTER INSERT/UPDATE/DELETE on route_leg to recompute trip totals.

### 2.16 cargo_bay_allocation

| Field | Description |
|---|---|
| Purpose | 3D cargo bay grid position for LIFO loading staging visualization. |
| Primary Key | `id` (UUID) |
| Important Attributes | `trip_id`, `order_item_id`, `bay_x` (1-4), `bay_y` (1-6), `bay_z` (1=base, 2=stacked), `is_loaded` |
| Relationships | Belongs to trip, order_item |

### 2.17 loading_checklist_item

| Field | Description |
|---|---|
| Purpose | Per-item pre-departure loading verification record for the Loader role. |
| Primary Key | `id` (UUID) |
| Important Attributes | `trip_id`, `order_item_id`, `status` (pending/scanned/verified/flagged), `scanned_barcode`, `verified_by_staff_id`, `verified_at`, `shortfall_qty`, `notes` |
| Relationships | Belongs to trip, order_item, staff_profile |

### 2.18 proof_of_delivery

| Field | Description |
|---|---|
| Purpose | Delivery confirmation captured by the driver at each stop. Offline-capable. |
| Primary Key | `id` (UUID) |
| Important Attributes | `trip_id`, `order_id`, `route_leg_id`, `outlet_id`, `recipient_name`, `recipient_phone`, `signature_svg`, `arrived_at`, `delivered_at`, `delivery_lat`, `delivery_lng`, `temperature_reading`, `photo_evidence_url`, `is_offline_synced` |
| Relationships | Belongs to trip, customer_order, route_leg, outlet |

### 2.19 discrepancy_report

| Field | Description |
|---|---|
| Purpose | Records any delivery issue: damaged, shortage, rejected, temperature breach, or delayed window. |
| Primary Key | `id` (UUID) |
| Important Attributes | `trip_id`, `order_id`, `order_item_id`, `discrepancy_type` (damaged/shortage/rejected/temp_breach/delayed_window), `reported_qty`, `reported_by_staff_id`, `reported_at`, `description`, `photo_url`, `resolution_status` (open/under_investigation/resolved/waived) |
| Relationships | Belongs to trip, customer_order, order_item, staff_profile |

Temperature breach discrepancies are also auto-inserted by the `fn_telemetry_cold_chain_guard` trigger when reefer temperature exceeds 4.0 degrees Celsius.

### 2.20 vehicle_telemetry

| Field | Description |
|---|---|
| Purpose | Live GPS and cold-chain temperature log per vehicle per trip. |
| Primary Key | `id` (BIGSERIAL) |
| Important Attributes | `vehicle_id`, `trip_id`, `timestamp`, `latitude`, `longitude`, `speed_kmh`, `heading_deg`, `reefer_temp_celsius`, `ambient_temp_celsius`, `fuel_level_pct`, `battery_pct`, `idempotency_key` |
| Relationships | Belongs to vehicle, trip |

### 2.21 sync_batch_log and sync_mutation_audit_log

| Field | Description |
|---|---|
| Purpose | Server-side audit trail of every offline sync batch and each mutation's result. |
| Primary Key | `id` (UUID) |
| Important Attributes | `batch_id`, `client_id`, `staff_id`, `total_mutations`, `processed_count`, `failed_count`, `status` (processing/success/partial_error/failed), `idempotency_key` (per mutation), `entity_name`, `action`, `payload_json`, `status` (applied/duplicate_ignored/conflict_resolved/failed) |
| Relationships | sync_batch_log has many sync_mutation_audit_log |

---

## 3. Key Database Views

| View | Purpose |
|---|---|
| `v_active_price_list` | Returns the currently active unit price per item (used by the auto-lock trigger) |
| `v_customer_order_summary` | Aggregates order line-item totals (weight, volume, value) per order |
| `v_trip_payload_summary` | Aggregates payload weight, volume, and utilization percentages per trip |

---

## 4. Key Indexes

| Index | Table | Columns | Purpose |
|---|---|---|---|
| idx_staff_role_depot | staff_profile | role, depot_id | Fast role + depot scoping |
| idx_outlet_depot_brand | outlet | depot_id, brand_id | Depot + brand filtering |
| idx_vehicle_depot_status | vehicle | depot_id, status | Fleet availability queries |
| idx_order_status_urgent | customer_order | status, is_urgent | Allocation order fetch |
| idx_trip_dispatch_date | trip | dispatch_date, status | Daily trip board |
| idx_trip_vehicle_seq | trip | vehicle_id, dispatch_date, trip_sequence | 2-trip-per-vehicle enforcement |
| idx_telemetry_veh_ts | vehicle_telemetry | vehicle_id, timestamp DESC | Live map queries |
| idx_sync_idempotency | sync_mutation_audit_log | idempotency_key | Duplicate detection |

---

## 5. Data Lifecycle

```
item + price_list (seeded)
         |
     outlet places
         |
customer_order (status: pending)
         |
   allocation engine runs
         |
     trip created
     route_leg created
     customer_order.status = allocated
         |
   loader loads
         |
   loading_checklist_item created and verified
   route_leg.sealed_at set per waypoint
   trip.status = dispatched
   customer_order.status = in_transit
         |
   driver delivers
         |
   route_leg.status = arrived, then completed
   proof_of_delivery created
   discrepancy_report created (if any)
   customer_order.status = delivered
   trip.status = completed (when all legs done)
         |
   [offline mutations drain via /sync/batch]
```
