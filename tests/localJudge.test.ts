import { describe, it, expect } from "vitest";
import { normalize, levenshtein, wordSimilarity, fallbackEvaluate, localEvaluate } from "@/lib/localJudge";

describe("normalize", () => {
  it("lowercases, strips punctuation, collapses whitespace", () => {
    expect(normalize("  She, DOESN'T live!! ")).toBe("she doesnt live");
  });
});

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "abc")).toBe(0);
  });
});

describe("wordSimilarity", () => {
  it("is 1 for identical sentences", () => {
    expect(wordSimilarity("I have a dog", "I have a dog")).toBe(1);
  });
  it("tolerates small typos (Levenshtein <= 1 per word)", () => {
    expect(wordSimilarity("I hava a dog", "I have a dog")).toBe(1);
  });
  it("is case-insensitive", () => {
    expect(wordSimilarity("i HAVE a DOG", "I have a dog")).toBe(1);
  });
  it("drops when words are missing", () => {
    expect(wordSimilarity("I have dog", "I have a dog")).toBeCloseTo(0.75);
  });
});

describe("fallbackEvaluate", () => {
  const accepted = ["She has already seen this film"];

  it("scores a near-correct translation below exact", () => {
    const v = fallbackEvaluate({ userEn: "She already saw this film", accepted });
    expect(v.source).toBe("fallback");
    expect(v.score).toBeGreaterThan(40);
    expect(v.score).toBeLessThan(100);
    expect(v.isValid).toBe(false);
  });

  it("rejects unrelated input", () => {
    const v = fallbackEvaluate({ userEn: "the quick brown fox", accepted });
    expect(v.isValid).toBe(false);
    expect(v.score).toBeLessThan(50);
  });

  it("handles empty user input", () => {
    const v = fallbackEvaluate({ userEn: "", accepted });
    expect(v.isValid).toBe(false);
    expect(v.score).toBe(0);
  });

  it("picks the best-matching variant, not just the first", () => {
    const v = fallbackEvaluate({
      userEn: "She is buying milk at the shop",
      accepted: ["She buys milk at the store", "She is buying milk at the shop"],
    });
    expect(v.betterNativeAlternative).toBe("She is buying milk at the shop");
  });
});

describe("localEvaluate (client 429-fallback path)", () => {
  const accepted = ["It is cold today", "It's cold today"];

  it("exact match returns 100/exact without LLM", () => {
    const v = localEvaluate({ userEn: "it is cold today", accepted });
    expect(v.source).toBe("exact");
    expect(v.score).toBe(100);
    expect(v.isValid).toBe(true);
  });

  it("non-exact input falls to LCS scoring", () => {
    const v = localEvaluate({ userEn: "It was warm yesterday", accepted });
    expect(v.source).toBe("fallback");
    expect(v.score).toBeLessThan(70);
  });

  it("works offline with the same verdict shape as the API", () => {
    const v = localEvaluate({ userEn: "something else entirely", accepted });
    expect(v).toHaveProperty("isValid");
    expect(v).toHaveProperty("score");
    expect(v).toHaveProperty("grammarFeedback");
    expect(v).toHaveProperty("betterNativeAlternative");
    expect(v).toHaveProperty("detectedWeakTags");
  });
});
