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
   - `backend/`: FastAPI + SQLModel + PostgreSQL (with SQLite fallback) + Alembic
   - `frontend/`: React + TypeScript + Tailwind CSS + Dexie.js (Offline-first IndexedDB) + PWA
   - `packages/emails/`: React Email transactional templates
4. **Workflow Skills**:
   - Inspect `.agents/skills/curlx-stack-guide/SKILL.md`
   - Inspect `.agents/skills/fastapi-sqlmodel-workflow/SKILL.md`
   - Inspect `.agents/skills/react-tailwind-workflow/SKILL.md`
5. **Offline Sync**:
   - Adhere to local-first Dexie mutations with background sync queue draining to FastAPI backend.
