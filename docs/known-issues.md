# Known Issues & Inconsistencies

Cross-cutting quirks discovered while documenting the codebase (2026-07-05). None of these block normal feature work, but check here before "fixing" something that turns out to be a pre-existing, deliberate-looking pattern — or before copying a pattern that's actually a bug.

## Fixed

- **Excel import category mismatch** (fixed 2026-07-05, commit `44eac4e`): `/api/transactions/import` used to uppercase the Category cell verbatim, so a full word like `"Repair"` was stored as `"REPAIR"` instead of the single-letter code `"R"` that `TransactionKpiCards` and the Stock page filter on. Rows imported "successfully" but were invisible to KPI cards/Stock view even after a hard refresh. Fixed by adding a `CATEGORY_MAP` normalization (`PM/P→P`, `REPAIR/R→R`, `STOCK/S→S`) plus a rejection error for unrecognized values; the downloadable template was also updated to show all three category words. Data already imported with the wrong category had to be corrected manually in the DB.

## Open / unfixed

- **`StockTab.tsx` doesn't resync from server props**: `useState<StockRow[]>(initialTransactions)` seeds once on mount with no `useEffect` to follow prop changes. If the underlying data changes (e.g. an import on another tab) and the user navigates back without a full page reload, the Stock page's table/KPI can show stale numbers. Fix direction: `useEffect(() => setTransactions(initialTransactions), [initialTransactions])`.
- **`SessionTimeout.tsx` comment vs. code disagree**: comment says "30 minutes", the actual constant `TIMEOUT_MS = 600 * 60 * 1000` is 10 hours. If a user reports "I wasn't logged out after 30 min of idling," this is why — that's expected per the code, not a bug, but the comment is misleading.
- **`transactions/import` date-parsing fallback ambiguity**: the regex fallback branch's inline comment says "assume MM/DD/YYYY (Excel default)" but the actual return expression treats the first captured group as day and the second as month (`DD/MM/YYYY`-style). Worth a real test against an actual ambiguous-format Excel file (e.g. `03/04/2026`) before trusting either the comment or the code blindly.
- **Inconsistent client-side resync-after-mutation strategy**: several "Tab" components seed local state from server props once and never resync; some of their own mutation handlers call `router.refresh()`, others only patch local state optimistically, inconsistently even within the same file:
  - `ApiKeysTab`: revoke calls `router.refresh()`, create does not.
  - `UsersTab`: create skips `router.refresh()`, update/delete both call it.
  - `OrdersTab` is the model to follow: it never copies the `transactions` prop into local state at all, so `router.refresh()` alone is always sufficient.
- **No auth on two routes**: `POST /api/sync` and `GET /api/test-export` have zero authentication. `/api/sync` is presumably meant to be called by a trusted internal job (network-level trust), and `/api/test-export` looks like a leftover dev diagnostic. Both should be reviewed before any public/internet-facing deployment — as written, anyone who discovers either URL can inject/soft-delete transaction data or trigger a full Google Sheets export.
- **`/api/sync` assumes a complete global snapshot**: it soft-deletes any `source: "provider"` row missing from the current payload, with no per-customer scoping on that diff. A sync call that only includes a subset of customers (intentionally or due to a bug upstream) will incorrectly soft-delete every other customer's provider-sourced rows.
- **Referential-integrity gap on unit deletion**: `DELETE /api/units/[id]` blocks deletion if `_count.transactions > 0`, but does not check `StockAssignment.targetDeviceNumber` — a unit referenced only via stock assignments (not direct transactions) can still be deleted, potentially orphaning those assignment rows.
- **`getStockInfo` (in `lib/chat-tools.ts`) filters in-memory instead of at the query level**: it fetches up to 30 `StockAssignment` rows unfiltered by customer, then discards non-matching ones in JS when scoped to a customer — functionally correct but inconsistent with the other three chat tools (`queryTransactions`, `getSummaryStats`, `searchParts`), which all filter via the Prisma `where` clause. Worth aligning if this function is extended.
- **`components/ui/button.tsx` (shadcn `Button`) is effectively unused** by `components/dashboard/*` — every dashboard component hand-rolls its own `<button>` with inline Tailwind and the hardcoded John Deere green (`#367C2B`/`#2d6423`) instead of using the shared primitive's `variant`/`size` props. Not a bug, but don't assume introducing a new dashboard button should use `<Button>` just because it exists — check the surrounding file's existing convention first.
- **`ProfileTab`'s "Change Password" form is non-functional** — no fetch call anywhere, just a local 3-second "saved" flag. There is no password-change API route at all.
- **`StatusBadge`/`STATUS_MAP`** (`components/dashboard/StatusBadge.tsx` + `data/customer.ts`) isn't referenced by any component covered during this documentation pass — confirm it's still in use (or find its actual caller) before assuming it's dead code.

## Inconsistent-by-design (not necessarily worth "fixing", but know about it)

- **Response envelope shapes vary across routes**: most use `{ error: "..." }` / `{ success: true }`, but `admin/users/[id]` DELETE returns `{ ok: true }`, and `/api/chat` returns plain `Response`/`{ text }` instead of `NextResponse.json`.
- **Soft-delete vs. hard-delete split**: `Transaction` is always soft-deleted (`isDeleted`/`deletedAt`); `Unit`, `StockAssignment`, `ApiKey`, `User` are all hard-deleted. If you're adding a new deletable model, decide deliberately which pattern fits rather than copying the nearest example.
- **Role-check strictness varies**: some routes/pages block only `role === "customer"` (anything else, including a hypothetical future third role, passes through as "admin-like"); `/users` and `/api/admin/users` require `role === "admin"` exactly (strict allow-list). If a third role is ever introduced, audit every `=== "customer"` check — they'll silently treat the new role as admin-equivalent.
- **`PATCH /api/transactions/[id]` nulls omitted fields** (full-overwrite semantics) while **`PATCH /api/stock-assignments/[id]` only updates provided fields** (partial-update semantics). Know which one you're calling before omitting a field you meant to preserve.
- **`exportToSheets()` only mirrors `Transaction`/`StockAssignment`** — it is never triggered by `Unit`, `User`, or `ApiKey` mutations, so the Google Sheet is not a full database mirror.
- **`ImportModal.onImported()` only fires when `result.success > 0`** — a fully-failed import (all rows errored) never triggers the parent's `router.refresh()`/state update. This is usually fine (nothing changed server-side to refresh), but don't rely on `onImported` firing as a proxy for "the import request completed."

## Magic strings to grep for before renaming/removing

- `"WSL-000039232"` — hardcoded stock-placeholder `Unit.deviceNumber`, referenced in `app/api/units/[id]/route.ts` (immutable) and `app/api/transactions/import/route.ts` (auto-assigned).
- `"STOCK"` (device number sentinel, distinct from the above) — rejected as a `targetDeviceNumber` in `app/api/stock-assignments/route.ts` and `[id]/route.ts`; also happens to be the seeded `Unit.deviceNumber` in `prisma/seed.ts` (a third, coincidentally-named thing — don't conflate the seed unit with the sentinel check).
- Category codes `"P"`/`"R"`/`"S"` — single source of truth for the accepted words is `CATEGORY_MAP` in `app/api/transactions/import/route.ts`; every other place that reads `category` expects it to already be one of these three letters.
