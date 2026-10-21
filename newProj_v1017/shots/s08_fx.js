// Section 8 effects.
//
// This is the film's cold, quiet stretch -- she is typing into a thread and then
// watching it go quiet -- so the effects here belong to the machine, not to the
// picture: scanlines, grain, a refresh bar crawling down the frame, registration
// slips, halftone bloom, and a camera that punches on the words that hurt. The
// reference does this with bloom and glare; that is the wrong ink for us, so the same
// energy is made out of print failures.
//
// Everything below is a pure function of t: the grain is seeded by the frame index, so
// the same frame always has the same specks and the export stays deterministic.
import { shakeAt } from "../src/engine/stage.js";
import { lineStart } from "./lines.js";

const TAU = Math.PI * 2;

/** Cheap deterministic noise, stable per (index). */
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 1 at the hit, falling away after it, 0 before it. */
function hit(t, cue, fall = 6) {
  const d = t - cue;
  return d >= 0 ? Math.exp(-d * fall) : 0;
}

/**
 * Per-shot profiles. `cues` are lyric line indices (the words that punch), `k` is the
 * overall weight, and the rest are the dials for the individual effects.
 */
const PROFILES = Object.freeze({
  // typing: quiet, just the machine running
  "c2-typing": { cues: [65, 66], k: 0.55, punch: 0.008, shake: 0, glitch: 0.10, flash: 0.03, raster: 0.35 },
  // the three dots: the first real beat of the section
  "c2-dots": { cues: [67], k: 1.0, punch: 0.05, shake: 3.0, glitch: 0.55, flash: 0.07, raster: 0.8 },
  "c2-brb": { cues: [68, 69], k: 0.8, punch: 0.014, shake: 1.2, glitch: 0.25, flash: 0.03, raster: 0.45 },
  // "then I can Finally be COMPLETION": the hardest word in the section
  "c2-complete": { cues: [70], k: 1.25, punch: 0.085, shake: 6.5, glitch: 0.95, flash: 0.12, raster: 1.1 },

  "left-online": { cues: [71, 72], k: 0.7, punch: 0.012, shake: 1.0, glitch: 0.18, flash: 0.03, raster: 0.5 },
  "left-away": { cues: [73, 74], k: 0.8, punch: 0.016, shake: 1.4, glitch: 0.22, flash: 0.03, raster: 0.55 },
  "left-offline": { cues: [75, 76], k: 0.95, punch: 0.022, shake: 2.0, glitch: 0.35, flash: 0.05, raster: 0.7 },
  // the word stopped being a person
  "left-isolation": { cues: [77], k: 1.1, punch: 0.065, shake: 4.2, glitch: 0.7, flash: 0.09, raster: 1.0 },

  "alone-erase": { cues: [78, 80], k: 1.15, punch: 0.07, shake: 4.6, glitch: 0.8, flash: 0.10, raster: 1.1 },
  "alone-empty": { cues: [81, 82], k: 1.0, punch: 0.032, shake: 2.6, glitch: 0.4, flash: 0.06, raster: 0.8 },
  "alone-eye": { cues: [83], k: 1.35, punch: 0.11, shake: 7.0, glitch: 1.0, flash: 0.14, raster: 1.2 },
});

const TILE = 160;
let grainPat = null;

/** A 160x160 speck tile, built once. Same specks on every render. */
function grainPattern(ctx) {
  if (grainPat) return grainPat;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext("2d");
  for (let i = 0; i < 340; i++) {
    const x = Math.floor(rnd(i * 3.1) * TILE);
    const y = Math.floor(rnd(i * 7.7 + 5) * TILE);
    const a = 0.06 + rnd(i + 11) * 0.16;
    g.fillStyle = `rgba(198,222,240,${a.toFixed(3)})`;
    g.fillRect(x, y, 1, 1);
  }
  grainPat = ctx.createPattern(c, "repeat");
  return grainPat;
}

/** The zoom for this frame: the sum of every cue still ringing. */
function punchZoom(t, p) {
  const cues = (p.cues ?? []).map((i) => lineStart(i));
  let z = 1;
  for (const c of cues) z += (p.punch ?? 0) * hit(t, c, 5);
  return z;
}

/** Overlay pass, drawn on top of the shot's own content. */
const OFF = Object.freeze({ scan: false, band: false, grain: false, raster: false, glitch: false, speed: false, flash: false, corner: false });

function overlay(ctx, t, p) {
  const k = p.k ?? 1;
  const cues = (p.cues ?? []).map((i) => lineStart(i));
  const beat = cues.reduce((a, c) => Math.max(a, hit(t, c, 4)), 0);

  ctx.save();

  // 1. scanlines: the whole frame is behind a screen
  if (!OFF.scan) {
  ctx.beginPath();
  for (let y = 0; y < 1080; y += 4) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(1920, y + 0.5);
  }
  ctx.strokeStyle = `rgba(2,10,18,${0.10 + 0.16 * k})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  }

  // 2. the refresh bar crawling down, once every ~1.6s
  const band = ((t * 0.62) % 1) * 1280 - 160;
  if (!OFF.band) {
  // three flat slabs instead of a gradient: gradients can be dithered differently
  // between reads, and a dithered pixel is still a pixel that breaks the check
  const b = Math.round(band);
  const a1 = 0.02 + 0.02 * k;
  ctx.fillStyle = `rgba(131,233,230,${a1.toFixed(3)})`;
  ctx.fillRect(0, b - 70, 1920, 140);
  ctx.fillStyle = `rgba(131,233,230,${(a1 * 1.8).toFixed(3)})`;
  ctx.fillRect(0, b - 26, 1920, 52);
  ctx.fillStyle = `rgba(226,240,250,${(a1 * 0.9).toFixed(3)})`;
  ctx.fillRect(0, b - 2, 1920, 4);
  }

  // 3. grain, reseeded 24 times a second
  if (!OFF.grain) {
  // One cached tile, drawn as a pattern and shifted once per frame. Drawing several
  // hundred specks as separate rects made the canvas switch rasterisation paths
  // between reads, which showed up as a two-pixel difference and a failed determinism
  // check; one pattern fill keeps the frame cheap and byte-identical.
  const seed = Math.floor(t * 24);
  const pat = grainPattern(ctx);
  if (pat) {
    const ox = Math.floor(rnd(seed * 1.7) * TILE);
    const oy = Math.floor(rnd(seed * 2.3 + 9) * TILE);
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * k;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pat;
    ctx.fillRect(ox, oy, 1920, 1080);
    ctx.restore();
  }
  }

  // 4. halftone bloom in the corners: the screen's dots get bigger on the beat
  const raster = OFF.raster ? 0 : (p.raster ?? 0.5) * (0.35 + 0.65 * beat);
  if (raster > 0.02) {
    // one path for the whole raster: the dots only differ in radius, and a single
    // fill keeps the draw call count (and the rasteriser path) stable
    ctx.beginPath();
    for (let gx = 0; gx < 24; gx++) {
      for (let gy = 0; gy < 14; gy++) {
        const x = 60 + gx * 78;
        const y = 60 + gy * 74;
        const edge = Math.min(1, Math.max(0, (Math.abs(x - 960) / 960) * 0.7 + (Math.abs(y - 540) / 540) * 0.3 - 0.35));
        if (edge <= 0.01) continue;
        const r = 5.5 * raster * edge;
        if (r < 0.4) continue;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
    }
    ctx.fillStyle = `rgba(131,233,230,${(0.14 * raster).toFixed(3)})`;
    ctx.fill();
  }

  // 5. registration slips: on a hit, a few slabs of the frame go out of register
  const glitch = OFF.glitch ? 0 : (p.glitch ?? 0);
  if (glitch > 0.01) {
    for (const c of cues) {
      const e = hit(t, c, 8);
      if (e < 0.03) continue;
      const count = 2 + Math.floor(e * 4);
      for (let b = 0; b < count; b++) {
        // integer snap: a slab edge that lands on a fractional row gets covered by a
        // slightly different amount of AA depending on what was under it, and that
        // half-covered pixel is enough to break the byte-exact determinism check
        const y = Math.round(90 + rnd(b * 5.3 + c) * 900);
        const h = Math.round(6 + rnd(b * 2.7 + c * 1.3) * (10 + 40 * e));
        ctx.fillStyle = `rgba(131,233,230,${(Math.round(120 * e * glitch) / 1000).toFixed(3)})`;
        ctx.fillRect(0, y, 1920, h);
        ctx.fillStyle = `rgba(242,247,250,${(Math.round(100 * e * glitch) / 1000).toFixed(3)})`;
        ctx.fillRect(0, y, 1920, 2);
        // one hard tear line: the brightest thing on the frame for two frames
        ctx.fillStyle = `rgba(242,247,250,${(Math.round(220 * e * glitch) / 1000).toFixed(3)})`;
        ctx.fillRect(0, y + Math.round(h * 0.5), 1920, 1);
        // torn signal: vertical stripes inside the slab, at two brightnesses
        for (let v = 0; v < 6; v++) {
          const vx = Math.round(rnd(v * 3.1 + b + c) * 1920);
          const vw = Math.round(8 + rnd(v * 7.7 + b) * 64);
          ctx.fillStyle = v % 2
            ? `rgba(242,247,250,${(Math.round(90 * e * glitch) / 1000).toFixed(3)})`
            : `rgba(2,10,18,${(Math.round(140 * e * glitch) / 1000).toFixed(3)})`;
          ctx.fillRect(vx, y, vw, h);
        }
      }
    }
  }

  // 6. speed lines: only on the hardest hits
  if (!OFF.speed && beat > 0.15 && glitch > 0.3) {
    const a = beat * glitch;
    for (let i = 0; i < 26; i++) {
      const ang = rnd(i * 9.1) * TAU;
      const r0 = 300 + rnd(i * 3.7) * 220;
      const r1 = r0 + 120 + rnd(i * 5.3) * 260 * a;
      ctx.beginPath();
      ctx.moveTo(Math.round(960 + Math.cos(ang) * r0), Math.round(540 + Math.sin(ang) * r0));
      ctx.lineTo(Math.round(960 + Math.cos(ang) * r1), Math.round(540 + Math.sin(ang) * r1));
      ctx.strokeStyle = `rgba(242,247,250,${(Math.round(100 * a) / 1000).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // 7. shockwave: one ring per hit, leaving the frame
  for (const c of cues) {
    const age = t - c;
    if (age <= 0 || age >= 0.62) continue;
    const kk = age / 0.62;
    const r = Math.round(140 + 760 * (1 - (1 - kk) ** 2));
    // three rings on the same hit, thinning and fading outward: one ring reads as a
    // wireframe, three read as a punch
    for (const [mul, a0, w0] of [[1, 0.5, 4], [0.87, 0.3, 2], [0.76, 0.16, 1]]) {
      ctx.beginPath();
      ctx.arc(960, 540, Math.round(r * mul), 0, TAU);
      ctx.strokeStyle = `rgba(226,240,250,${(a0 * (1 - kk)).toFixed(3)})`;
      ctx.lineWidth = Math.max(1, Math.round(w0 * (1 - kk) + 0.6));
      ctx.stroke();
    }
  }

  // 8. light streaks: they cross the frame only while a hit is ringing
  for (const c of cues) {
    const e = hit(t, c, 6);
    if (e < 0.12) continue;
    for (let i = 0; i < 5; i++) {
      const off = rnd(i * 4.7 + c) * 1600;
      const x = Math.round(-200 + ((off + t * 900) % 2400));
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 180, 1080);
      ctx.strokeStyle = `rgba(226,240,250,${(0.16 * e).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // 9. flash frame
  const flash = OFF.flash ? 0 : (p.flash ?? 0);
  if (flash > 0) {
    let f = 0;
    for (const c of cues) f = Math.max(f, hit(t, c, 14));
    if (f > 0.01) {
      ctx.fillStyle = `rgba(226,240,250,${(flash * f).toFixed(3)})`;
      ctx.fillRect(0, 0, 1920, 1080);
    }
  }

  // 8. corner registration marks, pulsing with the section
  const corner = OFF.corner ? 0 : 0.18 + 0.5 * beat;
  for (const [cx, cy, sx, sy] of [[36, 36, 1, 1], [1884, 36, -1, 1], [36, 1044, 1, -1], [1884, 1044, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * 26, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + sy * 26);
    ctx.strokeStyle = `rgba(131,233,230,${(corner * 0.55).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Wrap a section-8 shot: punch the camera into it, hand the stage a shake, and lay the
 * machine effects over the top. Shots keep drawing exactly what they drew before.
 */
export function withFx(fn, id) {
  const p = PROFILES[id] ?? { cues: [], k: 0.6 };
  return (ctx, t, s, env) => {
    const zoom = punchZoom(t, p);
    const cues = (p.cues ?? []).map((i) => lineStart(i));
    let shakeX = 0;
    let shakeY = 0;
    if (p.shake) {
      for (const c of cues) {
        const e = hit(t, c, 10);
        if (e < 0.02) continue;
        const [x, y] = shakeAt(t, c, p.shake, 12, Math.round(c * 7));
        shakeX += x * e;
        shakeY += y * e;
      }
    }

    ctx.save();
    if (zoom !== 1) {
      ctx.translate(960, 540);
      ctx.scale(zoom, zoom);
      ctx.translate(-960, -540);
    }
    const diag = fn(ctx, t, s, env) || {};
    ctx.restore();

    if (globalThis.__NOFX__ !== 1) overlay(ctx, t, p);

    const grade = { ...(diag.grade || {}) };
    if (p.shake) grade.camera = { ...(grade.camera || {}), shakeX: Math.round(shakeX), shakeY: Math.round(shakeY) };
    return { ...diag, grade };
  };
}
