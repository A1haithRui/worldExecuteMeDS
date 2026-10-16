// Motion primitives. Every function here is pure and song-time driven, so a
// frame is reproducible after any seek and the exporter agrees with the preview.

export const clamp = (x, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
export const mix = (a, b, k) => a + (b - a) * k;
export const inv = (x) => 1 - clamp(x);
export const unlerp = (a, b, x) => (b === a ? 0 : (x - a) / (b - a));

// ---- normalised progress between two song times -------------------------
export const phase = (t, a, b) => clamp((t - a) / (b - a || 1e-9));
export const since = (t, a) => t - a;

// ---- easing -------------------------------------------------------------
export const smooth = (x) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export const easeOut = (x) => 1 - (1 - clamp(x)) ** 3;
export const easeIn = (x) => clamp(x) ** 3;
export const easeInOut = (x) => {
  const p = clamp(x);
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
};
export const easeOutQuint = (x) => 1 - (1 - clamp(x)) ** 5;
export const easeOutExpo = (x) => (clamp(x) >= 1 ? 1 : 1 - 2 ** (-10 * clamp(x)));

// Overshoot that still lands exactly on 1 at x = 1.
export const backOut = (x, s = 1.70158) => {
  const p = clamp(x) - 1;
  return 1 + (s + 1) * p ** 3 + s * p ** 2;
};
export const easeBack = (x, s = 1.2) => {
  const p = clamp(x);
  return p * p * ((s + 1) * p - s);
};

// Convenience: eased progress across a song-time window.
export const ramp = (t, a, b, fn = smooth) => fn(phase(t, a, b));

// ---- impulses -----------------------------------------------------------
// Exponential decay from an event time. Never negative, never NaN.
export const decay = (t, at, rate = 6) => Math.exp(-rate * Math.max(0, t - at));

// Triangular spike, 1 at `at`, 0 at +-width.
export const spike = (t, at, width) => Math.max(0, 1 - Math.abs(t - at) / (width || 1e-9));

// A hit: instant rise, exponential fall. `attack` lets a hit breathe in.
export const hit = (t, at, fall = 6, attack = 0) => {
  if (t < at) return attack > 0 ? clamp((t - (at - attack)) / attack) : 0;
  return Math.exp(-fall * (t - at));
};

// ---- springs ------------------------------------------------------------
// Snap fast, settle softly: 1 at x = 0, overshooting slightly, exactly 1 at x = 1.
export const spring = (x, snap = 0.18, damp = 0.12) => {
  const p = clamp(x);
  if (p <= 0) return 0;
  if (p >= 1) return 0;
  return (p / snap) * Math.exp(-(p - snap) / damp) * (1 - p);
};

// Distance recovered after a kick, 0 -> 1 with an overshoot.
export const settle = (t, at, duration = 0.25, overshoot = 0.12) => {
  const p = phase(t, at, at + duration);
  const e = easeOut(p);
  return e + overshoot * Math.sin(Math.PI * p) * (1 - p);
};

// ---- stagger / sequence -------------------------------------------------
export const stagger = (index, count, gap, duration) => ({
  from: index * gap,
  to: index * gap + duration,
  // Progress of item `index` inside a group that starts at groupStart.
  at: (t, groupStart) => phase(t, groupStart + index * gap, groupStart + index * gap + duration),
});

// ---- stepped / held signals --------------------------------------------
// Hold a value for `holdFrames` frames so a glitch reads as a pattern rather
// than as per-frame noise.
export const held = (t, holdFrames = 6, fps = 60) =>
  Math.floor(t * fps / holdFrames) * holdFrames;

export const stepAt = (t, times, values, fallback = values?.[values.length - 1] ?? 0) => {
  let v = fallback;
  for (let i = 0; i < times.length; i++) {
    if (t >= times[i]) v = values[i];
    else break;
  }
  return v;
};

// ---- deterministic randomness ------------------------------------------
export const hash01 = (a, b = 0) => {
  let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ 0x5bd1e995) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2654435761) >>> 0;
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
};

export const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), 1 | x);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

// Deterministic jitter in [-1, 1] as a function of (t, channel).
export const jitter = (t, channel = 0) => hash01(Math.round(t * 1000), channel * 7919) * 2 - 1;

// Smoothed deterministic value noise.
export const noise1 = (t, channel = 0) => {
  const i = Math.floor(t);
  const k = smooth(t - i);
  return mix(jitter(i, channel), jitter(i + 1, channel), k);
};

// Two summed sines per axis: cheap, deterministic screen shake.
export const shake = (t, amp = 1, seed = 0) => [
  amp * (Math.sin(t * 37.7 + seed) * 0.6 + Math.sin(t * 61.3 + seed * 1.7) * 0.4),
  amp * (Math.sin(t * 43.1 + seed * 2.3) * 0.6 + Math.sin(t * 71.9 + seed * 3.1) * 0.4),
];

// ---- trails -------------------------------------------------------------
// Sample a signal at the current time and N ghost steps behind it. The caller
// draws the ghosts back-to-front with falling alpha; speed gating is the
// caller's business so fast things blur and slow things do not.
export const ghosts = (fn, t, count = 3, step = 0.014) =>
  Array.from({ length: count + 1 }, (_, i) => fn(Math.max(0, t - i * step)));

// ---- palette blending ---------------------------------------------------
// Per-key lerp used to cross-fade a shot's colour state over a transition.
export const blendInto = (a, b, k, out = {}) => {
  for (const key of Object.keys(a)) {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") out[key] = mix(av, bv, k);
    else out[key] = k < 0.5 ? av : bv;
  }
  return out;
};
