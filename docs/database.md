# Database (Prisma / PostgreSQL)

Schema file: `prisma/schema.prisma`. No DB-level enums — `role`, `category`, `source`, `status` are all plain strings enforced only by application code convention.

## Entity relationship overview

```
User (1) ──customerAccount── (1) Customer
                                   │
                                   ├──(1:N)── Unit
                                   ├──(1:N)── Transaction
                                   └──(1:N)── ApiKey

Unit (1) ──deviceNumber── (N) Transaction
Unit (1) ──targetDeviceNumber── (N) StockAssignment  (as assignment target)
Transaction (1) ──(N)── StockAssignment (as the "S" source being allocated)

SyncLog — standalone, no relations (audit trail for POST /api/sync)
```

`User.customerAccount` and `Customer.customerAccount` share the same unique key and are joined 1:1 — every login account has exactly one `Customer` record (even admins: seed creates a `Customer` row `"ADMIN"` purely to satisfy the FK).

## Models

### `User`
`id, customerAccount (unique), password (bcrypt hash), role (default "customer"), customer? (FK→Customer.customerAccount), createdAt, updatedAt`
Login identity is `customerAccount`, not email. `role` is free-text; convention is `"customer"` | `"admin"`.

### `Customer`
`id, customerAccount (unique), customerName, user?, units[], transactions[], apiKeys[], createdAt, updatedAt`
The "tenant" — everything scoped-by-customer joins through `customerAccount`, not `Customer.id`.

### `Unit`
`id, deviceNumber (unique), serialNumber? (unique), fleetNumber?, model?, customerAccount? (FK→Customer, nullable), transactions[], stockAssignments[], createdAt, updatedAt`
Represents a physical machine/device. `customerAccount` is nullable — units can be unowned (e.g. the `"WSL-000039232"` stock placeholder has no customer). Reads via `/api/units` are **not** customer-scoped — any authenticated user sees the full unit master list regardless of role.

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

## Seed data (`prisma/seed.ts`)

| customerAccount | password | role | notes |
|---|---|---|---|
| `W0001` | `password123` | customer | "PT Agro Nusantara" |
| `W0002` | `password123` | customer | "CV Maju Bersama" |
| `ADMIN` | `password123` | admin | Customer record only exists to satisfy the User→Customer FK |

Plus `Unit` `deviceNumber: "STOCK"` (`model: "Stock Gudang"`) — note this seeded unit is a **different** string (`"STOCK"`) from the hardcoded import placeholder `"WSL-000039232"` referenced throughout the API routes; the seed's `"STOCK"` unit and the runtime placeholder are not the same row. `"STOCK"` as a device number is also the one explicitly *rejected* as a `targetDeviceNumber` in `/api/stock-assignments`.
