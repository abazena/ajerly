import { Types } from "mongoose";
import { Transaction } from "../../models/Transaction";

export async function cashBalance(tenantId: Types.ObjectId): Promise<number> {
  const rows = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
    { $match: { tenantId, deletedAt: null } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r._id === "income") income = r.total;
    if (r._id === "expense") expense = r.total;
  }
  return income - expense;
}

export async function todayInOut(tenantId: Types.ObjectId): Promise<{ todayIn: number; todayOut: number }> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const rows = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
    {
      $match: {
        tenantId,
        deletedAt: null,
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r._id === "income") income = r.total;
    if (r._id === "expense") expense = r.total;
  }
  return { todayIn: income, todayOut: expense };
}
