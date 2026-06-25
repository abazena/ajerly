import { Schema, model, Types, InferSchemaType } from "mongoose";

const customerSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
    kind: { type: String, enum: ["individual", "company"], required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    idNumber: { type: String, trim: true },
    licencePhotoUrl: { type: String },
    balance: { type: Number, default: 0, validate: Number.isInteger },
  },
  { timestamps: true },
);

customerSchema.index({ tenantId: 1, phone: 1 });
customerSchema.index({ tenantId: 1, kind: 1 });

export type ICustomer = InferSchemaType<typeof customerSchema> & { _id: Types.ObjectId };
export const Customer = model("Customer", customerSchema);
