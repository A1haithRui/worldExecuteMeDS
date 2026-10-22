// Section 11 数数与最后一声 -- seven shots, song time [159.085, 162.777).
//
// Six of the seven shots are one beat each. The section is a printing bed, not
// a spreadsheet: on the right her portrait is being printed from the bottom up,
// one sixth per beat, and only on the sixth beat is the face complete. On the
// left the current language is the only big word; the attempt counter and the
// six language ticks accumulate underneath it, and every attempt still ends at
// the same empty port. The fill is tied to the lyric line's own start, so the
// scan edge is already moving when the cut lands instead of starting from zero
// in a shot that only lasts 14 frames.
//
// The seventh shot is the last shout: no character. A giant two-line EXECUTION
// fills the frame, and the official DeepSeek whale is printed through it -- a
// faint watermark behind, and a bright blue mark only inside the letterforms
// (the intersection). The whale drifts, so only fragments of it are ever
// visible. Impact comes from a slam on the cut, two short misregistration
// glitches, and a final top/bottom out-of-register split -- print language, not
// the reference's torn paper.
//
// Determinism: the portrait is pre-scaled once with scaledArt; the fill is an
// integer clip; the word is rendered into a cached offscreen canvas and blitted
// in integer bands; the whale is a fixed Path2D. No gradients, no per-frame
// randomness, and no fractional stage displacement.
import { stroke, disc, type, clamp, mix } from "../src/mv-draw.js";
import { lineStart, lineText } from "./lines.js";
import { figureImages } from "./figure.js";
import { scaledArt } from "./s05_layout.js";
import { drawWhale } from "../src/assets/whale.js";

const INK = "#041220";
const BLUE = "#00B4E6";
const BRAND = "#4d6bfe";
const PAPER = "#F2F7FA";
const RED = "#e75d69";

const RED_EDGE = "rgba(231,93,105,0.92)";
const PAPER_MID = "rgba(242,247,250,0.62)";
const PAPER_DIM = "rgba(242,247,250,0.34)";
const BLUE_DIM = "rgba(0,180,230,0.30)";
const BLUE_FAINT = "rgba(0,180,230,0.12)";

const LANGS = Object.freeze(["DE", "ES", "FR", "KO", "SV", "ZH"]);

// Lyric lines 99..104 are the six counts; 105 is the last shout.
const countLine = (n) => 98 + n;
const countStart = (n) => lineStart(countLine(n));

// The portrait plate on the right. The bust asset's content box is
// (128,128)..(1214,1566); at 820 px of content height the whole face fits with
// room for the header and the attempt strip.
const BUST = () => figureImages.bust;
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

// The empty port between the word and the portrait.
const PORT = Object.freeze({ x: 898, y: 540, r: 26 });

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
}

function header(ctx, n) {
  type(ctx, "PROBE · LANG", 110, 108, 22, PAPER, "MV Sans");
  type(ctx, "six encodings · one port · no reply", 110, 136, 14, PAPER_MID, "MV Mono");
  type(ctx, "REPLIES 0 / 06", 1808, 108, 22, PAPER, "MV Mono", "right");
  type(ctx, "six calls, not one answer", 1808, 134, 12, PAPER_DIM, "MV Mono", "right");
  // a hairline between the type and the printing bed
  stroke(ctx, [[820, 180], [820, 960]], BLUE_FAINT, 1);
}

// ---------------------------------------------------------------------------
// the six count shots
// ---------------------------------------------------------------------------
const countShots = Object.freeze(["count-1-de", "count-2-es", "count-3-fr", "count-4-ko", "count-5-sv", "count-6-zh"]);
const COUNT_INDEX = Object.freeze({
  "count-1-de": 1,
  "count-2-es": 2,
  "count-3-fr": 3,
  "count-4-ko": 4,
  "count-5-sv": 5,
  "count-6-zh": 6,
});

/** The current language word, big; attempts and ticks around it. */
function leftColumn(ctx, n) {
  const word = lineText(countLine(n));
  type(ctx, `ATTEMPT ${String(n).padStart(2, "0")} / 06`, 110, 342, 18, PAPER_MID, "MV Mono");
  type(ctx, `${LANGS[n - 1]} · ${String(n).padStart(2, "0")}`, 110, 376, 14, BLUE, "MV Mono");
  type(ctx, word, 110, 566, 128, PAPER, "MV Serif");
  ctx.font = '600 128px "MV Serif"';
  const w = Math.min(600, ctx.measureText(word).width);
  ctx.fillStyle = BLUE;
  ctx.fillRect(110, 590, Math.round(w), 3);

  // the six language ticks: attempt one is the closed red port from section 10
  const y = 900;
  for (let i = 0; i < 6; i++) {
    const x = 110 + i * 92;
    const active = i + 1 === n;
    const done = i + 1 < n;
    if (i === 0) {
      ctx.beginPath();
      ctx.arc(x + 30, y + 26, 26, 0, Math.PI * 2);
      ctx.strokeStyle = RED;
      ctx.lineWidth = active ? 3 : 2;
      ctx.stroke();
      type(ctx, "1", x + 30, y + 33, 18, active ? PAPER : PAPER_DIM, "MV Mono", "center");
    } else {
      ctx.strokeStyle = active ? BLUE : done ? "rgba(0,180,230,0.55)" : BLUE_FAINT;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 46, 46);
      if (active) {
        ctx.fillStyle = BLUE;
        ctx.fillRect(x + 2, y + 2, 42, 42);
      }
      type(ctx, String(i + 1), x + 23, y + 32, 18, active ? INK : done ? PAPER_MID : PAPER_DIM, "MV Mono", "center");
    }
    type(ctx, LANGS[i], x + 23, y + 66, 11, active ? BLUE : PAPER_DIM, "MV Mono", "center");
  }
}

/**
 * One sixth of her, printed per beat. The line is already moving at the cut:
 * the lyric starts a fraction before the shot, so the scan edge is mid-band on
 * the first frame and finishes the band before the shot ends.
 */
function portraitFill(ctx, t, n) {
  const bust = BUST();
  if (!bust || !bust.complete) return;
  const art = scaledArt(bust, P_W, P_AH);
  if (!art) return;

  // the part not printed yet: a ghost, so the target is never a surprise
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.drawImage(art, P_LEFT, P_TOP);
  ctx.restore();

  const prog = clamp01((t - countStart(n)) / 0.44);
  const fill = clamp01((n - 1 + prog) / 6);
  const fillY = Math.round(P_CONTENT_TOP + P_CONTENT_H * (1 - fill));

  // the printed part
  ctx.save();
  ctx.beginPath();
  ctx.rect(P_LEFT, fillY, P_W, P_TOP + P_AH - fillY);
  ctx.clip();
  ctx.drawImage(art, P_LEFT, P_TOP);
  ctx.restore();

  // the scan edge: solid strips, registration ticks, and a little ink bleed
  ctx.fillStyle = "rgba(0,180,230,0.16)";
  ctx.fillRect(P_CONTENT_LEFT, fillY, P_CONTENT_W, 5);
  ctx.fillStyle = BLUE;
  ctx.fillRect(P_CONTENT_LEFT, fillY - 1, P_CONTENT_W, 2);
  ctx.fillStyle = PAPER;
  ctx.fillRect(P_CONTENT_LEFT, fillY + 1, P_CONTENT_W, 1);
  for (let i = 0; i < 7; i++) {
    const x = P_CONTENT_LEFT + Math.round(((i + 0.5) / 7) * P_CONTENT_W);
    ctx.fillStyle = i % 2 ? PAPER_MID : BLUE_DIM;
    ctx.fillRect(x, fillY - 7, 1, 14);
  }
  type(ctx, `PRINT ${String(n).padStart(2, "0")} / 06`, P_CONTENT_LEFT, fillY - 16, 12, PAPER_MID, "MV Mono");
  type(ctx, `${Math.round(fill * 100)}%`, P_CONTENT_LEFT + P_CONTENT_W, fillY - 16, 12, BLUE, "MV Mono", "right");

  // crop marks at the plate's content corners
  const c = "rgba(242,247,250,0.35)";
  const corners = [
    [P_CONTENT_LEFT, P_CONTENT_TOP, 1, 1],
    [P_CONTENT_LEFT + P_CONTENT_W, P_CONTENT_TOP, -1, 1],
    [P_CONTENT_LEFT, P_CONTENT_TOP + P_CONTENT_H, 1, -1],
    [P_CONTENT_LEFT + P_CONTENT_W, P_CONTENT_TOP + P_CONTENT_H, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    stroke(ctx, [[x, y], [x + 18 * sx, y]], c, 1);
    stroke(ctx, [[x, y], [x, y + 18 * sy]], c, 1);
  }
}

/** One pulse per call, ending at the same hollow port as every other call. */
function emptyPort(ctx, t, n) {
  const t0 = countStart(n);
  const pulse = clamp01((t - t0) / 0.30);
  const x0 = 700;
  const x1 = PORT.x - PORT.r - 8;
  const x = Math.round(mix(x0, x1, pulse));

  stroke(ctx, [[x0, PORT.y], [x1 + 6, PORT.y]], BLUE_FAINT, 1);
  stroke(ctx, [[x0, PORT.y], [x, PORT.y]], BLUE, 2);
  disc(ctx, x, PORT.y, 4, PAPER, 0.95);

  ctx.beginPath();
  ctx.arc(PORT.x, PORT.y, PORT.r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(242,247,250,0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PORT.x, PORT.y, PORT.r - 8, 0, Math.PI * 2);
  ctx.strokeStyle = BLUE_FAINT;
  ctx.lineWidth = 1;
  ctx.stroke();

  // one red short edge on the rim for every call that has landed here
  for (let j = 0; j < n; j++) {
    const a = -Math.PI / 2 + (j / 6) * Math.PI * 2;
    const ax0 = Math.round(PORT.x + Math.cos(a) * (PORT.r + 2));
    const ay0 = Math.round(PORT.y + Math.sin(a) * (PORT.r + 2));
    const ax1 = Math.round(PORT.x + Math.cos(a) * (PORT.r + 11));
    const ay1 = Math.round(PORT.y + Math.sin(a) * (PORT.r + 11));
    stroke(ctx, [[ax0, ay0], [ax1, ay1]], RED_EDGE, 2);
  }
  // the failed return: two pixels, the same rule as the rest of the film
  if (pulse >= 1) {
    stroke(ctx, [[PORT.x - PORT.r - 10, PORT.y], [PORT.x - PORT.r, PORT.y]], RED_EDGE, 2);
  }

  type(ctx, "NO RETURN", PORT.x, PORT.y + 54, 12, PAPER_DIM, "MV Mono", "center");
  type(ctx, "REPLIES 0", PORT.x, PORT.y + 74, 11, PAPER_DIM, "MV Mono", "center");
}

function countShot(n) {
  return (ctx, t) => {
    page(ctx);
    header(ctx, n);
    leftColumn(ctx, n);
    portraitFill(ctx, t, n);
    emptyPort(ctx, t, n);
    return {
      phase: "count",
      attempt: n,
      grade: { glow: 0.26, vignette: 0.30 },
    };
  };
}

// ---------------------------------------------------------------------------
// last shout: the word and the whale
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

function wordLayout(ctx) {
  const REF = 100;
  ctx.font = `400 ${REF}px "MV Sans"`;
  const w1 = ctx.measureText("EXECU").width;
  const w2 = ctx.measureText("TION").width;
  const size = Math.max(240, Math.min(520, Math.floor((1740 / Math.max(w1, w2)) * REF)));
  ctx.font = `400 ${size}px "MV Sans"`;
  const lineH = Math.round(size * 1.02);
  const cap = Math.round(size * 0.72);
  const blockH = cap + lineH;
  const base1 = Math.round(540 - blockH / 2 + cap);
  const base2 = base1 + lineH;
  return { size, base1, base2, cap, lineH };
}

/** The word as a mask: paper letters with the whale printed only inside them. */
function buildWordMask(t, s) {
  ensureMask();
  const g = maskG;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, 1920, 1080);
  const lay = wordLayout(g);
  g.font = `400 ${lay.size}px "MV Sans"`;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillStyle = PAPER;
  g.fillText("EXECU", 960, lay.base1);
  g.fillText("TION", 960, lay.base2);

  // The whale is source-atop: it only lands inside the letterforms, and the
  // rest of the letters stay paper.
  const age = t - s.at;
  const wx = 960 + Math.round(Math.sin(age * 1.55 + 0.6) * 300);
  const wy = 540 + Math.round(Math.cos(age * 1.15) * 150);
  g.save();
  g.globalCompositeOperation = "source-atop";
  drawWhale(g, wx, wy, 1260, { fillK: 1, color: BLUE, alpha: 1 });
  // a second, offset impression in cyan: the print is never perfectly in register
  drawWhale(g, wx + 14, wy - 9, 1120, { fillK: 1, color: BLUE, alpha: 0.22 });
  g.restore();
  return lay;
}

function backgroundWhale(ctx, t, s) {
  const age = t - s.at;
  const wx = 960 + Math.round(Math.sin(age * 0.75) * 210);
  const wy = 540 + Math.round(Math.cos(age * 0.55) * 120);
  drawWhale(ctx, wx, wy, 1720, { fillK: 1, color: BRAND, alpha: 0.10 });
  drawWhale(ctx, wx, wy, 1720, { strokeK: 1, color: BLUE, alpha: 0.16, lineWidth: 1.2 });
}

function glitchAt(t, s) {
  const age = t - s.at;
  let on = 0;
  for (const g of [0.24, 0.50]) {
    const d = age - g;
    if (d >= -0.01 && d <= 0.11) on = Math.max(on, 1 - Math.abs(d - 0.045) / 0.065);
  }
  on = clamp01(on);
  const frame = Math.floor(age * 60 / 2);
  const offs = [];
  for (let i = 0; i < 6; i++) offs.push(Math.round(Math.sin((i + 1) * 2.3 + frame * 1.7) * 11 * on));
  return { on, offs };
}

function lastShout(ctx, t, s) {
  page(ctx);
  backgroundWhale(ctx, t, s);

  const lay = buildWordMask(t, s);
  const age = t - s.at;

  // the slam on the cut: the word arrives larger and lands in a tenth of a second
  const slam = easeOut(clamp01(age / 0.11));
  const scale = mix(1.18, 1, slam);

  // the final out-of-register split, once the shout is over
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
    // the seam is a two-pixel boundary mark, not a red frame
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

  // registration crosses at the four corners stay on top of everything
  cross(ctx, 56, 56, PAPER_DIM);
  cross(ctx, 1864, 56, PAPER_DIM);
  cross(ctx, 56, 1024, PAPER_DIM);
  cross(ctx, 1864, 1024, PAPER_DIM);

  // The word owns the frame; the labels stay in the bottom margin so they do
  // not sit on a letter (the print has no room for a caption).
  type(ctx, "LAST SHOUT", 84, 1056, 12, PAPER_MID, "MV Mono");
  type(ctx, "REPLIES 0 / 06", 1836, 1056, 12, PAPER_MID, "MV Mono", "right");

  return { phase: "last-shout", word: [lay.base1, lay.base2, lay.size], glitch: Number(glitch.on.toFixed(2)), split: Number(split.toFixed(2)) };
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

// Kept for the storyboard/lyric plan: only these six shots use the panel form.
export const SECTION11_COUNT = countShots;
