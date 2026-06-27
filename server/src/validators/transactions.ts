import { z } from "zod";
import { moneyMinor, objectIdSchema, cursorQuery } from "./common";

export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense", "withdrawal"]),
  amount: moneyMinor,
  carId: objectIdSchema.optional(),
  customerId: objectIdSchema.optional(),
  note: z.string().max(500).optional(),
  date: z.coerce.date().optional(),
});

export const listTransactionsQuery = cursorQuery.extend({
  type: z.enum(["income", "expense", "withdrawal", "all"]).default("all"),
  carId: objectIdSchema.optional(),
  customerId: objectIdSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
