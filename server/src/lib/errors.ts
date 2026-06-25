export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const BadRequest = (code: string, message: string, details?: unknown) =>
  new AppError(400, code, message, details);

export const Unauthorized = (code = "UNAUTHORIZED", message = "Unauthorized") =>
  new AppError(401, code, message);

export const PaymentRequired = (code = "SUBSCRIPTION_EXPIRED", message = "Subscription expired") =>
  new AppError(402, code, message);

export const Forbidden = (code = "FORBIDDEN", message = "Forbidden") =>
  new AppError(403, code, message);

export const NotFound = (code = "NOT_FOUND", message = "Not found") =>
  new AppError(404, code, message);

export const Conflict = (code: string, message: string, details?: unknown) =>
  new AppError(409, code, message, details);

export const Locked = (code = "ACCOUNT_SUSPENDED", message = "Account suspended") =>
  new AppError(423, code, message);
