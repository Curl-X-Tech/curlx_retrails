# ReTrails Database Architecture & Schema Specification

This document outlines the PostgreSQL 15+ database schema powering **ReTrails (Team CurlX)**. The schema is organized around the 5 operational roles, 7 feasibility rules, and offline-first logistics engine defined in the Hackathon Challenge Brief.

---

## 1. Enterprise Roles & Seeded Accounts

The platform supports 5 distinct user roles in `staff_profile`:

| Role | Seeded Account | Assigned Facility | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **`system_admin`** | `admin@curlx.tech` (`ADM-001`) | HQ / System Management | Platform configuration, fleet catalog, and user provisioning |
| **`dispatcher`** | `dispatcher@curlx.tech` (`DSP-101`) | Peliyagoda DC (`PEL`) | Planning board, 3D cargo allocator, live fleet map, deferral logging |
| **`loader`** | `loader@curlx.tech` (`LDR-201`) | Peliyagoda Loading Dock | Dock barcode scanning checklist, LIFO bay verification, shortfall flagging |
| **`driver`** | `driver@curlx.tech` (`DRV-301`) | Peliyagoda DC (`VEH001`) | Road navigation PWA, offline signature POD capture, delivery handovers |
| **`store_manager`** | `manager.out001@curlx.tech` (`MGR-401`) | Outlet `OUT001` (Colombo) | Store order placement before 4 PM, live ETA tracking, receipt confirmation |

---

## 2. Entity Reference & Purpose

### Reference & Master Domain
- **`depot`**: Stores the 2 distribution hubs (Peliyagoda and Kandy) to enforce vehicle home-depot constraints.
- **`district`**: 12 delivery districts across Western and Central Provinces.
- **`brand`**: Waypoint Fresh, Style, and Tech with their operational time budgets (Fresh: 270 min, Style/Tech: 480 min) and cold-chain requirements.
- **`calendar_day`**: Tracks operating days, payday demand spikes, festival surge multipliers, and monsoon weather conditions.
- **`outlet`**: 120 retail store locations with unloading dock types (`rear_dock`, `street`, `mall_bay`), access limits (`van_only`), and time windows.
- **`item`**: Product catalog master defining unit weight, cubic volume, and special handling codes (`COL`, `FRG`, `MAL`, `HAZ`).
- **`price_list`**: Temporal pricing schedule with effective date ranges (`effective_from` defaulting to `CURRENT_DATE`) for advance promotional pricing.

### Fleet & Personnel
- **`staff_profile`**: Unified enterprise directory for all 5 roles (`system_admin`, `dispatcher`, `loader`, `driver`, `store_manager`), including driver credentials (blood group, license, safety rating).
- **`vehicle`**: 60 fleet units tracking weight/volume caps, weekly fuel quotas, km/l fuel efficiency, and temperature capabilities (`reefer` vs `ambient`).

### Orders & Deferral Audit
- **`customer_order`**: Store orders placed before the 4:00 PM cutoff, tracking order status, urgency, and consecutive skip flags (`deferred_yesterday`, `days_since_last_served`).
- **`order_item`**: Granular line items with package codes, quantities, locked purchase price, and physical unit dimensions.
- **`deferral_audit_log`**: Immutable audit record explaining deferral decisions, limiting resources, and consecutive-skip avoidance.

### Routing & Warehouse Staging
- **`trip`**: Fleet dispatch trips enforcing the maximum 2-trips-per-day limit and single-brand / single-district grouping rules.
- **`route_leg`**: Multi-stop waypoint sequence tracking planned vs actual departure, travel, and arrival timestamps.
- **`cargo_bay_allocation`**: 3D container coordinates (X, Y, Z) for reverse-delivery (LIFO) bay staging.

### Operations & Discrepancies
- **`loading_checklist_item`**: Warehouse dock pre-departure barcode verification for flagging shortfalls and damaged packages.
- **`proof_of_delivery`**: Offline-capable digital proof of delivery capturing vector signatures, geofence coordinates, handover temperatures, and timestamps.
- **`discrepancy_report`**: Formal reporting and investigation lifecycle for damaged, missing, or rejected goods.
- **`vehicle_telemetry`**: GPS tracking, vehicle heading, and live reefer cold-chain container temperature monitoring.

### Offline Sync Engine
- **`sync_batch_log`**: Session metadata for offline mutation batches drained from client IndexedDB (Dexie).
- **`sync_mutation_audit_log`**: Idempotent replay audit log with before/after state snapshots to prevent duplicate writes during network reconnection.

---

## 3. Dynamic Database Views

- **`v_active_price_list`**: Resolves current active selling and cost price per item based on today's date.
- **`v_customer_order_summary`**: Computes total order weight, volume, and monetary value dynamically from `order_item` without redundant header storage.
- **`v_trip_payload_summary`**: Calculates live trip payload weight, cubic volume, total cargo valuation, and percentage utilization against vehicle capacity caps.

---

## 4. Automated Database Trigger Functions

1. **`fn_update_timestamp()` (`trg_*_updated_at`)**:
   Automatically sets `updated_at = NOW()` across all mutable master and transactional tables upon row modification.
2. **`fn_auto_lock_order_item_price()` (`trg_order_item_auto_price`)**:
   Automatically resolves and locks the active selling price from `v_active_price_list` when an order item is inserted without a specified price.
3. **`fn_sync_trip_metrics()` (`trg_route_leg_sync_trip`)**:
   Recomputes `trip.total_distance_km` and `trip.total_trip_duration_min` dynamically whenever route legs or waypoints are inserted, updated, or removed.
4. **`fn_telemetry_cold_chain_guard()` (`trg_telemetry_cold_chain_alert`)**:
   Monitors live GPS telematics for active reefer vehicles and automatically generates an urgent `discrepancy_report` (`temp_breach`) if cargo temperature exceeds 4.0°C.
5. **`fn_driver_trip_completed_counter()` (`trg_trip_driver_stats`)**:
   Automatically increments `staff_profile.total_completed_trips` for the assigned driver as soon as a trip transitions to `'completed'`.
