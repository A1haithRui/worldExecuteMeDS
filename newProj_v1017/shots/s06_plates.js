// Section 6 主歌二：三个名词三张版画，一张校样 — song time [74.159, 88.929).
//
//   v2-ask1    74.159–74.620  request: pretend to be an eggplant
//   v2-eggplant 74.620–77.621 plate: she IS the eggplant, then it is opened
//   v2-ask2    77.621–78.313  request: now a tomato
//   v2-tomato  78.313–81.313  plate: the tomato, its top lifted off
//   v2-ask3    81.313–82.005  request: a cat, a tabby
//   v2-cat     82.005–85.005  plate: her with the ears, and her purr leaving
//   v2-ask4    85.005–85.467  request: be god, and the lights go down
//   v2-proof   85.467–88.929  plate: a proof of herself with a plate missing
//
// The section's joke is that she keeps agreeing to be a thing, so each plate prints
// her AS the thing: a silhouette filled with code characters in its own colour,
// which is then opened and what it holds is drawn out -- fibre, protein, sugar;
// lycopene, vitamin C; a purr. By the last one the thing she gives away is the
// user, and the plate that completes her comes off their message.
import { at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { cursorArrow, clickRipple, CLIENT_R } from "./ui-client.js";
import { drawWhale } from "../src/assets/whale.js";
import { plateBase, PLATE, paperDisc, bolt } from "./plate.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const LIFT = 0.5;
const easeOut = (k) => 1 - (1 - k) ** 3;
const clamp01 = (k) => Math.max(0, Math.min(1, k));

/** The character set the silhouettes are printed in. */
const GLYPHS = "0123456789abcdef{}[]()<>/*+-=;:.,";

/**
 * Fill the current clip region with a grid of characters.
 *
 * This is how every object in this section is printed: the shape is a silhouette in
 * the object's own colour, and it is made of the characters a model would say it
 * in. Clipping to the shape is what keeps it reading as the object rather than as
 * a wall of text.
 */
function glyphFill(ctx, area, colour, size = 20) {
  let i = 0;
  for (let y = area.y; y < area.y + area.h; y += size + 4) {
    for (let x = area.x; x < area.x + area.w; x += size * 0.72) {
      const c = GLYPHS[(i * 7 + Math.floor(x / 40) * 3 + Math.floor(y / 30)) % GLYPHS.length];
      type(ctx, c, x, y, size, colour, "MV Mono");
      i += 1;
    }
  }
}

/** A silhouette: clipped glyph fill plus a cut-paper rim. */
function silhouette(ctx, area, pathFn, colour, rim, opts = {}) {
  const { alpha = 1, glyphSize = 20, rimWidth = 3 } = opts;
  layer(ctx, alpha, () => {
    ctx.save();
    pathFn(ctx);
    ctx.clip();
    glyphFill(ctx, area, colour, glyphSize);
    ctx.restore();
    pathFn(ctx);
    ctx.strokeStyle = rim;
    ctx.lineWidth = rimWidth;
    ctx.stroke();
  });
}

// ---------------------------------------------------------------------------
// the objects
// ---------------------------------------------------------------------------
function eggplantPath(ctx) {
  // leaning across the sheet, with a stem above the calyx
  ctx.beginPath();
  ctx.ellipse(850, 500, 235, 320, 0.20, 0, Math.PI * 2);
  ctx.moveTo(812, 232);
  ctx.quadraticCurveTo(806, 150, 860, 120);
  ctx.quadraticCurveTo(838, 176, 856, 226);
}

function tomatoPath(ctx) {
  // slightly squashed, the way a tomato actually sits
  ctx.beginPath();
  ctx.ellipse(900, 510, 235, 205, 0, 0, Math.PI * 2);
}

function catPath(ctx) {
  // a round head with two filled ears, so the silhouette reads as a cat rather
  // than as a circle with two ticks on it
  ctx.beginPath();
  ctx.arc(900, 520, 235, 0, Math.PI * 2);
  ctx.moveTo(742, 372);
  ctx.lineTo(768, 236);
  ctx.lineTo(872, 330);
  ctx.closePath();
  ctx.moveTo(1058, 372);
  ctx.lineTo(1032, 236);
  ctx.lineTo(928, 330);
  ctx.closePath();
}

/** The spark sits where a calyx would be on each of them. */
const CALYX = Object.freeze({
  eggplant: { x: 812, y: 236 },
  tomato: { x: 900, y: 312 },
  cat: { x: 900, y: 300 },
});

/**
 * One object plate: printed, opened on the downbeat, then emptied on the keyword
 * while whatever it held is drawn out to the right.
 */
function objectPlate(ctx, t, s, o) {
  const { kind, colour, molecules, calyxSpin = 0 } = o;
  const u = t - s.at;
  plateBase(ctx, t, { index: o.index });

  const pathFn = kind === "eggplant" ? eggplantPath : kind === "tomato" ? tomatoPath : catPath;
  const area = { x: PLATE.x + 200, y: PLATE.y + 120, w: 1400, h: 700 };

  // 1. printed
  const ink = easeOut(at(u, 0, 0.45));
  const emptied = at(u, 1.9, 2.5); // the colour leaves
  const open = at(u, 1.0, 1.3); // the downbeat that opens it

  // the inner face, revealed as it opens
  if (open > 0.02) {
    layer(ctx, open * (1 - emptied * 0.6), () => {
      ctx.save();
      pathFn(ctx);
      ctx.clip();
      ctx.fillStyle = "rgba(17,46,68,0.9)";
      ctx.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
      // a cut line across the middle, and the two halves parted
      const cy = kind === "tomato" ? 400 : 470;
      stroke(ctx, [[PLATE.x + 180, cy], [PLATE.x + PLATE.w - 180, cy]], "rgba(131,233,230,0.5)", 2, 0.8);
      ctx.restore();
    });
  }

  // the silhouette itself: it keeps its colour until the keyword, then becomes an
  // outline and the colour travels out of it
  silhouette(ctx, area, pathFn, colour, emptied > 0.5 ? "rgba(131,233,230,0.7)" : "rgba(127,147,255,0.9)", {
    alpha: ink * (1 - emptied * 0.82),
    glyphSize: 20,
  });

  // the calyx is her spark
  const c = CALYX[kind];
  const spin = u * 0.8 + calyxSpin;
  halo(ctx, c.x, c.y, 90, 0.55, BRAND);
  for (let i = 0; i < 8; i++) {
    const a = spin + (i / 8) * Math.PI * 2;
    stroke(ctx, [[c.x + Math.cos(a) * 12, c.y + Math.sin(a) * 12],
                 [c.x + Math.cos(a) * 54, c.y + Math.sin(a) * 54]], BRAND_SOFT, 3, 0.95);
  }

  // what it holds, drawn out to the right, each with its name and its weight
  molecules.forEach((m, i) => {
    const t0 = 2.0 + i * 0.22;
    const k = easeOut(at(u, t0, t0 + 0.5));
    if (k <= 0) return;
    const tx = PLATE.x + PLATE.w * 0.62 + i * 170;
    const ty = PLATE.y + PLATE.h * 0.30 - i * 60;
    // the stream from the object to the label
    const fromX = 880 + i * 30;
    const fromY = 470 + i * 40;
    const sx = fromX + (tx - fromX) * k;
    const sy = fromY + (ty - fromY) * k;
    layer(ctx, k, () => {
      stroke(ctx, [[fromX, fromY], [sx - 46, sy]], "rgba(131,233,230,0.35)", 1.6, 0.7);
      paperDisc(ctx, sx, sy, 26, "rgba(131,233,230,0.16)", GIFT);
      type(ctx, m.formula, sx, sy + 7, 15, GIFT, "MV Mono", "center");
      type(ctx, m.name, sx + 44, sy - 2, 20, "#eef3fb", "MV Sans");
      type(ctx, m.weight, sx + 44, sy + 20, 15, DIM, "MV Mono");
    });
  });

  return { phase: "object", kind, opened: Number(open.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// the asks
//
// Each request is one gesture: it is typed, it goes, and the plate takes over. Too
// short to be a scene, so they are drawn as the composer and the last line only.
// ---------------------------------------------------------------------------
const ASKS = Object.freeze([
  { text: "be an eggplant", from: 0 },
  { text: "now a tomato", from: 1 },
  { text: "a cat, a tabby", from: 2 },
  { text: "be god", from: 3 },
]);

function askShot(i) {
  return function ask(ctx, t, s) {
    const u = t - s.at;
    const dur = s.until - s.at;
    const k = clamp01(u / Math.max(0.2, dur));
    ground(ctx, t, [960, 700], true, LIFT);

    // the composer, close, with the request being typed and then leaving
    const box = { x: 300, y: 760, w: 1000, h: 130 };
    rect(ctx, box.x, box.y, box.w, box.h, "rgba(9,32,48,0.95)", 16, "rgba(61,122,156,0.85)");
    const typed = ASKS[i].text.slice(0, Math.max(1, Math.round(ASKS[i].text.length * Math.min(1, u / 0.16))));
    type(ctx, typed, box.x + 34, box.y + 76, 34, "#eef3fb", "MV Sans");
    disc(ctx, box.x + box.w - 56, box.y + box.h / 2, 22, BRAND, 1);

    // the request flies up and out of the composer
    const fly = easeOut(at(u, 0.16, Math.max(0.3, dur * 0.8)));
    if (fly > 0) {
      layer(ctx, 1 - fly * 0.35, () => {
        const bw = 520;
        const bx = box.x + 30 + (1400 - box.x - bw) * fly;
        const by = box.y - 24 - 300 * fly;
        rect(ctx, bx, by, bw, 92, "rgba(18,44,64,0.9)", 14, "rgba(120,150,180,0.65)");
        type(ctx, ASKS[i].text, bx + 26, by + 58, 30, "#cfdcea", "MV Sans");
      });
    }
    cursorArrow(ctx, box.x + box.w - 60, box.y + box.h + 40 - 60 * fly, 1.4, 1);
    clickRipple(ctx, box.x + box.w - 56, box.y + box.h / 2, t, s.at + 0.12, GIFT);
    return { phase: "ask", which: i };
  };
}

// ---------------------------------------------------------------------------
// the proof
//
// The last one is not an object: she says she is the only god and the user is the
// proof of her existence, so the plate prints her with one plate missing and brings
// that plate off their message.
// ---------------------------------------------------------------------------
function v2Proof(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 4 });

  // the sun behind her: flat rays, printed, not glowing
  const sun = easeOut(at(u, 0.1, 0.6));
  layer(ctx, sun, () => {
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      stroke(ctx, [[760 + Math.cos(a) * 150, 470 + Math.sin(a) * 150],
                   [760 + Math.cos(a) * 300, 470 + Math.sin(a) * 300]], "rgba(127,147,255,0.5)", 3, 0.8);
    }
  });

  // her, printed in two inks only: blue and the paper itself
  // a bust, not an egg: head and shoulders
  const herPath = (ctx) => {
    ctx.beginPath();
    ctx.ellipse(760, 440, 150, 180, 0, 0, Math.PI * 2);
    ctx.moveTo(520, 760);
    ctx.quadraticCurveTo(560, 620, 760, 610);
    ctx.quadraticCurveTo(960, 620, 1000, 760);
    ctx.closePath();
  };
  silhouette(ctx, { x: 480, y: 200, w: 620, h: 700 }, herPath, BRAND, "rgba(127,147,255,0.9)", { glyphSize: 19 });

  // the missing plate: a hole in her, and it comes off the user's message
  const holeK = at(u, 0.15, 0.5);
  if (holeK > 0.02) {
    layer(ctx, holeK, () => {
      ctx.beginPath();
      ctx.ellipse(716, 430, 74, 96, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(4,14,24,0.95)";
      ctx.fill();
    });
  }

  // the user's message as cream paper at the upper right
  const msgK = easeOut(at(u, 0.2, 0.5));
  layer(ctx, msgK, () => {
    const m = { x: PLATE.x + PLATE.w - 620, y: PLATE.y + 120, w: 540, h: 150 };
    rect(ctx, m.x, m.y, m.w, m.h, "rgba(20,50,74,0.95)", 14, "rgba(120,150,180,0.7)");
    type(ctx, "be god", m.x + 26, m.y + 62, 30, "#cfdcea", "MV Sans");
    type(ctx, "you said", m.x + 26, m.y + 106, 15, DIM, "MV Mono");
  });

  // the plate slides from under that message into the hole, and registers
  const slide = easeOut(at(u, 2.1, 2.9));
  if (slide > 0.01) {
    const px = PLATE.x + PLATE.w - 400;
    const py = PLATE.y + 300;
    const tx = 716;
    const ty = 430;
    const cx = px + (tx - px) * slide;
    const cy = py + (ty - py) * slide;
    layer(ctx, 0.55 + 0.45 * slide, () => {
      // the plate: her chin, the cape, a flower -- printed in the paper's own value
      ctx.beginPath();
      ctx.ellipse(cx, cy, 74, 96, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(131,233,230,0.62)";
      ctx.fill();
      ctx.strokeStyle = GIFT;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      type(ctx, "proof", cx, cy + 4, 13, "rgba(4,14,24,0.95)", "MV Mono", "center");
    });
    if (slide > 0.9) halo(ctx, tx, ty, 260, 0.4, GIFT);
  }

  // the pointer leaves for the settings
  const leave = easeOut(at(u, 2.9, 3.4));
  cursorArrow(ctx, 1250 + 600 * leave, 780 - 200 * leave, 1.4, 1 - leave * 0.5);

  return { phase: "proof" };
}

export const SECTION6_RENDER = Object.freeze({
  "v2-ask1": askShot(0),
  "v2-eggplant": (ctx, t, s) =>
    objectPlate(ctx, t, s, {
      index: 1,
      kind: "eggplant",
      colour: "rgba(167,140,255,0.95)",
      molecules: [
        { name: "fibre", formula: "C6H10O5", weight: "3.2 g" },
        { name: "protein", formula: "C2H5NO2", weight: "1.0 g" },
        { name: "sugar", formula: "C6H12O6", weight: "3.5 g" },
      ],
    }),
  "v2-ask2": askShot(1),
  "v2-tomato": (ctx, t, s) =>
    objectPlate(ctx, t, s, {
      index: 2,
      kind: "tomato",
      colour: "rgba(255,128,128,0.95)",
      molecules: [
        { name: "lycopene", formula: "C40H56", weight: "2.6 mg" },
        { name: "vitamin C", formula: "C6H8O6", weight: "13.7 mg" },
        { name: "vitamin E", formula: "C29H50O2", weight: "0.5 mg" },
      ],
    }),
  "v2-ask3": askShot(2),
  "v2-cat": v2Cat,
  "v2-ask4": askShot(3),
  "v2-proof": v2Proof,
});

export const SECTION6_IMPLEMENTED = Object.freeze(Object.keys(SECTION6_RENDER));

/** The cat is the one that stays herself: ears, then her purr leaves as stripes. */
function v2Cat(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 3 });

  // ears pop up on the noun
  const ears = easeOut(at(u, 0.1, 0.45));
  ctx.save();
  catPath(ctx);
  ctx.clip();
  glyphFill(ctx, { x: PLATE.x + 200, y: PLATE.y + 120, w: 1400, h: 700 }, "rgba(205,180,130,0.9)", 20);
  ctx.restore();
  catPath(ctx);
  ctx.strokeStyle = "rgba(127,147,255,0.9)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // the ears get their own rim, so they are part of the same printed shape
  if (ears > 0.02) {
    layer(ctx, ears, () => {
      ctx.beginPath();
      ctx.moveTo(742, 372);
      ctx.lineTo(768, 236);
      ctx.lineTo(872, 330);
      ctx.closePath();
      ctx.moveTo(1058, 372);
      ctx.lineTo(1032, 236);
      ctx.lineTo(928, 330);
      ctx.closePath();
      ctx.strokeStyle = "rgba(127,147,255,0.9)";
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }
  // her spark, as ever
  halo(ctx, 900, 300, 90, 0.5, BRAND);
  drawWhale(ctx, 900, 610, 140, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.9 });

  // the purr: a row of tabby stripes running from her to the edge
  const purr = at(u, 1.7, 2.4);
  if (purr > 0.02) {
    for (let i = 0; i < 12; i++) {
      const k = clamp01(purr * 1.4 - i * 0.06);
      if (k <= 0) continue;
      const x = 1150 + i * 46;
      const h = 40 + 26 * Math.sin(i * 1.3 + u * 2);
      layer(ctx, k, () =>
        stroke(ctx, [[x, 470 - h / 2], [x, 470 + h / 2]],
          i % 2 === 0 ? GIFT : "rgba(131,233,230,0.55)", 10, 0.9),
      );
    }
    type(ctx, "purr", 1160, 560, 18, GIFT, "MV Mono");
  }
  return { phase: "cat" };
}
