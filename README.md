# ReTrails

Full-stack, offline-first intelligent logistics and retail delivery management platform developed by Team **CurlX** for Tech-Triathlon 2026 (Phase 2 — Hackathon).

---

## 1. Overview

ReTrails is an enterprise delivery management system engineered for multi-brand retail logistics networks in Sri Lanka. Designed for the Waypoint Group, the platform automates the end-to-end supply chain lifecycle from store replenishment order placement through automated vehicle allocation, warehouse bay loading, field delivery execution, and store receipt confirmation.

- **Team**: CurlX
- **Competition**: Tech-Triathlon 2026 — The Intelligent Enterprise (Phase 2 Hackathon)
- **Target Enterprise**: Waypoint Group
- **Platforms**: Responsive Web, Warehouse Bay Tablet, Mobile Field PWA
- **Architecture**: Decoupled Asynchronous API Backend + Local-First PWA

---

## 2. Problem

Waypoint Group coordinates daily distribution across three retail brands (Waypoint Fresh, Waypoint Style, and Waypoint Tech) comprising 120 retail outlets and regional hubs across Sri Lanka. The enterprise faces critical supply chain challenges:

1. **Complex Operational Constraints**: Diverse fleet specifications (refrigerated reefers vs. ambient vans), varying vehicle capacities (weight and volume), restricted driver working hours, fuel quotas, and commercial mall delivery restrictions (e.g., clearance limits for basement bays).
2. **Multi-Brand Friction**: Incompatible brand delivery cadences, distinct special handling rules (cold-chain compliance `COL`, fragile merchandise `FRG`, hazardous items `HAZ`), and shared regional fulfillment centers.
3. **Manual Planning Inefficiencies**: Dispatchers manually planning routes via spreadsheets, leading to sub-optimal vehicle utilization, missed delivery time windows, and unnecessary fuel consumption.
4. **Field Connectivity Blackouts**: Unreliable mobile networks along Sri Lanka's central highway and hill-country corridors (e.g., Kandy, Nuwara Eliya), causing mobile app failures, lost proof-of-delivery records, and dispatch blindness.

---

## 3. Solution

ReTrails addresses these challenges through a unified, offline-first, constraint-driven platform:

- **Constraint-Based Fleet Allocation**: Automated optimization engine leveraging Google OR-Tools CP-SAT and heuristic priority algorithms to produce optimal vehicle assignments and stop sequences in under two seconds.
- **Strict Constraint Enforcement**: Enforces hard constraints for cold chain reefer vehicles, mall van-only access rules (`MAL`), gross vehicle weight and volume caps, and weekly fuel limits.
- **Local-First PWA Field Resilience**: Client-side storage via Dexie.js (IndexedDB) with service worker caching allows drivers and store managers to record deliveries, sign manifests, and log inspections offline with automatic background sync when connectivity resumes.
- **Role-Optimized 4-Tier Interface**: Custom high-contrast design system optimized across command center wide screens, planning desktops, warehouse bay touch tablets, and driver mobile phones.

---

## 4. Key Features

- **Automated Cutoff Management**: Enforces a strict 16:00 operational cutoff for next-day orders with automated transition to allocation processing.
- **Hybrid Optimization Engine**: Google OR-Tools CP-SAT solver for global fleet optimization paired with a priority heuristic fallback for guaranteed sub-second response times.
- **Intelligent Deferral Management**: Automatically identifies unserviceable orders, assigns auditable deferral reason codes (`CAPACITY_EXCEEDED`, `WINDOW_MISSED`), and rolls them over with elevated priority.
- **Reverse-Sequence Loading (LIFO)**: Generates warehouse bay manifests structured in reverse drop order to minimize driver offloading time and prevent cargo shifts.
- **Zero-Data-Loss Offline Sync**: Persistent IndexedDB mutation queue with exponential backoff and server-side idempotent reconciliation.
- **Enterprise Auditability**: Comprehensive event ledger logging status changes, user actors, coordinates, and timestamps in standard UTC.

---

## 5. User Roles

ReTrails implements strict Role-Based Access Control (RBAC) across five enterprise roles:

| Role | Operational Scope | Primary Interfaces | Key Responsibilities |
|---|---|---|---|
| **System Admin** | Global Platform | Admin Console, User Management, Seed Trigger | System configuration, fleet parameters, audit logs, and account lifecycle. |
| **Dispatcher** | Central DC / Hub | Planning Dashboard, Route Map, Fleet Console | Monitor incoming orders, execute daily cutoff, run allocation engine, review deferrals. |
| **Loader** | Warehouse Bay | Bay Station Console, Barcode Checklist | Inspect staging bays, verify cargo pallets against LIFO manifest, record vehicle seal. |
| **Driver** | Field Logistics | Mobile Cockpit, Offline Manifest, POD Screen | Navigate stop sequences, record GPS arrival, capture digital signatures and POD. |
| **Store Manager** | Retail Outlet | Catalog Browser, Order Entry, Receiving Desk | Create replenishment orders, tag handling codes, inspect deliveries, confirm receipt. |

---

## 6. End-to-End Workflow

The operational lifecycle transitions orders through a strict state machine:

```text
Store Manager          Dispatcher              Loader                Driver              Store Manager
+-------------+      +---------------+     +---------------+     +---------------+     +---------------+
| Place Order | ---> | Close Cutoff  |     |               |     |               |     |               |
|  (`draft`   |      |  & Allocate   |     |               |     |               |     |               |
| `submitted`)|      | (`assigned`)  |     |               |     |               |     |               |
+-------------+      +-------+-------+     |               |     |               |     |               |
                             |             |               |     |               |     |               |
                             v             |               |     |               |     |               |
                     +---------------+     |               |     |               |     |               |
                     | Staged in Bay | --> | LIFO Loading  |     |               |     |               |
                     |               |     |  (`loaded`)   |     |               |     |               |
                     +---------------+     +-------+-------+     |               |     |               |
                                                   |             |               |     |               |
                                                   v             |               |     |               |
                                           +---------------+     |               |     |               |
                                           | Vehicle Seal  | --> | Dispatched &  |     |               |
                                           |  Verification |     | Field Delivery|     |               |
                                           +---------------+     | (`in_transit`)|     |               |
                                                                 +-------+-------+     |               |
                                                                         |             |               |
                                                                         v             |               |
                                                                 +---------------+     |               |
                                                                 | Proof of Drop | --> | Inspect &     |
                                                                 | (`delivered`) |     | Confirm Rcpt  |
                                                                 +---------------+     | (`completed`) |
                                                                                       +---------------+
```

---

## 7. System Architecture

The ReTrails stack is built on a clean, decoupled, layered architecture:

```mermaid
graph TD
    Client[Web Browser / Mobile PWA / Bay Tablet] -->|HTTPS / WSS| Nginx[Nginx Reverse Proxy :80 / :443]
    Nginx -->|Static Assets / PWA Service Worker| Frontend[React 18 PWA + Tailwind CSS :5173]
    Frontend -->|IndexedDB Local-First| Dexie[Dexie.js Client Storage & Sync Queue]
    Nginx -->|REST API / JWT Auth| Backend[FastAPI Async Backend :8000]
    Backend -->|SQLAlchemy 2.0 Async| DB[(PostgreSQL 16 Engine :5432)]
    Backend -->|Session / Rate Limiting| Redis[(Redis 7 Cache :6379)]
    Backend -->|Optimization Engine| Solver[Google OR-Tools CP-SAT & Heuristics]
    Backend -->|Compiled HTML| Emails[React Email / Resend REST API]
```

### Component Details
- **Frontend Layer**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, and Dexie.js for local persistence.
- **Backend API**: Python 3.12, FastAPI, SQLAlchemy 2.0 (asyncpg), and Pydantic v2 domain schemas.
- **Data Persistence**: PostgreSQL 16 with check constraints, foreign keys, unique indexes, and audit triggers.
- **Optimization Layer**: Google OR-Tools CP-SAT constraint programming engine with priority heuristic fallback.
- **Dev & Ops**: Multi-container Docker Compose, Nginx, automated bash/PowerShell CLI tooling (`dev.sh`, `dev.ps1`).

---

## 8. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Backend Runtime** | Python | 3.12+ | Asynchronous application execution |
| **Backend Framework** | FastAPI | 0.115+ | High-performance async REST API framework |
| **ORM / Database Access**| SQLAlchemy | 2.0+ (asyncpg) | Asynchronous object-relational mapping |
| **Database** | PostgreSQL | 16-alpine | Enterprise relational storage with ACID guarantees |
| **Optimization** | Google OR-Tools | 9.10+ | CP-SAT constraint programming for vehicle allocation |
| **Cache & Sessions** | Redis | 7.2-alpine | Token revocation, caching, and rate limiting |
| **Frontend Framework** | React | 18.3+ | Single-page application UI library |
| **Build Tool** | Vite | 5.4+ | Lightning-fast ESM bundler and dev server |
| **Styling** | Tailwind CSS | 3.4+ | 4-tier enterprise utility design system |
| **Client Storage** | Dexie.js | 4.0+ | Offline IndexedDB wrapper and sync queue |
| **Maps & Routing** | Leaflet / React-Leaflet | 1.9+ | Interactive vehicle telemetry and route visualization |
| **Emails** | React Email | Latest | Component-driven transactional email templates |
| **Package Managers** | `uv` / `bun` | Latest | High-speed dependency management (Python / Node) |

---

## 9. Prerequisites

To run ReTrails locally or via containers, ensure your machine meets the following requirements:

- **Docker Environment**: Docker Engine 24.0+ and Docker Compose v2.20+ (or Docker Desktop).
- **Native Development (Optional)**:
  - Python 3.10+ with `uv` (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
  - Node.js 18+ and `bun` (`curl -fsSL https://bun.sh/install | bash`)
  - Git 2.30+

---

## 10. Installation

Clone the repository and install all dependencies across the backend, frontend, and email workspace using our automated developer tool:

```bash
# Clone repository
git clone https://github.com/Curl-X-Tech/curlx_retrails.git
cd curlx_retrails

# Install all project dependencies (uv + bun)
./dev.sh install
```

*(On Windows PowerShell, use `.\dev.ps1 install`)*

---

## 11. Environment Configuration

Copy the example environment configuration file:

```bash
cp .env.example .env
```

Key environment configuration variables:

| Variable | Default Value | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | Runtime environment (`development`, `production`, `test`) |
| `DATABASE_URL` | `postgresql+asyncpg://retrails:retrails_dev_pwd@localhost:5432/retrails_db` | Async database connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis caching and rate limiting URI |
| `SECRET_KEY` | *(Generated string)* | JWT signing and cryptographic key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | JWT token validity duration (8 hours) |
| `CORS_ORIGINS` | `["http://localhost:5173","http://localhost:3000"]` | Allowed CORS client origins |

---

## 12. Docker Setup

ReTrails provides full Docker Compose orchestration for one-command startup:

```bash
# Build and launch all services in background
./dev.sh docker:up

# View real-time container logs
./dev.sh docker:logs

# Stop and tear down containers
./dev.sh docker:down
```

### Port Mapping Summary

| Service | Port / URL | Notes |
|---|---|---|
| Frontend Web & PWA | `http://localhost:5173` | React application served via Vite / Nginx |
| Backend API & Docs | `http://localhost:8000/docs` | Interactive Swagger UI API documentation |
| Backend ReDoc | `http://localhost:8000/redoc` | Alternative API reference documentation |
| PostgreSQL Database | `localhost:5432` | Relational database (`retrails_db`) |
| Redis Cache | `localhost:6379` | In-memory cache and session store |
| Email Preview Server | `http://localhost:3001` | React Email template development server |

---

## 13. Database Setup

Database migrations are managed via Alembic. When running with `./dev.sh`, migrations and schemas initialize automatically:

```bash
# Apply pending database migrations
./dev.sh migrate

# Roll back the most recent migration (if needed)
./dev.sh migrate:down
```

---

## 14. Seed Data

To populate the database with realistic enterprise data representing Waypoint Group (brands, master catalogs, 120 retail outlets, vehicles, depots, and sample orders):

```bash
# Execute the database seed pipeline
./dev.sh seed
```

Alternatively, invoke the authenticated admin API endpoint:
```http
POST /api/v1/admin/seed HTTP/1.1
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{"reset": true}
```

---

## 15. User Accounts

The seed script initializes pre-configured enterprise accounts across all operational roles.  
Default password for all seeded accounts: `Password@123`

| Role | Email Address | Assigned Location | Employee Code |
|---|---|---|---|
| **System Admin** | `admin@curlx.tech` | Global Headquarters | `ADM-001` |
| **Dispatcher** | `dispatcher.peliyagoda@example.com` | Peliyagoda DC (`PEL`) | `DSP-PEL-001` |
| **Dispatcher** | `dispatcher.kandy@example.com` | Kandy Regional Hub (`KDY`) | `DSP-KDY-001` |
| **Loader** | `loader.peliyagoda@example.com` | Peliyagoda DC (`PEL`) | `LDR-PEL-001` |
| **Loader** | `loader.kandy@example.com` | Kandy Regional Hub (`KDY`) | `LDR-KDY-001` |
| **Driver** | `driver.peliyagoda@example.com` | Peliyagoda DC (`PEL`) | `DRV-PEL-001` |
| **Driver** | `driver.kandy@example.com` | Kandy Regional Hub (`KDY`) | `DRV-KDY-001` |
| **Store Manager** | `store.fresh@example.com` | Colombo Fresh (`OUT001`) | `MGR-FRESH-001` |
| **Store Manager** | `store.style@example.com` | Kandy City Centre (`OUT081`) | `MGR-STYLE-001` |
| **Store Manager** | `store.tech@example.com` | Negombo Tech (`OUT106`) | `MGR-TECH-001` |

---

## 16. Judge Walkthrough

To verify the working application in under five minutes, follow this sequence:

1. **Step 1: Store Manager Order Placement**
   - Access `http://localhost:5173/login` and log in as `store.fresh@example.com`.
   - Navigate to **Order Entry**, select dairy and ambient goods, and specify a morning delivery window.
   - Note the automatic handling code tag `COL` for refrigerated dairy. Click **Submit Order**.
2. **Step 2: Dispatcher Allocation**
   - Log out and log in as `dispatcher.peliyagoda@example.com`.
   - Open **Operations Center**, view the submitted orders, and trigger **Run Allocation Engine**.
   - Observe the sub-second route generation, capacity balancing, and reefer vehicle matching. Click **Approve Dispatch Plan**.
3. **Step 3: Loader Verification**
   - Switch to `loader.peliyagoda@example.com`.
   - Open **Bay Loading Console** for the scheduled vehicle. Verify items in reverse delivery order (LIFO).
   - Enter vehicle physical seal `SL-99420` and click **Confirm Loading Complete**.
4. **Step 4: Driver Field Delivery & Offline Resilience**
   - Switch to `driver.peliyagoda@example.com`.
   - View assigned route stops. Toggle network to **Offline** in browser DevTools.
   - Record arrival and tap **Confirm Delivery**. Notice instant local persistence in Dexie.js.
   - Toggle network to **Online**. Observe automatic background sync drain within two seconds.
5. **Step 5: Store Manager Receiving Confirmation**
   - Log back into `store.fresh@example.com`.
   - Open **Receiving**, verify delivered quantities, and confirm receipt. Order status transitions to `completed`.

---

## 17. Planning & Allocation

ReTrails incorporates a dual-mode vehicle routing and allocation engine (`backend/app/services/allocation_engine.py`):

1. **Primary Solver (Google OR-Tools CP-SAT)**:
   - Formulates vehicle routing as a Constraint Programming problem.
   - Optimizes multi-objective penalty functions: minimizing total travel distance, maximizing volume/weight load factor, and penalizing deferred orders.
2. **Fallback Solver (Priority Heuristic)**:
   - Greedy bin-packing algorithm sorting orders by priority, delivery window urgency, and volume.
   - Guarantees execution under 500ms even under tight computational constraints.
3. **Operational Cutoff**:
   - The daily cutoff at 16:00 locks order submissions for next-day dispatch.
   - Implemented with PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to prevent race conditions during allocation runs.

---

## 18. Constraint Handling

The platform enforces five critical operational constraints:

| Constraint | Scope | Technical Enforcement | Violation Behavior |
|---|---|---|---|
| **Weight Capacity** | Vehicle | `order_weight <= vehicle.weight_cap_kg` | Reject vehicle assignment; defer or split cargo |
| **Volume Capacity** | Vehicle | `order_volume <= vehicle.volume_cap_m3` | Reject vehicle assignment; defer or split cargo |
| **Cold Chain (`COL`)** | Item / Route | Requires `vehicle.temp == 'reefer'` | Ambients vehicles blocked; must assign reefer |
| **Mall Clearance (`MAL`)**| Outlet | Low ceiling limits; requires `vehicle.type == 'van'`| Trucks barred from allocation to mall outlets |
| **Fuel Quota** | Vehicle | Weekly quota checked against predicted fuel consumption | Vehicle excluded if trip exceeds remaining weekly quota |

---

## 19. Offline Operation

ReTrails provides robust offline support tailored for field drivers and store receiving managers:

- **Local Storage Architecture**: All critical active manifests, route stops, and inventory catalogs are cached in IndexedDB via Dexie.js.
- **Service Worker Caching**: All static application bundles, styling, and map tiles are cached using a Cache-First strategy.
- **Mutation Queue**: Offline actions (e.g., arrival pings, signature captures, inspection notes) are recorded in a local sync queue table.
- **Automatic Sync Drain**: A background synchronization worker detects the `window.online` event and flushes pending mutations to `POST /api/v1/sync/drain`.
- **Conflict Resolution**: Server-side timestamps and PostgreSQL row versions guarantee deterministic, idempotent resolution.

---

## 20. Designathon → Hackathon Changes

| Area | Designathon Prototype | Hackathon Implementation | Architectural Rationale |
|---|---|---|---|
| **Role Architecture** | 4 static conceptual screens | 5 distinct roles with strict JWT RBAC | Added `system_admin` for security and fleet parameter management |
| **Planning Engine** | Simulated mock routes | Google OR-Tools CP-SAT + Heuristic Solver | Production-grade constraint programming for real-world route generation |
| **Offline Architecture**| Conceptual indicator | Full Dexie.js IndexedDB sync engine | Zero data loss for mobile drivers in connectivity blackouts |
| **Database** | None (static JSON) | PostgreSQL 16 with SQLAlchemy 2.0 async | Strict relational integrity, foreign keys, and audit triggers |
| **Design System** | Unconstrained styling | 4-Tier Enterprise Responsive System | Strict viewport optimization across 4K, Desktop, Tablet, and Mobile |

---

## 21. Testing

ReTrails includes automated test suites covering unit logic, integration endpoints, and constraint solvers:

```bash
# Run the complete test suite
./dev.sh test

# Run tests with code coverage report
./dev.sh test:coverage

# Run static typechecking across backend and frontend
./dev.sh typecheck

# Run linters and formatting checks
./dev.sh check
```

Key test coverage areas:
- `backend/tests/test_allocation.py`: OR-Tools solver constraints, capacity overflow, and reefer compatibility.
- `backend/tests/test_auth.py`: JWT authentication, password hashing, and role permission guards.
- `backend/tests/test_orders.py`: Order state transitions, cutoff enforcement, and receiving confirmation.

---

## 22. Known Limitations

- **Simulated GPS Telemetry**: Real-world vehicle GPS telemetry is currently simulated via mock coordinates along major Sri Lankan transit corridors.
- **Single Depot Optimization**: Multi-depot routing is modeled through regional hub partitioning rather than concurrent cross-depot load exchange.
- **Physical Barcode Hardware**: Barcode scanning uses camera stream emulation and manual entry fallback rather than proprietary laser scan drivers.

---

## 23. AI Tool Disclosure

Development of ReTrails utilized AI developer tools strictly in accordance with competition regulations:
- **Tools Used**: Antigravity IDE (Gemini and Claude models).
- **Scope of Use**: Boilerplate code scaffolding, test case generation, CSS layout refinement, and documentation drafting.
- **Verification**: 100% of generated code and architectural designs were reviewed, refactored, and verified by human team members. Complete details are documented in [`docs/ai-disclosure.md`](file:///d:/projects/curlx_retrails/docs/ai-disclosure.md).

---

## 24. Demo Video

A comprehensive 5–8 minute video demonstration showcasing the working application, all four roles, constraint handling, and offline recovery:

- **Demo Video URL**: `[TO BE COMPLETED]`
- **Demo Plan & Spoken Script**: Available in [`docs/15-demo-plan-and-script.md`](file:///d:/projects/curlx_retrails/docs/15-demo-plan-and-script.md)

---

## 25. Repository

The complete source code, documentation, and configuration files are organized in the project repository:

```text
curlx_retrails/
├── backend/                     # Unified FastAPI async backend (Python / uv)
│   ├── app/
│   │   ├── core/                # Database configuration, security, and timezone
│   │   ├── entities/            # SQLAlchemy 2.0 ORM models
│   │   ├── guards/              # Role-based authorization dependencies
│   │   ├── routers/             # API v1 route controllers
│   │   ├── schemas/             # Pydantic validation schemas
│   │   └── services/            # Business logic and Allocation Engine
│   └── tests/                   # Backend pytest test suite
├── frontend/                    # React PWA frontend (TypeScript / bun)
│   ├── src/
│   │   ├── api/                 # API client and query hooks
│   │   ├── components/          # 4-tier responsive UI components
│   │   ├── db/                  # Dexie.js offline schema and repositories
│   │   ├── features/            # Role-specific business features
│   │   └── pages/               # Enterprise dashboard pages
│   └── Dockerfile
├── packages/emails/             # React Email transactional templates (bun)
├── docs/                        # Complete judge documentation package (16 docs)
│   ├── 01-system-overview.md
│   ├── 02-requirements-traceability.md
│   ├── 03-system-architecture.md
│   ├── 04-data-model.md
│   ├── 05-functional-requirements.md
│   ├── 06-planning-and-allocation.md
│   ├── 07-offline-and-recovery.md
│   ├── 08-designathon-continuity.md
│   ├── 09-ui-documentation.md
│   ├── 10-api-documentation.md
│   ├── 11-database-documentation.md
│   ├── 12-testing.md
│   ├── 13-engineering-quality.md
│   ├── 14-security.md
│   ├── 15-demo-plan-and-script.md
│   ├── 16-submission-checklist.md
│   ├── ai-disclosure.md
│   └── schema/schema.sql        # Canonical PostgreSQL DDL schema
├── docker-compose.yml           # Full-stack container deployment
├── docker-compose.prod.yml      # Production HTTPS deployment
├── dev.sh / dev.ps1             # Developer automation scripts
└── README.md                    # Master Hackathon Documentation
```

---

## License

MIT © 2026 Team CurlX
