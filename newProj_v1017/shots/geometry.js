// The geometry the answer is drawn with.
//
// Section 3 is where the AI answers the question by describing itself
// mathematically, so the figures are the content, not decoration: a point set
// that grows a dimension, a ring whose circumference is traced, a sine wave with
// its tangents, and a curve that approaches a limit.
//
// Everything here is a pure function of song time and takes an explicit progress
// value, so a still is reproducible like the rest of the film. Nothing uses
// Math.random: the point set is a fixed table.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6"; // what she gives away: the second colour, used for every trace

export const GIFT_COLOR = GIFT;

/** A monospace listing, as if the answer had come back with its own data. */
export function codeBlock(ctx, R, rows, opts = {}) {
  const { alpha = 1, size = 15, title = "points" } = opts;
  const lineH = size + 9;
  layer(ctx, alpha, () => {
    rect(ctx, R.x, R.y, R.w, R.h, "rgba(9,32,48,0.9)", 10, "rgba(61,122,156,0.7)");
    type(ctx, title, R.x + 16, R.y + 26, size, GIFT, "MV Mono");
    rows.forEach((row, i) => {
      type(ctx, row, R.x + 16, R.y + 26 + (i + 1) * lineH, size, "#9fb9d2", "MV Mono");
    });
  });
}

/**
 * The point set. Positions come from a fixed table -- nothing here is random, so
 * a still is reproducible -- but each one drifts on its own slow orbit: a frozen
 * scatter reads as a diagram, and this is supposed to be alive.
 *
 * `converge` pulls every point onto a circle as the shot ends, so the set becomes
 * the ring the next shot is built on and the cut between them is a continuation.
 */
export const POINTS = Object.freeze([
  { x: 0.1, y: 0.22, label: "p0" },
  { x: 0.26, y: 0.66, label: "p1" },
  { x: 0.4, y: 0.3, label: "p2" },
  { x: 0.55, y: 0.78, label: "p3" },
  { x: 0.62, y: 0.2, label: "p4" },
  { x: 0.76, y: 0.55, label: "p5" },
  { x: 0.88, y: 0.28, label: "p6" },
  { x: 0.94, y: 0.72, label: "p7" },
]);

/** Edges that connect the set into something with a shape. */
export const EDGES = Object.freeze([
  [0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7], [2, 3], [4, 5],
]);

/** Where the points settle: the ring of the next shot, in canvas coordinates. */
export const CONVERGE_RING = Object.freeze({ cx: 1150, cy: 452, r: 216 });

export function pointCloud(ctx, R, t, opts = {}) {
  const { k = 1, grow = 1, points = POINTS, showLabels = true, converge = 0 } = opts;
  const lerp = (a, b, m) => a + (b - a) * m;
  const pos = points.map((p, i) => {
    // a slow individual orbit, so the scatter breathes instead of holding still
    const drift = {
      x: Math.sin(t * 0.72 + i * 1.9) * 16 + Math.cos(t * 0.41 + i * 0.7) * 9,
      y: Math.cos(t * 0.63 + i * 2.3) * 14 + Math.sin(t * 0.37 + i * 1.1) * 8,
    };
    let px = R.x + p.x * R.w + drift.x;
    let py = R.y + p.y * R.h + drift.y;
    if (converge > 0) {
      const a = (i / points.length) * Math.PI * 2 - Math.PI / 2;
      px = lerp(px, CONVERGE_RING.cx + Math.cos(a) * CONVERGE_RING.r, converge);
      py = lerp(py, CONVERGE_RING.cy + Math.sin(a) * CONVERGE_RING.r, converge);
    }
    return { ...p, px, py };
  });
  // the ring the points are heading for, shown faintly once the gathering starts
  if (converge > 0.02) {
    layer(ctx, converge * 0.4, () => {
      ctx.beginPath();
      ctx.arc(CONVERGE_RING.cx, CONVERGE_RING.cy, CONVERGE_RING.r, 0, Math.PI * 2);
      ctx.strokeStyle = GIFT;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });
  }

  // edges first, so the nodes sit on top
  EDGES.forEach(([a, b], i) => {
    const e = at(Math.max(0, grow - i * 0.08), 0, 0.34);
    if (e <= 0) return;
    const A = pos[a];
    const B = pos[b];
    const ex = A.px + (B.px - A.px) * e;
    const ey = A.py + (B.py - A.py) * e;
    layer(ctx, 0.7 * k * Math.min(1, grow * 1.6), () =>
      stroke(ctx, [[A.px, A.py], [ex, ey]], GIFT, 1.6, 0.85),
    );
  });

  pos.forEach((p, i) => {
    const pop = at(Math.max(0, grow - i * 0.06), 0, 0.3);
    if (pop <= 0) return;
    layer(ctx, k, () => {
      halo(ctx, p.px, p.py, 26 * pop, 0.5, BRAND);
      disc(ctx, p.px, p.py, 6.5 * (0.6 + 0.4 * pop), BRAND_SOFT, 1);
      if (showLabels) type(ctx, p.label, p.px + 12, p.py - 10, 14, "#9fb9d2", "MV Mono");
    });
  });
  return pos;
}

/**
 * A ring whose circumference is being traced: the arc behind the traveller is the
 * gift colour, the arc ahead is still hers. This is the shot's whole idea --
 * giving someone your circumference means letting them walk it.
 */
export function tracedRing(ctx, cx, cy, r, t, opts = {}) {
  const { trace = 0, alpha = 1, from = -Math.PI / 2, width = 3.4, dot = true } = opts;
  layer(ctx, alpha, () => {
    // the full ring, faint
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(77,107,254,0.55)";
    ctx.lineWidth = width;
    ctx.stroke();
    // the traced part
    if (trace > 0.001) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, from, from + Math.PI * 2 * Math.min(1, trace));
      ctx.strokeStyle = GIFT;
      ctx.lineWidth = width;
      ctx.stroke();
      halo(ctx, cx, cy, r * 1.25, 0.1, GIFT);
    }
    if (dot && trace > 0.001) {
      const a = from + Math.PI * 2 * Math.min(1, trace);
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      halo(ctx, px, py, 34, 0.6, GIFT);
      disc(ctx, px, py, 5.5, GIFT, 1);
    }
    // the spark at the centre, as in the reference's ring
    const spin = t * 0.3;
    for (let i = 0; i < 8; i++) {
      const a = spin + (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.12, cy + Math.sin(a) * r * 0.12);
      ctx.lineTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55);
      ctx.strokeStyle = "rgba(77,107,254,0.7)";
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
  });
}

/** The unit circle on the left, the wave it generates across the thread. */
export const WAVE = Object.freeze({ amp: 0.26, period: 0.78, rate: 2.2 });
/** The band the wave is drawn in; the lyric rides the same numbers. */
export const BAND = Object.freeze({ x: 520, y: 210, w: 1260, h: 560 });

/** The wave's own geometry, shared with the lyric so the words can ride it. */
export function waveAt(R, u) {
  const midY = R.y + R.h * 0.52;
  const amp = R.h * WAVE.amp;
  const x0 = R.x + R.w * 0.2;
  const span = R.w * WAVE.period;
  const period = span / 2.4;
  return { midY, amp, x0, span, period };
}

export function sineBand(ctx, R, t, opts = {}) {
  const { alpha = 1, tangentAt = null, k = 1 } = opts;
  const { midY, amp, x0: waveX0, span: waveW, period } = waveAt(R, 1);
  const cyc = R.x + R.w * 0.09;
  const r = R.h * 0.2;
  const phase = t * WAVE.rate;

  const waveY = (x) => midY - amp * Math.sin(((x - waveX0) / period) * Math.PI * 2 + phase);

  layer(ctx, alpha * k, () => {
    // axis
    stroke(ctx, [[R.x + 20, midY], [R.x + R.w - 20, midY]], "rgba(61,122,156,0.6)", 1.2);

    // crest hatching, as in the reference: one thin drop per sample
    for (let x = waveX0; x < waveX0 + waveW; x += 7) {
      const y = waveY(x);
      if (Math.sin(y - midY) === 0) continue;
      stroke(ctx, [[x, y], [x, midY]], "rgba(77,107,254,0.22)", 1);
    }

    // the wave
    ctx.beginPath();
    for (let x = waveX0; x <= waveX0 + waveW; x += 3) {
      const y = waveY(x);
      x === waveX0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = BRAND_SOFT;
    ctx.lineWidth = 3;
    ctx.stroke();

    // unit circle with its rotating radius, and the dashed link to the wave
    ctx.beginPath();
    ctx.arc(cyc, midY, r, 0, Math.PI * 2);
    ctx.strokeStyle = BRAND_SOFT;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    const a = -phase;
    const ax = cyc + Math.cos(a) * r;
    const ay = midY + Math.sin(a) * r;
    stroke(ctx, [[cyc, midY], [ax, ay]], GIFT, 2.4);
    disc(ctx, ax, ay, 5, GIFT, 1);
    ctx.save();
    ctx.setLineDash([5, 5]);
    stroke(ctx, [[ax, ay], [waveX0, waveY(waveX0)]], "rgba(131,233,230,0.5)", 1.4);
    ctx.restore();

    // the tangent the user is sitting on
    if (tangentAt != null) {
      const tx = waveX0 + waveW * tangentAt;
      const ty = waveY(tx);
      const slope = (-amp * Math.cos(((tx - waveX0) / period) * Math.PI * 2 + phase) * Math.PI * 2) / period;
      const half = R.w * 0.16;
      const dx = half / Math.sqrt(1 + slope * slope);
      const dy = slope * dx;
      stroke(ctx, [[tx - dx, ty - dy], [tx + dx, ty + dy]], GIFT, 3);
      halo(ctx, tx, ty, 40, 0.45, GIFT);
      disc(ctx, tx, ty, 6.5, GIFT, 1);
    }
  });
  return { midY, waveX0, waveW, waveY };
}

/**
 * A curve that never arrives, and the line where the answer was cut.
 *
 * The plot advances as it is written -- `grow` is how much of it has been drawn --
 * so the answer is being worked out in front of us rather than pasted in. It
 * approaches the limit and never touches it; when the user presses Stop the
 * advance halts, and that halt is the limit.
 */
export const PLOT_GEOM = Object.freeze({ x: 540, y: 250, w: 1200, h: 520, k: 5.5 });
const plotLimitY = () => PLOT_GEOM.y + PLOT_GEOM.h * 0.3;
const plotBaseY = () => PLOT_GEOM.y + PLOT_GEOM.h * 0.82;
/** y for a normalised position along the plot; shared with the lyric. */
export function plotY(u) {
  return plotLimitY() + (plotBaseY() - plotLimitY()) / (1 + u * PLOT_GEOM.k);
}

export function asymptotePlot(ctx, R, t, opts = {}) {
  const { alpha = 1, k = 1, grow = 1, cut = false } = opts;
  const baseY = plotBaseY();
  const limitY = plotLimitY();
  const leftX = PLOT_GEOM.x + 40;
  const rightX = PLOT_GEOM.x + PLOT_GEOM.w - 40;
  const span = rightX - leftX;
  const at8 = (u) => plotLimitY() + (plotBaseY() - plotLimitY()) / (1 + u * PLOT_GEOM.k);
  const penX = leftX + span * Math.min(1, grow);

  layer(ctx, alpha * k, () => {
    // the limit: a horizon the curve keeps approaching
    ctx.save();
    ctx.setLineDash([9, 9]);
    stroke(ctx, [[leftX, limitY], [rightX, limitY]], "rgba(131,233,230,0.55)", 2);
    ctx.restore();

    // axes
    stroke(ctx, [[leftX, baseY], [rightX, baseY]], "rgba(61,122,156,0.7)", 1.2);
    stroke(ctx, [[leftX, PLOT_GEOM.y + 30], [leftX, baseY]], "rgba(61,122,156,0.7)", 1.2);

    // the curve, drawn only as far as it has been written
    ctx.beginPath();
    for (let x = leftX; x <= penX; x += 3) {
      const u = (x - leftX) / span;
      x === leftX ? ctx.moveTo(x, at8(u)) : ctx.lineTo(x, at8(u));
    }
    ctx.strokeStyle = BRAND_SOFT;
    ctx.lineWidth = 3;
    ctx.stroke();

    // the pen: where the answer currently is
    if (!cut && grow < 0.999) {
      halo(ctx, penX, at8((penX - leftX) / span), 46, 0.5, GIFT);
      disc(ctx, penX, at8((penX - leftX) / span), 5.5, GIFT, 1);
    }

    if (cut) {
      // the cut: a vertical stop line, marked, and the rest left unwritten
      ctx.save();
      ctx.setLineDash([6, 6]);
      stroke(ctx, [[penX, PLOT_GEOM.y + 30], [penX, baseY]], GIFT, 2);
      ctx.restore();
      halo(ctx, penX, at8((penX - leftX) / span), 60, 0.35, GIFT);
      type(ctx, "stop", penX - 10, PLOT_GEOM.y + 22, 14, GIFT, "MV Mono", "right");
    }
  });
  return { limitY, baseY, leftX, span, penX };
}
