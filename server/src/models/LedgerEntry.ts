import { Schema, model, Types, InferSchemaType } from "mongoose";

const ledgerEntrySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    kind: { type: String, enum: ["charge", "payment"], required: true },
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    carId: { type: Schema.Types.ObjectId, ref: "Car" },
    contractId: { type: Schema.Types.ObjectId, ref: "Contract" },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    note: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ledgerEntrySchema.index({ tenantId: 1, customerId: 1, date: -1 });

export type ILedgerEntry = InferSchemaType<typeof ledgerEntrySchema> & { _id: Types.ObjectId };
export const LedgerEntry = model("LedgerEntry", ledgerEntrySchema);
