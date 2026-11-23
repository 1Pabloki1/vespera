// QWERTY motor-typo detection: is a wrong char plausibly an adjacent-key slip?
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

type Pos = { row: number; col: number };
const POS = new Map<string, Pos>();
ROWS.forEach((row, r) => {
  for (let c = 0; c < row.length; c++) POS.set(row[c], { row: r, col: c });
});

export function keyDistance(a: string, b: string): number {
  const pa = POS.get(a.toLowerCase());
  const pb = POS.get(b.toLowerCase());
  if (!pa || !pb) return Infinity;
  const dy = pa.row - pb.row;
  // rows are staggered ~0.5 key to the right; approximate x offset
  const stagger = pb.row > pa.row ? 0.5 : pb.row < pa.row ? -0.5 : 0;
  const dx = pa.col - (pb.col + stagger);
  return Math.hypot(dx, dy);
}

/** A typo is "motor" if the intended char sits on an adjacent QWERTY key. */
export function isMotorTypo(intended: string, typed: string): boolean {
  if (intended === typed) return false;
  if (intended.toLowerCase() === typed.toLowerCase()) return true; // case slip
  return keyDistance(intended, typed) <= 1.3;
}

export function isCyrillicChar(ch: string): boolean {
  return /[а-яА-ЯёЁ]/.test(ch);
}
