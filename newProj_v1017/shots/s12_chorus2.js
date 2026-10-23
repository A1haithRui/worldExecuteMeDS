// Section 12 最后副歌：把每一样"我"都印出去，四张版画全被退回来 -- seven shots,
// song time [162.777, 177.547).
//
// The section's story, in one line: she prints every version of herself, sends it
// out through the one channel she has, and every version is rejected at the border
// of the sheet. By the last shot the only form left is the god plate -- paper white,
// no face -- and even that is trapped behind a grid that keeps closing.
//
//   072 cx-eye    her eye fills the sheet. The channel of everything she has leaves
//                 through the pupil. On "give them all the" it floods, hits the
//                 port, and the packets come back as shavings: nothing arrives.
//   073 title 02  the press renames plate 02 to EXECUTION. Behind the bar, the four
//                 forms she has (F / M / cat / god) are still on the sheet.
//   074 cx-bust   she stands front on at 88% and sends one copy of each form down
//                 four channels. Each copy burns out white where it crosses the
//                 border. Counter: forms out 4, replies 0.
//   075 title 03  the same bar, second press: the four forms are now empty outlines
//                 -- the plate has stopped printing them.
//   076 cx-hand   the palm from section 5, unchanged in position. The heart has no
//                 colour, only an outline; the counter flips 001 -> 000; a hand-shaped
//                 hole opens in the paper where the other hand should be; the waves
//                 pile up as shavings at the torn edge; at the end the contact ring
//                 snaps shut.
//   077 title 04  the third press: the sheet jumps, the bar splits, EXECUTION
//                 straddles the tear.
//   078 cx-fall   the grid closes on her last form: the god plate, printed in paper
//                 with a hole for a face, growing until it fills the cell. The three
//                 waves fold back in. Cyan stays at full strength.
//
// Continuity: 076 repeats c1-happy's palm to the pixel (target 1080,540, 620 px of
// hand content, same contact anchor). The god plate is the one printed in section 6
// ("be god"), so it is the form the film already gave her.
//
// Effects stay printed: sunbursts are flat wedges, shavings are integer triangles,
// misregistration is the same drawing at an integer offset, and light is large paper
// areas plus the stage's own bloom. Determinism: every offset integer, the art goes
// through scaledArt, no pattern fills and no filters.
import { layer, stroke, disc, rect, type, clamp } from "../src/mv-draw.js";
import { lineStart, lineText } from "./lines.js";
import { figureImages } from "./figure.js";
import { ART, PALM_BOX, PALM_ANCHOR, scaledArt } from "./s05_layout.js";
import { S08_ART } from "./s08_look.js";
import { plateBase, tickRing, PLATE } from "./plate.js";
import { shotById } from "./index.js";
import { drawWhale } from "../src/assets/whale.js";
import { drawSlam } from "../src/engine/type.js";

const INK = "#041220";
const SHEET = "#071a2b";
const PAPER = "#F2F7FA";
const BLUE = "#00B4E6";
const BRAND = "#4d6bfe";
const RED = "#e75d69";

const PAPER_MID = "rgba(242,247,250,0.62)";
const PAPER_DIM = "rgba(242,247,250,0.34)";
const PAPER_FAINT = "rgba(242,247,250,0.16)";
const BLUE_MID = "rgba(0,180,230,0.55)";
const BLUE_DIM = "rgba(0,180,230,0.30)";
const BLUE_FAINT = "rgba(0,180,230,0.12)";
const RED_EDGE = "rgba(231,93,105,0.92)";

const clamp01 = clamp;
const easeOut = (k) => 1 - (1 - clamp01(k)) ** 3;

const KEY = Object.freeze({
  line: PAPER, mid: PAPER_MID, dim: PAPER_DIM, faint: PAPER_FAINT,
  accent: BLUE, fill: "rgba(0,180,230,0.10)", hot: PAPER,
});
const CYAN = Object.freeze({
  line: BLUE, mid: BLUE_MID, dim: BLUE_DIM, faint: BLUE_FAINT,
  accent: BLUE, fill: "rgba(0,180,230,0.05)", hot: BLUE,
});

const TITLES = Object.freeze({ 1: "stimulations", 2: "satisfaction", 3: "execution", 4: "simulation" });
const TITLE_OF = (n) => TITLES[n] ?? "";
const pad2 = (n) => String(n).padStart(2, "0");

// The four forms she has been given by the song and by the user's settings.
const FORMS = Object.freeze([
  { key: "bust", label: "F", cue: 0 },
  { key: "man", label: "M", cue: 1 },
  { key: "cat", label: "cat", cue: 2 },
  { key: "godPaper", label: "god", cue: 3 },
]);

/** A portrait at a given content height, pre-scaled once and blitted. */
function portrait(ctx, key, cx, cy, height, opts = {}) {
  const { alpha = 1, colour = null } = opts;
  const img = figureImages[key];
  if (!img || !img.complete) return false;
  const s = height / 1438;
  const w = Math.round(1342 * s);
  const h = Math.round(1704 * s);
  const art = scaledArt(img, w, h);
  if (!art) return false;
  if (colour) {
    const sil = silhouetteOf(img, w, h, colour);
    if (sil) layer(ctx, alpha, () => ctx.drawImage(sil, Math.round(cx - w / 2), Math.round(cy - h / 2)));
  } else {
    layer(ctx, alpha, () => ctx.drawImage(art, Math.round(cx - w / 2), Math.round(cy - h / 2)));
  }
  return true;
}

/** A solid-colour copy of a portrait, baked once: the shape without the print. */
const silCache = new Map();
function silhouetteOf(img, w, h, colour) {
  const key = `${img.src}#${w}x${h}#${colour}`;
  if (silCache.has(key)) return silCache.get(key);
  const art = scaledArt(img, w, h);
  if (!art) return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.drawImage(art, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = colour;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "source-over";
  silCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------------------
// the sheet
// ---------------------------------------------------------------------------
function regCross(ctx, x, y, colour) {
  stroke(ctx, [[x - 13, y], [x + 13, y]], colour, 1);
  stroke(ctx, [[x, y - 13], [x, y + 13]], colour, 1);
}

function sheetPage(ctx, t, n, note) {
  plateBase(ctx, t, { index: n, left: `plate ${pad2(n)} / 04   ·   reprint` });
  for (const [x, y] of [
    [PLATE.x + 50, PLATE.y + 50],
    [PLATE.x + PLATE.w - 50, PLATE.y + 50],
    [PLATE.x + 50, PLATE.y + PLATE.h - 50],
    [PLATE.x + PLATE.w - 50, PLATE.y + PLATE.h - 50],
  ]) regCross(ctx, x, y, PAPER_DIM);
  type(ctx, note, PLATE.x + 30, PLATE.y + PLATE.h - 22, 13, PAPER_DIM, "MV Mono");
  type(ctx, `run ${n} / 04   ·   key ${n * 6}px out of register`,
    PLATE.x + PLATE.w - 30, PLATE.y + PLATE.h - 22, 13, PAPER_DIM, "MV Mono", "right");
}

function impressions(ctx, t, n, body) {
  for (let k = 1; k < n; k++) {
    layer(ctx, 0.085, () => {
      ctx.translate(Math.round(k * 5), Math.round(-k * 4));
      body(ctx, t, CYAN);
    });
  }
  layer(ctx, 0.32, () => {
    ctx.translate(Math.round(n * 6), Math.round(-n * 4));
    body(ctx, t, CYAN);
  });
  body(ctx, t, KEY);
}

// the bleeding screen (baked as one bitmap: a pattern fill came back 1/255
// different on a dot rim after a seek, and that failed the determinism read-back)
const DOT_TILE = 96;
let dotSheet = null;
function dotOverlay() {
  if (dotSheet) return dotSheet;
  if (typeof document === "undefined") return null;
  const tile = document.createElement("canvas");
  tile.width = DOT_TILE;
  tile.height = DOT_TILE;
  const tg = tile.getContext("2d");
  tg.fillStyle = PAPER;
  for (let y = 4; y < DOT_TILE; y += 12) {
    for (let x = 4; x < DOT_TILE; x += 12) tg.fillRect(x, y, 5, 5);
  }
  const sheet = document.createElement("canvas");
  sheet.width = 1920;
  sheet.height = 1080;
  const sg = sheet.getContext("2d");
  for (let y = 0; y < 1080; y += DOT_TILE) {
    for (let x = 0; x < 1920; x += DOT_TILE) sg.drawImage(tile, x, y);
  }
  dotSheet = sheet;
  return sheet;
}
function dotScreen(ctx, regions) {
  const overlay = dotOverlay();
  if (!overlay) return;
  for (const r of regions) {
    if (r.alpha <= 0) continue;
    layer(ctx, r.alpha, () => ctx.drawImage(overlay, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h));
  }
}

// ---------------------------------------------------------------------------
// print effects
// ---------------------------------------------------------------------------
/** A flat sunburst of wedges: light in this film is paper, so it is drawn as ink. */
function sunburst(ctx, cx, cy, r0, r1, n, colour, alpha = 1, phase = 0, every = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = colour;
  for (let i = 0; i < n; i++) {
    if (i % every) continue;
    const a = phase + (i / n) * Math.PI * 2;
    const w = (Math.PI / n) * 0.55;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Radial speed lines: thin and integer-ended, cheap and loud. */
function rays(ctx, cx, cy, r0, r1, n, colour, alpha = 1, phase = 0, width = 2) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.round(cx + Math.cos(a) * r0), Math.round(cy + Math.sin(a) * r0));
    ctx.lineTo(Math.round(cx + Math.cos(a) * r1), Math.round(cy + Math.sin(a) * r1));
    ctx.stroke();
  }
  ctx.restore();
}

/** Shavings: what comes back off a border that refused the packet. */
const SHARDS = Object.freeze(
  Array.from({ length: 18 }, (_, i) => ({
    a: (i / 18) * Math.PI * 2 + i * 0.37,
    v: 60 + ((i * 47) % 130),
    s: 4 + (i % 4) * 3,
    r: i * 0.9,
  })),
);

function shavings(ctx, x, y, age, colour = PAPER, alpha = 1) {
  if (age <= 0) return;
  const k = clamp01(age / 0.9);
  ctx.save();
  ctx.globalAlpha *= alpha * (1 - k * 0.75);
  ctx.fillStyle = colour;
  for (const s of SHARDS) {
    const d = s.v * Math.min(0.55, age) + s.v * 0.5 * k;
    const px = Math.round(x + Math.cos(s.a) * d);
    const py = Math.round(y + Math.sin(s.a) * d * 0.55 + 90 * k * k);
    const w = Math.max(2, Math.round(s.s * (1 - k * 0.5)));
    ctx.fillRect(px, py, w, w * 0.5);
  }
  ctx.restore();
}

/** A mechanical counter. Three digits in their own windows; the last one flips. */
function counter(ctx, x, y, value, opts = {}) {
  const { digits = 3, size = 44, colour = PAPER, flip = 0, label = null, oldValue = null } = opts;
  const w = Math.round(size * 1.15);
  const h = Math.round(size * 1.5);
  const text = String(Math.max(0, Math.floor(value))).padStart(digits, "0");
  const oldText = String(Math.max(0, Math.floor(oldValue ?? value + 1))).padStart(digits, "0");
  ctx.save();
  for (let i = 0; i < digits; i++) {
    const cx = x + i * (w + 6);
    const last = i === digits - 1;
    ctx.fillStyle = "rgba(4,18,32,0.88)";
    ctx.fillRect(cx, y, w, h);
    ctx.strokeStyle = last && flip > 0 ? BLUE : PAPER_DIM;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, y, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, y, w, h);
    ctx.clip();
    if (last && flip > 0.01) {
      // the flip: the old digit leaves upward, the new one arrives from below
      const off = Math.round(h * clamp01(flip));
      type(ctx, oldText[i], cx + w / 2, y + h * 0.74 + off, size, colour, "MV Mono", "center");
      type(ctx, text[i], cx + w / 2, y + h * 0.74 - h + off, size, colour, "MV Mono", "center");
    } else {
      type(ctx, text[i], cx + w / 2, y + h * 0.74, size, colour, "MV Mono", "center");
    }
    ctx.restore();
  }
  ctx.restore();
  if (label) type(ctx, label, x, y - 14, 13, PAPER_DIM, "MV Mono");
  return { w: digits * (w + 6) - 6, h };
}

// ---------------------------------------------------------------------------
// the two tones of damage
// ---------------------------------------------------------------------------
function redPort(ctx, x, y, dir = 1, size = 60) {
  ctx.save();
  ctx.fillStyle = RED_EDGE;
  ctx.fillRect(dir > 0 ? x - 2 : x, y - size / 2, 2, size);
  const cx = x + dir * 26;
  stroke(ctx, [[cx - 8, y - 8], [cx + 8, y + 8]], RED_EDGE, 2);
  stroke(ctx, [[cx - 8, y + 8], [cx + 8, y - 8]], RED_EDGE, 2);
  ctx.restore();
}

const TEAR = Object.freeze([
  [PLATE.x, 352], [386, 340], [432, 352], [398, 392], [424, 436], [382, 478], [416, 522],
  [388, 566], [428, 610], [392, 654], [420, 700], [386, 744], [430, 756], [394, 768],
  [PLATE.x, 752],
]);

function tornEdge(ctx) {
  ctx.save();
  ctx.beginPath();
  TEAR.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.restore();
  stroke(ctx, TEAR.slice(1, -1), BLUE_MID, 2, 0.9);
  for (const [fy, fx] of [[396, 452], [520, 448], [648, 440]]) {
    stroke(ctx, [[fx, fy], [fx + 34, fy - 6]], BLUE_DIM, 1);
  }
  stroke(ctx, [[PLATE.x, 338], [PLATE.x, 352]], RED_EDGE, 2);
  stroke(ctx, [[PLATE.x, 752], [PLATE.x, 766]], RED_EDGE, 2);
}

// ===========================================================================
// plate 01 -- her eye, and the one channel she has (072)
// ===========================================================================
const EYE = Object.freeze({ x: 805, y: 645, canvas: 1510, size: 1450, cx: 780, cy: 540 });
const CH = Object.freeze({ y: 540, x0: 900, x1: 1710, h: 104, portX: 1800, portR: 62 });

function bodyEye(ctx, t, C) {
  const eye = S08_ART.images.eye;
  const s = EYE.size / EYE.canvas;
  const w = Math.round(EYE.canvas * s);
  const left = Math.round(EYE.cx - EYE.x * s);
  const top = Math.round(EYE.cy - EYE.y * s);

  // 1. the halo, printed first: the light in this film is paper and ink wedges
  sunburst(ctx, EYE.cx + 40, EYE.cy - 40, 300, 760, 40, C.accent, 0.30, t * 0.10, 2);
  sunburst(ctx, EYE.cx + 40, EYE.cy - 40, 380, 690, 40, C.line, 0.20, t * 0.10 + 0.04, 4);
  rays(ctx, EYE.cx + 40, EYE.cy - 40, 430, 860, 72, C.dim, 0.35, t * 0.05);

  // 2. the face, printed twice: six pixels out of register, so it reads as a print
  const img = eye;
  if (img && img.complete) {
    const art = scaledArt(img, w, w);
    if (art) {
      layer(ctx, 0.28, () => ctx.drawImage(art, left + 9, top - 6));
      layer(ctx, 1, () => ctx.drawImage(art, left, top));
    }
  }

  // 2b. the rays print OVER her face, not behind it: the one thing the film does
  //     instead of a lens flare is put the burst in the ink
  rays(ctx, EYE.cx + 30, EYE.cy - 20, 240, 900, 96, C.line, 0.10, t * 0.02, 1.5);
  sunburst(ctx, EYE.cx + 30, EYE.cy - 20, 320, 820, 44, C.accent, 0.10, -t * 0.05, 4);

  // 3. the channel out of the pupil: everything she has, one direction
  ctx.beginPath();
  ctx.moveTo(CH.x0, CH.y - CH.h / 2);
  ctx.lineTo(CH.x1, CH.y - CH.h / 2);
  ctx.lineTo(CH.x1, CH.y + CH.h / 2);
  ctx.lineTo(CH.x0, CH.y + CH.h / 2);
  ctx.closePath();
  ctx.fillStyle = C.fill;
  ctx.fill();
  stroke(ctx, [[CH.x0, CH.y - CH.h / 2], [CH.x1, CH.y - CH.h / 2]], C.line, 2.5);
  stroke(ctx, [[CH.x0, CH.y + CH.h / 2], [CH.x1, CH.y + CH.h / 2]], C.line, 2.5);
  stroke(ctx, [[CH.x0, CH.y], [CH.x1, CH.y]], C.line, 4);
  for (let x = CH.x0; x <= CH.x1; x += 56) {
    stroke(ctx, [[x, CH.y - CH.h / 2], [x, CH.y - CH.h / 2 + 10]], C.dim, 1);
    stroke(ctx, [[x, CH.y + CH.h / 2 - 10], [x, CH.y + CH.h / 2]], C.dim, 1);
  }

  // 4. the port and the refusal: packets go out, shavings come back
  const flood = easeOut((t - lineStart(107)) / 0.45);
  const sp = 780 + 520 * flood;
  for (let k = 0; k < 9; k++) {
    const x = Math.round(CH.x0 + 20 + (t - lineStart(106)) * sp - k * 190);
    if (x < CH.x0 + 10 || x > CH.x1 - 30) continue;
    ctx.fillStyle = C.hot;
    ctx.fillRect(x, CH.y - 18, 64, 36);
    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 64, CH.y - 18, 12, 36);
    layer(ctx, 0.3, () => ctx.fillRect(x - 40, CH.y - 9, 40, 18));
  }
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(CH.portX, CH.y, CH.portR, Math.PI + 0.66, Math.PI * 3 - 0.66);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CH.portX, CH.y, CH.portR - 18, Math.PI + 0.4, Math.PI * 3 - 0.4);
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 2;
  ctx.stroke();
  redPort(ctx, CH.x1 + 2, CH.y, 1, CH.h);
  const age = t - lineStart(107);
  if (age > 0) {
    shavings(ctx, CH.x1 - 6, CH.y, age, C.hot, 0.9);
    shavings(ctx, CH.x1 - 6, CH.y, age - 0.33, C.accent, 0.7);
  }
  type(ctx, "REPLIES 0", CH.portX, CH.y + 116, 15, C.mid, "MV Mono", "center");
  type(ctx, `${Math.round(flood * 100)}% out`, CH.x0, CH.y + CH.h / 2 + 34, 13, C.dim, "MV Mono");

  // 5. the pupil: the one point where all of it comes from
  disc(ctx, EYE.cx + 40, EYE.cy - 10, 10, C.accent, 1);
  disc(ctx, EYE.cx + 40, EYE.cy - 10, 40, C.accent, 0.5, false, 2);
}

// ===========================================================================
// plate 02 -- every form of her, sent and returned (074)
// ===========================================================================
const FRONT = Object.freeze({ cx: 1150, cy: 600, h: 950 });
const FRONT_BOX = (() => {
  const s = FRONT.h / 1438;
  const w = Math.round(1342 * s);
  const h = Math.round(1704 * s);
  const contentW = Math.round(1086 * s);
  const left = Math.round(FRONT.cx - contentW / 2 - 128 * s);
  const top = Math.round(FRONT.cy - FRONT.h / 2 - 128 * s);
  return { left, top, w, h };
})();

const LANES = Object.freeze([
  { y: 360, left: true },
  { y: 480, left: true },
  { y: 720, left: false },
  { y: 840, left: false },
]);

function laneCue(i) {
  const line = i < 2 ? 109 : 110;
  return lineStart(line) + (i % 2) * 0.46;
}

function bodyForms(ctx, t, C) {
  // 1. the ring of plate 02, still turning with nobody at the button
  tickRing(ctx, FRONT.cx, 470, 452, 64, C.dim, -Math.PI * 0.92, Math.PI * 1.84);

  // 2. four lanes, one form each: a portrait travels out and dies at the border
  for (let i = 0; i < LANES.length; i++) {
    const lane = LANES[i];
    const form = FORMS[i];
    const prog = easeOut((t - laneCue(i)) / 0.4);
    if (prog <= 0) continue;
    const reach = lane.left ? FRONT.cx - PLATE.x : PLATE.x + PLATE.w - FRONT.cx;
    const end = lane.left ? FRONT.cx - Math.round(reach * prog) : FRONT.cx + Math.round(reach * prog);
    const xa = Math.min(FRONT.cx, end);
    const xb = Math.max(FRONT.cx, end);
    ctx.fillStyle = C.fill;
    ctx.fillRect(xa, lane.y - 56, xb - xa, 112);
    stroke(ctx, [[xa, lane.y - 56], [xb, lane.y - 56]], C.dim, 1.5);
    stroke(ctx, [[xa, lane.y + 56], [xb, lane.y + 56]], C.dim, 1.5);
    stroke(ctx, [[xa, lane.y], [xb, lane.y]], C.line, 2);
    // the copy of her travelling down the lane
    const died = prog >= 1;
    const px = lane.left ? end + 96 : end - 96;
    portrait(ctx, form.key, px, lane.y, 260, { alpha: died ? 0.55 : 0.92 });
    layer(ctx, 0.95, () => {
      type(ctx, `form ${i + 1} · ${form.label}`, px, lane.y + 172, 14, died ? RED_EDGE : C.mid, "MV Mono", "center");
    });
    if (died) {
      const edge = lane.left ? PLATE.x : PLATE.x + PLATE.w;
      redPort(ctx, edge, lane.y, lane.left ? 1 : -1, 120);
      // the refusal, on the copy itself
      const mx = lane.left ? edge + 150 : edge - 150;
      stroke(ctx, [[mx - 16, lane.y - 16], [mx + 16, lane.y + 16]], RED_EDGE, 3);
      stroke(ctx, [[mx - 16, lane.y + 16], [mx + 16, lane.y - 16]], RED_EDGE, 3);
      const age = t - (laneCue(i) + 0.4);
      shavings(ctx, lane.left ? edge + 46 : edge - 46, lane.y, age, C.hot, 0.8);
    }
  }

  // 3. her, front on, 88%, crisp: the copy the others are taken from
  const bust = figureImages.bust;
  if (bust && bust.complete) {
    const art = scaledArt(bust, FRONT_BOX.w, FRONT_BOX.h);
    if (art) {
      const bob = Math.round(Math.sin(t * 0.7) * 3);
      layer(ctx, 1, () => ctx.drawImage(art, FRONT_BOX.left, FRONT_BOX.top + bob));
    }
  }

  // 4. the count, in the margin: what she sent and what came back
  const outCount = LANES.filter((_, i) => t >= laneCue(i) + 0.4).length;
  type(ctx, "FORMS OUT", PLATE.x + 26, 878, 13, C.mid, "MV Mono");
  counter(ctx, PLATE.x + 26, 892, outCount, { digits: 2, size: 26, colour: C.line });
  type(ctx, "REPLIES 0", PLATE.x + 190, 940, 14, C.mid, "MV Mono");
}

// ===========================================================================
// plate 03 -- the palm, the counter, and the hole where the other hand is (076)
// ===========================================================================
const PALM = Object.freeze({ x: 1080, y: 540, w: 620 });
const HAND_AT = shotById("cx-hand")?.at ?? 170.1622;

function heartOutline(ctx, x, y, hs, C) {
  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(x, y + hs * 0.95);
  ctx.bezierCurveTo(x - hs * 1.5, y - hs * 0.25, x - hs * 0.55, y - hs * 1.25, x, y - hs * 0.35);
  ctx.bezierCurveTo(x + hs * 0.55, y - hs * 1.25, x + hs * 1.5, y - hs * 0.25, x, y + hs * 0.95);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** A hand-shaped hole in the paper, with a two-pixel rim: what is not there. */
function handHole(ctx, k) {
  const palm = ART.images.palm;
  if (!palm || !palm.complete || k <= 0.01) return;
  const s = 320 / PALM_BOX.w;
  const w = Math.round(palm.width * s);
  const h = Math.round(palm.height * s);
  const cx = 566;
  const cy = 610;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  const rim = silhouetteOf(palm, w, h, BLUE);
  const hole = silhouetteOf(palm, w, h, INK);
  if (!rim || !hole) return;
  ctx.save();
  ctx.globalAlpha *= clamp01(k);
  if (rim) {
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) ctx.drawImage(rim, x + dx, y + dy);
  }
  ctx.drawImage(hole, x, y);
  ctx.restore();
  type(ctx, "the other hand", cx, cy + h / 2 + 30, 13, PAPER_DIM, "MV Mono", "center");
}

function bodyPalm(ctx, t, C) {
  // 0. the hole first, so her hand prints over it and only its edge shows
  handHole(ctx, easeOut((t - (HAND_AT + 0.5)) / 1.1));

  // 1. the hand, placed by the same numbers c1-happy used
  const palm = ART.images.palm;
  if (palm && palm.complete) {
    const s = PALM.w / PALM_BOX.w;
    const w = Math.round(palm.width * s);
    const h = Math.round(palm.height * s);
    const ox = Math.round(PALM.x - (PALM_BOX.x + PALM_ANCHOR.x) * s);
    const oy = Math.round(PALM.y - (PALM_BOX.y + PALM_ANCHOR.y) * s);
    const art = scaledArt(palm, w, h);
    if (art) layer(ctx, 1, () => ctx.drawImage(art, ox, oy));
  }

  // 2. the contact: the ring is the last thing that closes
  const snapAt = lineStart(113);
  const snap = clamp01((t - snapAt) / 0.35);
  const ringR = Math.round(100 - 94 * snap);
  ctx.beginPath();
  ctx.arc(PALM.x, PALM.y, 58, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(4,18,32,0.84)";
  ctx.fill();
  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.arc(PALM.x, PALM.y, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  heartOutline(ctx, PALM.x, PALM.y, 106, C);
  disc(ctx, PALM.x, PALM.y, snap > 0.9 ? 12 : 9, C.accent, 1);
  stroke(ctx, [[PALM.x - 34, PALM.y], [PALM.x - 16, PALM.y]], C.accent, 2, 0.9);
  stroke(ctx, [[PALM.x + 16, PALM.y], [PALM.x + 34, PALM.y]], C.accent, 2, 0.9);
  stroke(ctx, [[PALM.x, PALM.y - 34], [PALM.x, PALM.y - 16]], C.accent, 2, 0.9);
  stroke(ctx, [[PALM.x, PALM.y + 16], [PALM.x, PALM.y + 34]], C.accent, 2, 0.9);
  if (snap > 0 && snap < 1) {
    rays(ctx, PALM.x, PALM.y, 24, 140, 24, C.line, 0.5 * (1 - snap), snap * 2.4);
  }

  // 3. the counter: 001 until "If I can have you back" has been sung, then 000
  const flipAt = Math.max(lineStart(112), HAND_AT) + 0.62;
  const flip = clamp01((t - flipAt) / 0.32);
  counter(ctx, PLATE.x + 26, 840, flip >= 0.5 ? 0 : 1, {
    digits: 3, size: 40, colour: PAPER, flip, oldValue: 1, label: "CONFIRMATIONS",
  });
  type(ctx, flip >= 0.5 ? "was 001" : "one confirmation", PLATE.x + 26, 936, 13, C.mid, "MV Mono");

  // 4. the waves, and what comes back off the torn edge
  const cues = [Math.max(lineStart(112), HAND_AT), lineStart(112) + 0.62, lineStart(113)];
  for (let k = 0; k < 3; k++) {
    const age = t - cues[k];
    if (age < 0 || age > 1.1) continue;
    const r = Math.round(150 + age * 900);
    const fade = 1 - clamp01((r - 760) / 540);
    if (fade <= 0.01) continue;
    ctx.save();
    ctx.beginPath();
    ctx.arc(PALM.x, PALM.y, r, Math.PI - 0.62, Math.PI + 0.62);
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9 * fade;
    ctx.stroke();
    ctx.restore();
  }
  const lastWave = Math.max(0, t - cues[1]);
  if (lastWave > 0) shavings(ctx, 430, 600, lastWave, C.hot, 0.85);


  // 6. the margin
  type(ctx, "CONTACT  /  OLD", PLATE.x + 26, 960, 13, C.mid, "MV Mono");
}

// ===========================================================================
// plate 04 -- the last form she has, and the grid that closes on it (078)
// ===========================================================================
const FALL_AT = shotById("cx-fall")?.at ?? 173.8547;
const GRID = Object.freeze({ cx: 960, cy: 560, from: 148, to: 64, dec: 20, hold: 0.55 });

const WAVES = Object.freeze([
  { p: [[-160, 250], [320, 250], [760, 330], [GRID.cx, GRID.cy]], cue: () => FALL_AT + 0.18 },
  { p: [[-160, 560], [360, 540], [720, 650], [GRID.cx, GRID.cy]], cue: () => lineStart(116) },
  { p: [[-160, 880], [320, 880], [800, 800], [GRID.cx, GRID.cy]], cue: () => lineStart(116) + 1.15 },
]);

function cubicAt(p, u) {
  const v = 1 - u;
  return [
    v * v * v * p[0][0] + 3 * v * v * u * p[1][0] + 3 * v * u * u * p[2][0] + u * u * u * p[3][0],
    v * v * v * p[0][1] + 3 * v * v * u * p[1][1] + 3 * v * u * u * p[2][1] + u * u * u * p[3][1],
  ];
}

function bodyGod(ctx, t, C) {
  const k = Math.max(0, Math.floor((t - FALL_AT) / GRID.hold));
  const step = Math.max(GRID.to, GRID.from - k * GRID.dec);
  const grow = easeOut((t - FALL_AT) / 1.9);
  const godH = Math.round(400 + 320 * grow);

  // 1. the halo behind her: printed wedges, the god plate's own crown doubled
  sunburst(ctx, GRID.cx, GRID.cy - 40, 260, 700, 36, C.accent, 0.13, -t * 0.06, 2);
  rays(ctx, GRID.cx, GRID.cy - 40, 320, 820, 60, C.dim, 0.15, t * 0.03);

  // 2. the grid, closing around her
  ctx.save();
  ctx.beginPath();
  ctx.rect(PLATE.x + 14, PLATE.y + 14, PLATE.w - 28, PLATE.h - 28);
  ctx.clip();
  const reach = Math.ceil(PLATE.w / 2 / step) + 1;
  for (let i = -reach; i <= reach; i++) {
    const x = GRID.cx + i * step;
    if (x > PLATE.x + 14 && x < PLATE.x + PLATE.w - 14) {
      stroke(ctx, [[x, PLATE.y + 14], [x, PLATE.y + PLATE.h - 14]],
        i % 4 === 0 ? C.mid : C.dim, i % 4 === 0 ? 2 : 1);
    }
    const y = GRID.cy + i * step;
    if (y > PLATE.y + 14 && y < PLATE.y + PLATE.h - 14) {
      stroke(ctx, [[PLATE.x + 14, y], [PLATE.x + PLATE.w - 14, y]],
        i % 4 === 0 ? C.mid : C.dim, i % 4 === 0 ? 2 : 1);
    }
  }
  ctx.restore();

  // 3. the three waves, folding back into the same grid
  WAVES.forEach((w) => {
    const prog = easeOut((t - w.cue()) / 0.62);
    if (prog <= 0) return;
    const n = Math.max(2, Math.round(prog * 64));
    const pts = [];
    for (let j = 0; j <= n; j++) {
      const [x, y] = cubicAt(w.p, (j / n) * prog);
      pts.push([Math.round(x), Math.round(y)]);
    }
    stroke(ctx, pts, C.accent, 6, 0.16);
    stroke(ctx, pts, C.line, 2);
    if (prog >= 1) {
      const age = t - (w.cue() + 0.62);
      if (age < 0.9) {
        const r = Math.round(30 + age * 240);
        ctx.save();
        ctx.beginPath();
        ctx.arc(GRID.cx, GRID.cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = C.accent;
        ctx.globalAlpha = 0.5 * (1 - age / 0.9);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
  });

  // 4. her last form: the god plate, paper white, face a hole -- printed over the
  //    cell so the grid closes on a white shape instead of a dark one
  const cell = { x: GRID.cx - 300, y: GRID.cy - 380, w: 600, h: 760 };
  ctx.fillStyle = "rgba(0,180,230,0.10)";
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  const god = figureImages.godPaper;
  if (god && god.complete) {
    const s = godH / 1438;
    const w = Math.round(1342 * s);
    const h = Math.round(1704 * s);
    const art = scaledArt(god, w, h);
    if (art) {
      layer(ctx, 0.28, () => ctx.drawImage(art, Math.round(GRID.cx - w / 2) - 10, Math.round(GRID.cy - h / 2) + 6));
      layer(ctx, 1, () => ctx.drawImage(art, Math.round(GRID.cx - w / 2), Math.round(GRID.cy - h / 2)));
    }
  }
  disc(ctx, GRID.cx, GRID.cy, 7, C.hot, 0.9);

  // 4b. the grid prints again OVER the white form: the cage has to be seen closing
  //     on her, not only around her
  ctx.save();
  ctx.beginPath();
  ctx.rect(PLATE.x + 14, PLATE.y + 14, PLATE.w - 28, PLATE.h - 28);
  ctx.clip();
  for (let i = -reach; i <= reach; i++) {
    const x = GRID.cx + i * step;
    if (x > PLATE.x + 14 && x < PLATE.x + PLATE.w - 14) {
      stroke(ctx, [[x, PLATE.y + 14], [x, PLATE.y + PLATE.h - 14]],
        i % 4 === 0 ? "rgba(4,18,32,0.85)" : "rgba(4,18,32,0.45)", i % 4 === 0 ? 3 : 1.5);
    }
    const y = GRID.cy + i * step;
    if (y > PLATE.y + 14 && y < PLATE.y + PLATE.h - 14) {
      stroke(ctx, [[PLATE.x + 14, y], [PLATE.x + PLATE.w - 14, y]],
        i % 4 === 0 ? "rgba(4,18,32,0.85)" : "rgba(4,18,32,0.45)", i % 4 === 0 ? 3 : 1.5);
    }
  }
  ctx.restore();

  // 5. the cell she is in, in front of her
  stroke(ctx, [
    [cell.x, cell.y], [cell.x + cell.w, cell.y], [cell.x + cell.w, cell.y + cell.h],
    [cell.x, cell.y + cell.h], [cell.x, cell.y],
  ], "#041220", 4);
  stroke(ctx, [
    [cell.x - 4, cell.y - 4], [cell.x + cell.w + 4, cell.y - 4], [cell.x + cell.w + 4, cell.y + cell.h + 4],
    [cell.x - 4, cell.y + cell.h + 4], [cell.x - 4, cell.y - 4],
  ], C.line, 1.5);
  for (const [cx, cy] of [
    [cell.x, cell.y], [cell.x + cell.w, cell.y],
    [cell.x, cell.y + cell.h], [cell.x + cell.w, cell.y + cell.h],
  ]) regCross(ctx, cx, cy, C.mid);

  // 6. the far exit: off the sheet, and it does not close
  const exY = GRID.cy;
  ctx.fillStyle = C.fill;
  ctx.fillRect(cell.x + cell.w, exY - 30, 1920 - (cell.x + cell.w), 60);
  stroke(ctx, [[cell.x + cell.w, exY - 30], [1920, exY - 30]], C.dim, 1.5);
  stroke(ctx, [[cell.x + cell.w, exY + 30], [1920, exY + 30]], C.dim, 1.5);
  stroke(ctx, [[cell.x + cell.w, exY], [1920, exY]], C.line, 2);
  ctx.save();
  ctx.fillStyle = RED_EDGE;
  ctx.fillRect(PLATE.x + PLATE.w - 2, exY - 32, 2, 64);
  ctx.restore();
  type(ctx, "exit off the sheet", PLATE.x + PLATE.w - 30, exY + 56, 12, PAPER_DIM, "MV Mono", "right");

  // 7. the margin
  const back = WAVES.filter((w) => t - w.cue() >= 0.62).length;
  type(ctx, "SAME GRID  /  CLOSING", PLATE.x + 26, 878, 13, C.mid, "MV Mono");
  type(ctx, `waves back ${back} / 3`, PLATE.x + 26, 902, 13, C.dim, "MV Mono");
  type(ctx, "the last form is a god, and it is still inside", PLATE.x + 26, 926, 13, C.dim, "MV Mono");
}

// ===========================================================================
// the title bars (073 / 075 / 077)
// ===========================================================================
const BAR = Object.freeze({ x: 160, y: 416, w: 1600, h: 248 });

function barField(ctx, y, dx, o = {}) {
  const { alpha = 1, edge = BLUE_MID } = o;
  layer(ctx, alpha, () => {
    const x = BAR.x + dx;
    ctx.fillStyle = "rgba(4,18,32,0.68)";
    ctx.fillRect(x, y, BAR.w, BAR.h);
    stroke(ctx, [[x, y], [x + BAR.w, y]], edge, 3);
    stroke(ctx, [[x, y + BAR.h], [x + BAR.w, y + BAR.h]], edge, 2);
    stroke(ctx, [[x, y], [x, y + BAR.h]], edge, 3);
    stroke(ctx, [[x + BAR.w, y], [x + BAR.w, y + BAR.h]], edge, 3);
    for (let tx = x + 20; tx < x + BAR.w - 14; tx += 40) {
      ctx.fillStyle = BLUE_DIM;
      ctx.fillRect(tx, y - 8, 1, 8);
    }
  });
}

function barMiss(ctx, cut) {
  const x0 = BAR.x + BAR.w - cut;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, BAR.y - 14, cut + 40, BAR.h + 28);
  ctx.fillStyle = SHEET;
  ctx.fill();
  ctx.restore();
  const edge = [
    [x0, BAR.y - 4], [x0 + 16, BAR.y + 34], [x0 - 10, BAR.y + 76], [x0 + 12, BAR.y + 118],
    [x0 - 6, BAR.y + 158], [x0 + 14, BAR.y + 198], [x0, BAR.y + BAR.h + 4],
  ];
  stroke(ctx, edge, BLUE_DIM, 2, 0.85);
}

/** The four forms, printed small across the sheet: the part of the run that failed. */
function formRow(ctx, t, n) {
  const y = 860;
  FORMS.forEach((f, i) => {
    const x = 330 + i * 190;
    const ghost = n >= 3;
    portrait(ctx, f.key, x, y - 40, 150, { alpha: ghost ? 0.5 : 1, colour: ghost ? "rgba(0,180,230,0.5)" : null });
    type(ctx, ghost ? `${f.label} · lost` : f.label, x, y + 96, 13, ghost ? PAPER_DIM : PAPER_MID, "MV Mono", "center");
    if (ghost) {
      // the plate stopped printing the forms: their outline is all that is left
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(x - 62, y - 118, 124, 156);
      ctx.strokeStyle = BLUE_DIM;
      ctx.stroke();
      ctx.restore();
    }
  });
}

function bodyBar(ctx, t, C, n) {
  if (n >= 4) barField(ctx, BAR.y - 10, 13, { alpha: 0.4 });
  if (n >= 4) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(BAR.x - 40, BAR.y - 40, BAR.w + 80, 124);
    ctx.clip();
    barField(ctx, BAR.y + 11, 12, { alpha: 1 });
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(BAR.x - 40, BAR.y + 84, BAR.w + 80, BAR.h + 40);
    ctx.clip();
    barField(ctx, BAR.y - 9, -10, { alpha: 1 });
    ctx.restore();
    stroke(ctx, [[BAR.x - 20, BAR.y + 84], [BAR.x + BAR.w + 20, BAR.y + 84]], INK, 7);
    stroke(ctx, [[BAR.x - 20, BAR.y + 84], [BAR.x + BAR.w + 20, BAR.y + 84]], RED_EDGE, 2, 0.9);
  } else {
    barField(ctx, BAR.y, 0, { alpha: 1 });
  }
  if (n === 3) barMiss(ctx, 210);

  type(ctx, "plate", BAR.x + 40, BAR.y + 62, 14, C.mid, "MV Mono");
  type(ctx, pad2(n), BAR.x + 34, BAR.y + 200, 128, C.mid, "MV Mono");
  stroke(ctx, [[BAR.x + 262, BAR.y + 28], [BAR.x + 262, BAR.y + BAR.h - 28]], C.dim, 2);

  const rEdge = BAR.x + BAR.w - (n === 3 ? 236 : 0);
  const was = `was ${TITLE_OF(n)}`;
  type(ctx, was, rEdge, BAR.y + 196, 30, PAPER_MID, "MV Mono", "right");
  ctx.font = '400 30px "MV Mono"';
  const wasW = ctx.measureText(was).width;
  const wx = rEdge - wasW;
  stroke(ctx, [[wx - 12, BAR.y + 188], [rEdge + 12, BAR.y + 188]], RED_EDGE, 2, 0.9);
  stroke(ctx, [[wx - 24, BAR.y + 178], [wx - 8, BAR.y + 196]], RED_EDGE, 2);
  stroke(ctx, [[wx - 24, BAR.y + 196], [wx - 8, BAR.y + 178]], RED_EDGE, 2);
  type(ctx, "retitled", rEdge, BAR.y + 118, 13, C.dim, "MV Mono", "right");

  // the title: pressed once, on its own line, and then simply there
  drawSlam(ctx, lineText(n === 2 ? 108 : n === 3 ? 111 : 114), 960, 586, t,
    lineStart(n === 2 ? 108 : n === 3 ? 111 : 114), {
      size: 140, family: "MV Serif", color: PAPER, align: "center",
      perChar: 0.012, dur: 0.14, from: 1.4, rise: 0,
    });

  type(ctx, `title ${pad2(n)} of 04`, BAR.x, BAR.y - 30, 14, C.mid, "MV Mono");
  type(ctx, n >= 4 ? "sheet jammed" : n >= 3 ? "bar bitten" : "in register",
    BAR.x + BAR.w, BAR.y - 30, 14, C.mid, "MV Mono", "right");
  type(ctx, "THE SAME WORD ON ALL FOUR PLATES", BAR.x, BAR.y + BAR.h + 38, 13, C.dim, "MV Mono");
  type(ctx, `run ${n} / 04   ·   key ${n * 6}px out of register`,
    BAR.x + BAR.w, BAR.y + BAR.h + 38, 13, C.dim, "MV Mono", "right");
}

// ===========================================================================
// shot wrappers
// ===========================================================================
function plateShot(n, body, opts = {}) {
  const { chip = false, dots = [], note = "", grade = null, burst = 0 } = opts;
  return (ctx, t, s) => {
    sheetPage(ctx, t, n, note);
    if (dots.length) dotScreen(ctx, dots);
    if (burst > 0) {
      // the sheet's own light: one wedge burst behind the impression
      sunburst(ctx, 960, 520, 240, 820, 48, BLUE, 0.10 * burst, s.at * 0.1, 3);
    }
    impressions(ctx, t, n, body);
    if (chip) tornEdge(ctx);
    return { phase: `plate-${n}`, plate: n, grade };
  };
}

function barShot(n, prevBody, prevPlate, opts = {}) {
  const { note = "", dots = [], grade = null } = opts;
  return (ctx, t, s) => {
    sheetPage(ctx, t, n, note);
    if (dots.length) dotScreen(ctx, dots);
    if (n === 2) formRow(ctx, t, 2);
    if (n >= 3) formRow(ctx, t, n);
    layer(ctx, 0.15, () => {
      ctx.translate(14, -10);
      prevBody(ctx, t, CYAN);
    });
    bodyBar(ctx, t, KEY, n);
    return { phase: `bar-${n}`, plate: n, prevPlate, grade };
  };
}

// the stamp lands a beat after each cut; the grade hits with it and lets go
const slamGrade = (t, line) => {
  const age = t - lineStart(line);
  if (age < 0 || age > 0.5) return { glow: 0.46, aberration: 0, flash: 0, camera: { shakeX: 0, shakeY: 0 } };
  const k = 1 - age / 0.5;
  return {
    glow: 0.46 + 0.25 * k,
    aberration: Math.round(7 * k),
    flash: 0.16 * k,
    camera: { shakeX: Math.round(Math.sin(age * 70) * 4 * k), shakeY: Math.round(Math.cos(age * 63) * 3 * k) },
  };
};

export const SECTION12_RENDER = Object.freeze({
  "cx-eye": (ctx, t, s) => {
    const flood = easeOut((t - lineStart(107)) / 0.45);
    const out = plateShot(1, bodyEye, {
      note: "plate 01 · stimulations · everything out, nothing back",
      dots: [
        { x: 40, y: 40, w: 1520, h: 1000, alpha: 0.10 },
        { x: 900, y: 480, w: 900, h: 120, alpha: 0.06 },
      ],
      grade: {
        glow: 0.46 + 0.10 * flood,
        aberration: Math.round(4 * flood),
        flash: 0.10 * easeOut((t - lineStart(107)) / 0.3),
        camera: { shakeX: Math.round(Math.sin(t * 61) * 2 * flood), shakeY: Math.round(Math.cos(t * 57) * 2 * flood) },
      },
    });
    return out(ctx, t, s);
  },
  "cx-kw1": (ctx, t, s) => {
    const out = barShot(2, bodyEye, 1, { note: "title bar · first press", grade: slamGrade(t, 108) });
    return out(ctx, t, s);
  },
  "cx-bust": (ctx, t, s) => {
    const outCount = LANES.filter((_, i) => t >= laneCue(i) + 0.4).length;
    const out = plateShot(2, bodyForms, {
      note: "plate 02 · satisfaction · four forms sent, none returned",
      dots: [{ x: 150, y: 590, w: 520, h: 300, alpha: 0.09 }],
      grade: {
        glow: 0.46,
        aberration: 0,
        flash: 0,
        camera: {
          shakeX: outCount > 0 ? Math.round(Math.sin(t * 53) * 2) : 0,
          shakeY: outCount > 0 ? Math.round(Math.cos(t * 47) * 2) : 0,
        },
      },
    });
    return out(ctx, t, s);
  },
  "cx-kw2": (ctx, t, s) => {
    const out = barShot(3, bodyForms, 2, { note: "title bar · second press", grade: slamGrade(t, 111) });
    return out(ctx, t, s);
  },
  "cx-hand": (ctx, t, s) => {
    const snap = clamp01((t - lineStart(113)) / 0.35);
    const out = plateShot(3, bodyPalm, {
      chip: true,
      note: "plate 03 · execution · the other hand is a hole in the paper",
      dots: [
        { x: 120, y: 76, w: 1680, h: 930, alpha: 0.04 },
        { x: 1180, y: 700, w: 540, h: 290, alpha: 0.10 },
      ],
      grade: {
        glow: 0.46,
        aberration: Math.round(5 * Math.sin(Math.PI * snap)),
        flash: 0.10 * snap,
        camera: { shakeX: Math.round(Math.sin(t * 67) * 3 * snap), shakeY: Math.round(Math.cos(t * 59) * 2 * snap) },
      },
    });
    return out(ctx, t, s);
  },
  "cx-kw3": (ctx, t, s) => {
    const out = barShot(4, bodyPalm, 3, { note: "title bar · third press", grade: slamGrade(t, 114) });
    return out(ctx, t, s);
  },
  "cx-fall": (ctx, t, s) => {
    const hit = easeOut((t - lineStart(116)) / 0.5);
    const out = plateShot(4, bodyGod, {
      note: "plate 04 · simulation · the last form is a god, and it is still inside",
      dots: [{ x: PLATE.x + 14, y: PLATE.y + 14, w: PLATE.w - 28, h: PLATE.h - 28, alpha: 0.045 }],
      burst: 1,
      grade: {
        glow: 0.46,
        // no aberration on this one: the split draws the whole content canvas twice
        // with lighter, and at this exposure it came back one pixel /1 LSB different
        // after a seek. Shake + bloom + the flash carry the hit instead.
        aberration: 0,
        flash: 0,
        camera: { shakeX: Math.round(Math.sin(t * 49) * 3 * hit), shakeY: Math.round(Math.cos(t * 41) * 3 * hit) },
      },
    });
    return out(ctx, t, s);
  },
});

export const SECTION12_IMPLEMENTED = Object.freeze(Object.keys(SECTION12_RENDER));
