"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTypingStore } from "@/store/typingStore";
import { isCyrillicChar, isMotorTypo } from "@/lib/typoDetector";
import { click as clickSound, error as errorSound, complete as completeSound } from "@/lib/soundEngine";

type Props = {
  promptRu: string;                       // Russian sentence shown to translate
  targets: string[];                      // valid English variants (lowercased compare)
  onComplete: (typed: string, ms: number) => void;
  timeLimitMs?: number;                   // Timed mode: fail round when it runs out
  onTimeout?: () => void;
  onRestart?: () => void;                 // Esc / Tab+Enter: skip to next sentence
};

type CharState = "idle" | "correct" | "wrong";

const normalize = (s: string) => s.toLowerCase().trim();

export default function TypingArena({ promptRu, targets, onComplete, timeLimitMs, onTimeout, onRestart }: Props) {
  const { typed, errors, push, backspace, reset, setCapsLock, capsLock } = useTypingStore();
  const [layoutWarn, setLayoutWarn] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const doneRef = useRef(false);
  const tabPressedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  const normTargets = targets.map(normalize);
  const target = normTargets.find((t) => typed === t.slice(0, typed.length)) ?? normTargets[0];
  const isComplete = normTargets.includes(normalize(typed));

  // Caret: translate3d on the current char span — no layout thrash, no re-render cost.
  const positionCaret = useCallback(() => {
    const box = containerRef.current;
    const caret = caretRef.current;
    if (!box || !caret) return;
    const span = box.querySelector<HTMLSpanElement>(`[data-idx="${typed.length}"]`);
    if (span) {
      caret.style.transform = `translate3d(${span.offsetLeft}px, ${span.offsetTop}px, 0)`;
      caret.style.height = `${span.offsetHeight}px`;
    }
  }, [typed.length]);

  useEffect(() => {
    positionCaret();
  }, [typed, positionCaret]);

  useEffect(() => {
    reset();
    doneRef.current = false;
    setLayoutWarn(false);
  }, [promptRu, reset]);

  // Complete round
  useEffect(() => {
    if (isComplete && !doneRef.current) {
      doneRef.current = true;
      completeSound();
      const s = useTypingStore.getState();
      const ms = s.startTime ? performance.now() - s.startTime : 0;
      onComplete(typed, ms);
    }
  }, [isComplete, typed, onComplete]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (doneRef.current) return;
      if (e.metaKey || e.ctrlKey || e.altKey) {
        // Ctrl+Backspace: delete last word
        if (e.key === "Backspace" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          const st = useTypingStore.getState();
          const trimmed = st.typed.replace(/\s*\S+\s*$/, "");
          useTypingStore.setState({ typed: trimmed, timestamps: st.timestamps.slice(0, trimmed.length), lastKeyWasError: false });
        }
        return;
      }
      if (e.getModifierState) setCapsLock(e.getModifierState("CapsLock"));

      // Keyboard-first: Tab arms restart, Enter confirms; Esc restarts immediately
      if (e.key === "Tab") {
        e.preventDefault();
        tabPressedRef.current = true;
        window.setTimeout(() => (tabPressedRef.current = false), 1200);
        return;
      }
      if (e.key === "Escape" || (e.key === "Enter" && tabPressedRef.current)) {
        e.preventDefault();
        tabPressedRef.current = false;
        if (!doneRef.current) {
          doneRef.current = true;
          onRestart?.();
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (e.key.length !== 1) return;
      e.preventDefault();

      if (isCyrillicChar(e.key)) {
        setLayoutWarn(true);
        return; // warn, don't poison the buffer
      }

      const expected = target[typed.length] ?? "";
      const correct = e.key === expected;
      if (correct) clickSound();
      else errorSound();
      push(e.key, correct, performance.now(), isMotorTypo(expected, e.key));
    },
    [typed, target, push, backspace, setCapsLock, onRestart]
  );

  // Timed mode countdown
  useEffect(() => {
    if (!timeLimitMs || doneRef.current) return;
    setTimeLeft(timeLimitMs);
    const iv = window.setInterval(() => {
      const start = useTypingStore.getState().startTime;
      if (!start) return;
      const left = timeLimitMs - (performance.now() - start);
      if (left <= 0) {
        window.clearInterval(iv);
        setTimeLeft(0);
        if (!doneRef.current) {
          doneRef.current = true;
          onTimeout?.();
        }
      } else {
        setTimeLeft(Math.ceil(left / 1000));
      }
    }, 250);
    return () => window.clearInterval(iv);
  }, [timeLimitMs, onTimeout, promptRu]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const states: CharState[] = target.split("").map((ch, i) => {
    if (i < typed.length) return typed[i] === ch ? "correct" : "wrong";
    return "idle";
  });

  return (
    <div className="font-mono select-none outline-none" tabIndex={0}>
      <div className="mb-4 flex items-center justify-between font-sans text-sm">
        <div className="flex gap-4">
          {layoutWarn && <span className="text-amber-400">⚠ Русская раскладка — переключи на EN</span>}
          {capsLock && <span className="text-sky-400">⇪ CapsLock включён</span>}
        </div>
        {timeLeft !== null && (
          <span className={timeLeft <= 10 ? "font-bold text-red-400" : "text-zinc-400"}>⏱ {timeLeft}с</span>
        )}
      </div>

      <p className="mb-8 font-sans text-xl text-zinc-400">{promptRu}</p>

      <div ref={containerRef} className="relative text-2xl leading-relaxed tracking-wide">
        <div
          ref={caretRef}
          className="absolute left-0 top-0 w-[2px] rounded bg-[#e2b714] transition-transform duration-75 ease-out will-change-transform"
        />
        {target.split("").map((ch, i) => (
          <span
            key={i}
            data-idx={i}
            className={
              states[i] === "correct"
                ? "text-zinc-100"
                : states[i] === "wrong"
                ? "text-red-400 underline decoration-red-500/60"
                : "text-zinc-600"
            }
          >
            {ch}
          </span>
        ))}
      </div>

      <div className="mt-8 flex gap-6 font-sans text-sm text-zinc-500">
        <span>typed: {typed.length}</span>
        <span>errors: {errors}</span>
      </div>
    </div>
  );
}
