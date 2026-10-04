<# ReTrails Development Script (Team CurlX) - Windows PowerShell edition #>
param(
    [Parameter(Position = 0)]
    [string]$Command = "dev"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ROOT_DIR = $PSScriptRoot

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------

function Write-Info([string]$msg) {
    Write-Host "[INFO] " -ForegroundColor Cyan -NoNewline
    Write-Host $msg
}

function Write-Ok([string]$msg) {
    Write-Host "[OK]   " -ForegroundColor Green -NoNewline
    Write-Host $msg
}

function Write-Err([string]$msg) {
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $msg
}

# ---------------------------------------------------------------------------
# Banners
# ---------------------------------------------------------------------------

function Print-Banner {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor White
    Write-Host "  ReTrails Development Environment (Team CurlX)" -ForegroundColor White
    Write-Host "================================================================" -ForegroundColor White
    Write-Host "  Frontend (React PWA):      " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  Backend API (FastAPI):     " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Cyan
    Write-Host "  API Swagger Docs:          " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  API ReDoc:                 " -NoNewline; Write-Host "http://localhost:8000/redoc" -ForegroundColor Cyan
    Write-Host "  PostgreSQL Database:       " -NoNewline; Write-Host "localhost:5432" -ForegroundColor Cyan
    Write-Host "  Redis Cache / Broker:      " -NoNewline; Write-Host "localhost:6379" -ForegroundColor Cyan
    Write-Host "  Mailpit Web Inbox:         " -NoNewline; Write-Host "http://localhost:8025" -ForegroundColor Cyan -NoNewline; Write-Host " (SMTP: 1025)"
    Write-Host "  React Email Preview:       " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Cyan -NoNewline; Write-Host " (via .\dev.ps1 emails)"
    Write-Host "================================================================" -ForegroundColor White
    Write-Host "  Ready for requests. Press Ctrl+C to stop all processes." -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor White
    Write-Host ""
}

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------

function Assert-Prerequisites {
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
        Write-Err "'uv' is required but not found. Install from https://github.com/astral-sh/uv"
        exit 1
    }
    if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
        Write-Err "'bun' is required but not found. Install from https://bun.sh"
        exit 1
    }
}

function Ensure-Env {
    $envFile = Join-Path $ROOT_DIR ".env"
    $envExample = Join-Path $ROOT_DIR ".env.example"
    if (-not (Test-Path $envFile)) {
        Write-Info ".env not found. Copying from .env.example..."
        Copy-Item $envExample $envFile
        Write-Ok "Created .env"
    }
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

function Invoke-InstallDeps {
    Assert-Prerequisites
    Ensure-Env

    Write-Info "Installing backend dependencies (uv)..."
    Push-Location (Join-Path $ROOT_DIR "backend")
    uv sync
    Pop-Location

    Write-Info "Installing frontend dependencies (bun)..."
    Push-Location (Join-Path $ROOT_DIR "frontend")
    bun install
    Pop-Location

    Write-Info "Installing email package dependencies (bun)..."
    Push-Location (Join-Path $ROOT_DIR "packages\emails")
    bun install
    Pop-Location

    Write-Ok "All dependencies installed successfully."
}

function Invoke-Backend {
    Assert-Prerequisites
    Ensure-Env
    Write-Info "Starting FastAPI backend on http://localhost:8000 (Docs: http://localhost:8000/docs)..."
    Push-Location (Join-Path $ROOT_DIR "backend")
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    Pop-Location
}

function Invoke-Frontend {
    Assert-Prerequisites
    Ensure-Env
    Write-Info "Starting React PWA frontend on http://localhost:5173..."
    Push-Location (Join-Path $ROOT_DIR "frontend")
    bun run dev
    Pop-Location
}

function Invoke-Emails {
    Assert-Prerequisites
    Write-Info "Starting React Email preview server on http://localhost:3001..."
    Push-Location (Join-Path $ROOT_DIR "packages\emails")
    bun run dev
    Pop-Location
}

function Invoke-ServicesUp {
    Ensure-Env
    Write-Info "Starting dev infrastructure (PostgreSQL, Redis, Mailpit)..."
    docker compose -f "$ROOT_DIR\docker-compose.dev.yml" up -d
    Write-Host ""
    Write-Ok "Dev infrastructure running:"
    Write-Host "  - PostgreSQL: " -NoNewline; Write-Host "localhost:5432" -ForegroundColor Cyan
    Write-Host "  - Redis:      " -NoNewline; Write-Host "localhost:6379" -ForegroundColor Cyan
    Write-Host "  - Mailpit UI: " -NoNewline; Write-Host "http://localhost:8025" -ForegroundColor Cyan -NoNewline; Write-Host " (SMTP: 1025)"
}

function Invoke-ServicesDown {
    Write-Info "Stopping dev infrastructure..."
    docker compose -f "$ROOT_DIR\docker-compose.dev.yml" down 2>$null
    Write-Ok "Dev infrastructure stopped."
}

function Invoke-AllDown {
    Write-Info "Stopping all Docker Compose services..."
    docker compose -f "$ROOT_DIR\docker-compose.dev.yml" down 2>$null
    docker compose -f "$ROOT_DIR\docker-compose.yml" down 2>$null
    Write-Ok "All Docker containers stopped."
}

function Invoke-Dev {
    Assert-Prerequisites
    Ensure-Env

    # Start dev infrastructure if Docker is available
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Starting dev infrastructure (PostgreSQL, Redis, Mailpit)..."
            docker compose -f "$ROOT_DIR\docker-compose.dev.yml" up -d
        }
    } else {
        Write-Info "Docker not detected. Running with local SQLite fallback mode."
    }

    # Launch all three processes in separate windows so each gets its own console
    $backendJob = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", "Push-Location '$ROOT_DIR\backend'; uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" `
        -PassThru

    $frontendJob = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", "Push-Location '$ROOT_DIR\frontend'; bun run dev" `
        -PassThru

    $emailsJob = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", "Push-Location '$ROOT_DIR\packages\emails'; bun run dev" `
        -PassThru

    Start-Sleep -Seconds 2
    Print-Banner

    Write-Info "Press Enter to stop all spawned processes and exit."
    Read-Host | Out-Null

    foreach ($proc in @($backendJob, $frontendJob, $emailsJob)) {
        if ($proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Info "Shutting down development processes."
}

function Invoke-Lint {
    Assert-Prerequisites
    Write-Info "Running backend linting (Ruff)..."
    Push-Location (Join-Path $ROOT_DIR "backend")
    uv run ruff check .
    Pop-Location

    Write-Info "Running frontend linting (TypeScript)..."
    Push-Location (Join-Path $ROOT_DIR "frontend")
    bun run lint
    Pop-Location

    Write-Ok "Lint checks passed."
}

function Invoke-Format {
    Assert-Prerequisites
    Write-Info "Formatting backend Python code (Ruff)..."
    Push-Location (Join-Path $ROOT_DIR "backend")
    uv run ruff check --fix .
    uv run ruff format .
    Pop-Location

    Write-Info "Formatting frontend code (Prettier)..."
    Push-Location (Join-Path $ROOT_DIR "frontend")
    bun run format
    Pop-Location

    Write-Info "Formatting email templates (Prettier)..."
    Push-Location (Join-Path $ROOT_DIR "packages\emails")
    bun run format
    Pop-Location

    Write-Ok "Code formatted successfully."
}

function Invoke-FormatCheck {
    Assert-Prerequisites
    Write-Info "Checking backend Python formatting..."
    Push-Location (Join-Path $ROOT_DIR "backend")
    uv run ruff format --check .
    Pop-Location

    Write-Info "Checking frontend formatting..."
    Push-Location (Join-Path $ROOT_DIR "frontend")
    bun run format:check
    Pop-Location

    Write-Info "Checking email templates formatting..."
    Push-Location (Join-Path $ROOT_DIR "packages\emails")
    bun run format:check
    Pop-Location

    Write-Ok "Format checks passed."
}

function Invoke-Typecheck {
    Assert-Prerequisites
    Write-Info "Type checking frontend (TypeScript)..."
    Push-Location (Join-Path $ROOT_DIR "frontend")
    bun run typecheck
    Pop-Location

    Write-Info "Type checking email templates (TypeScript)..."
    Push-Location (Join-Path $ROOT_DIR "packages\emails")
    bun run typecheck
    Pop-Location

    Write-Ok "Type checks passed."
}

function Invoke-Tests {
    Assert-Prerequisites
    Write-Info "Running backend test suite (pytest)..."
    Push-Location (Join-Path $ROOT_DIR "backend")
    uv run pytest
    Pop-Location
}

function Invoke-Check {
    Assert-Prerequisites
    Write-Info "Running full quality check (lint, format:check, typecheck, tests)..."
    Invoke-FormatCheck
    Invoke-Lint
    Invoke-Typecheck
    Invoke-Tests
    Write-Host ""
    Write-Ok "All pre-commit checks passed successfully."
}

function Invoke-Clean {
    Write-Info "Cleaning caches, virtualenvs, and node_modules..."
    $paths = @(
        "$ROOT_DIR\backend\.venv",
        "$ROOT_DIR\backend\.pytest_cache",
        "$ROOT_DIR\backend\.ruff_cache",
        "$ROOT_DIR\backend\.mypy_cache",
        "$ROOT_DIR\backend\__pycache__",
        "$ROOT_DIR\frontend\node_modules",
        "$ROOT_DIR\frontend\dist",
        "$ROOT_DIR\packages\emails\node_modules",
        "$ROOT_DIR\packages\emails\.react-email"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) {
            Remove-Item $p -Recurse -Force
        }
    }
    Write-Ok "Clean completed."
}

function Show-Help {
    Write-Host "ReTrails Development Script (Team CurlX)" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  dev                  Start backend, frontend, and emails concurrently (default)"
    Write-Host "  services             Start dev infrastructure (PostgreSQL, Redis, Mailpit) via Docker"
    Write-Host "  services:down        Stop dev infrastructure"
    Write-Host "  down                 Stop all running Docker containers (dev + services)"
    Write-Host "  stop                 Alias for down"
    Write-Host "  install              Install all dependencies for backend, frontend, and emails"
    Write-Host "  backend              Start backend server only (FastAPI on port 8000)"
    Write-Host "  frontend             Start frontend server only (Vite on port 5173)"
    Write-Host "  emails               Start React Email preview server on port 3001"
    Write-Host "  lint                 Run linter on backend and frontend"
    Write-Host "  format               Auto-format code across backend, frontend, and emails"
    Write-Host "  format:check         Verify code formatting"
    Write-Host "  typecheck            Run TypeScript compiler type checks"
    Write-Host "  test                 Run backend test suite"
    Write-Host "  check                Run all quality checks (lint + format + typecheck + test)"
    Write-Host "  docker               Start dev infrastructure in background (alias for services)"
    Write-Host "  docker:down          Stop all Docker Compose services"
    Write-Host "  clean                Remove virtual environments and node_modules"
    Write-Host "  help                 Show this help message"
    Write-Host ""
}

# ---------------------------------------------------------------------------
# CLI router
# ---------------------------------------------------------------------------

switch ($Command) {
    "dev"               { Invoke-Dev }
    "services"          { Invoke-ServicesUp }
    "infra"             { Invoke-ServicesUp }
    "services:down"     { Invoke-ServicesDown }
    "infra:down"        { Invoke-ServicesDown }
    "down"              { Invoke-AllDown }
    "stop"              { Invoke-AllDown }
    "install"           { Invoke-InstallDeps }
    "backend"           { Invoke-Backend }
    "frontend"          { Invoke-Frontend }
    "emails"            { Invoke-Emails }
    "lint"              { Invoke-Lint }
    "format"            { Invoke-Format }
    "format:check"      { Invoke-FormatCheck }
    "typecheck"         { Invoke-Typecheck }
    "test"              { Invoke-Tests }
    "check"             { Invoke-Check }
    "validate"          { Invoke-Check }
    "docker"            { Invoke-ServicesUp }
    "docker:down"       { Invoke-AllDown }
    "clean"             { Invoke-Clean }
    "help"              { Show-Help }
    "--help"            { Show-Help }
    "-h"                { Show-Help }
    default {
        Write-Err "Unknown command: $Command"
        Show-Help
        exit 1
    }
}
