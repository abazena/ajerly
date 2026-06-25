// Money is stored as integer minor units (millimes — 1/1000 LYD).
// Conversions live here. Business code only ever sees integers.

export const MINOR_PER_MAJOR = 1000;

export function toMinor(majorAmount: number): number {
  if (!Number.isFinite(majorAmount)) {
    throw new Error("toMinor: not a finite number");
  }
  return Math.round(majorAmount * MINOR_PER_MAJOR);
}

export function fromMinor(minorAmount: number): number {
  return minorAmount / MINOR_PER_MAJOR;
}

export function sumMinor(values: number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

export function assertInteger(amount: number, label = "amount"): void {
  if (!Number.isInteger(amount)) {
    throw new Error(`${label} must be an integer (minor units)`);
  }
}

export function assertPositive(amount: number, label = "amount"): void {
  if (!(amount > 0)) {
    throw new Error(`${label} must be positive`);
  }
}
