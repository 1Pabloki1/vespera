import { describe, it, expect, beforeEach } from "vitest";
import { useTypingStore } from "@/store/typingStore";

const st = () => useTypingStore.getState();

describe("typingStore backspace & corrected accounting", () => {
  beforeEach(() => st().reset());

  it("typo -> backspace -> correct char: errors=1, corrected=1", () => {
    st().push("X", false, 1, false);
    st().backspace();
    st().push("I", true, 2, false);
    expect(st().errors).toBe(1);
    expect(st().corrected).toBe(1);
    expect(st().typed).toBe("I");
  });

  it("several wrong chars in a row: each backspace of a wrong char counts once", () => {
    st().push("x", false, 1, false);
    st().push("y", false, 2, false);
    expect(st().corrected).toBe(0); // typing more wrong keys is NOT correcting
    st().backspace();
    st().backspace();
    expect(st().corrected).toBe(2);
    expect(st().errors).toBe(2);
  });

  it("deleting a CORRECT char does not increment corrected", () => {
    st().push("I", true, 1, false);
    st().push(" ", true, 2, false);
    st().backspace();
    expect(st().corrected).toBe(0);
    expect(st().typed).toBe("I");
  });

  it("bulk backspace (ctrl+backspace) counts only wrong chars in the removed span", () => {
    st().push("a", true, 1, false);
    st().push("b", false, 2, false);
    st().push("c", false, 3, false);
    st().backspace(2); // removes "bc" — 2 corrected
    expect(st().corrected).toBe(2);
    expect(st().typed).toBe("a");
  });

  it("backspace on empty buffer is a no-op", () => {
    st().backspace();
    expect(st().typed).toBe("");
    expect(st().corrected).toBe(0);
  });

  it("nonMotorErrors counts only non-motor wrong keys", () => {
    st().push("x", false, 1, false); // real spelling gap
    st().push("y", false, 2, true);  // motor typo
    expect(st().errors).toBe(2);
    expect(st().nonMotorErrors).toBe(1);
  });

  it("timestamps shrink with backspace (hesitation data stays aligned)", () => {
    st().push("a", true, 10, false);
    st().push("b", true, 20, false);
    st().backspace();
    expect(st().timestamps).toEqual([10]);
  });
});
