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

export const LYRIC_STYLES = Object.freeze(["typed", "display", "power", "stamp", "margin", "curve", "embedded", "none"]);

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

/**
 * The size at which the line exactly fills maxWidth, so a short keyword can be
 * set as large as the frame allows instead of a fixed size that leaves air.
 * Advance width is linear in size (tracking is proportional), so one measurement
 * at a reference size gives the answer directly.
 */
function fillSize(ctx, text, family, tracking, maxWidth, maxSize) {
  const REF = 100;
  ctx.font = `${family === "MV Serif" ? 600 : 400} ${REF}px "${family}"`;
  const chars = [...text];
  const w = chars.reduce((a, c) => a + ctx.measureText(c).width + REF * tracking, 0) - REF * tracking;
  return Math.max(SIZE_FLOOR, Math.min(maxSize, (REF * maxWidth) / Math.max(1, w)));
}

/** Per-character advances at a fixed size, as absolute x positions. */
function glyphPositions(ctx, text, family, size, tracking, x0) {
  ctx.font = `${family === "MV Serif" ? 600 : 400} ${size}px "${family}"`;
  const chars = [...text];
  const xs = [];
  let x = x0;
  chars.forEach((c) => {
    xs.push(x);
    x += ctx.measureText(c).width + size * tracking;
  });
  return { chars, xs, total: x - x0 - size * tracking };
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

// 3.5 power -- the film's keyword lines. These are the shout lines of the song
// (PROTECTION, OBJECT CREATION, INITIALIZATION, SIMULATION), so they get the
// full width of their area, a breathing blue glow, a blue-to-white reveal, and a
// light band that keeps travelling across them after they land.
function power(ctx, plan, t) {
  const {
    line, anchor, align = "center", tracking = 0.1,
    maxWidth = 1200, maxSize = 176, family = "MV Sans",
  } = plan;
  const size = fillSize(ctx, line.text, family, tracking, maxWidth, maxSize);
  const probe = glyphPositions(ctx, line.text, family, size, tracking, 0);
  const total = probe.total;
  const x0 = anchor[0] - (align === "center" ? total / 2 : align === "right" ? total : 0);
  const { chars, xs } = glyphPositions(ctx, line.text, family, size, tracking, x0);

  const env = envelope(line, t);
  const k = clamp((t - line.start) / 0.44);
  const e = 1 - (1 - k) ** 3;
  const y = anchor[1] + (1 - e) * 16;
  const font = `${family === "MV Serif" ? 600 : 400} ${size}px "${family}"`;
  const paint = (fill) => {
    ctx.font = font;
    ctx.fillStyle = fill;
    chars.forEach((c, i) => ctx.fillText(c, xs[i], y));
  };

  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // the blue under-layer: the whole line, glowing, breathing on song time
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.2);
  ctx.globalAlpha = env;
  ctx.shadowColor = "rgba(77,107,254,0.9)";
  ctx.shadowBlur = 24 + 20 * breathe;
  paint(IN.brand);
  ctx.shadowBlur = 0;

  // the white layer, revealed left to right: blue ahead of the wipe, white behind
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 - 20, y - size * 1.25, (total + 40) * e, size * 1.8);
  ctx.clip();
  paint(IN.white);
  ctx.restore();

  // a light band that keeps crossing the word, so it never settles into a slab
  const period = 1.7;
  const phase = ((t - line.start) % period + period) % period / period;
  if (phase < 0.6 && e > 0.6) {
    const bandW = Math.max(90, total * 0.2);
    const bx = x0 - bandW + (total + bandW * 2) * (phase / 0.6);
    ctx.save();
    ctx.globalAlpha = env * 0.85;
    ctx.beginPath();
    ctx.rect(bx, y - size * 1.25, bandW, size * 1.8);
    ctx.clip();
    paint("#a9c4ff");
    ctx.restore();
  }
  ctx.restore();

  if (plan.rule !== false) {
    drawRule(ctx, x0, y + size * 0.3, total, t, line.start, {
      color: IN.hot, height: 2.5, alpha: 0.6, dur: 0.5,
    });
  }
  return total;
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

// 5. curve -- the line rides a shape: a sine, or an arc when the shot is a ring.
function curve(ctx, plan, t) {
  const { line, anchor, size = 64, span = 1100, amp = 46, waves = 1.25, path = "sine", arc = null } = plan;
  const s = Math.max(SIZE_FLOOR, size);
  const chars = [...line.text];
  ctx.font = `400 ${s}px "MV Sans"`;
  const widths = chars.map((c) => ctx.measureText(c).width);
  const natural = widths.reduce((a, b) => a + b, 0);
  const env = envelope(line, t);
  const k = clamp((t - line.start) / 0.4);
  const e = 1 - (1 - k) ** 3;

  ctx.save();
  ctx.fillStyle = plan.color ?? IN.white;

  if (path === "arc" && arc) {
    // Glyphs run along the arc in `dir` (-1 for an arc below the centre, so the
    // line still reads left to right instead of mirroring). Each glyph sits
    // outward of the arc, which is the opposite side for the two directions.
    const dir = arc.dir ?? 1;
    const theta = (natural + s * 0.14 * Math.max(0, chars.length - 1)) / arc.r;
    const stepA = theta / Math.max(1, chars.length - 1);
    const mid = arc.mid;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    chars.forEach((c, i) => {
      if (i / Math.max(1, chars.length - 1) > e) return;
      const a = mid + dir * (i - (chars.length - 1) / 2) * stepA;
      ctx.save();
      ctx.globalAlpha = env;
      ctx.translate(arc.cx + Math.cos(a) * arc.r, arc.cy + Math.sin(a) * arc.r);
      ctx.rotate(a + dir * Math.PI * 0.5);
      ctx.fillText(c, 0, -dir * s * 0.3);
      ctx.restore();
    });
    ctx.restore();
    return theta * arc.r;
  }

  // A line laid on a growing plot: the y comes from the shot's own curve so the
  // words sit on the line rather than near it.
  if (path === "plot" && typeof plan.plotY === "function") {
    const maxRot = plan.maxRotate ?? 0.3;
    const x0 = plan.plotX0 ?? anchor[0] - 500;
    const x1 = plan.plotX1 ?? anchor[0] + 500;
    ctx.textBaseline = "middle";
    let px = x0;
    const stepX = plan.spread === false ? 0 : (x1 - x0 - natural) / Math.max(1, chars.length - 1);
    chars.forEach((c, i) => {
      if (i / Math.max(1, chars.length - 1) > e) return;
      const u = (px - x0) / (x1 - x0);
      const y = plan.plotY(u) + (plan.plotDY ?? 0);
      const y2 = plan.plotY(Math.min(1, u + 0.02)) + (plan.plotDY ?? 0);
      const rot = Math.max(-maxRot, Math.min(maxRot, Math.atan2(y2 - y, (x1 - x0) * 0.02)));
      ctx.save();
      ctx.globalAlpha = env;
      ctx.translate(px + widths[i] / 2, y);
      ctx.rotate(rot);
      ctx.textAlign = "center";
      ctx.fillText(c, 0, 0);
      ctx.restore();
      px += widths[i] + stepX;
    });
    ctx.restore();
    return x1 - x0;
  }

  // `spread: false` keeps the phrase at its natural width: stretched across the
  // whole wave it stops being a sentence and becomes a row of letters.
  const step = plan.spread === false ? 0 : (span - natural) / Math.max(1, chars.length - 1);
  const startX = anchor[0] - (natural + step * (chars.length - 1)) / 2;
  // A travelling shape carries its line with it: phaseRate ties the type to the
  // wave's own phase, so the words ride the crests instead of sitting beside them.
  const phase = (plan.phaseRate ?? 0) * t + (plan.phase ?? 0);
  // The rotation is clamped: a line set on a wave is legible while it tilts with
  // the crests, and unreadable the moment it turns to face every slope.
  const maxRot = plan.maxRotate ?? 0.3;
  ctx.textBaseline = "middle";
  let x = startX;
  chars.forEach((c, i) => {
    const u = i / Math.max(1, chars.length - 1);
    if (u <= e) {
      const y = anchor[1] + Math.sin(u * Math.PI * 2 * waves + phase) * amp;
      const slope =
        (Math.cos(u * Math.PI * 2 * waves + phase) * amp * Math.PI * 2 * waves) / span;
      ctx.save();
      ctx.globalAlpha = env;
      ctx.translate(x + widths[i] / 2, y);
      ctx.rotate(Math.max(-maxRot, Math.min(maxRot, Math.atan(slope))));
      ctx.textAlign = "center";
      ctx.fillText(c, 0, 0);
      ctx.restore();
    }
    x += widths[i] + step;
  });
  ctx.restore();
  return span;
}

const DRAW = { typed, display, power, stamp, margin, curve };

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
