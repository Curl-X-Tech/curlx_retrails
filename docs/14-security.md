# Security Documentation

**Project**: ReTrails — Team CurlX

---

## 1. Authentication

### Mechanism

ReTrails uses JWT (JSON Web Tokens) issued by the `fastapi-users` library.

- Login endpoint: `POST /api/v1/auth/jwt/login`
- Request format: `application/x-www-form-urlencoded` with `username` (email) and `password`
- On success: returns `{"access_token": "...", "token_type": "bearer"}`
- Subsequent requests include the token as `Authorization: Bearer <token>`

### Token Lifetime

Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 11520 minutes = 8 days).

### Password Security

- Passwords are hashed using **argon2** (via `pwdlib[argon2]`)
- argon2 is a memory-hard password hashing algorithm that is resistant to brute-force and GPU-accelerated attacks
- Plaintext passwords are never stored or logged
- Default judge account password: `Password@123`

### Password Reset

Token-based email reset flow:
1. `POST /auth/forgot-password` — generates a time-limited reset token (expires in `EMAIL_RESET_TOKEN_EXPIRE_HOURS`, default 24 hours)
2. Reset link sent via Resend REST API (or logged to terminal in development)
3. `POST /auth/reset-password` — accepts token and new password

---

## 2. Authorization (Role-Based Access Control)

### Role definitions

Five roles exist in the system:

| Role | Code | Access scope |
|---|---|---|
| System Admin | system_admin | Full access to all endpoints |
| Dispatcher | dispatcher | Fleet, orders, allocations, deferrals |
| Loader | loader | Loading bays, checklists, departure |
| Driver | driver | Routes, arrivals, POD, sync |
| Store Manager | store_manager | Orders, deferrals, deliveries |

### Guard implementation

Role enforcement is implemented as FastAPI `Depends()` guards in `app/guards/roles.py`:

```python
require_dispatcher   # RoleGuard(dispatcher, system_admin)
require_loader       # RoleGuard(loader, system_admin)
require_driver       # RoleGuard(driver, system_admin)
require_store_manager # RoleGuard(store_manager, system_admin)
require_system_admin # RoleGuard(system_admin)
```

Each guard:
1. Extracts the JWT from the `Authorization` header
2. Verifies the signature using `SECRET_KEY`
3. Checks `user.is_active`
4. Checks `user.user_type` against the allowed roles
5. Returns 403 Forbidden if the role does not match

### Depot scoping

Dispatchers are scoped to their assigned depot. `dispatcher_scope.py` applies a `WHERE staff_profile.depot_id = :depot_id` filter to order and trip queries when the authenticated user is a Dispatcher. This prevents a Peliyagoda dispatcher from seeing Kandy orders.

Store Managers are scoped to their assigned outlet via `order_scope()`.

---

## 3. Rate Limiting

Rate limiting is implemented as FastAPI `Depends()` guards using a token-bucket counter stored in Redis.

| Endpoint group | Limit |
|---|---|
| Auth endpoints (`/auth/jwt/login`, `/auth/forgot-password`) | 20 requests/minute per IP |
| General API endpoints | 100 requests/minute per IP |

Configuration:
```
RATE_LIMIT_AUTH_PER_MINUTE=20
RATE_LIMIT_API_PER_MINUTE=100
```

If Redis is unavailable, rate limiting degrades gracefully and requests pass through (fail-open behavior).

---

## 4. API Protection

### CORS

Allowed origins are configured in `BACKEND_CORS_ORIGINS`. In development:
```
["http://localhost:5173", "http://localhost:3000", "http://localhost:8000", "https://localhost", "http://localhost:4173"]
```

Production origins must be explicitly added; wildcard origins are not used.

### HTTPS

In production, the Docker Compose production configuration (`docker-compose.prod.yml`) routes all traffic through Nginx with Let's Encrypt TLS certificates. HTTP requests are redirected to HTTPS.

### Sensitive endpoint access

- `/admin/seed` — requires `system_admin` role; cannot be triggered by operational users
- `/users` (list/create) — requires `system_admin` role
- `/allocations/engine/schedule` — requires `system_admin` role

---

## 5. Input Validation

All request bodies are validated by Pydantic v2 models before reaching route handlers. Pydantic raises a `422 Unprocessable Entity` with field-level error details on validation failure.

Examples of enforced validation:
- `order_date` must be a valid date
- `requested_qty` must be > 0 (CHECK constraint in database)
- `issue_type` in discrepancy must be one of the allowed values (validated before database insert)
- `cutoff_time` for cron schedule must be a valid HH:MM string

SQLAlchemy CHECK constraints in PostgreSQL provide a second layer of enforcement at the database level.

---

## 6. Secret Management

- `SECRET_KEY` is used to sign JWT tokens. It must be set to a cryptographically random string in production.
- The `.env.example` file contains placeholder values marked `changethis`. Production deployments must override all placeholder values.
- Real credentials are never committed to the repository. The `.gitignore` excludes `.env` files.
- Docker Compose passes secrets via environment variables (not baked into images).
- `S3_ACCESS_KEY` and `S3_SECRET_KEY` for MinIO must be rotated from the default `minioadmin` value in production.

### .env.example excerpt (no real secrets)

```
SECRET_KEY=changethis-secret-key-32-chars-long-security-token-fullstack-fastapi
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis123
POSTGRES_PASSWORD=waypoint
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

---

## 7. Database Access

- The database is accessible only from within the Docker network. The PostgreSQL port is bound to `127.0.0.1:5432` only, not exposed on `0.0.0.0`.
- The application connects with a dedicated database user (`waypoint`) that does not have superuser privileges.
- All database access goes through SQLAlchemy with parameterized queries; no raw SQL strings with user-supplied interpolation are used.

---

## 8. File Upload Security

Photo evidence uploads (for proof-of-delivery) are stored in MinIO object storage, not on the application server's filesystem.

`app/services/storage.py` handles file operations:
- Files are stored with content-type validation
- Bucket access is private by default
- Public URLs are signed or served via MinIO's presigned URL mechanism (depending on configuration)

---

## 9. Audit Trail

All data modifications are audited through:
- `updated_at` timestamps automatically maintained by triggers on all mutable tables
- `created_by` and `updated_by` user ID fields on trip and other key entities
- `deferral_audit_log` — immutable record of every deferral decision with the responsible dispatcher
- `sync_batch_log` and `sync_mutation_audit_log` — server-side record of every offline mutation received from field devices
- `discrepancy_report` with `reported_by_staff_id` and `reported_at`
