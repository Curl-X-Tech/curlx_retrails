# ReTrails Backend

Unified FastAPI application consolidating orders, outlets, routes, vehicles, dispatch management, and the hybrid fleet allocation engine (OR-Tools CP-SAT and heuristic strategies).

## Docker Engine Deployment

The root Compose file `docker-compose.yml` runs the complete stack.

### Prerequisites

- Docker Desktop or Docker Engine with Compose plugin installed and daemon running.
- A shell that can run `docker compose` from the repository root.

### Start the Stack

From repository root:

```bash
docker compose -f docker-compose.yml up -d --build
```

Endpoints after startup:

- Backend API & Docs: http://localhost:8000/docs
- PostgreSQL: `localhost:5432` (`retrails_db`)
- Redis: `localhost:6379`
- pgAdmin 4 Web UI: http://localhost:5050

Check container status and logs:

```bash
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs -f
```

### Stop the Stack

```bash
docker compose -f docker-compose.yml down
```

To also remove persistent volumes:

```bash
docker compose -f docker-compose.yml down -v
```

## Local Backend Development

Install dependencies and start backend locally:

```bash
./dev.sh backend
```

Or directly via `uv`:

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Database Seeding

The database seed uses hierarchical master data and procedural domain service pipelines:

```bash
./dev.sh seed
# Or manually in backend:
uv run python -m app.db.seed
```

You can also trigger procedural seeding via the authenticated API:
- `POST /api/v1/admin/seed` (requires `system_admin` role, optional `{"reset": true}`).

### Default Test Accounts

All accounts use password `Password@123`.

- **Admin**: `admin@curlx.tech`
- **Peliyagoda Dispatcher**: `dispatcher.peliyagoda@example.com`
- **Kandy Dispatcher**: `dispatcher.kandy@example.com`
- **Peliyagoda Loader**: `loader.peliyagoda@example.com`
- **Kandy Loader**: `loader.kandy@example.com`
- **Peliyagoda Driver**: `driver.peliyagoda@example.com`
- **Kandy Driver**: `driver.kandy@example.com`
- **Store Managers**: `store.fresh@example.com` (Colombo), `store.style@example.com` (Kandy), `store.tech@example.com` (Negombo)


