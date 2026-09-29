# Code Quality and Commit Guidelines for ReTrails

## 1. Commit Message Standards
- **Concise & Direct**: Keep the subject line short (under 72 characters), exact, and descriptive.
- **Conventional Commits**: Use conventional prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `test:`, `ci:`.
- **No Emojis**: Do not use emojis in commit messages.
- **No Jargon**: Avoid fluff or marketing phrases; describe the exact technical change.

## 2. Dev Automation & Task Execution
Always use `./dev.sh` to run, test, lint, format, and check tasks across the repository:
- `./dev.sh check`: Runs full linting, formatting validation, type checking, and tests.
- `./dev.sh test`: Runs test suite across services.
- `./dev.sh lint`: Runs linter across backend, frontend, and packages.
- `./dev.sh format`: Formats code across all workspaces.
- `./dev.sh typecheck`: Typechecks TypeScript and Python codebases.
- `./dev.sh dev`: Runs local dev servers concurrently.

## 3. Mandatory Pre-Commit Validation
Before committing any changes to the repository, all quality checks MUST pass cleanly:
- Run `./dev.sh check` to execute lint, format checks, type checking, and tests in sequence.
- Any failure blocks the commit.

## 4. UI Components Protection
- Never overwrite or clobber existing custom UI components in `frontend/src/components/ui/` with stock CLI presets or templates. Preserve bespoke refinements and design tokens.

