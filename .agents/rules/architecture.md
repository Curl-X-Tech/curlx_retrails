# ReTrails Engineering Rules and Architecture Constraints

## 1. Style and Content Constraints
- **No Emojis**: Do not use emojis anywhere in the codebase, UI text, email templates, documentation, or commit messages.
- **No Jargon**: Avoid buzzwords, marketing hype, and unnecessary technical jargon. Keep explanations, comments, and copy direct, clear, and professional.

## 2. Tooling and Execution Standard
- **Python**: Exclusively use `uv` for python environments, dependencies (`uv.lock`), scripts, and running commands (`uv run ...`).
- **JavaScript / TypeScript**: Exclusively use `bun` for package management (`bun.lockb`), scripts (`bun run ...`), and testing.

## 3. Cross-Platform PWA and Offline Capability
- The application must function whether online or completely offline.
- Data must be persisted locally using Dexie.js (IndexedDB).
- The PWA Service Worker must cache core application shell assets for zero-network boot.
- When network connectivity is restored, the synchronization engine must automatically flush pending mutations without data loss.

## 4. Database Resilience and Fallback
- Backend defaults to PostgreSQL for production/staging environments.
- Backend must support SQLite fallback via `USE_SQLITE=true` for zero-dependency local testing.
- Database migrations must be managed via Alembic.

## 5. Design and Aesthetics
- Use Tailwind CSS with dark-mode first design tokens.
- Maintain clean typography, responsive navigation, and clear text-based status indicators (e.g. "Online", "Syncing", "Offline").
