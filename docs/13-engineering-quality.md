# Engineering Quality

**Project**: ReTrails — Team CurlX

---

## 1. Code Organization

### Backend (`backend/app/`)

The backend follows a layered, domain-separated structure:

| Layer | Directory | Responsibility |
|---|---|---|
| Entry point | `main.py` | FastAPI app factory, lifespan, CORS middleware |
| Routers | `routers/` | One file per domain: allocations, deliveries, driver_route, fleet, loader, store_orders, sync, telemetry, uploads, auth_refresh, and a master/ sub-package |
| Services | `services/` | Business logic: allocation engine, checklist, deferrals, deliveries, email, manual_allocation, orders, storage, trip_views |
| Entities | `entities/` | SQLAlchemy 2.0 ORM models; one file per aggregate root |
| Schemas | `schemas/` | Pydantic v2 request/response models |
| Guards | `guards/` | Role authorization and rate limiting |
| Core | `core/` | Configuration, database session, timezone utilities |
| DB | `db/` | Seed engine, seed data, seed operations |

File length target: 300 lines. Most router and service files stay within this limit. Seed files and mock data files are exempt.

### Frontend (`frontend/src/`)

| Layer | Directory | Responsibility |
|---|---|---|
| Pages | `pages/<role>/` | Role-scoped pages (thin, hook-only, no direct data imports) |
| API | `api/<domain>/` | TanStack Query hooks, API call functions, endpoint constants, mock adapters |
| Features | `features/` | Encapsulated feature modules with components, hooks, and state |
| Components | `components/ui/` | Custom UI component library (never overwritten by CLI presets) |
| Components | `components/shared/` | Shared layout and composite components |
| Sync | `sync/` | Offline sync engine: engine, drain, queue, backoff |
| Types | `types/` | Shared TypeScript interfaces and domain types |
| Data | `data/` | Static mock datasets (not imported by pages) |

API endpoint strings are centralized in `api/endpoints.ts`. No path strings appear outside this file.

---

## 2. Modularity

### Backend

- The allocation engine (`services/allocation/`) is isolated from the router layer. The router (`routers/allocations.py`) calls `run_allocation_engine()`, which calls the solver interface. Solver implementations (`heuristic_solver.py`, `ortools_solver.py`) implement `BaseAllocationSolver.solve()`.
- The `trip_views.py` service computes all projection and read views from a `TripContext` dataclass, keeping router files thin.
- `dispatcher_scope.py` centralizes the depot-scoping filter logic used by multiple routers.

### Frontend

- Dexie operations are encapsulated in repository files (`src/db/` or `src/api/<domain>/mock.ts`). Pages never import from `src/data/` directly.
- The sync engine is a standalone module: `engine.ts` manages lifecycle, `drain.ts` manages the drain loop, `queue.ts` manages Dexie table operations.

---

## 3. Error Handling

### Backend

- All route handlers use `HTTPException` with specific `detail` codes (e.g. `ORDER_NOT_FOUND`, `TRIP_NOT_LOADING`) rather than generic messages.
- The allocation engine uses a try/except around the solver call; on failure, `SOLVER_STATE` is set to `failed` before re-raising.
- The lifespan context catches `SQLAlchemyError` and `OSError` on startup and logs a warning rather than crashing, enabling fallback mode.
- Pydantic validation errors return 422 with field-level detail.

### Frontend

- TanStack Query surfaces API errors through `useQuery` and `useMutation` error states.
- The sync drain catches HTTP errors and categorizes them as retryable or permanently failed.
- The sync engine exposes `lastError` through the Zustand store so error state is visible in the UI.

---

## 4. Logging

- `logging.basicConfig(level=logging.INFO)` is configured in `main.py`.
- Startup events (database initialization success/failure) are logged at INFO/WARNING level.
- The seed engine logs counts per entity type.
- Allocation engine execution time and order counts are logged per run.
- Production environments should configure structured logging (e.g. JSON format) by overriding the log format in the deployment environment.

---

## 5. Validation

### Backend

- Pydantic v2 models validate all incoming request bodies with type coercion and field constraints.
- PostgreSQL CHECK constraints provide database-level enforcement for all status fields, type enumerations, and range constraints.
- Role guards validate the authenticated user's role before any endpoint handler runs.
- Rate limiting counters prevent abuse of auth endpoints.

### Frontend

- TypeScript strict types prevent type mismatches at compile time.
- Form validation is handled by controlled components with inline error display.
- The sync queue validates mutation schemas using Pydantic on the server before applying them.

---

## 6. Maintainability

- Conventional Commits prefix discipline on all commit messages.
- `./dev.sh check` runs ruff (linting + formatting), TypeScript type-checking, and pytest before any commit.
- Rules documented in `AGENTS.md` ensure AI-assisted contributions follow the same standards.
- The Graphify knowledge graph (`graphify-out/graph.json`) is maintained as a navigable code map for architectural queries.
- Mock data is separated from component files (`src/data/`), keeping component files focused.

---

## 7. Reusability

- `BaseAllocationSolver` defines the interface contract. New solver strategies can be added by implementing `solve(orders, vehicles) -> SolverResult`.
- `TripContext` and `trip_views.py` provide a single projection layer used by the allocations, loader, driver, and deliveries routers.
- `RoleGuard` is parameterized: `RoleGuard(RoleType.DISPATCHER, RoleType.LOADER)` generates a guard accepting either role without duplicating code.
- The sync drain (`drain.ts`) is reusable: any mutation type can be added to the queue and dispatched to the matching handler.

---

## 8. Performance

- All database queries use SQLAlchemy async ORM with `asyncpg`, avoiding blocking I/O.
- The `v_trip_payload_summary` and `v_customer_order_summary` views aggregate data at query time with indexed base tables.
- Allocation engine execution time is measured and returned in the API response (`execution_time_ms`).
- The sync batch endpoint processes up to 20 mutations per HTTP call, reducing round-trip overhead.
- Frontend TanStack Query caches API responses and deduplicates concurrent requests.
- Not formally evaluated: load testing, query plan analysis, and throughput benchmarking under concurrent users have not been conducted.

---

## 9. Security

See `docs/14-security.md` for full security documentation.

Summary:
- argon2 password hashing
- JWT with configurable expiry
- Role-based guards on all endpoints
- Rate limiting on auth endpoints
- CORS with explicit origin whitelist
- Parameterized SQL via SQLAlchemy ORM (no SQL injection surface)
- Secrets via environment variables, never committed

---

## 10. Scalability

- The FastAPI application is stateless; horizontal scaling via multiple Uvicorn workers or multiple container replicas is architecturally possible.
- The allocation engine is CPU-bound during solver execution. Running it as a background task (via APScheduler or Celery) isolates it from the request/response path. The current implementation runs the engine synchronously within the route handler.
- PostgreSQL is the single source of truth; all scaling paths go through the database.
- Not formally evaluated: database connection pooling limits, maximum concurrent users, and solver execution time under peak order volumes.

---

## 11. Dev Automation Scripts

All development tasks are executed through `./dev.sh` (Linux/Mac) or `./dev.ps1` (Windows):

| Command | Action |
|---|---|
| `./dev.sh install` | Install all dependencies (backend uv sync, frontend bun install) |
| `./dev.sh dev` | Start backend and frontend concurrently |
| `./dev.sh backend` | FastAPI on port 8000 |
| `./dev.sh frontend` | React on port 5173 |
| `./dev.sh seed` | Seed database with master data |
| `./dev.sh check` | Lint + format + typecheck + test (pre-commit gate) |
| `./dev.sh test` | pytest only |
| `./dev.sh lint` | ruff lint |
| `./dev.sh format` | ruff format |
| `./dev.sh typecheck` | TypeScript tsc |
| `./dev.sh docker:up` | docker compose up --build |
| `./dev.sh docker:down` | docker compose down |
| `./dev.sh graphify` | Update Graphify knowledge graph |
