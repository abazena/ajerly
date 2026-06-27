import { Router } from "express";
import { Types } from "mongoose";
import { LedgerEntry } from "../../models/LedgerEntry";
import { Transaction } from "../../models/Transaction";
import { Customer } from "../../models/Customer";
import { validate } from "../../middleware/validate";
import { chargeSchema, paymentSchema } from "../../validators/ledgerEntries";
import { idParam } from "../../validators/common";
import { withTenant, tenantId } from "../../lib/withTenant";
import { NotFound, Unauthorized } from "../../lib/errors";
import { withSession } from "../../lib/withSession";
import { recomputeCustomerBalance } from "../../services/customers/balance";
import { createPayment } from "../../services/transactions/createPayment";

export const tenantLedgerEntriesRouter = Router();

tenantLedgerEntriesRouter.post(
  "/ledger-entries/charge",
  validate(chargeSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw Unauthorized();
      const body = req.body as import("zod").infer<typeof chargeSchema>;
      const result = await withSession(async (session) => {
        const customer = await Customer.findOne({
          _id: body.customerId,
          ...withTenant(req),
        }).session(session);
        if (!customer) throw NotFound("CUSTOMER_NOT_FOUND");
        const [entry] = await LedgerEntry.create(
          [
            {
              tenantId: tenantId(req),
              customerId: customer._id,
              kind: "charge",
              amount: body.amount,
              carId: body.carId,
              contractId: body.contractId,
              note: body.note,
              date: body.date ?? new Date(),
            },
          ],
          { session },
        );
        const balance = await recomputeCustomerBalance(
          tenantId(req),
          customer._id as Types.ObjectId,
          session,
        );
        return { entry: entry.toObject(), balance };
      });
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },
);

tenantLedgerEntriesRouter.post(
  "/ledger-entries/payment",
  validate(paymentSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw Unauthorized();
      const body = req.body as import("zod").infer<typeof paymentSchema>;
      const result = await createPayment({
        tenantId: tenantId(req),
        userId: req.user._id,
        customerId: new Types.ObjectId(body.customerId),
        amount: body.amount,
        carId: body.carId ? new Types.ObjectId(body.carId) : undefined,
        note: body.note,
        date: body.date,
      });
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },
);

tenantLedgerEntriesRouter.delete(
  "/ledger-entries/:id",
  validate(idParam, "params"),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as { id: string };
      const result = await withSession(async (session) => {
        const entry = await LedgerEntry.findOne({
          _id: id,
          ...withTenant(req),
          deletedAt: null,
        }).session(session);
        if (!entry) throw NotFound("LEDGER_ENTRY_NOT_FOUND");
        entry.deletedAt = new Date();
        await entry.save({ session });

        if (entry.kind === "payment" && entry.transactionId) {
          await Transaction.updateOne(
            { _id: entry.transactionId, ...withTenant(req) },
            { $set: { deletedAt: new Date() } },
            { session },
          );
        }

        const balance = await recomputeCustomerBalance(
          tenantId(req),
          entry.customerId as Types.ObjectId,
          session,
        );
        return { balance };
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);
