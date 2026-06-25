import { Request, Response, NextFunction } from "express";
import { Operator } from "../models/Operator";
import { Unauthorized } from "../lib/errors";
import { verifyOperator } from "../lib/tokens";

function extractToken(req: Request): string | null {
  const h = req.header("authorization");
  if (!h) return null;
  const [scheme, value] = h.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value;
}

export async function authOperator(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) throw Unauthorized();
    const payload = verifyOperator(token);
    const operator = await Operator.findById(payload.operatorId);
    if (!operator) throw Unauthorized();
    req.operator = operator;
    next();
  } catch {
    next(Unauthorized());
  }
}
