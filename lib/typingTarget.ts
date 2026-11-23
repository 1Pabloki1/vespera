/** Pick the accepted variant whose prefix matches the typed input.
 *  Case-insensitive on BOTH sides: `typed` keeps the user's original case,
 *  `normTargets` is pre-lowercased. Without the lowercase here, typing "I w"
 *  never matches "i wake up..." and every keystroke is graded against the
 *  wrong variant — right translation, poisoned stats. */
export function pickTarget(typed: string, normTargets: string[]): string {
  const t = typed.toLowerCase();
  return normTargets.find((x) => t === x.slice(0, typed.length)) ?? normTargets[0];
}
