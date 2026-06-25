import { Router } from "express";
import { tenantLoginSchema } from "../../validators/auth";
import { validate } from "../../middleware/validate";
import { User } from "../../models/User";
import { Office } from "../../models/Office";
import { verifyPassword } from "../../lib/passwords";
import { signTenant } from "../../lib/tokens";
import { Unauthorized } from "../../lib/errors";

export const tenantAuthRouter = Router();

tenantAuthRouter.post("/auth/login", validate(tenantLoginSchema), async (req, res, next) => {
  try {
    const { phone, password } = req.body as import("zod").infer<typeof tenantLoginSchema>;
    const user = await User.findOne({ phone });
    if (!user) throw Unauthorized("INVALID_CREDENTIALS");
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw Unauthorized("INVALID_CREDENTIALS");
    const office = await Office.findById(user.tenantId);
    if (!office) throw Unauthorized("INVALID_CREDENTIALS");
    const token = signTenant({
      userId: String(user._id),
      tenantId: String(office._id),
      role: user.role as "owner" | "staff",
    });
    res.json({
      token,
      user: { _id: String(user._id), name: user.name, role: user.role },
      office: { _id: String(office._id), name: office.name, subscription: office.subscription },
    });
  } catch (e) {
    next(e);
  }
});
