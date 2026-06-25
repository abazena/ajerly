import { Schema, model, Types, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "staff"], default: "owner" },
  },
  { timestamps: true },
);

userSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

export type IUser = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export const User = model("User", userSchema);
