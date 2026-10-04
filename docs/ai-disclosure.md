# AI Tool Disclosure

**Project**: ReTrails — Team CurlX
**Competition**: Tech-Triathlon 2026 — The Intelligent Enterprise, Phase 2 (Hackathon)

---

## AI Tools Used

[INSERT ACTUAL TOOLS — replace this list with the tools your team actually used]

Examples (replace or remove as applicable):
- Antigravity IDE (Google DeepMind) — AI coding assistant
- GitHub Copilot — inline code completion
- Claude (Anthropic) — code generation, documentation drafting
- ChatGPT (OpenAI) — architecture brainstorming, debugging assistance

---

## Purpose and Usage

### Code Generation

[Describe what code was generated or scaffolded with AI assistance. Be specific about which modules or files were primarily AI-generated versus human-written.]

### Documentation

The hackathon documentation package (`docs/01-*.md` through `docs/14-*.md`, `docs/ai-disclosure.md`) was drafted with Antigravity (Google DeepMind AI coding assistant). The assistant read the actual source code, schema, router files, and service implementations before generating the documentation. All content describes the actual implemented system and does not include invented features.

### Debugging

[Describe debugging sessions where AI was used.]

### Architecture Brainstorming

[Describe design decisions where AI was consulted.]

### UI Design

[Describe whether AI was used for UI design decisions or component generation.]

### Testing

[Describe whether AI was used to generate test cases or test code.]

---

## Human Contribution

The following was designed, implemented, tested, reviewed, and validated by the team members:

- Database schema design (`docs/schema/schema.sql`) — all entities, relationships, constraints, triggers, and views
- Allocation engine logic — feasibility rules, time budget formulas, deferral handling
- Offline sync architecture — Dexie schema, queue design, drain flow, idempotency strategy
- Backend service layer — order service, allocation engine orchestrator, delivery service, trip views
- Frontend role-based pages and UI component library
- Docker Compose multi-service configuration
- Seed data and seed engine

[Adjust this list to accurately reflect the team's actual contributions.]

---

## Validation

All AI-generated or AI-assisted output was reviewed and validated by team members as follows:

- Documentation was checked against the actual source code to ensure accuracy. Placeholder values (`[TO BE COMPLETED]`, `[INSERT ...]`) are used where information was not available at documentation time rather than fabricating content.
- Generated code was reviewed for correctness, adherence to project coding standards (`AGENTS.md`), and compatibility with the existing architecture before being committed.
- `./dev.sh check` (lint, format, typecheck, tests) was run on all committed code to ensure quality gates were passed.

---

## Disclosure Statement

The team used AI assistance as a productivity tool during development and documentation. All architectural decisions, domain model design, business logic implementation, and validation were performed by the human team members. AI-generated content was treated as a starting point requiring human review, not as a finished product.
