import { Types } from "mongoose";
import { OperatorAction } from "../../models/OperatorAction";

export type AuditType =
  | "extend"
  | "suspend"
  | "unsuspend"
  | "voucher_batch"
  | "voucher_void";

export async function recordAction(
  operatorId: Types.ObjectId,
  type: AuditType,
  targetType: "office" | "voucher",
  targetId: Types.ObjectId,
  payload?: Record<string, unknown>,
): Promise<void> {
  await OperatorAction.create({ operatorId, type, targetType, targetId, payload });
}
