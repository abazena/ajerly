import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";

export interface TenantTokenPayload {
  userId: string;
  tenantId: string;
  role: "owner" | "staff";
}

export interface OperatorTokenPayload {
  operatorId: string;
}

export function signTenant(payload: TenantTokenPayload): string {
  return jwt.sign(payload, config.TENANT_JWT_SECRET, {
    expiresIn: config.TENANT_JWT_TTL,
  } as SignOptions);
}

export function verifyTenant(token: string): TenantTokenPayload {
  return jwt.verify(token, config.TENANT_JWT_SECRET) as TenantTokenPayload;
}

export function signOperator(payload: OperatorTokenPayload): string {
  return jwt.sign(payload, config.OPERATOR_JWT_SECRET, {
    expiresIn: config.OPERATOR_JWT_TTL,
  } as SignOptions);
}

export function verifyOperator(token: string): OperatorTokenPayload {
  return jwt.verify(token, config.OPERATOR_JWT_SECRET) as OperatorTokenPayload;
}
