# Fleet Planning and Allocation Engine

Specification of vehicle allocation logic, constraint enforcement, and deferral handling for ReTrails.

---

## 1. Allocation Workflow

The allocation engine is invoked by the Dispatcher via `POST /api/v1/allocations/optimize` or automatically scheduled at the 16:00 daily order cutoff.

1. **Order Candidate Collection**: Gathers all orders for the target depot where `status IN ('pending', 'deferred')` and `order_date <= operating_date`.
2. **Clustering**: Groups orders by `(depot_id, brand_id, district_id)`. All orders on a single trip must share the same brand and destination district.
3. **Priority Ordering**: Orders within each cluster are sorted in descending priority based on:
   $$\text{Priority} = (\text{deferred\_yesterday} \times 1000) + (\text{days\_since\_last\_served} \times 100) + (\text{is\_urgent} \times 10)$$
   This guarantees that an outlet deferred on the previous day is strictly served first, preventing consecutive-day starvation.
4. **Solver Execution**:
   - **Primary Solver**: Google OR-Tools CP-SAT formulation modeling bin-packing, capacity limits, and time windows.
   - **Fallback Solver**: Deterministic priority heuristic bin-packer ensuring sub-second completion.
5. **Persistence**: Creates `trip` and `route_leg` records for assigned orders, sets their status to `allocated`, and logs any unallocated orders in `deferral_audit_log` with status `deferred`.

---

## 2. Constraint Enforcement

| Constraint | Scope | Technical Enforcement | Violation Behavior |
|---|---|---|---|
| **Weight Capacity** | Vehicle | Cumulative order line item weight $\le \text{vehicle.weight\_cap\_kg}$ (e.g. 2,500 kg for vans, 5,000 kg for trucks). | Candidate order is skipped; solver attempts to fit next eligible order or defers if no vehicle fits. |
| **Volume Capacity** | Vehicle | Cumulative order line item volume $\le \text{vehicle.volume\_cap\_m3}$ (e.g. 10 m³ for vans, 22 m³ for trucks). | Candidate order is skipped; solver defers order with `CAPACITY_EXCEEDED`. |
| **Temperature Compatibility** | Vehicle / Cargo | If any item in the order requires cold chain (`COL` / chilled), vehicle must have $\text{vehicle.temp} == \text{'reefer'}$. | Ambient vehicles are disqualified from candidate pool. Order deferred if no reefer vehicle is available. |
| **Van-Only Access (`MAL`)** | Outlet | Outlets located in shopping complexes with underground loading bays require $\text{vehicle.type} == \text{'van'}$. | Trucks are barred from route legs visiting mall outlets. Order deferred if vans are unavailable. |
| **Home Depot Scoping** | Depot / Vehicle | Vehicles assigned to Peliyagoda (`PEL`) cannot be allocated to trips originating from Kandy (`KDY`), and vice versa. | Candidate vehicle pool strictly filtered by `vehicle.depot_id == depot_id`. |
| **Delivery Time Windows** | Route Leg / Outlet | Planned arrival time must fall within store receiving hours ($\text{window\_open\_time} \le \text{arrival} \le \text{window\_close\_time}$). | If arrival cannot meet window within the daily time budget (Fresh: 270 min, Style/Tech: 480 min), order is skipped. |
| **Weekly Fuel Quota** | Vehicle | Trip estimated fuel consumption ($\text{trip\_distance\_km} / \text{vehicle.km\_per\_l}$) cannot exceed vehicle remaining weekly fuel quota. | Vehicle excluded from active pool if trip requires more fuel than remaining quota. |
| **2-Trip Daily Limit** | Vehicle | A vehicle can be assigned at most 2 trips per operating day ($\text{trip\_sequence} \in \{1, 2\}$). | Enforced via database constraint `UNIQUE(dispatch_date, vehicle_id, trip_sequence)`. Once 2 trips are assigned, vehicle is removed from candidate pool. |

---

## 3. Deferral Rules and Visibility

### Deferral Rules
When an order cannot be accommodated on any trip due to vehicle limits, time budgets, or equipment incompatibility:
1. The order status updates from `pending` to `deferred`.
2. The order's `deferred_yesterday` counter is set to `1` and `days_since_last_served` increments.
3. An immutable record is created in `deferral_audit_log` capturing:
   - `order_id`, `outlet_id`, `dispatch_date`
   - `deferral_reason`: `CAPACITY_EXCEEDED`, `INSUFFICIENT_REEFER`, `VAN_ACCESS_SHORTAGE`, `TIME_BUDGET_LIMIT`, or `FLEET_UNAVAILABLE`
   - `limiting_resource`: `fleet_capacity` or `time_budget`
   - `decision_maker_staff_id`: Dispatcher ID executing the run

### How Deferrals Are Shown
- **Dispatcher Console**: `/dispatcher/deferrals` renders a dedicated table of deferred orders with reason badges, affected store names, and volumetric metrics.
- **Store Manager Portal**: `/store-manager/deferrals` displays orders for their specific outlet tagged as `deferred`, showing the recorded reason and expected rollover delivery date.

---

## 4. Worked Allocation Example

Consider **Peliyagoda Depot** serving **Colombo District** on **Fresh Brand**:

### Available Vehicle:
- **Van `WP-CAD-1021`**: Type: `van`, Temp: `reefer`, Weight Cap: `2,000 kg`, Volume Cap: `10.0 m³`, Remaining Trips Today: `1`.

### Incoming Orders:
- **Order A (OUT001 Fresh Colombo)**: Weight: `850 kg`, Volume: `4.2 m³`, Cold Chain: `Yes` (`COL`), Parking: `Normal`.
- **Order B (OUT003 Fresh Mall Bay)**: Weight: `600 kg`, Volume: `3.5 m³`, Cold Chain: `Yes` (`COL`), Parking: `van_only` (`MAL`).
- **Order C (OUT005 Fresh Kollupitiya)**: Weight: `900 kg`, Volume: `4.0 m³`, Cold Chain: `No`, Parking: `Normal`.

### Step-by-Step Solver Execution:
1. **Cluster Evaluation**: All three orders share `depot=PEL`, `brand=Fresh`, `district=Colombo`.
2. **Assign Order A**:
   - Fits reefer constraint (Vehicle is `reefer`).
   - Fits van constraint.
   - Cumulative Weight: `850 kg` $\le 2000\text{ kg}$ (OK).
   - Cumulative Volume: `4.2 m³` $\le 10.0\text{ m³}$ (OK).
   - **Result**: Order A allocated to `Trip 1`. Remaining vehicle capacity: `1,150 kg`, `5.8 m³`.
3. **Assign Order B**:
   - Fits reefer constraint.
   - Fits `van_only` constraint (Vehicle is a `van`).
   - Cumulative Weight: $850 + 600 = 1,450\text{ kg} \le 2000\text{ kg}$ (OK).
   - Cumulative Volume: $4.2 + 3.5 = 7.7\text{ m³} \le 10.0\text{ m³}$ (OK).
   - **Result**: Order B allocated to `Trip 1`. Remaining vehicle capacity: `550 kg`, `2.3 m³`.
4. **Evaluate Order C**:
   - Check Weight: $1,450 + 900 = 2,350\text{ kg} > 2,000\text{ kg}$ (Exceeds capacity by `350 kg`).
   - Check Volume: $7.7 + 4.0 = 11.7\text{ m³} > 10.0\text{ m³}$ (Exceeds capacity by `1.7 m³`).
   - **Result**: Order C rejected for this vehicle. Because no other Peliyagoda vehicles are available in this slot, **Order C is deferred**.
   - `DeferralAuditLog` created: `order_id=C`, `deferral_reason=CAPACITY_EXCEEDED`, `limiting_resource=weight_volume`.
   - Order C priority score increases for tomorrow's run.
