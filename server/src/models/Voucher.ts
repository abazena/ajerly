import { Schema, model, Types, InferSchemaType } from "mongoose";

const voucherSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    months: { type: Number, enum: [1, 3, 6, 12], required: true },
    priceLyd: { type: Number, min: 0, validate: { validator: (v: number) => v === undefined || v === null || Number.isInteger(v) } },
    status: { type: String, enum: ["unused", "redeemed", "void"], default: "unused", required: true },
    batchId: { type: Schema.Types.ObjectId },
    generatedBy: { type: Schema.Types.ObjectId, ref: "Operator", required: true },
    redeemedByOfficeId: { type: Schema.Types.ObjectId, ref: "Office" },
    redeemedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

voucherSchema.index({ status: 1, batchId: 1 });
voucherSchema.index({ redeemedByOfficeId: 1, redeemedAt: -1 });

export type IVoucher = InferSchemaType<typeof voucherSchema> & { _id: Types.ObjectId };
export const Voucher = model("Voucher", voucherSchema);
