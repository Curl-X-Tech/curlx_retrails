# UI Documentation

**Project**: ReTrails — Team CurlX

Screenshots: [INSERT SCREENSHOT] placeholders indicate where screenshots should be added before submission.

---

## Store Manager Screens

### SCR-SM-01: Store Dashboard

| Attribute | Value |
|---|---|
| Screen ID | SCR-SM-01 |
| Screen Name | Store Dashboard |
| Role | store_manager |
| Source file | `frontend/src/pages/store/store-dashboard-page.tsx` |
| Purpose | Overview of order activity and key metrics for the manager's outlet |
| Main Components | Metric cards (pending orders, delivered today, deferred), recent order list, quick-create button |
| User Actions | Create new order, navigate to order list, view deferred orders |
| Data Displayed | Order counts by status, recent orders, outlet name |
| API/Data Source | GET /api/v1/orders (scoped to outlet) |
| Navigation | Dashboard tab; links to orders, deferrals, receiving |
| Validation | None on this screen |
| Error Handling | API error shown as toast or inline message |
| Offline Behavior | Previously cached order counts displayed; create order queued to sync queue |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-SM-02: Create Order

| Attribute | Value |
|---|---|
| Screen ID | SCR-SM-02 |
| Screen Name | Create Order |
| Role | store_manager |
| Source file | `frontend/src/pages/store/store-create-order-page.tsx` |
| Purpose | Place a new delivery order for the outlet |
| Main Components | Item search/select, quantity inputs, required_date picker, temp_requirement selector, submit button |
| User Actions | Search and select items, enter quantities, select date, submit |
| Data Displayed | Available items from catalog, unit weight, handling code |
| API/Data Source | GET /api/v1/items; POST /api/v1/orders |
| Navigation | Accessible from dashboard or orders list; returns to order list on success |
| Validation | Quantity > 0; required_date is a valid future date; at least one item required |
| Error Handling | Validation errors shown inline; API errors shown as toast |
| Offline Behavior | Order queued in Dexie sync_queue with idempotency_key; submitted on reconnect |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-SM-03: Order List

| Attribute | Value |
|---|---|
| Screen ID | SCR-SM-03 |
| Screen Name | Order List |
| Role | store_manager |
| Source file | `frontend/src/pages/store/store-orders-page.tsx` |
| Purpose | View all orders placed by the store manager |
| Main Components | Filterable table with columns: order_ref, date, status, weight, value; status filter dropdown |
| User Actions | Filter by status; click to view detail |
| Data Displayed | order_ref, order_date, status, total_weight_kg, total_order_value_lkr |
| API/Data Source | GET /api/v1/orders |
| Navigation | Order row click opens order detail |
| Validation | None |
| Error Handling | Empty state when no orders |
| Offline Behavior | Cached order list displayed |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-SM-04: Deferred Orders

| Attribute | Value |
|---|---|
| Screen ID | SCR-SM-04 |
| Screen Name | Deferred Orders |
| Role | store_manager |
| Source file | `frontend/src/pages/store/store-deferrals-page.tsx` |
| Purpose | View orders that could not be delivered due to operational constraints |
| Main Components | Table of deferred orders with reason, dispatch_date, days_since_last_served |
| User Actions | View deferral details |
| Data Displayed | order_ref, deferral_reason, dispatch_date, days_since_last_served |
| API/Data Source | GET /api/v1/deferrals (outlet-scoped) |
| Navigation | Deferrals tab |
| Validation | None |
| Error Handling | Empty state when no deferrals |
| Offline Behavior | Cached deferrals displayed |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-SM-05: Delivery Receiving

| Attribute | Value |
|---|---|
| Screen ID | SCR-SM-05 |
| Screen Name | Delivery Receiving |
| Role | store_manager |
| Source file | `frontend/src/pages/store/store-receiving-page.tsx` |
| Purpose | Confirm receipt of delivered goods; report discrepancies |
| Main Components | Active delivery details, item checklist, discrepancy report form, confirm button |
| User Actions | Mark items received; report shortage or damage; confirm receipt |
| Data Displayed | Order items, quantities, handling codes, expected vs received |
| API/Data Source | GET /api/v1/orders; POST /api/v1/deliveries/{waypoint_id}/discrepancy |
| Navigation | From dashboard or receiving tab |
| Validation | At least one action required to confirm |
| Error Handling | Invalid discrepancy type: 422 shown inline |
| Offline Behavior | Limited — requires connectivity for discrepancy submission |
| Screenshot | [INSERT SCREENSHOT] |

---

## Dispatcher Screens

### SCR-DSP-01: Dispatcher Dashboard

| Attribute | Value |
|---|---|
| Screen ID | SCR-DSP-01 |
| Screen Name | Dispatcher Dashboard |
| Role | dispatcher |
| Source file | `frontend/src/pages/dispatcher/dispatcher-dashboard-page.tsx` |
| Purpose | Command center showing daily operational summary |
| Main Components | Metric cards (trips active, orders allocated, fleet utilization), quick action buttons (run allocation), summary charts |
| User Actions | Trigger allocation engine, navigate to allocation list, navigate to fleet |
| Data Displayed | GET /api/v1/allocations/summary metrics |
| API/Data Source | GET /api/v1/allocations/summary |
| Navigation | Primary dispatcher landing page |
| Offline Behavior | Cached summary metrics displayed |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DSP-02: Order Queue

| Attribute | Value |
|---|---|
| Screen ID | SCR-DSP-02 |
| Screen Name | Order Queue |
| Role | dispatcher |
| Source file | `frontend/src/pages/dispatcher/order-queue-page.tsx` |
| Purpose | Review all orders pending allocation |
| Main Components | Filterable order table, status filter, date filter, brand filter |
| User Actions | Filter and review orders; select orders for manual allocation |
| Data Displayed | order_ref, outlet, brand, district, status, weight, volume, temp_requirement, is_urgent |
| API/Data Source | GET /api/v1/orders |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DSP-03: Allocation Summary

| Attribute | Value |
|---|---|
| Screen ID | SCR-DSP-03 |
| Screen Name | Allocation Summary |
| Role | dispatcher |
| Source file | `frontend/src/pages/dispatcher/allocation-summary-page.tsx` |
| Purpose | Review all trips for a dispatch date; confirm trips for loading |
| Main Components | Trip card list with weight/volume utilization bars, confirm button, status badge |
| User Actions | Run allocation engine; confirm trips; view trip detail |
| Data Displayed | trip_code, brand, district, vehicle, driver, payload metrics, status |
| API/Data Source | GET /api/v1/allocations; POST /api/v1/allocations/optimize; POST /api/v1/allocations/{id}/confirm |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DSP-04: Allocation Detail

| Attribute | Value |
|---|---|
| Screen ID | SCR-DSP-04 |
| Screen Name | Allocation Detail |
| Role | dispatcher |
| Source file | `frontend/src/pages/dispatcher/allocation-detail-page.tsx` |
| Purpose | View full route sequence, order list, and loading status for a single trip |
| Main Components | Trip header, route legs table, order items, loading checklist progress |
| User Actions | View leg sequence; view order details |
| Data Displayed | Trip metrics, route legs with planned times, orders with weights and handling codes |
| API/Data Source | GET /api/v1/allocations/{trip_id} |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DSP-05: Deferrals Page

| Attribute | Value |
|---|---|
| Screen ID | SCR-DSP-05 |
| Screen Name | Deferrals |
| Role | dispatcher |
| Source file | `frontend/src/pages/dispatcher/deferrals-page.tsx` |
| Purpose | View all deferred orders with reasons; identify systemic constraint issues |
| Main Components | Deferral table with reason, outlet, dispatch_date, days_since_last_served |
| API/Data Source | GET /api/v1/deferrals |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DSP-06: Fleet Page

| Attribute | Value |
|---|---|
| Screen ID | SCR-DSP-06 |
| Screen Name | Fleet |
| Role | dispatcher |
| Source file | `frontend/src/pages/dispatcher/dispatcher-vehicles-page.tsx` |
| Purpose | View and manage fleet vehicle status, capacity, and fuel data |
| Main Components | Vehicle table with status, type, temp, capacity, fuel quota |
| User Actions | Filter by depot, status, type; update vehicle status |
| API/Data Source | GET /api/v1/fleet/vehicles |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DSP-07: Live Map

| Attribute | Value |
|---|---|
| Screen ID | SCR-DSP-07 |
| Screen Name | Live Map |
| Role | dispatcher |
| Source file | `frontend/src/pages/dispatcher/live-map-page.tsx` |
| Purpose | Visual map of delivery territory showing outlet positions and (simulated) vehicle positions |
| Main Components | Leaflet map with Carto Positron tile layer, outlet markers, vehicle markers |
| Offline Behavior | Map renders from cached data; tile layer requires connectivity |
| Screenshot | [INSERT SCREENSHOT] |

---

## Loader Screens

### SCR-LDR-01: Loader Dashboard

| Attribute | Value |
|---|---|
| Screen ID | SCR-LDR-01 |
| Screen Name | Loader Dashboard |
| Role | loader |
| Source file | `frontend/src/pages/loader/loader-dashboard-page.tsx` |
| Purpose | Overview of loading bays and active trips |
| Main Components | Bay count summary, quick navigation to bays and manifests |
| API/Data Source | GET /api/v1/loader/bays |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-LDR-02: Loading Bays

| Attribute | Value |
|---|---|
| Screen ID | SCR-LDR-02 |
| Screen Name | Loading Bays |
| Role | loader |
| Source file | `frontend/src/pages/loader/loader-bays-page.tsx` |
| Purpose | Primary Loader workspace: view all active bays with loading progress |
| Main Components | Bay cards showing vehicle info, driver info, trip details, loading progress bar, payload utilization, dock status indicator |
| User Actions | Start loading; navigate to checklist; confirm departure |
| Data Displayed | Bay number, dock status (empty/docked_loading/verified_sealed/departed), vehicle reg, driver name, trip code, stops count, payload percentages |
| API/Data Source | GET /api/v1/loader/bays |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-LDR-03: Loading Checklist

| Attribute | Value |
|---|---|
| Screen ID | SCR-LDR-03 |
| Screen Name | Loading Checklist |
| Role | loader |
| Source file | Accessed from loader-bays-page via checklist drawer or navigation |
| Purpose | Item-by-item verification of cargo against the loading manifest |
| Main Components | Waypoint accordion sections, item rows with package_code, SKU, staging bay, crate count, weight, reefer indicator, verification status button |
| User Actions | Mark items verified; flag shortfall with quantity; seal waypoint; confirm departure |
| Data Displayed | Items grouped by waypoint/stop; verification status (pending/verified/flagged) |
| API/Data Source | GET /api/v1/loader/trips/{id}/checklist; POST /api/v1/loader/items/{id}/verify; POST /api/v1/loader/trips/{id}/waypoints/{seq}/seal |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-LDR-04: Exceptions

| Attribute | Value |
|---|---|
| Screen ID | SCR-LDR-04 |
| Screen Name | Loader Exceptions |
| Role | loader |
| Source file | `frontend/src/pages/loader/loader-exceptions-page.tsx` |
| Purpose | View flagged shortfall items and discrepancies across all active trips |
| Main Components | Exceptions table with trip, item, shortfall quantity, notes |
| API/Data Source | GET /api/v1/loader/bays (filtered for flagged items) |
| Screenshot | [INSERT SCREENSHOT] |

---

## Driver Screens

### SCR-DRV-01: Driver Trips List

| Attribute | Value |
|---|---|
| Screen ID | SCR-DRV-01 |
| Screen Name | Trip List |
| Role | driver |
| Source file | `frontend/src/pages/driver/driver-trips-list-page.tsx` |
| Purpose | View all trips assigned to the driver |
| Main Components | Trip cards with trip_code, date, status, vehicle info, stop count, payload |
| User Actions | Select a trip to view; activate trip |
| API/Data Source | GET /api/v1/driver/trips |
| Offline Behavior | Cached trip list displayed |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DRV-02: Active Trip / Route View

| Attribute | Value |
|---|---|
| Screen ID | SCR-DRV-02 |
| Screen Name | Active Trip |
| Role | driver |
| Source file | `frontend/src/pages/driver/driver-active-trip-page.tsx` |
| Purpose | Primary Driver workspace during delivery: current route with next stop highlighted |
| Main Components | Trip header, next stop card with outlet name/window/access info, waypoints list, arrive button |
| User Actions | Record arrival at stop; navigate to POD submission |
| Data Displayed | Trip code, vehicle, depot, driver; stop sequence with outlet details, delivery windows, access constraints, order summary |
| API/Data Source | GET /api/v1/driver/routes/current; POST /api/v1/deliveries/{id}/arrive |
| Offline Behavior | Full offline; arrive action queued to Dexie sync_queue |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DRV-03: Stop Detail / Unloading

| Attribute | Value |
|---|---|
| Screen ID | SCR-DRV-03 |
| Screen Name | Stop Unloading |
| Role | driver |
| Source file | `frontend/src/pages/driver/driver-unloading-page.tsx` |
| Purpose | Confirm delivery at a stop: recipient details, signature, photo, discrepancies |
| Main Components | Recipient name field, signature canvas, photo capture, item checklist with discrepancy buttons, submit POD button |
| User Actions | Enter recipient name; capture signature; take photo (optional); flag issues; submit POD |
| Data Displayed | Stop items with quantities and handling codes |
| API/Data Source | POST /api/v1/deliveries/{id}/pod |
| Offline Behavior | Full offline; POD queued to Dexie sync_queue with idempotency_key |
| Screenshot | [INSERT SCREENSHOT] |

---

### SCR-DRV-04: Vehicle Info

| Attribute | Value |
|---|---|
| Screen ID | SCR-DRV-04 |
| Screen Name | Vehicle Info |
| Role | driver |
| Source file | `frontend/src/pages/driver/driver-vehicle-page.tsx` |
| Purpose | View assigned vehicle details: registration, capacity, fuel quota remaining |
| Main Components | Vehicle card with reg_number, model, type, temp, weight capacity, volume capacity, fuel_remaining_l |
| API/Data Source | GET /api/v1/driver/routes/current (vehicle block in response) |
| Screenshot | [INSERT SCREENSHOT] |
