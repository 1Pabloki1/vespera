"use client";

import { accuracy, netWpm, rawWpm } from "@/lib/metrics";
import { getTagWeights } from "@/lib/srsEngine";
import { getStreak } from "@/lib/streak";

export type Round = {
  sentence: Sentence;
  typed: string;
  ms: number;
  charsTyped: number;
  uncorrectedErrors: number;
  correctChars: number;
  motorErrors: number;    // adjacent-key slips (fat fingers)
  nonMotorErrors: number; // grammar/spelling gaps
  hesitations: number;    // pauses > 1200ms
  timeout?: boolean;      // round ended by timer, not by completing the sentence
};

import type { Sentence } from "@/data/sentences";

export type Verdict = {
  isValid: boolean;
  score: number;
  grammarFeedback: string;
  betterNativeAlternative: string;
  detectedWeakTags: string[];
  source: "exact" | "llm" | "fallback";
};

type Props = {
  rounds: Round[];
  verdicts: Map<string, Verdict>; // sentenceId -> AI verdict (may still be loading)
  baselineWpm: number;
  onPracticeWeakSpots: () => void;
  onClose: () => void;
};

export default function PostRoundDashboard({ rounds, verdicts, baselineWpm, onPracticeWeakSpots, onClose }: Props) {
  const totalMs = rounds.reduce((a, r) => a + r.ms, 0) || 1;
  const totalChars = rounds.reduce((a, r) => a + r.charsTyped, 0);
  const totalErrors = rounds.reduce((a, r) => a + r.uncorrectedErrors, 0);
  const totalCorrect = rounds.reduce((a, r) => a + r.correctChars, 0);
  const motor = rounds.reduce((a, r) => a + r.motorErrors, 0);
  const cognitive = rounds.reduce((a, r) => a + r.nonMotorErrors + r.hesitations, 0);
  const avgNet = netWpm(totalChars, totalMs / 60000, totalErrors);
  const avgRaw = rawWpm(totalChars, totalMs / 60000);
  const acc = accuracy(totalCorrect, totalChars);
  const streak = getStreak();
  const tagWeights = getTagWeights();
  const weakTags = Object.entries(tagWeights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const breakdownTotal = motor + cognitive || 1;

  return (
    <div className="w-full max-w-2xl font-sans">
      <h2 className="mb-6 text-center text-2xl font-bold">Итоги сессии</h2>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Net WPM", value: avgNet, accent: "text-[#e2b714]" },
          { label: "Raw WPM", value: avgRaw, accent: "text-zinc-100" },
          { label: "Точность", value: `${acc}%`, accent: acc >= 95 ? "text-emerald-400" : "text-red-400" },
          { label: "Предложений", value: rounds.length, accent: "text-zinc-100" },
          { label: "Базовый WPM", value: baselineWpm, accent: "text-sky-400" },
          { label: "Ударный режим", value: `🔥 ${streak.count}`, accent: "text-orange-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-zinc-900 px-3 py-4">
            <div className={`text-2xl font-bold ${s.accent}`}>{s.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Motor vs cognitive breakdown */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-400">Моторные опечатки (пальцы)</span>
          <span className="text-zinc-400">Языковые пробелы (грамматика/латентность)</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-zinc-800">
          <div className="bg-[#e2b714] transition-all" style={{ width: `${(motor / breakdownTotal) * 100}%` }} title={`${motor}`} />
          <div className="bg-red-500/70" style={{ width: `${(cognitive / breakdownTotal) * 100}%` }} title={`${cognitive}`} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-zinc-500">
          <span>{motor} ({Math.round((motor / breakdownTotal) * 100)}%)</span>
          <span>{cognitive} ({Math.round((cognitive / breakdownTotal) * 100)}%)</span>
        </div>
      </div>

      {/* Weakest tags */}
      {weakTags.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Слабые места</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            {weakTags.map(([tag, w]) => (
              <span key={tag} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                {tag.replaceAll("_", " ")} · {w.toFixed(1)}
              </span>
            ))}
          </div>
          <button
            onClick={onPracticeWeakSpots}
            className="w-full rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/30"
          >
            Потренировать слабые места →
          </button>
        </div>
      )}

      {/* Review log */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Разбор предложений</h3>
        <div className="space-y-2">
          {rounds.map((r, i) => {
            const v = verdicts.get(r.sentence.id);
            return (
              <details key={i} className="rounded-lg bg-zinc-900 px-4 py-3">
                <summary className="cursor-pointer text-sm text-zinc-300">
                  <span className="mr-2">{r.timeout ? "⏱" : v ? (v.isValid ? "✅" : "⚠️") : "⏳"}</span>
                  {r.sentence.ru}
                </summary>
                <div className="mt-3 space-y-2 font-mono text-sm">
                  <p><span className="text-zinc-500">Вы: </span>{r.typed || "—"}</p>
                  {r.timeout && <p className="font-sans text-xs text-zinc-500">не завершено за отведённое время — языковая ошибка не засчитана</p>}
                  {v && !v.isValid && (
                    <>
                      <p><span className="text-zinc-500">Естественнее: </span><span className="text-emerald-400">{v.betterNativeAlternative}</span></p>
                      <p className="font-sans text-zinc-400">{v.grammarFeedback}</p>
                    </>
                  )}
                  {v?.source === "fallback" && <p className="font-sans text-xs text-zinc-600">оценка локальная (LLM недоступен)</p>}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full rounded-lg bg-[#e2b714] px-4 py-2 font-semibold text-black transition-opacity hover:opacity-90"
      >
        Новая сессия
      </button>
    </div>
  );
}
