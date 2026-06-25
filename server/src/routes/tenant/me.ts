import { Router } from "express";
import { Unauthorized } from "../../lib/errors";

export const tenantMeRouter = Router();

tenantMeRouter.get("/me", (req, res, next) => {
  try {
    if (!req.user || !req.office) throw Unauthorized();
    res.json({
      user: {
        _id: String(req.user._id),
        name: req.user.name,
        phone: req.user.phone,
        role: req.user.role,
      },
      office: {
        _id: String(req.office._id),
        name: req.office.name,
        city: req.office.city ?? null,
        phone: req.office.phone,
        currency: req.office.currency,
        subscription: req.office.subscription,
      },
    });
  } catch (e) {
    next(e);
  }
});
