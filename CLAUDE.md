@AGENTS.md

# Project documentation

Before exploring the codebase from scratch, read the relevant file(s) in `docs/`:

- `docs/README.md` — index and one-paragraph orientation
- `docs/architecture.md` — stack, folder layout, auth flow, role-scoping conventions, external integrations
- `docs/database.md` — Prisma schema, model relationships, field semantics, migrations, seed data
- `docs/api-reference.md` — every API route: auth, input/output, business rules, side effects
- `docs/features.md` — every page/route, role gating, and the AI chat feature
- `docs/components.md` — every dashboard component: props, responsibilities, gotchas
- `docs/known-issues.md` — known bugs, inconsistencies, and magic strings/constants

These docs are maintained in-repo so they don't go stale relative to the code. If you find a doc disagreeing with the code, trust the code — then fix the doc in the same change.
