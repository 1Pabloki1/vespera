"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SETTINGS_KEY = "vespera_settings";

/** Dismissible notice for narrow screens: Vespera is built for physical keyboards. */
export default function MobileNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;
    try {
      const dismissed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}")?.mobileNoticeDismissed;
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      const s = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}");
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, mobileNoticeDismissed: true }));
    } catch {
      /* non-fatal */
    }
  };

  return (
    <div className="mb-6 flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 font-sans text-sm text-zinc-400">
      <span>
        Vespera заточена под физическую клавиатуру — на мобильном можно попробовать, но фокус-тренировка работает лучше с клавишами.
      </span>
      <button onClick={dismiss} aria-label="Закрыть уведомление" className="shrink-0 text-zinc-600 transition-colors hover:text-zinc-300">
        <X size={16} />
      </button>
    </div>
  );
}
