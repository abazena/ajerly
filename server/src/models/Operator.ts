import { Schema, model, Types, InferSchemaType } from "mongoose";

const operatorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["operator"], default: "operator" },
  },
  { timestamps: true },
);

export type IOperator = InferSchemaType<typeof operatorSchema> & { _id: Types.ObjectId };
export const Operator = model("Operator", operatorSchema);
