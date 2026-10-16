// Character performance.
//
// A plate shot that holds one PNG perfectly still reads as a still image even
// when the whole frame has ambient light moving over it. These helpers give the
// figure a slow breath, a small bob and a sway so it reads as alive.
//
// Amplitudes are deliberately tiny: at this scale a 5px bob over a 4.5s cycle is
// about 0.1px per frame. That will never show up in a frame-difference metric,
// which is exactly the point -- this is for how it reads, not for the number.
//
// Pure functions of song time.
import { sampleAt } from "./audio.js";

/**
 * @returns {{bobY:number, breathe:number, sway:number}}
 *   bobY   vertical offset in content pixels
 *   breathe multiplicative scale about the figure's own anchor
 *   sway   horizontal offset in content pixels
 */
export function idle(t, opts = {}) {
  const {
    seed = 0,
    bobAmp = 5,
    breatheAmp = 0.006,
    swayAmp = 2.6,
    rate = 0.22,
    beatKick = 1.4,
  } = opts;
  const p = t * rate * Math.PI * 2;
  const ph = seed * 1.7;
  const f = sampleAt(t);
  const kick = beatKick * f.beatPulse;
  return {
    bobY: Math.sin(p + ph) * bobAmp + Math.sin(p * 2.3 + ph * 1.3) * bobAmp * 0.32 - kick,
    breathe: 1 + Math.sin(p * 0.9 + ph * 0.7) * breatheAmp,
    sway: Math.sin(p * 0.7 + ph * 1.9) * swayAmp,
  };
}

/**
 * A soft rim pulse behind the figure, strongest on the beat. Gives a plate the
 * same large-area light change the ambient sweep gives the wide shots, without
 * putting anything detailed over the character.
 */
export function rimPulse(ctx, x, y, radius, t, opts = {}) {
  const {
    color = "#2bb6cf",
    alpha = 0.16,
    lowEnv = sampleAt(t).lowEnv,
    beatPulse = sampleAt(t).beatPulse,
  } = opts;
  const a = alpha * (0.35 + 0.65 * lowEnv) * (0.55 + 0.9 * beatPulse);
  if (a < 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
  g.addColorStop(0, `rgba(43,182,207,${a.toFixed(4)})`);
  g.addColorStop(0.55, `rgba(30,120,160,${(a * 0.45).toFixed(4)})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

/**
 * Print misregistration: the figure drawn a hair off-register with a cool tint,
 * settling back on the beat. Reads as ink on paper and adds a per-frame change
 * to a shot that would otherwise be a single static blit.
 */
export function misregistration(t, opts = {}) {
  const { amp = 3.2 } = opts;
  const k = amp * sampleAt(t).beatPulse;
  return { dx: k, dy: -k * 0.6, k: k / amp };
}

// The character plates all share one canvas size and one registration point, so
// placements are expressed as "centre + content height" and stay comparable
// between shots and segments.
export const BUST_W = 1342;
export const BUST_H = 1704;

export function figureLayout(cx, cy, height) {
  const s = height / 1438;
  return { s, x: cx - 671 * s, y: cy - 847 * s, w: BUST_W * s, h: BUST_H * s };
}

/**
 * Draw one of the character plates with its idle motion applied.
 * `images` is the loaded image map, so this module stays free of asset loading.
 */
export function drawFigure(ctx, t, images, key, cx, cy, height, opts = {}) {
  const {
    alpha = 1,
    animate = true,
    seed = 5,
    rim = false,
    bobAmp = 4,
    rimAlpha = 0.12,
  } = opts;
  const img = images[key] || images.bust;
  const b = animate
    ? idle(t, { seed, bobAmp })
    : { bobY: 0, breathe: 1, sway: 0 };
  const L = figureLayout(cx + b.sway, cy + b.bobY, height * b.breathe);
  if (rim) rimPulse(ctx, cx, cy, height * 0.8, t, { alpha: rimAlpha * alpha });
  ctx.save();
  ctx.globalAlpha *= clamp01(alpha);
  ctx.drawImage(img, L.x, L.y, L.w, L.h);
  ctx.restore();
  return L;
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
