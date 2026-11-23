import { describe, it, expect, beforeEach } from "vitest";
import { touchStreak, getStreak } from "@/lib/streak";

// in-memory localStorage stub (node has none)
const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};
// streak.ts guards on `typeof window` — emulate a browser env
(globalThis as Record<string, unknown>).window = globalThis;

const DAY = 86_400_000;

describe("streak: idempotency & local dates", () => {
  beforeEach(() => mem.clear());

  it("second workout the same day does NOT double the streak", () => {
    const a = touchStreak();
    const b = touchStreak();
    expect(a.count).toBe(1);
    expect(b.count).toBe(1);
    expect(getStreak().count).toBe(1);
  });

  it("consecutive days increment the streak", () => {
    touchStreak(new Date(2026, 10, 22, 18, 0)); // Nov 22, 18:00 local
    const s = touchStreak(new Date(2026, 10, 23, 9, 0)); // Nov 23, 09:00 local
    expect(s.count).toBe(2);
  });

  it("uses the LOCAL calendar date — 23:59 and 00:01 are different days", () => {
    touchStreak(new Date(2026, 10, 23, 23, 59)); // local late night
    const s = touchStreak(new Date(2026, 10, 24, 0, 1)); // local past midnight
    expect(s.count).toBe(2);
  });

  it("gap day consumes the freeze instead of resetting", () => {
    touchStreak(new Date(2026, 10, 20, 12, 0)); // count 1, freeze available
    const s = touchStreak(new Date(2026, 10, 22, 12, 0)); // skipped Nov 21
    expect(s.count).toBe(1); // frozen, not reset
    expect(s.freezeAvailable).toBe(false); // freeze consumed
  });

  it("two gap days reset to 1", () => {
    touchStreak(new Date(2026, 10, 20, 12, 0));
    const s = touchStreak(new Date(2026, 10, 23, 12, 0)); // 2 days missed
    expect(s.count).toBe(1);
  });
});
