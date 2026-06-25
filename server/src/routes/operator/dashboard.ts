import { Router } from "express";
import { platformKpis } from "../../services/operator/platformKpis";

export const operatorDashboardRouter = Router();

operatorDashboardRouter.get("/dashboard", async (_req, res, next) => {
  try {
    res.json(await platformKpis());
  } catch (e) {
    next(e);
  }
});
