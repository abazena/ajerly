import { Schema, model, InferSchemaType } from "mongoose";
import { config } from "../config";

const platformSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "singleton" },
    pricePerMonthLyd: { type: Number, required: true },
    trialDays: { type: Number, required: true },
  },
  { timestamps: true },
);

export type IPlatformSettings = InferSchemaType<typeof platformSettingsSchema>;
export const PlatformSettings = model("PlatformSettings", platformSettingsSchema);

export async function getPlatformSettings(): Promise<IPlatformSettings> {
  const existing = await PlatformSettings.findOne({ key: "singleton" });
  if (existing) return existing.toObject();
  const created = await PlatformSettings.create({
    key: "singleton",
    pricePerMonthLyd: config.PRICE_PER_MONTH_LYD,
    trialDays: config.TRIAL_DAYS,
  });
  return created.toObject();
}
