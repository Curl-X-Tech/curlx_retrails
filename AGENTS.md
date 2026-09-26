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
4. **Workflow Skills & Quality Rules**:
   - Inspect `.agents/skills/curlx-stack-guide/SKILL.md`
   - Inspect `.agents/skills/fastapi/SKILL.md`
   - Inspect `.agents/skills/sqlmodel/SKILL.md`
   - Inspect `.agents/skills/library-skills/SKILL.md`
   - Inspect `.agents/skills/react-tailwind-workflow/SKILL.md`
   - Inspect `.agents/rules/code_quality.md`
5. **Offline Sync**:
   - Adhere to local-first Dexie mutations with background sync queue draining to FastAPI backend.
6. **Pre-Commit Verification**:
   - Every commit must pass `./dev.sh check` (linting, formatting, type checking, and tests).
7. **Commit Messages**:
   - Keep messages short, exact, and concise (under 72 chars, conventional commits prefix).
