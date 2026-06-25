import { Types } from "mongoose";
import { Voucher } from "../../models/Voucher";
import { Office } from "../../models/Office";
import { withSession } from "../../lib/withSession";
import { Conflict, NotFound } from "../../lib/errors";
import { extendSubscription } from "../subscription/extend";
import { normalize } from "../../lib/voucherCode";

export interface RedeemInput {
  officeId: Types.ObjectId;
  code: string;
}

export interface RedeemResult {
  voucherId: string;
  months: number;
  subscription: {
    status: "active";
    expiresAt: Date;
  };
}

export async function redeemVoucher(input: RedeemInput): Promise<RedeemResult> {
  const codeUpper = normalize(input.code);
  return withSession(async (session) => {
    // Atomic CAS: only flip unused → redeemed. If returns null, someone else won.
    const voucher = await Voucher.findOneAndUpdate(
      {
        code: codeUpper,
        status: "unused",
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
      {
        $set: {
          status: "redeemed",
          redeemedByOfficeId: input.officeId,
          redeemedAt: new Date(),
        },
      },
      { new: true, session },
    );
    if (!voucher) {
      // Distinguish "not found" vs "not redeemable" by a lookup.
      const exists = await Voucher.findOne({ code: codeUpper }).session(session);
      if (!exists) throw NotFound("VOUCHER_NOT_FOUND", "Voucher code not found");
      throw Conflict("VOUCHER_NOT_REDEEMABLE", "Voucher already redeemed, void, or expired");
    }

    const office = await extendSubscription({
      officeId: input.officeId,
      months: voucher.months,
      voucherId: voucher._id as Types.ObjectId,
      session,
    });

    return {
      voucherId: String(voucher._id),
      months: voucher.months,
      subscription: {
        status: "active",
        expiresAt: office.subscription.expiresAt!,
      },
    };
  });
}
