import { ClientSession, HydratedDocument, Types } from "mongoose";
import { Office, IOffice } from "../../models/Office";
import { NotFound } from "../../lib/errors";

export interface ExtendInput {
  officeId: Types.ObjectId;
  months: number;
  voucherId?: Types.ObjectId;
  session?: ClientSession;
}

// Single owner of office.subscription.expiresAt + status mutations.
// - trial / active with future expiresAt → expiresAt += months
// - trial without expiresAt → expiresAt = now + months
// - expired → expiresAt = now + months, status flips to active
export async function extendSubscription(input: ExtendInput): Promise<HydratedDocument<IOffice>> {
  const office = await Office.findById(input.officeId).session(input.session ?? null);
  if (!office) throw NotFound("OFFICE_NOT_FOUND");

  const now = new Date();
  const current = office.subscription.expiresAt;
  const base = current && current > now ? current : now;
  const next = new Date(base);
  next.setMonth(next.getMonth() + input.months);

  office.subscription.expiresAt = next;
  office.subscription.status = "active";
  if (input.voucherId) office.subscription.lastVoucherId = input.voucherId;
  await office.save({ session: input.session });
  return office;
}
