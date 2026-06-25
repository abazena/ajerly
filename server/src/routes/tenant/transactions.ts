import { Router } from "express";
import { Transaction } from "../../models/Transaction";
import { Types } from "mongoose";
import { validate } from "../../middleware/validate";
import {
  createTransactionSchema,
  listTransactionsQuery,
} from "../../validators/transactions";
import { idParam } from "../../validators/common";
import { withTenant, tenantId } from "../../lib/withTenant";
import { Conflict, NotFound, Unauthorized } from "../../lib/errors";

export const tenantTransactionsRouter = Router();

tenantTransactionsRouter.post(
  "/transactions",
  validate(createTransactionSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw Unauthorized();
      const body = req.body as import("zod").infer<typeof createTransactionSchema>;
      const txn = await Transaction.create({
        ...body,
        date: body.date ?? new Date(),
        tenantId: tenantId(req),
        createdBy: req.user._id,
      });
      res.status(201).json(txn.toObject());
    } catch (e) {
      next(e);
    }
  },
);

tenantTransactionsRouter.get(
  "/transactions",
  validate(listTransactionsQuery, "query"),
  async (req, res, next) => {
    try {
      const q = req.query as unknown as import("zod").infer<typeof listTransactionsQuery>;
      const filter: Record<string, unknown> = { ...withTenant(req), deletedAt: null };
      if (q.type !== "all") filter.type = q.type;
      if (q.carId) filter.carId = new Types.ObjectId(q.carId);
      if (q.customerId) filter.customerId = new Types.ObjectId(q.customerId);
      if (q.from || q.to) {
        const range: Record<string, Date> = {};
        if (q.from) range.$gte = q.from;
        if (q.to) range.$lt = q.to;
        filter.date = range;
      }
      if (q.cursor) filter._id = { $lt: new Types.ObjectId(q.cursor) };

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
  },
);

tenantTransactionsRouter.delete(
  "/transactions/:id",
  validate(idParam, "params"),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as { id: string };
      const txn = await Transaction.findOne({ _id: id, ...withTenant(req), deletedAt: null });
      if (!txn) throw NotFound("TRANSACTION_NOT_FOUND");
      if (txn.ledgerEntryId) {
        throw Conflict(
          "TRANSACTION_LINKED_TO_LEDGER",
          "Delete the linked ledger entry instead",
        );
      }
      txn.deletedAt = new Date();
      await txn.save();
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);
