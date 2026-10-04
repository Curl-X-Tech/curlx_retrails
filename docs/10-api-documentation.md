# API Documentation

**Project**: ReTrails — Team CurlX

Base URL: `http://localhost:8000/api/v1` (local) or deployment URL.

Interactive documentation: `/docs` (Swagger UI), `/redoc` (ReDoc).

Authentication: All endpoints except `/auth/jwt/login` and `/auth/forgot-password` require `Authorization: Bearer <token>`.

---

## Authentication

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/auth/jwt/login` | Obtain JWT token | None |
| POST | `/auth/jwt/logout` | Invalidate session | Bearer |
| POST | `/auth/forgot-password` | Initiate password reset | None |
| POST | `/auth/reset-password` | Complete password reset | None |
| GET | `/auth/jwt/refresh` | Refresh access token | Bearer |

### POST /auth/jwt/login

Request (`application/x-www-form-urlencoded`):
```
username=dispatcher.peliyagoda@example.com&password=Password@123
```

Response:
```json
{"access_token": "eyJ...", "token_type": "bearer"}
```

---

## Users and Admin

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/users` | Create user account | system_admin |
| GET | `/users` | List all user accounts | system_admin |
| GET | `/users/me` | Get current user profile | Bearer |
| PATCH | `/users/me` | Update current user | Bearer |
| POST | `/admin/seed` | Trigger database seeding | system_admin |

### POST /admin/seed

Request body (optional):
```json
{"reset": false}
```

Response:
```json
{"status": "success", "summary": {"depots": 2, "districts": 12, ...}}
```

---

## Master Data

All master data endpoints require authentication. Dispatcher and system_admin roles have full access.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/brands` | List brands |
| GET | `/depots` | List depots |
| GET | `/districts` | List districts |
| GET | `/outlets` | List outlets (filterable by depot, brand, district) |
| GET | `/outlets/{id}` | Get outlet detail |
| GET | `/items` | List catalog items |
| GET | `/items/{id}` | Get item detail |
| GET | `/prices` | List price list entries |
| GET | `/calendar` | List calendar days |

---

## Orders

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/orders` | List orders | Any authenticated |
| GET | `/orders/{id}` | Get order detail with line items | Any authenticated |
| POST | `/orders` | Place an order | store_manager, dispatcher |
| PATCH | `/orders/{id}/status` | Update order status | dispatcher, loader, driver, store_manager |

### GET /orders

Query parameters:
- `outlet_id` (UUID) — filter by outlet
- `brand_id` (UUID) — filter by brand
- `status` (string) — pending, allocated, in_transit, delivered, deferred, cancelled
- `order_date` (date YYYY-MM-DD)
- `page` (int, default 1)
- `limit` (int, default 500, max 500)

Response: array of OrderRead:
```json
[{
  "id": "uuid",
  "order_ref": "S1-000",
  "outlet_id": "uuid",
  "outlet_name": "Colombo Fresh 001",
  "order_date": "2026-10-05",
  "required_date": "2026-10-05",
  "temp_requirement": "ambient",
  "status": "pending",
  "is_urgent": false,
  "deferred_yesterday": 0,
  "days_since_last_served": 0,
  "total_weight_kg": 128.5,
  "total_volume_m3": 0.42,
  "total_order_value_lkr": 95000.00,
  "created_at": "2026-10-04T10:00:00Z"
}]
```

### POST /orders

Request:
```json
{
  "outlet_id": "uuid",
  "order_date": "2026-10-05",
  "required_date": "2026-10-05",
  "temp_requirement": "ambient",
  "idempotency_key": "uuid",
  "items": [
    {"item_id": "uuid", "requested_qty": 10}
  ]
}
```

Response: OrderRead (201 Created).

---

## Deferrals

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/deferrals` | List deferral audit log | dispatcher, store_manager |

Query parameters: `dispatch_date`, `outlet_id`, `deferral_reason`, `page`, `limit`.

---

## Fleet

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/fleet/vehicles` | List vehicles | dispatcher |
| GET | `/fleet/vehicles/{id}` | Get vehicle detail | dispatcher |
| PATCH | `/fleet/vehicles/{id}` | Update vehicle status | dispatcher, system_admin |

---

## Allocations

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/allocations/summary` | Aggregated trip metrics | dispatcher |
| GET | `/allocations` | List trips | dispatcher |
| GET | `/allocations/{trip_id}` | Get trip allocation detail | dispatcher |
| POST | `/allocations/optimize` | Run allocation engine | dispatcher |
| POST | `/allocations/manual` | Manual trip allocation | dispatcher |
| POST | `/allocations/{trip_id}/confirm` | Confirm trip for loading | dispatcher |
| GET | `/allocations/engine/status` | Check solver state | dispatcher |
| POST | `/allocations/engine/schedule` | Configure auto-schedule | system_admin |

### POST /allocations/optimize

Request:
```json
{
  "operating_date": "2026-10-05",
  "depot_id": "uuid",
  "order_ids": null,
  "vehicle_overrides": [],
  "simulation": false,
  "solver_type": "ortools"
}
```

Response:
```json
{
  "proposed_trips": [
    {
      "trip_id": "uuid",
      "trip_code": "TRP-20261005-0001",
      "brand_id": "uuid",
      "district_id": "uuid",
      "vehicle_id": "uuid",
      "driver_id": "uuid",
      "order_ids": ["uuid1", "uuid2"],
      "route_leg_count": 2,
      "total_weight_kg": 420.5,
      "total_volume_m3": 1.2,
      "estimated_duration_min": 104.0
    }
  ],
  "deferred_orders": [
    {
      "order_id": "uuid",
      "order_ref": "S1-009",
      "outlet_id": "uuid",
      "reason_code": "insufficient_reefer_capacity",
      "limiting_resource": "fleet_downtime"
    }
  ],
  "execution_time_ms": 23,
  "feasibility_passed": false,
  "solver_status": "feasible",
  "is_simulation": false,
  "summary": {
    "total_orders_processed": 15,
    "allocated_orders_count": 14,
    "deferred_orders_count": 1,
    "total_trips_created": 3
  }
}
```

---

## Loader

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/loader/bays` | List loading bays | dispatcher, loader |
| GET | `/loader/trips/{trip_id}/checklist` | Get loading checklist | dispatcher, loader |
| POST | `/loader/trips/{trip_id}/start-loading` | Start loading | loader |
| POST | `/loader/items/{item_id}/verify` | Verify checklist item | loader |
| POST | `/loader/trips/{trip_id}/waypoints/{seq}/seal` | Seal waypoint cargo | loader |
| POST | `/loader/trips/{trip_id}/confirm-departure` | Confirm vehicle departure | loader |

### POST /loader/items/{item_id}/verify

Request:
```json
{
  "status": "verified",
  "shortfall_qty": 0,
  "note": null
}
```

Valid statuses: `pending`, `verified`, `flagged_shortfall`.

---

## Driver

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/driver/trips` | List driver's trips | driver |
| POST | `/driver/trips/{trip_id}/activate` | Activate trip | driver |
| GET | `/driver/routes/current` | Get current route and waypoints | driver |

### GET /driver/routes/current

Response (abbreviated):
```json
{
  "trip": {
    "id": "uuid",
    "trip_code": "TRP-20261005-0001",
    "status": "in_transit",
    "dispatch_date": "2026-10-05",
    "seal_number": "SL-TRP-0001",
    "vehicle": {"reg_number": "NP-4811", "type": "truck", "temp": "ambient"},
    "depot": {"name": "Peliyagoda"},
    "driver": {"name": "Driver Name", "phone": "+94 77 000 0000"}
  },
  "waypoints": [
    {
      "seq": 1,
      "outlet_name": "Colombo Fresh 001",
      "delivery_window": "05:00-08:00",
      "access_constraints": "normal",
      "dock_type": "rear_dock",
      "status": "pending",
      "order_summary": {
        "order_ref": "S1-000",
        "total_weight_kg": 128.5,
        "items": [...]
      }
    }
  ],
  "active_waypoint_seq": 1
}
```

---

## Deliveries

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/deliveries/{waypoint_id}/arrive` | Record arrival at stop | driver |
| POST | `/deliveries/{waypoint_id}/pod` | Submit proof of delivery | driver |
| POST | `/deliveries/{waypoint_id}/discrepancy` | Log delivery discrepancy | driver, store_manager |

### POST /deliveries/{waypoint_id}/pod

Request:
```json
{
  "recipient_name": "Store Manager Name",
  "signature_data_url": "data:image/svg+xml;base64,...",
  "photo_proof_url": "https://storage/photo.jpg",
  "arrived_at": "2026-10-05T05:45:00Z",
  "completed_at": "2026-10-05T06:10:00Z",
  "discrepancies": [
    {
      "item_id": "uuid",
      "issue_type": "shortage",
      "reported_qty": 2,
      "notes": "Two crates missing from pallet"
    }
  ]
}
```

---

## Telemetry

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/telemetry/report` | Submit GPS and temperature pings | driver |

Request:
```json
{
  "vehicle_id": "uuid",
  "trip_id": "uuid",
  "pings": [
    {
      "timestamp": "2026-10-05T05:30:00Z",
      "latitude": 6.9271,
      "longitude": 79.8612,
      "speed_kmh": 45.0,
      "heading_deg": 180.0,
      "reefer_temp_celsius": 3.5,
      "fuel_level_pct": 85.0
    }
  ]
}
```

---

## Offline Sync

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/sync/batch` | Process queued offline mutations | Any authenticated |

### POST /sync/batch

Request:
```json
{
  "client_device_id": "dev-xxxx",
  "mutations": [
    {
      "idempotency_key": "uuid",
      "entity_type": "route_leg",
      "action": "update",
      "payload": {
        "waypoint_id": "uuid",
        "arrived_at": "2026-10-05T05:45:00Z",
        "coordinates": {"latitude": 6.92, "longitude": 79.86}
      },
      "client_timestamp": "2026-10-05T05:45:01Z"
    }
  ]
}
```

Response:
```json
{
  "batch_id": "batch_abc123",
  "processed_count": 1,
  "results": [
    {
      "idempotency_key": "uuid",
      "status": "applied",
      "entity_id": null
    }
  ],
  "server_timestamp": 1759622400000
}
```

Mutation result statuses:
- `applied` — mutation processed and persisted
- `duplicate_ignored` — idempotency key already seen; safe to discard
- `conflict_resolved` — unresolvable conflict; mutation dropped

---

## Uploads

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/uploads/photo` | Upload proof-of-delivery photo | Any authenticated |

Request: `multipart/form-data` with `file` field.
Response: `{"url": "https://storage/path/to/photo.jpg"}`.

---

## Health

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/health` | Service health check | None |

Response:
```json
{"service": "core-service", "status": "ok", "database": "connected", "version": "1.0.0"}
```
