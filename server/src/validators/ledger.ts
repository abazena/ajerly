import { z } from "zod";
import { cursorQuery } from "./common";

export const listLedgerQuery = cursorQuery.extend({
  type: z.enum(["income", "expense", "all"]).default("all"),
});
