# ReTrails

Delivery management system for Waypoint Group (Sri Lankan retail group with 120 outlets, 60 vehicles, and 2 depots in Peliyagoda and Kandy) connecting four operational roles: Dispatcher, Loader, Driver, and Store Manager.

- **Team**: CurlX
- **Solution Name**: ReTrails
- **Tech Stack**: React 18 (TypeScript, Tailwind CSS, Dexie.js) frontend, FastAPI (Python 3.11, SQLAlchemy 2.0 async, Google OR-Tools) backend, PostgreSQL 16 database, Redis 7 cache, Docker Compose containerization.
- **Deployed URL**: [TODO: Enter production or staging URL here]
- **Walkthrough / Demo Video**: https://youtu.be/8gw-0D5bURs

---

## Setup and Running

1. **Clone and enter repository**:
   ```bash
   git clone https://github.com/Curl-X-Tech/curlx_retrails.git
   cd curlx_retrails
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

3. **Start services with Docker Compose**:
   ```bash
   docker compose up -d
   ```

### URLs and Ports

| Service | URL / Port | Description |
|---|---|---|
| Frontend Web App & PWA | `http://localhost:5173` | React single-page application |
| Backend API & Docs | `http://localhost:8000/docs` | FastAPI Swagger OpenAPI UI |
| Backend Health Check | `http://localhost:8000/health` | Container health probe |
| PostgreSQL Database | `localhost:5432` | Relational database (`retrails_db`) |
| Redis Cache | `localhost:6379` | Rate limiting and session cache |
| pgAdmin 4 (Optional) | `http://localhost:5050` | Database management UI (`admin@example.com` / `changeme`) |

---

## Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `ENVIRONMENT` | `local` | Application runtime environment (`local`, `production`, `test`) |
| `DATABASE_URL` | `postgresql+asyncpg://waypoint:waypoint@postgres:5432/retrails_db` | Asynchronous PostgreSQL connection string |
| `SECRET_KEY` | `dev-secret-key-super-secure-waypoint-curlx` | Secret key used for signing JWT authentication tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `11520` | Access token validity duration in minutes (8 days) |
| `POSTGRES_USER` | `waypoint` | PostgreSQL database username |
| `POSTGRES_PASSWORD` | `waypoint` | PostgreSQL database password |
| `POSTGRES_DB` | `retrails_db` | Primary database catalog name |
| `REDIS_URL` | `redis://redis:6379/0` | In-memory cache and rate limiter connection string |
| `STORAGE_BACKEND` | `local` | Proof-of-delivery storage engine (`local` or `s3`) |

---

## Seeded Accounts

All accounts share the default password: `Password@123`

| Role | Username / Email | Password | Location / Assignment |
|---|---|---|---|
| System Admin | `admin@curlx.tech` | `Password@123` | Headquarters (Global) |
| Dispatcher | `dispatcher.peliyagoda@example.com` | `Password@123` | Peliyagoda DC (`PEL`) |
| Dispatcher | `dispatcher.kandy@example.com` | `Password@123` | Kandy Regional Hub (`KDY`) |
| Loader | `loader.peliyagoda@example.com` | `Password@123` | Peliyagoda DC Bay Station |
| Loader | `loader.kandy@example.com` | `Password@123` | Kandy Hub Bay Station |
| Driver | `driver.peliyagoda@example.com` | `Password@123` | Peliyagoda Route Fleet |
| Driver | `driver.kandy@example.com` | `Password@123` | Kandy Route Fleet |
| Store Manager | `store.fresh@example.com` | `Password@123` | Waypoint Fresh (Colombo 03) |
| Store Manager | `store.style@example.com` | `Password@123` | Waypoint Style (KCC, Kandy) |
| Store Manager | `store.tech@example.com` | `Password@123` | Waypoint Tech (Negombo) |

---

## Numbered Judge Walkthrough

Follow this step-by-step walkthrough across all four roles, including normal operations, over-capacity deferrals, and offline failure recovery.

### Step 1: Store Manager - Create Replenishment Order
- **Role**: Store Manager (`store.fresh@example.com`)
- **Screen**: Store Dashboard & Order Entry (`/store-manager/orders/new`)
- **Action**: Log in, select items across Brand Fresh categories (ambient and dairy), set delivery window to `08:00 - 11:00`, and click **Submit Order**.
- **Expected Result**: Items tagged with cold-chain requirements automatically receive the `COL` handling flag. The order status updates to `submitted` for the next daily cutoff.

### Step 2: Dispatcher - Planning & Fleet Allocation
- **Role**: Dispatcher (`dispatcher.peliyagoda@example.com`)
- **Screen**: Dispatcher Operations Console (`/dispatcher`)
- **Action**: Select operating date, review pending orders for the Peliyagoda DC, and click **Run Allocation Engine**.
- **Expected Result**: Google OR-Tools CP-SAT solver assigns feasible orders to vehicles satisfying volume, weight, reefer compatibility, mall clearance (`MAL`), and home depot constraints. Trips transition to `scheduled`.

### Step 3: Dispatcher - Over-Capacity Day with Deferrals
- **Role**: Dispatcher (`dispatcher.peliyagoda@example.com`)
- **Screen**: Deferrals Management (`/dispatcher/deferrals`)
- **Action**: Simulate a high-volume demand surge day where total order demand exceeds available fleet weight/volume or time limits, and run allocation.
- **Expected Result**: Excess orders that exceed fleet limits or driver time budgets are automatically deferred with explicit reason codes (`CAPACITY_EXCEEDED`, `TIME_BUDGET_LIMIT`, `INSUFFICIENT_REEFER`). The deferral audit log records each skipped order and elevates its priority for next-day dispatch.

### Step 4: Loader - Staging & Reverse-Drop Bay Loading
- **Role**: Loader (`loader.peliyagoda@example.com`)
- **Screen**: Warehouse Bay Station (`/loader/bays`)
- **Action**: Select scheduled trip vehicle, inspect staged pallets organized in reverse delivery order (LIFO), check off items, enter seal number `SL-88412`, and click **Confirm Loaded**.
- **Expected Result**: Loading checklist enforces LIFO packing order so the first drop is at the rear doors. Vehicle seal is persisted, and trip status updates to `loaded`.

### Step 5: Driver - Field Delivery & Offline / Failure Scenario
- **Role**: Driver (`driver.peliyagoda@example.com`)
- **Screen**: Driver Mobile Manifest (`/driver/active-trip`)
- **Action**: Open assigned trip. In browser DevTools, switch Network to **Offline** (simulating connectivity loss in hill-country corridors). Record waypoint arrival, enter recipient name, capture digital signature, and submit POD. Then toggle network back to **Online**.
- **Expected Result**: While offline, delivery mutation is saved instantly to local IndexedDB (`sync_queue`) with a visual offline status banner. When reconnected, the background sync engine drains the queue to `POST /api/v1/sync/batch` and marks the route leg completed without data loss.

### Step 6: Store Manager - Receipt Confirmation & Discrepancies
- **Role**: Store Manager (`store.fresh@example.com`)
- **Screen**: Receiving Console (`/store-manager/receiving`)
- **Action**: Open incoming delivery notification, inspect delivered quantities against ordered manifest, sign receipt, and click **Confirm Receipt**.
- **Expected Result**: Order transitions to `completed`. If damaged goods are reported, a `discrepancy_report` record is logged with item SKU, shortage quantity, and audit timestamp.

---

## Significant Departures from Day 5 Design

| Day 5 Design | What Was Built | Reason |
|---|---|---|
| 4 static conceptual roles | 5 enterprise roles with strict JWT RBAC (added `system_admin`) | Needed administrative capabilities for fleet provisioning, operational calendar management, and seed execution without compromising operational role boundaries. |
| Simulated mock route planning | Dual-engine solver: Google OR-Tools CP-SAT + Heuristic fallback | Real-world constraints (reefer requirements, low-clearance mall bays, multi-stop time budgets, 2-trip caps) require mathematical constraint programming. |
| Conceptual offline badge | Local-first Dexie.js (IndexedDB) sync engine with idempotent replay | Field connectivity drops on central Sri Lankan transit routes require guaranteed zero-data-loss and background queue draining. |
| Static JSON mock storage | PostgreSQL 16 with SQLAlchemy 2.0 async and foreign key cascades | Real multi-brand logistics requires strict relational consistency, check constraints, temporal price lists, and audit trails. |
| Ad-hoc CSS styles | 4-Tier Enterprise Responsive Layout System | Seamless usability across wide command center displays (1440px+), desktop planning (1024px), warehouse tablets (600px), and mobile driver phones (320px). |

---

## Known Limitations

1. **Simulated GPS Coordinates**: Real-world vehicle GPS telemetry is currently simulated through predefined Sri Lankan highway route coordinate sequences rather than physical OBD-II/CAN-bus hardware.
2. **Barcode Scanner Integration**: Warehouse bay pallet verification uses camera stream emulation and keyboard wedge input rather than proprietary warehouse laser scan gun drivers.
3. **Single Depot Optimization per Run**: Cross-depot dynamic load exchange is handled via sequential depot runs rather than concurrent multi-depot fleet swapping.
4. **Third-Party Map Tiles**: Map visualization relies on online OpenStreetMap / Carto tile servers; offline map rendering is limited to cached tiles.
