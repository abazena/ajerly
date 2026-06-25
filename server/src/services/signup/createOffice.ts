import { Office } from "../../models/Office";
import { User } from "../../models/User";
import { Settings } from "../../models/Settings";
import { getPlatformSettings } from "../../models/PlatformSettings";
import { hashPassword } from "../../lib/passwords";
import { withSession } from "../../lib/withSession";
import { Conflict } from "../../lib/errors";
import { signTenant } from "../../lib/tokens";

export interface SignupInput {
  officeName: string;
  ownerName: string;
  phone: string;
  password: string;
  city?: string;
}

export interface SignupResult {
  token: string;
  officeId: string;
  userId: string;
  trialEndsAt: Date;
}

export async function createOfficeWithOwner(input: SignupInput): Promise<SignupResult> {
  const existing = await Office.findOne({ phone: input.phone });
  if (existing) throw Conflict("OFFICE_PHONE_TAKEN", "An office with this phone already exists");

  const settings = await getPlatformSettings();
  const passwordHash = await hashPassword(input.password);
  const trialEndsAt = new Date(Date.now() + settings.trialDays * 24 * 60 * 60 * 1000);

  return withSession(async (session) => {
    const [office] = await Office.create(
      [
        {
          name: input.officeName,
          phone: input.phone,
          city: input.city,
          currency: "LYD",
          subscription: { status: "trial", trialEndsAt, suspended: false },
        },
      ],
      { session },
    );

    const [user] = await User.create(
      [
        {
          tenantId: office._id,
          name: input.ownerName,
          phone: input.phone,
          passwordHash,
          role: "owner",
        },
      ],
      { session },
    );

    await Settings.create([{ tenantId: office._id }], { session });

    const token = signTenant({
      userId: String(user._id),
      tenantId: String(office._id),
      role: "owner",
    });

    return {
      token,
      officeId: String(office._id),
      userId: String(user._id),
      trialEndsAt,
    };
  });
}
