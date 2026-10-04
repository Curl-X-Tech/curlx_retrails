# Database Documentation

**Project**: ReTrails — Team CurlX

---

## 1. Database Technology

| Attribute | Value |
|---|---|
| Engine | PostgreSQL 16 (Alpine image) |
| Driver (async) | asyncpg via SQLAlchemy 2.0 (`postgresql+asyncpg://`) |
| Driver (sync/migrations) | psycopg via Alembic (`postgresql+psycopg://`) |
| Fallback | SQLite (aiosqlite) when `USE_SQLITE=true` — for local development without PostgreSQL |
| Extension | `pgcrypto` (for `GEN_RANDOM_UUID()`) |
| ORM | SQLAlchemy 2.0 declarative with `Mapped` and `mapped_column` |
| Migration tool | Alembic |

---

## 2. Connection Configuration

```
DATABASE_URL=postgresql://waypoint:waypoint@postgres:5432/retrails_db
```

Components:
- Host: `postgres` (Docker service name) or `localhost` (local)
- Port: 5432
- Database: `retrails_db`
- User: `waypoint`
- Password: `waypoint` (dev default; must be changed in production)

The `Settings` class in `app/core/config.py` derives `ASYNC_DATABASE_URI` and `SYNC_DATABASE_URI` from the `DATABASE_URL` environment variable, replacing the scheme prefix as required by the respective drivers.

---

## 3. Schema Overview

The master schema is in `docs/schema/schema.sql`. It is organized into eight sections:

| Section | Tables |
|---|---|
| 1. Reference and Master Domain | depot, district, brand, calendar_day, outlet, item, price_list |
| 2. Staff Profiles and Fleet | staff_profile (via users FK), vehicle |
| 3. Orders and Deferral Tracking | customer_order, order_item, deferral_audit_log |
| 4. Trips, Routing, and 3D Cargo Staging | trip, route_leg, cargo_bay_allocation |
| 5. Role Execution | loading_checklist_item, proof_of_delivery, discrepancy_report, vehicle_telemetry |
| 6. Offline Sync Audit | sync_batch_log, sync_mutation_audit_log |
| 7. Indexes | 16 performance indexes |
| 8. Triggers and Functions | 5 trigger functions, 10 trigger bindings |

---

## 4. Tables

See `docs/04-data-model.md` for full per-entity field documentation.

Summary table:

| Table | Primary Key | Rows (seeded) |
|---|---|---|
| depot | UUID | 2 |
| district | UUID | 12 |
| brand | UUID | 3 |
| calendar_day | DATE | ~365 days |
| outlet | UUID | 120 |
| item | UUID | varies |
| price_list | UUID | varies |
| users | UUID | 10 seeded accounts |
| staff_profile | UUID | 10 seeded profiles |
| vehicle | UUID | 60 |
| customer_order | UUID | seeded procedurally |
| order_item | UUID | seeded procedurally |
| deferral_audit_log | UUID | created by engine |
| trip | UUID | created by engine |
| route_leg | UUID | created by engine |
| cargo_bay_allocation | UUID | optional feature |
| loading_checklist_item | UUID | created on confirm |
| proof_of_delivery | UUID | created by driver |
| discrepancy_report | UUID | created on issues |
| vehicle_telemetry | BIGSERIAL | created by driver |
| sync_batch_log | UUID | created by sync |
| sync_mutation_audit_log | UUID | created by sync |

---

## 5. Key Relationships and Constraints

### Unique constraints

| Table | Constraint | Purpose |
|---|---|---|
| trip | UNIQUE(dispatch_date, vehicle_id, trip_sequence) | Maximum 2 trips per vehicle per day |
| route_leg | UNIQUE(trip_id, seq) | No duplicate sequence positions on a trip |
| loading_checklist_item | UNIQUE(trip_id, order_item_id) | One checklist entry per item per trip |
| cargo_bay_allocation | UNIQUE(trip_id, bay_x, bay_y, bay_z) | One item per 3D grid cell |
| customer_order | UNIQUE(idempotency_key) | Offline deduplication |
| order_item | UNIQUE(package_code) | Barcode uniqueness |

### Check constraints

| Table | Column | Allowed values |
|---|---|---|
| vehicle | type | truck, van |
| vehicle | temp | reefer, ambient |
| vehicle | status | available, loading, in_transit, in_workshop, breakdown |
| outlet | dock_type | rear_dock, street, mall_bay |
| outlet | parking_constraint | normal, van_only, mall_dock |
| customer_order | temp_requirement | chilled, ambient |
| customer_order | status | pending, allocated, in_transit, delivered, deferred, cancelled |
| trip | trip_sequence | 1, 2 |
| trip | status | scheduled, loading, dispatched, in_transit, completed, cancelled |
| route_leg | status | pending, in_transit, arrived, completed, skipped, newly_added |
| loading_checklist_item | status | pending, scanned, verified, flagged |
| discrepancy_report | discrepancy_type | damaged, shortage, rejected, temp_breach, delayed_window |
| staff_profile | role | system_admin, dispatcher, loader, driver, store_manager |

---

## 6. Triggers and Functions

### fn_update_timestamp

Fires BEFORE UPDATE on: depot, brand, outlet, item, price_list, staff_profile, vehicle, customer_order, trip, loading_checklist_item.

Sets `updated_at = NOW()` on every row update.

### fn_auto_lock_order_item_price

Fires BEFORE INSERT on: order_item.

If `unit_price` is null or zero, queries `v_active_price_list` for the item's current selling price and assigns it. This locks the price at the moment of order placement, preventing price changes from affecting historical orders.

### fn_sync_trip_metrics

Fires AFTER INSERT OR UPDATE OR DELETE on: route_leg.

Recomputes `trip.total_distance_km` and `trip.total_trip_duration_min` as the sum of all route legs for that trip plus outbound and handling time.

### fn_telemetry_cold_chain_guard

Fires AFTER INSERT on: vehicle_telemetry.

If `reefer_temp_celsius > 4.00` and no `temp_breach` discrepancy exists in the last 30 minutes for this trip, automatically inserts a discrepancy_report with `discrepancy_type=temp_breach`. This ensures cold-chain breaches are always audited even if the driver does not manually report them.

### fn_driver_trip_completed_counter

Fires AFTER UPDATE on: trip.

If `status` changes to `completed`, increments `staff_profile.total_completed_trips` for the assigned driver.

---

## 7. Views

| View | Query logic |
|---|---|
| `v_active_price_list` | DISTINCT ON (item_id), ordered by effective_from DESC; returns one active price per item |
| `v_customer_order_summary` | LEFT JOIN order_item; aggregates COUNT, SUM(requested_qty * unit_weight_kg), SUM(requested_qty * unit_volume_m3), SUM(loaded_qty * ...) |
| `v_trip_payload_summary` | JOIN vehicle; LEFT JOIN route_leg and order_item; aggregates payload, utilization percentages |

---

## 8. Indexes

All indexes use `CREATE INDEX IF NOT EXISTS` for idempotent schema application.

Critical performance indexes:

| Index | Purpose |
|---|---|
| idx_order_status_urgent | Fast allocation order fetch by status and urgency |
| idx_trip_vehicle_seq | Enforce and check 2-trip-per-vehicle rule |
| idx_telemetry_veh_ts | Efficient live map queries on most recent pings |
| idx_sync_idempotency | Sub-millisecond duplicate detection during batch sync |

---

## 9. Database Initialization

### Schema creation

SQLAlchemy 2.0 creates all tables on startup via `init_db()` in `app/core/db.py`. This calls `Base.metadata.create_all()` using the async engine. Tables are created IF NOT EXISTS, making the initialization idempotent.

The PostgreSQL-specific triggers, functions, and views in `docs/schema/schema.sql` are not automatically applied by SQLAlchemy — they must be applied manually or via a migration. In the Docker environment, the schema SQL is intended to be run as a migration step.

### Seed data

The seed engine (`app/db/seed.py`) is triggered by:
1. `POST /api/v1/admin/seed` (admin API, with optional `reset=true`)
2. `./dev.sh seed` (CLI via `uv run python -m app.db.seed`)

The seed process runs in hierarchical order:
1. Depots (2)
2. Districts (12)
3. Brands (3)
4. Calendar days
5. Outlets (120)
6. Items and price lists
7. Staff profiles and user accounts (10 seeded accounts)
8. Vehicles (60)
9. Operational pipeline: procedurally generated orders, trips, and route legs

Upsert logic: existing rows are matched by natural key (e.g. `depot.code`, `vehicle.vehicle_id`) and updated only if fields have changed. New rows are inserted. This makes the seed idempotent.

---

## 10. Data Lifecycle

```
Seed: depots, districts, brands, outlets, items, prices, staff, vehicles
         |
Store Manager places order -> customer_order (pending)
         |
Dispatcher runs allocation -> customer_order (allocated)
                           -> trip (scheduled)
                           -> route_leg (pending)
         |
Loader confirms -> loading_checklist_item (verified/flagged)
               -> route_leg (sealed)
               -> trip (dispatched)
               -> customer_order (in_transit)
         |
Driver delivers -> route_leg (arrived -> completed)
               -> proof_of_delivery
               -> discrepancy_report (if issues)
               -> customer_order (delivered)
               -> trip (completed when all legs done)
         |
Telemetry -> vehicle_telemetry (GPS pings)
          -> auto-discrepancy if temp breach
         |
Offline sync -> sync_batch_log + sync_mutation_audit_log
```

Deferred path:

```
Allocation engine cannot serve order
         |
customer_order (deferred)
deferral_audit_log (reason recorded)
deferred_yesterday = 1
days_since_last_served += 1
         |
Next allocation run: order appears first in priority queue
```

---

## 11. Migrations

Alembic is configured in the `backend/` directory. Migration scripts are stored in `backend/alembic/versions/`.

```bash
# Generate a new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback one step
uv run alembic downgrade -1
```

Current migration state: [TO BE COMPLETED — confirm with team whether migrations are fully applied or only schema.sql + SQLAlchemy create_all is used]
