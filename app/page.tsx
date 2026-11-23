"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TypingArena from "@/components/TypingArena";
import PostRoundDashboard, { type Round, type Verdict } from "@/components/PostRoundDashboard";
import CommandPalette from "@/components/CommandPalette";
import GhostPacer from "@/components/GhostPacer";
import { useTypingStore } from "@/store/typingStore";
import { applyResult, getBaselineWpm, getNextSentence, getTierBaselineWpm, reinforceTags, updateTierBaselineWpm } from "@/lib/srsEngine";
import { hesitations, netWpm } from "@/lib/metrics";
import { touchStreak } from "@/lib/streak";
import { isMuted, setMuted } from "@/lib/soundEngine";
import { localEvaluate } from "@/lib/localJudge";
import { Volume2, VolumeX } from "lucide-react";
import MobileNotice from "@/components/MobileNotice";
import type { Sentence, Tier } from "@/data/sentences";

const TIERS: { value: Tier; label: string }[] = [
  { value: 1, label: "A1–A2" },
  { value: 2, label: "B1–B2" },
  { value: 3, label: "C1 / IT" },
];
const MODES = [
  { value: "flow", label: "Flow" },
  { value: "timed", label: "На время" },
  { value: "ghost", label: "Ghost" },
] as const;
type Mode = (typeof MODES)[number]["value"];

function maxPause(timestamps: number[]): number {
  let m = 0;
  for (let i = 1; i < timestamps.length; i++) m = Math.max(m, timestamps[i] - timestamps[i - 1]);
  return m;
}

/** Snapshot the current round from the typing store into a Round record. */
function snapshotRound(s: Sentence, typed: string, ms: number): Round {
  const st = useTypingStore.getState();
  const uncorrected = Math.max(0, st.errors - st.corrected);
  return {
    sentence: s,
    typed,
    ms,
    charsTyped: typed.length,
    uncorrectedErrors: uncorrected,
    correctChars: Math.max(0, typed.length - uncorrected),
    motorErrors: Math.max(0, st.errors - st.nonMotorErrors),
    nonMotorErrors: st.nonMotorErrors,
    hesitations: hesitations(st.timestamps, 1200).length,
  };
}

export default function Home() {
  const [tier, setTier] = useState<Tier>(1);
  const [mode, setMode] = useState<Mode>("flow");
  const [seed, setSeed] = useState(0);
  const sentence = useMemo(() => getNextSentence(tier), [tier, seed]); // seed forces fresh weighted pick
  const [result, setResult] = useState<{ typed: string; ms: number; timeout?: boolean } | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [verdicts, setVerdicts] = useState<Map<string, Verdict>>(new Map());
  const [toast, setToast] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const pendingEval = useRef(0);

  const toggleMuted = useCallback(() => {
    const m = !isMuted();
    setMuted(m);
    setMutedState(m);
  }, []);

  // Fire-and-forget LLM judge. On 429 / 5xx / network error / bad JSON the
  // client falls back to the SAME local LCS judge the server uses (README contract).
  const evaluateAsync = useCallback((s: Sentence, typed: string) => {
    const st = useTypingStore.getState();
    pendingEval.current += 1;
    const useLocal = (reason: string) => {
      const v = localEvaluate({ userEn: typed, accepted: s.accepted });
      setVerdicts((prev) => new Map(prev).set(s.id, v));
      setToast(`${v.isValid ? "✅" : "⚠️"} локальная оценка (${reason}): ${v.isValid ? "верно" : "есть неточности"}`);
      window.setTimeout(() => setToast(null), 4000);
    };
    fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ru: s.ru,
        userEn: typed,
        accepted: s.accepted,
        motorErrorsCount: st.errors - st.nonMotorErrors,
      }),
    })
      .then((r) => {
        if (r.status === 429) {
          useLocal("лимит запросов");
          return null;
        }
        if (!r.ok) {
          useLocal(`сервер ${r.status}`);
          return null;
        }
        return r.json().catch(() => {
          useLocal("некорректный ответ");
          return null;
        });
      })
      .then((v: Verdict | null) => {
        pendingEval.current -= 1;
        if (!v) return; // local fallback already applied above
        setVerdicts((prev) => new Map(prev).set(s.id, v));
        if (v.detectedWeakTags.length > 0) reinforceTags(v.detectedWeakTags);
        setToast(v.isValid ? `✅ «${s.ru.slice(0, 30)}…» — верно` : `⚠️ «${s.ru.slice(0, 30)}…» — есть неточности`);
        window.setTimeout(() => setToast(null), 4000);
      })
      .catch(() => {
        pendingEval.current -= 1;
        useLocal("нет сети");
      });
  }, []);

  const finish = useCallback(
    (s: Sentence) => (typed: string, ms: number) => {
      const st = useTypingStore.getState();
      applyResult({ sentence: s, nonMotorErrors: st.nonMotorErrors, maxPauseMs: maxPause(st.timestamps), ms });
      const round = snapshotRound(s, typed, ms);
      setRounds((rs) => [...rs, round]);
      updateTierBaselineWpm(s.tier, netWpm(round.charsTyped, ms / 60000, round.uncorrectedErrors));
      evaluateAsync(s, typed);
      touchStreak(); // streak advances when a round is fixed, not when dashboard opens (idempotent per day)
      setResult({ typed, ms });
    },
    [evaluateAsync]
  );

  const fail = useCallback(
    (s: Sentence) => () => {
      const st = useTypingStore.getState();
      // Real elapsed time — never record ms: 0 for a round that actually ran.
      const ms = st.startTime ? performance.now() - st.startTime : 0;
      // Timeout is "incomplete", not a linguistic error: keep the user's actual
      // nonMotorErrors instead of forcing a fake grammar penalty.
      applyResult({ sentence: s, nonMotorErrors: st.nonMotorErrors, maxPauseMs: maxPause(st.timestamps), ms });
      const round = { ...snapshotRound(s, st.typed, ms), nonMotorErrors: st.nonMotorErrors, timeout: true };
      setRounds((rs) => [...rs, round]);
      evaluateAsync(s, st.typed);
      touchStreak(); // a timed-out round is still a completed training session
      setResult({ typed: st.typed, ms, timeout: true });
    },
    [evaluateAsync]
  );

  const next = useCallback(() => {
    setResult(null);
    setSeed((x) => x + 1);
  }, []);

  // Flow mode: Enter proceeds immediately (evaluation runs in background)
  useEffect(() => {
    if (!result || showDashboard || paletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, showDashboard, paletteOpen, next]);

  // Ctrl/Cmd+K: command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const resetProgress = useCallback(() => {
    if (typeof window === "undefined") return;
    ["vespera_srs_weights", "vespera_baseline_wpm", "vespera_streak", "vespera_settings"].forEach((k) =>
      window.localStorage.removeItem(k)
    );
    setRounds([]);
    setVerdicts(new Map());
    setResult(null);
    setSeed((x) => x + 1);
  }, []);

  // Timed mode: chars / 5 / baselineWPM minutes, +50% buffer
  const timeLimitMs = useMemo(() => {
    if (mode !== "timed") return undefined;
    const chars = Math.max(...sentence.accepted.map((t) => t.length));
    return Math.round((chars / 5 / getBaselineWpm()) * 60 * 1000 * 1.5);
  }, [mode, sentence]);

  if (showDashboard) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-10">
        <PostRoundDashboard
          rounds={rounds}
          verdicts={verdicts}
          baselineWpm={getBaselineWpm()}
          onPracticeWeakSpots={() => { setShowDashboard(false); setResult(null); setSeed((x) => x + 1); }}
          onClose={() => { setRounds([]); setVerdicts(new Map()); setShowDashboard(false); setResult(null); setSeed((x) => x + 1); }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-10">
      {/* Wordmark: lowercase vespera + blinking accent underscore + muted tag */}
      <header className="mb-10 flex w-full items-center justify-between">
        <div className="flex items-baseline gap-3 font-mono">
          <span className="text-2xl tracking-tight text-[#d1d0c5]">
            vespera<span className="animate-[caret-blink_1.1s_steps(1)_infinite] text-[#e2b714]">_</span>
          </span>
          <span className="text-xs text-[#646669]">recall</span>
        </div>
        <button
          onClick={toggleMuted}
          aria-label={muted ? "Включить звук" : "Выключить звук"}
          className="rounded-lg p-2 text-[#646669] transition-colors hover:text-[#d1d0c5]"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </header>

      {/* Top bar */}
      <MobileNotice />
      <div className="mb-10 flex flex-wrap items-center gap-6 font-sans text-sm">
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          {TIERS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTier(t.value); setResult(null); setSeed((x) => x + 1); }}
              className={`rounded-md px-3 py-1 transition-colors ${
                tier === t.value ? "bg-[#e2b714] font-semibold text-black" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => { setMode(m.value); setResult(null); }}
              className={`rounded-md px-3 py-1 transition-colors ${
                mode === m.value ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowDashboard(true)}
          disabled={rounds.length === 0}
          className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-40"
        >
          Итоги ({rounds.length})
        </button>
      </div>

      {/* AI verdict toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-800 px-4 py-2 font-sans text-sm text-zinc-200 shadow-xl">
          {toast}
        </div>
      )}

      {result ? (
        <div className="text-center">
          <p className="mb-2 font-sans text-lg">
            {result.timeout ? (
              <span className="text-red-400">⏱ Время вышло</span>
            ) : (
              <span className="text-emerald-400">✓ Готово за {(result.ms / 1000).toFixed(1)}с</span>
            )}
          </p>
          <p className="mb-4 font-mono text-xl">{result.typed || "—"}</p>
          {/* Reference revealed only after the round — Active Recall stays honest */}
          <p className="mb-4 font-mono text-lg text-zinc-500">
            Эталон: <span className="text-zinc-300">{sentence.en}</span>
          </p>
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {sentence.tags.map((t) => (
              <span key={t} className="rounded-full border border-zinc-700 px-3 py-1 font-sans text-xs text-zinc-500">
                {t.replaceAll("_", " ")}
              </span>
            ))}
          </div>
          <p className="mb-6 font-sans text-xs text-zinc-600">
            {pendingEval.current > 0 ? "⏳ ИИ проверяет перевод в фоне…" : "Enter — следующее предложение"}
          </p>
          <button
            onClick={next}
            className="rounded-lg bg-[#e2b714] px-6 py-2 font-sans font-semibold text-black transition-opacity hover:opacity-90"
          >
            Дальше →
          </button>
        </div>
      ) : (
        <>
          {mode === "ghost" && (
            <GhostPacer paceWpm={getTierBaselineWpm(tier)} totalChars={sentence.en.length} />
          )}
          <TypingArena
            key={`${sentence.id}-${mode}`}
            promptRu={sentence.ru}
            targets={sentence.accepted}
            onComplete={finish(sentence)}
            timeLimitMs={timeLimitMs}
            onTimeout={fail(sentence)}
            onRestart={next}
            paused={paletteOpen}
          />
        </>
      )}

      {/* Footer keycap hints */}
      <footer className="mt-12 flex gap-6 font-mono text-xs text-[#646669]">
        <span><kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5">tab</kbd> + <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5">enter</kbd> — пропустить</span>
        <span><kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5">esc</kbd> — следующее</span>
        <span><kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5">ctrl</kbd> + <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5">k</kbd> — настройки</span>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        tier={tier}
        setTier={(t) => { setTier(t); setResult(null); setSeed((x) => x + 1); }}
        mode={mode}
        setMode={(m) => { setMode(m); setResult(null); }}
        muted={muted}
        toggleMuted={toggleMuted}
        resetProgress={resetProgress}
      />
    </main>
  );
}
