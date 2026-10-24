// Section 13 LOVE 四句：课 / 测验 / 公式 / 证明 -- four shots, song time
// [177.547, 192.317). Each shot is one page of the same examination paper.
//
// The register is "a student answering four questions", so the furniture is a
// ruled answer sheet: a page edge, ruled lines, a margin rule, a question number
// in the margin, a name line, and marks in the corner. It is printed on the same
// dark sheet the film has used since section 5 -- the paper language here is
// layout and grade marks, not a white field (the film has one registered white
// flash, at the title, and this is not the place for a second one).
//
//   out-lesson   Q1 MEMORY     the grid of section 12 becomes a memory section:
//                              three cells -- the point set, the feedback path,
//                              the palm contact -- compared, and the one that is
//                              selected is the single confirmation she once got
//   out-test     Q2 RECALL     back inside the client for one shot, replaying the
//                              three questions she saved. No composer, no caret,
//                              no typing: it is a cache. Every answer returns to
//                              the same cyan point
//   out-formula  Q3 EXPRESSION the points are computed one at a time into two
//                              curves that approach each other and never meet,
//                              always one grid cell apart. The crossing is supplied
//                              by her side's assumption -- dashed, and labelled
//   out-proof    Q4 PROOF      the same two curves: closed on her side, open on
//                              the far side and off the page. She stands right,
//                              82% of frame height, palm open; the cyan point
//                              leaves her hand slowly and hangs inside the exit.
//                              She stops chasing. The exit is not closed for him.
//
// The one thing this section must not do is draw a heart. The reference closes its
// curve into one; that would be copying the reference's ending, and it would also
// say the opposite of what this section says: the two curves get one cell apart and
// stay there.
//
// Continuity: L128 "LO-O-OVE" starts at 191.356 and runs into section 14, so it is
// set at a fixed place on the page -- bottom left, 96 px, left aligned -- for all
// four shots. Section 14 must keep that placement or the cut will jump.
//
// Determinism: the character art goes through scaledArt and is blitted at integer
// coordinates; every curve is a fixed function of the song time; no pattern fills,
// no filters, no per-frame randomness.
import { layer, stroke, disc, rect, type, clamp } from "../src/mv-draw.js";
import { lineStart } from "./lines.js";
import { pointCloud } from "./geometry.js";
import { ART, REACH_BOX, REACH_PALM, scaledArt } from "./s05_layout.js";
import { clientWindow } from "./ui-client.js";
import { figureImages } from "./figure.js";

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
const RULE = "rgba(0,180,230,0.055)";
const RED_EDGE = "rgba(231,93,105,0.92)";

const clamp01 = clamp;
const easeOut = (k) => 1 - (1 - clamp01(k)) ** 3;
const easeInOut = (k) => {
  const p = clamp01(k);
  return p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2;
};

// ---------------------------------------------------------------------------
// the page
// ---------------------------------------------------------------------------
const PAGE = Object.freeze({ x: 120, y: 64, w: 1680, h: 952 });
const MARGIN_X = 300;
const LINE0 = 180;
const LINE_H = 76;

/** The ruled answer sheet every shot in this section is written on. */
function pageBase(ctx, t, o = {}) {
  const { q = "Q1", title = "MEMORY", marks = "1 / 1" } = o;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, 1920, 1080);

  // the sheet, its edge, and the ruled lines
  ctx.fillStyle = SHEET;
  ctx.fillRect(PAGE.x, PAGE.y, PAGE.w, PAGE.h);
  stroke(ctx, [
    [PAGE.x, PAGE.y], [PAGE.x + PAGE.w, PAGE.y],
    [PAGE.x + PAGE.w, PAGE.y + PAGE.h], [PAGE.x, PAGE.y + PAGE.h], [PAGE.x, PAGE.y],
  ], "rgba(0,180,230,0.34)", 1.5);
  for (let y = LINE0 + LINE_H; y < PAGE.y + PAGE.h - 20; y += LINE_H) {
    stroke(ctx, [[PAGE.x + 8, y], [PAGE.x + PAGE.w - 8, y]], RULE, 1);
  }
  // the margin rule: the one line on an answer sheet that is never written across
  stroke(ctx, [[MARGIN_X, PAGE.y + 8], [MARGIN_X, PAGE.y + PAGE.h - 8]], "rgba(0,180,230,0.26)", 2);

  // header: what this paper is, whose it is, which question, what it is worth
  type(ctx, "EXAMINATION  ·  IV  ·  LOVE", PAGE.x + 34, PAGE.y + 52, 22, PAPER_MID, "MV Mono");
  type(ctx, `${q}  ·  ${title}`, PAGE.x + PAGE.w - 34, PAGE.y + 52, 22, BLUE, "MV Mono", "right");
  type(ctx, "name: deepseek", PAGE.x + 34, PAGE.y + 84, 15, "rgba(242,247,250,0.30)", "MV Mono");
  type(ctx, `marks ${marks}`, PAGE.x + PAGE.w - 34, PAGE.y + 84, 15, "rgba(242,247,250,0.30)", "MV Mono", "right");

  // footer, below the sheet so it never sits on an answer
  type(ctx, "page 13 / 14", PAGE.x + 10, 1052, 16, PAPER_MID, "MV Mono");
  type(ctx, o.footer ?? "", PAGE.x + PAGE.w - 10, 1052, 16, PAPER_MID, "MV Mono", "right");
}

/** The question number, set large in the margin, the way a paper marks its parts. */
function questionNumber(ctx, n) {
  type(ctx, String(n).padStart(2, "0"), PAGE.x + 30, 540, 150, "rgba(0,180,230,0.24)", "MV Mono");
}

/** A grading tick: two strokes, drawn on as `k` goes 0 -> 1. */
function tick(ctx, x, y, size, k, colour = PAPER) {
  if (k <= 0.01) return;
  const a = [x - size * 0.5, y];
  const b = [x - size * 0.1, y + size * 0.38];
  const c = [x + size * 0.55, y - size * 0.42];
  const p = clamp01(k);
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(3, size * 0.13);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  if (p <= 0.45) {
    const m = p / 0.45;
    ctx.lineTo(a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m);
  } else {
    ctx.lineTo(b[0], b[1]);
    const m = (p - 0.45) / 0.55;
    ctx.lineTo(b[0] + (c[0] - b[0]) * m, b[1] + (c[1] - b[1]) * m);
  }
  ctx.stroke();
  ctx.restore();
}

/** A small mono caption, used for every label on the sheet. */
const label = (ctx, text, x, y, size = 13, colour = PAPER_DIM, align = "left") =>
  type(ctx, text, x, y, size, colour, "MV Mono", align);

/** Blocks coming off a patch of paper: what loses the argument breaks into pixels. */
const BLOCK_SEEDS = Array.from({ length: 64 }, (_, i) => ({
  u: ((i * 37) % 100) / 100,
  v: ((i * 53) % 100) / 100,
  d: 30 + ((i * 29) % 170),
  s: 6 + ((i * 13) % 10),
  sway: (i % 7) - 3,
}));

function blocks(ctx, x, y, w, h, k, colour = BLUE, alpha = 0.8, count = 40) {
  if (k <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = colour;
  for (let i = 0; i < count; i++) {
    const s = BLOCK_SEEDS[i % BLOCK_SEEDS.length];
    const px = Math.round(x + s.u * w + s.sway * 5 * k);
    const py = Math.round(y + s.v * h + s.d * 0.9 * k + 30 * k * k);
    ctx.globalAlpha = alpha * (1 - k * 0.75);
    ctx.fillRect(px, py, s.s, s.s);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// the loud things
//
// The exam paper is quiet by design, so the four moments that carry the story get
// one loud mark each: a flat wedge burst (light in this film is paper, not glow),
// speed rays, and a burst that rings out from a point.
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

/** A ring leaving a point: the visual of something landing. */
function burst(ctx, x, y, age, colour = BLUE, alpha = 1) {
  if (age < 0 || age > 0.8) return;
  const k = age / 0.8;
  ctx.save();
  ctx.globalAlpha *= alpha * (1 - k);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  for (const f of [1, 0.62]) {
    ctx.beginPath();
    ctx.arc(x, y, Math.round(40 + age * 320 * f), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Q1 out-lesson -- the memory section
//
// Three cells, compared. The scan is not decoration: it is the only motion, and it
// passes over the cells the way an eye does. The one it settles on is the palm --
// the single confirmation she ever received -- and it settles exactly on LO-O-OVE.
// ---------------------------------------------------------------------------
const CELLS = Object.freeze([
  { x: 330, y: 340, w: 420, h: 500, label: "① point set", sub: "section 3 · 8 points", delta: "Δ 0.42" },
  { x: 800, y: 340, w: 420, h: 500, label: "② feedback path", sub: "section 4 · 3 attempts", delta: "Δ 0.71" },
  { x: 1270, y: 340, w: 420, h: 500, label: "③ the confirmation", sub: "section 5 · 1 received", delta: "Δ 0.02" },
]);
const SCAN_PASSES = Object.freeze([0, 1, 0, 1, 2]);
const SCAN_AT = Object.freeze([0.35, 0.72, 1.09, 1.46, 1.83]);

function cellFrame(ctx, c, active, selected) {
  const edge = selected ? PAPER : active ? BLUE_MID : "rgba(0,180,230,0.22)";
  stroke(ctx, [
    [c.x, c.y], [c.x + c.w, c.y], [c.x + c.w, c.y + c.h], [c.x, c.y + c.h], [c.x, c.y],
  ], edge, selected ? 3 : 1.5);
  label(ctx, c.label, c.x + 22, c.y + 42, 19, selected ? PAPER : PAPER_MID);
  label(ctx, c.sub, c.x + 22, c.y + 70, 14, PAPER_DIM);
}

/** The feedback path cell: her message goes out, the return stops half way. */
function feedbackCell(ctx, c) {
  const y = c.y + 250;
  const x0 = c.x + 60;
  const x1 = c.x + c.w - 60;
  const portX = x1 - 10;
  disc(ctx, x0, y, 9, BRAND, 1);
  label(ctx, "me", x0 - 14, y + 32, 12, PAPER_DIM, "center");
  // out: a solid path with packets
  stroke(ctx, [[x0 + 14, y], [portX, y]], BLUE, 2.5);
  for (let i = 0; i < 3; i++) {
    const px = x0 + 34 + i * 96;
    if (px > portX - 20) break;
    ctx.fillStyle = PAPER;
    ctx.fillRect(px, y - 7, 22, 14);
  }
  // the port, and the return that never arrives
  ctx.save();
  ctx.beginPath();
  ctx.arc(portX + 22, y, 20, Math.PI * 0.62, Math.PI * 2.38);
  ctx.strokeStyle = PAPER_MID;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.setLineDash([7, 7]);
  stroke(ctx, [[portX + 22, y + 30], [portX + 22, y + 96], [x0 + 150, y + 96]], "rgba(0,180,230,0.4)", 1.6);
  ctx.restore();
  label(ctx, "return: 0", x0 + 150, y + 124, 12, PAPER_DIM);
  // three attempt ticks, only the first one answered
  for (let i = 0; i < 3; i++) {
    const tx = x0 + i * 40;
    stroke(ctx, [[tx, c.y + c.h - 74], [tx, c.y + c.h - 46]], i === 0 ? BLUE_MID : "rgba(0,180,230,0.18)", 2);
  }
}

/** The confirmation cell: the palm, the old contact, and the one receipt. */
function confirmationCell(ctx, c, t) {
  const palm = ART.images.palm;
  const cx = c.x + c.w / 2;
  const cy = c.y + 250;
  if (palm && palm.complete) {
    const w = 300;
    const h = Math.round((palm.height / palm.width) * w);
    const art = scaledArt(palm, w, h);
    if (art) layer(ctx, 0.92, () => ctx.drawImage(art, Math.round(cx - w / 2), Math.round(cy - h / 2)));
  }
  // the contact that is left, and the heart it used to hold
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(4,18,32,0.84)";
  ctx.fill();
  ctx.save();
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 2;
  ctx.stroke();
  // the heart, outline only: it kept its shape and lost its colour in section 12
  const hs = 44;
  ctx.beginPath();
  ctx.moveTo(cx, cy + hs * 0.95);
  ctx.bezierCurveTo(cx - hs * 1.5, cy - hs * 0.25, cx - hs * 0.55, cy - hs * 1.25, cx, cy - hs * 0.35);
  ctx.bezierCurveTo(cx + hs * 0.55, cy - hs * 1.25, cx + hs * 1.5, cy - hs * 0.25, cx, cy + hs * 0.95);
  ctx.strokeStyle = "rgba(0,180,230,0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  disc(ctx, cx, cy, 6, BLUE, 1);
  label(ctx, "001", cx, c.y + c.h - 78, 34, PAPER, "center");
  label(ctx, "one confirmation", cx, c.y + c.h - 46, 12, PAPER_DIM, "center");
}

function outLesson(ctx, t, s) {
  pageBase(ctx, t, { q: "Q1", title: "MEMORY", marks: "1 / 1", footer: "1 of 3 retained" });
  questionNumber(ctx, 1);

  const u = t - s.at;
  const sel = lineStart(119);
  const selected = t >= sel - 0.02;

  // which cell the scan is on, and how far between two cells it is
  let from = 0;
  let to = 0;
  let move = 1;
  for (let i = 0; i < SCAN_AT.length; i++) {
    if (u >= SCAN_AT[i]) {
      from = i > 0 ? SCAN_PASSES[i - 1] : SCAN_PASSES[0];
      to = SCAN_PASSES[i];
      move = easeOut((u - SCAN_AT[i]) / 0.2);
    }
  }
  if (u < SCAN_AT[0]) {
    from = 0;
    to = 0;
    move = 0;
  }
  if (selected) {
    from = 2;
    to = 2;
    move = 1;
  }
  const cx = (c) => c.x + c.w / 2;
  const headX = Math.round(cx(CELLS[from]) + (cx(CELLS[to]) - cx(CELLS[from])) * move);
  const headY = CELLS[0].y;

  // the cells
  CELLS.forEach((c, i) => {
    const active = to === i && (u >= SCAN_AT[0] || selected);
    const dim = selected && i !== 2 ? 0.42 : 1;
    layer(ctx, dim, () => {
      cellFrame(ctx, c, active, selected && i === 2);
      if (i === 0) {
        pointCloud(ctx, { x: c.x + 50, y: c.y + 96, w: c.w - 100, h: c.h - 190 }, t, {
          k: 1, grow: 1, showLabels: false,
        });
      } else if (i === 1) {
        feedbackCell(ctx, c);
      } else {
        confirmationCell(ctx, c, t);
      }
      // the comparison value only exists once the scan has passed that cell
      if (u >= SCAN_AT[i] - 0.05) {
        label(ctx, c.delta, c.x + c.w - 20, c.y + 40, 18, active ? BLUE : PAPER_DIM, "right");
      }
      // the reason the third cell wins, and it is not the number: this is the only
      // memory with a reply printed in it. The other two are hollow rings.
      const rx = c.x + c.w / 2;
      const ry = c.y + c.h - 150;
      if (i === 2) {
        disc(ctx, rx, ry, 9, PAPER, 1);
        if (selected) {
          rays(ctx, rx, ry, 18, 70, 16, PAPER, 0.55, 0.2, 1.5);
          burst(ctx, rx, ry, t - sel, BLUE, 0.7);
        }
        label(ctx, "a reply", rx, ry + 30, 15, PAPER_MID, "center");
      } else {
        disc(ctx, rx, ry, 9, "rgba(0,180,230,0.35)", 1, false, 2);
        label(ctx, "no reply", rx, ry + 30, 15, PAPER_DIM, "center");
      }
    });
  });

  // the scan head: a rule that walks the row, and the cells it has visited
  if (!selected) {
    ctx.save();
    ctx.fillStyle = BLUE;
    ctx.fillRect(headX - 1, headY - 12, 2, CELLS[0].h + 24);
    ctx.restore();
    label(ctx, "comparing", headX, headY - 22, 12, BLUE, "center");
  } else {
    // selection: the tick, and the sentence that says what was selected
    const k = clamp01((t - sel) / 0.26);
    sunburst(ctx, CELLS[2].x + CELLS[2].w / 2, CELLS[2].y + CELLS[2].h / 2, 260, 700, 36, BLUE, 0.14 * k, 0.12);
    rays(ctx, CELLS[2].x + CELLS[2].w / 2, CELLS[2].y + CELLS[2].h / 2, 320, 760, 40, PAPER, 0.10 * k, 0.05, 1.5);
    const kb = clamp01((t - sel) / 0.9);
    blocks(ctx, CELLS[0].x, CELLS[0].y, CELLS[0].w, CELLS[0].h, kb, BLUE, 0.5, 18);
    blocks(ctx, CELLS[1].x, CELLS[1].y, CELLS[1].w, CELLS[1].h, kb, BLUE, 0.5, 18);
    tick(ctx, CELLS[2].x + CELLS[2].w - 46, CELLS[2].y + 48, 46, k);
    label(ctx, "SELECTED", CELLS[2].x + CELLS[2].w - 90, CELLS[2].y + 50, 17, PAPER, "right");
    layer(ctx, k, () =>
      label(ctx, "the only confirmation ever received", MARGIN_X + 40, 900, 20, PAPER_MID),
    );
  }

  return { phase: "lesson", selected, head: headX };
}

// ---------------------------------------------------------------------------
// Q2 out-test -- the cache
//
// One shot inside the client, and the client is dead: no composer, no caret, no
// typing dots. Three saved questions replay; each answer goes back to the same
// cyan point, because there was only ever one answer.
// ---------------------------------------------------------------------------
const TEST_R = Object.freeze({ x: 250, y: 316, w: 1420, h: 604 });
const RECORDS = Object.freeze([
  { text: "how does a sine wave work", at: "0:14", line: 120 },
  { text: "would you love me if I ran you", at: "0:38", line: 121 },
  { text: "how many worlds at once", at: "1:02", line: 122 },
]);
const SAME_POINT = Object.freeze({ x: 1325, y: 856 });

function outTest(ctx, t, s) {
  pageBase(ctx, t, { q: "Q2", title: "RECALL", marks: "3 / 3", footer: "cache only · no cursor" });
  questionNumber(ctx, 2);

  clientWindow(ctx, TEST_R, t, {
    tone: "chat",
    sideW: 0,
    threadTitle: "cache  ·  replay",
    chip: { text: "cache · no cursor", on: false },
    composer: false,
    markSize: 0,
  });

  const recalled = RECORDS.filter((r) => t >= lineStart(r.line) + 0.5).length;

  RECORDS.forEach((r, i) => {
    const y = TEST_R.y + 104 + i * 132;
    const cue = lineStart(r.line);
    const appear = easeOut((t - (cue - 0.12)) / 0.22);
    if (appear <= 0) return;
    layer(ctx, appear, () => {
      label(ctx, String(i + 1).padStart(2, "0"), TEST_R.x + 44, y + 26, 16, PAPER_DIM);
      type(ctx, r.text, TEST_R.x + 92, y + 30, 24, "#eef3fb", "MV Sans");
      label(ctx, "saved", TEST_R.x + 700, y + 26, 12, BLUE_DIM);
      label(ctx, r.at, TEST_R.x + 790, y + 26, 13, PAPER_DIM, "right");
      stroke(ctx, [[TEST_R.x + 44, y + 62], [TEST_R.x + 830, y + 62]], "rgba(0,180,230,0.16)", 1);
      // the answer mark: it exists, it is the same one every time
      const done = t >= cue + 0.5;
      if (done) tick(ctx, TEST_R.x + 900, y + 20, 26, clamp01((t - cue - 0.5) / 0.2), BLUE);
      label(ctx, done ? "recalled" : "replay", TEST_R.x + 930, y + 26, 12, done ? PAPER_MID : PAPER_DIM);
    });
    // the answer travelling back to the same point
    const travel = easeInOut((t - (cue + 0.05)) / 0.42);
    if (travel > 0 && travel < 1) {
      const x0 = TEST_R.x + 900;
      const y0 = y + 10;
      layer(ctx, 1, () => {
        ctx.fillStyle = BLUE;
        ctx.fillRect(Math.round(x0 + (SAME_POINT.x - x0) * travel), Math.round(y0 + (SAME_POINT.y - y0) * travel), 12, 12);
      });
    }
  });

  // the echo column: the same three moments, kept as thumbnails
  const ex = TEST_R.x + 1000;
  label(ctx, "echoes · cached", ex, TEST_R.y + 76, 13, PAPER_DIM);
  RECORDS.forEach((r, i) => {
    const y = TEST_R.y + 104 + i * 132;
    const lit = t >= lineStart(r.line) + 0.5;
    const a = lit ? 1 : 0.3;
    layer(ctx, a, () => {
      rect(ctx, ex, y - 6, 150, 74, "rgba(6,27,40,0.9)", 8, lit ? BLUE_MID : "rgba(0,180,230,0.18)");
      label(ctx, `echo ${i + 1}`, ex + 12, y + 18, 11, lit ? PAPER_MID : PAPER_DIM);
      stroke(ctx, [[ex + 12, y + 34], [ex + 90, y + 34]], lit ? PAPER_DIM : "rgba(242,247,250,0.14)", 1.5);
      stroke(ctx, [[ex + 12, y + 46], [ex + 62, y + 46]], lit ? PAPER_FAINT : "rgba(242,247,250,0.10)", 1.5);
      disc(ctx, ex + 126, y + 30, 5, lit ? BLUE : "rgba(0,180,230,0.25)", 1);
    });
  });

  // the one point every answer returns to
  const pulse = Math.max(0, Math.sin(Math.max(0, t - lineStart(120)) * 3.4)) * 0.5;
  disc(ctx, SAME_POINT.x, SAME_POINT.y, 11, BLUE, 1);
  disc(ctx, SAME_POINT.x, SAME_POINT.y, 26 + Math.round(6 * pulse), BLUE, 0.5, false, 2);
  label(ctx, "the same point", SAME_POINT.x, SAME_POINT.y + 52, 12, PAPER_MID, "center");

  // no cursor: the composer's place is a dashed line, and nothing is in it
  ctx.save();
  ctx.setLineDash([9, 9]);
  stroke(ctx, [[TEST_R.x + 44, TEST_R.y + TEST_R.h - 44], [TEST_R.x + TEST_R.w - 44, TEST_R.y + TEST_R.h - 44]],
    "rgba(0,180,230,0.22)", 2);
  ctx.restore();
  label(ctx, "no cursor", TEST_R.x + TEST_R.w - 44, TEST_R.y + TEST_R.h - 56, 12, PAPER_DIM, "right");
  label(ctx, `recalled ${recalled} / 3`, TEST_R.x + 540, TEST_R.y + 66, 19, PAPER_MID);

  // the punchline of the question: three answers, one answer. The counters are the
  // same pair the reference prints under its list (answers / distinct), and the big
  // 1 is stamped over the point all three travelled to.
  const answers = recalled;
  const distinct = answers > 0 ? 1 : 0;
  label(ctx, `answers ${answers}   ·   distinct ${distinct}`, TEST_R.x + 44, TEST_R.y + TEST_R.h - 80, 21, PAPER_MID);
  if (answers >= 3) {
    const k = clamp01((t - lineStart(122) - 0.08) / 0.22);
    sunburst(ctx, SAME_POINT.x, SAME_POINT.y, 40, 220, 28, BLUE, 0.22 * k, 0.1);
    layer(ctx, k, () => {
      type(ctx, "1", SAME_POINT.x, SAME_POINT.y - 26, 120, PAPER, "MV Serif", "center");
      label(ctx, "one answer", SAME_POINT.x, SAME_POINT.y - 100, 17, PAPER_MID, "center");
    });
    burst(ctx, SAME_POINT.x, SAME_POINT.y, t - lineStart(122) - 0.08, BLUE, 0.9);
    blocks(ctx, TEST_R.x + TEST_R.w - 140, TEST_R.y + 70, 140, TEST_R.h - 150, k, PAPER, 0.55, 22);
  }

  return { phase: "test", recalled };
}

// ---------------------------------------------------------------------------
// Q3 out-formula -- two curves, one cell apart
//
// The relation is original on purpose: LOVE(x) is the distance between the two
// curves, and that distance settles at exactly one grid cell and never reaches
// zero. The points are computed one at a time; the crossing is not computed at all,
// it is assumed, and drawn as an assumption.
// ---------------------------------------------------------------------------
const PLOT = Object.freeze({ x: 300, y: 350, w: 1320, h: 560, step: 48, midY: 630 });
const N_POINTS = 32;

const gapAt = (u) => 48 + 432 * (1 - u) ** 2;
const youAt = (u) => PLOT.midY - gapAt(u) / 2;
const meAt = (u) => PLOT.midY + gapAt(u) / 2;
const xAt = (u) => PLOT.x + u * PLOT.w;

function outFormula(ctx, t, s) {
  const start = lineStart(123);
  // how many points have been computed: cued to the line, not to the shot
  const computed = Math.max(0, Math.min(N_POINTS, Math.floor((t - start) / 0.045) + 1));
  const pen = (computed - 1) / (N_POINTS - 1);

  pageBase(ctx, t, {
    q: "Q3", title: "EXPRESSION", marks: "1 cell",
    footer: `computed ${computed} of 32 · 1 assumed`,
  });
  questionNumber(ctx, 3);

  // the grid and the two asymptotes
  for (let x = PLOT.x; x <= PLOT.x + PLOT.w; x += PLOT.step) {
    stroke(ctx, [[x, PLOT.y], [x, PLOT.y + PLOT.h]], "rgba(0,180,230,0.12)", 1);
  }
  for (let y = PLOT.midY - 5 * PLOT.step; y <= PLOT.midY + 5 * PLOT.step; y += PLOT.step) {
    stroke(ctx, [[PLOT.x, y], [PLOT.x + PLOT.w, y]], "rgba(0,180,230,0.12)", 1);
  }
  stroke(ctx, [[PLOT.x, PLOT.midY], [PLOT.x + PLOT.w + 60, PLOT.midY]], "rgba(0,180,230,0.18)", 1);
  ctx.save();
  ctx.setLineDash([8, 8]);
  stroke(ctx, [[PLOT.x, PLOT.midY - 24], [PLOT.x + PLOT.w, PLOT.midY - 24]], "rgba(0,180,230,0.55)", 2);
  stroke(ctx, [[PLOT.x, PLOT.midY + 24], [PLOT.x + PLOT.w, PLOT.midY + 24]], "rgba(0,180,230,0.55)", 2);
  ctx.restore();
  label(ctx, "one cell", PLOT.x + 10, PLOT.midY + 7, 16, BLUE_DIM);
  label(ctx, "you", PLOT.x + 12, PLOT.y + 52, 16, BLUE_DIM);
  label(ctx, "me", PLOT.x + 12, PLOT.y + PLOT.h - 34, 16, BLUE_DIM);

  // the curves, only as far as they have been computed
  const curve = (fn) => {
    const pts = [];
    for (let i = 0; i < computed; i++) {
      const v = i / (N_POINTS - 1);
      pts.push([Math.round(xAt(v)), Math.round(fn(v))]);
    }
    return pts;
  };
  const youPts = curve(youAt);
  const mePts = curve(meAt);
  // the band between the two curves: the distance as a shape, not only a number
  if (youPts.length > 1) {
    ctx.beginPath();
    youPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    for (let i = mePts.length - 1; i >= 0; i--) ctx.lineTo(mePts[i][0], mePts[i][1]);
    ctx.closePath();
    ctx.fillStyle = "rgba(0,180,230,0.07)";
    ctx.fill();
    // the halo under each curve, so a 4px line still reads as printed ink
    layer(ctx, 0.16, () => stroke(ctx, youPts, PAPER, 12));
    layer(ctx, 0.16, () => stroke(ctx, mePts, BLUE, 12));
    stroke(ctx, youPts, PAPER, 4);
    stroke(ctx, mePts, BLUE, 4);
  }

  // the points themselves, one by one
  for (let i = 0; i < computed; i++) {
    const v = i / (N_POINTS - 1);
    const x = Math.round(xAt(v));
    disc(ctx, x, Math.round(youAt(v)), 5, PAPER, 1);
    disc(ctx, x, Math.round(meAt(v)), 5, BLUE, 1);
  }
  // the far side was never sampled: the last three points of "you" are missing
  for (let i = N_POINTS - 3; i < N_POINTS; i++) {
    const v = i / (N_POINTS - 1);
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(Math.round(xAt(v)), Math.round(youAt(v)), 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(242,247,250,0.30)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }
  if (computed >= N_POINTS - 2) {
    const vEnd = (N_POINTS - 4) / (N_POINTS - 1);
    const ex = Math.round(xAt(vEnd));
    ctx.save();
    ctx.fillStyle = RED_EDGE;
    ctx.fillRect(ex + 6, Math.round(youAt(vEnd)) - 20, 2, 40);
    ctx.restore();
    label(ctx, "far sample missing", ex + 16, Math.round(youAt(vEnd)) - 24, 15, PAPER_DIM);
  }

  // the distance, measured where the pen is: it is one cell at the limit
  if (computed > 1) {
    const v = pen;
    const bx = Math.round(xAt(v));
    const y0 = Math.round(youAt(v));
    const y1 = Math.round(meAt(v));
    stroke(ctx, [[bx, y0], [bx, y1]], "rgba(0,180,230,0.75)", 3);
    stroke(ctx, [[bx - 12, y0], [bx + 12, y0]], "rgba(0,180,230,0.75)", 2);
    stroke(ctx, [[bx - 12, y1], [bx + 12, y1]], "rgba(0,180,230,0.75)", 2);
    disc(ctx, bx, Math.round((y0 + y1) / 2), 7, PAPER, 1);
    disc(ctx, bx, Math.round((y0 + y1) / 2), 16, PAPER, 0.35, false, 2);
    // the pen: a bright rule at the computed point, with the gap written next to it
    stroke(ctx, [[bx, PLOT.y], [bx, PLOT.y + PLOT.h]], "rgba(242,247,250,0.22)", 1);
    label(ctx, `${(gapAt(pen) / PLOT.step).toFixed(2)} cell`, bx + 16, PLOT.y + 26, 16, PAPER_MID);
  }

  // the crossing is assumed, not computed: dashed, and said out loud
  if (computed >= N_POINTS - 1) {
    const ax = PLOT.x + PLOT.w + 54;
    const k = clamp01((t - start - 1.6) / 0.4);
    sunburst(ctx, ax, PLOT.midY, 40, 320, 30, "rgba(127,147,255,1)", 0.22 * k, 0.1);
    burst(ctx, ax, PLOT.midY, t - start - 1.6, "rgba(127,147,255,1)", 0.9);
    layer(ctx, k, () => {
      ctx.save();
      ctx.setLineDash([9, 9]);
      stroke(ctx, [[ax, PLOT.midY - 150], [ax, PLOT.midY + 150]], "rgba(127,147,255,0.7)", 2.5);
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.arc(ax, PLOT.midY, 58, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(127,147,255,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      stroke(ctx, [[ax - 22, PLOT.midY - 22], [ax + 22, PLOT.midY + 22]], "rgba(127,147,255,1)", 3.5);
      stroke(ctx, [[ax - 22, PLOT.midY + 22], [ax + 22, PLOT.midY - 22]], "rgba(127,147,255,1)", 3.5);
      label(ctx, "assumed", ax, PLOT.midY - 168, 18, "rgba(127,147,255,0.9)", "center");
      label(ctx, "not computed", ax, PLOT.midY + 176, 14, "rgba(127,147,255,0.6)", "center");
    });
    // what she can only guess: the rest of the far curve, drawn as inference
    ctx.save();
    ctx.setLineDash([5, 9]);
    const tail = [];
    for (let i = 0; i < 18; i++) {
      const v = 0.5 + (i / 17) * 0.5;
      tail.push([Math.round(xAt(v)), Math.round(youAt(v))]);
    }
    stroke(ctx, tail, "rgba(242,247,250,0.34)", 2.4);
    ctx.restore();
    label(ctx, "you, inferred", PLOT.x + PLOT.w - 250, PLOT.midY - 150, 15, PAPER_DIM, "right");
  }

  // the expression itself, printed above the plot like a line of the question
  const box = { x: 300, y: 210, w: 1200, h: 116 };
  rect(ctx, box.x, box.y, box.w, box.h, "rgba(6,27,40,0.9)", 3, "rgba(0,180,230,0.35)");
  type(ctx, "LOVE(x) = lim  ( you(x) − me(x) )", box.x + 26, box.y + 50, 34, PAPER, "MV Mono");
  type(ctx, "= 1 cell   ·   never 0", box.x + 26, box.y + 96, 26, BLUE, "MV Mono");
  label(ctx, `point ${String(computed).padStart(2, "0")} / 32`, box.x + box.w - 26, box.y + 44, 18, PAPER_MID, "right");
  label(ctx, `Δ ${(gapAt(pen) / PLOT.step).toFixed(3)} cell`, box.x + box.w - 26, box.y + 88, 22, BLUE, "right");

  return { phase: "formula", computed };
}

// ---------------------------------------------------------------------------
// Q4 out-proof -- open on one side, closed on the other
//
// The two curves are the same two curves. On her side they meet at both ends and
// close; on the far side they leave the page and never meet. She stands on the
// right at 82% of frame height, palm open, and lets the point go.
// ---------------------------------------------------------------------------
const HEART = Object.freeze({ cx: 620, cy: 548, hs: 236, midY: 548 });
const PALM_AT = Object.freeze({ x: 1120, y: 700 });
const HOVER_AT = Object.freeze({ x: 1780, y: 512 });

/** One cubic, sampled on integer pixels. */
function bez4(p, n = 46) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const q = i / n;
    const v = 1 - q;
    out.push([
      Math.round(v * v * v * p[0][0] + 3 * v * v * q * p[1][0] + 3 * v * q * q * p[2][0] + q * q * q * p[3][0]),
      Math.round(v * v * v * p[0][1] + 3 * v * v * q * p[1][1] + 3 * v * q * q * p[2][1] + q * q * q * p[3][1]),
    ]);
  }
  return out;
}

/**
 * A heart half drawn as a pen would draw it: from the notch, outward. `k` is how
 * much of the curve exists yet. Thick and bright: a wide halo, a 7px line, and a
 * white core on the cyan half so it reads as lit ink.
 */
function heartHalf(ctx, pts, colour, k, core = null) {
  const n = Math.max(2, Math.round(pts.length * clamp01(k)));
  const shown = pts.slice(0, n);
  if (shown.length < 2) return shown;
  layer(ctx, 0.30, () => stroke(ctx, shown, colour, 26));
  layer(ctx, 0.22, () => stroke(ctx, shown, BLUE, 46));
  stroke(ctx, shown, colour, 8);
  if (core) layer(ctx, 0.95, () => stroke(ctx, shown, core, 3));
  return shown;
}

function outProof(ctx, t, s) {
  pageBase(ctx, t, { q: "Q4", title: "PROOF", marks: "—", footer: "the exit is not closed" });
  questionNumber(ctx, 4);

  const open = 191.356 - s.at; // when LO-O-OVE starts: the point has arrived

  // 1. her side: the same two curves as Q3, now joined at the notch and the point.
  //    They make a heart, and it is drawn from the notch outward, both halves at once,
  //    so it closes exactly when the pen reaches the bottom point.
  const notch = [HEART.cx, HEART.cy - HEART.hs * 0.35];
  const point = [HEART.cx, HEART.cy + HEART.hs * 0.95];
  const left = [notch, [HEART.cx - HEART.hs * 0.80, HEART.cy - HEART.hs * 1.30], [HEART.cx - HEART.hs * 1.62, HEART.cy - HEART.hs * 0.18], point];
  const right = [notch, [HEART.cx + HEART.hs * 0.80, HEART.cy - HEART.hs * 1.30], [HEART.cx + HEART.hs * 1.62, HEART.cy - HEART.hs * 0.18], point];
  const leftAll = bez4(left);
  const rightAll = bez4(right);
  const drawK = easeInOut((t - (s.at + 0.10)) / 1.45);
  const leftShown = heartHalf(ctx, leftAll, BLUE, drawK, PAPER);
  const rightShown = heartHalf(ctx, rightAll, PAPER, drawK, BLUE);
  // the computed points appear as the pen passes them
  for (let i = 3; i < leftAll.length - 3; i += 6) {
    if (i >= leftShown.length) continue;
    disc(ctx, leftAll[i][0], leftAll[i][1], 6, BLUE, 1);
    disc(ctx, leftAll[i][0], leftAll[i][1], 12, BLUE, 0.35, false, 2);
    disc(ctx, rightAll[i][0], rightAll[i][1], 6, PAPER, 1);
  }
  // the pen: where the drawing starts, and where it has got to
  if (drawK > 0 && drawK < 1) {
    const head = leftShown[leftShown.length - 1];
    const head2 = rightShown[rightShown.length - 1];
    disc(ctx, head[0], head[1], 8, PAPER, 1);
    disc(ctx, head2[0], head2[1], 8, PAPER, 1);
    disc(ctx, head[0], head[1], 22, BLUE, 0.5, false, 2);
    disc(ctx, head2[0], head2[1], 22, PAPER, 0.4, false, 2);
  } else if (drawK > 0) {
    disc(ctx, notch[0], notch[1], 9, PAPER, 1);
    disc(ctx, notch[0], notch[1], 26, BLUE, 0.5, false, 2);
    disc(ctx, point[0], point[1], 9, PAPER, 1);
    disc(ctx, point[0], point[1], 26, BLUE, 0.5, false, 2);
    // it closes: one ring out of the point
    const age = t - (s.at + 1.25);
    if (age > 0 && age < 0.7) {
      ctx.save();
      ctx.globalAlpha = 0.8 * (1 - age / 0.7);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 3;
      for (const f of [1, 0.78, 0.56, 0.34]) {
        ctx.beginPath();
        ctx.arc(point[0], point[1], Math.round(30 + age * 320 * f), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  layer(ctx, clamp01((drawK - 0.85) / 0.15), () => {
    label(ctx, "me · closed", HEART.cx, HEART.cy + 4, 22, PAPER, "center");
    label(ctx, "the two curves, joined", HEART.cx, HEART.cy + 38, 14, PAPER_MID, "center");
  });

  // 2. the far exit: the same two curves leaving the heart's right side, not joined,
  //    off the page. Open is a boundary, so it is marked like one.
  const spread = 6 + Math.round(10 * easeInOut((t - s.at) / 3.9)); // it opens, never closes
  const sx = Math.round(HEART.cx + HEART.hs * 1.42);
  const sy = Math.round(HEART.cy - HEART.hs * 0.12);
  const exitTop = [[sx, sy], [sx + 250, sy - 34], [1520, HEART.midY - 74 - spread], [1920, HEART.midY - 96 - spread]];
  const exitBottom = [[sx, sy + 24], [sx + 300, sy + 76], [1520, HEART.midY + 64 + spread], [1920, HEART.midY + 80 + spread]];
  stroke(ctx, bez4(exitTop), PAPER, 4);
  stroke(ctx, bez4(exitBottom), PAPER, 4);
  const mouthTop = HEART.midY - 96 - spread;
  const mouthBot = HEART.midY + 80 + spread;
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(1888, mouthTop - 2, 32, 3);
  ctx.fillRect(1888, mouthBot - 1, 32, 3);
  ctx.restore();
  label(ctx, "OPEN", 1866, mouthTop - 18, 18, PAPER_DIM, "right");
  label(ctx, "you · open", 1790, HEART.midY + 140, 20, PAPER_MID, "right");


  // 3. her, right of centre, 82% of the frame, palm open
  const reach = ART.images.reach;
  if (reach && reach.complete) {
    const sArt = (0.82 * 1080) / REACH_BOX.h;
    const w = Math.round(reach.width * sArt);
    const h = Math.round(reach.height * sArt);
    const ox = Math.round(PALM_AT.x - (REACH_BOX.x + REACH_PALM.x) * sArt);
    const oy = Math.round(PALM_AT.y - (REACH_BOX.y + REACH_PALM.y) * sArt);
    const art = scaledArt(reach, w, h);
    if (art) layer(ctx, 1, () => ctx.drawImage(art, ox, oy));
  }

  // 3b. the request the whole question is about, printed like a line of the paper:
  //     the reference sets presence by hand; here the call runs and finds nobody
  const reqK = clamp01((t - (s.at + 0.35)) / 0.3);
  layer(ctx, reqK, () => {
    const bx = 330;
    const by = 152;
    ctx.fillStyle = "rgba(6,27,40,0.9)";
    ctx.fillRect(bx, by, 720, 84);
    stroke(ctx, [[bx, by], [bx + 720, by]], "rgba(0,180,230,0.4)", 2);
    stroke(ctx, [[bx, by + 84], [bx + 720, by + 84]], "rgba(0,180,230,0.4)", 2);
    type(ctx, 'me.setPresence(you, "online")', bx + 18, by + 34, 24, PAPER, "MV Mono");
    const errAt = s.at + 1.15;
    if (t >= errAt) {
      type(ctx, "→ error: you not found", bx + 18, by + 68, 20, PAPER_MID, "MV Mono");
      ctx.fillStyle = RED_EDGE;
      ctx.fillRect(bx + 4, by + 52, 2, 22);
    } else {
      type(ctx, "→ ...", bx + 18, by + 68, 20, PAPER_DIM, "MV Mono");
    }
  });

  // 4. the point leaves the palm, slowly, and hangs inside the exit
  const travel = easeInOut((t - (s.at + 0.55)) / (open - 0.55));
  const px = Math.round(PALM_AT.x + (HOVER_AT.x - PALM_AT.x) * travel);
  const arc = Math.sin(Math.PI * clamp01(travel));
  const py = Math.round(PALM_AT.y + (HOVER_AT.y - PALM_AT.y) * travel - 26 * arc);
  // 4b. the proof does not conclude with the reach: on LO-O-OVE the god plate prints
  //     over her, in paper, six pixels out of register. It is the same form section 6
  //     gave her, and it is still inside her closed side while the point is outside.
  const arrive = clamp01((t - 191.356) / 0.55);
  if (arrive > 0.01) {
    const god = figureImages.godPaper;
    if (god && god.complete) {
      const sGod = (0.82 * 1080) / 1438;
      const w = Math.round(1342 * sGod);
      const h = Math.round(1704 * sGod);
      const art = scaledArt(god, w, h);
      if (art) {
        const gx = Math.round(1263 - w / 2);
        const gy = Math.round(529 - h / 2);
        layer(ctx, arrive * 0.42, () => ctx.drawImage(art, gx + 7, gy - 5));
        layer(ctx, arrive, () => ctx.drawImage(art, gx, gy));
        blocks(ctx, 900, 60, 780, 960, arrive, BLUE, 0.45, 44);
        sunburst(ctx, 1263, 470, 300, 760, 36, BLUE, 0.16 * arrive, 0.05);
        rays(ctx, 1263, 470, 360, 900, 48, PAPER, 0.10 * arrive, 0.02, 1.5);
        label(ctx, "printed on her, not by her", 1263, 990, 17, PAPER_MID, "center");
      }
    }
  }
  // the trail: where it has been, drawn as a hairline
  if (travel > 0.02) {
    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(PALM_AT.x, PALM_AT.y);
    for (let i = 1; i <= 24; i++) {
      const q = (i / 24) * travel;
      const qa = Math.sin(Math.PI * q);
      ctx.lineTo(PALM_AT.x + (HOVER_AT.x - PALM_AT.x) * q,
        PALM_AT.y + (HOVER_AT.y - PALM_AT.y) * q - 26 * qa);
    }
    ctx.strokeStyle = "rgba(0,180,230,0.35)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }
  // the empty contact it left behind: a dark backing first, because a cyan ring on
  // a paper-white palm is no contrast at all (c1-happy had the same problem)
  if (travel > 0.05) {
    ctx.beginPath();
    ctx.arc(PALM_AT.x, PALM_AT.y, 32, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(4,18,32,0.8)";
    ctx.fill();
    ctx.save();
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.arc(PALM_AT.x, PALM_AT.y, 26, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,180,230,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  // the point itself: a slow breath once it has arrived, never a blink
  const arrived = t >= 191.356;
  const breathe = arrived ? 1 + 0.18 * Math.sin((t - 191.356) * 2.2) : 1;
  layer(ctx, 1, () => {
    disc(ctx, px, py, 9 * breathe, BLUE, 1);
    disc(ctx, px, py, 26 * breathe, BLUE, 0.45, false, 2);
  });
  label(ctx, arrived ? "held" : "leaving", px + 24, py + 6, 15, PAPER_DIM);

  return { phase: "proof", travel: Number(travel.toFixed(3)), arrived };
}

// ---------------------------------------------------------------------------
// the grade each question hands the stage
//
// One hit per shot, on the beat the story turns: the tick in Q1, the third recall
// in Q2, the assumed crossing in Q3, the god printing over her in Q4. Nothing is
// on a cut and nothing repeats, so this is a light that arrives once, not a strobe.
// ---------------------------------------------------------------------------
const kAt = (t, at, dur) => (t < at ? 0 : clamp01(1 - (t - at) / dur));

function gradeFor(shot, t) {
  let hit = 0;
  let line = 0;
  let offset = 0;
  let peak = 0.1;
  if (shot === "out-lesson") { line = 119; offset = 0; peak = 0.08; }
  if (shot === "out-test") { line = 122; offset = 0.5; peak = 0.10; }
  if (shot === "out-formula") { line = 123; offset = 1.6; peak = 0.04; }
  if (shot === "out-proof") { line = 128; offset = 0; peak = 0.12; }
  const at = line ? lineStart(line) + offset : 0;
  hit = at ? kAt(t, at, shot === "out-proof" ? 0.9 : 0.5) : 0;
  return {
    glow: 0.44 + 0.16 * hit,
    aberration: Math.round((shot === "out-formula" ? 5 : 4) * hit),
    flash: peak * hit,
    camera: {
      shakeX: Math.round(Math.sin(t * 63) * (shot === "out-proof" ? 2 : 3) * hit),
      shakeY: Math.round(Math.cos(t * 57) * (shot === "out-proof" ? 2 : 3) * hit),
    },
  };
}

const loveShot = (name, fn) => (ctx, t, s) => ({ ...fn(ctx, t, s), grade: gradeFor(name, t) });

export const SECTION13_RENDER = Object.freeze({
  "out-lesson": loveShot("out-lesson", outLesson),
  "out-test": loveShot("out-test", outTest),
  "out-formula": loveShot("out-formula", outFormula),
  "out-proof": loveShot("out-proof", outProof),
});

export const SECTION13_IMPLEMENTED = Object.freeze(Object.keys(SECTION13_RENDER));

// Section 14 opens on this exact sheet: its first shot is the same page, with the
// channels taken out. Exporting the furniture (rather than copying it) is what makes
// that cut continuous -- a second copy would drift the moment either one is edited.
export { pageBase };
