// Thin client over the Ajer.ly API. Token per realm in localStorage, sent as
// Bearer. Throws ApiError{code,message,status} on { error } responses.
import type {
  LoginResponse, MeResponse, Dashboard, Car, Customer, Statement, Transaction,
  Page, SubscriptionInfo, Operator, OperatorDashboard, OfficeRow, OfficeHealth, Voucher,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4010/api";

export type Realm = "tenant" | "operator";
const TOKEN_KEY: Record<Realm, string> = {
  tenant: "ajerly_tenant_token",
  operator: "ajerly_operator_token",
};

export function getToken(realm: Realm): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY[realm]);
}
export function setToken(realm: Realm, token: string): void {
  window.localStorage.setItem(TOKEN_KEY[realm], token);
}
export function clearToken(realm: Realm): void {
  window.localStorage.removeItem(TOKEN_KEY[realm]);
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface Opts {
  method?: string;
  body?: unknown;
  realm?: Realm; // attach this realm's bearer token
  query?: Record<string, string | number | undefined | null>;
}

async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  const { method = "GET", body, realm, query } = opts;
  let url = BASE + path;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += "?" + s;
  }
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (realm) {
    const tok = getToken(realm);
    if (tok) headers["Authorization"] = `Bearer ${tok}`;
  }
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError("NETWORK", "تعذّر الاتصال بالخادم", 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data && data.error) || {};
    throw new ApiError(err.code ?? "UNKNOWN", err.message ?? "حدث خطأ", res.status);
  }
  return data as T;
}

export const publicApi = {
  signup: (b: { officeName: string; ownerName: string; phone: string; password: string; city?: string }) =>
    request<{ token: string; officeId: string; userId: string; trialEndsAt: string }>("/public/signup", { method: "POST", body: b }),
};

export const tenant = {
  login: (b: { phone: string; password: string }) =>
    request<LoginResponse>("/tenant/auth/login", { method: "POST", body: b }),
  me: () => request<MeResponse>("/tenant/me", { realm: "tenant" }),
  updateMe: (b: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) =>
    request<{ user: MeResponse["user"] }>("/tenant/me", { method: "PATCH", body: b, realm: "tenant" }),
  updateOffice: (b: { name?: string; city?: string }) =>
    request<{ office: MeResponse["office"] }>("/tenant/office", { method: "PATCH", body: b, realm: "tenant" }),
  dashboard: () => request<Dashboard>("/tenant/dashboard", { realm: "tenant" }),

  cars: {
    list: (status?: "all" | "owing" | "paid") =>
      request<{ cars: Car[] }>("/tenant/cars", { realm: "tenant", query: { status } }),
    create: (b: Record<string, unknown>) =>
      request<Car>("/tenant/cars", { method: "POST", body: b, realm: "tenant" }),
    update: (id: string, b: Record<string, unknown>) =>
      request<Car>(`/tenant/cars/${id}`, { method: "PATCH", body: b, realm: "tenant" }),
    get: (id: string) =>
      request<{ car: Car; recentTransactions: Transaction[] }>(`/tenant/cars/${id}`, { realm: "tenant" }),
    remove: (id: string) => request<void>(`/tenant/cars/${id}`, { method: "DELETE", realm: "tenant" }),
  },

  customers: {
    list: (kind?: "individual" | "company") =>
      request<{ customers: Customer[] }>("/tenant/customers", { realm: "tenant", query: { kind } }),
    create: (b: Record<string, unknown>) =>
      request<Customer>("/tenant/customers", { method: "POST", body: b, realm: "tenant" }),
    get: (id: string) => request<Customer>(`/tenant/customers/${id}`, { realm: "tenant" }),
    statement: (id: string) => request<Statement>(`/tenant/customers/${id}/statement`, { realm: "tenant" }),
  },

  transactions: {
    create: (b: Record<string, unknown>) =>
      request<Transaction>("/tenant/transactions", { method: "POST", body: b, realm: "tenant" }),
    remove: (id: string) => request<void>(`/tenant/transactions/${id}`, { method: "DELETE", realm: "tenant" }),
  },

  ledger: (q: { type?: "all" | "income" | "expense" | "withdrawal"; cursor?: string; limit?: number; from?: string; to?: string } = {}) =>
    request<Page<Transaction>>("/tenant/ledger", { realm: "tenant", query: q }),

  ledgerEntries: {
    charge: (b: { customerId: string; amount: number; carId?: string; note?: string }) =>
      request<{ entry: unknown; balance: number }>("/tenant/ledger-entries/charge", { method: "POST", body: b, realm: "tenant" }),
    payment: (b: { customerId: string; amount: number; carId?: string; note?: string }) =>
      request<{ ledgerEntryId: string; transactionId: string; balance: number }>("/tenant/ledger-entries/payment", { method: "POST", body: b, realm: "tenant" }),
    remove: (id: string) => request<{ balance: number }>(`/tenant/ledger-entries/${id}`, { method: "DELETE", realm: "tenant" }),
  },

  subscription: {
    get: () => request<SubscriptionInfo>("/tenant/subscription", { realm: "tenant" }),
    redeem: (code: string) =>
      request<{ status: string; expiresAt?: string }>("/tenant/subscription/redeem", { method: "POST", body: { code }, realm: "tenant" }),
  },
};

export const operator = {
  login: (b: { email: string; password: string }) =>
    request<{ token: string; operator: Operator }>("/operator/auth/login", { method: "POST", body: b }),
  me: () => request<{ operator: Operator }>("/operator/me", { realm: "operator" }),
  dashboard: () => request<OperatorDashboard>("/operator/dashboard", { realm: "operator" }),

  offices: {
    list: (q: { status?: string; q?: string; cursor?: string; limit?: number } = {}) =>
      request<Page<OfficeRow>>("/operator/offices", { realm: "operator", query: q }),
    get: (id: string) => request<OfficeHealth>(`/operator/offices/${id}`, { realm: "operator" }),
    extend: (id: string, b: { months: number; reason?: string }) =>
      request<{ subscription: unknown }>(`/operator/offices/${id}/extend`, { method: "POST", body: b, realm: "operator" }),
    suspend: (id: string, reason?: string) =>
      request<void>(`/operator/offices/${id}/suspend`, { method: "POST", body: { reason }, realm: "operator" }),
    unsuspend: (id: string) =>
      request<void>(`/operator/offices/${id}/unsuspend`, { method: "POST", body: {}, realm: "operator" }),
  },

  vouchers: {
    batch: (b: { quantity: number; months: 1 | 3 | 6 | 12; priceLyd?: number }) =>
      request<{ batchId: string; vouchers: Voucher[] }>("/operator/vouchers/batch", { method: "POST", body: b, realm: "operator" }),
    list: (q: { status?: string; code?: string; cursor?: string; limit?: number } = {}) =>
      request<Page<Voucher>>("/operator/vouchers", { realm: "operator", query: q }),
    void: (id: string) =>
      request<{ _id: string; status: string }>(`/operator/vouchers/${id}/void`, { method: "POST", body: {}, realm: "operator" }),
  },
};
