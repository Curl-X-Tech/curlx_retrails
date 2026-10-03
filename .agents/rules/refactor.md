---
trigger: always_on
---

# Refactor Rules

- Behavior must stay identical. No new features.
- Output: be terse. No summaries or explanations. After edits reply only: "Done: <files>".
- Files under 150 lines, one responsibility each. Pages stay thin.
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
- API layer lives in src/api/<domain>/{types,api,hooks,mock}.ts. Every endpoint in docs/api-map.md and docs/api-issues.json gets a function and a hook, even if no page uses it yet.
- All paths come from src/api/endpoints.ts. No path strings elsewhere.
- Endpoint status: live = calls the backend. pending = uses mock.ts adapter until backend ships. Flip status to go live; no other code changes.
- Pages and features import only hooks from @/api/<domain>. Never import from src/data/ or call fetch directly.
- Offline-marked endpoints: the mutation hook writes to Dexie with idempotency_key (UUID v4) and enqueues for POST /sync/batch.
- Event timestamps are UTC ISO strings. TIME and DATE fields stay plain strings.
- Types follow docs/schema/schema.sql and the issue contracts. Mismatches go to docs/api-gaps.md.
