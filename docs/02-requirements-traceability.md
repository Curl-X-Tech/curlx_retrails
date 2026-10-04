# Requirements Traceability Matrix

**Project**: ReTrails — Team CurlX

This matrix maps Designathon design decisions to their Hackathon implementation status.

---

## Traceability Matrix

| ID | Designathon Element | Hackathon Implementation | Status | Change | Reason |
|---|---|---|---|---|---|
| TR-01 | Four user roles: Dispatcher, Loader, Driver, Store Manager | Implemented: role-based JWT guards, role-scoped pages and APIs | Fully implemented | No change | Core requirement |
| TR-02 | Order placement by Store Manager | POST /api/v1/orders with idempotency key | Fully implemented | Added offline idempotency support | Offline-first requirement |
| TR-03 | Dispatcher order queue view | GET /api/v1/orders with depot-scope filter | Fully implemented | No change | — |
| TR-04 | Automated vehicle allocation | Allocation engine with heuristic + OR-Tools CP-SAT solvers | Fully implemented | Added simulation mode and cron scheduling | Hackathon requirement |
| TR-05 | Weight capacity constraint | Enforced in heuristic solver: current_weight + order_weight <= vehicle.weight_cap_kg | Fully implemented | No change | — |
| TR-06 | Volume capacity constraint | Enforced in heuristic solver: current_volume + order_volume <= vehicle.volume_cap_m3 | Fully implemented | No change | — |
| TR-07 | Refrigeration (cold chain) constraint | Rule 2: chilled orders only assigned to reefer vehicles | Fully implemented | No change | — |
| TR-08 | Van-only outlet access constraint | Rule 3: van_only outlets only assigned to van vehicles | Fully implemented | No change | — |
| TR-09 | Depot-home constraint | Rule 4: vehicles only serve their home depot's orders | Fully implemented | No change | — |
| TR-10 | Whole-order packing | Rule 5: all items in an order travel on the same trip | Fully implemented | No change | — |
| TR-11 | Time budget (delivery windows) | Rule 7: trip_minutes formula with per-brand and per-district tables | Fully implemented | Used exact booklet formula | — |
| TR-12 | Maximum 2 trips per vehicle per day | UNIQUE(dispatch_date, vehicle_id, trip_sequence) constraint + solver MAX_TRIPS_PER_VEHICLE=2 | Fully implemented | No change | — |
| TR-13 | Deferred order handling | DeferralAuditLog, deferred_yesterday flag, priority scoring | Fully implemented | No change | — |
| TR-14 | Fuel quota visibility | vehicle.weekly_fuel_quota_l and consumed_fuel_l fields; Dispatcher Fuel Quotas page | Partially implemented | Data model complete; allocation engine does not currently enforce quota as blocking constraint | Engineering trade-off during hackathon time |
| TR-15 | Loading checklist | loading_checklist_item table; Loader bay, verify, seal, confirm-departure endpoints | Fully implemented | Added waypoint sealing and shortfall flagging | — |
| TR-16 | Driver route view | GET /api/v1/driver/routes/current with waypoints, outlet details, delivery windows | Fully implemented | No change | — |
| TR-17 | Proof of delivery (recipient name, signature) | ProofOfDelivery entity; POST /deliveries/{waypoint_id}/pod | Fully implemented | Added photo evidence URL | Hackathon enhancement |
| TR-18 | Discrepancy reporting | DiscrepancyReport entity; POST /deliveries/{waypoint_id}/discrepancy | Fully implemented | Added inline discrepancies array on POD | — |
| TR-19 | Cold-chain temperature breach auto-detection | fn_telemetry_cold_chain_guard trigger auto-inserts discrepancy_report on reefer_temp_celsius > 4.0 | Fully implemented | Automated via PostgreSQL trigger (not manual) | Engineering improvement |
| TR-20 | Offline driver operation | Dexie.js sync queue + drain engine + POST /sync/batch | Fully implemented | No change | — |
| TR-21 | Offline sync on reconnect | browser online event + drain loop with exponential backoff retry | Fully implemented | Added retry backoff and permanent failure handling | Resilience requirement |
| TR-22 | Idempotent offline sync | idempotency_key on customer_order; telemetry dedup; 409 Conflict = duplicate_ignored | Fully implemented | No change | — |
| TR-23 | Live map for Dispatcher | live-map-page with Leaflet + outlet markers + vehicle positions | Fully implemented | Vehicle positions are simulated (live GPS from driver telemetry feed not yet connected to map) | Hackathon scope limit |
| TR-24 | Transactional emails | React Email templates + Resend REST API + console outbox fallback | Fully implemented | No change | — |
| TR-25 | Multi-brand support (Fresh, Style, Tech) | brand table; brand-specific time windows, cold chain, delivery window type | Fully implemented | No change | — |
| TR-26 | Two-depot operation (Peliyagoda, Kandy) | depot table with depot_id scoping on vehicles, staff, outlets, trips | Fully implemented | No change | — |
| TR-27 | District-level planning | district table; Rule 1: same brand and district per trip | Fully implemented | No change | — |
| TR-28 | Outlet access restrictions (mall bay, van-only) | parking_constraint and dock_type fields; enforced in solver | Fully implemented | No change | — |
| TR-29 | Delivery window constraints per outlet | window_open_time and window_close_time per outlet; shown in driver route | Fully implemented | Time budget constraint enforces window compliance at planning stage | — |
| TR-30 | 3D cargo bay visualization | cargo_bay_allocation table (LIFO grid) | Partially implemented | Data model complete; frontend 3D bay visualization not yet integrated | Hackathon scope limit |
| TR-31 | Vehicle telemetry | vehicle_telemetry table; POST /telemetry/report; offline sync via sync batch | Fully implemented | No change | — |
| TR-32 | Sustainability / fuel metrics | dispatcher-sustainability-page and dispatcher-fuel-quotas-page | Partially implemented | UI screens exist; real-time fuel calculation from telemetry not connected to live enforcement | Hackathon scope limit |
| TR-33 | Trip metrics and reporting | dispatcher-trip-metrics-page | Fully implemented | — | — |
| TR-34 | Workshop / fleet maintenance view | dispatcher-workshop-page | Fully implemented | — | — |
| TR-35 | Conflict resolution (offline) | NOT IMPLEMENTED | Not implemented | Idempotency-based deduplication used instead | Complexity vs. time trade-off; idempotency covers the primary Driver use case |

---

## Significant Departures from Designathon

### 1. Fuel Quota as Blocking Constraint (TR-14)

- **Original design**: Fuel quota should block vehicle assignment when `consumed_fuel_l >= weekly_fuel_quota_l`
- **Implemented design**: Fuel quota data is stored and visible on the Dispatcher Fuel Quotas page. The allocation engine does not yet enforce the quota as a blocking constraint.
- **Reason for change**: The data model, UI, and vehicle telemetry to track fuel consumption are in place. Integrating the constraint into the solver loop was deferred to prioritize end-to-end workflow completion within the hackathon timeline.
- **Impact**: Vehicles with exhausted fuel quotas may still be assigned trips during automated allocation. The Dispatcher can manually exclude them via vehicle_overrides in the optimize request.

### 2. Live Map Vehicle Positions (TR-23)

- **Original design**: Live Dispatcher map showing real-time vehicle GPS positions from telemetry
- **Implemented design**: Outlet positions are rendered on the Leaflet map. Vehicle positions are simulated from mock data; the telemetry feed does not yet drive real-time map updates in the frontend.
- **Reason for change**: The telemetry endpoint and database tables are fully implemented. Connecting the real-time telemetry stream to the Leaflet map via polling or WebSocket was descoped to maintain delivery of core workflow features.
- **Impact**: The map is visually complete and accurate for outlet coverage. Vehicle positions are illustrative rather than live.

### 3. Conflict Resolution (TR-35)

- **Original design**: Full server-side conflict resolution for concurrent offline mutations
- **Implemented design**: Idempotency-based deduplication (duplicate_ignored on 409 Conflict)
- **Reason for change**: In the Driver's operational context, conflicts between concurrent writes to the same waypoint from different devices are not a realistic scenario. Each trip is assigned to one driver. Idempotency covers the primary real-world need (re-sending a mutation after a network drop).
- **Impact**: If two drivers somehow submit PODs for the same waypoint concurrently, the second submission is dropped. This edge case does not occur in normal operation.

### 4. 3D Cargo Bay Visualization (TR-30)

- **Original design**: Interactive 3D cargo bay grid showing LIFO loading order
- **Implemented design**: `cargo_bay_allocation` table exists in the database schema. The backend API for the Loader checklist returns staging bay labels (e.g. `S1`, `S2` per stop sequence). The interactive 3D grid visualization in the frontend is not yet implemented.
- **Reason for change**: The data model foundation is complete. The frontend visualization component was descoped during hackathon to prioritize the end-to-end loading workflow.
- **Impact**: Loaders see staging bay labels per item in the checklist. The visual 3D grid is not available.
