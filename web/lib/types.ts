// Shapes returned by the Ajer.ly API. Money in tenant payloads is integer
// millimes (×1000 LYD); operator/voucher money is plain LYD integers.

export type SubStatus = "trial" | "active" | "expired";

export interface Subscription {
  status: SubStatus;
  suspended: boolean;
  trialEndsAt: string;
  expiresAt: string | null;
  lastVoucherId?: string | null;
}

export interface TenantUser {
  _id: string;
  name: string;
  phone?: string;
  role: "owner" | "staff";
}

export interface Office {
  _id: string;
  name: string;
  city?: string | null;
  phone?: string;
  currency?: string;
  subscription: Subscription;
}

export interface LoginResponse {
  token: string;
  user: TenantUser;
  office: Office;
}

export interface MeResponse {
  user: TenantUser;
  office: Office;
}

export interface Car {
  _id: string;
  make: string;
  model: string;
  year: number;
  type?: string | null;
  plate: string;
  purchaseCost: number;
  defaultDailyRate?: number | null;
  imageUrl?: string | null;
  receivedIncome: number;
  payoffPct: number;
  remaining: number;
}

export type TxnType = "income" | "expense" | "withdrawal";

export interface Transaction {
  _id: string;
  type: TxnType;
  amount: number;
  carId?: string | null;
  customerId?: string | null;
  note?: string | null;
  date: string;
}

export interface Dashboard {
  cashBalance: number;
  todayIn: number;
  todayOut: number;
  totalOwed: number;
  paidOffCarCount: number;
  cars: Car[];
  recentTransactions: Transaction[];
}

export type CustomerKind = "individual" | "company";

export interface Customer {
  _id: string;
  kind: CustomerKind;
  name: string;
  phone: string;
  idNumber?: string | null;
  licencePhotoUrl?: string | null;
  balance: number;
}

export interface StatementRow {
  _id: string;
  kind: "charge" | "payment";
  amount: number;
  carId: string | null;
  note?: string | null;
  date: string;
  runningBalance: number;
}

export interface Statement {
  customer: { _id: string; name: string; balance: number };
  rows: StatementRow[];
}

export interface SubscriptionInfo {
  status: SubStatus;
  suspended: boolean;
  trialEndsAt: string;
  expiresAt: string | null;
  daysRemaining: number | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

// ---- operator realm ----

export interface Operator {
  _id: string;
  name: string;
  email: string;
}

export interface OperatorDashboard {
  pricePerMonthLyd: number;
  activeMrr: number;
  redemptionRevenueByMonth: { month: string; revenueLyd: number }[];
  officeCounts: { trial: number; active: number; expired: number; suspended: number };
  signupsByDay: { day: string; signups: number }[];
  vouchers: { unused: number; redeemed: number; void: number };
  trialToPaidConversion: { signups: number; converted: number; rate: number };
}

export interface OfficeHealth {
  _id: string;
  name: string;
  phone: string;
  city?: string | null;
  lastActiveAt?: string | null;
  createdAt?: string | null;
  subscription: Subscription;
  carCount: number;
  userCount: number;
  redemptions: { _id: string; code: string; months: number; priceLyd: number | null; redeemedAt: string }[];
}

export interface OfficeRow {
  _id: string;
  name: string;
  phone: string;
  city?: string | null;
  lastActiveAt?: string | null;
  createdAt?: string | null;
  subscription: Subscription;
}

export interface Voucher {
  _id: string;
  code: string;
  months: number;
  priceLyd: number | null;
  status: "unused" | "redeemed" | "void";
  batchId: string | null;
  redeemedByOfficeId: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
}
