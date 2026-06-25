# Ajer.ly — System Plan & Build Spec
*Car rental office management — Libyan market · Arabic-first · PWA*
*Two realms: the **Tenant app** (each office) + the **Platform** (your operator console, vouchers, landing)*

---

## 1. What we're building

A SaaS that replaces the rental-office notebook. Each office (tenant) tracks its cars, customers, cash, and debts; from Phase 2 it generates rental contracts; from Phase 3 it shows performance insights.

On top of that sits **your platform**: a marketing **landing page** with self-serve free-trial signup, a **voucher engine** that bills offices recharge-card style (no payment gateway needed), and an **operator console** where you oversee all offices and revenue.

Arabic-first, RTL, installable as a phone app (PWA), one codebase for the counter PC and the owner's phone. The UI reference is the prototype (`ajerly-app.html`).

---

## 2. The one principle that governs everything

**Fewest actions. The notebook must feel heavier than us, never lighter.**

- Home answers the owner's three questions at **zero taps**: how much cash, is each car paid off, who owes me.
- Logging money = **amount → tap a car → done** (~2 taps). The +/− button encodes type/date/note so those fields never appear on the fast path.
- **Car tiles, not dropdowns.** Optional fields stay hidden behind "more".
- **Undo, never confirm** — a "saved ✓ — undo" toast, not a dialog on every action.
- **Home never gets more crowded as features grow.** New capabilities live one level down.

This holds for the operator console too: show the few numbers that matter, drill down for the rest.

---

## 3. Decisions locked

| Area | Decision |
|---|---|
| **Phase 1 scope** | Money tracking first (the notebook-killer) |
| **Renters** | One unified "Customers" list; tagged **person** or **company**; both can carry a credit balance |
| **Customer fields** | Required: name + phone. Optional: ID/licence number, licence photo |
| **Cars — make/model** | Preset list of common cars in Libya **+ add custom**; type / model / year combobox |
| **Cars — rate** | Optional **default daily rate** per car (pre-fills contract & income) |
| **Cars — image** | One image per car now (multi later) |
| **Cars — status** | available / rented / maintenance — **Phase 2** |
| **Contracts** | **Guided auto-fill generator** → **Arabic A4 PDF**, print **+ WhatsApp share** |
| **Contract payment** | Choose **نقدي الآن** (cash income) or **آجل** (charge to customer balance) |
| **Deposit** | Deferred (guarantees vary too much) |
| **Terms & conditions** | **Library in Settings** — multiple, mark a default, pick per contract |
| **Return flow** | Tap "returned" → frees car **+ add late/damage charges** in one step |
| **Overdue** | Auto-flag contracts past return date (red) |
| **Signing** | Print & sign on paper (v1) |
| **Insights** | Tenant-level. Best/worst car **Profit ⇄ Revenue toggle**; **utilization/idle days** (after P2); **make/model/year breakdowns**; daily/weekly/monthly |
| **Tenant accounts/roles** | Phase 1 owner-only. Phase 2 adds **staff** (hidden from: profit & insights, cash totals, deleting, Settings & T&C) |
| **Platform billing** | Prepaid **voucher** top-ups, recharge-card style; voucher = **1 / 3 / 6 / 12 months** |
| **New-office onboarding** | **Self-serve free-trial signup** from the landing page; redeem a voucher to continue after trial |
| **Trial → expiry** | *Recommend:* 14-day free trial → on expiry, **read-only lock** (data stays visible) until a voucher is redeemed *(confirm)* |
| **Operator visibility** | You see **health/usage only** per office (status, last active, # cars, expiry, vouchers) — **never their books** |
| **Landing page** | Marketing site + "Start free trial" self-serve signup |
| **Platform** | Responsive web + installable **PWA** |
| **Offline** | Online-first + caching |
| **Language** | Arabic-only now, **i18n-ready** (English later) |
| **Stack** | **Next.js + Node + MongoDB** |

---

## 4. Data model (MongoDB)

Every **tenant** document carries `tenantId` (the office); isolation is enforced **server-side on every query** — Mongo has no row-level security, so this is discipline, not a feature. Store money as **integer minor units** (or Decimal128) — never floats.

### Tenant-scoped collections

**offices** (tenant) — `{ _id, name, city?, phone, currency:'LYD', logoUrl?, createdAt,`
`  subscription: { status:'trial'|'active'|'expired', trialEndsAt, expiresAt?, lastVoucherId? } }`

**users** — `{ _id, tenantId, name, phone, passwordHash, role:'owner'|'staff', createdAt }` *(role enforced from Phase 2)*

**cars** — `{ _id, tenantId, make, model, year, type, plate, purchaseCost, defaultDailyRate?, imageUrl?, status?, createdAt }`
- *Payoff %* = received income for this car ÷ `purchaseCost`.

**customers** — `{ _id, tenantId, kind:'individual'|'company', name, phone, idNumber?, licencePhotoUrl?, balance, createdAt }`
- `balance` = Σ charges − Σ payments (what they owe).

**transactions** (cash that moved) — `{ _id, tenantId, type:'income'|'expense', amount, carId?, customerId?, note?, date, createdBy }`
- Drives **cash balance**, **car revenue/payoff**, **profit** insights.

**ledgerEntries** (customer credit) — `{ _id, tenantId, customerId, kind:'charge'|'payment', amount, carId?, contractId?, note?, date }`
- A **charge** raises balance; a **payment** lowers it **and** creates an income transaction.

**contracts** *(P2)* — `{ _id, tenantId, carId, customerId, startDate, dueDate, dailyRate, days, total, paymentMode, termsTemplateId, status:'active'|'returned'|'overdue', returnedAt?, extraCharges?, pdfUrl?, createdBy }`

**termsTemplates** *(P2)* — `{ _id, tenantId, title, body, isDefault }`

**settings** — per office: contract header/logo, default T&C, preferences.

### Platform-level collections (no tenantId — they sit *above* offices)

**operators** — `{ _id, name, email, passwordHash, role:'operator', createdAt }` *(your super-admin accounts; a separate realm from tenant users)*

**vouchers** — `{ _id, code (unique, e.g. XXXX-XXXX-XXXX), months:1|3|6|12, priceLyd?, status:'unused'|'redeemed'|'void', batchId?, generatedBy, redeemedByOfficeId?, redeemedAt?, createdAt, expiresAt? }`
- Redeeming is **atomic** (single-use, no double-spend). On redeem: office `expiresAt += months`, status→`active`.

**platformSettings** — `{ pricePerMonthLyd, trialDays, ... }`

> **Revenue recognition (tenant side, confirm):** recommend **cash basis** — a car's revenue/payoff and profit count money *received*, not money merely *charged on credit*. Unpaid credit shows as customer debt, not car income, until paid.
>
> **Platform revenue:** recognized on **voucher redemption** = `months × pricePerMonth`. (If you later sell via resellers, sale vs redemption may diverge — track separately then.)

**Money-integrity guardrails:** soft-delete + audit on financial records; prefer **reversing entries** over editing past entries so balances always reconcile.

---

## 5. Tenant app — modules & key flows

- **Overview** — cash (hero), today's in/out, "owed to you", car tiles with payoff bars, recent activity.
- **Cars** — list/grid + payoff bars + filters. Add car = name (combobox), plate, cost, optional rate/image. Detail = its P&L + history.
- **Customers** — unified list, person/company tag, balances. Add = name + phone. Detail = **statement** (charges vs payments → running balance).
- **Ledger** — full cash history by day, running balance, filter income/expense.
- **Contracts** *(P2)* — guided generator → PDF (print/share); payment choice; return + overdue.
- **Insights** *(P3)* — best/worst car (profit⇄revenue), idle-car utilization, make/model/year breakdowns, daily/weekly/monthly.
- **Settings** — office header/logo, T&C library, (P2) staff management, **subscription & redeem-voucher**.

**Fast paths to protect:** log income/expense (≈2 taps), add car (3 fields), add customer (2 fields), create contract (car → customer → dates → generate), return car (tap + optional charges), record payment (amount → customer → done), **redeem voucher (paste code → done)**.

---

## 6. Platform layer — landing, vouchers & operator console

### 6.1 Landing page (acquisition)
Arabic-first, RTL, same design language. Sections: hero + **"ابدأ تجربتك المجانية"** CTA · the pain (notebooks, lost track of who's paid) · the solution/features (dashboard, payoff tracking, ledger, customer/company debts, contracts, insights) · screenshots/demo · simple pricing (monthly, paid by voucher) · FAQ · footer with WhatsApp contact.

### 6.2 Self-serve signup & trial
"Start free trial" → short form (office name, owner name, phone, password, city) → **atomically creates** the office (`status:'trial'`, `trialEndsAt = now + trialDays`) **+ owner user** → drops straight into the app, full access, no payment. When the trial (or a paid period) ends → **read-only lock** + a renewal prompt to redeem a voucher.

### 6.3 Voucher engine (billing without a gateway)
- **Office side:** Settings → "تفعيل / تجديد الاشتراك" → paste voucher code → subscription extended by its months. Shows current expiry and a heads-up before it lapses.
- **Operator side:** generate voucher **batches** (quantity, months, optional price), each a unique single-use code; list/search by code & status (unused / redeemed / void); void a code; **export codes** to distribute; see who redeemed and when.
- *(Phase 4)* reseller/agent accounts that can generate & sell vouchers.

### 6.4 Operator console (your oversight) — health only, never their books
- **Separate operator login** (platform realm, hard-walled from tenant data beyond health).
- **Dashboard:** revenue per month (from redemptions), active MRR, counts of **trial / active / expired** offices, new signups trend, trial→paid conversion, **vouchers outstanding vs redeemed**.
- **Offices:** searchable list with health — name, city, status, trial/expiry date, last active, # cars, # users; drill-down to the same health detail (not their financials). Actions: extend/comp a subscription, suspend, contact.
- **Vouchers:** the generation + tracking UI above.

---

## 7. Phased roadmap

**Phase 0 — Foundation**
Next.js + Node API + MongoDB (Mongoose); **two auth realms** (tenant users vs platform operators); owner auth (credentials + JWT, bcrypt); multi-tenant scoping helper; PWA shell (installable); Arabic RTL + i18n wiring; design system from the prototype; object storage for images/PDFs.

**Phase 1 — Notebook-killer MVP + funnel**
*Tenant app (owner-only):* cars, unified customers with credit balances, cash in/out tied to car/customer, customer/company **statements**, **dashboard**, **ledger**.
*Funnel:* **landing page** + **self-serve free-trial signup** (office + owner creation, trial state, full access). → This is what beta offices sign up to and use free.

**Phase 1.5 — Billing & Operator** *(build during the trial window, live before first trials lapse)*
Voucher engine (generate / redeem, single-use, atomic); **subscription expiry → read-only lock** + renewal prompt; **operator console** (offices health list, voucher management, revenue/MRR dashboard).

**Phase 2 — Operations**
Contracts generator (Arabic PDF, print + share, payment choice); **T&C library**; car **status**; **return flow** + **overdue**; **staff logins + roles**.

**Phase 3 — Intelligence**
Insights: profit⇄revenue best/worst, **utilization / idle days**, make/model/year breakdowns, daily/weekly/monthly.

**Phase 4 — Polish & scale**
Maintenance reminders; customer **blacklist/red-list**; **multi-image** per car; **reseller voucher network**; **local payment gateway**; offline-sync (only if outages demand); **English** (i18n already wired).

---

## 8. Architecture notes

- **Two realms, one app:** route groups for `/` (public landing), `/app` (tenant), `/console` (operator). Tenant users are scoped to an office; operators are platform super-admins with **no access to tenant books**, only health.
- **Auth:** Auth.js / NextAuth credentials, JWT, bcrypt; separate operator auth context, hard-walled. No card data ever stored (voucher billing).
- **Multi-tenancy:** `tenantId` on every tenant document; request-scoped tenant guard wraps all data access; never trust a client-supplied tenantId.
- **Subscription guard (middleware):** on each tenant write, check `office.subscription`; if expired → allow reads, block writes (read-only) + surface renewal.
- **Vouchers:** server-generated unique codes; **atomic single-use redeem**; optional expiry; revenue computed from redemptions.
- **Roles (P2):** `user.role` owner|staff; enforce server-side **and** hide UI; default-deny for staff on owner-only areas.
- **Files:** S3-compatible object storage (car images, licence photos, contract PDFs).
- **PWA:** next-pwa / Workbox — installable, caches shell + key reads for connectivity hiccups.
- **i18n / RTL:** next-intl; Arabic default; `dir="rtl"`; tabular numbers.
- **Contract PDF:** server-side render with an Arabic font (Tajawal / Amiri) — @react-pdf/renderer or HTML→PDF (Puppeteer).
- **Hosting:** Vercel + MongoDB Atlas (EU region for latency to Libya), or a VPS; object storage separate.

---

## 9. Open items to confirm during build

1. **Trial length** — recommend **14 days**.
2. **Expiry behavior** — recommend **read-only lock** (not full logout) until a voucher is redeemed.
3. **Price per month** — target ≈ **100–150 LYD** (owner volunteered 100 as "not a big deal").
4. **Voucher denominations & pricing** — e.g. 1 / 3 / 6 / 12 months; any discount on longer ones?
5. **Revenue recognition (tenant)** — cash basis (above).
6. **Preset car list** — compile common makes/models/years for Libya.
7. **Beta cohort** — who's first (the discovery-call owner as design partner?).

---

*Next: stand up Phase 0, then Phase 1 + the funnel. The prototype is the UI reference; this doc is the source of truth for scope, data, and sequencing.*
