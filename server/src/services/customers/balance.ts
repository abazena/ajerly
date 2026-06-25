import { ClientSession, Types } from "mongoose";
import { LedgerEntry } from "../../models/LedgerEntry";
import { Customer } from "../../models/Customer";

// Always recompute from source-of-truth ledger entries to avoid drift.
export async function recomputeCustomerBalance(
  tenantId: Types.ObjectId,
  customerId: Types.ObjectId,
  session?: ClientSession,
): Promise<number> {
  const rows = await LedgerEntry.aggregate<{ _id: "charge" | "payment"; total: number }>([
    {
      $match: {
        tenantId,
        customerId,
        deletedAt: null,
      },
    },
    { $group: { _id: "$kind", total: { $sum: "$amount" } } },
  ]).session(session ?? null);

  let charges = 0;
  let payments = 0;
  for (const r of rows) {
    if (r._id === "charge") charges = r.total;
    if (r._id === "payment") payments = r.total;
  }
  const balance = charges - payments;
  await Customer.updateOne(
    { _id: customerId, tenantId },
    { $set: { balance } },
    { session: session ?? undefined },
  );
  return balance;
}

export async function totalOwed(tenantId: Types.ObjectId): Promise<number> {
  const [agg] = await Customer.aggregate<{ total: number }>([
    { $match: { tenantId, balance: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: "$balance" } } },
  ]);
  return agg?.total ?? 0;
}
