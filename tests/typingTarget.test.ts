import { describe, it, expect } from "vitest";
import { pickTarget } from "@/lib/typingTarget";

// t1-07 real dataset variants
const GET_UP = "i get up at seven in the morning";
const WAKE_UP = "i wake up at seven in the morning";
const VARIANTS = [GET_UP, WAKE_UP];

describe("pickTarget: case-insensitive variant selection (P0)", () => {
  it('typing "I w" selects the "wake up" variant, not the fallback "get up"', () => {
    expect(pickTarget("I w", VARIANTS)).toBe(WAKE_UP);
  });

  it("the next keystroke then matches the right expected char (the original bug)", () => {
    const t = pickTarget("I w", VARIANTS);
    expect(t[2]).toBe("w"); // 'w' keystroke is CORRECT — old code graded it against 't'
  });

  it("full lowercase path unchanged", () => {
    expect(pickTarget("i wa", VARIANTS)).toBe(WAKE_UP);
    expect(pickTarget("i g", VARIANTS)).toBe(GET_UP);
  });

  it("no prefix match -> falls back to first variant", () => {
    expect(pickTarget("xyz", VARIANTS)).toBe(GET_UP);
  });

  it("empty input -> first variant", () => {
    expect(pickTarget("", VARIANTS)).toBe(GET_UP);
  });

  it("single-variant datasets unaffected", () => {
    expect(pickTarget("I ", ["i like coffee"])).toBe("i like coffee");
  });
});
