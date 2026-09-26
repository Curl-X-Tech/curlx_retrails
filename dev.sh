#!/usr/bin/env bash

set -e

# Root directory of the repository
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Colors for clear terminal output
BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

# Helper print functions (no emojis)
log_info() {
    echo -e "${CYAN}[INFO]${RESET} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${RESET} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${RESET} $1" >&2
}

# Display full services status banner with ports and clickable URLs
print_banner() {
    echo ""
    echo -e "${BOLD}================================================================${RESET}"
    echo -e "  ${BOLD}ReTrails Development Environment (Team CurlX)${RESET}"
    echo -e "${BOLD}================================================================${RESET}"
    echo -e "  ${GREEN}Frontend (React PWA):${RESET}      ${CYAN}http://localhost:5173${RESET}"
    echo -e "  ${GREEN}Backend API (FastAPI):${RESET}     ${CYAN}http://localhost:8000${RESET}"
    echo -e "  ${GREEN}API Swagger Docs:${RESET}          ${CYAN}http://localhost:8000/docs${RESET}"
    echo -e "  ${GREEN}API ReDoc:${RESET}                 ${CYAN}http://localhost:8000/redoc${RESET}"
    echo -e "  ${GREEN}PostgreSQL Database:${RESET}       ${CYAN}localhost:5432${RESET}"
    echo -e "  ${GREEN}Redis Cache / Broker:${RESET}      ${CYAN}localhost:6379${RESET}"
    echo -e "  ${GREEN}Mailpit Web Inbox:${RESET}         ${CYAN}http://localhost:8025${RESET} (SMTP: 1025)"
    echo -e "  ${GREEN}React Email Preview:${RESET}       ${CYAN}http://localhost:3001${RESET} (via ./dev.sh emails)"
    echo -e "${BOLD}================================================================${RESET}"
    echo -e "  ${YELLOW}Ready for requests. Press Ctrl+C to stop all processes.${RESET}"
    echo -e "${BOLD}================================================================${RESET}"
    echo ""
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
        log_success "Created .env"
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

    log_success "All dependencies installed successfully."
}

# Run backend service
run_backend() {
    check_prerequisites
    ensure_env
    log_info "Starting FastAPI backend on http://localhost:8000 (Docs: http://localhost:8000/docs)..."
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

# Run dev infrastructure services (PostgreSQL, Redis, Mailpit)
run_services_up() {
    ensure_env
    log_info "Starting dev infrastructure (PostgreSQL, Redis, Mailpit)..."
    docker compose -f "$ROOT_DIR/docker-compose.dev.yml" up -d
    echo ""
    log_success "Dev infrastructure running:"
    echo -e "  - PostgreSQL: ${CYAN}localhost:5432${RESET}"
    echo -e "  - Redis:      ${CYAN}localhost:6379${RESET}"
    echo -e "  - Mailpit UI: ${CYAN}http://localhost:8025${RESET} (SMTP: 1025)"
}

run_services_down() {
    log_info "Stopping dev infrastructure (PostgreSQL, Redis, Mailpit)..."
    docker compose -f "$ROOT_DIR/docker-compose.dev.yml" down
    log_success "Dev infrastructure stopped."
}

# Run full development stack (Backend + Frontend + Auto Dev Services)
run_dev() {
    check_prerequisites
    ensure_env

    # Automatically start dev infrastructure if Docker daemon is running
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        log_info "Starting dev infrastructure (PostgreSQL, Redis, Mailpit)..."
        docker compose -f "$ROOT_DIR/docker-compose.dev.yml" up -d
    else
        log_info "Docker daemon not detected. Running with local SQLite fallback mode."
    fi

    # Handle graceful exit on SIGINT/SIGTERM
    trap 'echo ""; log_info "Shutting down all development processes..."; kill $(jobs -p) 2>/dev/null || true; exit 0' SIGINT SIGTERM EXIT

    (cd "$ROOT_DIR/backend" && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) &
    BACKEND_PID=$!

    (cd "$ROOT_DIR/frontend" && bun run dev) &
    FRONTEND_PID=$!

    (cd "$ROOT_DIR/packages/emails" && bun run dev) &
    EMAILS_PID=$!

    # Wait briefly for servers to bind sockets then display summary dashboard
    sleep 1.5
    print_banner

    wait $BACKEND_PID $FRONTEND_PID $EMAILS_PID
}

# Run tests
run_tests() {
    check_prerequisites
    log_info "Running backend test suite..."
    (cd "$ROOT_DIR/backend" && uv run pytest)
}

# Full Docker Compose commands
run_docker_up() {
    ensure_env
    log_info "Starting full Docker Compose services (App + DB + Redis + Mailpit)..."
    docker compose up -d
}

run_docker_down() {
    log_info "Stopping full Docker Compose services..."
    docker compose down
}

# Clean build artifacts and virtualenvs
clean_all() {
    log_info "Cleaning caches, virtualenvs, and node_modules..."
    rm -rf "$ROOT_DIR/backend/.venv" "$ROOT_DIR/backend/.pytest_cache" "$ROOT_DIR/backend/__pycache__"
    rm -rf "$ROOT_DIR/frontend/node_modules" "$ROOT_DIR/frontend/dist"
    rm -rf "$ROOT_DIR/packages/emails/node_modules" "$ROOT_DIR/packages/emails/.react-email"
    log_success "Clean completed."
}

# Help menu
show_help() {
    echo -e "${BOLD}ReTrails Development Script (Team CurlX)${RESET}"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev           Start both backend and frontend concurrently (default)"
    echo "  services      Start dev infrastructure (PostgreSQL, Redis, Mailpit) via Docker"
    echo "  services:down Stop dev infrastructure"
    echo "  install       Install all dependencies for backend, frontend, and emails"
    echo "  backend       Start backend server only (FastAPI on port 8000)"
    echo "  frontend      Start frontend server only (Vite on port 5173)"
    echo "  emails        Start React Email preview server on port 3001"
    echo "  test          Run tests"
    echo "  docker        Start full Docker Compose environment in background"
    echo "  docker:down   Stop full Docker Compose services"
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
    services|infra)
        run_services_up
        ;;
    services:down|infra:down)
        run_services_down
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
