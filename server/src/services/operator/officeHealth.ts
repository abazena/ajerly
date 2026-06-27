import { Types } from "mongoose";
import { Office } from "../../models/Office";
import { User } from "../../models/User";
import { Car } from "../../models/Car";
import { Voucher } from "../../models/Voucher";
import { NotFound } from "../../lib/errors";
import { format } from "../../lib/voucherCode";

// Operator view of an office. Counts only — no transactions, no ledger, no customers.
export async function officeHealth(officeId: Types.ObjectId) {
  const office = await Office.findById(officeId).lean();
  if (!office) throw NotFound("OFFICE_NOT_FOUND");

  const [carCount, userCount, redemptions] = await Promise.all([
    Car.countDocuments({ tenantId: officeId }),
    User.countDocuments({ tenantId: officeId }),
    Voucher.find({ redeemedByOfficeId: officeId })
      .sort({ redeemedAt: -1 })
      .limit(50)
      .lean(),
  ]);

  return {
    _id: String(office._id),
    name: office.name,
    phone: office.phone,
    city: office.city ?? null,
    lastActiveAt: office.lastActiveAt ?? null,
    createdAt: (office as { createdAt?: Date }).createdAt ?? null,
    subscription: office.subscription,
    carCount,
    userCount,
    redemptions: redemptions.map((v) => ({
      _id: String(v._id),
      code: format(v.code),
      months: v.months,
      priceLyd: v.priceLyd ?? null,
      redeemedAt: v.redeemedAt,
    })),
  };
}
