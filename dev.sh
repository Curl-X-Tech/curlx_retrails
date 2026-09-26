#!/usr/bin/env bash

set -e

# Root directory of the repository
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Helper print functions (no emojis)
log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1" >&2
}

# Check for required tools
check_prerequisites() {
    if ! command -v uv &> /dev/null; then
        log_error "'uv' is required for backend management but not found. Install from https://github.com/astral-sh/uv"
        exit 1
    fi

    if ! command -v bun &> /dev/null; then
        log_error "'bun' is required for frontend and email management but not found. Install from https://bun.sh"
        exit 1
    fi
}

# Ensure .env file exists
ensure_env() {
    if [ ! -f "$ROOT_DIR/.env" ]; then
        log_info ".env file not found. Copying from .env.example..."
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        log_info "Created .env"
    fi
}

# Install dependencies across all packages
install_deps() {
    check_prerequisites
    ensure_env

    log_info "Installing backend dependencies (uv)..."
    (cd "$ROOT_DIR/backend" && uv sync)

    log_info "Installing frontend dependencies (bun)..."
    (cd "$ROOT_DIR/frontend" && bun install)

    log_info "Installing email package dependencies (bun)..."
    (cd "$ROOT_DIR/packages/emails" && bun install)

    log_info "All dependencies installed successfully."
}

# Run backend service
run_backend() {
    check_prerequisites
    ensure_env
    log_info "Starting FastAPI backend on http://localhost:8000..."
    cd "$ROOT_DIR/backend"
    exec uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

# Run frontend service
run_frontend() {
    check_prerequisites
    ensure_env
    log_info "Starting React PWA frontend on http://localhost:5173..."
    cd "$ROOT_DIR/frontend"
    exec bun run dev
}

# Run email preview server
run_emails() {
    check_prerequisites
    log_info "Starting React Email preview server on http://localhost:3001..."
    cd "$ROOT_DIR/packages/emails"
    exec bun run dev
}

# Run full development stack (Backend + Frontend)
run_dev() {
    check_prerequisites
    ensure_env

    log_info "Starting ReTrails development environment..."
    log_info "Backend:  http://localhost:8000 (Docs: http://localhost:8000/docs)"
    log_info "Frontend: http://localhost:5173"

    # Handle graceful exit on SIGINT/SIGTERM
    trap 'kill $(jobs -p) 2>/dev/null || true; exit 0' SIGINT SIGTERM EXIT

    (cd "$ROOT_DIR/backend" && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) &
    BACKEND_PID=$!

    (cd "$ROOT_DIR/frontend" && bun run dev) &
    FRONTEND_PID=$!

    wait $BACKEND_PID $FRONTEND_PID
}

# Run tests
run_tests() {
    check_prerequisites
    log_info "Running backend test suite..."
    (cd "$ROOT_DIR/backend" && uv run pytest)
}

# Docker commands
run_docker_up() {
    log_info "Starting Docker Compose services..."
    docker compose up -d
}

run_docker_down() {
    log_info "Stopping Docker Compose services..."
    docker compose down
}

# Clean build artifacts and virtualenvs
clean_all() {
    log_info "Cleaning caches, virtualenvs, and node_modules..."
    rm -rf "$ROOT_DIR/backend/.venv" "$ROOT_DIR/backend/.pytest_cache" "$ROOT_DIR/backend/__pycache__"
    rm -rf "$ROOT_DIR/frontend/node_modules" "$ROOT_DIR/frontend/dist"
    rm -rf "$ROOT_DIR/packages/emails/node_modules" "$ROOT_DIR/packages/emails/.react-email"
    log_info "Clean completed."
}

# Help menu
show_help() {
    echo "ReTrails Development Script (Team CurlX)"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev           Start both backend and frontend concurrently (default)"
    echo "  install       Install all dependencies for backend, frontend, and emails"
    echo "  backend       Start backend server only (FastAPI on port 8000)"
    echo "  frontend      Start frontend server only (Vite on port 5173)"
    echo "  emails        Start React Email preview server on port 3001"
    echo "  test          Run tests"
    echo "  docker        Start full Docker Compose environment in background"
    echo "  docker:down   Stop Docker Compose services"
    echo "  clean         Remove virtual environments and node_modules"
    echo "  help          Show this help message"
    echo ""
}

# CLI Router
COMMAND="${1:-dev}"

case "$COMMAND" in
    dev)
        run_dev
        ;;
    install)
        install_deps
        ;;
    backend)
        run_backend
        ;;
    frontend)
        run_frontend
        ;;
    emails)
        run_emails
        ;;
    test)
        run_tests
        ;;
    docker)
        run_docker_up
        ;;
    docker:down)
        run_docker_down
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
