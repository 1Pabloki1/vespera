// Deterministic local judge (LCS word similarity) — shared by the API route
// (server-side fallback) and the client (HTTP 429 / network-error fallback).
// Pure functions only: safe to import from both server and client code.

export type Verdict = {
  isValid: boolean;
  score: number; // 0-100
  grammarFeedback: string; // concise Russian feedback
  betterNativeAlternative: string;
  detectedWeakTags: string[];
  source: "exact" | "llm" | "fallback";
};

export const normalize = (s: string) =>
  s.toLowerCase().replace(/[.,!?;:'"«»„“”]/g, "").replace(/\s+/g, " ").trim();

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Word-level similarity via LCS length vs reference words. */
export function wordSimilarity(user: string, ref: string): number {
  const uw = normalize(user).split(" ");
  const rw = normalize(ref).split(" ");
  if (!rw.length) return 0;
  // LCS with tolerance: words within Levenshtein 1 count as equal
  const eq = (a: string, b: string) => a === b || levenshtein(a, b) <= 1;
  const prev = new Array<number>(rw.length + 1).fill(0);
  for (let i = 1; i <= uw.length; i++) {
    let diag = prev[0];
    for (let j = 1; j <= rw.length; j++) {
      const tmp = prev[j];
      prev[j] = eq(uw[i - 1], rw[j - 1]) ? diag + 1 : Math.max(prev[j], prev[j - 1]);
      diag = tmp;
    }
  }
  return prev[rw.length] / rw.length;
}

/** Similarity against the best-matching accepted variant. */
export function fallbackEvaluate(req: { userEn: string; accepted: string[] }): Verdict {
  let ref = req.accepted[0];
  let sim = 0;
  for (const v of req.accepted) {
    const s = wordSimilarity(req.userEn, v);
    if (s > sim) {
      sim = s;
      ref = v;
    }
  }
  const score = Math.round(sim * 100);
  const isValid = sim >= 0.85;
  return {
    isValid,
    score,
    grammarFeedback: isValid
      ? "Перевод близок к эталонному — есть мелкие неточности, проверьте формулировку ниже."
      : sim >= 0.5
      ? "Перевод частично совпадает с эталонным. Сравните свой вариант с эталоном ниже и обратите внимание на порядок слов и времена."
      : "Перевод сильно отличается от эталонного. Сверьтесь с эталоном ниже.",
    betterNativeAlternative: ref,
    detectedWeakTags: [],
    source: "fallback",
  };
}

/** Full local evaluation: exact-match fast path, then LCS fallback. */
export function localEvaluate(req: { userEn: string; accepted: string[] }): Verdict {
  const userN = normalize(req.userEn);
  const exact = req.accepted.find((v) => normalize(v) === userN);
  if (exact) {
    return {
      isValid: true,
      score: 100,
      grammarFeedback: "Точное совпадение с эталонным переводом.",
      betterNativeAlternative: exact,
      detectedWeakTags: [],
      source: "exact",
    };
  }
  return fallbackEvaluate(req);
}
