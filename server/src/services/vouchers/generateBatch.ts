import { Types } from "mongoose";
import { Voucher } from "../../models/Voucher";
import { generateCode, normalize, format } from "../../lib/voucherCode";

export interface GenerateBatchInput {
  operatorId: Types.ObjectId;
  quantity: number;
  months: 1 | 3 | 6 | 12;
  priceLyd?: number;
  expiresAt?: Date;
}

const MAX_RETRIES = 3;

export async function generateBatch(input: GenerateBatchInput) {
  const batchId = new Types.ObjectId();
  const created: unknown[] = [];

  for (let i = 0; i < input.quantity; i++) {
    let attempt = 0;
    let placed = false;
    while (!placed && attempt < MAX_RETRIES) {
      // Store normalized (no dashes) so lookups via normalize() match.
      // The list endpoint re-formats with dashes for display.
      const code = normalize(generateCode());
      try {
        const v = await Voucher.create({
          code,
          months: input.months,
          priceLyd: input.priceLyd,
          status: "unused",
          batchId,
          generatedBy: input.operatorId,
          expiresAt: input.expiresAt,
        });
        const obj = v.toObject();
        created.push({ ...obj, code: format(obj.code) });
        placed = true;
      } catch (err: unknown) {
        if (isDuplicateKeyError(err)) {
          attempt++;
          continue;
        }
        throw err;
      }
    }
    if (!placed) {
      throw new Error("VOUCHER_CODE_GENERATION_FAILED");
    }
  }

  return { batchId: String(batchId), vouchers: created };
}

function isDuplicateKeyError(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { code?: number }).code === 11000;
}
