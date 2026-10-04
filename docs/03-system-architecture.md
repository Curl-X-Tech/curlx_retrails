# System Architecture

**Project**: ReTrails — Team CurlX

---

## 1. Architecture Diagram

```
                     BROWSER / MOBILE PWA
                   (React 18 + TypeScript + Tailwind CSS)
                              |
                   +----------+----------+
                   |                     |
             React Router          Dexie.js (IndexedDB)
           (Role-based pages)    (Local offline storage)
                   |                     |
           TanStack Query         Sync Queue Engine
           (server state)        (drain.ts + engine.ts)
                   |                     |
                   +----------+----------+
                              |
                    REST / HTTPS + JWT Bearer
                              |
                    +---------+---------+
                    |                   |
              /api/v1/*            /health
                    |
           +--------+--------+
           |                 |
       FastAPI ASGI       Allocation Engine
        (Uvicorn)        (heuristic + OR-Tools)
           |
    +------+------+
    |      |      |
 SQLAlchemy Redis  MinIO
   2.0    (cache) (S3 blobs)
    |
 PostgreSQL 16
 (retrails_db)
```

---

## 2. Component Descriptions

### 2.1 Frontend (React PWA)

| Attribute | Value |
|---|---|
| Responsibility | Role-based user interface for all four operational roles |
| Technology | React 18, TypeScript, Vite, Tailwind CSS |
| Inputs | User interactions, API responses, Dexie IndexedDB reads |
| Outputs | API calls (TanStack Query), IndexedDB mutations (Dexie), Sync queue enqueue |
| Dependencies | Backend REST API, Dexie.js, Leaflet (maps) |
| Communication | REST over HTTPS, JWT Bearer tokens |

Page structure by role:

- `pages/store/` — Store Manager: dashboard, orders, create order, deferrals, receiving, reports
- `pages/dispatcher/` — Dispatcher: dashboard, order queue, allocations, deferrals, fleet, fuel, live map, trip metrics, workshop, outlets, sustainability
- `pages/loader/` — Loader: dashboard, bays, manifests, exceptions
- `pages/driver/` — Driver: trips list, active trip, stops, unloading, vehicle info

### 2.2 Offline Sync Engine (`frontend/src/sync/`)

| Attribute | Value |
|---|---|
| Responsibility | Detect connectivity state and drain pending mutations from Dexie to the backend |
| Technology | TypeScript, browser native `online`/`offline` events, Dexie.js |
| Inputs | Navigator.onLine, window events, Dexie sync_queue |
| Outputs | Batch POST to `/api/v1/sync/batch` |
| Communication | REST to FastAPI sync router |

Files:

- `engine.ts` — starts/stops the sync lifecycle, registers online/offline listeners, sets a 60-second poll interval
- `drain.ts` — peeks batches of 20 mutations from Dexie, POSTs to `/sync/batch`, marks applied or schedules retry with exponential backoff
- `queue.ts` — Dexie table operations: enqueue, peek, mark sent/applied/failed
- `backoff.ts` — exponential backoff calculation for retry scheduling
- `use-sync-status.ts` — Zustand store for sync UI state (online, draining, queue count, last error)

### 2.3 Backend (FastAPI)

| Attribute | Value |
|---|---|
| Responsibility | REST API serving all four role interfaces; allocation engine; seed and admin endpoints |
| Technology | FastAPI 0.115+, Python 3.10+, Uvicorn, Pydantic v2 |
| Inputs | HTTP requests with JWT Bearer tokens |
| Outputs | JSON responses, database mutations, storage operations |
| Dependencies | PostgreSQL (SQLAlchemy), Redis (cache), MinIO (blobs) |
| Communication | Async SQLAlchemy, aioredis, boto3-compatible S3 client |

Router modules under `app/routers/`:

| Module | Prefix | Domain |
|---|---|---|
| main.py | `/api/v1` | Auth, users, guards, admin seed |
| master/ | `/api/v1/brands`, `/depots`, `/districts`, `/outlets`, `/items`, `/prices`, `/calendar` | Reference data |
| store_orders.py | `/api/v1/orders` | Order placement and status |
| deferrals.py | `/api/v1/deferrals` | Deferral audit log |
| fleet.py | `/api/v1/fleet` | Vehicle management |
| allocations.py | `/api/v1/allocations` | Trip allocation and engine control |
| loader.py | `/api/v1/loader` | Loading bays, checklist, departure |
| driver_route.py | `/api/v1/driver` | Driver trip list and current route |
| deliveries.py | `/api/v1/deliveries` | Arrival, POD, discrepancy |
| telemetry.py | `/api/v1/telemetry` | GPS and reefer temperature logs |
| sync.py | `/api/v1/sync` | Batch offline sync endpoint |
| uploads.py | `/api/v1/uploads` | File and photo upload |
| auth_refresh.py | `/api/v1/auth` | JWT refresh |

### 2.4 Allocation Engine (`app/services/allocation/`)

| Attribute | Value |
|---|---|
| Responsibility | Assign orders to vehicles, produce planned trips and route legs, record deferrals |
| Technology | Python, Google OR-Tools CP-SAT, custom heuristic solver |
| Inputs | Orders (status=pending/deferred), vehicles (active, depot-scoped), date, unavailable vehicle overrides |
| Outputs | ProposedTrip list, DeferredRecord list, execution metadata |
| Dependencies | SQLAlchemy session, time_budget.py (travel and service allowance tables) |

Two solver strategies exist:

- **HeuristicAllocationSolver** (default): greedy, priority-ordered, deterministic, enforces all feasibility rules.
- **ORToolsAllocationSolver**: calls the OR-Tools CP-SAT solver (selected via `solver_type="ortools"` in the request).

### 2.5 Database (PostgreSQL 16)

| Attribute | Value |
|---|---|
| Responsibility | Persistent storage of all operational data |
| Technology | PostgreSQL 16, accessed via SQLAlchemy 2.0 asyncpg driver |
| Inputs | SQL DML via SQLAlchemy ORM |
| Outputs | Query results, trigger-maintained derived columns |
| Communication | `postgresql+asyncpg://` connection URI |

Key database features in use:

- `GEN_RANDOM_UUID()` for all primary keys.
- `fn_update_timestamp()` trigger on all mutable tables.
- `fn_auto_lock_order_item_price()` trigger locks unit price from active price list at order insert time.
- `fn_sync_trip_metrics()` trigger recomputes trip distance and duration when route legs change.
- `fn_telemetry_cold_chain_guard()` trigger auto-inserts a `temp_breach` discrepancy report when reefer temperature exceeds 4.0 degrees Celsius.
- `fn_driver_trip_completed_counter()` trigger increments `staff_profile.total_completed_trips` on trip completion.

### 2.6 MinIO Object Storage

| Attribute | Value |
|---|---|
| Responsibility | Store proof-of-delivery photo evidence and any uploaded files |
| Technology | MinIO (S3-compatible), accessed via storage service in `app/services/storage.py` |
| Bucket | `retrails-media` |
| Communication | S3 REST API via `STORAGE_BACKEND=minio` |

### 2.7 Redis

| Attribute | Value |
|---|---|
| Responsibility | Rate limiting counters and session cache |
| Technology | Redis 7 |
| Communication | TCP on port 6379 |

---

## 3. Authentication

- **Mechanism**: JWT Bearer tokens issued by fastapi-users via `/api/v1/auth/jwt/login`.
- **Token lifetime**: 8 days (11520 minutes) by default, configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`.
- **Password hashing**: argon2 via pwdlib.
- **Password reset**: token-based email reset flow via Resend REST API.
- **Rate limiting**: auth endpoints are guarded by `auth_rate_limiter` (20 requests/minute per IP). API endpoints use `api_rate_limiter` (100 requests/minute per IP).

---

## 4. Authorization (Role-Based Access)

All API endpoints use FastAPI `Depends()` guards defined in `app/guards/roles.py`.

| Guard | Roles allowed |
|---|---|
| `require_system_admin` | system_admin |
| `require_dispatcher` | dispatcher, system_admin |
| `require_loader` | loader, system_admin |
| `require_driver` | driver, system_admin |
| `require_store_manager` | store_manager, system_admin |
| `RoleGuard(...)` | Parameterized multi-role guard |
| `current_active_user` | Any authenticated active user |

The `user_type` field on the `User` entity holds the role. Dispatcher-scoped queries (`dispatcher_scope.py`) further restrict visible orders and trips to the depot assigned to the authenticated dispatcher.

---

## 5. API Communication

- All API requests are prefixed `/api/v1`.
- Responses are JSON.
- Pagination: `page` and `limit` query parameters on list endpoints (default limit 100-500 depending on endpoint).
- Filtering: `dispatch_date`, `depot_id`, `brand_id`, `district_id`, `status` query parameters on allocation and order list endpoints.
- Error format: standard FastAPI HTTPException with `detail` string as error code (e.g. `ORDER_NOT_FOUND`, `TRIP_NOT_LOADING`).

---

## 6. Offline Synchronization

### Detection

The sync engine (`engine.ts`) registers `window.addEventListener("online", ...)` and `window.addEventListener("offline", ...)` on startup. The Zustand `useSyncStatus` store is updated immediately.

### Local mutations

When the driver submits a POD or arrival event while offline, the action is written to the local Dexie `sync_queue` table with an idempotency key and status `queued`.

### Drain

On reconnection, `drainMutationQueue()` in `drain.ts` peeks batches of 20 mutations and POSTs them to `POST /api/v1/sync/batch`.

### Server processing

`sync.py` processes each `QueuedMutation` by dispatching to the matching handler:
- `entity_type=order, action=create` → `create_order()`
- `entity_type=telemetry, action=create` → `_apply_telemetry()`
- `entity_type=route_leg` → `arrive()` endpoint handler
- `entity_type=proof_of_delivery` → `submit_pod()` endpoint handler

Each handler uses the mutation's `idempotency_key` to prevent duplicate application (409 Conflict responses are treated as `duplicate_ignored`).

### Conflict handling

Conflict resolution: full automatic server-wins resolution is **NOT IMPLEMENTED**. The sync endpoint handles idempotent replay: if a mutation's idempotency key has already been applied, the server returns status `duplicate_ignored` and the client removes it from the queue. If the server returns a non-409 error, the mutation is retried with exponential backoff up to a configurable maximum retry count before being marked permanently failed.

---

## 7. Planning and Allocation

See [06-planning-and-allocation.md](06-planning-and-allocation.md) for full detail.

Summary:

1. Dispatcher calls `POST /api/v1/allocations/optimize` with `operating_date`, `depot_id`, and optional `order_ids` and `vehicle_overrides`.
2. Engine fetches all `pending` and `deferred` orders for the depot.
3. Engine fetches all active, non-workshop vehicles for the depot, excluding `in_workshop` and `breakdown` status vehicles, and capping at 2 trips per vehicle.
4. HeuristicAllocationSolver sorts orders by priority score (deferred_yesterday, days_since_last_served, is_urgent), clusters by (depot, brand, district), and greedily packs each cluster into the best-fit vehicle under weight, volume, reefer, van-access, and time-budget constraints.
5. Allocated orders transition to `status=allocated`; deferred orders transition to `status=deferred` with a `DeferralAuditLog` record.

---

## 8. External Services

| Service | Purpose | Required |
|---|---|---|
| Resend REST API | Transactional emails (password reset) | Optional; dev uses terminal outbox |
| MinIO | Photo evidence object storage | Yes (included in docker-compose.yml) |
| Carto Positron tiles | Map tile layer in Leaflet map views | No API key required |
