import { Router } from "express";
import { Types } from "mongoose";
import { Voucher } from "../../models/Voucher";
import { validate } from "../../middleware/validate";
import { generateBatchSchema, listVouchersQuery } from "../../validators/vouchers";
import { idParam } from "../../validators/common";
import { Conflict, NotFound, Unauthorized } from "../../lib/errors";
import { generateBatch } from "../../services/vouchers/generateBatch";
import { recordAction } from "../../services/operator/auditLog";
import { normalize } from "../../lib/voucherCode";

export const operatorVouchersRouter = Router();

operatorVouchersRouter.post(
  "/vouchers/batch",
  validate(generateBatchSchema),
  async (req, res, next) => {
    try {
      if (!req.operator) throw Unauthorized();
      const body = req.body as import("zod").infer<typeof generateBatchSchema>;
      const result = await generateBatch({
        operatorId: req.operator._id,
        quantity: body.quantity,
        months: body.months,
        priceLyd: body.priceLyd,
        expiresAt: body.expiresAt,
      });
      await recordAction(
        req.operator._id,
        "voucher_batch",
        "voucher",
        new Types.ObjectId(result.batchId),
        {
          quantity: body.quantity,
          months: body.months,
          priceLyd: body.priceLyd ?? null,
        },
      );
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },
);

operatorVouchersRouter.get(
  "/vouchers",
  validate(listVouchersQuery, "query"),
  async (req, res, next) => {
    try {
      const q = req.query as unknown as import("zod").infer<typeof listVouchersQuery>;
      const filter: Record<string, unknown> = {};
      if (q.status) filter.status = q.status;
      if (q.batchId) filter.batchId = new Types.ObjectId(q.batchId);
      if (q.code) filter.code = normalize(q.code);
      if (q.cursor) filter._id = { $lt: new Types.ObjectId(q.cursor) };

      const rows = await Voucher.find(filter)
        .sort({ _id: -1 })
        .limit(q.limit + 1)
        .lean();
      const hasMore = rows.length > q.limit;
      const items = hasMore ? rows.slice(0, q.limit) : rows;
      const nextCursor = hasMore ? String(items[items.length - 1]!._id) : null;

      res.json({
        items: items.map((v) => ({
          _id: String(v._id),
          code: v.code,
          months: v.months,
          priceLyd: v.priceLyd ?? null,
          status: v.status,
          batchId: v.batchId ? String(v.batchId) : null,
          redeemedByOfficeId: v.redeemedByOfficeId ? String(v.redeemedByOfficeId) : null,
          redeemedAt: v.redeemedAt ?? null,
          expiresAt: v.expiresAt ?? null,
        })),
        nextCursor,
      });
    } catch (e) {
      next(e);
    }
  },
);

operatorVouchersRouter.post(
  "/vouchers/:id/void",
  validate(idParam, "params"),
  async (req, res, next) => {
    try {
      if (!req.operator) throw Unauthorized();
      const { id } = req.params as unknown as { id: string };
      const voucher = await Voucher.findOne({ _id: id });
      if (!voucher) throw NotFound("VOUCHER_NOT_FOUND");
      if (voucher.status !== "unused") {
        throw Conflict("VOUCHER_NOT_VOIDABLE", "Only unused vouchers can be voided");
      }
      const updated = await Voucher.findOneAndUpdate(
        { _id: id, status: "unused" },
        { $set: { status: "void" } },
        { new: true },
      );
      if (!updated) {
        throw Conflict("VOUCHER_NOT_VOIDABLE", "Voucher status changed concurrently");
      }
      await recordAction(req.operator._id, "voucher_void", "voucher", updated._id as Types.ObjectId);
      res.json({ _id: String(updated._id), status: updated.status });
    } catch (e) {
      next(e);
    }
  },
);
