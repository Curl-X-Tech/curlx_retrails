# Refactor Rules
- Behavior must stay identical. No new features.
- Output: be terse. No summaries or explanations. After edits reply only: "Done: <files>".
- Files under 150 lines, one responsibility each. Pages stay thin.
- Structure: frontend/src/features/<name>/{components,hooks,repo.ts,store.ts,types.ts}
- Reusable UI goes in components/shared. Never modify components/ui or types/domain.ts.
- Zustand = UI state only, with selectors. TanStack Query = server data. Dexie = local data, accessed only through repo files.
- Query Graphify before scanning directories.
- Validate with ./dev.sh typecheck after each change. Run ./dev.sh check before each commit.
- Read REFACTOR_PLAN.md before starting any phase.
