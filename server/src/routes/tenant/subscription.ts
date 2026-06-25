import { Router } from "express";
import { tenantId } from "../../lib/withTenant";
import { validate } from "../../middleware/validate";
import { redeemSchema } from "../../validators/subscription";
import { redeemVoucher } from "../../services/vouchers/redeem";
import { Unauthorized } from "../../lib/errors";

// Two routers: read uses the guard chain; redeem mounts standalone to bypass the guard.
export const tenantSubscriptionRouter = Router();
export const tenantSubscriptionRedeemRouter = Router();

tenantSubscriptionRouter.get("/subscription", (req, res, next) => {
  try {
    if (!req.office) throw Unauthorized();
    const sub = req.office.subscription;
    const target = sub.expiresAt ?? sub.trialEndsAt;
    const daysRemaining = target
      ? Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86_400_000))
      : null;
    res.json({
      status: sub.status,
      suspended: sub.suspended,
      trialEndsAt: sub.trialEndsAt,
      expiresAt: sub.expiresAt ?? null,
      daysRemaining,
    });
  } catch (e) {
    next(e);
  }
});

tenantSubscriptionRedeemRouter.post(
  "/subscription/redeem",
  validate(redeemSchema),
  async (req, res, next) => {
    try {
      const { code } = req.body as import("zod").infer<typeof redeemSchema>;
      const result = await redeemVoucher({ officeId: tenantId(req), code });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);
