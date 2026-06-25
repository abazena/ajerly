import { z } from "zod";

export const signupSchema = z.object({
  officeName: z.string().min(2).max(120),
  ownerName: z.string().min(2).max(120),
  phone: z.string().min(6).max(30),
  password: z.string().min(8).max(200),
  city: z.string().min(1).max(80).optional(),
});

export const tenantLoginSchema = z.object({
  phone: z.string().min(6).max(30),
  password: z.string().min(1).max(200),
});

export const operatorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
