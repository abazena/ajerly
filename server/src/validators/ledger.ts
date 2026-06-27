import { z } from "zod";
import { cursorQuery } from "./common";

export const listLedgerQuery = cursorQuery.extend({
  type: z.enum(["income", "expense", "withdrawal", "all"]).default("all"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
