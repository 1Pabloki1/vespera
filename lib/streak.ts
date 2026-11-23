// Daily streak ("Ударный режим") with a 1-day freeze. localStorage, SSR-safe.

export type Streak = { count: number; lastDate: string; freezeAvailable: boolean };

const KEY = "vespera_streak";
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function load(): Streak {
  if (typeof window === "undefined") return { count: 0, lastDate: "", freezeAvailable: true };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { freezeAvailable: true, ...JSON.parse(raw) } : { count: 0, lastDate: "", freezeAvailable: true };
  } catch {
    return { count: 0, lastDate: "", freezeAvailable: true };
  }
}

function save(s: Streak) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* non-fatal */
  }
}

/** Call once per finished session. Advances or protects the streak. */
export function touchStreak(): Streak {
  const s = load();
  const today = dayKey(new Date());
  if (s.lastDate === today) return s;

  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (s.lastDate === yesterday) {
    s.count += 1;
  } else if (s.freezeAvailable && s.count > 0) {
    s.freezeAvailable = false; // freeze consumed: gap day doesn't reset the streak
  } else {
    s.count = 1;
    s.freezeAvailable = true;
  }
  s.lastDate = today;
  save(s);
  return s;
}

export function getStreak(): Streak {
  return load();
}
