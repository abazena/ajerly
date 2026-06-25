import { Office } from "../../models/Office";
import { Voucher } from "../../models/Voucher";
import { getPlatformSettings } from "../../models/PlatformSettings";

interface OfficeCounts {
  trial: number;
  active: number;
  expired: number;
  suspended: number;
}

interface MonthBucket {
  month: string; // YYYY-MM
  revenueLyd: number;
}

interface DayBucket {
  day: string; // YYYY-MM-DD
  signups: number;
}

interface VoucherCounts {
  unused: number;
  redeemed: number;
  void: number;
}

export async function platformKpis() {
  const settings = await getPlatformSettings();

  const [
    officeCounts,
    redemptionsByMonth,
    signupsByDay,
    voucherCounts,
    trialToPaidConversion,
  ] = await Promise.all([
    countOfficesByStatus(),
    sumRedemptionRevenue(),
    countSignupsByDay(30),
    countVouchersByStatus(),
    computeTrialToPaidConversion(),
  ]);

  const activeMrr = officeCounts.active * settings.pricePerMonthLyd;

  return {
    pricePerMonthLyd: settings.pricePerMonthLyd,
    activeMrr,
    redemptionRevenueByMonth: redemptionsByMonth,
    officeCounts,
    signupsByDay,
    vouchers: voucherCounts,
    trialToPaidConversion,
  };
}

async function countOfficesByStatus(): Promise<OfficeCounts> {
  const rows = await Office.aggregate<{ _id: string; total: number; suspended: number }>([
    {
      $group: {
        _id: "$subscription.status",
        total: { $sum: 1 },
        suspended: {
          $sum: { $cond: [{ $eq: ["$subscription.suspended", true] }, 1, 0] },
        },
      },
    },
  ]);
  const out: OfficeCounts = { trial: 0, active: 0, expired: 0, suspended: 0 };
  for (const r of rows) {
    if (r._id === "trial") out.trial = r.total;
    if (r._id === "active") out.active = r.total;
    if (r._id === "expired") out.expired = r.total;
    out.suspended += r.suspended;
  }
  return out;
}

async function sumRedemptionRevenue(): Promise<MonthBucket[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await Voucher.aggregate<{ _id: { y: number; m: number }; total: number }>([
    {
      $match: {
        status: "redeemed",
        redeemedAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: { y: { $year: "$redeemedAt" }, m: { $month: "$redeemedAt" } },
        total: { $sum: { $ifNull: ["$priceLyd", 0] } },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);
  return rows.map((r) => ({
    month: `${r._id.y}-${String(r._id.m).padStart(2, "0")}`,
    revenueLyd: r.total,
  }));
}

async function countSignupsByDay(days: number): Promise<DayBucket[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const rows = await Office.aggregate<{ _id: string; total: number }>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ day: r._id, signups: r.total }));
}

async function countVouchersByStatus(): Promise<VoucherCounts> {
  const rows = await Voucher.aggregate<{ _id: string; total: number }>([
    { $group: { _id: "$status", total: { $sum: 1 } } },
  ]);
  const out: VoucherCounts = { unused: 0, redeemed: 0, void: 0 };
  for (const r of rows) {
    if (r._id === "unused") out.unused = r.total;
    if (r._id === "redeemed") out.redeemed = r.total;
    if (r._id === "void") out.void = r.total;
  }
  return out;
}

// Conversion = signups that have ever redeemed at least one voucher / total signups.
async function computeTrialToPaidConversion(): Promise<{ signups: number; converted: number; rate: number }> {
  const [signups, converted] = await Promise.all([
    Office.countDocuments({}),
    Office.countDocuments({ "subscription.lastVoucherId": { $exists: true, $ne: null } }),
  ]);
  const rate = signups > 0 ? Math.round((converted / signups) * 10000) / 100 : 0;
  return { signups, converted, rate };
}
