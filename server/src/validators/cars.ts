import { z } from "zod";
import { moneyMinor } from "./common";

export const createCarSchema = z.object({
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1900).max(2100),
  type: z.string().min(1).max(60).optional(),
  plate: z.string().min(1).max(40),
  purchaseCost: moneyMinor,
  defaultDailyRate: moneyMinor.optional(),
  imageUrl: z.string().url().optional(),
});

export const updateCarSchema = createCarSchema.partial();

export const listCarsQuery = z.object({
  status: z.enum(["owing", "paid", "all"]).default("all"),
});
