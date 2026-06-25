import { Schema, model, Types, InferSchemaType } from "mongoose";

const subscriptionSchema = new Schema(
  {
    status: { type: String, enum: ["trial", "active", "expired"], required: true },
    trialEndsAt: { type: Date, required: true },
    expiresAt: { type: Date },
    lastVoucherId: { type: Schema.Types.ObjectId, ref: "Voucher" },
    suspended: { type: Boolean, default: false },
    suspendedAt: { type: Date },
    suspendedReason: { type: String },
  },
  { _id: false },
);

const officeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    currency: { type: String, default: "LYD" },
    logoUrl: { type: String },
    lastActiveAt: { type: Date },
    subscription: { type: subscriptionSchema, required: true },
  },
  { timestamps: true },
);

export type IOffice = InferSchemaType<typeof officeSchema> & { _id: Types.ObjectId };
export const Office = model("Office", officeSchema);
