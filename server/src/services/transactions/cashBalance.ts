import { Types } from "mongoose";
import { Transaction } from "../../models/Transaction";

type TxnType = "income" | "expense" | "withdrawal";

// Cash on hand = income − (expense + withdrawal). A withdrawal drains cash but is
// not a business expense; the split is preserved by callers (e.g. todayInOut) so
// reports can treat them differently.
export async function cashBalance(tenantId: Types.ObjectId): Promise<number> {
  const rows = await Transaction.aggregate<{ _id: TxnType; total: number }>([
    { $match: { tenantId, deletedAt: null } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const sum: Record<TxnType, number> = { income: 0, expense: 0, withdrawal: 0 };
  for (const r of rows) sum[r._id] = r.total;
  return sum.income - sum.expense - sum.withdrawal;
}

export async function todayInOut(
  tenantId: Types.ObjectId,
): Promise<{ todayIn: number; todayOut: number; todayWithdrawn: number }> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const rows = await Transaction.aggregate<{ _id: TxnType; total: number }>([
    { $match: { tenantId, deletedAt: null, date: { $gte: start, $lt: end } } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const sum: Record<TxnType, number> = { income: 0, expense: 0, withdrawal: 0 };
  for (const r of rows) sum[r._id] = r.total;
  return { todayIn: sum.income, todayOut: sum.expense, todayWithdrawn: sum.withdrawal };
}
