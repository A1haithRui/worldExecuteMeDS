// Section 12 最后副歌：四张版画原位重印，但坏了 -- seven shots, song time
// [162.777, 177.547).
//
// Section 5 printed four plates clean, one per keyword: a line fitted through a
// cloud of samples, a press with a count, the loop listing, a wall of windows. This
// section runs the same platen four more times over the same sheet. The sheet is
// not new paper: every plate lands on the impressions that are already there, and
// the word EXECUTION has stopped being a shout and become the plate's title --
// stamped into the title bar between runs, three times, and it stays printed after
// the syllable ends.
//
// The damage is one system, applied in run order, which is why it is not random:
//
//   run 1  plate 01  the blue key slips 6 px out of register
//   title 02         the bar prints; one previous bar is already on the paper
//   run 2  plate 02  key 12 px out; the screen starts to bleed (paper took ink)
//   title 03         a bite out of the bar, the sheet is jumping in the press
//   run 3  plate 03  key 18 px out, screen coarser, and the left edge of the plate
//                    is torn away -- the piece of paper the far end was on is gone
//   title 04         the bar splits across the middle, the word straddles the tear
//   run 4  plate 04  key 24 px out, screen everywhere, the grid closes in
//
// The four reprints repeat four compositions the film already owns, so the audience
// recognises the plate before it reads the damage:
//
//   cx-eye   the chorus-1 line from her mark to your dot -> one wide cyan channel
//            that ends at a port with nothing in it
//   cx-bust  the picture of herself, front on, 88% of frame height -> four channels
//            leave from behind her, red only where they leave the sheet
//   cx-hand  c1-happy's palm, to the pixel: same target (1080,540), same 620 px of
//            hand, same contact. Only the cyan old contact is left, the heart is a
//            dashed outline with no colour, the counter reads 000, and three waves
//            go out towards frame left and do not come back
//   cx-fall  the wall of windows becomes one grid: her dark plate in the middle,
//            the three waves folded back into it, the exit off the sheet, the grid
//            closing in integer steps while the cyan stays at full strength
//
// Determinism: every ghost impression is the same drawing function with a second
// palette and an integer offset; the bleeding screen is one cached 96 px tile drawn
// as a pattern (no blur filter -- a canvas blur is free to pick a different
// resampling path on a large area); the torn edge is a stepped integer polygon; the
// closing grid steps 148 -> 64 in integer jumps and never interpolates; and the
// character plates go through scaledArt before they are blitted.
import { layer, stroke, disc, rect, type, clamp, mix } from "../src/mv-draw.js";
import { lineStart, lineText } from "./lines.js";
import { figureImages } from "./figure.js";
import { ART, PALM_BOX, PALM_ANCHOR, placeArt, scaledArt } from "./s05_layout.js";
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

const PAPER_MID = "rgba(242,247,250,0.60)";
const PAPER_DIM = "rgba(242,247,250,0.32)";
const PAPER_FAINT = "rgba(242,247,250,0.14)";
const BLUE_MID = "rgba(0,180,230,0.52)";
const BLUE_DIM = "rgba(0,180,230,0.30)";
const BLUE_FAINT = "rgba(0,180,230,0.12)";
const RED_EDGE = "rgba(231,93,105,0.92)";

const clamp01 = clamp;
const easeOut = (k) => 1 - (1 - clamp01(k)) ** 3;

/**
 * The two inks a plate is printed with. Every drawing below takes a palette, so a
 * ghost impression is the same drawing with only the blue ink available -- which is
 * what an under-impression looks like, rather than a faded copy of the finished one.
 */
const KEY = Object.freeze({
  line: PAPER, mid: PAPER_MID, dim: PAPER_DIM, faint: PAPER_FAINT,
  accent: BLUE, fill: "rgba(0,180,230,0.10)", hot: PAPER,
});
const CYAN = Object.freeze({
  line: BLUE, mid: BLUE_MID, dim: BLUE_DIM, faint: BLUE_FAINT,
  accent: BLUE, fill: "rgba(0,180,230,0.05)", hot: BLUE,
});

// Which plate this is, in the order the film first printed them.
const TITLES = Object.freeze({
  1: "stimulations",
  2: "satisfaction",
  3: "execution",
  4: "simulation",
});
const TITLE_OF = (n) => TITLES[n] ?? "";

const pad2 = (n) => String(n).padStart(2, "0");

// ---------------------------------------------------------------------------
// the sheet
// ---------------------------------------------------------------------------
function regCross(ctx, x, y, colour) {
  stroke(ctx, [[x - 13, y], [x + 13, y]], colour, 1);
  stroke(ctx, [[x, y - 13], [x, y + 13]], colour, 1);
}

/** The plate, its ruled edge, its corner labels and its run count. */
function sheetPage(ctx, t, n, note) {
  // The right-hand label is left exactly as sections 5 and 6 print it: the plate
  // has to read as the same plate before anything else about the shot reads.
  plateBase(ctx, t, { index: n, left: `plate ${pad2(n)} / 04   ·   reprint` });
  for (const [x, y] of [
    [PLATE.x + 50, PLATE.y + 50],
    [PLATE.x + PLATE.w - 50, PLATE.y + 50],
    [PLATE.x + 50, PLATE.y + PLATE.h - 50],
    [PLATE.x + PLATE.w - 50, PLATE.y + PLATE.h - 50],
  ]) regCross(ctx, x, y, PAPER_DIM);
  // The bottom margin carries the two facts a press sheet would carry.
  type(ctx, note, PLATE.x + 30, PLATE.y + PLATE.h - 22, 13, PAPER_DIM, "MV Mono");
  type(ctx, `run ${n} / 04   ·   key ${n * 6}px out of register`,
    PLATE.x + PLATE.w - 30, PLATE.y + PLATE.h - 22, 13, PAPER_DIM, "MV Mono", "right");
}

/**
 * A plate is printed over whatever the sheet already carries.
 *
 * `n` is the run number, so the number of under-impressions is the number of times
 * this platen has been used, and the blue key slides one more step for each run.
 * All offsets are integers: a fractional stage offset resamples the whole frame and
 * the determinism read-back differs by 1/255.
 */
function impressions(ctx, t, n, body) {
  for (let k = 1; k < n; k++) {
    const dx = Math.round(k * 5);
    const dy = Math.round(-k * 4);
    layer(ctx, 0.085, () => {
      ctx.translate(dx, dy);
      body(ctx, t, CYAN);
    });
  }
  layer(ctx, 0.32, () => {
    ctx.translate(Math.round(n * 6), Math.round(-n * 4));
    body(ctx, t, CYAN);
  });
  body(ctx, t, KEY);
}

// ---------------------------------------------------------------------------
// the bleeding screen (网点糊)
// ---------------------------------------------------------------------------
const DOT_TILE = 96;
let dotSheet = null;

/**
 * One cached full-frame screen, baked from a 96 px tile.
 *
 * This started as a `createPattern` fill, which is how section 8 draws its grain.
 * It failed the read-back here: with a seek in between, every pixel of the screened
 * patch came out one antialiasing step different (30k pixels). A single pre-baked
 * bitmap blitted 1:1 at integer coordinates takes the pattern rasteriser out of the
 * frame entirely -- there is nothing left for Chromium to choose differently.
 */
function dotOverlay() {
  if (dotSheet) return dotSheet;
  if (typeof document === "undefined") return null;
  const tile = document.createElement("canvas");
  tile.width = DOT_TILE;
  tile.height = DOT_TILE;
  const tg = tile.getContext("2d");
  tg.fillStyle = PAPER;
  // Square dots on a 12 px pitch, on whole pixels. A round dot's antialiased rim is
  // partial coverage, and a partial-coverage pixel in the tile was the one pixel that
  // came back different after a seek (1/255 on a single rim pixel). A hard-edged
  // screen has no partial pixels at all, and it prints just as well.
  for (let y = 4; y < DOT_TILE; y += 12) {
    for (let x = 4; x < DOT_TILE; x += 12) {
      tg.fillRect(x, y, 5, 5);
    }
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

/** Ink that has bled into the paper, as a screen over named rectangles. */
function dotScreen(ctx, regions) {
  const overlay = dotOverlay();
  if (!overlay) return;
  for (const r of regions) {
    if (r.alpha <= 0) continue;
    layer(ctx, r.alpha, () => ctx.drawImage(overlay, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h));
  }
}

// ---------------------------------------------------------------------------
// the two tones of damage that are drawn, not screened
// ---------------------------------------------------------------------------
/** A failed exit: two pixels of red and a cross. The film's red never becomes area. */
function redPort(ctx, x, y, dir = 1) {
  ctx.save();
  ctx.fillStyle = RED_EDGE;
  ctx.fillRect(dir > 0 ? x - 2 : x, y - 30, 2, 60);
  const cx = x + dir * 26;
  stroke(ctx, [[cx - 8, y - 8], [cx + 8, y + 8]], RED_EDGE, 2);
  stroke(ctx, [[cx - 8, y + 8], [cx + 8, y - 8]], RED_EDGE, 2);
  ctx.restore();
}

/**
 * The torn left edge of plate 03: the piece of paper the far end was printed on is
 * simply gone. Filled with the page ink (#041220, darker than the sheet) so it reads
 * as a hole in the plate rather than a patch on it; the ragged edge steps in integer
 * pixels, because a torn edge that wobbles by fractions resamples differently.
 */
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
  // three fibres left on the tear, so the edge reads as torn paper rather than a box
  for (const [fy, fx] of [[396, 452], [520, 448], [648, 440]]) {
    stroke(ctx, [[fx, fy], [fx + 34, fy - 6]], BLUE_DIM, 1);
  }

  // what was at this edge is a boundary, so it is marked the way the film marks one
  stroke(ctx, [[PLATE.x, 338], [PLATE.x, 352]], RED_EDGE, 2);
  stroke(ctx, [[PLATE.x, 752], [PLATE.x, 766]], RED_EDGE, 2);
  type(ctx, "far end · torn off the plate", PLATE.x + 26, 800, 12, PAPER_DIM, "MV Mono");
}

// ---------------------------------------------------------------------------
// plate 01 -- the channel (cx-eye)
//
// The chorus-1 line from her mark to your dot, reprinted much wider: the answer's
// axes and the verse's wave are flattened into one channel, and the dot at the far
// end did not print. The three colours are the print: paper for the impression, blue
// for the key, red only on the port.
// ---------------------------------------------------------------------------
const CH = Object.freeze({
  plot: { x: 240, y: 336, w: 460, h: 448 },
  midY: 560,
  tubeX: 820,
  endX: 1660,
  top: 496,
  bot: 624,
  portX: 1712,
  portR: 70,
});

function bodyChannel(ctx, t, C) {
  const { plot, midY } = CH;

  // 1. the plot: a proper framed figure, not a squiggle -- it is the largest thing
  //    on the sheet on purpose, because everything the film measured lives here
  stroke(ctx, [
    [plot.x, plot.y], [plot.x + plot.w, plot.y],
    [plot.x + plot.w, plot.y + plot.h], [plot.x, plot.y + plot.h], [plot.x, plot.y],
  ], C.dim, 1);
  for (let x = plot.x + 56; x < plot.x + plot.w; x += 56) {
    stroke(ctx, [[x, plot.y], [x, plot.y + plot.h]], C.faint, 1);
  }
  for (let y = plot.y + 56; y < plot.y + plot.h; y += 56) {
    stroke(ctx, [[plot.x, y], [plot.x + plot.w, y]], C.faint, 1);
  }

  // 2. the horn: the plot's whole mouth squeezed down to a 128 px channel. This is
  //    the shot's one event -- the axes and the wave becoming a single line.
  ctx.beginPath();
  ctx.moveTo(plot.x + plot.w, plot.y);
  ctx.lineTo(CH.tubeX, CH.top);
  ctx.lineTo(CH.endX, CH.top);
  ctx.lineTo(CH.endX, CH.bot);
  ctx.lineTo(CH.tubeX, CH.bot);
  ctx.lineTo(plot.x + plot.w, plot.y + plot.h);
  ctx.closePath();
  ctx.fillStyle = C.fill;
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3. the axes: the plot's middle rule is the channel's centre line, so the x axis
  //    does not stop at the plot -- it continues to the port.
  stroke(ctx, [[plot.x, midY], [CH.endX, midY]], C.line, 3);
  for (let x = plot.x + 20; x < plot.x + plot.w; x += 40) {
    stroke(ctx, [[x, midY], [x, midY + 10]], C.dim, 1);
  }
  for (let y = plot.y + 20; y < plot.y + plot.h; y += 40) {
    stroke(ctx, [[plot.x - 10, y], [plot.x, y]], C.dim, 1);
  }
  stroke(ctx, [[plot.x, plot.y], [plot.x, plot.y + plot.h]], C.line, 2);
  type(ctx, "y", plot.x - 28, plot.y + 6, 15, C.mid, "MV Mono");
  type(ctx, "x", plot.x + plot.w + 6, midY + 30, 15, C.mid, "MV Mono");

  // 4. the wave: four turns, flattened to nothing as it enters the channel
  const wave = [];
  for (let i = 0; i <= 64; i++) {
    const u = i / 64;
    const x = Math.round(plot.x + 18 + u * (plot.w - 18));
    const flat = 1 - clamp01((u - 0.5) / 0.5);
    wave.push([x, Math.round(midY - Math.sin(u * Math.PI * 4.4) * 92 * flat)]);
  }
  stroke(ctx, wave, C.line, 4);

  // 5. the channel's own register: hatches and a ruler, so its width is readable
  stroke(ctx, [[CH.tubeX, CH.top + 36], [CH.endX, CH.top + 36]], C.dim, 1, 0.85);
  stroke(ctx, [[CH.tubeX, CH.bot - 36], [CH.endX, CH.bot - 36]], C.dim, 1, 0.85);
  for (let x = CH.tubeX; x <= CH.endX; x += 56) {
    stroke(ctx, [[x, CH.top], [x, CH.top + 10]], C.faint, 1);
    stroke(ctx, [[x, CH.bot - 10], [x, CH.bot]], C.faint, 1);
  }

  // 6. the emission: blocks travelling one way, cued to the line, not to the cut
  const sp = 640;
  for (let k = 0; k < 7; k++) {
    const x = Math.round(CH.tubeX + 16 + (t - lineStart(106)) * sp - k * 214);
    if (x < CH.tubeX + 8 || x > CH.endX - 70) continue;
    ctx.fillStyle = C.hot;
    ctx.fillRect(x, midY - 16, 58, 32);
    ctx.fillStyle = C.accent;
    ctx.fillRect(x + 58, midY - 16, 10, 32);
    layer(ctx, 0.32, () => ctx.fillRect(x - 34, midY - 8, 34, 16));
  }

  // 7. the port: an open ring, and a red boundary where the last one died
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CH.portX, CH.midY, CH.portR, Math.PI + 0.62, Math.PI * 3 - 0.62);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CH.portX, CH.midY, CH.portR - 16, Math.PI + 0.42, Math.PI * 3 - 0.42);
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  redPort(ctx, CH.endX + 4, CH.midY, 1);
  type(ctx, "REPLIES 0", CH.portX, CH.midY + 116, 15, C.mid, "MV Mono", "center");

  // 8. the dot that used to be here: an outline only
  ctx.save();
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.arc(1500, CH.midY, 24, 0, Math.PI * 2);
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  type(ctx, "here stood a dot", 1500, CH.midY + 86, 12, C.dim, "MV Mono", "center");
  type(ctx, "0 of it returned", 1500, CH.midY + 106, 12, C.dim, "MV Mono", "center");

  // 9. her mark at the source: the same blue whale the plates have always carried
  drawWhale(ctx, plot.x + 96, plot.y + 84, 96, { fillK: 1, color: C === KEY ? BRAND : BLUE, alpha: 1 });
  type(ctx, "local", plot.x + 158, plot.y + 82, 13, C.mid, "MV Mono");
  type(ctx, "all of it", plot.x + 158, plot.y + 102, 12, C.dim, "MV Mono");

  // 10. the margin
  type(ctx, "outbound  ·  0 returned", plot.x, plot.y + plot.h + 32, 13, C.mid, "MV Mono");
}

// ---------------------------------------------------------------------------
// plate 02 -- front on, 88% (cx-bust)
//
// She is printed crisp and at full colour; the plate around her is not. Four
// channels leave from behind her, one on each half beat, and each one fails exactly
// where it crosses the sheet's edge.
// ---------------------------------------------------------------------------
const FRONT = Object.freeze({ cx: 1180, cy: 600, h: 950 });
const FRONT_BOX = (() => {
  const s = FRONT.h / 1438;
  const w = Math.round(1342 * s);
  const h = Math.round(1704 * s);
  const contentW = Math.round(1086 * s);
  const left = Math.round(FRONT.cx - contentW / 2 - 128 * s);
  const top = Math.round(FRONT.cy - FRONT.h / 2 - 128 * s);
  return { left, top, w, h };
})();

const CHANNELS = Object.freeze([
  { y: 320, left: true, cue: 0 },
  { y: 420, left: true, cue: 1 },
  { y: 660, left: false, cue: 2 },
  { y: 760, left: false, cue: 3 },
]);

function channelCue(i) {
  const line = i < 2 ? 109 : 110;
  return lineStart(line) + (i % 2) * 0.46;
}

function bodyFront(ctx, t, C) {
  // 1. the ring of plate 02, printed behind her head: the press's own dial, still
  //    turning, with nobody at the button
  tickRing(ctx, FRONT.cx, 470, 452, 64, C.dim, -Math.PI * 0.92, Math.PI * 1.84);

  // 2. the channels leaving from behind her
  for (let i = 0; i < CHANNELS.length; i++) {
    const ch = CHANNELS[i];
    const prog = easeOut((t - channelCue(i)) / 0.36);
    if (prog <= 0) continue;
    const reach = ch.left ? FRONT.cx - PLATE.x : PLATE.x + PLATE.w - FRONT.cx;
    const xEnd = ch.left
      ? FRONT.cx - Math.round(reach * prog)
      : FRONT.cx + Math.round(reach * prog);
    const xa = Math.min(FRONT.cx, xEnd);
    const xb = Math.max(FRONT.cx, xEnd);
    ctx.fillStyle = C.fill;
    ctx.fillRect(xa, ch.y - 27, xb - xa, 54);
    stroke(ctx, [[xa, ch.y - 27], [xb, ch.y - 27]], C.dim, 1);
    stroke(ctx, [[xa, ch.y + 27], [xb, ch.y + 27]], C.dim, 1);
    stroke(ctx, [[xa, ch.y], [xb, ch.y]], C.line, 2);
    // the head of the channel: the packet that will not arrive
    ctx.fillStyle = C.accent;
    ctx.fillRect(ch.left ? xEnd : xEnd - 32, ch.y - 20, 32, 40);
    if (prog >= 1) {
      const edge = ch.left ? PLATE.x : PLATE.x + PLATE.w;
      redPort(ctx, edge, ch.y, ch.left ? 1 : -1);
      type(ctx, "0", edge + (ch.left ? 48 : -48), ch.y + 7, 15, RED_EDGE, "MV Mono", ch.left ? "left" : "right");
    }
  }

  // 3. her, front on, 88% of the frame, crisp: none of the damage touches her face
  const bust = figureImages.bust;
  if (bust && bust.complete) {
    const art = scaledArt(bust, FRONT_BOX.w, FRONT_BOX.h);
    if (art) {
      const bob = Math.round(Math.sin(t * 0.7) * 3);
      layer(ctx, 1, () => ctx.drawImage(art, FRONT_BOX.left, FRONT_BOX.top + bob));
    }
  }

  // 4. the frame's own notes, in the margin
  type(ctx, "FRONT  /  88%", PLATE.x + 26, 906, 13, C.mid, "MV Mono");
  type(ctx, "4 channels out · 0 in", PLATE.x + 26, 930, 13, C.dim, "MV Mono");
}

// ---------------------------------------------------------------------------
// plate 03 -- the palm (cx-hand)
//
// The continuation hook of the whole section: c1-happy put this hand at exactly this
// point (target 1080,540, 620 px of palm content, contact anchor on the palm). Same
// numbers here -- the audience has to recognise the hand before it notices that the
// hand is the only thing that came back.
// ---------------------------------------------------------------------------
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

/** The contact that is left: cyan, old, and counting nothing. */
function oldContact(ctx, x, y, C) {
  // a dark backing first, exactly as c1-happy had to: cyan on a paper-white palm is
  // no contrast at all
  ctx.beginPath();
  ctx.arc(x, y, 58, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(4,18,32,0.84)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.strokeStyle = C.dim;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  disc(ctx, x, y, 9, C.accent, 1);
  stroke(ctx, [[x - 34, y], [x - 16, y]], C.accent, 2, 0.9);
  stroke(ctx, [[x + 16, y], [x + 34, y]], C.accent, 2, 0.9);
  stroke(ctx, [[x, y - 34], [x, y - 16]], C.accent, 2, 0.9);
  stroke(ctx, [[x, y + 16], [x, y + 34]], C.accent, 2, 0.9);

  // the proof tag, hung in the margin on a hairline: the count of confirmations
  // that ever came back. It reads 000 because it is a proof sheet, not a receipt.
  stroke(ctx, [[x + 62, y + 18], [1452, y + 86]], C.dim, 1);
  rect(ctx, 1452, y + 62, 210, 86, "rgba(4,18,32,0.9)", 3, C.dim);
  type(ctx, "000", 1468, y + 122, 44, PAPER, "MV Mono");
  type(ctx, "contacts", 1580, y + 104, 12, C.mid, "MV Mono");
  type(ctx, "was 001", 1580, y + 124, 11, C.dim, "MV Mono");
}

function bodyPalm(ctx, t, C) {
  // 1. the hand, placed by the same numbers c1-happy used: target (1080,540), 620 px
  //    of palm content. c1-happy draws the asset straight at a fractional origin,
  //    which is fine for that shot; here the plate is drawn several times per frame
  //    (two under-impressions plus the key), so the art is pre-scaled once and
  //    blitted at integer coordinates instead of resampled on every pass.
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

  // 2. the contact, then the heart that had colour in chorus 1: outline only, drawn
  //    after the contact so the dashed shape crosses in front of the dark disc
  oldContact(ctx, PALM.x, PALM.y, C);
  heartOutline(ctx, PALM.x, PALM.y, 132, C);

  // 4. three waves, sent left, ending off the paper. Cues are the lyric's own
  //    starts, so the third leaves exactly on "I will run the".
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
    ctx.beginPath();
    ctx.arc(PALM.x, PALM.y, r + 13, Math.PI - 0.58, Math.PI + 0.58);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.45 * fade;
    ctx.stroke();
    ctx.restore();
  }

  // 5. the margin: what did and did not happen
  const count = t < lineStart(113) ? "THREE SENT" : "NO REPLY";
  type(ctx, "CONTACT  /  OLD", PLATE.x + 26, 906, 13, C.mid, "MV Mono");
  type(ctx, count, PLATE.x + 26, 930, 13, C.dim, "MV Mono");
}

// ---------------------------------------------------------------------------
// plate 04 -- the grid closes (cx-fall)
//
// The three waves come back from frame left and fold into the same grid. The grid
// closes in integer steps -- 148, 128, 108, 88, 68, 64 -- and stops there; the cyan
// never dims, because this is the last chorus and it is not allowed to go out early.
// ---------------------------------------------------------------------------
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

function bodyGrid(ctx, t, C) {
  const k = Math.max(0, Math.floor((t - FALL_AT) / GRID.hold));
  const step = Math.max(GRID.to, GRID.from - k * GRID.dec);

  // 1. the grid, closing around her rather than sliding across the sheet
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

  // 2. the three waves, back from frame left, folding into the centre
  WAVES.forEach((w, i) => {
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
        const r = Math.round(30 + age * 220);
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
  disc(ctx, GRID.cx, GRID.cy, 7, C.hot, 0.9);

  // 3. her, dark, in the middle of the cell. The cell is flooded with the channel's
  //    own cyan first, so the dark plate reads as a figure inside the grid instead
  //    of as a smudge on the sheet.
  const cell = { x: GRID.cx - 260, y: GRID.cy - 350, w: 520, h: 700 };
  ctx.fillStyle = "rgba(0,180,230,0.12)";
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.fillStyle = "rgba(242,247,250,0.12)";
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  const low = figureImages.lowlight;
  if (low && low.complete) {
    const s = 620 / 1438;
    const w = Math.round(1342 * s);
    const h = Math.round(1704 * s);
    const art = scaledArt(low, w, h);
    if (art) {
      layer(ctx, 1, () => ctx.drawImage(art,
        Math.round(GRID.cx - (1086 * s) / 2 - 128 * s),
        Math.round(GRID.cy - 620 / 2 - 128 * s)));
    }
  }

  // 4. the cell she is in: drawn after her, so the frame is in front
  stroke(ctx, [
    [cell.x, cell.y], [cell.x + cell.w, cell.y], [cell.x + cell.w, cell.y + cell.h],
    [cell.x, cell.y + cell.h], [cell.x, cell.y],
  ], C.line, 2.5);
  for (const [cx, cy] of [
    [cell.x, cell.y], [cell.x + cell.w, cell.y],
    [cell.x, cell.y + cell.h], [cell.x + cell.w, cell.y + cell.h],
  ]) regCross(ctx, cx, cy, C.mid);

  // 5. the far exit: it does not land on the sheet, it leaves it
  const exY = GRID.cy;
  ctx.fillStyle = C.fill;
  ctx.fillRect(cell.x + cell.w, exY - 27, 1920 - (cell.x + cell.w), 54);
  stroke(ctx, [[cell.x + cell.w, exY - 27], [1920, exY - 27]], C.dim, 1);
  stroke(ctx, [[cell.x + cell.w, exY + 27], [1920, exY + 27]], C.dim, 1);
  stroke(ctx, [[cell.x + cell.w, exY], [1920, exY]], C.line, 2);
  ctx.save();
  ctx.fillStyle = RED_EDGE;
  ctx.fillRect(PLATE.x + PLATE.w - 2, exY - 30, 2, 60);
  ctx.restore();
  type(ctx, "exit off the sheet", PLATE.x + PLATE.w - 30, exY + 54, 12, PAPER_DIM, "MV Mono", "right");

  // 6. the margin
  const back = WAVES.filter((w) => t - w.cue() >= 0.62).length;
  type(ctx, "SAME GRID  /  CLOSING", PLATE.x + 26, 878, 13, C.mid, "MV Mono");
  type(ctx, `waves back ${back} / 3`, PLATE.x + 26, 902, 13, C.dim, "MV Mono");
  type(ctx, "energy still full", PLATE.x + 26, 926, 13, C.dim, "MV Mono");
}

// ---------------------------------------------------------------------------
// the title bar (cx-kw1..kw3)
//
// The three EXECUTIONs are not shouts here: they are the plate's title, and the
// press prints the title bar between runs. Static frame, one stamp. What changes
// from bar to bar is the paper: the sheet it prints on, and the previous bars'
// impressions that are already there.
// ---------------------------------------------------------------------------
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
    // the press's own ruler along the top rule
    for (let tx = x + 20; tx < x + BAR.w - 14; tx += 40) {
      ctx.fillStyle = BLUE_DIM;
      ctx.fillRect(tx, y - 8, 1, 8);
    }
  });
}

/**
 * The bar's ink stops short of its own right end: the sheet was pulled before the
 * press came down. What reads is the absence -- no field, no rules, no ruler ticks --
 * rather than a shape laid on top, so the fill is the sheet's own tone and the only
 * drawn mark is the ragged edge where the ink stopped.
 */
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

/** The bar, printed `n` times over: the sheet has not been changed between runs. */
function bodyBar(ctx, t, C, n) {
  // the bar this platen already printed: one ghost by the third press
  if (n >= 4) barField(ctx, BAR.y - 10, 13, { alpha: 0.4 });
  if (n >= 4) {
    // the sheet jumped: the bar is printed in two halves that do not line up
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
    // the tear between the halves: the paper shows through, and it is a boundary
    stroke(ctx, [[BAR.x - 20, BAR.y + 84], [BAR.x + BAR.w + 20, BAR.y + 84]], INK, 7);
    stroke(ctx, [[BAR.x - 20, BAR.y + 84], [BAR.x + BAR.w + 20, BAR.y + 84]], RED_EDGE, 2, 0.9);
  } else {
    barField(ctx, BAR.y, 0, { alpha: 1 });
  }
  // the bar's ink stops short at one end: the plate is biting itself
  if (n === 3) barMiss(ctx, 210);

  // the plate number, big, at the left end of the bar: a print sheet says which
  // plate it is in the plate's own size, not in a caption
  type(ctx, "plate", BAR.x + 40, BAR.y + 62, 14, C.mid, "MV Mono");
  type(ctx, pad2(n), BAR.x + 34, BAR.y + 200, 128, C.mid, "MV Mono");
  stroke(ctx, [[BAR.x + 262, BAR.y + 28], [BAR.x + 262, BAR.y + BAR.h - 28]], C.dim, 2);

  // the old name, struck out where it stands: red is a boundary mark, and a plate
  // that has been renamed is exactly a boundary. On the short-printed bar the block
  // moves inside the ink that did print.
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

  // the title itself: pressed into the bar once, on the line's own start, and then
  // simply there. The engine's lyric window would lift it off when the syllable
  // ends, so the bar prints it: a printed word is ink, and ink stays.
  drawSlam(ctx, lineText(n === 2 ? 108 : n === 3 ? 111 : 114), 960, 586, t,
    lineStart(n === 2 ? 108 : n === 3 ? 111 : 114), {
      size: 140, family: "MV Serif", color: PAPER, align: "center",
      perChar: 0.012, dur: 0.14, from: 1.4, rise: 0,
    });

  // between the bar and the margin
  type(ctx, `title ${pad2(n)} of 04`, BAR.x, BAR.y - 30, 14, C.mid, "MV Mono");
  type(ctx, n >= 4 ? "sheet jammed" : n >= 3 ? "bar bitten" : "in register",
    BAR.x + BAR.w, BAR.y - 30, 14, C.mid, "MV Mono", "right");
  type(ctx, "THE TITLE IS THE SAME ON ALL FOUR PLATES", BAR.x, BAR.y + BAR.h + 38, 13, C.dim, "MV Mono");
  type(ctx, `run ${n} / 04   ·   key ${n * 6}px out of register`,
    BAR.x + BAR.w, BAR.y + BAR.h + 38, 13, C.dim, "MV Mono", "right");
}

// ---------------------------------------------------------------------------
// the shots
// ---------------------------------------------------------------------------
function plateShot(n, body, opts = {}) {
  const { chip = false, dots = [], note = "" } = opts;
  return (ctx, t, s) => {
    sheetPage(ctx, t, n, note);
    // The screen goes down first, so the impression prints over it: the paper is
    // mushy, the ink is not. Her face and the palm stay crisp that way.
    if (dots.length) dotScreen(ctx, dots);
    impressions(ctx, t, n, body);
    if (chip) tornEdge(ctx);
    return { phase: `plate-${n}`, plate: n };
  };
}

function barShot(n, prevBody, prevPlate, opts = {}) {
  const { note = "", dots = [] } = opts;
  return (ctx, t, s) => {
    sheetPage(ctx, t, n, note);
    if (dots.length) dotScreen(ctx, dots);
    // the last plate's impression is still on the sheet under the new bar
    layer(ctx, 0.15, () => {
      ctx.translate(14, -10);
      prevBody(ctx, t, CYAN);
    });
    bodyBar(ctx, t, KEY, n);
    return { phase: `bar-${n}`, plate: n, prevPlate };
  };
}

export const SECTION12_RENDER = Object.freeze({
  "cx-eye": plateShot(1, bodyChannel, {
    note: "plate 01 · stimulations · the far dot did not print",
  }),
  "cx-kw1": barShot(2, bodyChannel, 1, {
    note: "title bar · first press",
  }),
  "cx-bust": plateShot(2, bodyFront, {
    dots: [
      { x: PLATE.x + 14, y: PLATE.y + 14, w: PLATE.w - 28, h: PLATE.h - 28, alpha: 0.035 },
      { x: 150, y: 590, w: 520, h: 300, alpha: 0.11 },
    ],
    note: "plate 02 · satisfaction · the screen has started to bleed",
  }),
  "cx-kw2": barShot(3, bodyFront, 2, {
    dots: [{ x: 1310, y: 84, w: 500, h: 300, alpha: 0.10 }],
    note: "title bar · second press",
  }),
  "cx-hand": plateShot(3, bodyPalm, {
    chip: true,
    dots: [
      { x: PLATE.x + 14, y: PLATE.y + 14, w: PLATE.w - 28, h: PLATE.h - 28, alpha: 0.045 },
      { x: 1180, y: 700, w: 540, h: 290, alpha: 0.11 },
    ],
    note: "plate 03 · execution · the far end is off the plate",
  }),
  "cx-kw3": barShot(4, bodyPalm, 3, {
    dots: [{ x: 1240, y: 84, w: 570, h: 420, alpha: 0.12 }],
    note: "title bar · third press",
  }),
  "cx-fall": plateShot(4, bodyGrid, {
    dots: [{ x: PLATE.x + 14, y: PLATE.y + 14, w: PLATE.w - 28, h: PLATE.h - 28, alpha: 0.05 }],
    note: "plate 04 · simulation · grid closing, energy still full",
  }),
});

export const SECTION12_IMPLEMENTED = Object.freeze(Object.keys(SECTION12_RENDER));
