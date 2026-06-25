import { Types } from "mongoose";
import { Transaction } from "../../models/Transaction";
import { Car } from "../../models/Car";

export interface CarPayoff {
  carId: string;
  receivedIncome: number;
  payoffPct: number;
  remaining: number;
}

// Received income for a car = sum of non-deleted income Transactions with carId set.
// Payments tied to customers are NOT attributed back to a car unless the transaction
// itself was tagged with carId — the cash from a credit payment is generic cash flow.
export async function computePayoff(tenantId: Types.ObjectId, carId: Types.ObjectId): Promise<CarPayoff> {
  const car = await Car.findOne({ _id: carId, tenantId });
  if (!car) {
    return { carId: String(carId), receivedIncome: 0, payoffPct: 0, remaining: 0 };
  }
  const [agg] = await Transaction.aggregate<{ total: number }>([
    {
      $match: {
        tenantId,
        carId,
        type: "income",
        deletedAt: null,
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const received = agg?.total ?? 0;
  const cost = car.purchaseCost;
  const pct = cost > 0 ? Math.min(100, Math.round((received / cost) * 100)) : 0;
  return {
    carId: String(car._id),
    receivedIncome: received,
    payoffPct: pct,
    remaining: Math.max(0, cost - received),
  };
}

export async function computePayoffMany(
  tenantId: Types.ObjectId,
  carIds: Types.ObjectId[],
): Promise<Map<string, CarPayoff>> {
  if (carIds.length === 0) return new Map();
  const rows = await Transaction.aggregate<{ _id: Types.ObjectId; total: number }>([
    {
      $match: {
        tenantId,
        carId: { $in: carIds },
        type: "income",
        deletedAt: null,
      },
    },
    { $group: { _id: "$carId", total: { $sum: "$amount" } } },
  ]);
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(String(r._id), r.total);

  const cars = await Car.find({ _id: { $in: carIds }, tenantId });
  const out = new Map<string, CarPayoff>();
  for (const car of cars) {
    const received = totals.get(String(car._id)) ?? 0;
    const cost = car.purchaseCost;
    const pct = cost > 0 ? Math.min(100, Math.round((received / cost) * 100)) : 0;
    out.set(String(car._id), {
      carId: String(car._id),
      receivedIncome: received,
      payoffPct: pct,
      remaining: Math.max(0, cost - received),
    });
  }
  return out;
}
