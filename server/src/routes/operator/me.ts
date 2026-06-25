import { Router } from "express";
import { Unauthorized } from "../../lib/errors";

export const operatorMeRouter = Router();

operatorMeRouter.get("/me", (req, res, next) => {
  try {
    if (!req.operator) throw Unauthorized();
    res.json({
      _id: String(req.operator._id),
      name: req.operator.name,
      email: req.operator.email,
      role: req.operator.role,
    });
  } catch (e) {
    next(e);
  }
});
