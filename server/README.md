# Ajer.ly Server

API for Ajer.ly — Phase 0 foundation + Phase 1 endpoints + voucher engine + operator console.

## Stack

- Node 20+, TypeScript, Express 5
- MongoDB via Mongoose (**replica set required** — transactions are used for signup, payment creation, voucher redemption)
- Zod validation, JWT auth (two realms), bcrypt
- Vitest + supertest + mongodb-memory-server for tests

## Layout

```
src/
  config.ts        env (zod-parsed)
  db.ts            mongoose connect
  app.ts           express composition
  index.ts         boot
  lib/             money, passwords, tokens, errors, withTenant, withSession, voucherCode, storage
  middleware/      requestId, validate, errorHandler, authTenant, authOperator, subscriptionGuard
  models/          Mongoose schemas
  services/        business logic — single owners of money-mutating operations
  validators/      Zod schemas per route module
  routes/
    public/        signup, health
    tenant/        cars, customers, transactions, ledger, ledger-entries, dashboard, subscription, auth, me
    operator/      auth, me, dashboard, offices, vouchers
```

## Two auth realms

Tenant JWT carries `{ userId, tenantId, role }`. Operator JWT carries `{ operatorId }`. They are signed with different secrets and verified by different middleware. A tenant token cannot reach operator routes and vice versa.

## Money

Stored as **integer minor units** (millimes — ×1000 of LYD). Conversion happens at the edges only (`lib/money.ts`). Business code never sees floats.

## Multi-tenancy

Every tenant document has `tenantId`. `lib/withTenant.ts` produces the base filter, and every tenant-scoped query composes it. The tenant id comes only from the JWT — never from request body or query.

## Subscription guard

Tenant **writes** are blocked when the office subscription is expired (402) or suspended (423). Reads always pass. The redeem endpoint is exempt.

## Scripts

- `npm run dev` — tsx watch
- `npm run build` / `npm start`
- `npm run typecheck`
- `npm test`
