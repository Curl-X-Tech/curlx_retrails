# Functional Requirements

**Project**: ReTrails — Team CurlX

Requirements are organized by role. Each requirement uses the format:
- **ID**: Unique requirement identifier
- **Feature**: Functional area
- **Actor**: The role performing the action
- **Precondition**: State required before the action
- **Input**: What the user provides
- **Main Flow**: The sequence of actions
- **System Response**: What the system does
- **Output**: What the user receives
- **Failure Cases**: What can go wrong

---

## FR-1: Store Manager

### FR-SM-01: Login

| Attribute | Value |
|---|---|
| Feature | Authentication |
| Actor | Store Manager |
| Precondition | Account exists and is active |
| Input | Email address and password |
| Main Flow | User submits login form; system validates credentials; JWT token issued |
| System Response | 200 OK with access_token; frontend stores token; redirect to store dashboard |
| Output | Authenticated session; store manager dashboard visible |
| Failure Cases | Invalid credentials: 400 Bad Request, error shown; inactive account: 400; rate limit exceeded: 429 |

### FR-SM-02: Create Order

| Attribute | Value |
|---|---|
| Feature | Order placement |
| Actor | Store Manager |
| Precondition | Authenticated; outlet assigned to account; items exist in catalog |
| Input | Item selection, quantities, required_date, temp_requirement |
| Main Flow | User selects items; system validates quantities; POST /api/v1/orders; order created |
| System Response | 201 Created; order_ref assigned; status=pending |
| Output | New order visible in order list with pending status |
| Failure Cases | Item not found; outlet not found; invalid required_date; validation error on quantities |

An `idempotency_key` is generated on the client and sent with the request. If the same order is submitted twice (e.g. offline then online), the duplicate is detected via the unique constraint and the first record is returned.

### FR-SM-03: View Order List

| Attribute | Value |
|---|---|
| Feature | Order visibility |
| Actor | Store Manager |
| Precondition | Authenticated |
| Input | Optional filters: status, order_date |
| Main Flow | GET /api/v1/orders (scoped to store manager's outlet) |
| System Response | List of orders for the outlet |
| Output | Table of orders with ref, date, status, total weight, total value (LKR) |
| Failure Cases | None expected |

### FR-SM-04: View Deferred Orders

| Attribute | Value |
|---|---|
| Feature | Deferral visibility |
| Actor | Store Manager |
| Precondition | Authenticated; outlet has deferred orders |
| Input | None (auto-scoped to outlet) |
| Main Flow | GET /api/v1/deferrals (scoped to outlet) |
| System Response | Deferral audit log entries for the outlet |
| Output | List of deferred orders with reason, dispatch_date, and days_since_last_served |
| Failure Cases | None expected |

### FR-SM-05: View Order Detail

| Attribute | Value |
|---|---|
| Feature | Order detail |
| Actor | Store Manager |
| Precondition | Order exists and belongs to manager's outlet |
| Input | order_id or order_ref |
| Main Flow | GET /api/v1/orders/{id} |
| System Response | Full order with line items, outlet info, delivery window, status |
| Output | Order detail view with all line items, weights, volumes, handling codes, and status |
| Failure Cases | Order not found: 404 |

---

## FR-2: Dispatcher

### FR-DSP-01: Login

| Attribute | Value |
|---|---|
| Feature | Authentication |
| Actor | Dispatcher |
| Precondition | Account exists, role=dispatcher |
| Input | Email address and password |
| Main Flow | Login form submitted; JWT token issued; redirect to dispatcher dashboard |
| Output | Dispatcher dashboard with summary metrics |
| Failure Cases | Invalid credentials; rate limit exceeded |

### FR-DSP-02: View Order Queue

| Attribute | Value |
|---|---|
| Feature | Order queue management |
| Actor | Dispatcher |
| Precondition | Authenticated; orders exist for depot |
| Input | Filters: status, order_date, brand, outlet |
| Main Flow | GET /api/v1/orders (scoped to dispatcher's depot) |
| System Response | All orders for the depot matching filters |
| Output | Filterable, sortable order queue table |
| Failure Cases | None expected |

### FR-DSP-03: Run Allocation Engine

| Attribute | Value |
|---|---|
| Feature | Automated allocation |
| Actor | Dispatcher |
| Precondition | Authenticated; pending orders exist; vehicles available |
| Input | operating_date, depot_id, optional order_ids, optional vehicle_overrides, solver_type |
| Main Flow | POST /api/v1/allocations/optimize; engine fetches orders and vehicles; solver runs; trips created |
| System Response | Proposed trips written to database; deferred orders updated; response includes trip list and deferred list |
| Output | Allocation result summary with trip count, allocated orders, deferred orders, execution time |
| Failure Cases | No orders found (empty result); no vehicles available (all deferred); solver failure (500) |

### FR-DSP-04: View Allocation Summary

| Attribute | Value |
|---|---|
| Feature | Trip monitoring |
| Actor | Dispatcher |
| Precondition | Trips exist for the date |
| Input | dispatch_date, depot_id |
| Main Flow | GET /api/v1/allocations/summary |
| System Response | Aggregated metrics across all trips |
| Output | Total trips, active trips, completed trips, total weight, total volume, average utilization percentages |
| Failure Cases | No trips: empty totals |

### FR-DSP-05: Confirm Trip for Loading

| Attribute | Value |
|---|---|
| Feature | Trip lifecycle |
| Actor | Dispatcher |
| Precondition | Trip exists with status=scheduled |
| Input | trip_id |
| Main Flow | POST /api/v1/allocations/{trip_id}/confirm |
| System Response | trip.status = loading; orders.status = allocated; loading checklist items created |
| Output | Trip now visible on Loader bay screen |
| Failure Cases | Trip not found: 404; trip not in scheduled status: 409 |

### FR-DSP-06: View Deferrals

| Attribute | Value |
|---|---|
| Feature | Deferral visibility |
| Actor | Dispatcher |
| Precondition | Authenticated |
| Input | Filters: dispatch_date, deferral_reason, outlet_id |
| Main Flow | GET /api/v1/deferrals |
| System Response | Deferral audit log for the depot |
| Output | Table of deferred orders with reasons and outlet details |
| Failure Cases | None expected |

### FR-DSP-07: View Fleet

| Attribute | Value |
|---|---|
| Feature | Fleet management |
| Actor | Dispatcher |
| Precondition | Authenticated |
| Input | Filters: depot_id, status, type, temp |
| Main Flow | GET /api/v1/fleet/vehicles |
| System Response | List of vehicles with status, capacity, fuel data |
| Output | Fleet table with vehicle details and current status |
| Failure Cases | None expected |

### FR-DSP-08: View Live Map

| Attribute | Value |
|---|---|
| Feature | Fleet monitoring |
| Actor | Dispatcher |
| Precondition | Authenticated |
| Input | None |
| Main Flow | Navigate to live-map-page; map renders outlet positions and (simulated) vehicle positions |
| System Response | Leaflet map with markers |
| Output | Visual map of delivery territory with outlet and vehicle overlay |
| Failure Cases | Map tile provider unavailable: map renders without tiles |

### FR-DSP-09: Manual Allocation

| Attribute | Value |
|---|---|
| Feature | Override allocation |
| Actor | Dispatcher |
| Precondition | Authenticated; orders in pending/deferred status; vehicle available |
| Input | order_ids, vehicle_id, driver_id, operating_date |
| Main Flow | POST /api/v1/allocations/manual |
| System Response | Trip created; orders allocated |
| Output | Trip created confirmation with trip_code |
| Failure Cases | Vehicle not found; orders not found; trip sequence conflict (409) |

---

## FR-3: Loader

### FR-LDR-01: View Loading Bays

| Attribute | Value |
|---|---|
| Feature | Bay overview |
| Actor | Loader |
| Precondition | Authenticated; trips in status scheduled/loading/dispatched |
| Input | Optional depot_id filter |
| Main Flow | GET /api/v1/loader/bays |
| System Response | List of bays with vehicle, driver, trip, and progress details |
| Output | Bay cards showing each active trip with vehicle info, loading progress, and payload metrics |
| Failure Cases | No active trips: empty bay list |

### FR-LDR-02: Start Loading

| Attribute | Value |
|---|---|
| Feature | Loading initiation |
| Actor | Loader |
| Precondition | Trip in status scheduled or loading |
| Input | trip_id |
| Main Flow | POST /api/v1/loader/trips/{trip_id}/start-loading |
| System Response | trip.status = loading; checklist created if not exists |
| Output | Trip shows as docked_loading; checklist items appear |
| Failure Cases | Trip not in correct status: 409 |

### FR-LDR-03: View Loading Checklist

| Attribute | Value |
|---|---|
| Feature | Checklist access |
| Actor | Loader |
| Precondition | Trip in loading status; checklist items exist |
| Input | trip_id |
| Main Flow | GET /api/v1/loader/trips/{trip_id}/checklist |
| System Response | Structured waypoint list with nested item rows; each item shows package_code, SKU, name, staging_bay, crate count, weight, reefer flag, special handling code, verification status |
| Output | Checklist organized by waypoint (stop sequence) |
| Failure Cases | Trip not found: 404 |

### FR-LDR-04: Verify Checklist Item

| Attribute | Value |
|---|---|
| Feature | Item verification |
| Actor | Loader |
| Precondition | Trip in status=loading; item exists in checklist |
| Input | item_id, status (verified or flagged_shortfall), shortfall_qty, note |
| Main Flow | POST /api/v1/loader/items/{item_id}/verify |
| System Response | loading_checklist_item.status updated; verified_by_staff_id and verified_at recorded |
| Output | Item shows as verified (green) or flagged (amber) in checklist |
| Failure Cases | Item not found: 404; trip not in loading status: 409; invalid status value: 422 |

### FR-LDR-05: Seal Waypoint

| Attribute | Value |
|---|---|
| Feature | Waypoint sealing |
| Actor | Loader |
| Precondition | All items for the waypoint are verified or flagged (no pending items) |
| Input | trip_id, waypoint seq number |
| Main Flow | POST /api/v1/loader/trips/{trip_id}/waypoints/{seq}/seal |
| System Response | route_leg.sealed_at and sealed_by_staff_id recorded |
| Output | Waypoint shows sealed indicator |
| Failure Cases | Unverified items remain: 409 UNVERIFIED_ITEMS; waypoint not found: 404 |

### FR-LDR-06: Confirm Departure

| Attribute | Value |
|---|---|
| Feature | Departure confirmation |
| Actor | Loader |
| Precondition | Trip in scheduled or loading status |
| Input | trip_id, optional seal_number |
| Main Flow | POST /api/v1/loader/trips/{trip_id}/confirm-departure |
| System Response | Any remaining pending items auto-verified; any unsealed waypoints auto-sealed; trip.status = dispatched; vehicle.status = in_transit; orders.status = in_transit; seal_number recorded; actual_start_time set |
| Output | Trip shows as dispatched; bay becomes available |
| Failure Cases | Trip not in loading status: 409 |

---

## FR-4: Driver

### FR-DRV-01: Login

| Attribute | Value |
|---|---|
| Feature | Authentication |
| Actor | Driver |
| Precondition | Account exists, role=driver |
| Input | Email address and password |
| Main Flow | Login; JWT issued; redirect to driver trips list |
| Output | Driver dashboard showing assigned trips |
| Failure Cases | Invalid credentials; rate limit |

### FR-DRV-02: View Assigned Trips

| Attribute | Value |
|---|---|
| Feature | Trip list |
| Actor | Driver |
| Precondition | Authenticated |
| Input | None |
| Main Flow | GET /api/v1/driver/trips |
| System Response | Trips assigned to the driver's staff_profile.id; if none found, returns last 20 trips in system |
| Output | Trip cards with trip_code, date, status, vehicle info, stop count, payload |
| Failure Cases | None expected |

### FR-DRV-03: Activate Trip

| Attribute | Value |
|---|---|
| Feature | Trip activation |
| Actor | Driver |
| Precondition | Trip exists (typically in dispatched status) |
| Input | trip_id |
| Main Flow | POST /api/v1/driver/trips/{trip_id}/activate |
| System Response | trip.driver_id updated to driver's staff_profile; trip.status = in_transit |
| Output | Trip becomes active; route view opens |
| Failure Cases | Trip not found: 404 |

### FR-DRV-04: View Current Route

| Attribute | Value |
|---|---|
| Feature | Route navigation |
| Actor | Driver |
| Precondition | Active trip exists for driver |
| Input | Optional trip_id override |
| Main Flow | GET /api/v1/driver/routes/current |
| System Response | Trip header, vehicle details, depot coordinates, full waypoint list with outlet coordinates, delivery windows, order items, and next active waypoint |
| Output | Route view with sequenced stops; first pending stop highlighted |
| Failure Cases | No trip found: 404 NO_TRIP_AVAILABLE |

### FR-DRV-05: Record Arrival

| Attribute | Value |
|---|---|
| Feature | Stop arrival |
| Actor | Driver |
| Precondition | Waypoint exists; not already completed |
| Input | waypoint_id (route_leg.id), arrived_at timestamp, optional coordinates |
| Main Flow | POST /api/v1/deliveries/{waypoint_id}/arrive |
| System Response | route_leg.status = arrived; route_leg.arrival_time recorded; if trip was dispatched, trip.status = in_transit |
| Output | Waypoint shows as arrived |
| Failure Cases | Waypoint already closed: 409 WAYPOINT_CLOSED |
| Offline behavior | Written to Dexie sync_queue; applied via /sync/batch on reconnect |

### FR-DRV-06: Submit Proof of Delivery

| Attribute | Value |
|---|---|
| Feature | Delivery confirmation |
| Actor | Driver |
| Precondition | Waypoint arrived; order exists; driver has a staff_profile |
| Input | waypoint_id, recipient_name, signature_data_url (SVG/canvas data), photo_proof_url, arrived_at, completed_at, discrepancies[] |
| Main Flow | POST /api/v1/deliveries/{waypoint_id}/pod |
| System Response | ProofOfDelivery record created; DiscrepancyReport records created for any discrepancies; route_leg.status = completed; route_leg.leave_outlet_time recorded; order.status = delivered; if all legs complete, trip.status = completed |
| Output | Stop marked as complete; next stop highlighted |
| Failure Cases | Waypoint closed: 409; driver profile not found: 403; item not found: 404 |
| Offline behavior | Written to Dexie sync_queue; applied via /sync/batch on reconnect |

### FR-DRV-07: Log Discrepancy

| Attribute | Value |
|---|---|
| Feature | Issue reporting |
| Actor | Driver (or Store Manager) |
| Precondition | Waypoint exists; order has an item |
| Input | waypoint_id, item_id, issue_type (damaged/shortage/rejected/temp_breach/delayed_window), reported_qty, notes |
| Main Flow | POST /api/v1/deliveries/{waypoint_id}/discrepancy |
| System Response | DiscrepancyReport created with status=open |
| Output | Discrepancy recorded; visible on Dispatcher monitoring |
| Failure Cases | Invalid issue_type: 422; waypoint has no order: 409 |
| Offline behavior | Written to Dexie sync_queue as part of POD discrepancies[] array |

### FR-DRV-08: Offline Operation

| Attribute | Value |
|---|---|
| Feature | Offline continuity |
| Actor | Driver |
| Precondition | Previously authenticated; trip data downloaded while online |
| Input | Network unavailability |
| Main Flow | Browser offline event fires; sync engine pauses drain; driver continues using local Dexie data; mutations queued locally |
| System Response | No server calls; local state only |
| Output | Driver can view routes and submit arrivals/PODs; UI shows offline indicator |
| Failure Cases | Trip data not pre-downloaded: driver sees stale data |
