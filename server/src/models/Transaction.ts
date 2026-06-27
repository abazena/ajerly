import { Schema, model, Types, InferSchemaType } from "mongoose";

const transactionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
    type: { type: String, enum: ["income", "expense", "withdrawal"], required: true },
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    carId: { type: Schema.Types.ObjectId, ref: "Car" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    ledgerEntryId: { type: Schema.Types.ObjectId, ref: "LedgerEntry" },
    note: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

transactionSchema.index({ tenantId: 1, date: -1 });
transactionSchema.index({ tenantId: 1, carId: 1, date: -1 });
transactionSchema.index({ tenantId: 1, customerId: 1, date: -1 });

export type ITransaction = InferSchemaType<typeof transactionSchema> & { _id: Types.ObjectId };
export const Transaction = model("Transaction", transactionSchema);
