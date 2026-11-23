import { SENTENCES, type Sentence, type Tier } from "@/data/sentences";
import { rawWpm } from "@/lib/metrics";

// Gap engine: tag weakness weights + sentence history in localStorage (SSR-safe).

type SrsState = {
  tagWeights: Record<string, number>; // tag -> weakness (0 = strong)
  lastIds: string[];                  // last served sentence ids (repetition guard)
  baselineWpm: number;                // adapts: EWMA of fast clean rounds
};

const KEY = "vespera_srs_weights";
const BASELINE_KEY = "vespera_baseline_wpm";
const HESITATION_MS = 1200;

const defaults: SrsState = { tagWeights: {}, lastIds: [], baselineWpm: 35 };

function load(): SrsState {
  if (typeof window === "undefined") return defaults; // SSR guard
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function save(s: SrsState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full/blocked — non-fatal */
  }
}

export type RoundResult = {
  sentence: Sentence;
  nonMotorErrors: number; // wrong keys that are NOT adjacent-key slips
  maxPauseMs: number;     // longest hesitation before a word
  ms: number;             // round duration
};

/** Feed a finished round into the gap model. */
export function applyResult(r: RoundResult): SrsState {
  const s = load();
  const weak = r.nonMotorErrors > 0 || r.maxPauseMs > HESITATION_MS;
  const fastAndClean = !weak && rawWpm(r.sentence.en.length, r.ms / 60000) >= s.baselineWpm;

  for (const tag of r.sentence.tags) {
    if (weak) s.tagWeights[tag] = Math.min(10, (s.tagWeights[tag] ?? 0) + 1);
    else if (fastAndClean) s.tagWeights[tag] = Math.max(0, (s.tagWeights[tag] ?? 0) - 0.25);
  }
  if (fastAndClean) {
    const wpm = rawWpm(r.sentence.en.length, r.ms / 60000);
    s.baselineWpm = Math.round((s.baselineWpm * 0.8 + wpm * 0.2) * 10) / 10; // EWMA
  }
  s.lastIds = [r.sentence.id, ...s.lastIds.filter((id) => id !== r.sentence.id)].slice(0, 5);
  save(s);
  return s;
}

/** Weighted pick: weak tags up-weighted, last 5 ids excluded. */
export function getNextSentence(tier: Tier): Sentence {
  const s = load();
  const pool = SENTENCES.filter((x) => x.tier === tier && !s.lastIds.includes(x.id));
  const candidates = pool.length > 0 ? pool : SENTENCES.filter((x) => x.tier === tier);

  let total = 0;
  const weights = candidates.map((x) => {
    const w = 1 + x.tags.reduce((acc, t) => acc + (s.tagWeights[t] ?? 0), 0);
    total += w;
    return w;
  });
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Reinforce tags flagged by the LLM judge (arrives async, after round ended). */
export function reinforceTags(tags: string[]): SrsState {
  const s = load();
  for (const tag of tags) s.tagWeights[tag] = Math.min(10, (s.tagWeights[tag] ?? 0) + 0.5);
  save(s);
  return s;
}

export function getTagWeights(): Record<string, number> {  return load().tagWeights;
}

export function getBaselineWpm(): number {
  return load().baselineWpm;
}

/** Rolling per-tier Net WPM baseline (Ghost pace target). */
export function getTierBaselineWpm(tier: Tier): number {
  const s = load();
  if (typeof window === "undefined") return s.baselineWpm;
  try {
    const perTier = JSON.parse(window.localStorage.getItem(BASELINE_KEY) ?? "{}") as Record<string, number>;
    return typeof perTier[tier] === "number" && perTier[tier] > 0 ? perTier[tier] : s.baselineWpm;
  } catch {
    return s.baselineWpm;
  }
}

/** EWMA-update the per-tier baseline with a finished round's Net WPM. */
export function updateTierBaselineWpm(tier: Tier, wpm: number) {
  if (typeof window === "undefined" || wpm <= 0) return;
  try {
    const perTier = JSON.parse(window.localStorage.getItem(BASELINE_KEY) ?? "{}") as Record<string, number>;
    const prev = typeof perTier[tier] === "number" && perTier[tier] > 0 ? perTier[tier] : wpm;
    perTier[tier] = Math.round((prev * 0.7 + wpm * 0.3) * 10) / 10;
    window.localStorage.setItem(BASELINE_KEY, JSON.stringify(perTier));
  } catch {
    /* non-fatal */
  }
}
