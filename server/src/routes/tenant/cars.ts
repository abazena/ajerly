import { Router } from "express";
import { Types } from "mongoose";
import { Car } from "../../models/Car";
import { Transaction } from "../../models/Transaction";
import { validate } from "../../middleware/validate";
import { createCarSchema, updateCarSchema, listCarsQuery } from "../../validators/cars";
import { idParam } from "../../validators/common";
import { withTenant, tenantId } from "../../lib/withTenant";
import { Conflict, NotFound } from "../../lib/errors";
import { computePayoff, computePayoffMany } from "../../services/cars/payoff";

export const tenantCarsRouter = Router();

tenantCarsRouter.get("/cars", validate(listCarsQuery, "query"), async (req, res, next) => {
  try {
    const { status } = req.query as unknown as import("zod").infer<typeof listCarsQuery>;
    const cars = await Car.find(withTenant(req)).sort({ createdAt: -1 }).lean();
    const ids = cars.map((c) => c._id as Types.ObjectId);
    const payoffs = await computePayoffMany(tenantId(req), ids);
    const enriched = cars
      .map((c) => {
        const p = payoffs.get(String(c._id));
        return {
          _id: String(c._id),
          make: c.make,
          model: c.model,
          year: c.year,
          type: c.type ?? null,
          plate: c.plate,
          purchaseCost: c.purchaseCost,
          defaultDailyRate: c.defaultDailyRate ?? null,
          imageUrl: c.imageUrl ?? null,
          receivedIncome: p?.receivedIncome ?? 0,
          payoffPct: p?.payoffPct ?? 0,
          remaining: p?.remaining ?? c.purchaseCost,
        };
      })
      .filter((c) => {
        if (status === "paid") return c.payoffPct >= 100;
        if (status === "owing") return c.payoffPct < 100;
        return true;
      });
    res.json({ cars: enriched });
  } catch (e) {
    next(e);
  }
});

tenantCarsRouter.post("/cars", validate(createCarSchema), async (req, res, next) => {
  try {
    const body = req.body as import("zod").infer<typeof createCarSchema>;
    const car = await Car.create({ ...body, tenantId: tenantId(req) });
    res.status(201).json(car.toObject());
  } catch (err: unknown) {
    if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
      return next(Conflict("CAR_PLATE_TAKEN", "A car with this plate already exists"));
    }
    next(err);
  }
});

tenantCarsRouter.get("/cars/:id", validate(idParam, "params"), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as { id: string };
    const car = await Car.findOne({ _id: id, ...withTenant(req) }).lean();
    if (!car) throw NotFound("CAR_NOT_FOUND");
    const payoff = await computePayoff(tenantId(req), car._id as Types.ObjectId);
    const recent = await Transaction.find({
      ...withTenant(req),
      carId: car._id,
      deletedAt: null,
    })
      .sort({ date: -1, _id: -1 })
      .limit(50)
      .lean();
    res.json({
      car: {
        ...car,
        _id: String(car._id),
        receivedIncome: payoff.receivedIncome,
        payoffPct: payoff.payoffPct,
        remaining: payoff.remaining,
      },
      recentTransactions: recent.map((t) => ({
        _id: String(t._id),
        type: t.type,
        amount: t.amount,
        note: t.note ?? null,
        date: t.date,
      })),
    });
  } catch (e) {
    next(e);
  }
});

tenantCarsRouter.patch(
  "/cars/:id",
  validate(idParam, "params"),
  validate(updateCarSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as { id: string };
      const body = req.body as import("zod").infer<typeof updateCarSchema>;
      const car = await Car.findOneAndUpdate(
        { _id: id, ...withTenant(req) },
        { $set: body },
        { new: true },
      );
      if (!car) throw NotFound("CAR_NOT_FOUND");
      res.json(car.toObject());
    } catch (e) {
      next(e);
    }
  },
);

tenantCarsRouter.delete("/cars/:id", validate(idParam, "params"), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as { id: string };
    const refCount = await Transaction.countDocuments({
      ...withTenant(req),
      carId: id,
      deletedAt: null,
    });
    if (refCount > 0) {
      throw Conflict("CAR_HAS_TRANSACTIONS", "Car has transactions and cannot be deleted");
    }
    const r = await Car.deleteOne({ _id: id, ...withTenant(req) });
    if (r.deletedCount === 0) throw NotFound("CAR_NOT_FOUND");
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
