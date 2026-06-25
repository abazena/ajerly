import { Router } from "express";
import { tenantId } from "../../lib/withTenant";
import { buildOverview } from "../../services/dashboard/overview";

export const tenantDashboardRouter = Router();

tenantDashboardRouter.get("/dashboard", async (req, res, next) => {
  try {
    const data = await buildOverview(tenantId(req));
    res.json(data);
  } catch (e) {
    next(e);
  }
});
