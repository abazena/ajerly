import { Schema, model, Types, InferSchemaType } from "mongoose";

const operatorActionSchema = new Schema(
  {
    operatorId: { type: Schema.Types.ObjectId, ref: "Operator", required: true },
    type: {
      type: String,
      enum: ["extend", "suspend", "unsuspend", "voucher_batch", "voucher_void"],
      required: true,
    },
    targetType: { type: String, enum: ["office", "voucher"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

operatorActionSchema.index({ operatorId: 1, createdAt: -1 });
operatorActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export type IOperatorAction = InferSchemaType<typeof operatorActionSchema> & { _id: Types.ObjectId };
export const OperatorAction = model("OperatorAction", operatorActionSchema);
