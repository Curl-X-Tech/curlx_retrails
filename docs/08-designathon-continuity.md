# Designathon Continuity

**Project**: ReTrails — Team CurlX

This document explains how the Hackathon implementation maintains continuity with the Designathon prototype and documents every significant departure with justification.

---

## Continuity Summary

The Hackathon implementation is a direct evolution of the Designathon concept. The four-role operational model, the end-to-end delivery workflow, the brand/depot/district architecture, and all seven feasibility rules for vehicle allocation are preserved without modification in the production implementation.

The changes documented below are engineering decisions made during implementation. None of them represent scope reduction on core operational functionality.

---

## 1. What Was Preserved

### Operational Model

The complete operational workflow from the Designathon is implemented:

```
Store Manager -> Order
Dispatcher -> Close & Plan -> Allocate
Loader -> Load Vehicle
Driver -> Deliver
Store Manager -> Confirm Receipt
```

### Four Roles

All four operational roles are implemented with role-specific JWT-protected interfaces.

### Domain Architecture

- Waypoint Group with three brands (Fresh, Style, Tech)
- Two depots (Peliyagoda, Kandy)
- 12 districts
- 120 outlets with access constraints
- 60 vehicles with reefer/ambient and truck/van classification

### Feasibility Rules

All seven feasibility rules from the Designathon are implemented:

1. Same brand and district per trip
2. Refrigeration (chilled orders need reefer vehicles)
3. Van-only outlet access
4. Depot-home constraint
5. Whole-order handling
6. Weight and volume capacity
7. Time budget per brand/depot/district

### Special Handling Codes

COL (Cold Chain), FRG (Fragile), MAL (Mall Bay), HAZ (Hazardous) codes are stored on order_item and used by the loading checklist.

### Currency and Pricing

All prices are in LKR. The price is auto-locked from the active price_list at order placement time.

### Offline Operation

Offline-first capability for the Driver role using Dexie.js (IndexedDB) is implemented as designed.

---

## 2. Significant Departures

### D01: Fuel Quota Not Enforced as Blocking Constraint

**Original Designathon decision**: Fuel quota limits block vehicle assignment when the vehicle's weekly quota is consumed.

**Hackathon implementation**: The fuel data model is complete (`vehicle.weekly_fuel_quota_l`, `vehicle.consumed_fuel_l`). The Dispatcher can view fuel status. The allocation engine does not currently enforce the quota as a blocking constraint.

**Reason**: Implementing fuel quota enforcement in the solver required accurate consumed_fuel tracking from telemetry. The telemetry pipeline was implemented, but connecting it to live solver enforcement was deferred to maintain full end-to-end workflow delivery.

**Impact**: Medium. A dispatcher aware of the limitation can use manual vehicle_overrides in the optimize request to exclude quota-exceeded vehicles.

### D02: Live Map Uses Simulated Vehicle Positions

**Original Designathon decision**: The Dispatcher Live Map shows real-time vehicle GPS positions.

**Hackathon implementation**: The map renders all 120 outlet positions correctly. Vehicle positions are simulated from mock data in the frontend rather than driven by live telemetry from the driver's sync feed.

**Reason**: The telemetry backend (vehicle_telemetry table, POST /telemetry/report endpoint) is fully implemented. The frontend Leaflet map component was connected to static mock positions rather than the live telemetry API during the hackathon to prioritize completing the core four-role workflow.

**Impact**: Low for the judge walkthrough. Outlet positions are live and accurate. Vehicle position data is illustrative.

### D03: 3D Cargo Bay Visualization Not in Frontend

**Original Designathon decision**: An interactive 3D visualization of cargo bay LIFO loading order.

**Hackathon implementation**: The `cargo_bay_allocation` table with bay_x, bay_y, bay_z grid positions is in the database. The Loader API returns staging_bay labels per item (e.g. `S1` for stop 1). The 3D visual grid component in the frontend was descoped.

**Reason**: The data model foundation is complete. The UI component would add visual richness but was not critical to the operational workflow verification.

**Impact**: Low. Loaders see staging bay labels per item. The 3D visual aid is not available.

### D04: Conflict Resolution Not Implemented

**Original Designathon decision**: Server-side conflict resolution for concurrent offline mutations.

**Hackathon implementation**: Idempotency-based deduplication only. Duplicate mutations (same idempotency_key) are silently acknowledged as `duplicate_ignored`.

**Reason**: In the Driver operational context, each trip has exactly one driver. Concurrent writes from multiple offline devices to the same waypoint do not occur in normal operation. Idempotency covers the primary failure case (network drop and retry).

**Impact**: Negligible in normal operation. Edge cases involving multiple devices on the same trip are not handled.

### D05: OR-Tools CP-SAT Integration

**Original Designathon decision**: Automated allocation with intelligent optimization.

**Hackathon implementation**: Both a heuristic greedy solver and an OR-Tools CP-SAT solver are implemented. The default is OR-Tools. The heuristic solver is available as a fallback via `solver_type=heuristic`.

**Change type**: Enhancement (not a departure). The Designathon did not specify the solver algorithm. Both implementations respect all seven feasibility rules.

**Impact**: Positive. The OR-Tools solver provides optimized assignments; the heuristic solver provides deterministic results useful for debugging.

---

## 3. Continuity Verification

A judge can verify Designathon continuity by:

1. Logging in as each of the four roles and confirming role-specific interfaces are present.
2. Running the complete workflow (Order -> Allocation -> Load -> Deliver -> Receipt) as documented in the `README.md` Judge Walkthrough section.
3. Triggering the allocation engine and verifying that deferred orders appear with correct reason codes.
4. Taking the browser offline during a driver delivery action and confirming the mutation is queued and replayed on reconnect.
