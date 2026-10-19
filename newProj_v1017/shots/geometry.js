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

/** The point set: fixed coordinates, so the figure is the same in every render. */
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

export function pointCloud(ctx, R, t, opts = {}) {
  const { k = 1, grow = 1, points = POINTS, showLabels = true } = opts;
  const pos = points.map((p) => ({ ...p, px: R.x + p.x * R.w, py: R.y + p.y * R.h }));

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
export function sineBand(ctx, R, t, opts = {}) {
  const { alpha = 1, tangentAt = null, k = 1 } = opts;
  const midY = R.y + R.h * 0.52;
  const amp = R.h * 0.26;
  const waveX0 = R.x + R.w * 0.2;
  const waveW = R.w * 0.78;
  const period = waveW / 2.4;
  const cyc = R.x + R.w * 0.09;
  const r = R.h * 0.2;
  const phase = t * 0.9;

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
 * A curve that never arrives, and the line where the answer was cut: approaching
 * infinity, the limit is wherever you stop.
 */
export function asymptotePlot(ctx, R, t, opts = {}) {
  const { alpha = 1, k = 1, cut = 0 } = opts;
  const baseY = R.y + R.h * 0.82;
  const leftX = R.x + 40;
  const rightX = R.x + R.w - 40;
  const limitY = R.y + R.h * 0.3;
  const curve = (u) => limitY + (baseY - limitY) / (1 + u * 5.5);
  const span = rightX - leftX;

  layer(ctx, alpha * k, () => {
    // the limit: a horizon the curve keeps approaching
    ctx.save();
    ctx.setLineDash([9, 9]);
    stroke(ctx, [[leftX, limitY], [rightX, limitY]], "rgba(131,233,230,0.55)", 2);
    ctx.restore();
    type(ctx, "y = ∞", rightX - 6, limitY - 14, 15, "rgba(131,233,230,0.8)", "MV Mono", "right");

    // axes
    stroke(ctx, [[leftX, baseY], [rightX, baseY]], "rgba(61,122,156,0.7)", 1.2);
    stroke(ctx, [[leftX, R.y + 30], [leftX, baseY]], "rgba(61,122,156,0.7)", 1.2);

    // the curve, drawn only as far as the answer got
    const end = cut > 0 ? leftX + span * Math.min(0.94, 0.2 + 0.74 * cut) : rightX;
    ctx.beginPath();
    for (let x = leftX; x <= end; x += 3) {
      const u = (x - leftX) / span;
      x === leftX ? ctx.moveTo(x, curve(u)) : ctx.lineTo(x, curve(u));
    }
    ctx.strokeStyle = BRAND_SOFT;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (cut > 0) {
      // the cut: a vertical stop line, marked
      ctx.save();
      ctx.setLineDash([6, 6]);
      stroke(ctx, [[end, R.y + 30], [end, baseY]], GIFT, 2);
      ctx.restore();
      halo(ctx, end, curve((end - leftX) / span), 60, 0.35, GIFT);
      type(ctx, "stop", end - 10, R.y + 22, 14, GIFT, "MV Mono", "right");
      // faint continuation into the impossible
      ctx.save();
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      for (let x = end; x <= rightX; x += 3) {
        const u = (x - leftX) / span;
        x === end ? ctx.moveTo(x, curve(u)) : ctx.lineTo(x, curve(u));
      }
      ctx.strokeStyle = "rgba(127,147,255,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  });
  return { limitY, baseY, curve, leftX, span };
}
