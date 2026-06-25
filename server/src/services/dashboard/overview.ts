import { Types } from "mongoose";
import { Car } from "../../models/Car";
import { Transaction } from "../../models/Transaction";
import { cashBalance, todayInOut } from "../transactions/cashBalance";
import { totalOwed } from "../customers/balance";
import { computePayoffMany } from "../cars/payoff";

export async function buildOverview(tenantId: Types.ObjectId) {
  const [cash, today, owed, cars] = await Promise.all([
    cashBalance(tenantId),
    todayInOut(tenantId),
    totalOwed(tenantId),
    Car.find({ tenantId }).sort({ createdAt: -1 }).lean(),
  ]);

  const carIds = cars.map((c) => c._id as Types.ObjectId);
  const payoffs = await computePayoffMany(tenantId, carIds);

  const carPayloads = cars.map((c) => {
    const p = payoffs.get(String(c._id));
    return {
      _id: String(c._id),
      make: c.make,
      model: c.model,
      year: c.year,
      plate: c.plate,
      purchaseCost: c.purchaseCost,
      receivedIncome: p?.receivedIncome ?? 0,
      payoffPct: p?.payoffPct ?? 0,
      remaining: p?.remaining ?? c.purchaseCost,
      imageUrl: c.imageUrl ?? null,
    };
  });

  const recentTransactions = await Transaction.find({ tenantId, deletedAt: null })
    .sort({ date: -1, _id: -1 })
    .limit(10)
    .lean();

  return {
    cashBalance: cash,
    todayIn: today.todayIn,
    todayOut: today.todayOut,
    totalOwed: owed,
    paidOffCarCount: carPayloads.filter((c) => c.payoffPct >= 100).length,
    cars: carPayloads,
    recentTransactions: recentTransactions.map((t) => ({
      _id: String(t._id),
      type: t.type,
      amount: t.amount,
      carId: t.carId ? String(t.carId) : null,
      customerId: t.customerId ? String(t.customerId) : null,
      note: t.note ?? null,
      date: t.date,
    })),
  };
}
