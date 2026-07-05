# Wisel Portal — Documentation Index

This `docs/` folder is a persistent reference for Claude Code (and human contributors) so the whole codebase doesn't need to be re-scanned every session. It captures architecture, data model, API surface, pages, and components as of **2026-07-05**.

**How to use this:** read the file relevant to the task before diving into code. These docs describe *why* things are structured a certain way and flag non-obvious behavior — they are not a substitute for reading the actual file when you need exact syntax, but they save you from re-discovering conventions, role-scoping patterns, and known quirks from scratch.

**Keep this in sync:** when you make a structural change (new route, new model field, new page, new role-gating rule), update the relevant doc in the same PR/commit. Stale docs are worse than no docs — if you notice a doc disagreeing with the code, trust the code and fix the doc.

## Files

- **[architecture.md](architecture.md)** — stack, folder layout, auth flow, routing, role-scoping conventions, external integrations (Google Sheets, AI chat).
- **[database.md](database.md)** — Prisma schema, model relationships, `category`/`source` field semantics, migration history, seed data.
- **[api-reference.md](api-reference.md)** — every `app/api/**/route.ts` endpoint: method, auth, input/output, business rules, side effects.
- **[features.md](features.md)** — every page/route under `app/`, its role-gating and data-fetching pattern, and the AI chat feature.
- **[components.md](components.md)** — every component in `components/dashboard/` (and the two shared hooks/UI primitives): props, responsibilities, API calls, gotchas.
- **[known-issues.md](known-issues.md)** — cross-cutting inconsistencies, known bugs, and magic strings/constants worth knowing before touching related code.

## One-paragraph orientation

Wisel Portal is a spare-parts/transaction management portal for John Deere dealer customers. Three roles: `customer` and `customer_user` (identical permissions — both see only their own tenant's data; `customer_user` is just an additional login for a customer that already has one, since one customer can now have multiple accounts) and `admin` (sees everything, manages master data). Core domain object is `Transaction` (a part purchase/repair/PM line item, or raw stock inventory), categorized `P` (PM) / `R` (Repair) / `S` (Stock). Stock transactions get allocated to specific units via `StockAssignment`. Data enters the system three ways: manual entry, Excel import, or an external provider sync (`POST /api/sync`, no auth). Every mutation fire-and-forgets a full export of transactions to a Google Sheet. There's also an in-dashboard AI chat (Groq/Llama) that can query the customer's own transaction data via tool-calling, and an external read-only API (`/api/customer/items`, API-key auth) for customers to pull their own data into other systems.
