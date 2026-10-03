# Stage 1: Build virtual environment with uv
FROM python:3.11-slim AS builder

WORKDIR /app

# Install uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Install dependencies in a cached layer
COPY pyproject.toml ./
RUN uv sync --no-install-project --no-dev

# Copy application source code
COPY app/ ./app/

# Final project installation
RUN uv sync --no-dev

# Stage 2: Minimal runtime image
FROM python:3.11-slim AS runner

WORKDIR /app

# Create non-root user (appuser:1000) for container runtime security
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -s /bin/bash -m appuser

# Copy virtual environment and application code from builder
COPY --from=builder --chown=appuser:appuser /app /app

ENV PATH="/app/.venv/bin:$PATH"
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
