import express, { Express, Router } from "express";
import cors from "cors";
import { config } from "./config";
import { requestId } from "./middleware/requestId";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authTenant } from "./middleware/authTenant";
import { authOperator } from "./middleware/authOperator";
import { subscriptionGuard } from "./middleware/subscriptionGuard";

import { healthRouter } from "./routes/public/health";
import { signupRouter } from "./routes/public/signup";

import { tenantAuthRouter } from "./routes/tenant/auth";
import { tenantMeRouter } from "./routes/tenant/me";
import { tenantCarsRouter } from "./routes/tenant/cars";
import { tenantCustomersRouter } from "./routes/tenant/customers";
import { tenantTransactionsRouter } from "./routes/tenant/transactions";
import { tenantLedgerRouter } from "./routes/tenant/ledger";
import { tenantLedgerEntriesRouter } from "./routes/tenant/ledgerEntries";
import { tenantDashboardRouter } from "./routes/tenant/dashboard";
import {
  tenantSubscriptionRouter,
  tenantSubscriptionRedeemRouter,
} from "./routes/tenant/subscription";

import { operatorAuthRouter } from "./routes/operator/auth";
import { operatorMeRouter } from "./routes/operator/me";
import { operatorDashboardRouter } from "./routes/operator/dashboard";
import { operatorOfficesRouter } from "./routes/operator/offices";
import { operatorVouchersRouter } from "./routes/operator/vouchers";

export function buildApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(requestId);

  // Public
  app.use("/api", healthRouter);
  app.use("/api", signupRouter);

  // Tenant — login is public; everything else needs authTenant.
  // Redeem mounts BEFORE subscriptionGuard so expired offices can renew.
  app.use("/api/tenant", tenantAuthRouter);

  const tenantPrivate = Router();
  tenantPrivate.use(authTenant);
  tenantPrivate.use(tenantSubscriptionRedeemRouter);
  tenantPrivate.use(subscriptionGuard);
  tenantPrivate.use(
    tenantMeRouter,
    tenantCarsRouter,
    tenantCustomersRouter,
    tenantTransactionsRouter,
    tenantLedgerRouter,
    tenantLedgerEntriesRouter,
    tenantDashboardRouter,
    tenantSubscriptionRouter,
  );
  app.use("/api/tenant", tenantPrivate);

  // Operator — login is public; everything else needs authOperator.
  app.use("/api/operator", operatorAuthRouter);

  const operatorPrivate = Router();
  operatorPrivate.use(authOperator);
  operatorPrivate.use(
    operatorMeRouter,
    operatorDashboardRouter,
    operatorOfficesRouter,
    operatorVouchersRouter,
  );
  app.use("/api/operator", operatorPrivate);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
