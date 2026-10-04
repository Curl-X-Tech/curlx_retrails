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

