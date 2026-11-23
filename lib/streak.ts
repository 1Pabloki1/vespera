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
 *  `now` is injectable for tests.
 *
 *  Gap rule: the freeze covers EXACTLY ONE missed calendar day.
 *  Two or more missed days always reset — no unlimited freeze.
 *  Day math is calendar-based (local dates), not `now - 24h`,
 *  so DST transitions (23h/25h days) can't corrupt the streak. */
export function touchStreak(now: Date = new Date()): Streak {
  const s = load();
  const today = dayKey(now);
  if (s.lastDate === today) return s; // idempotent: multiple workouts same day don't stack

  const last = s.lastDate ? new Date(`${s.lastDate}T00:00:00`) : null;
  // calendar-day difference, immune to DST: count midnights between the two local dates
  const missedDays = last ? Math.round((Date.parse(today) - Date.parse(s.lastDate)) / DAY_MS) : Infinity;

  if (missedDays === 1) {
    s.count += 1;
  } else if (missedDays === 2 && s.freezeAvailable && s.count > 0) {
    s.freezeAvailable = false; // freeze consumed: exactly one missed day doesn't reset
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
