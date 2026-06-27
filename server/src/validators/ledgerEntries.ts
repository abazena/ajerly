import { z } from "zod";
import { moneyMinor, objectIdSchema } from "./common";

export const chargeSchema = z.object({
  customerId: objectIdSchema,
  amount: moneyMinor,
  carId: objectIdSchema.optional(),
  contractId: objectIdSchema.optional(),
  note: z.string().max(500).optional(),
  date: z.coerce.date().optional(),
});

export const paymentSchema = z.object({
  customerId: objectIdSchema,
  amount: moneyMinor,
  carId: objectIdSchema.optional(),
  note: z.string().max(500).optional(),
  date: z.coerce.date().optional(),
});
