import { Router } from "express";
import { Types } from "mongoose";
import { Office } from "../../models/Office";
import { validate } from "../../middleware/validate";
import {
  listOfficesQuery,
  extendOfficeSchema,
  suspendOfficeSchema,
} from "../../validators/offices";
import { idParam } from "../../validators/common";
import { NotFound, Unauthorized } from "../../lib/errors";
import { officeHealth } from "../../services/operator/officeHealth";
import { extendSubscription } from "../../services/subscription/extend";
import { suspendOffice, unsuspendOffice } from "../../services/subscription/suspend";
import { recordAction } from "../../services/operator/auditLog";

export const operatorOfficesRouter = Router();

operatorOfficesRouter.get(
  "/offices",
  validate(listOfficesQuery, "query"),
  async (req, res, next) => {
    try {
      const q = req.query as unknown as import("zod").infer<typeof listOfficesQuery>;
      const filter: Record<string, unknown> = {};
      if (q.status === "suspended") {
        filter["subscription.suspended"] = true;
      } else if (q.status) {
        filter["subscription.status"] = q.status;
      }
      if (q.q) {
        const re = new RegExp(escapeRegex(q.q), "i");
        filter.$or = [{ name: re }, { phone: re }, { city: re }];
      }
      if (q.cursor) filter._id = { $lt: new Types.ObjectId(q.cursor) };

      const rows = await Office.find(filter)
        .sort({ _id: -1 })
        .limit(q.limit + 1)
        .lean();
      const hasMore = rows.length > q.limit;
      const items = hasMore ? rows.slice(0, q.limit) : rows;
      const nextCursor = hasMore ? String(items[items.length - 1]!._id) : null;

      res.json({
        items: items.map((o) => ({
          _id: String(o._id),
          name: o.name,
          phone: o.phone,
          city: o.city ?? null,
          lastActiveAt: o.lastActiveAt ?? null,
          createdAt: (o as { createdAt?: Date }).createdAt ?? null,
          subscription: o.subscription,
        })),
        nextCursor,
      });
    } catch (e) {
      next(e);
    }
  },
);

operatorOfficesRouter.get("/offices/:id", validate(idParam, "params"), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as { id: string };
    const data = await officeHealth(new Types.ObjectId(id));
    res.json(data);
  } catch (e) {
    next(e);
  }
});

operatorOfficesRouter.post(
  "/offices/:id/extend",
  validate(idParam, "params"),
  validate(extendOfficeSchema),
  async (req, res, next) => {
    try {
      if (!req.operator) throw Unauthorized();
      const { id } = req.params as unknown as { id: string };
      const body = req.body as import("zod").infer<typeof extendOfficeSchema>;
      const officeId = new Types.ObjectId(id);
      const office = await extendSubscription({ officeId, months: body.months });
      await recordAction(req.operator._id, "extend", "office", officeId, {
        months: body.months,
        reason: body.reason ?? null,
      });
      res.json({ subscription: office.subscription });
    } catch (e) {
      next(e);
    }
  },
);

operatorOfficesRouter.post(
  "/offices/:id/suspend",
  validate(idParam, "params"),
  validate(suspendOfficeSchema),
  async (req, res, next) => {
    try {
      if (!req.operator) throw Unauthorized();
      const { id } = req.params as unknown as { id: string };
      const body = req.body as import("zod").infer<typeof suspendOfficeSchema>;
      const officeId = new Types.ObjectId(id);
      await suspendOffice(officeId, body.reason);
      await recordAction(req.operator._id, "suspend", "office", officeId, {
        reason: body.reason ?? null,
      });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);

operatorOfficesRouter.post(
  "/offices/:id/unsuspend",
  validate(idParam, "params"),
  async (req, res, next) => {
    try {
      if (!req.operator) throw Unauthorized();
      const { id } = req.params as unknown as { id: string };
      const officeId = new Types.ObjectId(id);
      const office = await Office.findById(officeId);
      if (!office) throw NotFound("OFFICE_NOT_FOUND");
      await unsuspendOffice(officeId);
      await recordAction(req.operator._id, "unsuspend", "office", officeId);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
