# AI Tool Disclosure

Statement of AI tool usage and human verification for the ReTrails platform by Team CurlX (Tech-Triathlon 2026 Phase 2 Hackathon).

---

## 1. Overall Approach

Team CurlX used AI tools primarily as an accelerator for code scaffolding, repetitive boilerplate, and documentation drafting while maintaining complete human ownership of the architecture and business logic. All database schemas, optimization constraints, API contracts, and offline synchronization mechanisms were designed, reviewed, and validated by human team members. Every AI-assisted contribution was inspected for correctness, tested against unit and integration suites, and subjected to automated quality checks.

---

## 2. Work Area Disclosure Table

| Work Area | AI-Assisted (Yes/No) | Tool | How Used | Human Review and Verification |
|---|---|---|---|---|
| **System Architecture** | Yes | Antigravity IDE (Gemini / Claude models) | Initial brainstorming of decoupled layered structure and drafting Mermaid component diagrams. | Team members defined all service boundaries, offline synchronization protocols, and Docker network topology. |
| **Database Schema Design** | No | None | Hand-crafted canonical PostgreSQL schema (`docs/schema/schema.sql`) and constraints. | Full human design ensuring relational integrity, check constraints, foreign keys, and audit triggers. |
| **Allocation Engine & Constraints** | Yes | Antigravity IDE (Gemini model) | Scaffolding initial Google OR-Tools CP-SAT model structure and constraint variables. | Human engineers formulated all mathematical penalty functions, reefer/mall rules, time budget tables, and deferral handling. |
| **Backend REST APIs** | Yes | Antigravity IDE (Claude model) | Generating repetitive FastAPI CRUD route handlers and Pydantic validation schemas. | Verified all role authorization guards, tenant scoping logic, and error status code compliance. |
| **Offline Sync Engine** | No | None | Hand-written Dexie.js schema, mutation queue manager, and batch drain worker. | 100% human-designed offline state machine, idempotency key strategy, and exponential backoff retry. |
| **Frontend UI Components** | Yes | Antigravity IDE (Claude model) | Scaffolding initial Tailwind CSS layout cards, responsive grid structures, and icons. | Refined into custom 4-tier enterprise design system, tuned contrast ratios, and removed all generic template presets. |
| **Automated Testing** | Yes | Antigravity IDE (Gemini model) | Generating boundary test case variations for allocation capacity and order state transitions. | Human validation of test assertion logic, mock fixtures, and execution of `./dev.sh check` pre-commit gate. |
| **Documentation Package** | Yes | Antigravity IDE (Gemini / Claude models) | Drafting markdown files based on repository source inspection and schema specifications. | Manually verified against actual codebase; removed inaccurate claims. |
