import { z } from "zod";
import { cursorQuery, objectIdSchema } from "./common";

export const generateBatchSchema = z.object({
  quantity: z.number().int().min(1).max(1000),
  months: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
  priceLyd: z.number().int().min(0).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const listVouchersQuery = cursorQuery.extend({
  status: z.enum(["unused", "redeemed", "void"]).optional(),
  batchId: objectIdSchema.optional(),
  code: z.string().optional(),
});
