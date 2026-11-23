// Daily streak ("Ударный режим") with a 1-day freeze. localStorage, SSR-safe.

export type Streak = { count: number; lastDate: string; freezeAvailable: boolean };

const KEY = "vespera_streak";
const DAY_MS = 86_400_000;
// local calendar date (not UTC) — midnight must be the user's midnight
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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

/** Call when a training round is fixed. Idempotent per local day.
 *  `now` is injectable for tests. */
export function touchStreak(now: Date = new Date()): Streak {
  const s = load();
  const today = dayKey(now);
  if (s.lastDate === today) return s; // idempotent: multiple workouts same day don't stack

  const yesterday = new Date(now.getTime() - DAY_MS);
  if (s.lastDate === dayKey(yesterday)) {
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
