// Money + Arabic date formatting. Tenant money is integer millimes (×1000 LYD).

export const MINOR_PER_MAJOR = 1000;

export function toMinor(major: number): number {
  return Math.round(major * MINOR_PER_MAJOR);
}

export function fromMinor(minor: number): number {
  return minor / MINOR_PER_MAJOR;
}

const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });

// Display a millime amount as grouped major LYD ("12,400"). Western digits to
// match the prototype's .num style (which forces LTR).
export function money(minor: number): string {
  return grouped.format(fromMinor(minor));
}

// Operator/voucher amounts are already plain LYD integers — no ×1000.
export function lyd(major: number): string {
  return grouped.format(major);
}

const arTime = new Intl.DateTimeFormat("ar", { hour: "numeric", minute: "2-digit" });
const arFull = new Intl.DateTimeFormat("ar", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const arDayMonth = new Intl.DateTimeFormat("ar", { weekday: "long", day: "numeric", month: "long" });

export function timeAr(d: string | Date): string {
  return arTime.format(new Date(d));
}

export function dateFull(d: string | Date): string {
  return arFull.format(new Date(d));
}

const arDayMonthShort = new Intl.DateTimeFormat("ar", { day: "numeric", month: "long" });
// Short day+month (e.g. "24 يونيو") — used in compact period labels.
export function dateShort(d: string | Date): string {
  return arDayMonthShort.format(new Date(d));
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Ledger group heading: "اليوم — ...", "أمس — ...", or weekday + day/month.
export function dayHeading(d: string | Date): string {
  const date = new Date(d);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return `اليوم — ${arDayMonth.format(date)}`;
  if (dayKey(date) === dayKey(yest)) return `أمس — ${arDayMonth.format(date)}`;
  return arDayMonth.format(date);
}

// Group a list of dated items into [{ key, heading, items }] preserving order.
export function groupByDay<T>(items: T[], getDate: (t: T) => string | Date) {
  const out: { key: string; heading: string; items: T[] }[] = [];
  for (const it of items) {
    const d = new Date(getDate(it));
    const key = dayKey(d);
    const last = out[out.length - 1];
    if (last && last.key === key) last.items.push(it);
    else out.push({ key, heading: dayHeading(d), items: [it] });
  }
  return out;
}

// Two-letter Arabic initials for avatars.
export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
}
