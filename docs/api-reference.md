# API Reference (`app/api/**/route.ts`)

Two auth mechanisms are used, never combined in one route: **session** (`auth()` from `lib/auth.ts`, cookie/JWT-based, used by all web-UI-facing routes) and **API key** (`getCustomerFromApiKey()` from `lib/api-auth.ts`, `Authorization: Bearer wsl_...`, used only by `/api/customer/items`). `POST /api/sync` and `GET /api/test-export` have **no auth at all** — see [known-issues.md](known-issues.md).

## Auth

### `app/api/auth/[...nextauth]/route.ts`
`GET`, `POST` — direct re-export of NextAuth `handlers`. No custom code; all logic lives in `lib/auth.ts` (Credentials provider, JWT session shape `{id, role, customerAccount, customerName}`).

## Chat

### `POST /api/chat`
Runtime: `nodejs`. Auth: session required (plain-text `401` response, not JSON, if missing). Body: `{ messages: <AI SDK message array> }` (unvalidated). Runs `generateText` against Groq `llama-3.3-70b-versatile` with 4 registered tools (`query_transactions`, `get_summary_stats`, `get_stock_info`, `search_parts`, each wrapping a `lib/chat-tools.ts` function), `stopWhen: stepCountIs(5)`. Every tool's `execute` forcibly injects the session-derived `customerAccount` (`role === 'customer' ? customerAccount : null`), overriding anything the model supplies — customers cannot escalate scope via prompt injection. Response: `{ text }` (plain `Response.json`, not `NextResponse.json` — inconsistent with the rest of the API). `GROQ_API_KEY!` non-null assertion throws at runtime if unset. No streaming, no rate limiting.

## Customers

### `GET /api/customers`
Auth: session; `role === "customer"` → 403. Returns all `{ customerAccount, customerName }` sorted by name — used for admin picker dropdowns.

### `GET /api/customer/items` *(singular — external/tenant-facing, do not confuse with `/api/customers` above)*
Auth: **API key only** (`Bearer wsl_...`), no session path. Query params (all optional): `invoiceDateFrom`, `invoiceDateTo`, `packingSlipDateFrom`, `packingSlipDateTo` (`*To` shifted to end-of-day UTC; invalid dates silently ignored). Merges two Prisma queries — direct `Transaction` rows (excluding `category: "S"`) and `StockAssignment` rows (each priced as `stockTransaction.unitPrice * assignment.qty`, **not** the parent's stored `totalPrice`) — into one array shaped `{ type: "transaction"|"stock_assignment", id, deviceNumber, serialNumber, quotation, soNumber, poNumber, partNumber, axPartNumber, partName, qty, invoiceDate, unitPrice, totalPrice, category, notes, packingSlipDate }`, sorted by `invoiceDate` desc. `notes` is mapped from the DB's `check` column. `getCustomerFromApiKey` fire-and-forget updates `ApiKey.lastUsedAt` on every call.

## Transactions

### `GET/POST /api/transactions`
- **GET**: session required. Scoped by role (`customer` → own `customerAccount`, others → all), always excludes `category: "S"`. Returns selected fields ordered by `invoiceDate` desc.
- **POST**: session required, no role restriction. Body: single object or array. `resolvedAccount`: admins may set an arbitrary `customerAccount`; customers are always forced to their own. Creates with `source: "manual"` hard-coded, **no unit-existence check** (unlike import), **no `$transaction` batching** (partial failure mid-array possible). Fires `void exportToSheets()`. Returns `201`.

### `PATCH/DELETE /api/transactions/[id]`
Shared ownership helper only allows mutation when `source === "manual"` AND (admin, or customer owns the row) — everything else 404s, including provider/import rows (surfaced identically to "not found").
- **PATCH**: full-overwrite semantics — omitted fields become `null` (not skipped). `customerAccount` is never editable. Fires `exportToSheets()`.
- **DELETE**: soft delete (`isDeleted: true, deletedAt: now`). Fires `exportToSheets()`.

### `POST /api/transactions/import`
Multipart `file` (+ optional `customerAccount`, admin-only override). Session required, no role restriction (customers can import their own data). Header mapping is case-insensitive Indonesian/English labels (`"harga satuan"→unitPrice`, etc). **Category normalization**: `P/PM→P`, `R/REPAIR→R`, `S/STOCK→S` (case-insensitive); unrecognized non-empty value → row error, row skipped. **Date parsing**: handles Excel serial dates via `XLSX.SSF.parse_date_code`; string dates try strict ISO first, then a generic regex — ⚠️ the DD/MM vs MM/DD fallback logic's code and its own comment disagree on which format is assumed (see known-issues.md). Stock rows (`category "S"`) with no device number auto-get `deviceNumber: "WSL-000039232"`. **Referenced `deviceNumber` must already exist** in `Unit` or the row errors (no auto-create, unlike units import). Creates with `source: "import"`. Fires `exportToSheets()` only if `success > 0`. Returns `{ success, errors: {row, message}[], total }`.

## Sync

### `POST /api/sync`
**No auth whatsoever.** Body: JSON array of `{ externalId (required), soNumber?, quotation?, poNumber?, partNumber?, axPartNumber?, partName?, qty?, category?, invoiceDate?, packingSlipDate?, unitPrice?, totalPrice?, customerAccount?, deviceNumber? }`. Upserts by `externalId` in batches of 1000 (parallel `Promise.all` per batch), always setting `source: "provider"`; the update branch also resets `isDeleted: false, deletedAt: null` (resurrects previously-vanished rows that reappear). After upserting, **soft-deletes every `source: "provider"` row not present in this payload's `externalId` set** — this assumes each call is a complete global snapshot; a partial sync would incorrectly wipe out other rows. Writes a `SyncLog` entry (success or error). Fires `exportToSheets()` on success. Returns `{ success, upserted, softDeleted, durationMs }` or `500 { error }`.

## Test / diagnostics

### `GET /api/test-export`
**No auth.** Synchronously awaits `exportToSheets()` (unlike the fire-and-forget calls elsewhere) for manual debugging. Anyone can trigger a full Sheets export. Likely should be removed or gated before hardening.

## Stock assignments

### `GET/POST /api/stock-assignments`
- **GET**: session required; query param `transactionId` required. Loads parent transaction; 403 if customer doesn't own it, 404 if not found. Returns assignments for that transaction with `targetUnit` info.
- **POST**: session required. Body: `{ stockTransactionId, targetDeviceNumber, qty, category?, check?, packingSlipDate? }`. Validates `qty > 0`, `targetDeviceNumber !== "STOCK"`, parent exists and `category === "S"`, ownership. **Remaining-quantity guard**: `qty` cannot exceed `(transaction.qty ?? 0) - sum(existing assignments)`. Fires `exportToSheets()`. Returns `201`.

### `PATCH/DELETE /api/stock-assignments/[id]`
- **PATCH**: session + ownership check. **Partial update** (only provided fields change — contrast with the transactions PATCH which nulls omitted fields). Remaining-qty guard recomputed *excluding the assignment being edited itself*. Fires `exportToSheets()`.
- **DELETE**: session + ownership. **Hard delete** (contrast with `Transaction`'s soft delete). Fires `exportToSheets()`.

## Units

### `GET/POST /api/units`
- **GET**: session required, **no role gate, no customer scoping** — every authenticated user sees the full unit master list.
- **POST**: session + admin-only (`role === "customer"` → 403). Requires non-blank `deviceNumber`; explicit pre-check for uniqueness (409 if taken) rather than relying on the DB constraint error.

### `PATCH/DELETE /api/units/[id]`
Admin-only. The hardcoded placeholder unit `"WSL-000039232"` cannot be edited or deleted (403). DELETE also checks `_count.transactions` and blocks (409) if `> 0` — **but does not check `StockAssignment.targetDeviceNumber` usage**, so a unit could still be referenced there and get deleted anyway. Hard delete.

### `POST /api/units/import`
Admin-only (unlike transaction import). Multipart `file` only (no customer override field). Header mapping: `device number, serial number, fleet number, "model / tipe"/model`. **Upserts by `deviceNumber`** (create-or-update — contrast with transaction import, which requires the unit to pre-exist). `customerAccount` is never set/touched by this import path. Any thrown error during upsert is reported with a generic "conflicting serial number" message regardless of actual cause.

## Admin

### `GET/POST /api/admin/users`
Admin-only (`role !== "admin"` → 403 — note the stricter `!==` check vs. the `=== "customer"` pattern used elsewhere).
- **POST**: body `{ customerAccount, customerName, password, role }`, all required; 409 if account exists. Runs a `$transaction` that `upsert`s the `Customer` (⚠️ this **overwrites `customerName`** on an existing `Customer` even if a different name than before is submitted) then creates the `User`. `role` is not validated against an enum — any string is stored as-is.

### `PATCH/DELETE /api/admin/users/[id]`
Admin-only.
- **PATCH**: partial update (`customerName?`, `password?` re-hashed, `role?`); if none provided, the transaction array is empty (silent no-op) and the unchanged user is returned.
- **DELETE**: hard delete; blocks self-deletion (`400` if target account === caller's own). Does **not** delete the associated `Customer` row (can orphan it). Returns `{ ok: true }` — the one route using `ok` instead of `success`.

### `GET/POST /api/admin/api-keys`
Admin-only.
- **GET**: excludes the raw `key` value from `select` — list view never leaks secrets.
- **POST**: body `{ customerAccount, label }`; generates `key = "wsl_" + randomBytes(32).toString("hex")`. **This is the only response that ever includes the plaintext `key`** — must be captured client-side at creation time.

### `DELETE /api/admin/api-keys/[id]`
Admin-only. Hard delete only — no "revoke without delete" (`isActive` toggle) exposed anywhere despite the field existing on the model.

## Cross-cutting notes

See [known-issues.md](known-issues.md) for the full list of inconsistencies (response envelope shapes, soft vs. hard delete split, role-check strictness variance, etc.) observed while inventorying these routes.
