# Agent Guidelines for ReTrails (Team CurlX)

Welcome to the **ReTrails** codebase, developed by Team **CurlX**.

## Key Directives:
1. **No Emojis & No Jargon**:
   - Do not use emojis anywhere in the codebase, UI, templates, documentation, or commit messages.
   - Avoid buzzwords and vague jargon. Keep descriptions direct, precise, and professional.
2. **Package Managers**:
   - Backend: `uv` (`uv sync`, `uv run ...`)
   - Frontend & Emails: `bun` (`bun install`, `bun run ...`)
3. **Project Architecture**:
   - `backend/`: FastAPI + SQLAlchemy 2.0 + PostgreSQL (with SQLite fallback) + Alembic
   - `frontend/`: React + TypeScript + Tailwind CSS + Dexie.js (Offline-first IndexedDB) + PWA
   - `packages/emails/`: React Email transactional templates
4. **Workflow Skills & Quality Rules**:
   - Inspect `.agents/skills/curlx-stack-guide/SKILL.md`
   - Inspect `.agents/skills/fastapi/SKILL.md`
   - Inspect `.agents/skills/sqlalchemy/SKILL.md`
   - Inspect `.agents/skills/fastapi-sqlalchemy-workflow/SKILL.md`
   - Inspect `.agents/skills/library-skills/SKILL.md`
   - Inspect `.agents/skills/react-tailwind-workflow/SKILL.md`
   - Inspect `.agents/rules/code_quality.md`
5. **Offline Sync**:
   - Adhere to local-first Dexie mutations with background sync queue draining to FastAPI backend.
6. **Dev Automation Script**:
   - Always use `./dev.sh` commands (`./dev.sh check`, `./dev.sh test`, `./dev.sh lint`, `./dev.sh format`, `./dev.sh typecheck`, `./dev.sh dev`, `./dev.sh backend`, `./dev.sh frontend`, `./dev.sh emails`) for running and validating tasks.
7. **Pre-Commit Verification**:
   - Every commit must pass `./dev.sh check` (linting, formatting, type checking, and tests).
8. **Commit Messages**:
   - Keep messages short, exact, and concise (under 72 chars, conventional commits prefix).
9. **UI Components Protection**:
   - Never overwrite or clobber custom UI components in `frontend/src/components/ui/` with stock CLI presets or templates. Keep existing refinements intact.
10. **Data & Mock Separation**:
   - Never inline large mock datasets, seed lists, or static coordinate tables directly inside UI component/page files.
   - Always store mock data, seed arrays, and static datasets in dedicated files under `frontend/src/data/` (e.g. `mock-live-map.ts`, `mock-orders.ts`) to keep page and component files lean and focused on presentation and interaction logic.
11. **Minimalist UI & Badge Discipline**:
   - Do not scatter translucent, noisy, or pastel badges across tables, cards, and headers.
   - If a status or tag is necessary, use solid, high-contrast colors or clean monospace text labels rather than washed-out pills.
   - Avoid filler tags and keep layouts lean, minimal, and focused on essential data.
12. **Strict Schema & Domain Fidelity**:
   - All new and existing UI components, data hooks, Zustand stores, and mock datasets must strictly align with the PostgreSQL master schema in `docs/schema/schema.sql`.
   - Always use canonical entity fields, relations, data types, and status enums:
     - 5 Enterprise Roles: `system_admin`, `dispatcher`, `loader`, `driver`, `store_manager`.
     - Special Handling Codes: `COL` (Cold Chain), `FRG` (Fragile), `MAL` (Mall Bay), `HAZ` (Hazardous).
     - Fleet & Units: `weight_cap_kg`, `volume_cap_m3`, `fuel_type`, `km_per_l`, `weekly_fuel_quota_l`, `type` (`truck` | `van`), `temp` (`reefer` | `ambient`).
     - Pricing & Valuation: Currency `LKR` and unit prices adhering to `price_list` / `order_item.unit_price`.




