import { Router } from "express";
import { operatorLoginSchema } from "../../validators/auth";
import { validate } from "../../middleware/validate";
import { Operator } from "../../models/Operator";
import { verifyPassword } from "../../lib/passwords";
import { signOperator } from "../../lib/tokens";
import { Unauthorized } from "../../lib/errors";

export const operatorAuthRouter = Router();

operatorAuthRouter.post("/auth/login", validate(operatorLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as import("zod").infer<typeof operatorLoginSchema>;
    const operator = await Operator.findOne({ email });
    if (!operator) throw Unauthorized("INVALID_CREDENTIALS");
    const ok = await verifyPassword(password, operator.passwordHash);
    if (!ok) throw Unauthorized("INVALID_CREDENTIALS");
    const token = signOperator({ operatorId: String(operator._id) });
    res.json({
      token,
      operator: { _id: String(operator._id), name: operator.name, email: operator.email },
    });
  } catch (e) {
    next(e);
  }
});
