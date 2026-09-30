# ReTrails Database Architecture & Schema Specification

This document provides the architectural overview and specifications for the PostgreSQL 15+ database schema powering **ReTrails (Team CurlX)**.

## Design Priorities

1. **Hackathon Challenge Rules & Constraints**:
   - Enforcement of all 7 feasibility rules (Brand & District grouping, Refrigeration capability, Vehicle access, Home depot, Atomic orders, Dual weight & volume caps, Daily time budgets).
   - Multi-role workflow coverage: Dispatcher, Loader, Driver, and Store Manager.
   - Deferral auditing with consecutive-skip tracking (`deferred_yesterday`, `days_since_last_served`).
   - Strict daily trip limit: maximum 2 trips per vehicle per operating day.
   - Daily time budgets: 270 minutes for Fresh (3:30 AM to 8:00 AM) and 480 minutes for Style & Tech.
2. **Official Shared Datasets**:
   - Direct column-by-column fidelity with `outlets.csv`, `vehicles.csv`, `calendar.csv`, `district_travel.csv`, `service_allowance.csv`, `deliveries_train.csv`, and `route_legs_train.csv`.
3. **Figma UI & Telemetry Specifications**:
   - Driver profile safety card (Blood group, license class and expiry, safety rating).
   - 3D Cargo bay staging grid with special handling codes.
   - Live telematics with Reefer container cold-chain temperature logs.
   - Offline mutation replay audit logs (`sync_batch_log`, `sync_mutation_audit_log`).

## Schema Files

- **`schema.sql`**: Complete, DDL containing table creation statements, constraints, foreign keys, and performance indices.
