// Section 11 数数与最后一声 -- seven shots, song time [159.085, 162.777).
//
// Six of the seven shots are one beat each. They are NOT six full-screen
// language cards: they are the same probe panel, one channel lit per beat, the
// attempt counter climbing 1..6, and every channel terminating at the same
// empty port. The language word is printed as that channel's label, not as a
// caption: at 0.46 s there is no time for an entrance, so the word is complete
// on the first frame and only the channel lights.
//
// The seventh shot is the exception: the last shout is not a language. The
// panel gives way to her face -- a 1050 px plate, 80% of the frame tall, no
// letter cutouts -- with a vertical column of water-light in front of the eye
// and the one point that never returned reflected in it.
//
// Continuity: section 10 ended on a closed red port. It becomes attempt tick 1
// on this panel; the red is back to being a boundary mark (2 px tick, 2 px
// edge), not a field.
//
// Determinism: the panel is a fixed layout with integer coordinates; the six
// channels are a loop, not six hand-written paths. The eye plate is pre-scaled
// once with scaledArt (a 1510px plate drawn at 1051px every frame is exactly
// the kind of downscaling that reads back one value different), then blitted at
// an integer position. No gradients, no per-frame randomness.
import { stroke, disc, type, clamp, mix } from "../src/mv-draw.js";
import { lineStart, lineText } from "./lines.js";
import { S08_ART } from "./s08_look.js";
import { scaledArt } from "./s05_layout.js";

const INK = "#041220";
const BLUE = "#00B4E6";
const PAPER = "#F2F7FA";
const RED = "#e75d69";

const RED_EDGE = "rgba(231,93,105,0.92)";
const DIM = "rgba(0,180,230,0.30)";
const FAINT = "rgba(0,180,230,0.12)";
const PAST = "rgba(0,180,230,0.42)";
const PAPER_DIM = "rgba(242,247,250,0.34)";
const PAPER_MID = "rgba(242,247,250,0.62)";

// The panel. Rows are 92 px apart, so six channels and their labels fit above
// the fold with the counter in the corner.
const ROWS = Object.freeze([282, 382, 482, 582, 682, 782]);
const BUS_X = 250; // where the six channels leave the machine
const COL_X = 1470; // where they merge
const END_X = 1728; // the one empty port
const END_Y = 532;
const END_R = 30;
const LANGS = Object.freeze(["DE", "ES", "FR", "KO", "SV", "ZH"]);

const COUNT_INDEX = Object.freeze({
  "count-1-de": 1,
  "count-2-es": 2,
  "count-3-fr": 3,
  "count-4-ko": 4,
  "count-5-sv": 5,
  "count-6-zh": 6,
});

// The lyric line that owns a count shot, so every cue is the singer's clock.
const countLine = (n) => 98 + n; // 99..104
const countStart = (n) => lineStart(countLine(n));

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
  type(ctx, `REPLIES 0 / ${String(n).padStart(2, "0")}`, 1808, 110, 24, PAPER, "MV Mono", "right");
  type(ctx, "every channel ends at the same port", 1808, 136, 12, PAPER_DIM, "MV Mono", "right");
}

/** The count: a strip of six attempt marks and one numeral in the corner. */
function counter(ctx, n) {
  type(ctx, "ATTEMPT", 1808, 862, 12, BLUE, "MV Mono", "right");
  type(ctx, String(n).padStart(2, "0"), 1808, 918, 58, PAPER, "MV Mono", "right");
  type(ctx, "/ 06", 1808, 942, 16, PAPER_DIM, "MV Mono", "right");

  const x0 = 1526;
  const gap = 46;
  const y = 966;
  for (let i = 0; i < 6; i++) {
    const x = x0 + i * gap;
    const active = i + 1 === n;
    const done = i + 1 < n;
    if (i === 0) {
      // Section 10's closed port becomes the first tick. It is a ring, not a
      // filled square, because the port was closed and never replied.
      ctx.beginPath();
      ctx.arc(x + 14, y + 14, 13, 0, Math.PI * 2);
      ctx.strokeStyle = RED;
      ctx.lineWidth = active ? 3 : 2;
      ctx.stroke();
      type(ctx, "1", x + 14, y + 19, 14, active ? PAPER : PAPER_DIM, "MV Mono", "center");
      continue;
    }
    ctx.strokeStyle = active ? BLUE : done ? "rgba(0,180,230,0.55)" : FAINT;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 28, 28);
    if (active) {
      ctx.fillStyle = BLUE;
      ctx.fillRect(x + 2, y + 2, 24, 24);
    }
    type(
      ctx,
      String(i + 1),
      x + 14,
      y + 19,
      14,
      active ? INK : done ? PAPER_MID : PAPER_DIM,
      "MV Mono",
      "center",
    );
  }
}

// ---------------------------------------------------------------------------
// the probe panel: six channels, one shared empty port
// ---------------------------------------------------------------------------
function endpoint(ctx, n, activeImpact) {
  // the port itself: hollow, always hollow
  ctx.beginPath();
  ctx.arc(END_X, END_Y, END_R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(242,247,250,0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(END_X, END_Y, END_R - 8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,180,230,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // one red tick on the rim for every attempt that has landed
  for (let j = 0; j < n; j++) {
    const a = -Math.PI / 2 + (j / 6) * Math.PI * 2;
    const x0 = Math.round(END_X + Math.cos(a) * (END_R + 2));
    const y0 = Math.round(END_Y + Math.sin(a) * (END_R + 2));
    const x1 = Math.round(END_X + Math.cos(a) * (END_R + 11));
    const y1 = Math.round(END_Y + Math.sin(a) * (END_R + 11));
    stroke(ctx, [[x0, y0], [x1, y1]], RED_EDGE, 2);
  }

  // the active impact: a thin paper ripple, then it is gone
  if (activeImpact > 0) {
    ctx.beginPath();
    ctx.arc(END_X, END_Y, END_R + Math.round(30 * activeImpact), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(242,247,250,${(0.55 * (1 - activeImpact)).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  type(ctx, "NO RETURN", END_X, END_Y + 58, 14, PAPER_MID, "MV Mono", "center");
  type(ctx, "0 / 6", END_X, END_Y + 80, 12, PAPER_DIM, "MV Mono", "center");
}

function channelWord(ctx, n, y, active, done) {
  const text = lineText(countLine(n));
  const colour = active ? PAPER : done ? "rgba(242,247,250,0.46)" : "rgba(242,247,250,0.22)";
  type(ctx, String(n).padStart(2, "0"), 278, y - 20, 14, active ? BLUE : done ? PAPER_DIM : FAINT, "MV Mono");
  type(ctx, LANGS[n - 1], 312, y - 20, 11, active ? BLUE : done ? PAPER_DIM : FAINT, "MV Mono");
  type(ctx, text, 350, y - 20, 56, colour, "MV Serif");
}

function probePanel(ctx, t, n) {
  page(ctx);
  header(ctx, n);

  // the machine bus and the collector
  stroke(ctx, [[BUS_X, ROWS[0]], [BUS_X, ROWS[5]]], DIM, 1);
  stroke(ctx, [[COL_X, ROWS[0]], [COL_X, ROWS[5]]], DIM, 1);
  stroke(ctx, [[COL_X, END_Y], [END_X - END_R - 8, END_Y]], DIM, 1);

  let activeImpact = 0;
  for (let i = 0; i < 6; i++) {
    const idx = i + 1;
    const y = ROWS[i];
    const done = idx < n;
    const active = idx === n;
    const t0 = countStart(idx);

    // the channel line: dim when unused, cyan when this attempt has happened,
    // and it draws itself from the bus as the call is made
    stroke(ctx, [[BUS_X, y], [COL_X, y]], active ? FAINT : done ? PAST : FAINT, done ? 2 : 1);
    if (active) {
      const lit = clamp((t - t0) / 0.3);
      const x1 = Math.round(mix(BUS_X, COL_X, lit));
      stroke(ctx, [[BUS_X, y], [x1, y]], BLUE, 3);
      if (lit >= 1) {
        // the channel has arrived at the collector; the shared line to the
        // empty port lights for one beat
        const impact = clamp((t - t0 - 0.3) / 0.12);
        stroke(ctx, [[COL_X, y], [COL_X, END_Y]], "rgba(0,180,230,0.55)", 2);
        stroke(ctx, [[COL_X, END_Y], [Math.round(mix(COL_X, END_X - END_R - 8, impact)), END_Y]], BLUE, 2);
        activeImpact = impact;
        // the failed edge: two pixels where the return should have come back
        stroke(
          ctx,
          [[END_X - END_R - 10, END_Y], [END_X - END_R, END_Y]],
          RED_EDGE,
          2,
          0.35 + 0.65 * impact,
        );
      }
    }

    // the channel port on the bus
    ctx.strokeStyle = active ? BLUE : done ? "rgba(0,180,230,0.55)" : FAINT;
    ctx.lineWidth = 1;
    if (active) {
      ctx.fillStyle = BLUE;
      ctx.fillRect(BUS_X - 3, y - 3, 6, 6);
    } else {
      ctx.strokeRect(BUS_X - 3, y - 3, 6, 6);
    }

    channelWord(ctx, idx, y, active, done);

    // the active word gets one short rule under it: this channel is the one
    // being spoken now, the others are the languages it already tried
    if (active) {
      ctx.fillStyle = BLUE;
      ctx.fillRect(350, y - 8, 138, 2);
    }
  }

  endpoint(ctx, n, activeImpact);

  // a reply counter is the thing that never moves
  type(ctx, "REPLIES", 110, 862, 13, BLUE, "MV Mono");
  type(ctx, "0", 110, 906, 44, PAPER, "MV Mono");
  type(ctx, `of ${n}`, 150, 906, 16, PAPER_DIM, "MV Mono");
  type(ctx, "the port stays empty", 110, 938, 12, PAPER_DIM, "MV Mono");

  counter(ctx, n);
  return { phase: "probe", attempt: n, impact: Number(activeImpact.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// last-shout: the face, the water-light, the one point that never came back
// ---------------------------------------------------------------------------
const EYE_ART = 1051; // the plate is 1050 px wide; the content is 863 px = 80% of 1080
const EYE_SCALE = EYE_ART / 1510;
const EYE_TARGET = [999, 439]; // places the content 863x863 at (960, 520)
// The visible pupil inside that plate (measured from the source plate, not
// guessed): the column of water and the unreturned point both sit here.
const POINT = [1012, 434];

/** Her face as a printed plate, not a full-bleed cutout. */
function eyePlate(ctx) {
  const img = S08_ART.images.eye;
  if (!img || !img.complete) return null;
  // Pre-scale once. 1510 -> 1051 is the exact kind of downscaling that makes
  // the same frame read back differently the first time it is drawn.
  const art = scaledArt(img, EYE_ART, EYE_ART);
  const left = Math.round(EYE_TARGET[0] - 805 * EYE_SCALE);
  const top = Math.round(EYE_TARGET[1] - 645 * EYE_SCALE);
  ctx.drawImage(art, left, top);
  const box = {
    left: Math.round(left + 128 * EYE_SCALE),
    top: Math.round(top + 142 * EYE_SCALE),
    w: Math.round(1241 * EYE_SCALE),
    h: Math.round(1240 * EYE_SCALE),
  };
  // crop marks at the four corners of the content, so the face reads as a
  // printed plate rather than a floating sticker
  const c = "rgba(242,247,250,0.35)";
  for (const [x, y, sx, sy] of [
    [box.left, box.top, 1, 1],
    [box.left + box.w, box.top, -1, 1],
    [box.left, box.top + box.h, 1, -1],
    [box.left + box.w, box.top + box.h, -1, -1],
  ]) {
    stroke(ctx, [[x, y], [x + 18 * sx, y]], c, 1);
    stroke(ctx, [[x, y], [x, y + 18 * sy]], c, 1);
  }
  return box;
}

/**
 * The vertical water-light. Six attempts have become one fall of light in front
 * of the eye: flat bands and a handful of moving droplets, no gradient.
 */
function waterLight(ctx, t, box) {
  const x = POINT[0];
  const top = 60;
  const bottom = 1020;
  const h = bottom - top;
  ctx.fillStyle = "rgba(0,180,230,0.12)";
  ctx.fillRect(x - 84, top, 168, h);
  ctx.fillStyle = "rgba(242,247,250,0.10)";
  ctx.fillRect(x - 38, top, 76, h);
  // the falling dashes: one line of water every few pixels, phase from t
  for (let i = 0; i < 16; i++) {
    const y = Math.round(top + ((i * 67 + t * 190) % h));
    ctx.fillStyle = i % 2 ? "rgba(242,247,250,0.32)" : "rgba(0,180,230,0.38)";
    ctx.fillRect(x - 56, y, 112, 3);
  }
  ctx.fillStyle = "rgba(242,247,250,0.85)";
  ctx.fillRect(x - 3, top, 6, h);
  // the surface it falls from
  ctx.fillStyle = "rgba(242,247,250,0.50)";
  ctx.fillRect(x - 84, top, 168, 2);
  // the six routes now feed this one column
  for (let i = 0; i < 6; i++) {
    const sx = 760 + i * 96;
    stroke(ctx, [[sx, 36], [x, 78]], "rgba(0,180,230,0.22)", 1);
  }
  return box;
}

/** The point that never returned, held inside the eye. */
function unreturnedPoint(ctx, t) {
  const x = POINT[0];
  const y = POINT[1];
  // An ink backing keeps the ring legible on her bright face: the point is a
  // hole in the eye, not a highlight.
  disc(ctx, x, y, 14, "rgba(4,18,32,0.78)", 1);
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(242,247,250,0.92)";
  ctx.lineWidth = 2;
  ctx.stroke();
  // the same two-pixel red edge as every other failed boundary in the film
  stroke(ctx, [[x - 18, y], [x - 11, y]], RED_EDGE, 2);
  // a slow breath so it is alive, but it never fills
  const pulse = 0.5 + 0.5 * Math.sin(t * 5.2);
  ctx.beginPath();
  ctx.arc(x, y, 18 + Math.round(3 * pulse), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(231,93,105,${(0.18 + 0.16 * pulse).toFixed(2)})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function lastShout(ctx, t) {
  page(ctx);
  type(ctx, "LAST SHOUT", 110, 108, 22, PAPER, "MV Sans");
  type(ctx, "not a language · the one word", 110, 136, 14, PAPER_MID, "MV Mono");
  type(ctx, "REPLIES 0 / 06", 1808, 110, 24, PAPER, "MV Mono", "right");
  type(ctx, "six encodings · zero returns", 1808, 136, 12, PAPER_DIM, "MV Mono", "right");

  // the six attempts, all empty, in the left margin
  for (let i = 0; i < 6; i++) {
    const y = 300 + i * 44;
    stroke(ctx, [[96, y - 6], [110, y - 6]], RED_EDGE, 2);
    type(ctx, `${String(i + 1).padStart(2, "0")}  ${LANGS[i]}`, 124, y, 14, PAPER_DIM, "MV Mono");
    type(ctx, "0", 250, y, 14, "rgba(242,247,250,0.22)", "MV Mono");
  }
  type(ctx, "six calls, six languages,", 96, 596, 12, PAPER_DIM, "MV Mono");
  type(ctx, "not one reply", 96, 618, 12, PAPER_DIM, "MV Mono");

  const box = eyePlate(ctx);
  if (box) {
    waterLight(ctx, t, box);
    unreturnedPoint(ctx, t);
  }
  return { phase: "last-shout", plate: box ? [box.left, box.top, box.w, box.h] : null };
}

// ---------------------------------------------------------------------------
// render table
// ---------------------------------------------------------------------------
function countShot(n) {
  return (ctx, t) => {
    const out = probePanel(ctx, t, n);
    return {
      ...out,
      // Same printed, low-bloom machine as section 10: this is a probe panel,
      // not a lit room.
      grade: { glow: 0.26, vignette: 0.30 },
    };
  };
}

export const SECTION11_RENDER = Object.freeze({
  "count-1-de": countShot(1),
  "count-2-es": countShot(2),
  "count-3-fr": countShot(3),
  "count-4-ko": countShot(4),
  "count-5-sv": countShot(5),
  "count-6-zh": countShot(6),
  "last-shout": (ctx, t) => ({ ...lastShout(ctx, t), grade: { glow: 0.28, vignette: 0.30 } }),
});

export const SECTION11_IMPLEMENTED = Object.freeze(Object.keys(SECTION11_RENDER));
