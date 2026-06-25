import { Types } from "mongoose";
import { Office } from "../../models/Office";
import { NotFound } from "../../lib/errors";

export async function suspendOffice(
  officeId: Types.ObjectId,
  reason?: string,
): Promise<void> {
  const res = await Office.updateOne(
    { _id: officeId },
    {
      $set: {
        "subscription.suspended": true,
        "subscription.suspendedAt": new Date(),
        "subscription.suspendedReason": reason ?? null,
      },
    },
  );
  if (res.matchedCount === 0) throw NotFound("OFFICE_NOT_FOUND");
}

export async function unsuspendOffice(officeId: Types.ObjectId): Promise<void> {
  const res = await Office.updateOne(
    { _id: officeId },
    {
      $set: { "subscription.suspended": false },
      $unset: { "subscription.suspendedAt": "", "subscription.suspendedReason": "" },
    },
  );
  if (res.matchedCount === 0) throw NotFound("OFFICE_NOT_FOUND");
}
