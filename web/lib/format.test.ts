// Run: node --test lib/   (Node 24 strips TS types natively, no deps)
import { test } from "node:test";
import assert from "node:assert/strict";
import { toMinor, fromMinor, money, lyd } from "./format.ts";

test("toMinor/fromMinor round-trip", () => {
  for (const major of [0, 1, 8600, 12.5, 0.001, 99999]) {
    assert.equal(fromMinor(toMinor(major)), major);
  }
});

test("toMinor rounds to integer millimes", () => {
  assert.equal(toMinor(8.6), 8600);
  assert.equal(Number.isInteger(toMinor(12.3456)), true);
});

test("money() shows grouped major LYD from millimes", () => {
  assert.equal(money(12_400_000), "12,400"); // 12,400 LYD stored as millimes
  assert.equal(money(1_500_000), "1,500");
  assert.equal(money(0), "0");
  assert.equal(money(8_600_500), "8,600.5"); // sub-LYD precision kept
});

test("lyd() formats plain LYD integers (operator side)", () => {
  assert.equal(lyd(100), "100");
  assert.equal(lyd(1200), "1,200");
});
