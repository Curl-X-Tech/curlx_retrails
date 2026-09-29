# ReTrails Backend

The backend services are containerized with Docker. The repository-level
Compose file is the deployment entry point and must be run from the repository
root, not from this directory.

## Docker Engine deployment

### Prerequisites

- Docker Desktop or Docker Engine with the Compose v2 plugin installed.
- The Docker daemon must be running.
- A shell that can run `docker compose` from the repository root.

Check the installation before starting:

```bash
docker version
docker compose version
```

### Start the stack

From `d:\projects\curlx_retrails` (or the equivalent repository root):

```bash
docker compose -f docker-compose.yml up -d --build
```

The command builds the application images, starts PostgreSQL, Redis, Mailpit,
the FastAPI backend, and the frontend, and runs the containers in the
background. Inspect startup logs with:

```bash
docker compose -f docker-compose.yml logs -f
```

Useful endpoints after startup:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Mailpit: http://localhost:8025

Check container health and status with:

```bash
docker compose -f docker-compose.yml ps
```

### Stop the stack

Stop and remove the containers and network while keeping database data:

```bash
docker compose -f docker-compose.yml down
```

To stop the stack and remove its named database and Redis volumes as well:

```bash
docker compose -f docker-compose.yml down -v
```

## Required warnings

- **Current repository layout:** Before running the deployment command, verify
  that `backend/Dockerfile` and the application files expected by the Compose
  build context exist. The current checkout contains service-specific
  Dockerfiles under `backend/*_service/`, but no root `backend/Dockerfile`, so
  the root Compose deployment will fail during the backend image build until
  that mismatch is resolved.
- **Development defaults are not production credentials.** The Compose file
  supplies fallback PostgreSQL credentials and a fallback `SECRET_KEY`. Set
  `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and a strong unique
  `SECRET_KEY` in a root `.env` file before deployment. Do not commit `.env`.
- **Ports are published to the host.** The Compose file exposes PostgreSQL
  (`5432`), Redis (`6379`), Mailpit SMTP (`1025`), Mailpit UI (`8025`), the
  backend (`8000`), and the frontend (`5173`). Restrict or remove database,
  Redis, and Mailpit port mappings before exposing a host to an untrusted
  network.
- **Persistent data is stored in named volumes.** Do not use `down -v` unless
  deleting PostgreSQL and Redis data is intentional. Back up production data
  before upgrades or teardown.
- **This Compose file is not a complete production hardening configuration.**
  Add TLS, a reverse proxy, secret management, backups, monitoring, resource
  limits, and a production migration process before using it on a public host.
- **Mailpit is a development mail server.** It captures mail locally and must
  not be used as a production SMTP delivery service.

## Local backend development

For local development, use the Python environment configured for the backend
service and run its FastAPI application directly:

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```
