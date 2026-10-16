// Ambient deep-sea motion.
//
// The measured problem this solves: most shots changed almost nothing between
// consecutive frames, so the film read as a slideshow of stills. This layer is
// composited over every shot and is in continuous motion.
//
// Design lesson from measuring it: fine detail is worthless here. A 2px mote at
// 6% alpha moves the frame-to-frame difference by almost nothing and reads as
// static. What registers is LARGE AREA changing at once, so the layer is built
// from wide light events -- drifting godray shafts, a caustic band that sweeps
// the frame on every beat, and expanding sonar rings -- and the motes are only
// there to keep the space from looking empty.
//
// Everything stays subordinate: the house rule is that support layers sit below
// roughly 40% of the subject's contrast, so alphas stay low and the layer never
// competes with the shot's own content.
//
// Pure function of song time; no accumulated state.
import { hash01, clamp } from "./motion.js";

const SPRITE = 48;

let sprite = null;
function moteSprite() {
  if (sprite) return sprite;
  const c = document.createElement("canvas");
  c.width = SPRITE;
  c.height = SPRITE;
  const g = c.getContext("2d");
  const r = SPRITE / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.22, "rgba(205,242,246,0.6)");
  grad.addColorStop(1, "rgba(140,220,235,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE, SPRITE);
  sprite = c;
  return c;
}

/** Soft vertical light shaft: a large moving area, which is what reads as motion. */
function drawShafts(ctx, t, width, height, count, alpha, lowEnv) {
  for (let i = 0; i < count; i++) {
    const speed = 11 + hash01(i, 31) * 15;
    const period = width * 1.9;
    const base = hash01(i, 32) * period;
    const sway = Math.sin(t * 0.09 + i * 1.7) * 120;
    const x = ((base + t * speed + sway) % period) - width * 0.35;
    const w = 120 + hash01(i, 33) * 260;
    const a = alpha * (0.55 + 0.45 * Math.sin(t * 0.22 + i * 2.1)) * (0.8 + 0.5 * lowEnv);
    if (a < 0.002) continue;
    const tilt = 90 + hash01(i, 34) * 150;
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "rgba(45,170,205,0)");
    grad.addColorStop(0.5, `rgba(150,235,245,${a.toFixed(4)})`);
    grad.addColorStop(1, "rgba(45,170,205,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + w, 0);
    ctx.lineTo(x + w + tilt, height);
    ctx.lineTo(x + tilt, height);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * @param ctx   content context
 * @param t     song seconds
 * @param opts  { width, height, motes, shaftCount, sweepAlpha, ringAlpha,
 *                intensity, focus, period, phase, beatPulse, lowEnv }
 */
export function drawAmbient(ctx, t, opts = {}) {
  const {
    width = 1920,
    height = 1080,
    motes = 130,
    shaftCount = 4,
    shaftAlpha = 0.10,
    sweepAlpha = 0.085,
    ringAlpha = 0.26,
    rings = 2,
    sweepDur = 0.46,
    intensity = 1,
    focus = [960, 540],
    period = 60 / 130,
    phase = 0,
    beatPulse = 0,
    lowEnv = 0,
  } = opts;
  if (intensity <= 0.001) return;
  const span = height + 120;
  const img = moteSprite();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // --- drifting light shafts (the main continuous motion) ------------------
  drawShafts(ctx, t, width, height, shaftCount, shaftAlpha * intensity, lowEnv);

  // --- caustic band sweeping the frame on every beat ----------------------
  // This is the piece that actually registers: it moves a bright band across the
  // whole frame roughly twice a second, so consecutive frames always differ.
  const beatIndex = Math.floor((t - phase) / period);
  for (let k = 0; k < 2; k++) {
    const b = beatIndex - k;
    if (b < 0) continue;
    const start = phase + b * period;
    const age = (t - start) / sweepDur;
    if (age < 0 || age > 1) continue;
    const bandW = width * 0.62;
    const x = -bandW + age * (width + bandW * 2);
    const a = Math.sin(Math.PI * age) * sweepAlpha * intensity * (0.7 + 0.6 * lowEnv);
    if (a < 0.002) continue;
    // Tilt kept shallow and the ramp soft, so it reads as a caustic passing
    // rather than as a hard edged light leak.
    const tilt = 170;
    const grad = ctx.createLinearGradient(x, 0, x + bandW, 0);
    grad.addColorStop(0, "rgba(60,190,215,0)");
    grad.addColorStop(0.32, `rgba(120,225,240,${(a * 0.55).toFixed(4)})`);
    grad.addColorStop(0.5, `rgba(150,238,246,${a.toFixed(4)})`);
    grad.addColorStop(0.68, `rgba(120,225,240,${(a * 0.55).toFixed(4)})`);
    grad.addColorStop(1, "rgba(60,190,215,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + bandW, 0);
    ctx.lineTo(x + bandW + tilt, height);
    ctx.lineTo(x + tilt, height);
    ctx.closePath();
    ctx.fill();
  }

  // --- marine snow ---------------------------------------------------------
  for (let i = 0; i < motes; i++) {
    const bx = hash01(i, 11) * width;
    const by = hash01(i, 12) * span;
    const speed = 6 + hash01(i, 13) * 20;
    const size = 2.0 + hash01(i, 14) * 5.0;
    const ph = hash01(i, 15) * Math.PI * 2;
    const drift = Math.sin(t * 0.24 + ph) * (12 + hash01(i, 16) * 34);
    const y = (((by - speed * t) % span) + span) % span - 60;
    const depth = 0.4 + 0.6 * hash01(i, 17);
    const a =
      (0.10 + 0.16 * hash01(i, 18)) *
      depth *
      (0.55 + 0.45 * Math.sin(t * 0.6 + ph)) *
      (0.85 + 0.5 * lowEnv);
    const s = size * (1 + 0.3 * beatPulse) * depth;
    ctx.globalAlpha = clamp(a * intensity, 0, 1);
    ctx.drawImage(img, bx + drift - s * 2, y - s * 2, s * 4, s * 4);
  }

  // --- sonar rings ---------------------------------------------------------
  // One ring leaves the focus on each beat; older rings are larger and fainter.
  const age0 = (t - phase) / period;
  for (let k = 0; k < rings; k++) {
    const index = Math.floor(age0) - k;
    if (index < 0) continue;
    const start = phase + index * period;
    const age = (t - start) / period;
    if (age < 0 || age > 1.6) continue;
    const r = 70 + age * 460;
    const a = Math.pow(1 - clamp(age / 1.6), 2.6) * ringAlpha * intensity;
    if (a < 0.002) continue;
    ctx.globalAlpha = a;
    ctx.strokeStyle = "rgba(131,233,230,1)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(focus[0], focus[1], r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/**
 * How much ambient motion a shot wants. Quiet, close-up shots take less so the
 * camera does not fight the subject; wide internal views take more.
 */
export const AMBIENT_PRESETS = Object.freeze({
  // Plates are quieter than the wide shots by design, but they still need
  // enough large-area light to stop the frame reading as a still.
  plate: { motes: 90, shaftCount: 3, shaftAlpha: 0.085, sweepAlpha: 0.075, ringAlpha: 0.12, rings: 2, intensity: 0.9 },
  chat: { motes: 130, shaftCount: 4, shaftAlpha: 0.10, sweepAlpha: 0.09, ringAlpha: 0.13, rings: 2, intensity: 1.0 },
  model: { motes: 170, shaftCount: 5, shaftAlpha: 0.13, sweepAlpha: 0.12, ringAlpha: 0.16, rings: 3, intensity: 1.2 },
});

export function ambientFor(kind) {
  return AMBIENT_PRESETS[kind] || AMBIENT_PRESETS.chat;
}
