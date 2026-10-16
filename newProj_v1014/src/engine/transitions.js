// Transition library for the Canvas 2D stage.
//
// The stage renders the outgoing shot into layer A and the incoming shot into
// layer B, then one of these composites the pair into the pre-grade canvas.
// Everything is a pure function of the progress `k` and a caller-supplied seed,
// so a transition frame is reproducible from its song time.
//
// House rules borrowed from how the reference film uses transitions (not its
// code): into and out of a character plate is a hard cut, a face in frame only
// ever gets a cut or a fade, and a graphic arrives whole rather than fading in
// alone. So `cut` and `flashcut` carry most boundaries and the rest are used
// sparingly.
import { hash01, clamp } from "./motion.js";

export const TRANSITION_NAMES = [
  "cut", "fade", "flashcut", "scan", "circle", "push", "slices", "glitch", "dissolve",
];

const easeInOut = (x) => {
  const p = clamp(x);
  return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
};

/**
 * @param ctx    destination (pre-grade content canvas)
 * @param opts   { from, to, k, type, dir, width, height, seed, flash, flashColor }
 */
export function drawTransition(ctx, opts) {
  const {
    from,
    to,
    k = 1,
    type = "cut",
    dir = 0,
    width = 1920,
    height = 1080,
    seed = 0,
    flash = 0,
    flashColor = "#ffffff",
    cells = 16,
  } = opts;
  const p = clamp(k);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.clearRect(0, 0, width, height);

  const drawFrom = () => ctx.drawImage(from, 0, 0);
  const drawTo = () => ctx.drawImage(to, 0, 0);

  if (p <= 0 || type === "cut") {
    drawFrom();
  } else if (p >= 1) {
    drawTo();
  } else {
    switch (type) {
      case "fade": {
        drawFrom();
        ctx.save();
        ctx.globalAlpha = easeInOut(p);
        drawTo();
        ctx.restore();
        break;
      }
      case "flashcut": {
        // The cut happens under a colour bloom, so the change is masked.
        drawTo();
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = clamp(Math.sin(Math.PI * p) * (flash || 0.6), 0, 0.7);
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        break;
      }
      case "scan": {
        drawFrom();
        const e = easeInOut(p);
        const horizontal = dir === 0 || dir === 1;
        const forward = dir === 0 || dir === 2;
        const span = horizontal ? width : height;
        const edge = span * e;
        ctx.save();
        ctx.beginPath();
        if (horizontal) {
          if (forward) ctx.rect(0, 0, edge, height);
          else ctx.rect(width - edge, 0, edge, height);
        } else if (forward) ctx.rect(0, 0, width, edge);
        else ctx.rect(0, height - edge, width, edge);
        ctx.clip();
        drawTo();
        ctx.restore();
        // A hot leading edge makes the wipe read as a scan rather than as a slide.
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.sin(Math.PI * p) * 0.5;
        ctx.fillStyle = "#83e9e6";
        if (horizontal) {
          const x = forward ? edge : width - edge;
          ctx.fillRect(x - 2, 0, 4, height);
        } else {
          const y = forward ? edge : height - edge;
          ctx.fillRect(0, y - 2, width, 4);
        }
        ctx.restore();
        break;
      }
      case "circle": {
        drawFrom();
        const e = easeInOut(p);
        const r = Math.hypot(width, height) * 0.55 * e;
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
        ctx.clip();
        drawTo();
        ctx.restore();
        break;
      }
      case "push": {
        const e = easeInOut(p);
        const dx = dir === 0 ? -1 : dir === 1 ? 1 : 0;
        const dy = dir === 2 ? -1 : dir === 3 ? 1 : 0;
        ctx.save();
        ctx.translate(dx * width * e, dy * height * e);
        drawFrom();
        ctx.restore();
        ctx.save();
        ctx.translate(dx * width * (e - 1), dy * height * (e - 1));
        drawTo();
        ctx.restore();
        break;
      }
      case "slices": {
        const n = Math.max(2, Math.round(cells));
        const h = height / n;
        const e = easeInOut(p);
        for (let i = 0; i < n; i++) {
          const y = i * h;
          const sway = (i % 2 ? 1 : -1) * width * 0.85 * e;
          ctx.drawImage(from, 0, y, width, h, sway, y, width, h);
          ctx.drawImage(to, 0, y, width, h, sway - Math.sign(sway || 1) * width, y, width, h);
        }
        break;
      }
      case "glitch": {
        // Row bands slide sideways; the pattern holds for a few frames at a time
        // so it reads as a fault rather than as per-frame noise.
        const held = Math.floor(p * 12);
        const rows = 28;
        const rh = height / rows;
        drawFrom();
        for (let i = 0; i < rows; i++) {
          const n = hash01(held * 131 + i, seed);
          if (n > p * 1.35) continue;
          const shift = (hash01(held * 977 + i, seed + 7) - 0.5) * 220 * p;
          const y = i * rh;
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, y, width, rh + 1);
          ctx.clip();
          ctx.drawImage(to, shift, 0);
          ctx.restore();
        }
        break;
      }
      case "dissolve": {
        // Blocky dissolve: each cell flips once the progress passes its own
        // threshold, which keeps the pattern stable instead of re-rolling.
        const cell = Math.max(24, Math.round(Math.min(width, height) / cells));
        const cols = Math.ceil(width / cell);
        const rows = Math.ceil(height / cell);
        drawFrom();
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            const r = hash01(i * 73856093 + j * 19349663, seed);
            if (r > p) continue;
            const x = i * cell;
            const y = j * cell;
            ctx.drawImage(
              to,
              x, y, Math.min(cell, width - x), Math.min(cell, height - y),
              x, y, Math.min(cell, width - x), Math.min(cell, height - y),
            );
          }
        }
        break;
      }
      default:
        drawFrom();
    }
  }

  // Optional flash on the cut itself, independent of the transition shape.
  if (flash > 0 && type !== "flashcut") {
    const f = Math.sin(Math.PI * p) * flash;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = clamp(f, 0, 0.7);
    ctx.fillStyle = flashColor;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
}

/**
 * Boundaries for the polished range, keyed by the INCOMING shot. `dur` is the
 * overlap in seconds; `align` is "start" (transition begins on the cut) or
 * "end" (it finishes on the cut).
 *
 * Deliberately conservative: plates cut hard or flash, only the two shots that
 * move between view types get a shaped transition.
 */
export const SHOT_TRANSITIONS = Object.freeze({
  // Second sample: S01-S06.
  S02: { type: "scan", dir: 0, dur: 0.4, align: "end" },
  S03: { type: "dissolve", dur: 0.34, align: "start", cells: 16 },
  S04: { type: "fade", dur: 0.3, align: "start" },
  S05: { type: "scan", dir: 2, dur: 0.42, align: "end" },
  S06: { type: "fade", dur: 0.36, align: "start" },
  // First sample: S15-S27.
  S16: { type: "scan", dir: 0, dur: 0.42, align: "end" },
  S17: { type: "cut", flash: 0.22 },
  S18: { type: "cut" },
  S19: { type: "fade", dur: 0.34, align: "start" },
  S20: { type: "scan", dir: 2, dur: 0.38, align: "end" },
  S21: { type: "fade", dur: 0.3, align: "start" },
  S22: { type: "cut", flash: 0.18 },
  S23: { type: "cut" },
  S24: { type: "dissolve", dur: 0.36, align: "start", cells: 18 },
  S25: { type: "scan", dir: 1, dur: 0.34, align: "end" },
  S26: { type: "cut", flash: 0.2 },
  S27: { type: "dissolve", dur: 0.4, align: "start", cells: 20 },
});

export function transitionAt(shotId, boundaryTime, t) {
  const spec = SHOT_TRANSITIONS[shotId];
  if (!spec || spec.type === "cut") {
    return { active: false, spec: spec || { type: "cut" } };
  }
  const dur = spec.dur || 0.35;
  const start = spec.align === "end" ? boundaryTime - dur : boundaryTime;
  const k = (t - start) / dur;
  return { active: k > 0 && k < 1, spec, k: clamp(k), start, dur };
}
