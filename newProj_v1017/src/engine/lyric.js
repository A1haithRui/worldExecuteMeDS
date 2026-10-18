// Lyrics as part of the picture, not as a subtitle band.
//
// A fixed caption band costs about 200px of the frame's height, which is why the
// subject used to be capped at ~78% width. The reference film has no such band:
// its lyrics are typed in a terminal, set in display type over the window, or
// curved along the wave. This module is that vocabulary, kept small on purpose so
// 87 shots cannot each invent their own type.
//
// Every treatment takes the same plan:
//   { style, line, anchor:[x,y], size, align, span?, color?, rule? }
// and every one obeys the same floor: never smaller than 42px at 1080p, one line
// only, never on top of a face or UI text (that is the shot's job to leave room).
//
// The stage draws these AFTER the transition composite, so a dissolve still
// cannot cut through a line -- the property that motivated the old band is kept.
import { clamp } from "./motion.js";
import { spec, measure, typewriter, drawWipeRows, drawRule, drawSlam } from "./type.js";

const IN = { white: "#eef3fb", hot: "#83e9e6", dim: "#9fb4d8", brand: "#4d6bfe", soft: "#7f93ff" };

export const LYRIC_STYLES = Object.freeze(["typed", "display", "stamp", "margin", "curve", "embedded", "none"]);

const SIZE_FLOOR = 42;

/** Enter/exit envelope for a line: 0 before it starts, 1 while it holds. */
function envelope(line, t) {
  const inK = clamp((t - line.start) / 0.16);
  const outK = line.end ? clamp((line.end - t) / 0.14) : 1;
  return Math.min(inK, outK);
}

function monoCps(line) {
  const span = Math.max(0.5, (line.end ?? line.start + 2) - line.start);
  return Math.max(13, line.text.length / (span * 0.55));
}

/**
 * Lay a single line out at a size that fits maxWidth. Never wraps, never goes
 * below the floor: the line either fits or it is as small as the rules allow.
 * Returns per-character advance widths so tracking can be drawn by hand.
 */
function layoutLine(ctx, text, family, size, tracking, maxWidth) {
  const chars = [...text];
  let s = size;
  for (;;) {
    ctx.font = `${family === "MV Serif" ? 600 : 400} ${s}px "${family}"`;
    const widths = chars.map((c) => ctx.measureText(c).width + s * tracking);
    const total = widths.reduce((a, b) => a + b, 0) - s * tracking;
    if (total <= maxWidth || s <= SIZE_FLOOR) return { size: s, chars, widths, total };
    // shrink proportionally, then step down so the loop always terminates
    s = Math.max(SIZE_FLOOR, Math.min(s - 1, s * Math.max(0.8, maxWidth / total)));
  }
}

// 1. typed -- a shell echoing the line. Used for interface shots.
function typed(ctx, plan, t) {
  const { line, anchor, size = 46, align = "left" } = plan;
  const s = Math.max(SIZE_FLOOR, size);
  const shown = typewriter(line.text, t, line.start, monoCps(line));
  ctx.font = `400 ${s}px "MV Mono"`;
  const promptW = ctx.measureText("❯ ").width;
  const textW = ctx.measureText(line.text).width;
  const total = promptW + textW;
  let x = anchor[0];
  if (align === "center") x -= total / 2;
  else if (align === "right") x -= total;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha *= envelope(line, t);
  ctx.fillStyle = IN.soft;
  ctx.fillText("❯", x, anchor[1]);
  ctx.fillStyle = IN.white;
  ctx.fillText(shown, x + promptW, anchor[1]);
  if (shown.length < line.text.length && Math.floor(t * 6) % 2 === 0) {
    ctx.fillStyle = IN.soft;
    ctx.fillRect(x + promptW + ctx.measureText(shown).width + 3, anchor[1] - s * 0.78, s * 0.06, s * 0.9);
  }
  ctx.restore();
  return x + total;
}

// 2. display -- the line as typography, wide-tracked, wiped in left to right.
function display(ctx, plan, t) {
  const { line, anchor, size = 96, align = "center", tracking = 0.12, maxWidth = 1400 } = plan;
  const { size: s, chars, widths, total } = layoutLine(ctx, line.text, "MV Sans", size, tracking, maxWidth);
  let x = anchor[0] - (align === "center" ? total / 2 : align === "right" ? total : 0);
  const env = envelope(line, t);
  const k = clamp((t - line.start) / 0.34);
  const e = 1 - (1 - k) ** 3;
  ctx.save();
  ctx.globalAlpha *= env;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = plan.color ?? IN.white;
  // reveal left to right: each glyph appears once the wipe has passed it
  let acc = 0;
  chars.forEach((c, i) => {
    const gk = clamp((e * total - acc) / Math.max(1, widths[i]));
    if (gk > 0) {
      ctx.globalAlpha = env * gk;
      ctx.fillText(c, x + (1 - gk) * 10, anchor[1]);
    }
    acc += widths[i];
    x += widths[i];
  });
  ctx.restore();
  if (plan.rule) {
    drawRule(ctx, anchor[0] - (align === "center" ? total / 2 : align === "right" ? total : 0), anchor[1] + s * 0.34, total, t, line.start, {
      color: IN.hot, height: 2, alpha: 0.55, dur: 0.4,
    });
  }
  return total;
}

// 3. stamp -- one heavy word pressed onto the frame, on a colour block.
function stamp(ctx, plan, t) {
  const { line, anchor, size = 110, align = "center", maxWidth = 1400 } = plan;
  const { size: s, total: w } = layoutLine(ctx, line.text, "MV Serif", size, 0.01, maxWidth);
  const x = anchor[0] - (align === "center" ? w / 2 : align === "right" ? w : 0);
  const env = envelope(line, t);
  const k = clamp((t - line.start) / 0.26);
  const e = 1 - (1 - k) ** 3;
  ctx.save();
  ctx.globalAlpha *= env;
  // the block grows out from under the word
  ctx.fillStyle = plan.color ?? "rgba(77,107,254,0.16)";
  ctx.fillRect(x - 22, anchor[1] - s * 0.86, (w + 44) * e, s * 1.18);
  ctx.restore();
  drawSlam(ctx, line.text, x, anchor[1], t, line.start, {
    size: s, family: "MV Serif", color: IN.white, align: "left", perChar: 0.012, dur: 0.14, from: 1.4, rise: 0,
  });
  return w;
}

// 4. margin -- a print-style note in the frame's own margin.
function margin(ctx, plan, t) {
  const { line, anchor, size = 44, align = "left" } = plan;
  const s = Math.max(SIZE_FLOOR, size);
  const env = envelope(line, t);
  ctx.save();
  ctx.globalAlpha *= env;
  ctx.font = `400 ${s}px "MV Mono"`;
  const w = ctx.measureText(line.text).width;
  let x = anchor[0];
  if (align === "right") x -= w;
  else if (align === "center") x -= w / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = IN.hot;
  ctx.fillRect(x - 28, anchor[1] - s * 0.62, 14, 2);
  ctx.fillStyle = IN.dim;
  ctx.fillText(line.text, x, anchor[1]);
  ctx.restore();
  return w;
}

// 5. curve -- the line rides a sine, one glyph at a time.
function curve(ctx, plan, t) {
  const { line, anchor, size = 64, span = 1100, amp = 46, waves = 1.25 } = plan;
  const s = Math.max(SIZE_FLOOR, size);
  const chars = [...line.text];
  ctx.font = `400 ${s}px "MV Sans"`;
  const widths = chars.map((c) => ctx.measureText(c).width);
  const natural = widths.reduce((a, b) => a + b, 0);
  const step = (span - natural) / Math.max(1, chars.length - 1);
  const startX = anchor[0] - span / 2;
  const env = envelope(line, t);
  const k = clamp((t - line.start) / 0.4);
  const e = 1 - (1 - k) ** 3;
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.fillStyle = plan.color ?? IN.white;
  let x = startX;
  chars.forEach((c, i) => {
    const u = i / Math.max(1, chars.length - 1);
    if (u <= e) {
      const y = anchor[1] + Math.sin(u * Math.PI * 2 * waves) * amp;
      const slope = Math.cos(u * Math.PI * 2 * waves) * amp * Math.PI * 2 * waves * (1 / span);
      ctx.save();
      ctx.globalAlpha = env;
      ctx.translate(x + widths[i] / 2, y);
      ctx.rotate(Math.atan(slope));
      ctx.textAlign = "center";
      ctx.fillText(c, 0, 0);
      ctx.restore();
    }
    x += widths[i] + step;
  });
  ctx.restore();
  return span;
}

const DRAW = { typed, display, stamp, margin, curve };

/**
 * Draw the lyric for a plan, or nothing when the shot owns it ("embedded") or has
 * no lyric at all ("none").
 */
export function drawLyric(ctx, plan, t) {
  if (!plan || !plan.line || !plan.line.text) return null;
  const fn = DRAW[plan.style];
  if (!fn) return null;
  if ((plan.line.end ?? Infinity) <= t) return null;
  return fn(ctx, plan, t);
}

export { SIZE_FLOOR };
