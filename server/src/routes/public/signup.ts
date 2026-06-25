import { Router } from "express";
import { signupSchema } from "../../validators/auth";
import { validate } from "../../middleware/validate";
import { createOfficeWithOwner } from "../../services/signup/createOffice";

export const signupRouter = Router();

signupRouter.post("/public/signup", validate(signupSchema), async (req, res, next) => {
  try {
    const body = req.body as import("zod").infer<typeof signupSchema>;
    const result = await createOfficeWithOwner(body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});
