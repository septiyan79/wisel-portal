# Database (Prisma / PostgreSQL)

Schema file: `prisma/schema.prisma`. No DB-level enums — `role`, `category`, `source`, `status` are all plain strings enforced only by application code convention.

## Entity relationship overview

```
User (N) ──customerAccount── (1) Customer
                                   │
                                   ├──(1:N)── Unit
                                   ├──(1:N)── Transaction
                                   └──(1:N)── ApiKey

Unit (1) ──deviceNumber── (N) Transaction
Unit (1) ──targetDeviceNumber── (N) StockAssignment  (as assignment target)
Transaction (1) ──(N)── StockAssignment (as the "S" source being allocated)

SyncLog — standalone, no relations (audit trail for POST /api/sync)
```

`Customer.customerAccount` is the tenant key. **Since migration `20260705010000_multi_login_per_customer`, `User.customerAccount` is a plain (non-unique) FK** — one `Customer` can have several `User` rows (typically one `"customer"` account plus zero or more `"customer_user"` staff accounts), all scoped to the same tenant data. Every `User` still requires a `Customer` row to exist (even admins: seed creates a `Customer` row `"ADMIN"` purely to satisfy the FK).

## Models

### `User`
`id, username (unique), customerAccount (FK→Customer.customerAccount, not unique), password (bcrypt hash), role (default "customer"), customer? relation, createdAt, updatedAt`
Login identity is `username`, not `customerAccount` and not email. `role` is free-text; convention is `"customer"` | `"customer_user"` | `"admin"`. `"customer_user"` is an additional login for a tenant that already has an account — identical data access/scoping to `"customer"` everywhere in the app (see [architecture.md](architecture.md#role-scoping-conventions)); the two are only distinguished for display (e.g. `UsersTab`'s badge) and for who's allowed to *create* an account (`POST /api/admin/users` is still admin-only regardless of the new role). Before the migration, `customerAccount` was itself the unique login identity and `User`↔`Customer` was 1:1; existing rows were backfilled with `username = customerAccount`, so old credentials keep working unchanged — only the login page's field label changed (from "Account Number" to "Username").

### `Customer`
`id, customerAccount (unique), customerName, users[], units[], transactions[], apiKeys[], createdAt, updatedAt`
The "tenant" — everything scoped-by-customer joins through `customerAccount`, not `Customer.id`. Managed exclusively via `/customers` (`CustomersTab` + `/api/admin/customers[/id]`) since 2026-07-05 — `customerAccount` is immutable once created; `POST /api/admin/users` no longer creates or renames a `Customer` as a side effect (see [api-reference.md](api-reference.md)).

### `Unit`
`id, deviceNumber (unique), serialNumber? (unique), fleetNumber?, model?, customerAccount (FK→Customer, required since 2026-07-05), transactions[], stockAssignments[], createdAt, updatedAt`
Represents a physical machine/device. **Every unit must belong to a customer** (`customerAccount` is non-nullable — migration `20260705000000_make_unit_customer_account_required`; all 145 pre-existing rows were backfilled to a single known owner before the constraint was added). A unit can be reassigned to a different customer at any time via `PATCH /api/units/[id]` (admin-only) or by re-importing `/api/units/import` with a new `Customer Account` column value for the same `deviceNumber` — reassignment does **not** retroactively change historical `Transaction`/`StockAssignment` rows, since those carry their own independent `customerAccount` (see `Transaction` below). `GET /api/units` is now scoped: `role === "customer"` sees only their own units; other roles see all.

### `Transaction`
`id, externalId? (unique), source, isDeleted (default false), deletedAt?, soNumber?, quotation?, poNumber?, partNumber?, axPartNumber?, partName?, qty?, category?, invoiceDate?, packingSlipDate?, unitPrice?, totalPrice?, check?, customerAccount? (FK), deviceNumber? (FK→Unit), stockAssignments[], createdAt, updatedAt`

The core domain object. Key semantics:
- **`source`**: `"manual"` (app form — only editable/deletable kind), `"import"` (Excel), `"provider"` (external `/api/sync`). See architecture.md for the fourth in-memory-only `"stock_assignment"` label.
- **`category`**: `"P"` (PM) / `"R"` (Repair) / `"S"` (Stock, i.e. warehouse inventory not yet assigned to a unit). Nothing prevents other values being stored (e.g. a null or unrecognized value from a code path that doesn't validate) — several UI/KPI computations silently ignore rows whose category isn't exactly one of these three.
- **`isDeleted`/`deletedAt`**: soft-delete only for `Transaction`. Provider-sourced rows get soft-deleted automatically by `/api/sync` when absent from a new sync payload (and un-deleted if they reappear). Manual rows get soft-deleted via `DELETE /api/transactions/[id]`.
- **`externalId`**: unique key used by `/api/sync` to upsert against the external provider system. Null for manual/import rows.
- **`check`**: a free-text notes field — confusingly renamed to `notes` in the `/api/customer/items` external API response. Don't assume the DB column name when reading that route's output.
- Stock rows (`category: "S"`) are "consumed" via `StockAssignment` records rather than being edited/split in place — `qty` stays the original purchased quantity forever; remaining-available is always computed as `qty - sum(stockAssignments.qty)` at read time, in multiple places independently (not a stored/derived column).

### `StockAssignment`
`id, stockTransactionId (FK→Transaction), targetDeviceNumber (FK→Unit.deviceNumber), qty, category?, check?, packingSlipDate?, createdAt, updatedAt, stockTransaction, targetUnit`
Represents allocating `qty` units of a Stock transaction's inventory to a specific target `Unit`. `category` here is independent of the parent transaction's category (parent is always `"S"`; the assignment itself is typically `"P"` or `"R"` per the allocation's purpose, enforced by `StockAssignmentModal`'s UI, not the DB). Hard-deleted (no soft-delete) via `/api/stock-assignments/[id]`.

### `ApiKey`
`id, key (unique, "wsl_" + 64 hex chars), label, customerAccount (FK), isActive (default true, never toggled by any route — only create/delete exist), createdAt, lastUsedAt?`
The plaintext `key` is only ever returned once, at creation (`POST /api/admin/api-keys`); every other read excludes it from `select`. `lastUsedAt` is updated fire-and-forget on every successful `/api/customer/items` call.

### `SyncLog`
`id, syncedAt (default now), totalRows, status ("success"|"error"), note?`
Written on every `/api/sync` call (success or failure) — the only audit trail for provider syncs; not surfaced in any UI page as of this writing.

## Migration history

1. `20260403160146_add_customer_account` — introduced `customerAccount` as the tenant key.
2. `20260411000000_add_model_category_rename_invoicedate` — added `Unit.model`, `Transaction.category`, renamed a date field to `invoiceDate`.
3. `20260425000000_add_packing_slip_date_to_transaction` — added `packingSlipDate` (now the primary date used for filtering/sorting in most transaction views, distinct from `invoiceDate`).
4. `20260705000000_make_unit_customer_account_required` — made `Unit.customerAccount` `NOT NULL` after backfilling all existing rows. Applied via `prisma db push` + `prisma migrate resolve --applied` (not a clean `prisma migrate dev` run — the shadow-database replay of migration #2 fails against this DB's actual history; see [known-issues.md](known-issues.md) if you need to run `migrate dev` again).
5. `20260705010000_multi_login_per_customer` — added `User.username` (backfilled from the then-unique `customerAccount`, then made `NOT NULL UNIQUE`), dropped the old unique index on `User.customerAccount`, added a plain index in its place. Applied cleanly via `prisma migrate deploy` (no shadow database involved, so migration #4's workaround wasn't needed here).

## Seed data (`prisma/seed.ts`)

| username | customerAccount | password | role | notes |
|---|---|---|---|---|
| `W0001` | `W0001` | `password123` | customer | "PT Agro Nusantara" |
| `W0001-staff` | `W0001` | `password123` | customer_user | Second login for the same tenant as `W0001`, demonstrating multi-account support |
| `W0002` | `W0002` | `password123` | customer | "CV Maju Bersama" |
| `ADMIN` | `ADMIN` | `password123` | admin | Customer record only exists to satisfy the User→Customer FK |

Plus `Unit` `deviceNumber: "STOCK"` (`model: "Stock Gudang"`) — note this seeded unit is a **different** string (`"STOCK"`) from the hardcoded import placeholder `"WSL-000039232"` referenced throughout the API routes; the seed's `"STOCK"` unit and the runtime placeholder are not the same row. `"STOCK"` as a device number is also the one explicitly *rejected* as a `targetDeviceNumber` in `/api/stock-assignments`.
