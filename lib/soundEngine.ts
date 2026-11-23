// Synthesized mechanical keyboard sounds — Web Audio API only, zero assets.
// AudioContext is created lazily on the first user keypress (autoplay policy).

let ctx: AudioContext | null = null;

const SETTINGS_KEY = "vespera_settings";
type Settings = { muted: boolean };

function readSettings(): Settings {
  if (typeof window === "undefined") return { muted: false };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { muted: false, ...JSON.parse(raw) } : { muted: false };
  } catch {
    return { muted: false };
  }
}

function persistSettings(s: Settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* non-fatal */
  }
}

let muted = readSettings().muted;

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  persistSettings({ ...readSettings(), muted: m });
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Short enveloped oscillator tone. */
function tone(c: AudioContext, freq: number, start: number, dur: number, peak: number, type: OscillatorType = "sine") {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Crisp keyclick: bandpassed noise burst + faint low thock. */
export function click() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;

  const len = Math.floor(c.sampleRate * 0.02);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3400;
  bp.Q.value = 1.1;
  const g = c.createGain();
  g.gain.value = 0.5;
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);

  tone(c, 190, t, 0.035, 0.12, "triangle");
}

/** Soft low thud for a wrong key. */
export function error() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  tone(c, 130, c.currentTime, 0.1, 0.22, "sine");
}

/** Two-tone completion chime. */
export function complete() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 523.25, t, 0.14, 0.16);
  tone(c, 783.99, t + 0.09, 0.2, 0.16);
}
