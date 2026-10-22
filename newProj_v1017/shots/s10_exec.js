// Section 10 EXECUTION -- four shots, song time [148.008, 159.085).
//
// The song shouts the same word twelve times, and the table turns that into one
// machine making twelve reconnect calls. The picture is a single printed page
// throughout: a sonar loop with twelve cells, a ledger of the calls at the left,
// and the port at the centre. The four shots are four states of that same page:
//
//   exec-01  calls 1-4   the red pip left over from section 9 becomes the first
//                        cell; every call lands, none of them return.
//   exec-05  calls 5-8   failed cells begin to stack on the second ring; the cyan
//                        path now owns most of the loop, red is only short edges.
//   exec-09  calls 9-11  the track compresses inward and the port opens: the eye
//                        is seen ONLY through the centre hole.
//   exec-12  call 12     the red port closes, and red grows outward from its rim
//                        until it is the whole frame.
//
// Red is allowed to become a field here and only here. It still starts as the
// boundary mark section 9 established -- the same two-pixel edge, the same pip --
// so the field reads as something the edges did, not as a different film. The
// field is driven by AREA (annulus radius), never by brightness, so it cannot
// strobe: the frame gets redder without ever getting lighter and darker again.
//
// Determinism: no gradients, no per-frame randomness, no hundreds of fillRects.
// Every circle radius is rounded to an integer, every tick endpoint comes from
// pointAt() and is rounded, and the twelve cells are a loop rather than twelve
// hand-written paths. The eye is drawn from section 8's drawEye (already cached
// and already deterministic) and clipped to the port circle, so it cannot spill.
import { layer, stroke, disc, type, clamp, mix } from "../src/mv-draw.js";
import { lineStart, lineEnd } from "./lines.js";
import { drawEye } from "./s08_look.js";
import { shakeAt } from "../src/engine/stage.js";

const INK = "#041220";
const BLUE = "#00B4E6";
const PAPER = "#F2F7FA";
const RED = "#e75d69";

const RED_EDGE = "rgba(231,93,105,0.92)";
const BLUE_LINE = "rgba(0,180,230,0.34)";
const BLUE_FAINT = "rgba(0,180,230,0.13)";
const PAPER_FAINT = "rgba(242,247,250,0.30)";
const PAPER_MID = "rgba(242,247,250,0.62)";

// The centre is exactly where section 9's breathing pip was, so the cut does not
// move the one red thing the audience was looking at.
const CX = 960;
const CY = 540;
const N = 12;
const STEP = (Math.PI * 2) / N;
const TOP = -Math.PI / 2;
const R_OUT = 340; // the call track
const R_SEC = 278; // the ring the failed cells stack on
const R_PLATE = 116; // the centre port before it opens

const ease = (x) => 1 - (1 - clamp(x)) ** 3;
/** Progress across a window; every window here is built with b > a. */
const between = (t, a, b) => clamp((t - a) / (b - a));

/** Song time of call n (1..12), read from the lyric line it shouts. */
const callAt = (n) => lineStart(86 + n);

function callsUntil(t) {
  let n = 0;
  for (let i = 1; i <= N; i++) if (t >= callAt(i) - 1e-6) n = i;
  return n;
}

/** Where a call is inside its own beat: travel, then the return fails. */
function callPhase(t, n) {
  const t0 = callAt(n);
  return {
    travel: clamp((t - t0) / 0.3),
    fail: ease((t - t0 - 0.3) / 0.22),
  };
}

const angleOf = (i) => TOP + i * STEP;
const angleMid = (i) => TOP + (i + 0.5) * STEP;
const pointAt = (a, r) => [
  Math.round(CX + Math.cos(a) * r),
  Math.round(CY + Math.sin(a) * r),
];

/**
 * Everything the page needs to know at time t. One function so the four shots
 * cannot disagree about the state of the same machine across a cut.
 */
function machineState(t, s, floodOn) {
  const calls = callsUntil(t);
  const t9 = callAt(9);
  const t12 = callAt(12);
  const seal = lineEnd(98); // the last shout ends when the port is shut

  // From the ninth call the whole track tightens toward the centre; by the
  // twelfth it has finished moving, which is why exec-12 keeps rOut at 286.
  const squeeze = ease(between(t, t9, t12));
  const rOut = Math.round(mix(R_OUT, 286, squeeze));
  const rSec = Math.round(mix(R_SEC, 234, squeeze));

  // The port opens on the ninth call and closes from the twelfth to the end of
  // the twelfth shout. Round, not fractional: the clip is a circle and a radius
  // that walks in half-pixels is exactly how a determinism bug starts.
  const open = ease(between(t, t9, t9 + 0.7));
  const shut = clamp(between(t, t12, seal));
  const aperture = Math.round(146 * open * (1 - shut));

  // exec-12 only: the red field. It starts as a thin annulus at the port's rim
  // and grows outward; its AREA is the clock, its colour never changes.
  const flood = floodOn ? clamp(between(t, s.at, seal)) : 0;
  const rim = Math.round(2 + 2.5 * clamp(between(t, t9, t12)) + 6 * flood);

  return { calls, squeeze, rOut, rSec, aperture, rim, flood, seal, t9, t12 };
}

// ---------------------------------------------------------------------------
// the page
// ---------------------------------------------------------------------------
function cross(ctx, x, y, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 11, y);
  ctx.lineTo(x + 11, y);
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x, y + 11);
  ctx.stroke();
}

function page(ctx) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, 1920, 1080);
  // A printed sheet, not a glowing interface: one hairline frame and four
  // registration crosses. Flat ink, no gradient.
  ctx.strokeStyle = "rgba(0,180,230,0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 56, 1808, 968);
  cross(ctx, 56, 56, PAPER_FAINT);
  cross(ctx, 1864, 56, PAPER_FAINT);
  cross(ctx, 56, 1024, PAPER_FAINT);
  cross(ctx, 1864, 1024, PAPER_FAINT);
}

function header(ctx, st) {
  type(ctx, "SONAR RECONNECT", 110, 108, 22, PAPER, "MV Sans");
  type(ctx, "twelve calls · one loop · the far end never answers", 110, 136, 14, PAPER_MID, "MV Mono");
  type(ctx, "LOCAL SIDE", 1808, 108, 15, BLUE, "MV Mono", "right");
  type(
    ctx,
    `PORT 00 · ${String(st.calls).padStart(2, "0")} CALLS IN`,
    1808,
    134,
    13,
    PAPER_FAINT,
    "MV Mono",
    "right",
  );
}

/**
 * The call ledger. The reference counts its rounds in the bottom-left corner;
 * ours is a printed log, one line per call, because the section is about a
 * machine keeping a record of twelve identical failures.
 */
function ledger(ctx, t, st) {
  const baseY = 238;
  const gap = 52;
  type(ctx, "CALL LOG", 110, 196, 14, BLUE, "MV Mono");
  for (let i = 0; i < N; i++) {
    const n = i + 1;
    const y = baseY + i * gap;
    const started = st.calls >= n;
    const fail = started ? callPhase(t, n).fail : 0;
    const active = st.calls === n;
    const colour = active ? PAPER : started ? "rgba(242,247,250,0.38)" : "rgba(0,180,230,0.20)";
    if (active) {
      ctx.fillStyle = BLUE;
      ctx.fillRect(104, y - 13, 3, 18);
    }
    type(ctx, String(n).padStart(2, "0"), 120, y, 15, colour, "MV Mono");
    type(ctx, fail > 0.5 ? "MISS" : started ? "CALL" : "----", 166, y, 15, colour, "MV Mono");
    // the return socket: hollow from the first frame, and never filled
    if (started) {
      ctx.strokeStyle = `rgba(242,247,250,${(0.32 * (fail > 0.5 ? 1 : 0.45)).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(238, y - 12, 10, 10);
    }
  }
  type(ctx, "RETURNS", 110, 890, 13, BLUE, "MV Mono");
  type(ctx, "00 / 12", 110, 924, 30, PAPER, "MV Mono");
  type(ctx, "the loop has no exit", 110, 952, 12, PAPER_FAINT, "MV Mono");
}

/**
 * The twelve routes from the port to the track. They are the sonar fan: drawn
 * faint for every call, brighter for the ones that have already been made, and
 * absent in the remote direction, which stays empty for the whole section.
 */
function spokes(ctx, t, st) {
  for (let i = 0; i < N; i++) {
    if (i === 1 || i === 2) continue; // the remote wedge: always empty
    const n = i + 1;
    const made = st.calls >= n;
    const a = angleMid(i);
    const [x0, y0] = pointAt(a, R_PLATE + 12);
    const [x1, y1] = pointAt(a, st.rSec - 12);
    stroke(ctx, [[x0, y0], [x1, y1]], made ? "rgba(0,180,230,0.32)" : "rgba(0,180,230,0.10)", 1);
  }
}

/**
 * The call track: twelve cells, each lit by the call that owns it. The band is
 * flat (no glow); the travelled part is a solid cyan core over a wider cyan
 * field, which is how "the cyan path owns most of the loop" reads by exec-05.
 */
function ringTrack(ctx, t, st) {
  for (let i = 0; i < N; i++) {
    const n = i + 1;
    const ph = callPhase(t, n);
    const lit = st.calls >= n;
    const p = lit ? ph.travel : 0;
    const a0 = angleOf(i) + 0.06;
    const a1 = angleOf(i + 1) - 0.06;

    ctx.beginPath();
    ctx.arc(CX, CY, st.rOut, a0, a1);
    ctx.strokeStyle = "rgba(0,180,230,0.22)";
    ctx.lineWidth = 32;
    ctx.stroke();

    if (p > 0.001) {
      ctx.beginPath();
      ctx.arc(CX, CY, st.rOut, a0, a0 + (a1 - a0) * p);
      ctx.strokeStyle = "rgba(0,180,230,0.55)";
      ctx.lineWidth = 32;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(CX, CY, st.rOut, a0, a0 + (a1 - a0) * p);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    // Call number outside the cell.
    const [lx, ly] = pointAt(angleMid(i), st.rOut + 44);
    type(
      ctx,
      String(n).padStart(2, "0"),
      lx,
      ly + 5,
      13,
      lit ? PAPER_MID : "rgba(0,180,230,0.28)",
      "MV Mono",
      "center",
    );

    // The failed cell's short edge: two pixels, radial, outside the cell. This is
    // the only red the early calls are allowed.
    const fail = ph.fail;
    if (fail > 0.01) {
      const [x0, y0] = pointAt(angleMid(i), st.rOut + 18);
      const [x1, y1] = pointAt(angleMid(i), st.rOut + 30);
      stroke(ctx, [[x0, y0], [x1, y1]], RED_EDGE, 2, fail);
    }
  }

  // the pip of the call being made
  if (st.calls >= 1) {
    const n = st.calls;
    const ph = callPhase(t, n);
    const a = angleOf(n - 1) + STEP * ph.travel;
    for (let k = 3; k >= 1; k--) {
      const [tx, ty] = pointAt(a - k * 0.035, st.rOut);
      disc(ctx, tx, ty, 2.5, PAPER, 0.18 * (4 - k));
    }
    const [px, py] = pointAt(a, st.rOut);
    disc(ctx, px, py, 6, PAPER, 0.95);
    disc(ctx, px, py, 2.5, BLUE, 1);
  }
}

/**
 * The second ring. Calls one to four only miss their return path; from call five
 * the miss is stacked here as a cell, with red still only on the cell's short
 * edge. The wedge where calls two and three would sit is the remote direction:
 * it is left empty for the whole section, with a hollow socket and a label.
 */
function secondRing(ctx, t, st) {
  for (let i = 0; i < N; i++) {
    if (i === 1 || i === 2) continue; // remote wedge
    const n = i + 1;
    const a = angleMid(i);
    const [x, y] = pointAt(a, st.rSec);
    const stacked = n >= 5 && st.calls >= n;

    // every route has a socket; the ones that were never used stay hollow
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,180,230,0.26)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (stacked) {
      const k = ease((t - callAt(n) - 0.42) / 0.2);
      const alpha = (0.85 * k).toFixed(2);
      ctx.fillStyle = `rgba(77,107,254,${alpha})`;
      ctx.fillRect(x - 14, y - 9, 28, 18);
      ctx.strokeStyle = `rgba(242,247,250,${alpha})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 14, y - 9, 28, 18);
      // red short edge on the outer side of the cell
      const [rx0, ry0] = pointAt(a, st.rSec + 13);
      const [rx1, ry1] = pointAt(a, st.rSec + 25);
      stroke(ctx, [[rx0, ry0], [rx1, ry1]], RED_EDGE, 2, k);
    }
  }

  // The empty remote wedge: two bracket caps, a hollow port, and a label that
  // says exactly what it is. No red here -- the remote end never answers, so it
  // never earns a fault mark.
  const a0 = angleOf(1);
  const a1 = angleOf(3);
  for (const a of [a0, a1]) {
    const [x0, y0] = pointAt(a, st.rSec - 9);
    const [x1, y1] = pointAt(a, st.rSec + 9);
    stroke(ctx, [[x0, y0], [x1, y1]], "rgba(0,180,230,0.45)", 2);
  }
  const [mx, my] = pointAt(-Math.PI / 6, st.rSec);
  ctx.beginPath();
  ctx.arc(mx, my, 13, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(242,247,250,0.40)";
  ctx.lineWidth = 1;
  ctx.stroke();
  const [tx, ty] = pointAt(-Math.PI / 6, st.rSec - 58);
  stroke(ctx, [[mx, my - 13], [tx - 8, ty + 6]], "rgba(0,180,230,0.20)", 1);
  type(ctx, "REMOTE", tx, ty, 14, PAPER_MID, "MV Mono", "left");
  type(ctx, "0 RETURN", tx, ty + 20, 11, PAPER_FAINT, "MV Mono", "left");
}

/**
 * The centre: before the ninth call it is the round counter; after it, the
 * counter is gone and the port is the eye. They are never on screen together,
 * which is why the eye can open without the number being read as a caption over
 * it.
 */
function plate(ctx, t, st) {
  const hide = clamp(st.aperture / 30);
  const alpha = 1 - hide;
  if (alpha <= 0.01) return;
  layer(ctx, alpha, () => {
    disc(ctx, CX, CY, R_PLATE, INK, 1);
    ctx.beginPath();
    ctx.arc(CX, CY, R_PLATE, 0, Math.PI * 2);
    ctx.strokeStyle = BLUE_LINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    type(ctx, "CALL", CX, CY - 46, 14, BLUE, "MV Mono", "center");
    type(ctx, String(st.calls).padStart(2, "0"), CX, CY + 30, 96, PAPER, "MV Mono", "center");
    type(ctx, "/ 12", CX, CY + 64, 18, PAPER_MID, "MV Mono", "center");
  });
}

/** The eye, seen only through the port. Clipped first; no tearing, no blink. */
function port(ctx, st) {
  if (st.aperture <= 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, st.aperture, 0, Math.PI * 2);
  ctx.clip();
  drawEye(ctx, { target: [CX, CY], scale: 2.0, alpha: 1 });
  ctx.restore();

  // the red port rim: two pixels at call nine, wider as the failure count grows
  ctx.beginPath();
  ctx.arc(CX, CY, st.aperture, 0, Math.PI * 2);
  ctx.strokeStyle = RED;
  ctx.lineWidth = st.rim;
  ctx.stroke();

  // one paper hairline outside it keeps the port a port rather than a glow
  ctx.beginPath();
  ctx.arc(CX, CY, st.aperture + 7, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(242,247,250,0.18)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * The red field of exec-12: an annulus from the port's rim outward. Area grows,
 * brightness never changes, and the eye stays whole until the hole is shut.
 */
function redField(ctx, st) {
  if (st.flood <= 0) return;
  const rOut = Math.round(mix(st.aperture + st.rim + 5, 1180, st.flood));
  // With the port shut there is no hole left: the last frame is a full red sheet,
  // not a red ring with an ink pixel in the middle.
  const rIn = st.aperture > 0 ? Math.max(1, st.aperture + Math.round(st.rim * 0.5)) : 0;
  ctx.beginPath();
  ctx.arc(CX, CY, rOut, 0, Math.PI * 2);
  if (rIn > 1) ctx.arc(CX, CY, rIn, 0, Math.PI * 2, true);
  ctx.fillStyle = RED;
  ctx.fill();

  if (st.flood >= 0.999) {
    // The sheet is red now. Print the machine's last line in ink: a flat field
    // with registration marks, not a glow, and not a flicker.
    cross(ctx, 56, 56, "rgba(4,18,32,0.55)");
    cross(ctx, 1864, 56, "rgba(4,18,32,0.55)");
    cross(ctx, 56, 1024, "rgba(4,18,32,0.55)");
    cross(ctx, 1864, 1024, "rgba(4,18,32,0.55)");
    type(ctx, "EXECUTION 12 / 12", CX, 918, 24, INK, "MV Mono", "center");
    type(ctx, "port closed · no return", CX, 948, 14, "rgba(4,18,32,0.55)", "MV Mono", "center");
  }
}

function footer(ctx, st) {
  type(ctx, "CALL", 1808, 884, 13, BLUE, "MV Mono", "right");
  type(ctx, `${String(st.calls).padStart(2, "0")} / 12`, 1808, 918, 32, PAPER, "MV Mono", "right");
  type(ctx, st.flood > 0 ? "PORT CLOSING" : "NO ACK", 1808, 944, 12, PAPER_FAINT, "MV Mono", "right");
}

/**
 * The continuity hook: section 9 ended on a red pip at the centre of the frame.
 * In the first frames of exec-01 that same pip travels up to the first cell and
 * becomes its short red edge. It is one line, two pixels wide; the red has not
 * become a field yet.
 */
function firstPip(ctx, t, s) {
  const k = clamp((t - s.at) / 0.42);
  if (k >= 1) return;
  const e = ease(k);
  const [tx, ty] = pointAt(TOP, R_OUT - 24);
  const x = Math.round(mix(CX, tx, e));
  const y = Math.round(mix(CY, ty, e));
  // The trail starts at the port's rim rather than at the centre, so it does not
  // draw a red line through the round counter on the first frames.
  if (y < CY - R_PLATE - 8) stroke(ctx, [[CX, CY - R_PLATE - 8], [x, y]], "rgba(231,93,105,0.50)", 2);
  disc(ctx, x, y, 6, RED, 0.95);
  disc(ctx, x, y, 2, PAPER, 0.9);
}

function drawMachine(ctx, t, s, opts = {}) {
  const st = machineState(t, s, opts.flood === true);
  page(ctx);
  header(ctx, st);
  ledger(ctx, t, st);
  spokes(ctx, t, st);
  ringTrack(ctx, t, st);
  secondRing(ctx, t, st);
  plate(ctx, t, st);
  redField(ctx, st);
  port(ctx, st);
  if (st.flood < 0.999) footer(ctx, st);
  if (opts.first === true) firstPip(ctx, t, s);

  // A small integer shake on the most recent call: a machine hit, not a camera
  // wobble. Rounded because a fractional stage displacement resamples the whole
  // frame and makes the same t read back one value different.
  const recent = st.calls >= 1 ? callAt(st.calls) : s.at;
  const amp = opts.shake ?? 0;
  let camera = null;
  if (amp > 0) {
    const [sx, sy] = shakeAt(t, recent, amp, 20, 3);
    camera = { shakeX: Math.round(sx), shakeY: Math.round(sy) };
  }
  return {
    phase: s.id,
    calls: st.calls,
    aperture: st.aperture,
    flood: Number(st.flood.toFixed(3)),
    // This section is a printed machine sheet, not a lit room: less bloom than
    // the rest of the film, so the flat red field stays flat and the type stays
    // type.
    grade: { glow: 0.26, vignette: 0.30, ...(camera ? { camera } : {}) },
  };
}

// A fixed camera push per shot, so the four cuts step closer to the port instead
// of sitting at one distance for eleven seconds. Static within the shot: this is
// how close we stand, not a move.
function cam(k, fn) {
  return (ctx, t, s) => {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(k, k);
    ctx.translate(-CX, -CY);
    const out = fn(ctx, t, s);
    ctx.restore();
    return out;
  };
}

const execFirst = (ctx, t, s) => drawMachine(ctx, t, s, { first: true, shake: 2 });
const execFive = cam(1.02, (ctx, t, s) => drawMachine(ctx, t, s, { shake: 3 }));
const execNine = cam(1.05, (ctx, t, s) => drawMachine(ctx, t, s, { shake: 4 }));
const execTwelve = cam(1.09, (ctx, t, s) => drawMachine(ctx, t, s, { flood: true, shake: 5 }));

export const SECTION10_RENDER = Object.freeze({
  "exec-01": execFirst,
  "exec-05": execFive,
  "exec-09": execNine,
  "exec-12": execTwelve,
});

export const SECTION10_IMPLEMENTED = Object.freeze(Object.keys(SECTION10_RENDER));
