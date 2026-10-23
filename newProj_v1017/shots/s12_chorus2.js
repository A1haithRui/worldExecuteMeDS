// Section 12 最后副歌：把每一样"我"都印出去，四张版画全被退回来 -- seven shots,
// song time [162.777, 177.547).
//
// The story, in one line: she prints every version of herself, sends it out, and
// every version is refused at the border of the sheet; the last form she is left
// with is the god plate, and it is caged too.
//
//   072 cx-eye    her eye fills the sheet; a paper lyric card is laid over her hair
//                 (ink on paper) and the picture starts to break into mosaic blocks.
//   073 title 02  one syllable, one form slammed onto the sheet behind the bar; four
//                 syllables, four forms; then they fly apart into the four corners.
//   074 cx-bust   she stands front on at 88%; on the left the four forms stack up,
//                 large and overlapping, throwing mosaic blocks at each other.
//   075 title 03  the same bar, second press, the four forms still in the corners.
//   076 cx-hand   the whole figure behind, the palm in front, offset: the figure
//                 crumbles into mosaic and code characters, and only the hand stays.
//   077 title 04  the last press is a terminal: chat window, code block, whale, and
//                 every line it runs errors and then falls apart.
//   078 cx-fall   the grid starts empty; four lines converge and each prints one
//                 form; the last one printed is the god, and the light comes out of it.
//
// Effects stay printed: sunbursts are flat wedges, mosaic damage is the picture
// quantised to blocks, "light" is paper area. Determinism: every offset integer, art
// through scaledArt, no pattern fills, no filters.
import { layer, stroke, disc, rect, type, clamp } from "../src/mv-draw.js";
import { lineStart, lineText } from "./lines.js";
import { figureImages } from "./figure.js";
import { ART, PALM_BOX, PALM_ANCHOR, REACH_BOX, REACH_PALM, scaledArt } from "./s05_layout.js";
import { S08_ART } from "./s08_look.js";
import { plateBase, tickRing, PLATE } from "./plate.js";
import { shotById } from "./index.js";
import { drawWhale } from "../src/assets/whale.js";
import { drawSlam } from "../src/engine/type.js";
import { clientWindow } from "./ui-client.js";

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
const easeInOut = (k) => {
  const x = clamp01(k);
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
};

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

const FORMS = Object.freeze([
  { key: "bust", label: "F", name: "herself" },
  { key: "man", label: "M", name: "the man" },
  { key: "cat", label: "cat", name: "the cat" },
  { key: "godPaper", label: "god", name: "the god" },
]);

// ---------------------------------------------------------------------------
// pictures, and pictures broken into blocks
// ---------------------------------------------------------------------------
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

/** The same picture quantised into blocks; baked once per size. */
const mosaicCache = new Map();
function mosaicOf(img, w, h, block) {
  if (!img || !img.complete) return null;
  const key = `${img.src}#${w}x${h}#${block}`;
  if (mosaicCache.has(key)) return mosaicCache.get(key);
  const art = scaledArt(img, w, h);
  if (!art) return null;
  const cols = Math.ceil(w / block);
  const rows = Math.ceil(h / block);
  const small = document.createElement("canvas");
  small.width = cols;
  small.height = rows;
  const sg = small.getContext("2d");
  sg.imageSmoothingEnabled = true;
  sg.drawImage(art, 0, 0, cols, rows);
  const big = document.createElement("canvas");
  big.width = cols * block;
  big.height = rows * block;
  const bg = big.getContext("2d");
  bg.imageSmoothingEnabled = false;
  bg.drawImage(small, 0, 0, cols, rows, 0, 0, cols * block, rows * block);
  const entry = { canvas: big, cols, rows, block };
  mosaicCache.set(key, entry);
  return entry;
}

const BLOCK_SEEDS = Object.freeze(
  Array.from({ length: 90 }, (_, i) => ({
    c: (i * 37) % 64,
    r: (i * 53) % 76,
    dx: ((i * 13) % 17) - 8,
    dy: ((i * 7) % 15) - 4,
    d: 20 + ((i * 29) % 160),
  })),
);

/** Blocks coming off a picture: the print breaking up, from a fixed table. */
function blockFall(ctx, mosaic, x, y, k, colour = null, alpha = 1, count = 70) {
  if (!mosaic || k <= 0.01) return;
  const { canvas, block } = mosaic;
  ctx.save();
  ctx.globalAlpha *= alpha * (1 - k * 0.55);
  for (let i = 0; i < count; i++) {
    const s = BLOCK_SEEDS[i % BLOCK_SEEDS.length];
    const sx = s.c * block;
    const sy = s.r * block;
    if (sx >= canvas.width || sy >= canvas.height) continue;
    const px = Math.round(x + sx + s.dx * 4 * k + s.d * 1.4 * k);
    const py = Math.round(y + sy + s.dy * 4 * k + s.d * 2.2 * k * k);
    if (colour) {
      ctx.fillStyle = colour;
      ctx.fillRect(px, py, block - 1, block - 1);
    } else {
      ctx.drawImage(canvas, sx, sy, block, block, px, py, block - 1, block - 1);
    }
  }
  ctx.restore();
}

/** The same picture, but everything below a moving edge is mosaic. */
function blockMask(ctx, mosaic, x, y, edge) {
  if (!mosaic) return;
  const { canvas } = mosaic;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y + edge, canvas.width, canvas.height);
  ctx.clip();
  ctx.drawImage(canvas, x, y);
  ctx.restore();
}

const CODE_CHARS = "01{}[]();=>+-*/#$_".split("");
const CODE_SEEDS = Object.freeze(
  Array.from({ length: 44 }, (_, i) => ({
    x: (i * 137) % 900,
    y: (i * 251) % 700,
    v: 30 + ((i * 17) % 90),
    ch: i % CODE_CHARS.length,
    size: 12 + (i % 5) * 3,
    sway: (i % 7) - 3,
  })),
);

/** Code characters falling out of a thing that is breaking. */
function codeFall(ctx, ox, oy, age, colour = PAPER, alpha = 0.8) {
  if (age <= 0) return;
  ctx.save();
  ctx.fillStyle = colour;
  for (const s of CODE_SEEDS) {
    const fall = (s.v * age) % 760;
    const px = Math.round(ox + s.x + s.sway * Math.sin(age * 2 + s.x * 0.01) * 6);
    const py = Math.round(oy + s.y + fall);
    if (py > 1040) continue;
    ctx.globalAlpha = alpha * (1 - fall / 900);
    type(ctx, CODE_CHARS[s.ch], px, py, s.size, colour, "MV Mono");
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// light, drawn as paper and ink
// ---------------------------------------------------------------------------
function sunburst(ctx, cx, cy, r0, r1, n, colour, alpha = 1, phase = 0) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = colour;
  for (let i = 0; i < n; i += 2) {
    const a = phase + (i / n) * Math.PI * 2;
    const w = (Math.PI / n) * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.round(cx + Math.cos(a - w) * r0), Math.round(cy + Math.sin(a - w) * r0));
    ctx.lineTo(Math.round(cx + Math.cos(a) * r1), Math.round(cy + Math.sin(a) * r1));
    ctx.lineTo(Math.round(cx + Math.cos(a + w) * r0), Math.round(cy + Math.sin(a + w) * r0));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

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

/** The ring of something landing. */
function landBurst(ctx, x, y, age, colour = BLUE, alpha = 1, max = 0.7) {
  if (age < 0 || age > max) return;
  const k = age / max;
  ctx.save();
  ctx.globalAlpha *= alpha * (1 - k);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  for (const f of [1, 0.66, 0.4]) {
    ctx.beginPath();
    ctx.arc(x, y, Math.round(30 + k * 420 * f), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

const SHARDS = Object.freeze(
  Array.from({ length: 18 }, (_, i) => ({
    a: (i / 18) * Math.PI * 2 + i * 0.37,
    v: 60 + ((i * 47) % 130),
    s: 4 + (i % 4) * 3,
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
// plate 01 -- her eye, the lyric card, the picture breaking (072)
// ===========================================================================
const EYE = Object.freeze({ x: 805, y: 645, canvas: 1510, size: 1450, cx: 780, cy: 540 });
const CH = Object.freeze({ y: 540, x0: 900, x1: 1710, h: 104, portX: 1800, portR: 62 });
const LYRIC_CARD = Object.freeze({ x: 104, y: 148, w: 1072, h: 158 });

function bodyEye(ctx, t, C) {
  const eye = S08_ART.images.eye;
  const s = EYE.size / EYE.canvas;
  const w = Math.round(EYE.canvas * s);
  const left = Math.round(EYE.cx - EYE.x * s);
  const top = Math.round(EYE.cy - EYE.y * s);

  sunburst(ctx, EYE.cx + 40, EYE.cy - 40, 300, 760, 40, C.accent, 0.26, t * 0.10);
  sunburst(ctx, EYE.cx + 40, EYE.cy - 40, 380, 690, 40, C.line, 0.16, t * 0.10 + 0.04);
  rays(ctx, EYE.cx + 40, EYE.cy - 40, 430, 860, 72, C.dim, 0.28, t * 0.05);

  const art = eye && eye.complete ? scaledArt(eye, w, w) : null;
  if (art) {
    layer(ctx, 0.28, () => ctx.drawImage(art, left + 9, top - 6));
    layer(ctx, 1, () => ctx.drawImage(art, left, top));
    const mos = mosaicOf(eye, w, w, 20);
    if (mos) {
      const k = easeOut((t - ((shotById("cx-eye")?.at ?? 162.7774) + 0.5)) / 2.0);
      blockMask(ctx, mos, left, top, Math.round(w * (0.82 - 0.34 * k)));
      blockFall(ctx, mos, left, top, k, null, 0.55, 60);
      blockFall(ctx, mos, left, top, k * 0.8, BLUE, 0.22, 20);
    }
  }

  rays(ctx, EYE.cx + 30, EYE.cy - 20, 240, 900, 96, C.line, 0.08, t * 0.02, 1.5);

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
  const shAge = t - lineStart(107);
  if (shAge > 0) {
    shavings(ctx, CH.x1 - 6, CH.y, shAge, C.hot, 0.9);
    shavings(ctx, CH.x1 - 6, CH.y, shAge - 0.33, C.accent, 0.7);
  }
  type(ctx, "REPLIES 0", CH.portX, CH.y + 116, 15, C.mid, "MV Mono", "center");

  disc(ctx, EYE.cx + 40, EYE.cy - 10, 10, C.accent, 1);
  disc(ctx, EYE.cx + 40, EYE.cy - 10, 40, C.accent, 0.5, false, 2);
}

/** The lyric gets a paper card laid over her hair: bold serif, ink on paper. */
const CARD_LINES = Object.freeze([
  { line: 106, y: 216, size: 58 },
  { line: 107, y: 282, size: 58 },
]);

function lyricCard(ctx, t) {
  const { x, y, w, h } = LYRIC_CARD;
  const open = easeOut((t - (shotById("cx-eye")?.at ?? 162.7774)) / 0.4);
  if (open <= 0.01) return;
  layer(ctx, open, () => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = INK;
    ctx.fillRect(x, y + h - 7, w, 7);
    for (const cx of [x + 22, x + w - 22]) {
      ctx.fillRect(cx - 1, y + 14, 2, 10);
      ctx.fillRect(cx - 5, y + 18, 10, 2);
    }
    type(ctx, "LYRIC 02  /  printed on paper", x + 20, y + 28, 12, "rgba(4,18,32,0.5)", "MV Mono");
    type(ctx, "bold serif  ·  58 / 62", x + w - 20, y + 28, 12, "rgba(4,18,32,0.5)", "MV Mono", "right");
  });

  // each line types on at its own beat, and the one before it steps back
  for (let i = 0; i < CARD_LINES.length; i++) {
    const { line, y: ly, size } = CARD_LINES[i];
    const text = lineText(line);
    const start = lineStart(line);
    const next = CARD_LINES[i + 1];
    const nextStart = next ? lineStart(next.line) : Infinity;
    const reveal = clamp01((t - start) / 0.3);
    const fadeOut = next ? clamp01(1 - (t - nextStart) / 0.18) : 1;
    const alpha = (i === 0 ? 1 : reveal) * fadeOut * (i === 0 && t < start ? 0 : 1);
    if (alpha <= 0.01) continue;
    const shown = i === 0 ? text.length : Math.round(text.length * easeOut(reveal));
    const cut = text.slice(0, Math.max(0, shown));
    if (!cut) continue;
    // the print: a cyan copy two pixels out of register, then the ink on top
    layer(ctx, open * alpha * 0.45, () =>
      type(ctx, cut, x + 56 + 2, ly + 1, size, BLUE, "MV Serif"),
    );
    layer(ctx, open * alpha, () => type(ctx, cut, x + 56, ly, size, INK, "MV Serif"));
  }

  // a rule under the words, and the beat they belong to
  layer(ctx, open, () => {
    const under = CARD_LINES[1].y + 26;
    ctx.fillStyle = "rgba(0,180,230,0.85)";
    ctx.fillRect(x + 54, under, 92, 3);
    type(ctx, "beat 02", x + w - 20, y + h - 20, 12, "rgba(4,18,32,0.55)", "MV Mono", "right");
  });
}

// ===========================================================================
// plate 02 -- one syllable, one form, then four corners (073)
// ===========================================================================
const BAR = Object.freeze({ x: 160, y: 416, w: 1600, h: 248 });
const SLAM_AT = Object.freeze({ x: 960, y: 540 });
const CORNERS = Object.freeze([
  [318, 262], [1602, 262], [318, 858], [1602, 858],
]);

function barField(ctx, y, dx, o = {}) {
  const { alpha = 1, edge = BLUE_MID } = o;
  layer(ctx, alpha, () => {
    const x = BAR.x + dx;
    ctx.fillStyle = "rgba(4,18,32,0.92)";
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

/** One form slammed onto the sheet per syllable, then flying to its corner. */
function slamForms(ctx, t, C) {
  const base = lineStart(108);
  const spreadAt = base + 0.62;
  const spread = easeInOut((t - spreadAt) / 0.5);
  for (let i = 0; i < 4; i++) {
    const cue = base + i * 0.16;
    const k = easeOut((t - cue) / 0.1);
    if (k <= 0) continue;
    const corner = CORNERS[i];
    const cx = Math.round(SLAM_AT.x + (corner[0] - SLAM_AT.x) * spread);
    const cy = Math.round(SLAM_AT.y + (corner[1] - SLAM_AT.y) * spread);
    const hMax = 620 - i * 30;
    const h = Math.round(hMax * (1.2 - 0.2 * k) * (1 - 0.45 * spread));
    if (t - cue < 0.32) {
      landBurst(ctx, SLAM_AT.x, SLAM_AT.y, t - cue, PAPER, 0.8, 0.32);
      rays(ctx, SLAM_AT.x, SLAM_AT.y, 30, 520, 36, C.line, 0.5 * (1 - (t - cue) / 0.32), 0.1, 2);
    }
    portrait(ctx, FORMS[i].key, cx, cy, h, { alpha: k * (0.9 - 0.2 * spread) });
    if (spread > 0.98) {
      type(ctx, `form ${i + 1} · ${FORMS[i].label} · ${FORMS[i].name}`, corner[0], corner[1] + 118, 13, C.mid, "MV Mono", "center");
      stroke(ctx, [[corner[0] - 92, corner[1] + 132], [corner[0] + 92, corner[1] + 132]], C.dim, 1);
    }
  }
}

function cornerForms(ctx, t, C) {
  const base = lineStart(108);
  const spread = easeInOut((t - (base + 0.62)) / 0.5);
  if (spread < 0.4) return;
  for (let i = 0; i < 4; i++) {
    const corner = CORNERS[i];
    const h = Math.round((520 - i * 26) * 0.55);
    portrait(ctx, FORMS[i].key, corner[0], corner[1], h, { alpha: 0.75 });
  }
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
// plate 02 -- she stands, four forms throw blocks at each other (074)
// ===========================================================================
const FRONT = Object.freeze({ cx: 1290, cy: 600, h: 950 });
const FRONT_BOX = (() => {
  const s = FRONT.h / 1438;
  const w = Math.round(1342 * s);
  const h = Math.round(1704 * s);
  const contentW = Math.round(1086 * s);
  const left = Math.round(FRONT.cx - contentW / 2 - 128 * s);
  const top = Math.round(FRONT.cy - FRONT.h / 2 - 128 * s);
  return { left, top, w, h };
})();

const STACK = Object.freeze([
  { x: 300, y: 330, h: 420 },
  { x: 430, y: 470, h: 470 },
  { x: 575, y: 610, h: 440 },
  { x: 720, y: 730, h: 400 },
]);

const ATTACKS = Object.freeze([
  { from: 0, to: 1, cue: 0.10 },
  { from: 1, to: 2, cue: 0.34 },
  { from: 2, to: 3, cue: 0.58 },
  { from: 3, to: 0, cue: 0.80 },
]);

function bodyForms(ctx, t, C) {
  const base = shotById("cx-bust")?.at ?? 166.4698;
  const u = t - base;

  STACK.forEach((s, i) => {
    const k = easeOut((t - (base + i * 0.08)) / 0.22);
    portrait(ctx, FORMS[i].key, s.x, s.y, s.h, { alpha: 0.92 * k });
    if (i > 0) {
      stroke(ctx, [[s.x - 150, s.y - s.h / 2 + 40], [s.x + 150, s.y - s.h / 2 + 40]], C.dim, 1, 0.7);
    }
    type(ctx, FORMS[i].label, s.x - 160, s.y + 10, 20, C.mid, "MV Mono");
  });

  for (const at of ATTACKS) {
    const age = u - at.cue;
    if (age < 0) continue;
    const a = STACK[at.from];
    const b = STACK[at.to];
    // the attack: sharp paper chips flying from one form to the next
    for (let j = 0; j < 10; j++) {
      const q = (age * 1.6 + j * 0.1) % 1;
      const px = Math.round(a.x + (b.x - a.x) * q + Math.sin(q * 9 + j) * 22);
      const py = Math.round(a.y + (b.y - a.y) * q + Math.cos(q * 7 + j) * 30);
      const sz = 8 + ((j * 3) % 8);
      ctx.fillStyle = j % 3 === 0 ? C.line : C.accent;
      ctx.fillRect(px, py, sz, sz);
      if (j % 3 === 0) {
        ctx.fillStyle = INK;
        ctx.fillRect(px + sz, py, 2, sz);
      }
    }
    // the hit: cracks, not a mosaic blur -- a broken plate, not a censored one
    if (age > 0.16) {
      const ck = clamp01((age - 0.16) / 0.45);
      const hx = b.x + ((at.from * 37) % 40) - 20;
      const hy = b.y - 40 + ((at.to * 53) % 60);
      for (let c = 0; c < 4; c++) {
        const ang = -1.9 + c * 0.85 + ((at.from + at.to) % 3) * 0.12;
        const len = (60 + c * 34) * ck;
        const pts = [[hx, hy]];
        for (let s = 1; s <= 4; s++) {
          const r = (len * s) / 4;
          const off = ((s % 2 ? 1 : -1) * 9 * s) / 4;
          pts.push([
            Math.round(hx + Math.cos(ang) * r - Math.sin(ang) * off),
            Math.round(hy + Math.sin(ang) * r + Math.cos(ang) * off),
          ]);
        }
        stroke(ctx, pts, C.line, 2, 0.95);
        stroke(ctx, pts.map(([px, py]) => [px + 2, py + 2]), INK, 1.2, 0.7);
        // a chip breaking off the end of the crack
        if (ck > 0.55) {
          const [ex, ey] = pts[pts.length - 1];
          const drift = Math.round((age - 0.16) * 90);
          ctx.fillStyle = C.line;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex + 14, ey + 4);
          ctx.lineTo(ex + 5, ey + 16);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = INK;
          ctx.fillRect(ex + 2 + drift, ey + 6 + drift * 0.6, 5, 5);
        }
      }
      // the hit itself: a short burst of paper rays, not a white blob
      if (ck < 0.6) {
        rays(ctx, hx, hy, 12, Math.round(30 + 90 * ck), 20, C.line, 0.7 * (1 - ck / 0.6), ck * 2, 2);
        landBurst(ctx, hx, hy, age - 0.16, C.line, 0.5, 0.45);
      }
    }
  }

  const bust = figureImages.bust;
  if (bust && bust.complete) {
    const art = scaledArt(bust, FRONT_BOX.w, FRONT_BOX.h);
    if (art) {
      const bob = Math.round(Math.sin(t * 0.7) * 3);
      layer(ctx, 1, () => ctx.drawImage(art, FRONT_BOX.left, FRONT_BOX.top + bob));
    }
  }

  const outCount = STACK.filter((_, i) => t >= base + i * 0.08 + 0.22).length;
  type(ctx, "FORMS OUT", PLATE.x + 26, 878, 13, C.mid, "MV Mono");
  counter(ctx, PLATE.x + 26, 892, outCount, { digits: 2, size: 26, colour: C.line });
  type(ctx, "REPLIES 0", PLATE.x + 190, 940, 14, C.mid, "MV Mono");
}

// ===========================================================================
// plate 03 -- the figure crumbles, the hand stays (076)
// ===========================================================================
const PALM = Object.freeze({ x: 1080, y: 540, w: 620 });
const HAND_AT = shotById("cx-hand")?.at ?? 170.1622;
const GHOST = Object.freeze({ x: 620, y: 560, h: 1020 });

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

function handHole(ctx, k) {
  const palm = ART.images.palm;
  if (!palm || !palm.complete || k <= 0.01) return;
  const s = 320 / PALM_BOX.w;
  const w = Math.round(palm.width * s);
  const h = Math.round(palm.height * s);
  const cx = 640;
  const cy = 640;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  const rim = silhouetteOf(palm, w, h, BLUE);
  const hole = silhouetteOf(palm, w, h, INK);
  if (!rim || !hole) return;
  ctx.save();
  ctx.globalAlpha *= clamp01(k);
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) ctx.drawImage(rim, x + dx, y + dy);
  ctx.drawImage(hole, x, y);
  ctx.restore();
  type(ctx, "the other hand", cx, cy + h / 2 + 30, 13, PAPER_DIM, "MV Mono", "center");
}

function bodyPalm(ctx, t, C) {
  handHole(ctx, easeOut((t - (HAND_AT + 0.5)) / 1.1));

  // 1. the figure with the palm out -- the same body the close-up is a detail of.
  //    It is the whole figure that breaks up; the palm is the part that survives.
  const reach = ART.images.reach;
  const breakK = easeOut((t - (HAND_AT + 0.15)) / 1.7);
  if (reach && reach.complete) {
    const s = 0.60;
    const w = Math.round(reach.width * s);
    const h = Math.round(reach.height * s);
    const ox = Math.round(PALM.x - (REACH_BOX.x + REACH_PALM.x) * s);
    const oy = Math.round(PALM.y - (REACH_BOX.y + REACH_PALM.y) * s);
    const art = scaledArt(reach, w, h);
    if (art) layer(ctx, 0.92 * (1 - breakK), () => ctx.drawImage(art, ox, oy));
    const mos = mosaicOf(reach, w, h, 22);
    if (mos && breakK > 0.02) {
      const R = Math.round(140 + 80 * (1 - breakK));
      // everything outside the palm goes to blocks; the palm's island shrinks
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 1920, 1080);
      ctx.arc(PALM.x, PALM.y, R, 0, Math.PI * 2, true);
      ctx.clip("evenodd");
      layer(ctx, clamp01(breakK * 1.8) * (1 - breakK), () => ctx.drawImage(mos.canvas, ox, oy));
      blockFall(ctx, mos, ox, oy, breakK, null, 0.95 * (1 - breakK), 90);
      blockFall(ctx, mos, ox, oy, breakK * 0.7, BLUE, 0.25 * (1 - breakK * 0.85), 22);
      ctx.restore();
      // the palm's rim, so the island reads as a cut-out rather than a hole
      ctx.save();
      ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.arc(PALM.x, PALM.y, R, 0, Math.PI * 2);
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 * breakK;
      ctx.stroke();
      ctx.restore();
    }
    codeFall(ctx, PALM.x - 420, PALM.y - 500, Math.max(0, t - (HAND_AT + 0.3)), C.line, 0.55);
    type(ctx, breakK < 0.5 ? "the figure is a print" : "the print is a figure", PALM.x - 380, PALM.y + 400, 13, C.mid, "MV Mono", "center");
  }

  // 2. the palm that is left: the close-up grows in and takes the frame over
  const palm = ART.images.palm;
  const palmIn = clamp01((breakK - 0.42) / 0.58);
  if (palm && palm.complete && palmIn > 0.01) {
    const size = Math.round(PALM.w * (0.62 + 0.38 * palmIn));
    const s = size / PALM_BOX.w;
    const w = Math.round(palm.width * s);
    const h = Math.round(palm.height * s);
    const ox = Math.round(PALM.x - (PALM_BOX.x + PALM_ANCHOR.x) * s);
    const oy = Math.round(PALM.y - (PALM_BOX.y + PALM_ANCHOR.y) * s);
    const art = scaledArt(palm, w, h);
    if (art) layer(ctx, palmIn, () => ctx.drawImage(art, ox, oy));
  }

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
    landBurst(ctx, PALM.x, PALM.y, snap * 0.5, C.accent, 0.7, 0.5);
  }

  const flipAt = Math.max(lineStart(112), HAND_AT) + 0.62;
  const flip = clamp01((t - flipAt) / 0.32);
  counter(ctx, PLATE.x + 26, 840, flip >= 0.5 ? 0 : 1, {
    digits: 3, size: 40, colour: PAPER, flip, oldValue: 1, label: "CONFIRMATIONS",
  });
  type(ctx, flip >= 0.5 ? "was 001" : "one confirmation", PLATE.x + 26, 928, 13, C.mid, "MV Mono");
  type(ctx, "CONTACT  /  OLD", PLATE.x + 26, 952, 13, C.mid, "MV Mono");

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
}

// ===========================================================================
// plate 03 -- the last press is a terminal that keeps failing (077)
// ===========================================================================
const TERM = Object.freeze({ x: 300, y: 236, w: 1320, h: 560 });
const CODE_LINES = Object.freeze([
  "const you = await load('you')",
  "me.bind({ heart: you })",
  "you.reply(me.lastMessage())",
  "me.expect(signal).then(keep)",
  "await wait(you, { forever: true })",
  "me.rebuild('only')",
  "return EXECUTION",
]);

function termLineCue(i) {
  return lineStart(114) + 0.12 + i * 0.11;
}

function bodyTerminal(ctx, t, C) {
  const base = lineStart(114);

  layer(ctx, 0.30, () => {
    clientWindow(ctx, { x: TERM.x - 60, y: TERM.y + 60, w: TERM.w + 120, h: TERM.h + 180 }, t, {
      tone: "chat", sideW: 0, threadTitle: "session · closed",
      chip: { text: "no cursor", on: false }, composer: false,
    });
  });

  rect(ctx, TERM.x, TERM.y, TERM.w, TERM.h, "rgba(4,18,32,0.92)", 4, "rgba(0,180,230,0.35)");
  stroke(ctx, [[TERM.x, TERM.y + 44], [TERM.x + TERM.w, TERM.y + 44]], C.dim, 1.5);
  type(ctx, "deepseek://execution", TERM.x + 18, TERM.y + 30, 14, C.mid, "MV Mono");
  type(ctx, "run 04 · 1 warning · 7 errors", TERM.x + TERM.w - 18, TERM.y + 30, 13, C.dim, "MV Mono", "right");

  // the command itself, huge, and it is the word on the plate
  layer(ctx, easeOut((t - base) / 0.18), () => {
    type(ctx, "> EXECUTION", TERM.x + 18, TERM.y + 132, 84, C.line, "MV Mono");
    type(ctx, "the same command, seven times · all seven failed",
      TERM.x + TERM.w - 18, TERM.y + 132, 14, C.dim, "MV Mono", "right");
  });
  stroke(ctx, [[TERM.x + 18, TERM.y + 156], [TERM.x + TERM.w - 18, TERM.y + 156]], C.dim, 1.5);

  CODE_LINES.forEach((text, i) => {
    const cue = termLineCue(i);
    const k = easeOut((t - cue) / 0.14);
    if (k <= 0) return;
    const ly = TERM.y + 216 + i * 62;
    const errAt = cue + 0.3;
    const crumble = clamp01((t - (errAt + 0.22)) / 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.rect(TERM.x + 10, ly - 34, TERM.w - 20, 58);
    ctx.clip();
    type(ctx, String(i + 1).padStart(2, "0"), TERM.x + 24, ly, 15, C.dim, "MV Mono");
    if (crumble < 0.02) {
      layer(ctx, k, () => type(ctx, text, TERM.x + 70, ly, 21, C.line, "MV Mono"));
    } else {
      for (let c = 0; c < text.length; c++) {
        const ch = text[c];
        const drop = Math.round(crumble * (40 + ((c * 37) % 90)));
        const drift = Math.round(crumble * (((c * 53) % 60) - 30));
        ctx.globalAlpha = 1 - crumble * 0.7;
        type(ctx, ch, TERM.x + 70 + c * 12 + drift, ly + drop, 21, c % 3 === 0 ? C.accent : C.line, "MV Mono");
      }
    }
    ctx.restore();
    if (t >= errAt) {
      type(ctx, "ERROR", TERM.x + TERM.w - 110, ly, 15, RED_EDGE, "MV Mono");
      stroke(ctx, [[TERM.x + 66, ly - 6], [TERM.x + 66 + Math.round(9.4 * text.length), ly - 6]], RED_EDGE, 1.5, 0.8);
    }
  });

  // the prompt stays at the bottom of the terminal: it will run it again
  const wordK = easeOut((t - base - 0.9) / 0.25);
  layer(ctx, wordK, () => {
    type(ctx, "> run again", TERM.x + 18, TERM.y + TERM.h - 22, 22, C.accent, "MV Mono");
    type(ctx, "7 / 7 failed", TERM.x + TERM.w - 18, TERM.y + TERM.h - 22, 14, RED_EDGE, "MV Mono", "right");
  });

  layer(ctx, 0.9, () => drawWhale(ctx, PLATE.x + PLATE.w - 150, PLATE.y + PLATE.h - 96, 46, { color: BRAND, strokeK: 1 }));
  type(ctx, "deepseek", PLATE.x + PLATE.w - 94, PLATE.y + PLATE.h - 96, 20, C.mid, "MV Sans", "right");
}

// ===========================================================================
// plate 04 -- empty grid, four lines, four impressions, then the god (078)
// ===========================================================================
const FALL_AT = shotById("cx-fall")?.at ?? 173.8547;
const GRID = Object.freeze({ cx: 960, cy: 560, from: 148, to: 64, dec: 20, hold: 0.55 });

const ARRIVALS = Object.freeze([
  { key: "bust", h: 640, cue: () => FALL_AT + 0.30 },
  { key: "man", h: 700, cue: () => lineStart(116) },
  { key: "cat", h: 740, cue: () => lineStart(116) + 0.80 },
  { key: "godPaper", h: 820, cue: () => lineStart(116) + 1.62 },
]);

const WAVES = Object.freeze([
  { p: [[-160, 300], [360, 300], [760, 360], [GRID.cx, GRID.cy]], cue: () => FALL_AT + 0.18 },
  { p: [[-160, 560], [380, 540], [740, 640], [GRID.cx, GRID.cy]], cue: () => lineStart(116) - 0.12 },
  { p: [[-160, 860], [340, 860], [800, 780], [GRID.cx, GRID.cy]], cue: () => lineStart(116) + 0.66 },
  { p: [[1920, 240], [1500, 320], [1180, 460], [GRID.cx, GRID.cy]], cue: () => lineStart(116) + 1.5 },
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
  const light = clamp01((t - (lineStart(116) + 1.62)) / 0.5);

  sunburst(ctx, GRID.cx, GRID.cy - 40, 260, 700, 36, C.accent, 0.12, -t * 0.06);
  rays(ctx, GRID.cx, GRID.cy - 40, 320, 820, 60, C.dim, 0.14, t * 0.03);

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

  WAVES.forEach((w) => {
    const prog = easeOut((t - w.cue()) / 0.42);
    if (prog <= 0) return;
    const n = Math.max(2, Math.round(prog * 64));
    const pts = [];
    for (let j = 0; j <= n; j++) {
      const [x, y] = cubicAt(w.p, (j / n) * prog);
      pts.push([Math.round(x), Math.round(y)]);
    }
    stroke(ctx, pts, C.accent, 6, 0.15);
    stroke(ctx, pts, C.line, 2);
    const head = pts[pts.length - 1];
    disc(ctx, head[0], head[1], 6, C.accent, 1);
  });

  ARRIVALS.forEach((a, i) => {
    const cue = a.cue();
    const p = clamp01((t - cue) / 0.3);
    if (p <= 0) return;
    const off = 10 - i * 2;
    portrait(ctx, a.key, GRID.cx, GRID.cy - (i === 3 ? 10 : 0), a.h, { alpha: 0.92 * easeOut(p) });
    if (i < 3) {
      stroke(ctx, [
        [GRID.cx - Math.round(a.h * 0.28) + off, GRID.cy - Math.round(a.h * 0.44)],
        [GRID.cx + Math.round(a.h * 0.28) + off, GRID.cy - Math.round(a.h * 0.44)],
      ], C.dim, 1, 0.6);
    }
    landBurst(ctx, GRID.cx, GRID.cy, t - cue, PAPER, 0.55, 0.4);
    if (p >= 1 && i === 3) {
      sunburst(ctx, GRID.cx, GRID.cy - 30, 120, 900, 48, PAPER, 0.12 * light, 0.08);
      rays(ctx, GRID.cx, GRID.cy - 30, 160, 980, 96, PAPER, 0.16 * light, 0.02, 2);
      sunburst(ctx, GRID.cx, GRID.cy - 30, 220, 760, 36, C.accent, 0.14 * light, -0.04);
      type(ctx, "the last form is a god", GRID.cx, 986, 14, PAPER_MID, "MV Mono", "center");
    }
  });

  if (light > 0.02) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(PLATE.x + 14, PLATE.y + 14, PLATE.w - 28, PLATE.h - 28);
    ctx.clip();
    for (let i = -reach; i <= reach; i++) {
      const x = GRID.cx + i * step;
      if (x > PLATE.x + 14 && x < PLATE.x + PLATE.w - 14) {
        stroke(ctx, [[x, PLATE.y + 14], [x, PLATE.y + PLATE.h - 14]],
          i % 4 === 0 ? "rgba(4,18,32,0.8)" : "rgba(4,18,32,0.4)", i % 4 === 0 ? 3 : 1.5);
      }
      const y = GRID.cy + i * step;
      if (y > PLATE.y + 14 && y < PLATE.y + PLATE.h - 14) {
        stroke(ctx, [[PLATE.x + 14, y], [PLATE.x + PLATE.w - 14, y]],
          i % 4 === 0 ? "rgba(4,18,32,0.8)" : "rgba(4,18,32,0.4)", i % 4 === 0 ? 3 : 1.5);
      }
    }
    ctx.restore();
  }

  const cell = { x: GRID.cx - 330, y: GRID.cy - 400, w: 660, h: 800 };
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

  type(ctx, "SAME GRID  /  CLOSING", PLATE.x + 26, 878, 13, C.mid, "MV Mono");
  type(ctx, `forms in ${ARRIVALS.filter((a) => t >= a.cue()).length} / 4`, PLATE.x + 26, 902, 13, C.dim, "MV Mono");
  type(ctx, "the last form is a god, and it is still inside", PLATE.x + 26, 926, 13, C.dim, "MV Mono");
}

// ===========================================================================
// shot wrappers
// ===========================================================================
function plateShot(n, body, opts = {}) {
  const { chip = false, dots = [], note = "", after = null } = opts;
  return (ctx, t, s) => {
    sheetPage(ctx, t, n, note);
    if (dots.length) dotScreen(ctx, dots);
    impressions(ctx, t, n, body);
    if (after) after(ctx, t, s);
    if (chip) tornEdge(ctx);
    return { phase: `plate-${n}`, plate: n };
  };
}

function barShot(n, body, prevBody, opts = {}) {
  const { note = "", dots = [] } = opts;
  return (ctx, t, s) => {
    sheetPage(ctx, t, n, note);
    if (dots.length) dotScreen(ctx, dots);
    if (prevBody) layer(ctx, 0.12, () => {
      ctx.translate(14, -10);
      prevBody(ctx, t, CYAN);
    });
    if (n === 2) {
      body(ctx, t, CYAN); // one syllable, one form, then four corners
    } else if (n === 3) {
      if (t > lineStart(108) + 0.9) layer(ctx, 0.45, () => cornerForms(ctx, t, CYAN));
    }
    if (n >= 4) {
      // the last press is not a title bar any more: the sheet runs the command itself
      type(ctx, "title 04 of 04", BAR.x, BAR.y - 30, 14, PAPER_DIM, "MV Mono");
      type(ctx, "sheet jammed", BAR.x + BAR.w, BAR.y - 30, 14, PAPER_DIM, "MV Mono", "right");
      body(ctx, t, KEY);
    } else {
      bodyBar(ctx, t, KEY, n);
    }
    return { phase: `bar-${n}`, plate: n };
  };
}

// bloom only: the split/white-wash grade variants failed the seek read-back
const sectionGrade = (glow = 0.46) => ({ glow, aberration: 0, flash: 0, camera: { shakeX: 0, shakeY: 0 } });

export const SECTION12_RENDER = Object.freeze({
  "cx-eye": (ctx, t, s) => {
    const out = plateShot(1, bodyEye, {
      note: "plate 01 · stimulations · everything out, nothing back",
      dots: [
        { x: 40, y: 40, w: 1520, h: 1000, alpha: 0.10 },
        { x: 900, y: 480, w: 900, h: 120, alpha: 0.06 },
      ],
      after: (c, tt) => lyricCard(c, tt),
    });
    return { ...out(ctx, t, s), grade: sectionGrade(0.5) };
  },
  "cx-kw1": (ctx, t, s) => {
    const out = barShot(2, slamForms, bodyEye, { note: "title bar · first press · one syllable, one form" });
    return { ...out(ctx, t, s), grade: sectionGrade(0.48) };
  },
  "cx-bust": (ctx, t, s) => {
    const out = plateShot(2, bodyForms, {
      note: "plate 02 · satisfaction · four forms sent, none returned",
      dots: [{ x: 150, y: 590, w: 520, h: 300, alpha: 0.09 }],
    });
    return { ...out(ctx, t, s), grade: sectionGrade(0.42) };
  },
  "cx-kw2": (ctx, t, s) => {
    const out = barShot(3, slamForms, bodyForms, { note: "title bar · second press" });
    return { ...out(ctx, t, s), grade: sectionGrade(0.48) };
  },
  "cx-hand": (ctx, t, s) => {
    const out = plateShot(3, bodyPalm, {
      chip: true,
      note: "plate 03 · execution · the figure breaks, the hand stays",
      dots: [
        { x: 120, y: 76, w: 1680, h: 930, alpha: 0.04 },
        { x: 1180, y: 700, w: 540, h: 290, alpha: 0.10 },
      ],
    });
    return { ...out(ctx, t, s), grade: sectionGrade(0.42) };
  },
  "cx-kw3": (ctx, t, s) => {
    const out = barShot(4, bodyTerminal, bodyPalm, { note: "title bar · third press · the sheet runs itself" });
    return { ...out(ctx, t, s), grade: sectionGrade(0.5) };
  },
  "cx-fall": (ctx, t, s) => {
    const out = plateShot(4, bodyGod, {
      note: "plate 04 · simulation · four lines in, one god out",
      dots: [{ x: PLATE.x + 14, y: PLATE.y + 14, w: PLATE.w - 28, h: PLATE.h - 28, alpha: 0.04 }],
    });
    return { ...out(ctx, t, s), grade: sectionGrade(0.42) };
  },
});

export const SECTION12_IMPLEMENTED = Object.freeze(Object.keys(SECTION12_RENDER));
