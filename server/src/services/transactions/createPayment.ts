import { Types } from "mongoose";
import { LedgerEntry } from "../../models/LedgerEntry";
import { Transaction } from "../../models/Transaction";
import { Customer } from "../../models/Customer";
import { withSession } from "../../lib/withSession";
import { recomputeCustomerBalance } from "../customers/balance";
import { NotFound } from "../../lib/errors";

export interface CreatePaymentInput {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  customerId: Types.ObjectId;
  amount: number;
  carId?: Types.ObjectId;
  note?: string;
  date?: Date;
}

export interface CreatePaymentResult {
  ledgerEntryId: string;
  transactionId: string;
  balance: number;
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  return withSession(async (session) => {
    const customer = await Customer.findOne({
      _id: input.customerId,
      tenantId: input.tenantId,
    }).session(session);
    if (!customer) throw NotFound("CUSTOMER_NOT_FOUND");

    const date = input.date ?? new Date();

    const [ledger] = await LedgerEntry.create(
      [
        {
          tenantId: input.tenantId,
          customerId: input.customerId,
          kind: "payment",
          amount: input.amount,
          carId: input.carId,
          note: input.note,
          date,
        },
      ],
      { session },
    );

    const [txn] = await Transaction.create(
      [
        {
          tenantId: input.tenantId,
          type: "income",
          amount: input.amount,
          customerId: input.customerId,
          carId: input.carId,
          ledgerEntryId: ledger._id,
          note: input.note ?? "Customer payment",
          date,
          createdBy: input.userId,
        },
      ],
      { session },
    );

    await LedgerEntry.updateOne(
      { _id: ledger._id },
      { $set: { transactionId: txn._id } },
      { session },
    );

    const balance = await recomputeCustomerBalance(input.tenantId, input.customerId, session);

    return {
      ledgerEntryId: String(ledger._id),
      transactionId: String(txn._id),
      balance,
    };
  });
}
