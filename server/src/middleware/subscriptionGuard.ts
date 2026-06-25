import { Request, Response, NextFunction } from "express";
import { Locked, PaymentRequired, Unauthorized } from "../lib/errors";

// Allow read-only on expired offices. Suspended offices are blocked harder.
// The redeem endpoint mounts its own router without this guard.
export function subscriptionGuard(req: Request, _res: Response, next: NextFunction): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  if (!req.office) return next(Unauthorized());
  const sub = req.office.subscription;
  if (sub.suspended) {
    return next(Locked("ACCOUNT_SUSPENDED", "Office suspended by operator"));
  }
  if (sub.status === "expired") {
    return next(PaymentRequired("SUBSCRIPTION_EXPIRED", "Redeem a voucher to continue"));
  }
  next();
}
