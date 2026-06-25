import { Request, Response, NextFunction } from "express";
import { Office } from "../models/Office";
import { User } from "../models/User";
import { Unauthorized } from "../lib/errors";
import { verifyTenant } from "../lib/tokens";

function extractToken(req: Request): string | null {
  const h = req.header("authorization");
  if (!h) return null;
  const [scheme, value] = h.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value;
}

export async function authTenant(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) throw Unauthorized();
    const payload = verifyTenant(token);
    const [user, office] = await Promise.all([
      User.findById(payload.userId),
      Office.findById(payload.tenantId),
    ]);
    if (!user || !office) throw Unauthorized();
    if (String(user.tenantId) !== String(office._id)) throw Unauthorized();
    req.user = user;
    req.office = office;
    // Fire-and-forget last-active bump — never gate the response on it.
    Office.updateOne({ _id: office._id }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
    next();
  } catch {
    next(Unauthorized());
  }
}
