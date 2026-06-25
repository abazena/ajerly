import { z } from "zod";
import { Types } from "mongoose";

export const objectIdSchema = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), "Invalid ObjectId");

export const moneyMinor = z
  .number()
  .int("amount must be an integer (minor units)")
  .positive();

export const cursorQuery = z.object({
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const idParam = z.object({ id: objectIdSchema });
