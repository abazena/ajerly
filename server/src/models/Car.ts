import { Schema, model, Types, InferSchemaType } from "mongoose";

const carSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    type: { type: String, trim: true },
    plate: { type: String, required: true, trim: true },
    purchaseCost: { type: Number, required: true, min: 0, validate: Number.isInteger },
    defaultDailyRate: { type: Number, min: 0, validate: { validator: (v: number) => v === undefined || v === null || Number.isInteger(v) } },
    imageUrl: { type: String },
    status: { type: String, enum: ["available", "rented", "maintenance"] },
  },
  { timestamps: true },
);

carSchema.index({ tenantId: 1, plate: 1 }, { unique: true });

export type ICar = InferSchemaType<typeof carSchema> & { _id: Types.ObjectId };
export const Car = model("Car", carSchema);
