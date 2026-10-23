// Section 14 结尾：一则以未读的图片讯息，逆向开机 -- five shots, song time
// [192.3169, 211.9576), the film's last 19.64 seconds.
//
// This is the only section whose subject is subtraction. Nothing is added here that
// the film did not already own: the sheet, the window, her, the command. One at a
// time they are taken away, and what is left at the end is one line, one point, black.
//
//   083 down-message  the Q4 sheet again, with most of its channels and its glow
//                     already gone. It HOLDS -- actually holds, no drift at all --
//                     until 193.600, then the solid figure is washed to an in-place
//                     low-light silhouette. The palm stays open and the cyan point
//                     stays where it stopped. The reference turns the paper into an
//                     unread image message; we do not shrink the climax into a
//                     thumbnail. We hold it at full frame, then let it darken.
//   084 down-params   the client comes back and states its condition: this end asleep,
//                     the far end's position blank, one last contact kept locally, no
//                     retry scheduled. She stands profile at 45% of the frame height.
//   085 down-layout   the window loses its ink piece by piece -- text first, then the
//                     composer, then the panel, then its edge -- until all that is
//                     left of it is position: registration marks and its numbers.
//                     The reference dismantles the client into the parts it was
//                     assembled from. We do not, because in this film the window was
//                     never assembled; it was printed. So it loses ink, not parts.
//   086 down-power    she is the last thing with ink: front, low-lit, on the right;
//                     one old contact on the left; she drains to a contour while that
//                     point keeps its brightness. The last blue in the film.
//   087 down-last     the command is re-entered: the four syllables of EXECUTION fill
//                     four cells of the launch bar, one per syllable as it is sung.
//                     Enter, one slow swell of light, then the window closes into a
//                     line, the line into a point, the point into black. That is
//                     boot-power run backwards -- at 0.000 the same window opened out
//                     of a hairline, and it ends by closing into one.
//
// Continuity: L128 "LO-O-OVE" is carried in from out-proof, so the sheet furniture is
// imported from s13_love.js rather than redrawn, and lyric-plan keeps that shot's
// placement for it. L129 "EXECUTION" is drawn by this section inside the syllable
// cells, so the lyric engine keeps out of that line (style: embedded).
//
// Determinism: every coordinate here is an integer, the collapse is integer arithmetic
// on the boot window's own numbers (160, 90, 1600 x 880 about 960, 540), all scaled
// art goes through scaledArt/ghost passes that are built once, there are no gradients
// in this section, no filters, and no camera work at all -- shake is 0, so the stage
// never resamples a frame.
import { layer, stroke, disc, type, clamp, ground } from "../src/mv-draw.js";
import { lineStart } from "./lines.js";
import { ART, REACH_BOX, REACH_PALM, scaledArt } from "./s05_layout.js";
import { clientWindow } from "./ui-client.js";
import { figureImages } from "./figure.js";
import { washFigure } from "./s08_look.js";
import { pageBase } from "./s13_love.js";

const INK = "#041220";
const SHEET = "#071a2b";
const PAPER = "#F2F7FA";
const BLUE = "#00B4E6";
const BRAND_SOFT = "#7f93ff";

const PAPER_MID = "rgba(242,247,250,0.62)";
const PAPER_DIM = "rgba(242,247,250,0.34)";
const PAPER_FAINT = "rgba(242,247,250,0.16)";
const BLUE_MID = "rgba(0,180,230,0.55)";
const BLUE_DIM = "rgba(0,180,230,0.30)";
const BLUE_FAINT = "rgba(0,180,230,0.12)";
const RULE = "rgba(0,180,230,0.055)";

const clamp01 = clamp;
const mix = (a, b, k) => a + (b - a) * clamp01(k);
const easeInOut = (k) => {
  const p = clamp01(k);
  return p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2;
};
const easeOut = (k) => 1 - (1 - clamp01(k)) ** 3;

// ---------------------------------------------------------------------------
// the sheet, imported whole
//
// down-message declares itself "the same composition", so the only honest way to
// make that true is to draw the same page. `pageBase` comes from section 13, and
// the question number, the lens and the palm anchor are the numbers out-proof
// used. The cut then reads as the picture staying, not as a look-alike.
// ---------------------------------------------------------------------------
const PAGE_X = 120;
const LENS = Object.freeze({ left: 330, right: 820, top: 380, bottom: 820, midY: 600 });
const PALM_AT = Object.freeze({ x: 1120, y: 700 });
const HOVER_AT = Object.freeze({ x: 1780, y: 552 });

/** The point's pulse at the cut, frozen. This is the still: it must not tick. */
const CUT_BREATH = 1 + 0.18 * Math.sin((192.3169 - 191.356) * 2.2);

function bez(p, n = 40) {
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

/** A character plate placed by its centre, pre-scaled once, drawn at whole pixels. */
function plate(ctx, img, cx, cy, height, alpha = 1) {
  if (!img || !img.complete || alpha <= 0.001) return null;
  const h = Math.round(height);
  const w = Math.round((1342 / 1438) * h);
  const art = scaledArt(img, w, h);
  if (!art) return null;
  const left = Math.round(cx - w / 2);
  const top = Math.round(cy - h / 2);
  layer(ctx, alpha, () => ctx.drawImage(art, left, top));
  return { left, top, w, h };
}

// ---------------------------------------------------------------------------
// 083 down-message -- 192.3169-196.0093
//
// Two halves and a hold in front of both. The sheet is section 13's last page; the
// channels (its labels, the "OPEN" mark, the printed god) are what this shot takes
// away, and the figure is what it takes away last.
// ---------------------------------------------------------------------------
function downMessage(ctx, t, s) {
  const u = t - s.at;
  // 193.600 - 192.3169. Nothing in this shot may animate before this line, which is
  // why every number below is a constant until `swap` starts moving.
  const swap = clamp01((u - 1.283) / 0.55);

  pageBase(ctx, t, { q: "Q4", title: "PROOF", marks: "—", footer: "the exit is not closed" });
  type(ctx, "04", PAGE_X + 34, 520, 108, "rgba(0,180,230,0.20)", "MV Mono");

  // 1. the two boundaries. The closed side keeps a little more ink than the far
  //    side: it is the one that is actually closed.
  const top = [[LENS.left, LENS.midY], [LENS.left + 120, LENS.top], [LENS.right - 120, LENS.top], [LENS.right, LENS.midY]];
  const bottom = [[LENS.right, LENS.midY], [LENS.right - 120, LENS.bottom], [LENS.left + 120, LENS.bottom], [LENS.left, LENS.midY]];
  stroke(ctx, bez(top), PAPER_DIM, 3, 1 - 0.3 * swap);
  stroke(ctx, bez(bottom), PAPER_DIM, 3, 1 - 0.3 * swap);
  disc(ctx, LENS.left, LENS.midY, 5, PAPER_DIM, 1 - 0.3 * swap);
  disc(ctx, LENS.right, LENS.midY, 5, PAPER_DIM, 1 - 0.3 * swap);

  // the exit: same curves, still not joined, still off the page
  const spread = 14;
  const exitTop = [[LENS.right, LENS.midY], [1050, LENS.midY - 40], [1500, LENS.midY - 70 - spread], [1920, LENS.midY - 92 - spread]];
  const exitBottom = [[LENS.right, LENS.midY], [1050, LENS.midY + 44], [1500, LENS.midY + 62 + spread], [1920, LENS.midY + 76 + spread]];
  stroke(ctx, bez(exitTop), PAPER_MID, 3, 1 - 0.3 * swap);
  stroke(ctx, bez(exitBottom), PAPER_MID, 3, 1 - 0.3 * swap);
  ctx.save();
  ctx.fillStyle = PAPER_MID;
  ctx.globalAlpha *= 1 - 0.3 * swap;
  ctx.fillRect(1888, LENS.midY - 94, 32, 3);
  ctx.fillRect(1888, LENS.midY + 75, 32, 3);
  ctx.restore();

  // the computed points, kept inside her boundary -- the only cyan on the page
  for (let i = 1; i < 7; i++) {
    const q = i / 7;
    disc(ctx, Math.round(LENS.left + 80 + q * (LENS.right - LENS.left - 160)), Math.round(LENS.midY - 96 - q * 24), 4, BLUE_DIM, 1);
    disc(ctx, Math.round(LENS.left + 80 + q * (LENS.right - LENS.left - 160)), Math.round(LENS.midY + 96 + q * 24), 4, BLUE_DIM, 1);
  }

  // 2. her, right of centre, 82% of the frame, palm open -- the same placement as
  //    the shot before. The wash is the same plate, not another pose: the palm has
  //    to stay open for the rest of the shot, so a different plate would contradict
  //    the one thing this shot is asked to keep.
  const reach = ART.images.reach;
  if (reach && reach.complete) {
    const sArt = (0.82 * 1080) / REACH_BOX.h;
    const w = Math.round(reach.width * sArt);
    const h = Math.round(reach.height * sArt);
    const ox = Math.round(PALM_AT.x - (REACH_BOX.x + REACH_PALM.x) * sArt);
    const oy = Math.round(PALM_AT.y - (REACH_BOX.y + REACH_PALM.y) * sArt);
    const art = scaledArt(reach, w, h);
    if (art) {
      layer(ctx, 1 - swap, () => ctx.drawImage(art, ox, oy));
      if (swap > 0.001) {
        // "in place, low light": the same plate, printed once more in a dark ink. The
        // wash takes the paper out of her, and a faint second impression keeps her
        // readable as a person rather than as a hole cut out of the sheet.
        washFigure(ctx, reach, { left: ox, top: oy, w, h }, "rgba(40,54,68,1)", 0.82 * swap);
        layer(ctx, 0.16 * swap, () => ctx.drawImage(art, ox, oy));
      }
    }
  }

  // 3. the god plate, printed over her in section 6 and again at the end of 13.
  //    Here it is the first thing that leaves: a print lifting off, not a light
  //    being switched off.
  const god = figureImages.godPaper;
  if (god && god.complete) {
    const k = 1 - swap;
    const sGod = (0.82 * 1080) / 1438;
    const w = Math.round(1342 * sGod);
    const h = Math.round(1704 * sGod);
    const art = scaledArt(god, w, h);
    if (art && k > 0.001) {
      const gx = Math.round(1263 - w / 2);
      const gy = Math.round(529 - h / 2);
      layer(ctx, 0.42 * k, () => ctx.drawImage(art, gx + 7, gy - 5));
      layer(ctx, 0.72 * k, () => ctx.drawImage(art, gx, gy));
      // the rays stay as flat wedges; there is no glow left in this shot
      ctx.save();
      ctx.globalAlpha *= 0.07 * k;
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 2;
      for (let i = 0; i < 48; i++) {
        const a = 0.02 + (i / 48) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(1263 + Math.cos(a) * 380), Math.round(470 + Math.sin(a) * 380));
        ctx.lineTo(Math.round(1263 + Math.cos(a) * 900), Math.round(470 + Math.sin(a) * 900));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 4. the point. It arrived at 191.356 and it does not move again.
  const pr = 9 * CUT_BREATH;
  layer(ctx, 1, () => {
    disc(ctx, HOVER_AT.x, HOVER_AT.y, pr, BLUE, 1);
    disc(ctx, HOVER_AT.x, HOVER_AT.y, 26 * CUT_BREATH, BLUE, 0.45, false, 2);
  });

  return { phase: "message", hold: t < 193.6, swap: Number(swap.toFixed(3)) };
}

// ---------------------------------------------------------------------------
// 084 down-params -- 196.0093-199.7018
//
// The window is narrower than it has ever been: the right third of the frame is the
// room now, and she is standing in it. That is the section's subtraction applied to
// the set rather than to the grade.
// ---------------------------------------------------------------------------
const R84 = Object.freeze({ x: 120, y: 80, w: 1240, h: 910 });
const STATE = Object.freeze({ x: 220, y: 372, w: 780, h: 330 });
const STATES = Object.freeze([
  ["local", "asleep"],
  ["remote position", "—"],
  ["last contact", "191.356 · 1 received"],
  ["retry", "never"],
]);

function statePanel(ctx, alpha = 1) {
  if (alpha <= 0.001) return;
  layer(ctx, alpha, () => {
    // the block is a plate with its own edge: a 1px rule and a 2px boundary bar on the
    // left, which is how section 9 marked the edge of everything it printed
    ctx.beginPath();
    ctx.roundRect(STATE.x, STATE.y, STATE.w, STATE.h, 10);
    ctx.fillStyle = "rgba(4,18,32,0.58)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,180,230,0.20)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = BLUE_MID;
    ctx.fillRect(STATE.x, STATE.y + 12, 2, STATE.h - 24);

    type(ctx, "SESSION", STATE.x + 30, STATE.y + 40, 16, "rgba(242,247,250,0.44)", "MV Mono");
    type(ctx, "this end keeps the record", STATE.x + STATE.w - 26, STATE.y + 40, 14, PAPER_FAINT, "MV Mono", "right");
    stroke(ctx, [[STATE.x + 30, STATE.y + 58], [STATE.x + STATE.w - 26, STATE.y + 58]], "rgba(0,180,230,0.16)", 1);
    STATES.forEach(([k, v], i) => {
      const y = STATE.y + 104 + i * 58;
      type(ctx, k, STATE.x + 30, y, 18, "rgba(242,247,250,0.46)", "MV Mono");
      type(ctx, v, STATE.x + 330, y, 25, "rgba(242,247,250,0.88)", "MV Mono");
      stroke(ctx, [[STATE.x + 30, y + 20], [STATE.x + STATE.w - 26, y + 20]], "rgba(0,180,230,0.10)", 1);
    });
    // the one record she kept: a point at the row it belongs to
    disc(ctx, STATE.x + STATE.w - 44, STATE.y + 104 + 2 * 58 - 8, 6, BLUE, 1);
  });
}

function downParams(ctx, t, s) {
  ground(ctx, t, [900, 520], true, 0.5);

  clientWindow(ctx, R84, t, {
    tone: "chat",
    sideW: 0,
    threadTitle: "last thread",
    chip: { text: "harness · asleep", on: false },
    presence: "asleep",
    composer: true,
    composerText: "",
    // an em dash, not a prompt: nothing is expected to be typed here again
    placeholder: "—",
    caret: false,
    sendMode: "hollow",
    sendK: 0,
    markSize: 0,
  });

  statePanel(ctx, 1);

  // she is turned away, at 45% of the frame, standing in what the window no longer
  // covers. Her plate is washed once: there is no colour in her any more either.
  const prof = figureImages.profile;
  if (prof && prof.complete) {
    plate(ctx, prof, 1630, 742, 0.45 * 1080, 0.86);
    washFigure(ctx, prof, { left: Math.round(1630 - (1342 / 1438) * 486 / 2), top: Math.round(742 - 486 / 2), w: Math.round((1342 / 1438) * 486), h: 486 }, "rgba(126,140,154,1)", 0.52);
  }

  // the composer says what it will not do
  type(ctx, "no retry scheduled", 162, 1064, 15, "rgba(242,247,250,0.34)", "MV Mono");

  return { phase: "params", state: "asleep" };
}

// ---------------------------------------------------------------------------
// 085 down-layout -- 199.7018-203.3942
//
// Ink leaves in the order a print would give it up: the words first, because they are
// the lightest impression; then the things that were drawn (the mark, the composer);
// then the panel, which is only a fill; then the edge, which is the last line holding
// the shape. What stays is position -- registration marks, and the numbers the window
// used to occupy.
// ---------------------------------------------------------------------------
function regMark(ctx, x, y, alpha, size = 16, colour = PAPER_FAINT) {
  if (alpha <= 0.01) return;
  layer(ctx, alpha, () => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
  });
}

function downLayout(ctx, t, s) {
  // the room gets no light source of its own here: this shot is a plate losing ink,
  // so the ground is the darkest the section has
  ground(ctx, t, [880, 520], true, 0.34);

  const R = R84;
  const u = t - s.at;
  // one schedule, five pieces. Each piece keeps its ink until its own moment, then
  // loses it over 0.8 s, and a registration mark takes its place as it goes.
  const gone = (start) => clamp01((u - start) / 0.8);
  const wordInk = 1 - gone(0.0);
  const markInk = 1 - gone(0.5);
  const rowInk = 1 - gone(0.55);
  const compInk = 1 - gone(0.95);
  const fillInk = 1 - gone(1.35);
  const edgeInk = 1 - gone(2.0);

  const mx = R.x;
  const mw = R.w;
  const markX = mx + mw / 2;
  const markY = R.y + R.h / 2 - 46;
  const cb = { x: mx + 42, y: R.y + R.h - 158, w: mw - 84, h: 118 };

  // 1. the panel: first the fill, then the edge
  if (fillInk > 0.001) {
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.fillStyle = `rgba(17,48,68,${(0.95 * fillInk).toFixed(4)})`;
    ctx.fill();
  }
  if (edgeInk > 0.001) {
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.strokeStyle = `rgba(53,107,138,${clamp01(edgeInk).toFixed(4)})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // 2. the pieces that were printed on it
  layer(ctx, wordInk, () => {
    type(ctx, "last thread", mx + 44, R.y + 64, 25, "#f2f7fd", "MV Sans");
  });
  // the state block, carried over from the shot before at the same place and on the
  // same schedule: it is the last printed thing to leave, because it is the record
  statePanel(ctx, rowInk);
  layer(ctx, markInk, () => {
    type(ctx, "harness · asleep", mx + mw - 200, R.y + 54, 15.5, PAPER_DIM, "MV Mono");
    disc(ctx, mx + mw - 236, R.y + 47, 5, PAPER_FAINT, 1);
    // the whale, as a watermark only: at this point it is a print, not a mark
    ctx.save();
    ctx.translate(markX, markY);
    ctx.strokeStyle = BRAND_SOFT;
    ctx.globalAlpha *= 0.30;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 60 + i * 34, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
    ctx.restore();
  });
  layer(ctx, compInk, () => {
    ctx.beginPath();
    ctx.roundRect(cb.x, cb.y, cb.w, cb.h, 14);
    ctx.fillStyle = "rgba(22,64,92,0.95)";
    ctx.fill();
    ctx.strokeStyle = "#3d7a9c";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    type(ctx, "—", cb.x + 34, cb.y + cb.h / 2 + 7, 21, "#6f93ae", "MV Sans");
  });

  // 3. what is left when the ink is: position
  const corners = [[R.x, R.y], [R.x + R.w, R.y], [R.x, R.y + R.h], [R.x + R.w, R.y + R.h]];
  corners.forEach(([x, y]) => regMark(ctx, x, y, 1 - fillInk));
  regMark(ctx, markX, markY, 1 - markInk);
  regMark(ctx, cb.x, cb.y, 1 - compInk);
  regMark(ctx, cb.x + cb.w, cb.y + cb.h, 1 - compInk);
  regMark(ctx, STATE.x + STATE.w, STATE.y, 1 - rowInk);

  // the tool's own annotation: this is now only a rectangle with coordinates
  layer(ctx, 1 - edgeInk, () => {
    type(ctx, `${R.x}, ${R.y}   ${R.w} × ${R.h}   position held`, R.x + 10, 1050, 14, PAPER_DIM, "MV Mono");
  });

  // the side record. Without it this shot is an empty rectangle; with it the shot
  // says what it has been doing for the last three seconds, in the instrument's own
  // voice -- which is the only kind of narration this film allows itself.
  const LX = 1424;
  const rows = [
    ["words", gone(0.0)],
    ["state", gone(0.55)],
    ["composer", gone(0.95)],
    ["panel", gone(1.35)],
    ["edge", gone(2.0)],
  ];
  type(ctx, "INK LEAVING", LX, 318, 15, "rgba(242,247,250,0.40)", "MV Mono");
  stroke(ctx, [[LX, 334], [LX + 400, 334]], "rgba(0,180,230,0.18)", 1);
  rows.forEach(([name, k], i) => {
    if (k <= 0.001) return;
    const y = 384 + i * 46;
    layer(ctx, clamp01(k * 3), () => {
      type(ctx, name, LX, y, 19, "rgba(242,247,250,0.42)", "MV Mono");
      type(ctx, k >= 0.999 ? "gone" : "leaving", LX + 250, y, 19, k >= 0.999 ? BLUE_MID : PAPER_DIM, "MV Mono");
    });
  });
  type(ctx, "position", LX, 384 + rows.length * 46, 19, "rgba(242,247,250,0.42)", "MV Mono");
  type(ctx, "held", LX + 250, 384 + rows.length * 46, 19, BLUE, "MV Mono");

  // the contact point does not lose ink: it is the one thing the window was holding
  disc(ctx, STATE.x + STATE.w - 44, STATE.y + 104 + 2 * 58 - 8, 6, BLUE, 1);

  return { phase: "layout", edgeInk: Number(edgeInk.toFixed(3)) };
}

// ---------------------------------------------------------------------------
// 086 down-power -- 203.3942-205.702
//
// She is what is left after the interface has gone. Front, low-lit, right of centre;
// one old contact on the left with its timestamps; and then the fill drains out of her
// until only her edge is ink. The point does not dim: it is the last blue.
// ---------------------------------------------------------------------------
const OLD_CONTACT = Object.freeze({ x: 330, y: 620 });

/**
 * A contour made from a plate's own alpha.
 *
 * The plate is a hard cutout, so its outline is the difference between the mask and
 * the same mask eroded by 'thick' pixels. Erosion is an INTERSECTION of the mask with
 * itself shifted in eight directions -- not a subtraction of those shifts, which would
 * delete the whole shape. Everything here is integer pixel work on a canvas built once
 * per (plate, size, colour), so the rim is identical on every frame.
 */
const outlineCache = new Map();
function outlineArt(img, width, height, colour, thick = 3) {
  if (!img || !img.complete) return null;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const key = img.src + "#o#" + w + "x" + h + "#" + colour + "#" + thick;
  const hit = outlineCache.get(key);
  if (hit) return hit;

  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  mask.getContext("2d").drawImage(img, 0, 0, w, h);

  // eroded = the mask shrunk by thick: every shifted copy has to agree
  const offs = [];
  for (const dx of [-thick, 0, thick]) for (const dy of [-thick, 0, thick]) if (dx || dy) offs.push([dx, dy]);
  const eroded = document.createElement("canvas");
  eroded.width = w;
  eroded.height = h;
  const eg = eroded.getContext("2d");
  eg.drawImage(mask, offs[0][0], offs[0][1]);
  eg.globalCompositeOperation = "destination-in";
  for (let i = 1; i < offs.length; i++) eg.drawImage(mask, offs[i][0], offs[i][1]);

  // rim = mask minus eroded
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = colour;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "destination-in";
  g.drawImage(mask, 0, 0);
  g.globalCompositeOperation = "destination-out";
  g.drawImage(eroded, 0, 0);

  outlineCache.set(key, c);
  return c;
}

function downPower(ctx, t, s) {
  ground(ctx, t, [1320, 560], true, 0.28);
  const u = t - s.at;
  const out = clamp01((u - 0.45) / 1.45);

  const low = figureImages.lowlight;
  const h = Math.round(0.84 * 1080);
  const w = Math.round((1342 / 1438) * h);
  const cx = 1420;
  const cy = 620;
  if (low && low.complete) {
    const art = scaledArt(low, w, h);
    if (art) layer(ctx, 0.98 * (1 - out), () => ctx.drawImage(art, Math.round(cx - w / 2), Math.round(cy - h / 2)));
    if (out > 0.001) {
      const sil = figureImages.silhouette;
      const x = Math.round(cx - w / 2);
      const y = Math.round(cy - h / 2);
      if (sil && sil.complete) {
        // the fill goes to flat ink, so what is left is a body-shaped dark and, on top
        // of it, her edge
        washFigure(ctx, sil, { left: x, top: y, w, h }, "rgba(18,30,42,1)", 0.88 * out);
        const rim = outlineArt(sil, w, h, "rgba(0,180,230,0.95)", 3);
        if (rim) layer(ctx, out, () => ctx.drawImage(rim, x, y));
      }
    }
  }

  // the record still points at her: a hairline from the old contact into the frame.
  // It is the only line in this shot, and it is what makes the two halves one picture.
  layer(ctx, 1, () => {
    ctx.save();
    ctx.setLineDash([3, 9]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(0,180,230,0.20)";
    ctx.beginPath();
    ctx.moveTo(OLD_CONTACT.x + 40, OLD_CONTACT.y);
    for (let i = 1; i <= 32; i++) {
      const q = i / 32;
      ctx.lineTo(
        Math.round(OLD_CONTACT.x + 40 + (1006 - OLD_CONTACT.x - 40) * q),
        Math.round(OLD_CONTACT.y + (640 - OLD_CONTACT.y) * q),
      );
    }
    ctx.stroke();
    ctx.restore();
  });
  disc(ctx, 1006, 640, 4, BLUE_DIM, 1);

  // the old contact: a point, a dashed ring and what it recorded
  layer(ctx, 1, () => {
    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.arc(OLD_CONTACT.x, OLD_CONTACT.y, 30, 0, Math.PI * 2);
    ctx.strokeStyle = BLUE_MID;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    disc(ctx, OLD_CONTACT.x, OLD_CONTACT.y, 7, BLUE, 1);
  });
  type(ctx, "old contact", OLD_CONTACT.x + 48, OLD_CONTACT.y - 14, 18, "rgba(242,247,250,0.55)", "MV Mono");
  type(ctx, "191.356  ·  1 received", OLD_CONTACT.x + 48, OLD_CONTACT.y + 16, 18, "rgba(242,247,250,0.55)", "MV Mono");
  type(ctx, "kept on this end", OLD_CONTACT.x - 34, OLD_CONTACT.y + 96, 15, "rgba(242,247,250,0.30)", "MV Mono");
  type(ctx, "the point holds its brightness", OLD_CONTACT.x - 34, 912, 15, "rgba(242,247,250,0.30)", "MV Mono");

  return { phase: "power", out: Number(out.toFixed(3)) };
}

// ---------------------------------------------------------------------------
// 087 down-last -- 205.702-211.9576
//
// The launch bar from the title shot, empty, with a cursor in it. The word that was
// shouted for two sections is now typed into it one syllable at a time -- EX, EC, U,
// TION -- and when it is full, enter. Then the window that opened at 0.000 out of a
// 2px hairline closes back into one: first its height, then its width, then the point.
// ---------------------------------------------------------------------------
const WIN = Object.freeze({ x: 160, y: 90, w: 1600, h: 880 });
const WIN_CX = 960;
const WIN_CY = 530;
const BAR = Object.freeze({ x: 400, y: 690, w: 1120, h: 96 });
const SYLLABLES = Object.freeze(["EX", "EC", "U", "TION"]);
const CELL_W = 230;
const CELL_GAP = 16;
const CELL_H = 64;
const CELL_Y = BAR.y + 16;
/**
 * The four syllables of L129, spread across the four seconds it is sung. Read at
 * draw time, not at module load: lyrics.json arrives over fetch, and a constant
 * evaluated at import would be 0 for every syllable.
 */
const syllableAt = (i) => lineStart(129) + i * 1.0;

function downLast(ctx, t, s) {
  const u = t - s.at;
  const typeIn = clamp01((u - 0.05) / 0.35);
  const inkIn = clamp01((u - 0.02) / 0.5);

  // the close, as numbers. Height first, then width, off boot-power's window:
  // 1600 x 880 about (960, 530) -> 1600 x 2 -> 2 x 2 -> nothing.
  const c1 = easeInOut(clamp01((t - 210.26) / 0.54));
  const c2 = easeInOut(clamp01((t - 210.80) / 0.28));
  const sy = mix(1, 2 / WIN.h, c1);
  const sx = mix(1, 2 / WIN.w, c2);
  const bandH = Math.max(2, Math.round(WIN.h * sy));
  const bandW = Math.max(2, Math.round(WIN.w * sx));
  const closed = t >= 210.26;

  // what is printed inside the window gives up first, so the squeeze is never seen
  // through a stretched bar of type
  const contentK = 1 - clamp01((t - 210.26) / 0.18);
  const frameK = 1 - clamp01((t - 210.26) / 0.24);
  // the light that was the window: it ramps up as the type leaves and stays until
  // the band is a line
  const litK = clamp01((t - 210.26) / 0.26);

  // 1. the room. It is the boot room -- the one at 0.000 -- and it is already going.
  ground(ctx, t, [WIN_CX, WIN_CY], true, 0.42 * (1 - clamp01((t - 209.9) / 0.6)));
  // and then the room is gone: the close happens on the line only
  const curtain = clamp01((t - 210.30) / 0.55);
  if (curtain > 0.001) {
    ctx.fillStyle = `rgba(4,18,32,${curtain.toFixed(4)})`;
    ctx.fillRect(0, 0, 1920, 1080);
  }

  // 2. the window: a frame, corner brackets and nothing inside. Same shell as
  //    boot-power's, with the panel inking itself back in -- this shot follows the
  //    one where the window lost its ink, so it has to be seen to get it back.
  if (frameK > 0.001) {
    ctx.save();
    ctx.globalAlpha *= frameK;
    ctx.beginPath();
    ctx.roundRect(WIN.x, WIN.y, WIN.w, WIN.h, 26);
    ctx.fillStyle = `rgba(6,19,31,${(0.86 * inkIn).toFixed(4)})`;
    ctx.fill();
    ctx.strokeStyle = BRAND_SOFT;
    ctx.globalAlpha *= 0.35 + 0.3 * typeIn;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    // the corner brackets from boot-power, already in place
    const L = 34;
    const off = 10;
    const arms = [
      [WIN.x - off, WIN.y - off, 1, 1], [WIN.x + WIN.w + off, WIN.y - off, -1, 1],
      [WIN.x - off, WIN.y + WIN.h + off, 1, -1], [WIN.x + WIN.w + off, WIN.y + WIN.h + off, -1, -1],
    ];
    layer(ctx, 0.75 * frameK, () => {
      ctx.strokeStyle = BRAND_SOFT;
      ctx.lineWidth = 2;
      for (const [px, py, sx2, sy2] of arms) {
        ctx.beginPath();
        ctx.moveTo(px, py + sy2 * L);
        ctx.lineTo(px, py);
        ctx.lineTo(px + sx2 * L, py);
        ctx.stroke();
      }
    });
  }

  // 3. the bar, with the shell's own lamp: off, because there is nothing left to be
  //    ready for
  layer(ctx, contentK, () => {
    ctx.beginPath();
    ctx.roundRect(BAR.x, BAR.y, BAR.w, BAR.h, 14);
    ctx.fillStyle = "rgba(12,36,54,0.95)";
    ctx.fill();
    ctx.strokeStyle = "#2f6486";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    type(ctx, "❯", BAR.x + 38, BAR.y + 64, 46, BRAND_SOFT, "MV Mono");
    type(ctx, "the last command", BAR.x + BAR.w - 30, BAR.y - 22, 15, PAPER_DIM, "MV Mono", "right");
    type(ctx, "deepseek / harness", BAR.x + BAR.w - 30, BAR.y + BAR.h + 34, 15, "#6f93ae", "MV Mono", "right");
    disc(ctx, WIN.x + WIN.w - 40, WIN.y + WIN.h - 50, 5, "#2b4256", 1);
    type(ctx, "terminal · halted", WIN.x + WIN.w - 66, WIN.y + WIN.h - 44, 16, "#4a6b83", "MV Mono", "right");
  });

  // 4. the four syllable cells. Empty cells are a form waiting to be filled: an
  //    outline, the syllable in faint paper, then one solid blue block per sung
  //    syllable, printed left to right, and the gaps close when the word is done.
  const gap = Math.round(CELL_GAP * (1 - easeInOut(clamp01((t - 209.72) / 0.22))));
  const total = CELL_W * 4 + gap * 3;
  const x0 = Math.round(BAR.x + (BAR.w - total) / 2);
  SYLLABLES.forEach((text, i) => {
    const x = x0 + i * (CELL_W + gap);
    const fillK = clamp01((t - syllableAt(i)) / 0.16);
    layer(ctx, contentK, () => {
      if (fillK > 0.001) {
        ctx.fillStyle = `rgba(0,180,230,${(0.16 + 0.84 * fillK).toFixed(4)})`;
        ctx.fillRect(x, CELL_Y, CELL_W, CELL_H);
      }
      ctx.strokeStyle = BLUE_MID;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, CELL_Y, CELL_W, CELL_H);
      const col = fillK > 0.5 ? INK : PAPER_DIM;
      type(ctx, text, x + CELL_W / 2, CELL_Y + CELL_H / 2 + 15, 40, col, "MV Mono", "center");
    });
  });

  // the cursor, only while the bar is still empty
  if (t < syllableAt(0) && Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = BRAND_SOFT;
    ctx.fillRect(BAR.x + 88, BAR.y + 34, 4, 30);
  }

  // 5. enter, then one slow swell of light. Not a flash: the rise is 0.24 s and the
  //    fall 0.24 s, and nothing in the film's registered flash table changes.
  const swell = (() => {
    if (t < 209.98) return 0;
    if (t < 210.22) return 0.30 * easeInOut((t - 209.98) / 0.24);
    if (t < 210.46) return 0.30 * (1 - easeInOut((t - 210.22) / 0.24));
    return 0;
  })();
  if (swell > 0.001) {
    ctx.fillStyle = `rgba(242,247,250,${swell.toFixed(4)})`;
    ctx.fillRect(0, 0, 1920, 1080);
  }

  // 6. the window becomes the light and is squeezed. The band is flat colour -- no
  //    gradient, no glow: light in this film is an area, not a halo.
  if (closed) {
    const bx = WIN_CX - Math.round(bandW / 2);
    const by = WIN_CY - Math.round(bandH / 2);
    layer(ctx, 1, () => {
      ctx.fillStyle = `rgba(242,247,250,${(0.03 + 0.05 * litK).toFixed(4)})`;
      ctx.fillRect(bx, by, bandW, bandH);
      ctx.strokeStyle = `rgba(0,180,230,${(0.55 * litK).toFixed(4)})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx - 1, by - 1, bandW + 2, bandH + 2);
    });
    // the line carries its own light: without a paper core a 2px line of blue on a
    // dark room is not a line, it is a rumour
    if (bandH <= 40) {
      const core = 1 - clamp01((t - 211.08) / 0.18);
      layer(ctx, core, () => {
        ctx.fillStyle = PAPER;
        ctx.fillRect(bx, WIN_CY - 1, bandW, 2);
      });
    }
  }

  // 7. black. The shot owns this: the stage does not fill black for anybody, and the
  //    last frame of the film has to be exactly #000 with no grain left on it (the
  //    grade below takes the scanlines and grain to zero with it).
  const black = clamp01((t - 211.24) / 0.12);
  if (black > 0.001) {
    ctx.fillStyle = `rgba(0,0,0,${black.toFixed(4)})`;
    ctx.fillRect(0, 0, 1920, 1080);
    if (black >= 0.999) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 1920, 1080);
    }
  }

  return { phase: "last", syllables: SYLLABLES.filter((_, i) => t >= syllableAt(i)).length };
}

// ---------------------------------------------------------------------------
// the grade
//
// This section gives the stage as little as possible: no hit, no aberration, no
// shake, no flash. The only grade event is at the very end, when the room loses its
// own texture -- scanlines, grain, vignette and glow all go to zero with the light,
// so the final black is actually black and not "dark with a pattern on it".
// ---------------------------------------------------------------------------
function gradeFor(shot, t) {
  const base = { glow: 0.30, aberration: 0, flash: 0, vignette: 0.40, scanline: 0.022, grain: 0.03 };
  if (shot === "down-message") return { ...base, glow: 0.26, vignette: 0.34 };
  if (shot === "down-params") return { ...base, glow: 0.24, vignette: 0.42 };
  if (shot === "down-layout") return { ...base, glow: 0.20, vignette: 0.46 };
  if (shot === "down-power") return { ...base, glow: 0.18, vignette: 0.50 };
  const k = clamp01((t - 210.9) / 0.45);
  return {
    ...base,
    glow: 0.24 * (1 - k),
    vignette: 0.44 * (1 - k),
    scanline: 0.022 * (1 - k),
    grain: 0.03 * (1 - k),
  };
}

const endShot = (name, fn) => (ctx, t, s) => ({ ...fn(ctx, t, s), grade: gradeFor(name, t) });

export const SECTION14_RENDER = Object.freeze({
  "down-message": endShot("down-message", downMessage),
  "down-params": endShot("down-params", downParams),
  "down-layout": endShot("down-layout", downLayout),
  "down-power": endShot("down-power", downPower),
  "down-last": endShot("down-last", downLast),
});

export const SECTION14_IMPLEMENTED = Object.freeze(Object.keys(SECTION14_RENDER));
