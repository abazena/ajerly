// Phase 2 — schema defined now to lock shape; no endpoints in this plan.
import { Schema, model, Types, InferSchemaType } from "mongoose";

const contractSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
    carId: { type: Schema.Types.ObjectId, ref: "Car", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    dailyRate: { type: Number, required: true, validate: Number.isInteger },
    days: { type: Number, required: true },
    total: { type: Number, required: true, validate: Number.isInteger },
    paymentMode: { type: String, enum: ["cash", "credit"], required: true },
    termsTemplateId: { type: Schema.Types.ObjectId, ref: "TermsTemplate" },
    status: { type: String, enum: ["active", "returned", "overdue"], default: "active" },
    returnedAt: { type: Date },
    extraCharges: { type: Number, validate: Number.isInteger },
    pdfUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

contractSchema.index({ tenantId: 1, status: 1, dueDate: 1 });

export type IContract = InferSchemaType<typeof contractSchema> & { _id: Types.ObjectId };
export const Contract = model("Contract", contractSchema);
