import { Router } from "express";
import { User } from "../../models/User";
import { Office } from "../../models/Office";
import { validate } from "../../middleware/validate";
import { updateUserSchema, updateOfficeSchema } from "../../validators/auth";
import { hashPassword, verifyPassword } from "../../lib/passwords";
import { Conflict, NotFound, Unauthorized } from "../../lib/errors";

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

tenantMeRouter.patch("/me", validate(updateUserSchema), async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    const body = req.body as import("zod").infer<typeof updateUserSchema>;
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.newPassword) {
      const ok = await verifyPassword(body.currentPassword!, req.user.passwordHash);
      if (!ok) throw Unauthorized("INVALID_CURRENT_PASSWORD");
      update.passwordHash = await hashPassword(body.newPassword);
    }
    try {
      const updated = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
      if (!updated) throw NotFound("USER_NOT_FOUND");
      res.json({
        user: {
          _id: String(updated._id),
          name: updated.name,
          phone: updated.phone,
          role: updated.role,
        },
      });
    } catch (err: unknown) {
      if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
        throw Conflict("USER_PHONE_TAKEN", "Another user in this office already uses that phone");
      }
      throw err;
    }
  } catch (e) {
    next(e);
  }
});

tenantMeRouter.patch("/office", validate(updateOfficeSchema), async (req, res, next) => {
  try {
    if (!req.office) throw Unauthorized();
    const body = req.body as import("zod").infer<typeof updateOfficeSchema>;
    const updated = await Office.findByIdAndUpdate(req.office._id, { $set: body }, { new: true });
    if (!updated) throw NotFound("OFFICE_NOT_FOUND");
    res.json({
      office: {
        _id: String(updated._id),
        name: updated.name,
        city: updated.city ?? null,
        phone: updated.phone,
        currency: updated.currency,
        subscription: updated.subscription,
      },
    });
  } catch (e) {
    next(e);
  }
});
