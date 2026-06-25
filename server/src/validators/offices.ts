import { z } from "zod";
import { cursorQuery } from "./common";

export const listOfficesQuery = cursorQuery.extend({
  status: z.enum(["trial", "active", "expired", "suspended"]).optional(),
  q: z.string().optional(),
});

export const extendOfficeSchema = z.object({
  months: z.number().int().min(1).max(60),
  reason: z.string().max(500).optional(),
});

export const suspendOfficeSchema = z.object({
  reason: z.string().max(500).optional(),
});
