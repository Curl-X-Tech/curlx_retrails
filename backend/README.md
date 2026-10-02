# ReTrails Backend

The backend follows a service-based architecture consisting of 2 core services:

1. **`core_service`** (Port `8000`, Database `general_db`):
   Unified FastAPI application consolidating orders, outlets, routes, vehicles, and dispatch management.
2. **`planning_service`** (Port `8005`, Database `planning_db`):
   Algorithmic solution finder and optimization engine running heuristic and OR-Tools CP-SAT solvers backed by Celery and Redis.

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

- Core Service API & Docs: http://localhost:8000/docs
- Planning Engine API & Docs: http://localhost:8005/docs
- PostgreSQL: `localhost:5432` (`general_db`, `planning_db`)
- Redis: `localhost:6379`
- RabbitMQ Management UI: http://localhost:15672 (`waypoint`/`waypoint`)
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

Install dependencies and start `core_service` locally:

```bash
cd backend/core_service
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Start `planning_service` locally:

```bash
cd backend/planning_service
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8005
```

Or run dev orchestration via `./dev.sh backend` or `./dev.ps1 backend`.
