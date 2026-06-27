import { Router } from "express";
import { Types } from "mongoose";
import { Transaction } from "../../models/Transaction";
import { validate } from "../../middleware/validate";
import { listLedgerQuery } from "../../validators/ledger";
import { withTenant } from "../../lib/withTenant";

export const tenantLedgerRouter = Router();

tenantLedgerRouter.get("/ledger", validate(listLedgerQuery, "query"), async (req, res, next) => {
  try {
    const q = req.query as unknown as import("zod").infer<typeof listLedgerQuery>;
    const filter: Record<string, unknown> = { ...withTenant(req), deletedAt: null };
    if (q.type !== "all") filter.type = q.type;
    if (q.cursor) filter._id = { $lt: new Types.ObjectId(q.cursor) };
    if (q.from || q.to) {
      const range: Record<string, Date> = {};
      if (q.from) range.$gte = q.from;
      if (q.to) range.$lt = q.to;
      filter.date = range;
    }

    const rows = await Transaction.find(filter)
      .sort({ _id: -1 })
      .limit(q.limit + 1)
      .lean();
    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    const nextCursor = hasMore ? String(items[items.length - 1]!._id) : null;

    res.json({
      items: items.map((t) => ({
        _id: String(t._id),
        type: t.type,
        amount: t.amount,
        carId: t.carId ? String(t.carId) : null,
        customerId: t.customerId ? String(t.customerId) : null,
        note: t.note ?? null,
        date: t.date,
      })),
      nextCursor,
    });
  } catch (e) {
    next(e);
  }
});
