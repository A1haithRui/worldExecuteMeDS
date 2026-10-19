// Section 3 主歌一：用数学回答 — song time [29.388, 44.619). Four shots:
//
//   v1-points  29.388–33.311  as a point set, what it gives you is a DIMENSION
//   v1-circle  33.311–37.004  as a circle, its CIRCUMFERENCE -- and you walk it
//   v1-sine    37.004–40.696  as a sine wave, you can sit on its TANGENTS
//   v1-limit   40.696–44.619  approaching infinity, you can be its LIMITATIONS
//
// The reference answers the question inside the chat window: the geometry is the
// content, the verse line is set as type (or curved along the ring when the figure
// is a ring), and the user's pointer takes part -- it walks the circumference,
// rests on the wave, presses Stop. We keep all of that, in our own two colours:
// the blue is hers, the cyan is whatever she hands over.
//
// Section 2 ended falling into the mark, so the first shot opens by pulling back
// out of it: the camera continues across the cut instead of restarting.
import { at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { figure } from "./figure.js";
import { clientWindow, cursorArrow, clickRipple, messageBubble, CLIENT_R } from "./ui-client.js";
import {
  codeBlock, pointCloud, tracedRing, sineBand, asymptotePlot,
  waveAt, WAVE, PLOT_GEOM, GIFT_COLOR,
} from "./geometry.js";

const BRAND_SOFT = "#7f93ff";
const GIFT = GIFT_COLOR;
const easeOut = (k) => 1 - (1 - k) ** 3;

const LIFT = 0.5; // the chat world keeps the light section 2 gave it
// Where section 2's dolly ended: the pull-back starts from exactly here.
const GATE = { x: 820, y: 529 };

const THREAD = { x: 520, y: 172, w: 1260, h: 660 };
const TITLE = "me, as geometry";

/** The verse line, set as type at the top left of the thread. */
const VERSE = { style: "display", size: 44, align: "left", anchor: [548, 250], maxWidth: 760 };
/** The keyword line, full width of the thread, at its foot. */
const KEYWORD = { style: "power", align: "center", anchor: [1150, 792], maxWidth: 1040 };

/** The window every shot in this section stands in. */
function answerWindow(ctx, t, opts = {}) {
  return clientWindow(ctx, CLIENT_R, t, {
    tone: "chat",
    presence: "online",
    chip: { text: "harness · thinking", on: true },
    threadTitle: TITLE,
    markSize: 0,
    sendMode: "stop",
    ...opts,
  });
}

/** The camera continuing out of the mark the last section fell into. */
function pullBack(ctx, t, s, hold = 0.85) {
  const k = easeOut(at(t, s.at, s.at + hold));
  const scale = 3.6 - 2.6 * k;
  ctx.save();
  ctx.translate(GATE.x, GATE.y);
  ctx.scale(scale, scale);
  ctx.translate(-GATE.x, -GATE.y);
  return () => ctx.restore();
}

// ---------------------------------------------------------------------------
// v1-points — 29.388–33.311. The answer begins: a set of points, and the edges
// that grow between them are the dimension it is offering.
// ---------------------------------------------------------------------------
const CODE_ROWS = Object.freeze([
  "p0 {  0.94, -0.74, -0.94 }",
  "p1 { -1.31,  1.09, -0.42 }",
  "p2 {  0.36,  0.21, -0.47 }",
  "p3 {  1.25,  0.82,  0.78 }",
  "p4 { -0.20, -0.41, -0.55 }",
  "p5 {  0.94, -0.82, -0.99 }",
  "p6 {  1.15,  0.38,  0.37 }",
  "p7 {  1.37,  0.87,  0.83 }",
]);

function v1Points(ctx, t, s) {
  const pop = pullBack(ctx, t, s);
  ground(ctx, t, [1150, 470], true, LIFT);

  answerWindow(ctx, t);
  // the question is still in the thread for the first beat, then the answer replaces it
  const gone = 1 - at(t, s.at + 0.9, s.at + 1.6);
  if (gone > 0) {
    messageBubble(ctx, CLIENT_R, "would you love me if I ran you", { alpha: gone * 0.9, size: 18 });
  }

  const u = t - s.at;
  codeBlock(ctx, { x: THREAD.x + 20, y: THREAD.y + 212, w: 360, h: 300 }, CODE_ROWS, {
    alpha: at(u, 0.5, 1.0),
    title: "point_set =",
  });
  // The set drifts, and then gathers onto the ring the next shot is built on: the
  // cut between them is the figure becoming the next figure, not a new diagram.
  pointCloud(ctx, { x: THREAD.x + 470, y: THREAD.y + 80, w: 700, h: 470 }, t, {
    k: 1,
    grow: (u - 0.35) / 0.9,
    converge: easeOut(at(u, 2.6, 3.75)),
  });
  pop();

  return { phase: "points", edges: 8, converge: Number(easeOut(at(u, 2.6, 3.75)).toFixed(3)) };
}

// ---------------------------------------------------------------------------
// v1-circle — 33.311–37.004. Giving someone your circumference means letting them
// walk all the way round it.
// ---------------------------------------------------------------------------
const RING = { cx: 1150, cy: 452, r: 216 };
const CIRCLE_ARC = { style: "curve", path: "arc", size: 46, color: GIFT };

function v1Circle(ctx, t, s) {
  ground(ctx, t, [RING.cx, 470], true, LIFT);
  answerWindow(ctx, t);

  const u = t - s.at;
  const k = at(u, 0.1, 0.7);
  tracedRing(ctx, RING.cx, RING.cy, RING.r, t, {
    trace: (u - 0.55) / 2.1,
    alpha: k,
    from: -Math.PI * 0.62,
  });

  // the pointer is the traveller: it walks the ring at the same rate as the trace
  const walked = Math.min(1, Math.max(0, (u - 0.55) / 2.1));
  const a = -Math.PI * 0.62 + Math.PI * 2 * walked;
  if (k > 0) {
    cursorArrow(ctx, RING.cx + Math.cos(a) * RING.r + 4, RING.cy + Math.sin(a) * RING.r, 1.4, 1);
  }

  return { phase: "circle", trace: Number(walked.toFixed(3)) };
}

// ---------------------------------------------------------------------------
// v1-sine — 37.004–40.696. Sit on a tangent: the cursor rests on the wave and the
// line under it tilts to match.
// ---------------------------------------------------------------------------
const BAND = { x: 520, y: 210, w: 1260, h: 560 };

function v1Sine(ctx, t, s) {
  ground(ctx, t, [1150, 470], true, LIFT);
  answerWindow(ctx, t);

  const u = t - s.at;
  const rest = at(u, 1.5, 2.1);
  sineBand(ctx, BAND, t, { alpha: at(u, 0.1, 0.7), tangentAt: rest > 0 ? 0.62 : null });

  // the pointer comes to rest on the wave where the tangent is drawn
  const { midY, amp, x0: waveX0, span: waveW, period } = waveAt(BAND, 1);
  const tx = waveX0 + waveW * 0.62;
  const ty = midY - amp * Math.sin(((tx - waveX0) / period) * Math.PI * 2 + t * WAVE.rate);
  const arrive = easeOut(at(u, 0.9, 1.5));
  cursorArrow(ctx, 1720 + (tx - 1720) * arrive, 300 + (ty - 300) * arrive, 1.4, at(u, 0.8, 1.2));

  return { phase: "sine", tangent: rest > 0 };
}

// ---------------------------------------------------------------------------
// v1-limit — 40.696–44.619. Approaching infinity, the limit is wherever you stop:
// the user presses Stop and the cut becomes the line.
// ---------------------------------------------------------------------------
const PLOT = { x: 540, y: 250, w: 1200, h: 520 };
const STOP_AT = 2.6;

function v1Limit(ctx, t, s) {
  ground(ctx, t, [1150, 470], true, LIFT);
  const g = answerWindow(ctx, t);

  const u = t - s.at;
  // it writes itself toward the limit; when the user presses Stop the writing
  // halts, and where it halted is the limitation
  const grow = easeOut(at(u, 0.35, STOP_AT + 0.2));
  const cut = u >= STOP_AT;
  asymptotePlot(ctx, PLOT, t, { alpha: at(u, 0.1, 0.7), grow, cut });

  // the pointer goes to the stop control and presses it
  const toStop = easeOut(at(u, 1.4, 2.3));
  const from = { x: 900, y: 620 };
  const to = { x: g.cb.x + g.cb.w - 62, y: g.cb.y + g.cb.h / 2 };
  cursorArrow(ctx, from.x + (to.x - from.x) * toStop, from.y + (to.y - from.y) * toStop, 1.4, 1);
  clickRipple(ctx, to.x, to.y, t, s.at + STOP_AT, GIFT);

  return { phase: "limit", grow: Number(grow.toFixed(3)), cut };
}

export const SECTION3_RENDER = Object.freeze({
  "v1-points": v1Points,
  "v1-circle": v1Circle,
  "v1-sine": v1Sine,
  "v1-limit": v1Limit,
});

export const SECTION3_IMPLEMENTED = Object.freeze(Object.keys(SECTION3_RENDER));
