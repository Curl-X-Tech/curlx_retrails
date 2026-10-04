# Testing

**Project**: ReTrails — Team CurlX

---

## Test Infrastructure

- **Backend**: pytest 8.3+, pytest-asyncio (async test mode), pytest-cov for coverage
- **Frontend**: [TEST RESULT TO BE COMPLETED — confirm frontend test framework in use]
- **Run command**: `./dev.sh test` (backend) or `./dev.sh check` (all)

---

## Functional Tests

### FT-01: Authentication

| Test ID | Feature | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| FT-01-01 | Login with valid credentials | email=dispatcher.peliyagoda@example.com, password=Password@123 | 200 OK, access_token returned | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-01-02 | Login with invalid password | email=valid, password=wrong | 400 Bad Request | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-01-03 | Access protected endpoint without token | GET /api/v1/orders without Authorization header | 401 Unauthorized | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-01-04 | Access endpoint with wrong role | Loader accessing POST /api/v1/allocations/optimize | 403 Forbidden | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-01-05 | Rate limit exceeded | 21+ login attempts in 1 minute | 429 Too Many Requests | [TEST RESULT TO BE COMPLETED] | [PENDING] |

---

## Role Tests

### FT-02: Store Manager

| Test ID | Feature | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| FT-SM-01 | Place order | Valid outlet_id, item_id, requested_qty=10 | 201 Created, order_ref assigned, status=pending | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-SM-02 | Place duplicate order (idempotency) | Same idempotency_key twice | Second call returns first order, not duplicate | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-SM-03 | View own orders | GET /orders (store_manager scope) | Orders for own outlet only | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-SM-04 | View deferred orders | GET /deferrals | Deferral entries for own outlet | [TEST RESULT TO BE COMPLETED] | [PENDING] |

### FT-03: Dispatcher

| Test ID | Feature | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| FT-DSP-01 | Run allocation engine | operating_date, depot_id for Peliyagoda | Trips created, deferred orders listed | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DSP-02 | Run simulation | simulation=true | Response contains trip data, no DB writes | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DSP-03 | Confirm trip for loading | Valid trip_id with status=scheduled | trip.status=loading, checklist created | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DSP-04 | Confirm trip already loading | trip_id with status=loading | 409 TRIP_NOT_SCHEDULED | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DSP-05 | View allocation summary | GET /allocations/summary | Aggregated metrics | [TEST RESULT TO BE COMPLETED] | [PENDING] |

### FT-04: Loader

| Test ID | Feature | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| FT-LDR-01 | View loading bays | GET /loader/bays | Bays with active trips | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-LDR-02 | Verify checklist item | item_id, status=verified | Checklist item status=verified | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-LDR-03 | Flag shortfall | item_id, status=flagged_shortfall, shortfall_qty=2 | Item flagged with shortfall_qty=2 | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-LDR-04 | Seal waypoint with unverified items | seq with pending items | 409 UNVERIFIED_ITEMS | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-LDR-05 | Confirm departure | trip_id | trip.status=dispatched, orders=in_transit | [TEST RESULT TO BE COMPLETED] | [PENDING] |

### FT-05: Driver

| Test ID | Feature | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| FT-DRV-01 | View assigned trips | GET /driver/trips | Trips for driver's staff_profile | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DRV-02 | Get current route | GET /driver/routes/current | Trip header + waypoints + active_waypoint_seq | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DRV-03 | Record arrival | waypoint_id, arrived_at | route_leg.status=arrived | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DRV-04 | Submit POD without discrepancies | waypoint_id, recipient_name, signature | route_leg.status=completed, order=delivered | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DRV-05 | Submit POD with discrepancy | discrepancies=[{shortage, qty=2}] | discrepancy_report created | [TEST RESULT TO BE COMPLETED] | [PENDING] |
| FT-DRV-06 | Arrive at already-completed waypoint | waypoint with status=completed | 409 WAYPOINT_CLOSED | [TEST RESULT TO BE COMPLETED] | [PENDING] |

---

## Workflow Tests

### FT-06: Complete End-to-End Workflow

| Step | Actor | Action | Expected Outcome | Status |
|---|---|---|---|---|
| 1 | Store Manager | Place order with 5 items | Order created, status=pending | [TEST RESULT TO BE COMPLETED] |
| 2 | Dispatcher | Run allocation engine | Trip created, order status=allocated | [TEST RESULT TO BE COMPLETED] |
| 3 | Dispatcher | Confirm trip for loading | Trip status=loading, checklist created | [TEST RESULT TO BE COMPLETED] |
| 4 | Loader | Verify all checklist items | All items verified | [TEST RESULT TO BE COMPLETED] |
| 5 | Loader | Seal all waypoints | All waypoints sealed | [TEST RESULT TO BE COMPLETED] |
| 6 | Loader | Confirm departure | Trip status=dispatched, orders=in_transit | [TEST RESULT TO BE COMPLETED] |
| 7 | Driver | Activate trip | Trip status=in_transit | [TEST RESULT TO BE COMPLETED] |
| 8 | Driver | Record arrival at stop 1 | route_leg status=arrived | [TEST RESULT TO BE COMPLETED] |
| 9 | Driver | Submit POD | route_leg=completed, order=delivered | [TEST RESULT TO BE COMPLETED] |
| 10 | (auto) | All legs complete | Trip status=completed | [TEST RESULT TO BE COMPLETED] |

---

## Constraint Tests

### FT-07: Allocation Constraint Tests

| Test ID | Constraint | Setup | Expected Result | Status |
|---|---|---|---|---|
| FT-CON-01 | Weight capacity | Order exceeding vehicle weight_cap_kg | Order not added to that vehicle's trip; deferred or assigned to different vehicle | [TEST RESULT TO BE COMPLETED] |
| FT-CON-02 | Volume capacity | Order exceeding vehicle volume_cap_m3 | Same as weight — excluded | [TEST RESULT TO BE COMPLETED] |
| FT-CON-03 | Refrigeration | chilled order, no reefer vehicles in depot | Order deferred with reason=insufficient_reefer_capacity | [TEST RESULT TO BE COMPLETED] |
| FT-CON-04 | Van-only outlet | Order for van_only outlet, only trucks available | Order deferred with reason=van_access_shortage | [TEST RESULT TO BE COMPLETED] |
| FT-CON-05 | Depot constraint | Orders for Kandy depot, Peliyagoda vehicles only | Peliyagoda vehicles not assigned to Kandy orders | [TEST RESULT TO BE COMPLETED] |
| FT-CON-06 | Time budget (Fresh) | Fresh orders exceeding 270 min window | Orders causing budget overflow deferred with reason=time_budget_limit | [TEST RESULT TO BE COMPLETED] |
| FT-CON-07 | Trip limit | Vehicle already has 2 trips on dispatch_date | Vehicle excluded from eligible pool | [TEST RESULT TO BE COMPLETED] |
| FT-CON-08 | Deferred priority | Order with deferred_yesterday=1 | Order sorted first in priority queue | [TEST RESULT TO BE COMPLETED] |
| FT-CON-09 | Whole-order packing | Vehicle has capacity for 3 of 5 items | Entire order (all 5) either fits or is excluded | [TEST RESULT TO BE COMPLETED] |
| FT-CON-10 | Fuel quota | NOT YET IMPLEMENTED | N/A | NOT IMPLEMENTED |

---

## Offline Tests

### FT-08: Offline and Sync Tests

| Test ID | Scenario | Action | Expected Result | Status |
|---|---|---|---|---|
| FT-OFF-01 | Connection loss detection | Simulate browser offline event | Sync engine stops drain; online=false in useSyncStatus | [TEST RESULT TO BE COMPLETED] |
| FT-OFF-02 | Offline action queuing | Submit POD while offline | Mutation written to Dexie sync_queue with status=queued | [TEST RESULT TO BE COMPLETED] |
| FT-OFF-03 | Local persistence | Close and reopen PWA while offline | Dexie data persists; route view loads from local cache | [TEST RESULT TO BE COMPLETED] |
| FT-OFF-04 | Connection restored | Bring browser back online | Drain starts; POST /sync/batch sent | [TEST RESULT TO BE COMPLETED] |
| FT-OFF-05 | Successful sync | Valid mutations drained | Mutations applied on server; Dexie status=applied | [TEST RESULT TO BE COMPLETED] |
| FT-OFF-06 | Idempotency | Same POD mutation sent twice | Second batch response: status=duplicate_ignored | [TEST RESULT TO BE COMPLETED] |
| FT-OFF-07 | Retry on failure | Server returns 500 for a batch | Mutation marked with attempts+1; retry scheduled with backoff | [TEST RESULT TO BE COMPLETED] |
| FT-OFF-08 | Max retries | Mutation fails beyond retry limit | Mutation permanently marked failed; error shown in UI | [TEST RESULT TO BE COMPLETED] |

---

## Backend Unit Tests

Backend test files are in `backend/tests/`. Run with `./dev.sh test`.

[TEST RESULT TO BE COMPLETED — list actual test files and results from pytest run]

---

## Test Coverage

[TEST RESULT TO BE COMPLETED — run `./dev.sh test` with `--cov` flag and report coverage percentage per module]

---

## Known Limitations in Test Coverage

- End-to-end tests across browser + backend + database are not automated; the workflow tests above are manual test cases.
- Offline simulation tests require browser DevTools to throttle network; they are not automated in CI.
- Allocation engine constraint tests require controlled seed data; they have been verified by inspection of the heuristic solver logic.
