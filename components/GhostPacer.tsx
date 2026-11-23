"use client";

import { useEffect, useRef } from "react";
import { useTypingStore } from "@/store/typingStore";

type Props = {
  paceWpm: number;   // ghost typing speed
  totalChars: number;
};

/**
 * Ghost pacer: a thin accent bar advancing at the target WPM pace.
 * Driven by rAF writing styles directly — zero React re-renders.
 */
export default function GhostPacer({ paceWpm, totalChars }: Props) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cps = (paceWpm * 5) / 60; // characters per second at pace
    let raf = 0;
    const tick = () => {
      const start = useTypingStore.getState().startTime;
      const elapsed = start ? performance.now() - start : 0;
      const pct = Math.min(1, ((elapsed / 1000) * cps) / Math.max(1, totalChars));
      if (fillRef.current) fillRef.current.style.width = `${pct * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paceWpm, totalChars]);

  return (
    <div
      className="mb-6 h-[3px] w-full overflow-hidden rounded-full bg-zinc-800"
      title={`призрак: ${paceWpm} WPM`}
    >
      <div ref={fillRef} className="h-full rounded-full bg-[#e2b714]/60" style={{ width: "0%" }} />
    </div>
  );
}
