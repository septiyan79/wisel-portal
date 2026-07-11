# Pages & Features (`app/**`)

## Public / entry routes

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Server component, body is just `redirect("/login")` — not the marketing page. |
| `/landing` | `app/landing/page.tsx` | The actual public marketing homepage. Static/presentational, no auth, no Prisma. Composes `Topbar → Header → Hero → Categories → Banner → Careers → Resources → StoreLocation → Newsletter → Footer` from `components/landing/*`, all driven by static copy in `data/home.ts` / `data/footer.ts`. Login page links back here ("Back to Home"). |
| `/login` | `app/(auth)/login/page.tsx` | Client component. Calls NextAuth `signIn("credentials", { username, password, redirect: false })` then `router.push("/dashboard")`. No Prisma (delegated to `lib/auth.ts`). Field was renamed from `customerAccount` on 2026-07-05 — existing accounts' `username` was backfilled to their old `customerAccount` value, so old credentials still work. Links to `/forgot-password` ("Forgot password?"). |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Added 2026-07-05. Server component, fully static — no form, no Prisma. There's no email/phone on `User` to support a real reset flow, so this just tells the user to contact their admin (who can reset any password via `UsersTab`/`PATCH /api/admin/users/[id]`) and links back to `/login`. |

`app/layout.tsx` is the root layout for both trees (fonts, metadata) — no auth logic.

## `app/(dashboard)/layout.tsx` — the auth choke point

`const session = await auth(); if (!session) redirect("/login")` — session-existence only, no role check. Renders `SessionTimeout` (idle-logout watcher, see [components.md](components.md)), `DashboardNavbar`, the page content in a `max-w-screen-2xl <main>`, and a global `ChatBubble`. **Role restrictions are NOT centralized here** — every page under this layout does its own gating/scoping (see table below).

## Dashboard pages

| Route | Role gating | Data scoping | Composes |
|---|---|---|---|
| `/dashboard` | none | no Prisma calls at all | static Power BI report iframe |
| `/profile` | none | none (own session data only) | `ProfileTab` |
| `/docs` | none (content wording varies by role) | none | `ApiDocsPanel` |
| `/api-keys` | **admin-only** (non-admin → `/dashboard`) | unscoped (`ApiKey.findMany` across all customers) | `ApiKeysTab` |
| `/customers` | **admin-only** (non-admin → `/dashboard`) | unscoped (`Customer.findMany` with `_count` of users/units/transactions/apiKeys) | `CustomersTab` |
| `/units` | **admin-only** (non-admin → `/transactions`) | unscoped (`Unit.findMany` across all customers) | `UnitsTab` |
| `/users` | **admin-only** (`role !== "admin"` → `/dashboard`) | unscoped | `UsersTab` |
| `/transactions` | none | — | redirects to `/transactions/summary` |
| `/transactions/summary` | none (data scoped instead) | non-admin → own `customerAccount`; excludes `category: "S"` (shown via assignments instead) | `TransactionKpiCards` + `OrdersTab` |
| `/transactions/stock` | none (data scoped) | non-admin → own `customerAccount`; `category: "S"` only | `StockTab` |
| `/transactions/by-fleet` | none (data scoped) | non-admin → own; excludes `deviceNumber: "STOCK"` | `TransactionKpiCards` (with extra "Total Fleet" card) + `FleetTransactionTable` |
| `/transactions/by-fleet/[fleet]` | none (data scoped) | non-admin → own; `"—"` URL param = null-device sentinel | `FleetDetailTable`; `notFound()` if both queries empty (acts as implicit 404-as-403 for cross-customer access) |
| `/transactions/by-part` | none (data scoped) | non-admin → own | `TransactionKpiCards` + `PartTransactionTable` |
| `/transactions/by-part/[part]` | none (data scoped) | non-admin → own; matches `partNumber` OR `axPartNumber` | `PartDetailTable`; same implicit-404 pattern |

**Two role-gating strategies** — see [architecture.md](architecture.md#role-scoping-conventions) for the general rule. Both `"customer"` and `"customer_user"` are treated identically ("non-admin") by every check. The consistent idiom for scoped pages: `session.user.role !== "admin" ? { ...filter, customerAccount: session.user.customerAccount } : { ...filter }`.

**Shared server component `TransactionKpiCards`** (props: `role`, `customerAccount`, optional `extraCard`) runs its own three independent Prisma queries on every page that includes it — each hosting page also runs overlapping queries for its own table, so KPI totals are computed redundantly (not shared) per page render.

**Unscoped "label lookup" queries**: `by-fleet`, `by-fleet/[fleet]`, and `by-part/[part]` all run an unscoped `Unit.findMany`/`findUnique` purely to resolve `deviceNumber → fleetNumber/serialNumber/model` labels — not customer-filtered even on customer-scoped pages, but they never expose price/transaction data.

## AI Chat feature

**Mount point**: `ChatBubble` in `(dashboard)/layout.tsx` — present on every authenticated dashboard route, absent from `/landing`. Floating button bottom-right; message history lives only in React state (resets on reload, no persistence).

**Flow**: `ChatInput` (controlled, Enter-to-submit) → `ChatBubble.sendMessage` appends to local `messages` and `POST`s the *entire* array to `/api/chat` → `ChatMessages` renders the response (includes a small hand-rolled `SimpleMarkdown` renderer supporting `**bold**`, `#`/`##`/`###`, bullets, numbered lists — not a real markdown library).

**Server side** (`app/api/chat/route.ts`): Groq `llama-3.3-70b-versatile` via `ai` SDK's `generateText` (non-streaming — the whole turn blocks until done) + `tool()` function-calling, `stopWhen: stepCountIs(5)`. System prompt is role-branched (admin: cross-customer analysis; customer: own-data + "how to use the portal" Q&A), in Bahasa Indonesia, dictates Rupiah/`DD/MM/YYYY` formatting.

**Tools** (thin wrappers around `lib/chat-tools.ts`): `query_transactions`, `get_summary_stats`, `get_stock_info`, `search_parts`. **Scoping**: `scopedAccount = role === 'customer' ? customerAccount : null` computed once from the session, then every tool's `execute` unconditionally overrides its `customerAccount` param with this value — the Zod input schemas exposed to the model don't even include a `customerAccount` field, so the model has no way to request another tenant's data, and prompt injection in the chat input cannot escalate scope. `getStockInfo` is the one tool that filters in-memory after an unscoped `StockAssignment` fetch rather than filtering at the query level (functionally correct, less efficient — worth matching the other three tools' pattern if extending this).

## In-app API documentation page (`/docs`)

`app/(dashboard)/docs/page.tsx` (server) + `components/dashboard/ApiDocsPanel.tsx` (client). Mostly **static hand-written prose** describing `GET /api/customer/items` (auth header format, response fields, query params, error example) — this is committed reference text that must be **manually kept in sync** with the actual route if it changes. The only dynamic pieces: `baseUrl` (from request headers, for code samples) and `ApiDocsPanel`'s "Try it out" panel, which does a real client-side `fetch('/api/customer/items', ...)` with a user-pasted API key and shows the live response.

## Landing page components (brief — presentational, low churn)

`components/landing/*.tsx`, one line each: `topbar` (client, reads `wisel_user` from `localStorage` for a login-state greeting), `header` (client, sticky nav w/ scroll shadow, built from `data/home.ts` `NAV_ITEMS`), `hero`, `categories`, `banner` (CTA → `/register`), `careers` (CTA → `/karir`), `resources`, `storeLocation` (client, static mock branch list), `newsletter` (client, form has no submit handler), `footer`. All content-driven by `data/home.ts` (`NAV_ITEMS`, `HERO_TABS`, `CATEGORIES`, `STATS`, `RESOURCES`, `BRANDS`) and `data/footer.ts` (`FOOTER_LINKS`, all `href="#"` placeholders). Note: `data/customer.ts` is **not** customer/CRM data despite the name — it holds dashboard nav config (`STATUS_MAP`, `NAV_ITEMS`, `ADMIN_NAV_ITEMS`) used by `DashboardNavbar`/`StatusBadge`.
