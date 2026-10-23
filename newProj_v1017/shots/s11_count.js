// Section 11 数数与最后一声 -- seven shots, song time [159.085, 162.777).
//
// The section is about requests that get no answer, so the picture has to lose
// her, not build her. Six beats, six requests: the bust on the right is intact
// at the first frame and each beat breaks one fragment off it. The fragments
// disappear in an interleaved order (2-5-3-1-6-4), so it never reads as a
// progress bar; by the sixth beat the plate is only six empty registration
// outlines, and the port in the middle has five red ticks plus the one of this
// call.
//
// The middle is a wall of six languages set in six different faces (eins, dos,
// trois, 넷, fem, 六), all converging on the same empty port. The left keeps the
// current word big, and the attempt counter under it is now the largest thing
// after the word, with a two-pixel misregistered echo on every beat.
//
// The seventh shot is the last shout: no dissolving, no hollow portrait. Two
// lines of a heavy, wide EXECUTION fill the frame, and her face is printed
// through the letterforms -- the same "word as a mask" mechanism as the
// reference, with her eye instead of a logo. A slam on the cut, two short
// misregistration glitches and a final top/bottom out-of-register split.
//
// Determinism: the bust and the eye are pre-scaled once with scaledArt; the
// fragments are ink fills clipped to fixed integer polygons; the word is built
// in a cached offscreen canvas and blitted in integer bands; no gradients and
// no per-frame randomness.
import { stroke, disc, type, clamp, mix } from "../src/mv-draw.js";
import { lineStart, lineText } from "./lines.js";
import { figureImages } from "./figure.js";
import { S08_ART } from "./s08_look.js";
import { scaledArt } from "./s05_layout.js";

const INK = "#041220";
const BLUE = "#00B4E6";
const PAPER = "#F2F7FA";
const RED = "#e75d69";

const RED_EDGE = "rgba(231,93,105,0.92)";
const PAPER_MID = "rgba(242,247,250,0.62)";
const PAPER_DIM = "rgba(242,247,250,0.34)";
const BLUE_DIM = "rgba(0,180,230,0.30)";
const BLUE_FAINT = "rgba(0,180,230,0.12)";

const LANGS = Object.freeze(["DE", "ES", "FR", "KO", "SV", "ZH"]);
const NATIVE = Object.freeze([
  { word: "eins", font: (s) => `600 ${s}px "MV Serif"` },
  { word: "dos", font: (s) => `400 ${s}px "MV Sans"` },
  { word: "trois", font: (s) => `600 ${s}px "MV Serif"` },
  { word: "넷", font: (s) => `400 ${s}px "MV Sans", "Malgun Gothic", sans-serif` },
  { word: "fem", font: (s) => `400 ${s}px "MV Mono"` },
  { word: "六", font: (s) => `400 ${s}px "MV Serif", "Microsoft YaHei", serif` },
]);

const countLine = (n) => 98 + n;
const countStart = (n) => lineStart(countLine(n));
const COUNT_INDEX = Object.freeze({
  "count-1-de": 1,
  "count-2-es": 2,
  "count-3-fr": 3,
  "count-4-ko": 4,
  "count-5-sv": 5,
  "count-6-zh": 6,
});

// The plate on the right. The bust's content box is (128,128)..(1214,1566).
const P_H = 820;
const P_SCALE = P_H / 1438;
const P_W = Math.round(1342 * P_SCALE);
const P_AH = Math.round(1704 * P_SCALE);
const P_CX = 1430;
const P_CY = 550;
const P_LEFT = Math.round(P_CX - (1086 * P_SCALE) / 2 - 128 * P_SCALE);
const P_TOP = Math.round(P_CY - P_H / 2 - 128 * P_SCALE);
const P_CONTENT_LEFT = Math.round(P_LEFT + 128 * P_SCALE);
const P_CONTENT_TOP = Math.round(P_TOP + 128 * P_SCALE);
const P_CONTENT_W = Math.round(1086 * P_SCALE);
const P_CONTENT_H = Math.round(1438 * P_SCALE);

// The empty port becomes a full dial: six language slots around the rim, a
// needle that snaps to the language being tried, and one red failure mark per
// attempt in the hollow core.
const WHEEL = Object.freeze({ x: 1000, y: 856, r: 96 });
const SLIP_X0 = 600;
const SLIP_X1 = 992;
const SLIP_Y0 = 250;
const SLIP_GAP = 74;
const SLIP_H = 50;
const BUS_X = WHEEL.x;
const BUS_TOP = SLIP_Y0 - 10;
const BUS_BOT = WHEEL.y - WHEEL.r;

const clamp01 = clamp;
const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;

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
  ctx.strokeStyle = "rgba(0,180,230,0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 56, 1808, 968);
  cross(ctx, 56, 56, PAPER_DIM);
  cross(ctx, 1864, 56, PAPER_DIM);
  cross(ctx, 56, 1024, PAPER_DIM);
  cross(ctx, 1864, 1024, PAPER_DIM);
  // the divider between the language wall and the plate
  stroke(ctx, [[1092, 170], [1092, 960]], BLUE_FAINT, 1);
}

function header(ctx, n) {
  type(ctx, "PROBE · LANG", 110, 108, 22, PAPER, "MV Sans");
  type(ctx, "six encodings · one port · no reply", 110, 136, 14, PAPER_MID, "MV Mono");
  type(ctx, "REPLIES 0 / 06", 1808, 108, 22, PAPER, "MV Mono", "right");
  type(ctx, `attempt ${String(n).padStart(2, "0")} · no answer`, 1808, 134, 12, PAPER_DIM, "MV Mono", "right");
}

// ---------------------------------------------------------------------------
// the six count shots: take a fragment off her, one beat at a time
// ---------------------------------------------------------------------------
// boundaries between the six fragments; internal ones are jagged, so the holes
// do not read as a clean grid
const FRAG_BASE = Object.freeze([0, 0.17, 0.34, 0.52, 0.68, 0.84, 1]);
const FRAG_OFF = Object.freeze([0, 14, -10, 12, -8, 9, 0]);
const FRAG_Y = Object.freeze([0, 0.2, 0.4, 0.6, 0.8, 1]);
const REMOVE_ORDER = Object.freeze([1, 4, 2, 0, 5, 3]); // 2-5-3-1-6-4 in 1-based terms

function boundaryPoints(j) {
  return FRAG_Y.map((f, k) => [
    Math.round(P_CONTENT_LEFT + FRAG_BASE[j] * P_CONTENT_W + FRAG_OFF[k]),
    Math.round(P_CONTENT_TOP + f * P_CONTENT_H),
  ]);
}

function fragPath(ctx, i) {
  const L = boundaryPoints(i);
  const R = boundaryPoints(i + 1);
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (let k = 1; k < L.length; k++) ctx.lineTo(L[k][0], L[k][1]);
  ctx.lineTo(R[R.length - 1][0], R[R.length - 1][1]);
  for (let k = R.length - 2; k >= 0; k--) ctx.lineTo(R[k][0], R[k][1]);
  ctx.closePath();
}

function fragCentre(i) {
  const x = P_CONTENT_LEFT + ((FRAG_BASE[i] + FRAG_BASE[i + 1]) / 2) * P_CONTENT_W;
  const y = P_CONTENT_TOP + P_CONTENT_H * 0.52;
  return [Math.round(x), Math.round(y)];
}

/**
 * The plate, then the holes. Erasing with opaque ink (rather than clipping a
 * union of remaining fragments) leaves no antialiasing seams between pieces.
 */
function dissolver(ctx, t, s, n) {
  const bust = figureImages.bust;
  if (!bust || !bust.complete) return;
  const art = scaledArt(bust, P_W, P_AH);
  if (!art) return;
  ctx.drawImage(art, P_LEFT, P_TOP);

  const current = REMOVE_ORDER[n - 1];
  const frac = clamp01((t - s.at) / 0.34);
  for (let i = 0; i < 6; i++) {
    const past = REMOVE_ORDER.indexOf(i) < n - 1;
    const now = i === current;
    if (!past && !now) continue;

    if (past || frac >= 1) {
      fragPath(ctx, i);
      ctx.fillStyle = INK;
      ctx.fill();
      // what is left of a removed fragment: its registration outline and its index
      fragPath(ctx, i);
      ctx.strokeStyle = "rgba(0,180,230,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
      const [cx, cy] = fragCentre(i);
      type(ctx, String(i + 1).padStart(2, "0"), cx, cy, 12, "rgba(242,247,250,0.22)", "MV Mono", "center");
      continue;
    }

    // the fragment being taken now: it un-prints from its bottom edge upward
    const cutY = Math.round(P_CONTENT_TOP + P_CONTENT_H * (1 - frac));
    ctx.save();
    fragPath(ctx, i);
    ctx.clip();
    ctx.fillStyle = INK;
    ctx.fillRect(P_CONTENT_LEFT - 4, cutY, P_CONTENT_W + 8, P_CONTENT_TOP + P_CONTENT_H - cutY + 4);
    // the scan edge
    ctx.fillStyle = BLUE;
    ctx.fillRect(P_CONTENT_LEFT - 4, cutY - 1, P_CONTENT_W + 8, 2);
    ctx.fillStyle = "rgba(242,247,250,0.85)";
    ctx.fillRect(P_CONTENT_LEFT - 4, cutY + 1, P_CONTENT_W + 8, 1);
    // a few crumbs falling off the edge
    for (let k = 0; k < 4; k++) {
      const bx = P_CONTENT_LEFT + Math.round(((k + 0.5) / 4) * P_CONTENT_W);
      const by = cutY + 6 + Math.round(10 * frac) + k * 7;
      ctx.fillStyle = `rgba(242,247,250,${(0.22 - k * 0.04).toFixed(2)})`;
      ctx.fillRect(bx, by, 3, 5);
    }
    ctx.restore();
  }

  // when every fragment is gone, the plate is only its registration marks
  if (n === 6 && frac >= 1) {
    const c = "rgba(242,247,250,0.28)";
    for (const [x, y, sx, sy] of [
      [P_CONTENT_LEFT, P_CONTENT_TOP, 1, 1],
      [P_CONTENT_LEFT + P_CONTENT_W, P_CONTENT_TOP, -1, 1],
      [P_CONTENT_LEFT, P_CONTENT_TOP + P_CONTENT_H, 1, -1],
      [P_CONTENT_LEFT + P_CONTENT_W, P_CONTENT_TOP + P_CONTENT_H, -1, -1],
    ]) {
      stroke(ctx, [[x, y], [x + 18 * sx, y]], c, 1);
      stroke(ctx, [[x, y], [x, y + 18 * sy]], c, 1);
    }
  }
}

/** The current word, big; the 2x3 attempt grid uses the whole lower-left. */
function leftColumn(ctx, t, s, n) {
  const word = lineText(countLine(n));
  type(ctx, "ATTEMPT", 110, 700, 13, BLUE, "MV Mono");
  type(ctx, `${String(n).padStart(2, "0")} / 06 · ${LANGS[n - 1]}`, 110, 722, 16, PAPER_MID, "MV Mono");
  type(ctx, word, 110, 566, 128, PAPER, "MV Serif");
  ctx.font = '600 128px "MV Serif"';
  const w = Math.min(560, ctx.measureText(word).width);
  ctx.fillStyle = BLUE;
  ctx.fillRect(110, 590, Math.round(w), 3);

  // two rows by three columns: the counter is now a printed ledger, not a strip
  const x0 = 110;
  const y0 = 760;
  const cw = 200;
  const ch = 96;
  const gx = 18;
  const gy = 18;
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = x0 + col * (cw + gx);
    const y = y0 + row * (ch + gy);
    const active = i + 1 === n;
    const done = i + 1 < n;

    ctx.strokeStyle = active ? BLUE : done ? "rgba(0,180,230,0.50)" : BLUE_FAINT;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
    if (active) {
      ctx.fillStyle = BLUE;
      ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
    }
    if (done) {
      ctx.fillStyle = RED;
      ctx.fillRect(x - 3, y + 8, 2, ch - 16);
    }
    if (active) {
      type(ctx, String(i + 1), x + cw - 20, y + ch - 26, 64, "rgba(242,247,250,0.28)", "MV Mono", "right");
    }
    type(
      ctx,
      String(i + 1),
      x + cw - 24,
      y + ch - 30,
      64,
      active ? INK : done ? PAPER_MID : PAPER_DIM,
      "MV Mono",
      "right",
    );
    type(ctx, LANGS[i], x + 16, y + 24, 12, active ? INK : done ? PAPER_DIM : BLUE_FAINT, "MV Mono");
    type(
      ctx,
      done ? "MISS" : "REQ",
      x + 16,
      y + ch - 14,
      10,
      active ? INK : done ? "rgba(231,93,105,0.75)" : BLUE_FAINT,
      "MV Mono",
    );
    if (active) {
      const k = clamp01((t - s.at) / 0.16);
      ctx.beginPath();
      ctx.arc(x + cw / 2, y + ch / 2, 70 + Math.round(26 * k), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,180,230,${(0.5 * (1 - k)).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

/** A slip of paper with a torn left edge, used for the six language strips. */
function slipPath(ctx, xl, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(xl + 9, y);
  ctx.lineTo(xl + w, y);
  ctx.lineTo(xl + w, y + h);
  ctx.lineTo(xl + 9, y + h);
  ctx.lineTo(xl + 2, y + h * 0.75);
  ctx.lineTo(xl + 11, y + h * 0.5);
  ctx.lineTo(xl + 2, y + h * 0.25);
  ctx.closePath();
}

/** Six language slips pulled out of a stack, all feeding one bus. */
function languageSlips(ctx, t, s, n) {
  stroke(ctx, [[BUS_X, BUS_TOP], [BUS_X, BUS_BOT]], BLUE_FAINT, 1);
  for (let i = 0; i < 6; i++) {
    const y = SLIP_Y0 + i * SLIP_GAP;
    const active = i + 1 === n;
    const done = i + 1 < n;
    const slide = active ? Math.round(14 * easeOut(clamp01((t - s.at) / 0.18))) : 0;
    const xl = SLIP_X0 + (i % 3) * 14 + slide;
    const w = SLIP_X1 - xl;
    slipPath(ctx, xl, y, w, SLIP_H);
    if (active) {
      ctx.fillStyle = PAPER;
      ctx.fill();
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = done ? "rgba(242,247,250,0.30)" : "rgba(242,247,250,0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    const size = active ? 48 : 38;
    ctx.font = NATIVE[i].font(size);
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = active ? INK : done ? "rgba(242,247,250,0.42)" : "rgba(242,247,250,0.20)";
    ctx.fillText(NATIVE[i].word, SLIP_X1 - 22, y + 36);
    type(ctx, LANGS[i], xl + 26, y + 30, 10, active ? INK : PAPER_DIM, "MV Mono");
    stroke(
      ctx,
      [[SLIP_X1, y + SLIP_H / 2], [BUS_X, y + SLIP_H / 2]],
      active ? BLUE : "rgba(0,180,230,0.10)",
      active ? 2 : 1,
    );
  }
}

/** The enlarged dial: six language slots, a needle, and a hollow core. */
function bigWheel(ctx, t, s, n) {
  const { x, y, r } = WHEEL;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
    const active = i + 1 === n;
    const x0 = Math.round(x + Math.cos(a) * (r - 24));
    const y0 = Math.round(y + Math.sin(a) * (r - 24));
    const x1 = Math.round(x + Math.cos(a) * r);
    const y1 = Math.round(y + Math.sin(a) * r);
    stroke(ctx, [[x0, y0], [x1, y1]], active ? BLUE : PAPER_DIM, active ? 4 : 1);
    const lx = Math.round(x + Math.cos(a) * (r + 17));
    const ly = Math.round(y + Math.sin(a) * (r + 17));
    type(ctx, LANGS[i], lx, ly + 4, 11, active ? BLUE : PAPER_DIM, "MV Mono", "center");
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(242,247,250,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 24, 0, Math.PI * 2);
  ctx.strokeStyle = BLUE_FAINT;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 32, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(242,247,250,0.60)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const prev = -Math.PI / 2 + ((Math.max(1, n - 1) - 1) / 6) * Math.PI * 2;
  const cur = -Math.PI / 2 + ((n - 1) / 6) * Math.PI * 2;
  const k = easeOut(clamp01((t - s.at) / 0.18));
  const a = mix(prev, cur, k);
  const nx = Math.round(x + Math.cos(a) * (r - 30));
  const ny = Math.round(y + Math.sin(a) * (r - 30));
  stroke(ctx, [[x, y], [nx, ny]], BLUE, 2);
  disc(ctx, nx, ny, 4, PAPER, 1);
  disc(ctx, x, y, 5, BLUE, 1);

  for (let j = 0; j < n; j++) {
    const fa = -Math.PI / 2 + (j / 6) * Math.PI * 2;
    const fx0 = Math.round(x + Math.cos(fa) * 18);
    const fy0 = Math.round(y + Math.sin(fa) * 18);
    const fx1 = Math.round(x + Math.cos(fa) * 27);
    const fy1 = Math.round(y + Math.sin(fa) * 27);
    stroke(ctx, [[fx0, fy0], [fx1, fy1]], RED_EDGE, 2);
  }
  const p = clamp01((t - countStart(n)) / 0.3);
  if (p > 0.7) {
    const rr = Math.round(32 + 24 * ((p - 0.7) / 0.3));
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(242,247,250,${(0.5 * (1 - (p - 0.7) / 0.3)).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  type(ctx, "NO RETURN", x, y + r + 26, 13, PAPER_MID, "MV Mono", "center");
  type(ctx, "REPLIES 0", x, y + r + 44, 11, PAPER_DIM, "MV Mono", "center");
}

function countShot(n) {
  return (ctx, t, s) => {
    page(ctx);
    header(ctx, n);
    leftColumn(ctx, t, s, n);
    languageSlips(ctx, t, s, n);
    bigWheel(ctx, t, s, n);
    dissolver(ctx, t, s, n);
    return {
      phase: "count",
      attempt: n,
      fragment: REMOVE_ORDER[n - 1] + 1,
      grade: { glow: 0.26, vignette: 0.30 },
    };
  };
}

// ---------------------------------------------------------------------------
// last shout: a heavy word with her face printed through it
// ---------------------------------------------------------------------------
let maskC = null;
let maskG = null;
function ensureMask() {
  if (maskC) return;
  maskC = document.createElement("canvas");
  maskC.width = 1920;
  maskC.height = 1080;
  maskG = maskC.getContext("2d");
}

const WORD_STRETCH = 1.12;

function wordLayout(ctx) {
  const REF = 100;
  ctx.font = `600 ${REF}px "MV Serif"`;
  const w1 = ctx.measureText("EXECU").width * WORD_STRETCH;
  const w2 = ctx.measureText("TION").width * WORD_STRETCH;
  const size = Math.max(260, Math.min(560, Math.floor((1820 / Math.max(w1, w2)) * REF)));
  const lineH = Math.round(size * 0.98);
  const cap = Math.round(size * 0.72);
  const blockH = cap + lineH;
  const base1 = Math.round(540 - blockH / 2 + cap);
  const base2 = base1 + lineH;
  return { size, base1, base2, cap, lineH };
}

/** Paper letters; her face is source-atop, so it only exists inside the glyphs. */
function buildWordMask(t, s) {
  ensureMask();
  const g = maskG;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, 1920, 1080);
  const lay = wordLayout(g);
  g.save();
  g.translate(960, 0);
  g.scale(WORD_STRETCH, 1);
  g.translate(-960, 0);
  g.font = `600 ${lay.size}px "MV Serif"`;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillStyle = PAPER;
  g.strokeStyle = PAPER;
  g.lineWidth = 7;
  g.strokeText("EXECU", 960, lay.base1);
  g.fillText("EXECU", 960, lay.base1);
  g.strokeText("TION", 960, lay.base2);
  g.fillText("TION", 960, lay.base2);
  g.restore();

  const img = S08_ART.images.eye;
  if (img && img.complete) {
    const art = scaledArt(img, 1760, 1760);
    if (art) {
      const age = t - s.at;
      const dx = Math.round(Math.sin(age * 1.25) * 30) - 68;
      const dy = Math.round(Math.cos(age * 1.7) * 18) + 348;
      g.save();
      g.globalCompositeOperation = "source-atop";
      g.drawImage(art, 960 - 880 + dx, 540 - 880 + dy);
      g.restore();
    }
  }
  return lay;
}

function backgroundFace(ctx, t, s) {
  const img = S08_ART.images.eye;
  if (!img || !img.complete) return;
  const art = scaledArt(img, 2240, 2240);
  if (!art) return;
  const age = t - s.at;
  const dx = Math.round(Math.sin(age * 0.7) * 70);
  const dy = Math.round(Math.cos(age * 0.5) * 40);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.drawImage(art, 960 - 1120 + dx, 540 - 1120 + dy);
  ctx.restore();
}

function glitchAt(t, s) {
  const age = t - s.at;
  let on = 0;
  for (const g of [0.24, 0.50]) {
    const d = age - g;
    if (d >= -0.01 && d <= 0.11) on = Math.max(on, 1 - Math.abs(d - 0.045) / 0.065);
  }
  on = clamp01(on);
  const frame = Math.floor((age * 60) / 2);
  const offs = [];
  for (let i = 0; i < 6; i++) offs.push(Math.round(Math.sin((i + 1) * 2.3 + frame * 1.7) * 11 * on));
  return { on, offs };
}

function lastShout(ctx, t, s) {
  page(ctx);
  backgroundFace(ctx, t, s);

  const lay = buildWordMask(t, s);
  const age = t - s.at;
  const slam = easeOut(clamp01(age / 0.11));
  const scale = mix(1.16, 1, slam);
  const split = easeOut(clamp01((age - 0.66) / 0.12));
  const off = Math.round(14 * split);
  const glitch = glitchAt(t, s);

  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(scale, scale);
  ctx.translate(-960, -540);

  if (split > 0.01) {
    const splitY = Math.round(540 + 6 * split);
    ctx.drawImage(maskC, 0, 0, 1920, splitY, -off, 0, 1920, splitY);
    ctx.drawImage(maskC, 0, splitY, 1920, 1080 - splitY, off, splitY, 1920, 1080 - splitY);
    ctx.fillStyle = RED;
    ctx.fillRect(0, splitY - 1, 1920, 2);
  } else if (glitch.on > 0.01) {
    const bands = 6;
    const bh = Math.ceil(1080 / bands);
    for (let i = 0; i < bands; i++) {
      const y = i * bh;
      const h = Math.min(bh, 1080 - y);
      ctx.drawImage(maskC, 0, y, 1920, h, glitch.offs[i], y, 1920, h);
    }
  } else {
    ctx.drawImage(maskC, 0, 0);
  }
  ctx.restore();

  cross(ctx, 56, 56, PAPER_DIM);
  cross(ctx, 1864, 56, PAPER_DIM);
  cross(ctx, 56, 1024, PAPER_DIM);
  cross(ctx, 1864, 1024, PAPER_DIM);
  type(ctx, "LAST SHOUT", 84, 1056, 12, PAPER_MID, "MV Mono");
  type(ctx, "REPLIES 0 / 06", 1836, 1056, 12, PAPER_MID, "MV Mono", "right");

  return {
    phase: "last-shout",
    word: [lay.base1, lay.base2, lay.size],
    glitch: Number(glitch.on.toFixed(2)),
    split: Number(split.toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// render table
// ---------------------------------------------------------------------------
export const SECTION11_RENDER = Object.freeze({
  "count-1-de": countShot(1),
  "count-2-es": countShot(2),
  "count-3-fr": countShot(3),
  "count-4-ko": countShot(4),
  "count-5-sv": countShot(5),
  "count-6-zh": countShot(6),
  "last-shout": (ctx, t, s) => ({ ...lastShout(ctx, t, s), grade: { glow: 0.26, vignette: 0.30 } }),
});

export const SECTION11_IMPLEMENTED = Object.freeze(Object.keys(SECTION11_RENDER));
export const SECTION11_COUNT = Object.freeze(Object.keys(COUNT_INDEX));
