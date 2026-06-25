import { z } from "zod";

export const createCustomerSchema = z.object({
  kind: z.enum(["individual", "company"]),
  name: z.string().min(1).max(120),
  phone: z.string().min(1).max(30),
  idNumber: z.string().min(1).max(60).optional(),
  licencePhotoUrl: z.string().url().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuery = z.object({
  kind: z.enum(["individual", "company"]).optional(),
});
