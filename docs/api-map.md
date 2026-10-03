# ReTrails API Specification & Endpoint Map

## Overview
This document maps all REST endpoints across the ReTrails FastAPI backend and frontend client applications, referencing specifications in `docs/api-issues.json` and SQLAlchemy models.

---

## 1. Authentication & Users (`/api/v1/auth`, `/api/v1/users`, `/api/v1/guards`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/jwt/login` | `fastapi_users.get_auth_router` | Public (Rate Limited) | Implemented | Authenticates user with username/password, returns JWT token. |
| `POST` | `/api/v1/auth/jwt/logout` | `fastapi_users.get_auth_router` | Authenticated | Implemented | Logs out user and invalidates session token. |
| `POST` | `/api/v1/auth/forgot-password` | `fastapi_users.get_reset_password_router` | Public (Rate Limited) | Implemented | Initiates password reset flow. |
| `POST` | `/api/v1/auth/reset-password` | `fastapi_users.get_reset_password_router` | Public (Rate Limited) | Implemented | Resets password with valid reset token. |
| `POST` | `/api/v1/auth/refresh` | `auth.refresh_token` | Authenticated | Planned (#6) | Silent background token refresh for mobile drivers/loaders. |
| `GET` | `/api/v1/users/me` | `fastapi_users.get_users_router` | Authenticated | Implemented | Returns active authenticated user profile. |
| `PATCH` | `/api/v1/users/me` | `fastapi_users.get_users_router` | Authenticated | Implemented | Updates active authenticated user profile. |
| `GET` | `/api/v1/users` | `api.list_users_by_admin` | `system_admin` | Implemented | Lists all user accounts with metadata. |
| `POST` | `/api/v1/users` | `api.create_user_by_admin` | `system_admin` | Implemented | Creates a new enterprise user. |
| `GET` | `/api/v1/users/{id}` | `fastapi_users.get_users_router` | `system_admin` | Implemented | Fetches user details by UUID. |
| `PATCH` | `/api/v1/users/{id}` | `fastapi_users.get_users_router` | `system_admin` | Implemented | Updates user profile and active status. |
| `DELETE` | `/api/v1/users/{id}` | `fastapi_users.get_users_router` | `system_admin` | Implemented | Deactivates / soft-deletes user account. |
| `GET` | `/api/v1/guards/admin-only` | `api.admin_only_guard` | `system_admin` | Implemented | Verifies administrator RBAC permissions. |
| `GET` | `/api/v1/guards/store-manager` | `api.store_manager_guard` | `store_manager` | Implemented | Verifies store manager RBAC permissions. |
| `GET` | `/api/v1/guards/driver` | `api.driver_guard` | `driver` | Implemented | Verifies driver RBAC permissions. |

---

## 2. Master Domain Reference Data (`/api/v1/master/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/master/depots` | `master.depots.list_depots` | Authenticated | Implemented | Lists all distribution centers (Peliyagoda, Kandy). |
| `GET` | `/api/v1/master/depots/{id}` | `master.depots.get_depot` | Authenticated | Implemented | Returns depot details and coordinates. |
| `GET` | `/api/v1/master/districts` | `master.districts.list_districts` | Authenticated | Implemented | Lists districts with assigned depot relationships. |
| `GET` | `/api/v1/master/brands` | `master.brands.list_brands` | Authenticated | Implemented | Lists retail brands (`FRESH`, `STYLE`, `TECH`). |
| `GET` | `/api/v1/master/outlets` | `master.outlets.list_outlets` | Authenticated | Implemented | Lists 120 retail outlets with dock and bay constraints. |
| `GET` | `/api/v1/master/outlets/{id}` | `master.outlets.get_outlet` | Authenticated | Implemented | Returns specific outlet configuration. |
| `GET` | `/api/v1/master/items` | `master.items.list_items` | Authenticated | Implemented | Lists product catalog items with weight, volume, and SHC. |
| `GET` | `/api/v1/master/items/{id}` | `master.items.get_item` | Authenticated | Implemented | Returns specific catalog SKU details. |
| `GET` | `/api/v1/master/prices` | `master.prices.list_prices` | Authenticated | Implemented | Lists temporal price list entries. |
| `GET` | `/api/v1/master/prices/active` | `master.prices.list_active_prices` | Authenticated | Implemented | Queries currently active price list via database view. |
| `GET` | `/api/v1/master/prices/item/{item_id}`| `master.prices.get_active_price_by_item` | Authenticated | Implemented | Fetches effective price for an item on a date. |
| `POST` | `/api/v1/master/prices` | `master.prices.create_price` | `system_admin` | Implemented | Creates a new temporal price list revision. |
| `GET` | `/api/v1/master/calendar/operating-days`| `master.calendar.list_operating_days` | Authenticated | Implemented | Queries upcoming operating days and calendar flags. |
| `GET` | `/api/v1/master/calendar/surge` | `master.calendar.get_demand_surge` | Authenticated | Implemented | Calculates demand surge factors for date range. |
| `GET` | `/api/v1/master/calendar/range` | `master.calendar.get_calendar_range` | Authenticated | Implemented | Queries calendar day records across a date range. |
| `POST` | `/api/v1/master/calendar/bulk-generate`| `master.calendar.bulk_generate_calendar` | `system_admin` | Implemented | Generates calendar records for specified date span. |

---

## 3. Fleet & Vehicle Registry (`/api/v1/fleet/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/fleet/vehicles` | `fleet.list_vehicles` | Authenticated | Planned (#8) | Lists 60 fleet vehicles with capacity and status filters. |
| `GET` | `/api/v1/fleet/vehicles/{id}` | `fleet.get_vehicle` | Authenticated | Planned (#8) | Fetches vehicle capacity, specs, and driver assignment. |
| `POST` | `/api/v1/fleet/vehicles` | `fleet.create_vehicle` | `system_admin` | Planned (#8) | Registers a new commercial vehicle. |
| `PATCH` | `/api/v1/fleet/vehicles/{id}` | `fleet.update_vehicle` | `dispatcher`, `system_admin` | Planned (#8) | Updates vehicle status (available, workshop, etc.). |
| `GET` | `/api/v1/fleet/drivers` | `fleet.list_drivers` | Authenticated | Planned (#8) | Lists driver profiles, licenses, and depot affinities. |

---

## 4. Vehicle Telemetry & Tracking (`/api/v1/fleet/telemetry/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/fleet/telemetry/report` | `telemetry.report_ping` | `driver` | Planned (#9) | Ingests GPS coordinates, speed, and reefer temperature. |
| `GET` | `/api/v1/fleet/telemetry/live` | `telemetry.get_live_feed` | `dispatcher`, `system_admin` | Planned (#9) | Returns latest GPS positions and status of active fleet. |
| `GET` | `/api/v1/fleet/vehicles/{id}/telemetry/latest` | `telemetry.get_vehicle_latest` | Authenticated | Planned (#9) | Fetches most recent telemetry reading for a vehicle. |

---

## 5. Store Orders & Line Items (`/api/v1/orders/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | `orders.create_order` | `store_manager`, `system_admin` | Planned (#10) | Submits next-day store order with line items. |
| `GET` | `/api/v1/orders` | `orders.list_orders` | Authenticated | Planned (#10) | Lists orders with date, outlet, brand, and status filters. |
| `GET` | `/api/v1/orders/{id}` | `orders.get_order` | Authenticated | Planned (#10) | Detailed order breakdown with line items and valuation. |
| `PATCH` | `/api/v1/orders/{id}/status` | `orders.update_status` | `dispatcher`, `system_admin` | Planned (#10) | Transitions order lifecycle state. |

---

## 6. Order Deferrals & Audit Queue (`/api/v1/deferrals/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders/{id}/defer` | `deferrals.defer_order` | `dispatcher`, `system_admin` | Planned (#11) | Defers an order with reason code and limiting resource. |
| `GET` | `/api/v1/deferrals` | `deferrals.list_deferrals` | `dispatcher`, `system_admin` | Planned (#11) | Lists deferred orders with fairness metrics. |
| `POST` | `/api/v1/deferrals/{id}/re-queue` | `deferrals.requeue_order` | `dispatcher`, `system_admin` | Planned (#11) | Re-queues a deferred order for next planning cycle. |

---

## 7. Daily Trip Manifests & Allocations (`/api/v1/allocations/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/allocations` | `allocations.list_allocations`| `dispatcher`, `system_admin` | Planned (#12) | Lists daily trips with payload utilization metrics. |
| `GET` | `/api/v1/allocations/{id}` | `allocations.get_manifest` | Authenticated | Planned (#12) | Fetches complete trip manifest with sequential stops. |
| `POST` | `/api/v1/allocations/{id}/confirm` | `allocations.confirm_manifest` | `dispatcher`, `system_admin` | Planned (#12) | Releases manifest to warehouse loading bays. |
| `POST` | `/api/v1/allocations/optimize` | `allocations.run_solver` | `dispatcher`, `system_admin` | Planned (#16) | Executes hybrid allocation optimization solver. |
| `GET` | `/api/v1/allocations/engine/status`| `allocations.solver_status` | `dispatcher`, `system_admin` | Planned (#16) | Queries background solver run progress and metrics. |
| `POST` | `/api/v1/allocations/engine/schedule` | `allocations.schedule_cron` | `system_admin` | Planned (#16) | Configures 4:00 PM automated cutoff trigger. |

---

## 8. Warehouse Loader Bay Operations (`/api/v1/loader/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/loader/bays` | `loader.list_bays` | `loader`, `dispatcher`, `system_admin` | Planned (#13) | Lists loading bays and docked vehicle manifests. |
| `GET` | `/api/v1/loader/trips/{trip_id}/checklist` | `loader.get_checklist` | `loader`, `system_admin` | Planned (#13) | Returns reverse delivery sequence (LIFO) checklist. |
| `POST` | `/api/v1/loader/items/{item_id}/verify` | `loader.verify_item` | `loader` | Planned (#13) | Records crate verification with loader stamp. |
| `POST` | `/api/v1/loader/trips/{trip_id}/waypoints/{seq}/seal` | `loader.seal_waypoint` | `loader` | Planned (#13) | Seals completed waypoint stop crates. |
| `POST` | `/api/v1/loader/trips/{trip_id}/confirm-departure` | `loader.confirm_departure` | `loader` | Planned (#13) | Final departure release and seal recording. |

---

## 9. Driver Deliveries & Electronic Proof of Delivery (`/api/v1/driver/...`, `/api/v1/deliveries/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/driver/routes/current` | `driver.get_current_route` | `driver` | Planned (#14) | Fetches active assigned trip, waypoints, and constraints. |
| `POST` | `/api/v1/deliveries/{waypoint_id}/arrive` | `deliveries.record_arrival` | `driver` | Planned (#14) | Records arrival timestamp and triggers store notification. |
| `POST` | `/api/v1/deliveries/{waypoint_id}/pod` | `deliveries.submit_pod` | `driver` | Planned (#14) | Submits recipient signature and closes waypoint. |
| `POST` | `/api/v1/deliveries/{waypoint_id}/discrepancy` | `deliveries.log_discrepancy`| `driver`, `store_manager` | Planned (#14) | Logs damaged, shorted, or rejected crates. |

---

## 10. Universal Offline Mutation Batch Sync (`/api/v1/sync/...`)

| Method | Endpoint | Handler / Route | Access Guard | Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sync/batch` | `sync.process_batch` | Authenticated | Planned (#15) | Ingests queued offline mutations with idempotency deduplication. |
