# System Overview

**Project**: ReTrails
**Team**: CurlX
**Competition**: Tech-Triathlon 2026 — The Intelligent Enterprise, Phase 2 (Hackathon)
**Client domain**: Waypoint Group

---

## 1. What the System Does

ReTrails is a responsive, offline-capable Progressive Web Application (PWA) that manages the complete end-to-end delivery operation for Waypoint Group across three retail brands:

- **Waypoint Fresh** — 80 outlets, chilled cold-chain deliveries, strict early-morning window (03:30-08:00).
- **Waypoint Style** — 25 outlets, fashion retail, standard retail trading window.
- **Waypoint Tech** — 15 outlets, consumer electronics, standard retail trading window.

The system covers the full operational cycle from order placement to confirmed receipt, including fleet allocation, warehouse loading, field delivery, offline driver operation, and discrepancy handling.

---

## 2. Problem Statement

Waypoint Group operates a high-volume multi-brand distribution business across 12 districts in the Western and Central Provinces of Sri Lanka, served from two depots:

| Depot | Code | Role |
|---|---|---|
| Peliyagoda Distribution Center | PEL | Primary hub - Western Province |
| Kandy Regional Hub | KDY | Hill country and Central Province |

The operational challenges that ReTrails addresses:

- Orders arrive from 120 outlets and must be manually planned and allocated to a 60-vehicle fleet each day.
- Vehicles have weight and volume capacity limits, cold-chain requirements, van-only outlet access restrictions, and a maximum of two trips per day.
- Drivers operate in areas with unreliable mobile connectivity (especially the Kandy corridor and hill-country routes), requiring offline field capability.
- Planning must account for delivery time windows (Fresh outlets: 03:30-08:00), service time allowances at each stop type, and daily time budgets per vehicle.
- Orders that cannot be served on a given day must be deferred with an audit record, and consecutive deferrals must be prevented.

---

## 3. Solution

ReTrails provides four role-specific interfaces backed by a single unified FastAPI service:

| Role | Interface focus |
|---|---|
| Store Manager | Place orders, view order status, view deferral notices, confirm delivery receipt |
| Dispatcher | Review and close orders, run the allocation engine, manage trips, monitor fleet |
| Loader | Execute loading checklist by bay, verify items, seal waypoints, confirm departure |
| Driver | View assigned trip and stop sequence, record arrivals, submit proof of delivery, operate offline |

The allocation engine (heuristic solver with optional OR-Tools CP-SAT backend) automatically groups orders by brand and district, selects the best-fit vehicle respecting all feasibility rules, and produces a set of planned trips with sequenced route legs.

Offline capability is provided by Dexie.js (IndexedDB) with a queued mutation engine. When a driver loses connectivity, field actions (arrival confirmation, POD submission, discrepancy reports, GPS telemetry) are stored locally and automatically drained to the backend when connectivity returns.

---

## 4. Architecture Summary

```
Browser / Mobile PWA (React + TypeScript + Tailwind CSS)
         |
         |--- IndexedDB (Dexie.js)  <-- offline local state
         |--- Sync Queue Engine     <-- drains mutations on reconnect
         |
         | HTTPS / REST + JWT
         v
FastAPI Backend  (port 8000)
         |
         |--- SQLAlchemy 2.0 async ORM
         |--- Allocation Engine (heuristic + OR-Tools CP-SAT)
         |--- Auth: fastapi-users with argon2 password hashing
         |--- Rate limiting: token bucket guards per endpoint
         |
         v
PostgreSQL 16  (port 5432)        Redis 7  (port 6379)
         |
         |--- MinIO Object Storage  (port 9000, S3-compatible)
```

---

## 5. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend framework | FastAPI | 0.115+ |
| ORM | SQLAlchemy (async) | 2.0+ |
| Database | PostgreSQL | 16 |
| Database fallback | SQLite (aiosqlite) | available |
| Auth | fastapi-users | 15.0+ |
| Password hashing | argon2 (pwdlib) | standard |
| Allocation engine | Google OR-Tools CP-SAT + Heuristic solver | 9.10+ |
| Cache | Redis | 7 |
| Object storage | MinIO (S3-compatible) | latest |
| Email | React Email + Resend REST API | latest |
| Frontend framework | React | 18 |
| Language | TypeScript | 5+ |
| Build tool | Vite | 5+ |
| CSS | Tailwind CSS | 3.4+ |
| Offline storage | Dexie.js (IndexedDB) | 3+ |
| Maps | Leaflet + react-leaflet | standard |
| HTTP client | TanStack Query + Axios | standard |
| PWA | vite-plugin-pwa | standard |
| Backend package manager | uv | latest |
| Frontend package manager | bun | latest |
| Container runtime | Docker + Docker Compose v2 | standard |
| Reverse proxy (prod) | Nginx | standard |

---

## 6. Deployment Topology

| Service | Port | Description |
|---|---|---|
| Frontend (React PWA) | 5173 | React Vite dev / Nginx in container |
| Backend API | 8000 | FastAPI -- /api/v1, docs at /docs |
| PostgreSQL | 5432 | Relational database (retrails_db) |
| Redis | 6379 | Cache and session store |
| MinIO API | 9000 | S3-compatible object storage |
| MinIO Console | 9001 | Web management UI |
| pgAdmin 4 | 5050 | PostgreSQL web admin |

---

## 7. Repository Structure

```
curlx_retrails/
- backend/                     FastAPI application (uv)
  - app/
    - core/                Config, database connection, timezone utils
    - db/                  Seed engine and fixture data
    - entities/            SQLAlchemy 2.0 ORM models
    - enums/               Role and status enumerations
    - guards/              Role authorization and rate limiting
    - models/              Domain data structures (non-ORM)
    - routers/             API v1 route handlers (one file per domain)
    - schemas/             Pydantic v2 request/response schemas
    - services/            Business logic: allocation engine, delivery, sync
  - tests/                   pytest test suite
  - Dockerfile
  - pyproject.toml
- frontend/                    React PWA (bun)
  - src/
    - api/                 API client, endpoints, domain hooks
    - components/          UI component library and shared layouts
    - data/                Static mock datasets
    - features/            Feature-level modules
    - pages/               Role-based dashboard pages
    - routes/              React Router configuration
    - sync/                Offline sync queue engine
    - types/               Shared TypeScript domain types
  - Dockerfile
  - package.json
- packages/emails/             React Email transactional templates (bun)
- docs/                        Hackathon documentation package
  - 01-system-overview.md
  - 02-requirements-traceability.md
  - 03-system-architecture.md
  - 04-data-model.md
  - 05-functional-requirements.md
  - 06-planning-and-allocation.md
  - 07-offline-and-recovery.md
  - 08-designathon-continuity.md
  - 09-ui-documentation.md
  - 10-api-documentation.md
  - 11-database-documentation.md
  - 12-testing.md
  - 13-engineering-quality.md
  - 14-security.md
  - 15-demo-plan-and-script.md
  - 16-submission-checklist.md
  - ai-disclosure.md
  - schema/schema.sql        Master PostgreSQL schema
- docker-compose.yml           Full-stack container deployment
- docker-compose.prod.yml      Production HTTPS with Nginx + Let's Encrypt
- .env.example                 Environment variables template
- dev.sh / dev.ps1             Cross-platform dev automation scripts
```

---

## 8. Documentation Package Index

| Document | Purpose |
|---|---|
| [`01-system-overview.md`](file:///d:/projects/curlx_retrails/docs/01-system-overview.md) | High-level system overview, problem statement, architecture, tech stack, and deployment. |
| [`02-requirements-traceability.md`](file:///d:/projects/curlx_retrails/docs/02-requirements-traceability.md) | Full traceability matrix mapping Designathon elements to Hackathon implementation and departure justifications. |
| [`03-system-architecture.md`](file:///d:/projects/curlx_retrails/docs/03-system-architecture.md) | Decoupled architecture, backend/frontend internals, sync queue design, and deployment topology. |
| [`04-data-model.md`](file:///d:/projects/curlx_retrails/docs/04-data-model.md) | Complete PostgreSQL relational data model, ER diagram, entities, and constraint definitions. |
| [`05-functional-requirements.md`](file:///d:/projects/curlx_retrails/docs/05-functional-requirements.md) | Structured functional requirements across Store Manager, Dispatcher, Loader, and Driver roles. |
| [`06-planning-and-allocation.md`](file:///d:/projects/curlx_retrails/docs/06-planning-and-allocation.md) | Dual-mode fleet allocation engine, Google OR-Tools CP-SAT formulation, cutoff locks, and deferrals. |
| [`07-offline-and-recovery.md`](file:///d:/projects/curlx_retrails/docs/07-offline-and-recovery.md) | Local-first PWA architecture, Dexie IndexedDB sync queue, conflict resolution, and crash recovery. |
| [`08-designathon-continuity.md`](file:///d:/projects/curlx_retrails/docs/08-designathon-continuity.md) | Alignment with Designathon prototype, preserved concepts, and technical evolution rationale. |
| [`09-ui-documentation.md`](file:///d:/projects/curlx_retrails/docs/09-ui-documentation.md) | Detailed UI documentation for all role screens, responsive layouts, interactions, and offline states. |
| [`10-api-documentation.md`](file:///d:/projects/curlx_retrails/docs/10-api-documentation.md) | Exhaustive REST API endpoint catalog, payload contracts, authentication, and HTTP status codes. |
| [`11-database-documentation.md`](file:///d:/projects/curlx_retrails/docs/11-database-documentation.md) | Database engine specs, index strategies, triggers, view definitions, and performance tuning. |
| [`12-testing.md`](file:///d:/projects/curlx_retrails/docs/12-testing.md) | Testing strategy, pytest test suites, constraint verification cases, and execution commands. |
| [`13-engineering-quality.md`](file:///d:/projects/curlx_retrails/docs/13-engineering-quality.md) | Code organization, modularity standards, error handling patterns, logging, and validation. |
| [`14-security.md`](file:///d:/projects/curlx_retrails/docs/14-security.md) | JWT authentication, RBAC authorization matrix, rate limiting, and secret management. |
| [`15-demo-plan-and-script.md`](file:///d:/projects/curlx_retrails/docs/15-demo-plan-and-script.md) | 5–8 minute competition demo plan, minute-by-minute action table, spoken narration script, and judge rubric. |
| [`16-submission-checklist.md`](file:///d:/projects/curlx_retrails/docs/16-submission-checklist.md) | Master hackathon submission checklist covering application, repository, deployment, and demo. |
| [`ai-disclosure.md`](file:///d:/projects/curlx_retrails/docs/ai-disclosure.md) | Ethical AI tool disclosure statement detailing tools used, operational scope, and verification steps. |
