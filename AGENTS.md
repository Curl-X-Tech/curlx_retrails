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
13. **Comment Discipline & Minimalist Code**:
   - Do not add noisy, redundant, or self-evident comments (e.g. step numbers, section banners for obvious JSX tags, line-by-line field descriptions, or conversational thoughts).
   - Code must be self-documenting through clear, meaningful identifiers, strict TypeScript interfaces, and focused modular functions.
   - Reserve comments exclusively for complex mathematical models, unusual coordinate offsets, or non-obvious business/domain logic invariants.
14. **Frontend Structure**:
   - Use `src/api/<domain>/{types,api,hooks,mock}` as the home for each domain boundary.
   - Keep `src/sync`, `src/features`, and `src/components/shared` as the only shared orchestration layers.
   - Pages use hooks only; they do not import from `src/data`.
   - Do not add path strings outside `src/api/endpoints.ts`.
   - Treat `status: live` as implemented and `status: pending` as mock-backed.
   - Keep code files under 200 lines; mock seed and mock-data files are exempt.
15. **Standard 4-Tier Enterprise Responsive Layout System**:
   - All page layouts, dashboard grids, and container views must adhere strictly to the role-optimized 4-tier design system:
     - **Wide / Command Center ($\ge 1440\text{px}$)**: 12–16 Columns, Gutter: $36\text{px}$, Margins: $64\text{px}$ (or $0\text{px}$ for flush views).
     - **Desktop Planning ($1024\text{px} - 1439\text{px}$)**: 12 Columns, Gutter: $36\text{px}$, Margins: $48\text{px}$ (or $0\text{px}$ for flush views).
     - **Tablet Bay Station ($600\text{px} - 1023\text{px}$)**: 8 Columns, Gutter: $24\text{px}$, Margins: $24\text{px}$ (or $0\text{px}$ for flush views).
     - **Mobile Field Driver/Store ($320\text{px} - 599\text{px}$)**: 4 Columns, Gutter: $16\text{px}$, Margins: $16\text{px}$ (or $0\text{px}$ for flush views).
   - Use pre-built CSS utility classes from `src/index.css` instead of writing custom media queries or long ad-hoc class chains:
     - Container Modes: `.page-container-compact`, `.page-container-tablet`, `.page-container-desktop`, `.page-container-fluid`.
16. **Graphify Knowledge Graph & Token Preservation**:
   - `graphify-out/graph.json` is the canonical knowledge graph for the entire repository.
   - Before performing wide repository file scans or dumping entire directories into context, the AI assistant MUST query the Graphify graph (via MCP tools `query_graph`, `get_node`, `get_neighbors`, `god_nodes`, or the CLI `graphify query "<feature>"`) to locate affected symbols, relationships, and dependencies.
   - Keep the graph synced whenever structural changes or major modules are added via `./dev.sh graphify`.
17. **Timezone & DateTime Integrity (UTC vs. Local Wall-Clock)**:
   - **Absolute Event Timestamps (`TIMESTAMPTZ`)**: All audit timestamps, status transitions, GPS pings, and event logs (`created_at`, `updated_at`, `dispatched_at`, `delivered_at`, etc.) MUST always be created and stored in universal UTC (`timezone.utc`) in backend and transmitted as ISO-8601 UTC strings (`.toISOString()`). Frontend renders them in the client's local timezone.
   - **Schedule Constraints & Operating Windows (`TIME` / `DATE`)**: Store opening/closing hours, delivery windows (`window_open_time`, `window_close_time`), and price effective dates (`effective_from`, `effective_to`) are timezone-naive wall-clock schedule rules. They MUST be stored and transmitted as plain `TIME` (`"09:00:00"`) or `DATE` (`"2026-10-02"`) values without timezone offsets to prevent double-offset shifts.
   - **Business Day & Operating Calendar Rollover**: Operational day cutoffs, demand surge evaluations, and calendar resolutions MUST evaluate against Sri Lanka Standard Time (`Asia/Colombo`, UTC+05:30) so midnight rollover aligns with Sri Lanka local time regardless of server host location.

