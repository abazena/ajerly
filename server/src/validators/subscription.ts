import { z } from "zod";

export const redeemSchema = z.object({
  code: z.string().min(8).max(32),
});
