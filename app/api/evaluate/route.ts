import { NextResponse } from "next/server";
import { normalize, fallbackEvaluate, type Verdict } from "@/lib/localJudge";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 300;
const RATE_LIMIT = { windowMs: 60_000, max: 30 };
const hits = new Map<string, number[]>();

/** In-memory IP rate limit: max N LLM evaluations per window. */
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (arr.length >= RATE_LIMIT.max) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // bound memory
  return false;
}

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

type EvaluateRequest = {
  ru: string;
  userEn: string;
  accepted: string[];
  hesitationWords?: string[];
  motorErrorsCount?: number;
};

// ── LLM judge (OpenAI-compatible JSON mode; Gemini works via OpenAI-compat endpoint) ──
async function llmEvaluate(req: EvaluateRequest): Promise<Verdict> {
  const judgeKey = process.env.OPENAI_API_KEY; // OpenAI-compatible key (OpenAI, OpenRouter, Gemini-compat, local)
  if (!judgeKey) throw new Error("no API key"); // -> fallback in caller

  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${judgeKey}` },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a strict but fair English language examiner. Judge whether the user's English sentence is a grammatically correct and natural translation of the Russian sentence. Accept valid alternative phrasings, synonyms, and contractions. Do NOT penalize motor typos (adjacent-key slips) — judge intended language. Reply ONLY with a JSON object.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Evaluate translation. Return JSON: { isValid: boolean, score: 0-100, grammarFeedback: string (1-2 sentences, in Russian, about grammar/vocab only), betterNativeAlternative: string (most natural phrasing), detectedWeakTags: string[] (grammar tags like 'present_perfect', 'articles', 'prepositions') }",
            ru: req.ru,
            userEn: req.userEn,
            accepted: req.accepted,
            hesitationWords: req.hesitationWords ?? [],
            motorErrorsCount: req.motorErrorsCount ?? 0,
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("empty LLM response");

  const p = JSON.parse(raw); // throws -> fallback
  return {
    isValid: Boolean(p.isValid),
    score: typeof p.score === "number" ? Math.max(0, Math.min(100, Math.round(p.score))) : 0,
    grammarFeedback: String(p.grammarFeedback ?? "").slice(0, 400),
    betterNativeAlternative: String(p.betterNativeAlternative ?? req.accepted[0]),
    detectedWeakTags: Array.isArray(p.detectedWeakTags) ? p.detectedWeakTags.map(String).slice(0, 6) : [],
    source: "llm",
  };
}

export async function POST(request: Request) {
  let body: EvaluateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body?.ru || !body?.userEn || !Array.isArray(body.accepted) || body.accepted.length === 0) {
    return NextResponse.json({ error: "missing fields: ru, userEn, accepted" }, { status: 400 });
  }
  // strict input validation: oversize payloads never reach the LLM
  const tooLong =
    body.ru.length > MAX_INPUT_CHARS ||
    body.userEn.length > MAX_INPUT_CHARS ||
    body.accepted.some((v) => typeof v !== "string" || v.length > MAX_INPUT_CHARS);
  if (tooLong) {
    return NextResponse.json({ error: "input exceeds 300 characters" }, { status: 400 });
  }

  // Fast path: exact match after normalization — no LLM tokens wasted
  const userN = normalize(body.userEn);
  if (body.accepted.some((v) => normalize(v) === userN)) {
    return NextResponse.json({
      isValid: true,
      score: 100,
      grammarFeedback: "Точное совпадение с эталонным переводом.",
      betterNativeAlternative: body.accepted[0],
      detectedWeakTags: [],
      source: "exact",
    } satisfies Verdict);
  }

  // rate limit per IP — client falls back to local LCS scoring on 429.
  // Applied only to LLM calls: the exact-match fast path above is free.
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: "rate limit exceeded" }, { status: 429 });
  }

  try {
    return NextResponse.json(await llmEvaluate(body));
  } catch {
    return NextResponse.json(fallbackEvaluate(body)); // offline / no key / timeout — never 500
  }
}
