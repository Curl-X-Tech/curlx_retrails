---
trigger: always_on
---

# Refactor Rules

- Behavior must stay identical. No new features.
- Output: be terse. No summaries or explanations. After edits reply only: "Done: <files>".
- Files under 300 lines, one responsibility each. Pages stay thin.
- Structure: frontend/src/features/<name>/{components,hooks,repo.ts,store.ts,types.ts}
- Reusable UI goes in components/shared. Never modify components/ui or types/domain.ts.
- Zustand = UI state only, with selectors. TanStack Query = server data. Dexie = local data, accessed only through repo files.
- Query Graphify before scanning directories.
- Validate with ./dev.sh typecheck after each change. Run ./dev.sh check before each commit.
- Read REFACTOR_PLAN.md before starting any phase.- Pages and components read data only through feature hooks (useOrders, useDeferrals, etc.). Never import from src/data/ in pages.
- Hooks return mock data today. Return shape must match the response types in docs/api-map.md and docs/schema/schema.sql.
- Mock data stays in src/data/, split by entity. Hooks are the only importers.
- Offline-marked endpoints in docs/api-map.md: leave Dexie code as is for now, do not move it.
  Terminal hangs: run commands as `timeout 120 ./dev.sh {parms} < /dev/null 2>&1 | tail -40`. If the output shows no errors, treat it as passed.

- API sources: docs/api-map.md (paths, roles, status) wins over docs/api-issues.json (payload contracts). docs/api-gaps.md lists pending endpoints and the mocks that cover them.
- Implemented in map = status live. Planned or gap = status pending (mock adapter).
- Line limit 300 applies to code. Mock data files (src/data/*, src/api/*/mock.ts and mock seed data) are exempt and may exceed 300 lines. Do not split them just for length.

