# Dashboard Components (`components/dashboard/*.tsx`)

All are client components (`"use client"`) unless noted otherwise.

## `ApiDocsPanel.tsx`
Props: `{ baseUrl: string }`. Interactive right-column of the `/docs` page: a language-tabbed (cURL/JS/Python/PHP) code-sample generator for `GET /api/customer/items`, plus a "Try it out" live tester that does a real `fetch` with a user-pasted API key. Generated snippets hardcode a placeholder key `wsl_your_api_key_here` (not the real typed key). Network errors are swallowed into a fake `{status: 0}` result.

## `ApiKeysTab.tsx`
Props: `{ initialKeys: ApiKeyRow[]; customers: CustomerOption[] }`. Admin API-key management UI. Local `keys` state seeded from `initialKeys` (no resync on prop change). Internal `GenerateModal` and `KeyRevealModal` (one-time plaintext key display) sub-components. Calls `POST /api/admin/api-keys` and `DELETE /api/admin/api-keys/:id`. **Gotcha**: revoke calls `router.refresh()`, create does not (relies on local `setKeys` prepend only) — inconsistent resync.

## `ConfirmModal.tsx`
Props: `{ title, message, confirmLabel?, confirmVariant?: "danger"|"warning", loading?, onConfirm, onCancel }`. Generic reusable confirmation dialog, no internal state. Used by `ApiKeysTab`, `DashboardNavbar`, `OrdersTab`, `UnitsTab`, `UsersTab`.

## `CustomersTab.tsx`
Props: `{ initialCustomers: CustomerRow[] }` (`CustomerRow` includes `userCount`/`unitCount`/`transactionCount`/`apiKeyCount`, each a Prisma `_count`). Added 2026-07-05 as the dedicated tenant-management page (`/customers`), now that `POST /api/admin/users` no longer creates/renames a `Customer` implicitly. Table + `CustomerFormModal`: create requires `customerAccount` (auto-uppercased, immutable after creation) + `customerName`; edit only allows changing `customerName`. Delete button is disabled client-side (with a tooltip) whenever any of the four counts is non-zero, mirroring the server-side guard in `DELETE /api/admin/customers/[id]`. Follows the same local-state-seeded-from-props pattern as `UnitsTab`/`UsersTab` (create prepends locally without `router.refresh()`, update/delete do refresh/filter).

## `DashboardNavbar.tsx`
Props: `{ customerAccount, customerName, role }`. Top header/nav. Nav items sourced from `data/customer.ts`: `NAV_ITEMS` for `role !== "admin"` (i.e. both `"customer"` and `"customer_user"`), `ADMIN_NAV_ITEMS` otherwise — the primary role-conditional nav rendering point. Calls `signOut({ redirectTo: "/login" })` on confirmed logout via `ConfirmModal`. "New Part Search"/cart/help/settings are static non-functional placeholders (cart badge hardcoded `0`).

## `ImportModal.tsx`
Props: `{ type: "transactions"|"units"; role?; customers?: CustomerOption[]; onClose, onImported }`. Generic Excel import dialog reused for both entity types. "Download Template" builds an `.xlsx` client-side via the `xlsx` package from hardcoded sample rows (transaction template's `Category` examples: `PM`/`Repair`/`Stock`, matching the server-side normalization). Admin-only "on behalf of" customer picker (transactions only). Posts multipart `FormData` to `/api/transactions/import` or `/api/units/import`. **Gotcha**: `onImported()` only fires if `result.success > 0` — a fully-failed import never triggers the parent's refresh; a partial success/failure mix shows no "Try Again" button (only fully-failed does).

## `OrderDetailModal.tsx`
Props: `{ transaction: TransactionRow; onClose }`. Read-only field-by-field detail view. Formats currency (`Intl.NumberFormat("id-ID", {style:"currency"})`), dates, and category via a local `CATEGORY_MAP = {P:"PM", R:"Repair", S:"Stock"}`. Leaf component, rendered by `OrdersTab`.

## `OrdersTab.tsx`
Props: `{ transactions: TransactionRow[]; role }`. Exports `TransactionRow` type (also used by `OrderDetailModal`/`TransactionFormModal`), whose `source` field includes a `"stock_assignment"` value not stored in the DB (see architecture.md). Main PM/Repair transactions table: search, invoice-date range filter, sortable columns via `useSortableTable`, pagination. Edit/Delete only shown when `t.source === "manual"`. Fetches `GET /api/customers` (non-customer role only) for the "on behalf of" picker. Calls `DELETE /api/transactions/:id`. Composes `OrderDetailModal`, `TransactionFormModal`, `ImportModal` (`type="transactions"`), `ConfirmModal`, `Pagination`. **Correctly resyncs** with server data (`router.refresh()` after save/delete, filters the `transactions` prop directly each render rather than copying it into local state) — contrast with `StockTab`/`ApiKeysTab`/`UsersTab` below.

## `Pagination.tsx`
Props: `{ total, page, pageSize, onPageChange, onPageSizeChange }`. Fully controlled, generic pagination bar (page-size options `[5,10,25,50,100]`). No internal state. Used by `OrdersTab`, `UnitsTab` — **not** used by `StockTab`, which hand-rolls its own prev/next pagination instead.

## `ProfileTab.tsx`
Props: `{ customerAccount, customerName, role }`. Profile display + a **non-functional** "Change Password" form (no fetch call anywhere — clicking the button just flips a local `saved` flag for 3 seconds). No `/api/profile` or password-change endpoint exists.

## `SessionTimeout.tsx`
No props, renders `null` (pure side-effect). Listens for user activity events (`mousemove`, `keydown`, `click`, etc.) and calls `signOut({ redirectTo: "/login" })` after `TIMEOUT_MS` of inactivity. **Gotcha**: `TIMEOUT_MS = 600 * 60 * 1000` = 10 hours, but a code comment claims "30 minutes" — trust the code, not the comment, if debugging session-timeout behavior.

## `StatusBadge.tsx`
Props: `{ status: string }`. **Server component** (no hooks). Looks up `status` in `STATUS_MAP` from `data/customer.ts` (falls back to the `"menunggu"` entry). Not referenced by other components in this inventory — likely used by an order-status display elsewhere.

## `StockAssignmentModal.tsx`
Props: `{ stockTransactionId, remainingQty, initial?: Assignment|null, onClose, onSaved }`. Create/edit form allocating part of a Stock transaction's qty to a target unit (turns it into a `P`/`R` transaction against that device). Category restricted to `R` (default) or `P` — never `S`. "Notes" field disabled/cleared when `category === "P"`. `maxQty = isEdit ? remainingQty + initial.qty : remainingQty` (adds back the row's own current allocation when editing, since it's being replaced). Fetches `GET /api/units`; calls `POST`/`PATCH /api/stock-assignments[/id]`. Rendered by `StockDetailModal`.

## `StockDetailModal.tsx`
Props: `{ row: StockRow; onClose; onChanged }`. Exports `StockRow` type (also used by `StockTab`). Shows qty summary (Total/Assigned/Remaining) and a table of assignments, fetched independently via `GET /api/stock-assignments?transactionId=:id` (not trusting props). Delete uses native `confirm()`, **not** `ConfirmModal` (inconsistent with rest of the app). Composes `StockAssignmentModal` for create/edit.

## `StockTab.tsx`
Props: `{ transactions: StockRow[]; role }` (`role` accepted but unused). The Stock-category table: 3 summary stat cards, search, sortable columns, hand-rolled pagination (`PAGE_SIZE = 20`, fixed). `handleChanged` re-fetches just the one open transaction's assignments after a change and patches it into local state.
**Known unfixed limitation**: `useState<StockRow[]>(initialTransactions)` seeds once from props and never resyncs on parent re-render (no `useEffect`) — after data changes elsewhere (e.g. an Excel import on a different page), the KPI/table here can show stale numbers until a full reload, even though `handleChanged` patches the one row currently open in the detail modal. **Fix direction if picked up**: add `useEffect(() => setTransactions(initialTransactions), [initialTransactions])`.

## `TransactionFormModal.tsx`
Props: `{ initial?: TransactionRow|null; role; onClose; onSaved }`. Add/Edit form for manual PM/Repair transactions (category excludes Stock). **Edit** mode: single form, `PATCH /api/transactions/:id`. **Add** mode: multiple line items (`forms: FormState[]`) submitted as an array to `POST /api/transactions`. Auto-computes `totalPrice = qty * unitPrice` (only overwrites when both are truthy, so manual totals aren't clobbered). Validates non-empty line items (`isFormEmpty` — treats numeric `"0"` the same as blank, so a legitimately-zero-qty row gets rejected as "empty"). Fetches `GET /api/units`, and (admin only) `GET /api/customers`. `customerAccount` is only included in the POST payload when `isAdmin`.

## `TransactionKpiCards.tsx`
Props: `{ role; customerAccount?; extraCard?: ReactNode }`. **The one server component in this list** — `async function`, queries Prisma directly (no client fetch). Runs 3 parallel queries (non-stock transactions, stock-assignments, remaining-stock transactions) and renders "PM Transactions" / "Repair Transactions" / "Total Transactions (PM, Repair and Stock)" KPI tiles. **Gotcha**: any `StockAssignment` whose `category` isn't exactly `"P"` (including `null`) is counted into the Repair bucket — subtly different from the raw-transaction loop, which only counts exact `"P"`/`"R"` and silently drops anything else. This component computes its totals independently from `OrdersTab`/`StockTab`'s own client-side totals — no shared source of truth, so if business rules diverge the numbers shown across tabs can disagree.

## `UnitsTab.tsx`
Props: `{ units: UnitRow[]; customers: CustomerOption[] }`. `UnitRow` includes both `customerAccount` (required, since 2026-07-05) and `customerName` (display only). Admin CRUD table for `Unit` master data — every unit must have an owning customer; the form's "Customer" `<select>` is required with no "unassigned" option, defaulting to `customers[0]` for new units and to `initial.customerAccount` for edits (pre-selection is now id-based, not name-matched — the earlier name-matching gotcha was fixed). Calls `POST`/`PATCH /api/units[/id]`, `DELETE /api/units/:id` (errors shown in a separate toast, not inside `ConfirmModal`). Composes `ImportModal` (`type="units"`), `ConfirmModal`, `Pagination`.

## `UsersTab.tsx`
Props: `{ initialUsers: UserRow[] }` (`UserRow` includes both `username` and `customerAccount`). Admin CRUD table for login accounts. Internal `UserFormModal`: create requires free-text `username` (the unique login) + password (min 6 chars) + a three-way role toggle (`customer` / `customer_user` / `admin`, "Admin" disabled once one exists — see `existingAdminUsername` prop) + an **Account ID `<select>`** (since 2026-07-05, replacing a free-text input) fetched from `GET /api/customers` — picking one auto-fills the read-only "Company Name" field below it; if no customers exist yet, the dropdown shows "No customers yet" and submit is disabled, with a pointer to the new Customers page. Edit locks `username` and Account ID (both always disabled selects/inputs); Company Name is always disabled everywhere in this form now (renaming a tenant only happens via `/customers`/`CustomersTab`). Delete button is hidden entirely for `role === "admin"` rows. **Gotcha**: `handleCreated` skips `router.refresh()` (local prepend only) while `handleUpdated`/`handleDelete` both call it — inconsistent resync within the same component (same class of issue as `ApiKeysTab`).

---

## `hooks/useSortableTable.tsx`
Exports `SortIcon` component + `useSortableTable<Col extends string>()` hook: `{ sortCol, sortDir, toggleSort, sortRows }`. Single-column sort only (no shift-click multi-sort). Used by `OrdersTab` and `StockTab` — each caller is responsible for filtering → `sortRows` → paginate, in that order, independently (not centralized).

## `components/ui/button.tsx`
shadcn/cva `Button` primitive: `variant` (`default|outline|secondary|ghost|destructive|link`), `size` (`default|xs|sm|lg|icon|icon-xs|icon-sm|icon-lg`), `asChild` (Radix `Slot`). **Notable inconsistency**: none of the `components/dashboard/*` components actually use this — they all hand-roll `<button>` elements with inline Tailwind and the hardcoded John Deere green (`#367C2B`/`#2d6423`) instead. Treat this as effectively unused scaffolding when working in the dashboard feature layer, not as "the" button convention.
