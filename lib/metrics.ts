// Typing metrics: WPM, accuracy, hesitation pauses. Pure functions, no React.

export type KeystrokeEvent = { t: number; correct: boolean };

/** Net WPM: (all typed chars / 5 - uncorrected errors) per minute. */
export function netWpm(charsTyped: number, minutes: number, uncorrectedErrors: number): number {
  if (minutes <= 0) return 0;
  return Math.max(0, Math.round((charsTyped / 5 - uncorrectedErrors) / minutes));
}

/** Raw WPM: ignores errors. */
export function rawWpm(charsTyped: number, minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.round(charsTyped / 5 / minutes);
}

export function accuracy(correctChars: number, totalChars: number): number {
  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 1000) / 10;
}

/** Hesitation pauses between keystrokes (ms). Returns index pairs where pause > threshold. */
export function hesitations(timestamps: number[], thresholdMs = 1200): { index: number; pause: number }[] {
  const out: { index: number; pause: number }[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const pause = timestamps[i] - timestamps[i - 1];
    if (pause > thresholdMs) out.push({ index: i, pause });
  }
  return out;
}

/** Word index at char position (targets any valid variant's word boundaries). */
export function wordIndexAtChar(target: string, charIndex: number): number {
  let w = 0;
  for (let i = 0; i < Math.min(charIndex, target.length); i++) {
    if (target[i] === " ") w++;
  }
  return w;
}
