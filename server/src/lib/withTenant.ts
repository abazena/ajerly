import { Request } from "express";
import { Types } from "mongoose";
import { Unauthorized } from "./errors";

export function tenantId(req: Request): Types.ObjectId {
  if (!req.office) throw Unauthorized();
  return req.office._id as Types.ObjectId;
}

export function withTenant(req: Request): { tenantId: Types.ObjectId } {
  return { tenantId: tenantId(req) };
}
