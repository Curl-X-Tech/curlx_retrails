# ReTrails API Gaps & Mock Data Analysis

## Overview
This document identifies frontend hooks, functions, and mock datasets in `frontend/src` that currently do not have corresponding or connected backend endpoints.

---

## 1. Frontend Hooks Without Connected Backend Endpoints

| Hook / Function | Source File | Attempted / Expected Endpoint | Status & Reason |
| :--- | :--- | :--- | :--- |
| `useCreateOutlet` | `src/hooks/use-master-data.ts` | `POST /api/v1/master/outlets` | Backend master outlets router only implements `GET /` and `GET /{id}`. |
| `useUpdateOutlet` | `src/hooks/use-master-data.ts` | `PUT /api/v1/master/outlets/{id}` | Backend master outlets router lacks mutation endpoint. |
| `useDeleteOutlet` | `src/hooks/use-master-data.ts` | `DELETE /api/v1/master/outlets/{id}` | Backend master outlets router lacks deletion endpoint. |
| `useCreateItem` | `src/hooks/use-master-data.ts` | `POST /api/v1/master/items` | Backend master items router only implements `GET /` and `GET /{id}`. |
| `useUpdateItem` | `src/hooks/use-master-data.ts` | `PUT /api/v1/master/items/{id}` | Backend master items router lacks mutation endpoint. |
| `useDeleteItem` | `src/hooks/use-master-data.ts` | `DELETE /api/v1/master/items/{id}` | Backend master items router lacks deletion endpoint. |
| `useUpdatePrice` | `src/hooks/use-master-data.ts` | `PUT /api/v1/master/prices/{id}` | Backend master prices router only implements `POST /api/v1/master/prices`. |
| `useUpdateDepot` | `src/hooks/use-master-data.ts` | `PUT /api/v1/master/depots/{id}` | Backend master depots router only implements `GET /` and `GET /{id}`. |
| `useUpdateCalendarDay` | `src/hooks/use-master-data.ts` | `PUT /api/v1/master/calendar/{date}` | Backend master calendar router lacks day update endpoint. |
| `useDriverTripsList` | `src/hooks/use-offline-trip.ts` | `GET /api/v1/driver/routes/current` | Driver route execution endpoint pending implementation in Issue #14; falls back to Dexie and mock trip. |
| `useOfflineActiveTrip` | `src/hooks/use-offline-trip.ts` | `POST /api/v1/deliveries/*` | EPOD and delivery arrival endpoints pending implementation in Issue #14; queues mutations in Dexie. Note: API path param `{waypoint_id}` is treated as `route_leg.id`. |
| Store Order Hooks | `src/pages/store/*` | `POST /api/v1/orders`, `GET /api/v1/orders` | Store orders CRUD pending backend implementation in Issue #10; UI consumes mock data directly. |
| Dispatcher Queue Hooks | `src/pages/dispatcher/order-queue-page.tsx` | `GET /api/v1/orders` | Queue queries pending backend implementation in Issue #10; UI consumes mock data directly. |
| Deferral Queue Hooks | `src/pages/dispatcher/deferrals-page.tsx` | `GET /api/v1/deferrals`, `POST /api/v1/orders/{id}/defer` | Deferral workflow pending backend implementation in Issue #11; UI consumes mock data directly. |
| Allocation Manifest Hooks | `src/pages/dispatcher/allocation-summary-page.tsx` | `GET /api/v1/allocations`, `POST /api/v1/allocations/{id}/confirm` | Daily manifest services pending backend implementation in Issue #12; UI consumes mock data directly. |
| Loader Bay Hooks | `src/pages/loader/*` | `GET /api/v1/loader/bays`, `GET /api/v1/loader/trips/{trip_id}/checklist` | Loader dock services pending backend implementation in Issue #13; UI consumes mock data directly. |
| Live Map Telemetry Hooks | `src/pages/dispatcher/live-map-page.tsx` | `GET /api/v1/fleet/telemetry/live` | Real-time telemetry feed pending backend implementation in Issue #9; UI consumes mock data directly. |

---

## 2. Mock Data Exports Without Connected Backend Endpoints

| Export Symbol | File Location | Entity Domain | Target Backend Endpoint (Planned) |
| :--- | :--- | :--- | :--- |
| `mockQueuedOrders` | `src/data/mock-orders.ts` | Customer Orders | `GET /api/v1/orders` (Issue #10) |
| `mockCarryoverOrders` | `src/data/mock-deferrals.ts` | Deferred Orders | `GET /api/v1/deferrals` (Issue #11) |
| `mockCarryoverKPIs` | `src/data/mock-deferrals.ts` | Deferral Metrics | `GET /api/v1/deferrals/summary` (Issue #11) |
| `mockDeferralAuditLogs` | `src/data/mock-deferrals.ts` | Deferral Audit Trail | `GET /api/v1/deferrals` (Issue #11) |
| `mockVehicleAllocations` | `src/data/mock-allocations.ts` | Daily Trips | `GET /api/v1/allocations` (Issue #12) |
| `mockAllocationKPIs` | `src/data/mock-allocations.ts` | Allocation Summary | `GET /api/v1/allocations/summary` (Issue #12) |
| `mockAllocationManifests` | `src/data/mock-allocation-details.ts` | Route Legs & Waypoints | `GET /api/v1/allocations/{id}` (Issue #12) |
| `INITIAL_STORE_ORDERS` | `src/data/mock-store-orders.ts` | Store Order Records | `GET /api/v1/orders` (Issue #10) |
| `getStoreOrderById` | `src/data/mock-store-orders.ts` | Store Order Lookup | `GET /api/v1/orders/{id}` (Issue #10) |
| `STORE_OUTLETS` | `src/data/mock-store-orders.ts` | Retail Outlets | `GET /api/v1/master/outlets` (Implemented) |
| `CATALOG_PRODUCTS` | `src/data/mock-store-orders.ts` | Catalog SKUs | `GET /api/v1/master/items` (Implemented) |
| `mockLoaderTrips` | `src/data/mock-loader-bays.ts` | Dock Bays & Checklists | `GET /api/v1/loader/bays` (Issue #13) |
| `mockDriverTrip` | `src/data/mock-driver-trips.ts` | Driver Active Trip | `GET /api/v1/driver/routes/current` (Issue #14) |
| `MOCK_VEHICLES` | `src/data/mock-live-map.ts` | Vehicle Telemetry | `GET /api/v1/fleet/telemetry/live` (Issue #9) |
| `MOCK_STORES` | `src/data/mock-live-map.ts` | Store Map Pins | `GET /api/v1/master/outlets` (Implemented) |
| `MOCK_HUBS` | `src/data/mock-hubs.ts` | Depot Coordinates | `GET /api/v1/master/depots` (Implemented) |
| `MAP_THEMES` | `src/data/mock-live-map.ts` | UI Map Styles | Client-side visual styling (No endpoint needed) |
| `CENTRAL_HUB` | `src/data/mock-live-map.ts` | Map Center Coordinate | Client-side visual center (No endpoint needed) |

---

## 3. Type Mismatches & Domain Alignments (M1 - Auth & Users)

| Field / Concept | Frontend Type (`@/api/auth`, `@/api/users`) | Backend / Database Schema (`schema.sql`, `app/entities/user.py`) | Alignment Strategy |
| :--- | :--- | :--- | :--- |
| User Role Property | `user_type` / `role` (`Role` union) | `users.user_type` (`UserType` enum) | Canonical 5 enterprise roles (`system_admin`, `dispatcher`, `loader`, `driver`, `store_manager`). Frontend maps `user_type` to `role`. |
| Personnel Metadata | `department`, `phone`, `location`, `assignedHub` | Base `users` table (No direct metadata columns) | Stored in client UI layer / mock metadata until profile extensions table is implemented. |
| Token Refresh | `POST /auth/refresh` (`useRefreshToken`) | Planned endpoint (Issue #6) | Mock adapter handles token rotation in client until live backend endpoint is delivered. |
| Offline Session Cache | `UserSessionRecord` in Dexie IndexedDB | Server-side JWT validation | Client caches active profile upon successful auth/fetch for uninterrupted offline startup. |

---

## 4. Type Mismatches & Domain Alignments (M2 - Master Data)

| Field / Concept | Frontend Type (`@/api/master`) | Backend / Database Schema (`schema.sql`, `app/schemas/master.py`) | Alignment Strategy |
| :--- | :--- | :--- | :--- |
| Wall-Clock Schedule Times | `window_open_time`, `window_close_time` (`TIME` string `"05:00:00"`) | PostgreSQL `TIME NOT NULL` | Maintained as plain 24h `HH:MM:SS` strings without converting through `new Date()` to avoid timezone shifts. |
| Effective Schedule Dates | `effective_from`, `effective_to` (`DATE` string `"YYYY-MM-DD"`) | PostgreSQL `DATE NOT NULL` / `DATE` | Maintained as plain ISO `YYYY-MM-DD` strings. |
| Unit & Cost Prices | `unit_price`, `cost_price` (`number` in `LKR`) | PostgreSQL `NUMERIC(10,2)` / Pydantic `float` | Retained as numerical values from backend; currency formatting strictly applied at UI presentation. |
| Item Price Lookup Path | `GET /master/prices/item/{item_id}` (`ENDPOINTS.masterPricesGetByItem`) | Backend router `GET /master/prices/items/{item_identifier}/active` | Path contract in `ENDPOINTS.masterPricesGetByItem` normalized to `/master/prices/item/{item_id}`. |
| Calendar Demand Multipliers | `surge_multiplier` (`DemandSurge`) | `DemandSurgeRead` computed via festival ramp (+40%), payday (+15%), monsoon (-5%) | Frontend consumes `useDemandSurge` and falls back to Dexie cache for offline planning. |
| Master Entity Cache | `masterCache` table in Dexie IndexedDB | Server-side master relational tables | Dexie cache with `staleTime: 1 hour` and `networkMode: "offlineFirst"` ensures seamless offline operation for store order pickers, drivers, and loaders. |
| Pending Master Mutations | `useCreateOutlet`, `useUpdateOutlet`, `useDeleteOutlet`, `useCreateItem`, `useUpdateItem`, `useDeleteItem`, `useUpdatePrice`, `useUpdateDepot`, `useUpdateCalendarDay` | Planned backend mutation endpoints | In-memory overlay store in `mock.ts` provides immediate optimistic updates for admin UI. |

---

## 5. Type Mismatches & Domain Alignments (M3 - Fleet & Telemetry)

| Field / Concept | Frontend Type (`@/api/fleet`, `@/api/telemetry`) | Backend / Database Schema (`schema.sql`, `app/models/telemetry.py`) | Alignment Strategy |
| :--- | :--- | :--- | :--- |
| Vehicle Status | `VehicleStatus` (`available`, `docked_loading`, `in_transit`, `in_workshop`) | PostgreSQL `status` (`available`, `loading`, `in_transit`, `in_workshop`, `breakdown`) | Frontend normalized to canonical 4 states (`available`, `docked_loading`, `in_transit`, `in_workshop`). |
| Fleet Capacity | `weight_cap_kg`, `volume_cap_m3`, `fuel_type`, `km_per_l`, `weekly_fuel_quota_l` | PostgreSQL `NUMERIC(10,2)` / `NUMERIC(8,2)` | Strictly matched numeric types and units adhering to Challenge Booklet fleet profiles. |
| Driver Profile Mapping | `Driver` (`user_id`, `license_number`, `phone_number`, `assigned_depot_id`) | `staff_profile` joined with `users` | Mapped to driver entity schema with user reference for authentication linkage. |
| Live Telemetry Enriched Feed | `LiveVehicleTelemetry` (`GET /fleet/telemetry/live`) | `vehicle_telemetry` + active `trip` join | Live feed joins telemetry breadcrumb with active trip and vehicle metadata for map presentation. |
| Offline Telemetry Mutation Queue | `useReportTelemetry` (`POST /fleet/telemetry/report`) | `sync_mutation_audit_log` (`entity_name = 'telemetry'`) | Offline driver mutation generates UUID v4 idempotency key, enqueues to Dexie, and defers backend network drain to M9 universal sync. |
| Event Timestamps | `recorded_at` (`TIMESTAMPTZ` string) | PostgreSQL `TIMESTAMPTZ` (`timestamp`) | All GPS readings and status logs recorded in UTC ISO-8601 strings and rendered in local client time. |

---

## 6. Type Mismatches & Domain Alignments (M4 - Store Orders & Line Items)

| Field / Concept | Frontend Type (`@/api/orders`) | Backend / Database Schema (`schema.sql`, `app/models/orders.py`) | Alignment Strategy |
| :--- | :--- | :--- | :--- |
| Order Lifecycle State | `OrderLifecycleStatus` (`pending`, `allocated`, `in_transit`, `delivered`, `deferred`) | `customer_order.status` (`pending`, `served`, `deferred`, `cancelled` / planned) | Frontend supports full 5-stage lifecycle state machine with validation rejecting invalid state jumps. |
| Cutoff & Order Dates | `order_date`, `required_date` (`DATE` string `"YYYY-MM-DD"`) | PostgreSQL `DATE NOT NULL REFERENCES calendar_day(date)` | Evaluated against 4:00 PM Asia/Colombo daily cutoff in `@/lib/business-day.ts` without local time conversions. |
| Physical & Monetary Totals | `total_weight_kg`, `total_volume_m3`, `total_price_lkr` | `v_customer_order_summary` aggregated view | Response payload supplies canonical server-computed order aggregates; client cart presents estimate preview. |
| Offline Order Creation | `useCreateOrder` (`POST /api/v1/orders`) | `sync_mutation_audit_log` (`entity_name = 'order'`) | Generates UUID v4 idempotency key and enqueues to Dexie IndexedDB `mutationQueue`; merges local pending orders into `useOrders` queries. |
| Special Handling Codes | `special_handling_code` (`COL`, `FRG`, `MAL`, `HAZ`, `GEN`) | `order_item.special_handling_code` `TEXT` | Canonical 4 codes + generic handling mapped and aligned with master items catalog. |
| Status Transition Mutations | `useUpdateOrderStatus` (`PATCH /api/v1/orders/{id}/status`) | Planned backend endpoint (Issue #10) | In-memory mock adapter handles status transitions with lifecycle audit log and invalidates allocation/order queries. |

---

## 7. Type Mismatches & Domain Alignments (M5 - Order Deferrals & Audit Queue)

| Field / Concept | Frontend Type (`@/api/deferrals`) | Backend / Database Schema (`schema.sql`, `app/models/deferral.py`) | Alignment Strategy |
| :--- | :--- | :--- | :--- |
| Deferral Summary Gap | `useDeferralSummary` (`GET /deferrals/summary`) | Planned analytics endpoint (No backend issue assigned) | Registered as pending gap endpoint with `issue: null`. Mock adapter computes aggregate KPIs dynamically from active deferred orders. |
| Store Manager RBAC Gap | `useStoreDeferrals` (`GET /deferrals` with `outlet_id` filter) | Backend `GET /deferrals` access guard restricted to `dispatcher`, `system_admin` | Documented backend RBAC gap. Frontend mock adapter allows store managers to query deferrals scoped to their assigned outlet until backend adds role permission or dedicated store endpoint. |
| Fairness Priority Ordering | `DeferredOrder` (`days_since_last_served`, `deferred_yesterday`) | `deferral_audit_log` joined with `customer_order` | Default query ordering prioritizes highest `days_since_last_served` and `deferred_yesterday = 1` for consecutive skip protection. |
| Deferral State Machine | `useDeferOrder` (`POST /orders/{id}/defer`), `useRequeueDeferral` (`POST /deferrals/{id}/re-queue`) | Transitions order between `pending` and `deferred` lifecycle states | Mutations update in-memory orders store, insert/preserve `deferral_audit_log` records, and trigger cache invalidation for deferrals, orders, and allocations query keys. |

---

## 8. Type Mismatches & Domain Alignments (M7 - Loader Bay Operations)

| Field / Concept | Frontend Type (`@/api/loader`) | Backend / Database Schema (`schema.sql`, `app/models/loader.py`) | Alignment Strategy |
| :--- | :--- | :--- | :--- |
| 3D Staging Bay Coordinates | `BayCoordinates` (`bayX`, `bayY`, `bayZ`) | Backend `loading_checklist_item` schema provides `staging_bay` text code (e.g., `"Bay 4C"`) | Visual 3D grid offsets maintained as client-side presentation mapping derived from `staging_bay` string codes. |
| Waypoint LIFO Sequencing | `TripChecklist.waypoints` | `route_leg.seq` position | Checklist endpoint returns waypoints pre-sorted in reverse delivery sequence (LIFO) so warehouse loaders pack first-to-unload crates last. |
| Offline Mutation Queueing | `useVerifyItem`, `useSealWaypoint`, `useConfirmDeparture` | `sync_mutation_audit_log` (`entity_name = 'loading_checklist'`) | Writes UUID v4 idempotency keys to Dexie `mutationQueue` for silent background batch sync (M9) while applying immediate optimistic checklist updates. |
| Departure Seal Validation | `useConfirmDeparture` (`POST /loader/trips/{trip_id}/confirm-departure`) | `trip.seal_number` & `cargo_bay_allocation.dock_status` | Departure mutation verifies all waypoints are sealed, updates trip status to `dispatched`, sets bay status to `departed`, and invalidates driver active route queries. |

---

## 9. Type Mismatches & Domain Alignments (M9 - Universal Offline Sync Engine)

| Field / Concept | Frontend Type (`@/api/sync`, `@/sync`) | Backend / Database Schema (`schema.sql`, `app/models/sync.py`) | Alignment Strategy |
| :--- | :--- | :--- | :--- |
| Entity Type Union | `EntityType` (`loading_checklist`, `route_leg`, `proof_of_delivery`, `telemetry`, `order`) | `SyncMutationAuditLog.entity_type` in Issue #15 (`loading_checklist`, `route_leg`, `proof_of_delivery`, `telemetry`) | Note: `"order"` is required by M4 offline store order creation. Backend Issue #15 schema must include `"order"` (or `customer_order`) in `entity_type` enum for full idempotency replay. |
| Single IndexedDB Table | `QueuedMutation` stored in Dexie `mutationQueue` | Ingested via `POST /api/v1/sync/batch` | Unified IndexedDB queue table with Dexie v4 upgrade function migrating legacy items into canonical `QueuedMutation` shape with UUID v4 idempotency keys and monotonic FIFO sequence numbers. |
| Batch Drain Adapter | `useSyncStatus`, `drainMutationQueue` | Planned backend `POST /api/v1/sync/batch` endpoint | Pending endpoint served by mock adapter in `@/api/sync/mock.ts` until backend endpoint is deployed. |






