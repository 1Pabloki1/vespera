"use client";

import { useEffect } from "react";
import type { Tier } from "@/data/sentences";

type Props = {
  open: boolean;
  onClose: () => void;
  tier: Tier;
  setTier: (t: Tier) => void;
  mode: "flow" | "timed" | "ghost";
  setMode: (m: "flow" | "timed" | "ghost") => void;
  muted: boolean;
  toggleMuted: () => void;
  resetProgress: () => void;
};

const TIERS: { value: Tier; label: string }[] = [
  { value: 1, label: "A1–A2" },
  { value: 2, label: "B1–B2" },
  { value: 3, label: "C1 / IT" },
];
const MODES = [
  { value: "flow", label: "Flow — без таймера" },
  { value: "timed", label: "На время — дедлайн" },
  { value: "ghost", label: "Ghost — гонка с собой" },
] as const;

export default function CommandPalette({ open, onClose, tier, setTier, mode, setMode, muted, toggleMuted, resetProgress }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-32 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-96 rounded-xl border border-zinc-800 bg-[#17171a] p-4 font-sans shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">Настройки</h2>

        <div className="mb-4">
          <p className="mb-2 text-xs text-zinc-500">Уровень</p>
          <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
            {TIERS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTier(t.value)}
                className={`flex-1 rounded-md px-2 py-1 text-sm transition-colors ${
                  tier === t.value ? "bg-[#e2b714] font-semibold text-black" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs text-zinc-500">Режим</p>
          <div className="flex flex-col gap-1">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  mode === m.value ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2">
          <span className="text-sm text-zinc-400">Звук клавиш</span>
          <button
            onClick={toggleMuted}
            className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${
              muted ? "bg-zinc-700 text-zinc-400" : "bg-[#e2b714] text-black"
            }`}
          >
            {muted ? "выкл" : "вкл"}
          </button>
        </div>

        <button
          onClick={() => {
            resetProgress();
            onClose();
          }}
          className="mt-3 w-full rounded-lg border border-red-900/50 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-950/40"
        >
          Сбросить прогресс (SRS, стрик, базовый WPM)
        </button>

        <p className="mt-4 text-center text-xs text-zinc-600">esc — закрыть</p>
      </div>
    </div>
  );
}
