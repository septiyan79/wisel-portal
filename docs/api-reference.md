# API Reference (`app/api/**/route.ts`)

Two auth mechanisms are used, never combined in one route: **session** (`auth()` from `lib/auth.ts`, cookie/JWT-based, used by all web-UI-facing routes) and **API key** (`getCustomerFromApiKey()` from `lib/api-auth.ts`, `Authorization: Bearer wsl_...`, used only by `/api/customer/items`). `POST /api/sync` and `GET /api/test-export` have **no auth at all** — see [known-issues.md](known-issues.md).

## Auth

### `app/api/auth/[...nextauth]/route.ts`
`GET`, `POST` — direct re-export of NextAuth `handlers`. No custom code; all logic lives in `lib/auth.ts` (Credentials provider — login field is `username`, not `customerAccount`; JWT session shape `{id, username, role, customerAccount, customerName}`).

## Chat

### `POST /api/chat`
Runtime: `nodejs`. Auth: session required (plain-text `401` response, not JSON, if missing). Body: `{ messages: <AI SDK message array> }` (unvalidated). Runs `generateText` against Groq `llama-3.3-70b-versatile` with 4 registered tools (`query_transactions`, `get_summary_stats`, `get_stock_info`, `search_parts`, each wrapping a `lib/chat-tools.ts` function), `stopWhen: stepCountIs(5)`. Every tool's `execute` forcibly injects the session-derived `customerAccount` (`role !== 'admin' ? customerAccount : null`), overriding anything the model supplies — customers (and `customer_user` accounts) cannot escalate scope via prompt injection. Response: `{ text }` (plain `Response.json`, not `NextResponse.json` — inconsistent with the rest of the API). `GROQ_API_KEY!` non-null assertion throws at runtime if unset. No streaming, no rate limiting.

## Customers

### `GET /api/customers`
Auth: session; `role !== "admin"` → 403. Returns `{ customerAccount, customerName }` sorted by name for every customer **except the admin tenant** (`where: { users: { none: { role: "admin" } } }`, added 2026-07-05 — filters by relation rather than a hardcoded `customerAccount === "ADMIN"` string, so it still works if the admin tenant is ever recreated under a different Account ID) — used for admin picker dropdowns (`TransactionFormModal`, `ImportModal`, `OrdersTab`'s filter, and `UsersTab`'s Add/Edit User "Account ID" dropdown), none of which should ever show or target the admin tenant. Not to be confused with `/api/admin/customers` (below), which is the full admin/CRUD version with per-customer counts (including the admin tenant), used only by `CustomersTab`.

### `GET /api/customer/items` *(singular — external/tenant-facing, do not confuse with `/api/customers` above)*
Auth: **API key only** (`Bearer wsl_...`), no session path. Query params (all optional): `invoiceDateFrom`, `invoiceDateTo`, `packingSlipDateFrom`, `packingSlipDateTo` (`*To` shifted to end-of-day UTC; invalid dates silently ignored). Merges two Prisma queries — direct `Transaction` rows (excluding `category: "S"`) and `StockAssignment` rows (each priced as `stockTransaction.unitPrice * assignment.qty`, **not** the parent's stored `totalPrice`) — into one array shaped `{ type: "transaction"|"stock_assignment", id, deviceNumber, serialNumber, quotation, soNumber, poNumber, partNumber, axPartNumber, partName, qty, invoiceDate, unitPrice, totalPrice, category, notes, packingSlipDate }`, sorted by `invoiceDate` desc. `notes` is mapped from the DB's `check` column. `getCustomerFromApiKey` fire-and-forget updates `ApiKey.lastUsedAt` on every call.

## Transactions

### `GET/POST /api/transactions`
- **GET**: session required. Scoped by role (non-admin → own `customerAccount`, admin → all), always excludes `category: "S"`. Returns selected fields ordered by `invoiceDate` desc.
- **POST**: session required, no role restriction. Body: single object or array. `resolvedAccount`: only `role === "admin"` may set an arbitrary `customerAccount`; everyone else (`customer` and `customer_user` alike) is always forced to their own. **Since 2026-07-05**: if `deviceNumber` is set, validates via `lib/unit-validation.ts` `validateUnitOwnership()` that the unit exists *and* belongs to `resolvedAccount` — all items in the array are validated before any are created (400 aborts the whole request, nothing is written). Creates with `source: "manual"` hard-coded, **no `$transaction` batching** (partial failure mid-array still possible once past validation). Fires `void exportToSheets()`. Returns `201`.

### `PATCH/DELETE /api/transactions/[id]`
Shared ownership helper only allows mutation when `source === "manual"` AND (admin, or customer owns the row) — everything else 404s, including provider/import rows (surfaced identically to "not found").
- **PATCH**: full-overwrite semantics — omitted fields become `null` (not skipped). `customerAccount` is never editable. **Since 2026-07-05**: if `deviceNumber` is set, validates it belongs to the transaction's own (immutable) `customerAccount` via `validateUnitOwnership()` — 400 if not. Fires `exportToSheets()`.
- **DELETE**: soft delete (`isDeleted: true, deletedAt: now`). Fires `exportToSheets()`.

### `POST /api/transactions/import`
Multipart `file` (+ optional `customerAccount`, admin-only override). Session required, no role restriction (customers can import their own data). Header mapping is case-insensitive Indonesian/English labels (`"harga satuan"→unitPrice`, etc). **Category normalization**: `P/PM→P`, `R/REPAIR→R`, `S/STOCK→S` (case-insensitive); unrecognized non-empty value → row error, row skipped. **Date parsing**: handles Excel serial dates via `XLSX.SSF.parse_date_code`; string dates try strict ISO first, then a generic regex — ⚠️ the DD/MM vs MM/DD fallback logic's code and its own comment disagree on which format is assumed (see known-issues.md). Stock rows (`category "S"`) with no device number auto-get `deviceNumber: SYSTEM_STOCK_DEVICE` (`"WSL-000039232"`). **Referenced `deviceNumber` must exist and belong to `resolvedAccount`** (via `validateUnitOwnership()`, since 2026-07-05) or the row errors — **except** `SYSTEM_STOCK_DEVICE`, which is only existence-checked (it's a shared bucket, not owned by one customer; see known-issues.md). No auto-create of units (unlike units import). Creates with `source: "import"`. Fires `exportToSheets()` only if `success > 0`. Returns `{ success, errors: {row, message}[], total }`.

## Sync

### `POST /api/sync`
**No auth whatsoever.** Body: JSON array of `{ externalId (required), soNumber?, quotation?, poNumber?, partNumber?, axPartNumber?, partName?, qty?, category?, invoiceDate?, packingSlipDate?, unitPrice?, totalPrice?, customerAccount?, deviceNumber? }`. Upserts by `externalId` in batches of 1000 (parallel `Promise.all` per batch), always setting `source: "provider"`; the update branch also resets `isDeleted: false, deletedAt: null` (resurrects previously-vanished rows that reappear). After upserting, **soft-deletes every `source: "provider"` row not present in this payload's `externalId` set** — this assumes each call is a complete global snapshot; a partial sync would incorrectly wipe out other rows. Writes a `SyncLog` entry (success or error). Fires `exportToSheets()` on success. Returns `{ success, upserted, softDeleted, durationMs }` or `500 { error }`.

## Test / diagnostics

### `GET /api/test-export`
**No auth.** Synchronously awaits `exportToSheets()` (unlike the fire-and-forget calls elsewhere) for manual debugging. Anyone can trigger a full Sheets export. Likely should be removed or gated before hardening.

## Stock assignments

### `GET/POST /api/stock-assignments`
- **GET**: session required; query param `transactionId` required. Loads parent transaction; 403 if customer doesn't own it, 404 if not found. Returns assignments for that transaction with `targetUnit` info.
- **POST**: session required. Body: `{ stockTransactionId, targetDeviceNumber, qty, category?, check?, packingSlipDate? }`. Validates `qty > 0`, `targetDeviceNumber !== "STOCK"`, parent exists and `category === "S"`, ownership, and (since 2026-07-05) that `targetDeviceNumber` belongs to the same `customerAccount` as the parent stock transaction via `validateUnitOwnership()` (400 if not — previously an invalid/foreign device would either silently attach or throw an unhandled FK error). **Remaining-quantity guard**: `qty` cannot exceed `(transaction.qty ?? 0) - sum(existing assignments)`. Fires `exportToSheets()`. Returns `201`.

### `PATCH/DELETE /api/stock-assignments/[id]`
- **PATCH**: session + ownership check. **Partial update** (only provided fields change — contrast with the transactions PATCH which nulls omitted fields). If `targetDeviceNumber` is being changed, validates ownership against the parent stock transaction's `customerAccount` (since 2026-07-05, same as POST). Remaining-qty guard recomputed *excluding the assignment being edited itself*. Fires `exportToSheets()`.
- **DELETE**: session + ownership. **Hard delete** (contrast with `Transaction`'s soft delete). Fires `exportToSheets()`.

## Units

### `GET/POST /api/units`
- **GET**: session required. **Scoped since 2026-07-05**: `role !== "admin"` → only units where `customerAccount` matches their own; admin → full list.
- **POST**: session + admin-only (`role !== "admin"` → 403). Requires non-blank `deviceNumber` **and** non-blank `customerAccount` (400 if either missing; 404 if `customerAccount` doesn't match an existing `Customer`). Explicit pre-check for `deviceNumber` uniqueness (409 if taken) rather than relying on the DB constraint error.

### `PATCH/DELETE /api/units/[id]`
Admin-only. `customerAccount` is required on PATCH too (same 400/404 validation as POST) — a unit can be reassigned to a different customer this way, but not unassigned. The hardcoded placeholder unit `"WSL-000039232"` cannot be edited or deleted (403). DELETE also checks `_count.transactions` and blocks (409) if `> 0` — **but does not check `StockAssignment.targetDeviceNumber` usage**, so a unit could still be referenced there and get deleted anyway. Hard delete.

### `POST /api/units/import`
Admin-only (unlike transaction import). Multipart `file` only. Header mapping: `device number, serial number, fleet number, "model / tipe"/model, "customer account"/customer → customerAccount` (customer column added 2026-07-05). **Upserts by `deviceNumber`** (create-or-update — contrast with transaction import, which requires the unit to pre-exist); `customerAccount` is required per row and validated against the `Customer` table (row errors if missing/unrecognized) and is updated on every re-import, so re-uploading with a different `Customer Account` for an existing `deviceNumber` is the bulk way to reassign a unit's owner. Any thrown error during upsert is reported with a generic "conflicting serial number" message regardless of actual cause.

## Admin

### `GET/POST /api/admin/users`
Admin-only (`role !== "admin"` → 403).
- **POST**: body `{ username, customerAccount, password, role }`, all required. 409 if **`username`** already exists (`username` is the unique login identity — `customerAccount` is not, since 2026-07-05). **Since 2026-07-05, `customerAccount` must already exist** — looked up via `prisma.customer.findUnique`, 404 `"Customer not found — create it on the Customers page first"` if not. Customers are no longer created implicitly from this route (see `/api/admin/customers` below); `customerName` is looked up from the existing `Customer` row for the response, not accepted in the request body at all. **`role: "admin"` is capped at one account system-wide**: if any `User` already has `role === "admin"`, a second admin request 409s with `"Only one admin account is allowed"`. `"customer"`/`"customer_user"` have no such cap — any number of each is allowed per `customerAccount`; passing an existing `customerAccount` with a new `username` is the supported way to add a second login (typically `role: "customer_user"`) to a tenant that already has one. Beyond the admin cap, `role` is not validated against an enum — any string is stored as-is (convention: `"customer"` | `"customer_user"` | `"admin"`).

### `PATCH/DELETE /api/admin/users/[id]`
Admin-only.
- **PATCH**: partial update, body `{ password?, role? }` — **no longer accepts `customerName`** (since 2026-07-05; renaming a company now only happens via `/api/admin/customers/[id]`, since one `customerAccount` can have several `User` rows and letting any of them rename the shared tenant was judged too risky to keep). If neither field is provided, it's a silent no-op and the unchanged user is returned. The admin role is fully locked in both directions: **demoting the existing admin** (`user.role === "admin"` and a different `role` is requested) is rejected (400 `"The admin account's role cannot be changed"`), and **promoting a second user to admin** is rejected (409 `"Only one admin account is allowed"`) if a *different* `User` already has that role — checked via `findFirst({ role: "admin", NOT: { id } })` so re-saving the existing admin's own other fields (password, etc.) doesn't trip the promotion check. `UsersTab` mirrors both: it disables all three role buttons when editing the admin account itself, and disables just the "Admin" button (showing whose account already holds it) when editing anyone else.
- **DELETE**: hard delete. Rejects deleting any `role: "admin"` user outright (400 `"Admin accounts cannot be deleted"`, checked before the self-deletion check) — since only an admin can promote someone else to admin and the role is capped at one, allowing deletion would risk locking everyone out of `/users`/`/api-keys`/`/units`/`/customers`. Also blocks self-deletion by comparing `User.id` (not `customerAccount`, since that's no longer unique to one login) against the caller's session — relevant for non-admin roles. Does **not** delete the associated `Customer` row. Returns `{ ok: true }` — the one route using `ok` instead of `success`.

### `GET/POST /api/admin/customers`
Admin-only (`role !== "admin"` → 403). Added 2026-07-05 as the dedicated place to manage tenants, now that `/api/admin/users` no longer creates or renames a `Customer` implicitly.
- **GET**: returns every `Customer` with `{ id, customerAccount, customerName, createdAt, userCount, unitCount, transactionCount, apiKeyCount }` (the four counts are `_count` of the respective relations) — used by `CustomersTab` to decide whether Delete is allowed.
- **POST**: body `{ customerAccount, customerName }`, both required; 409 if `customerAccount` already exists. Plain `create` (no upsert) — this is now the *only* way to create a new tenant.

### `PATCH/DELETE /api/admin/customers/[id]`
Admin-only.
- **PATCH**: body `{ customerName }`, required. `customerAccount` is immutable (consistent with every other identifier field in this app — Device Number, Username, etc.).
- **DELETE**: blocked (409) with a message listing which counts are non-zero if the customer has any linked `User`, `Unit`, `Transaction`, or `ApiKey` rows — mirrors the `_count.transactions` guard pattern already used by `DELETE /api/units/[id]`. Otherwise hard delete.

### `GET/POST /api/admin/api-keys`
Admin-only.
- **GET**: excludes the raw `key` value from `select` — list view never leaks secrets.
- **POST**: body `{ customerAccount, label }`; generates `key = "wsl_" + randomBytes(32).toString("hex")`. **This is the only response that ever includes the plaintext `key`** — must be captured client-side at creation time.

### `DELETE /api/admin/api-keys/[id]`
Admin-only. Hard delete only — no "revoke without delete" (`isActive` toggle) exposed anywhere despite the field existing on the model.

## Cross-cutting notes

See [known-issues.md](known-issues.md) for the full list of inconsistencies (response envelope shapes, soft vs. hard delete split, role-check strictness variance, etc.) observed while inventorying these routes.
