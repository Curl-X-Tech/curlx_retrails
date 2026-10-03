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
| `useOfflineActiveTrip` | `src/hooks/use-offline-trip.ts` | `POST /api/v1/deliveries/*` | EPOD and delivery arrival endpoints pending implementation in Issue #14; queues mutations in Dexie. |
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

