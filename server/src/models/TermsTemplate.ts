// Phase 2 — schema defined now to lock shape; no endpoints in this plan.
import { Schema, model, Types, InferSchemaType } from "mongoose";

const termsTemplateSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ITermsTemplate = InferSchemaType<typeof termsTemplateSchema> & { _id: Types.ObjectId };
export const TermsTemplate = model("TermsTemplate", termsTemplateSchema);
