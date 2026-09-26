# Code Quality and Commit Guidelines for ReTrails

## 1. Commit Message Standards
- **Concise & Direct**: Keep the subject line short (under 72 characters), exact, and descriptive.
- **Conventional Commits**: Use conventional prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `test:`, `ci:`.
- **No Emojis**: Do not use emojis in commit messages.
- **No Jargon**: Avoid fluff or marketing phrases; describe the exact technical change.

## 2. Mandatory Pre-Commit Validation
Before committing any changes to the repository, all quality checks MUST pass cleanly:

1. **Linting**:
   - Backend: `cd backend && uv run ruff check .`
   - Frontend: `cd frontend && bun run lint`
   - Command: `./dev.sh lint`

2. **Formatting**:
   - Backend: `cd backend && uv run ruff format .`
   - Frontend: `cd frontend && bun run format`
   - Emails: `cd packages/emails && bun run format`
   - Command: `./dev.sh format`

3. **Type Checking**:
   - Frontend: `cd frontend && bun run typecheck`
   - Emails: `cd packages/emails && bun run typecheck`
   - Command: `./dev.sh typecheck`

4. **Testing**:
   - Backend: `cd backend && uv run pytest`
   - Command: `./dev.sh test`

5. **All-in-One Check**:
   - Run `./dev.sh check` to execute lint, format checks, type checking, and tests in sequence.
   - Any failure blocks the commit.
