import { Schema, model, Types, InferSchemaType } from "mongoose";

const settingsSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Office", required: true, unique: true },
    contractHeader: { type: String },
    contractLogoUrl: { type: String },
    defaultTermsTemplateId: { type: Schema.Types.ObjectId, ref: "TermsTemplate" },
  },
  { timestamps: true },
);

export type ISettings = InferSchemaType<typeof settingsSchema> & { _id: Types.ObjectId };
export const Settings = model("Settings", settingsSchema);
