import { Types } from "mongoose";
import { LedgerEntry } from "../../models/LedgerEntry";

export interface StatementRow {
  _id: string;
  kind: "charge" | "payment";
  amount: number;
  carId: string | null;
  contractId: string | null;
  note?: string | null;
  date: Date;
  runningBalance: number;
}

export async function customerStatement(
  tenantId: Types.ObjectId,
  customerId: Types.ObjectId,
): Promise<StatementRow[]> {
  const entries = await LedgerEntry.find({
    tenantId,
    customerId,
    deletedAt: null,
  })
    .sort({ date: 1, _id: 1 })
    .lean();

  let running = 0;
  return entries.map((e) => {
    running += e.kind === "charge" ? e.amount : -e.amount;
    return {
      _id: String(e._id),
      kind: e.kind,
      amount: e.amount,
      carId: e.carId ? String(e.carId) : null,
      contractId: e.contractId ? String(e.contractId) : null,
      note: e.note ?? null,
      date: e.date,
      runningBalance: running,
    };
  });
}
