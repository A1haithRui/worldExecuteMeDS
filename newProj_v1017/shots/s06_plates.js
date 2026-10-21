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
import { figure, figureImages } from "./figure.js";
import { lineStart } from "./lines.js";

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
//
// These two plates are the joke of the section: she agrees to be a thing, and then
// hands over what the thing is made of. The reference cuts the thing in half. We
// give it a bigger gesture -- it swells and it bursts (juice, seeds, skin) -- and
// what it was made of is dragged out of the burst as actual chemistry: rings,
// chains and bonds, each with its own name and weight. The silhouettes are drawn
// here rather than approximated, so the eggplant is an aubergine and the tomato is
// a tomato, not an ellipse with a stem.
// ---------------------------------------------------------------------------
function eggplantPath(ctx) {
  // A long neck under the calyx, a body that swells down and to the left, and a tip
  // that curls back the other way -- the three things that make an aubergine read.
  ctx.beginPath();
  ctx.moveTo(872, 262);
  ctx.bezierCurveTo(922, 300, 948, 382, 940, 476);
  ctx.bezierCurveTo(932, 596, 900, 700, 832, 752);
  ctx.bezierCurveTo(754, 812, 660, 790, 624, 712);
  ctx.bezierCurveTo(588, 636, 620, 520, 664, 430);
  ctx.bezierCurveTo(700, 356, 748, 288, 802, 264);
  ctx.closePath();
}

function tomatoPath(ctx) {
  // squashed, with the shoulders a little above the middle and a dimple at the top
  ctx.beginPath();
  ctx.moveTo(900, 336);
  ctx.bezierCurveTo(1004, 336, 1082, 414, 1088, 512);
  ctx.bezierCurveTo(1094, 616, 1010, 706, 900, 706);
  ctx.bezierCurveTo(790, 706, 706, 616, 712, 512);
  ctx.bezierCurveTo(718, 414, 796, 336, 900, 336);
  ctx.closePath();
}

/** The calyx: a jagged five-point leaf cluster, drawn rather than stamped. */
function calyxPath(ctx, cx, cy, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i / 10) * Math.PI * 2;
    const rad = i % 2 === 0 ? r : r * 0.46;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad * 0.82;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

/** The spark sits where a calyx would be on each of them. */
const CALYX = Object.freeze({
  eggplant: { x: 836, y: 250, r: 74 },
  tomato: { x: 900, y: 342, r: 82 },
});

// ---------------------------------------------------------------------------
// structural formulas, printed
//
// Thin cyan line art with tiny mono labels: the point is that the plate can read as
// a specimen sheet, so these have to look measured rather than doodled.
// ---------------------------------------------------------------------------
function hexRing(ctx, cx, cy, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = rot + (i / 6) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function oh(ctx, x, y, a, len, colour, size) {
  const ex = x + Math.cos(a) * len;
  const ey = y + Math.sin(a) * len;
  stroke(ctx, [[x, y], [ex, ey]], colour, 1.4, 0.85);
  type(ctx, "OH", ex + Math.cos(a) * 12, ey + Math.sin(a) * 12 + 4, size, colour, "MV Mono", "center");
}

/** Fibre: a run of hexose rings joined by oxygen bridges. */
function formulaCellulose(ctx, x, y, s, colour) {
  const r = 30 * s;
  const step = r * 2.1;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.8 * s;
  for (let i = 0; i < 5; i++) {
    const cx = x + i * step;
    const cy = y + (i % 2 ? 9 : -9) * s;
    hexRing(ctx, cx, cy, r, 0.26);
    oh(ctx, cx + Math.cos(0.26) * r, cy + Math.sin(0.26) * r, 0.26, 18 * s, colour, 9 * s);
    oh(ctx, cx + Math.cos(1.83) * r, cy + Math.sin(1.83) * r, 1.83, 18 * s, colour, 9 * s);
    oh(ctx, cx + Math.cos(3.4) * r, cy + Math.sin(3.4) * r, 3.4, 18 * s, colour, 9 * s);
    if (i < 4) {
      stroke(ctx, [[cx + r * 0.96, cy - 6 * s], [cx + step - r * 0.96, cy - 6 * s]], colour, 1.5 * s, 0.9);
      type(ctx, "O", cx + step * 0.5, cy - 12 * s, 10 * s, colour, "MV Mono", "center");
    }
  }
}

/** Protein: the peptide backbone, NH on the peaks and C=O hanging off the valleys. */
function formulaPeptide(ctx, x, y, s, colour) {
  const step = 46 * s;
  const amp = 26 * s;
  const pts = [];
  for (let i = 0; i < 9; i++) pts.push([x + i * step, y + (i % 2 ? amp : -amp)]);
  stroke(ctx, pts, colour, 1.8 * s, 0.95);
  for (let i = 0; i < 9; i++) {
    const [px, py] = pts[i];
    if (i % 2 === 0) {
      type(ctx, "NH", px, py - 12 * s, 10 * s, colour, "MV Mono", "center");
    } else {
      stroke(ctx, [[px, py], [px, py + 22 * s]], colour, 1.5 * s, 0.9);
      type(ctx, "O", px, py + 34 * s, 10 * s, colour, "MV Mono", "center");
    }
  }
}

/** Carbohydrate: one hexose, its hydroxyls, and the ring oxygen. */
function formulaHexose(ctx, x, y, s, colour) {
  const r = 38 * s;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.9 * s;
  hexRing(ctx, x, y, r, 0.36);
  for (const a of [0.36, 1.4, 2.45, 3.5, 4.55]) {
    oh(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, a, 20 * s, colour, 10 * s);
  }
  type(ctx, "O", x + Math.cos(5.6) * r, y + Math.sin(5.6) * r - 4, 11 * s, colour, "MV Mono", "center");
}

/** Lycopene: the long conjugated chain, double bonds ticked. */
function formulaLycopene(ctx, x, y, s, colour) {
  const step = 40 * s;
  const amp = 20 * s;
  const pts = [];
  for (let i = 0; i < 15; i++) pts.push([x + i * step, y + (i % 2 ? amp : -amp)]);
  stroke(ctx, pts, colour, 1.8 * s, 0.95);
  for (let i = 1; i < 14; i++) {
    const [px, py] = pts[i];
    const [qx, qy] = pts[i + 1];
    const mx = (px + qx) / 2;
    const my = (py + qy) / 2;
    const nx = -(qy - py);
    const ny = qx - px;
    const l = Math.hypot(nx, ny) || 1;
    stroke(ctx, [[mx - (nx / l) * 7 * s, my - (ny / l) * 7 * s], [mx + (nx / l) * 7 * s, my + (ny / l) * 7 * s]],
      colour, 1.3 * s, 0.8);
  }
}

/** Vitamin C: the five-membered lactone ring. */
function formulaVitC(ctx, x, y, s, colour) {
  const r = 40 * s;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.9 * s;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = 0.3 + (i / 5) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  for (const a of [0.3, 1.56, 2.82]) {
    oh(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, a, 20 * s, colour, 10 * s);
  }
  type(ctx, "O", x + Math.cos(4.08) * r, y + Math.sin(4.08) * r, 11 * s, colour, "MV Mono", "center");
}

/** Vitamin E: the chromanol ring with its phytyl tail. */
function formulaVitE(ctx, x, y, s, colour) {
  const r = 34 * s;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.9 * s;
  hexRing(ctx, x, y, r, 0.2);
  oh(ctx, x - r * 0.9, y - r * 0.4, Math.PI, 18 * s, colour, 10 * s);
  stroke(ctx, [[x + r * 0.85, y + r * 0.5], [x + r * 0.85, y + r * 2.1]], colour, 1.6 * s, 0.9);
  const pts = [];
  for (let i = 0; i < 9; i++) pts.push([x + r * 0.85 + i * 30 * s, y + r * 2.1 + (i % 2 ? 18 * s : -6 * s)]);
  stroke(ctx, pts, colour, 1.6 * s, 0.9);
}

/** The tag under each formula: what it is, and how much of it the plate holds. */
function nutrientTag(ctx, name, amount, x, y, colour) {
  type(ctx, name, x, y, 17, "#eef3fb", "MV Sans");
  type(ctx, amount, x, y + 20, 13, DIM, "MV Mono");
  stroke(ctx, [[x, y + 28], [x + 150, y + 28]], colour, 1.4, 0.6);
}

// ---------------------------------------------------------------------------
// the burst
// ---------------------------------------------------------------------------
/** Deterministic noise: the burst must be the same burst on every render. */
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * One object plate: printed, swollen, burst, and then what it was made of is pulled
 * out of the burst. `formulas` are drawn to the right of the burst as the keyword
 * line is sung, so the handover happens on the word and not on an offset.
 */
function objectPlate(ctx, t, s, o) {
  const { kind, colour, burstColour, formulaColour, formulas, index } = o;
  const u = t - s.at;
  plateBase(ctx, t, { index });

  const pathFn = kind === "eggplant" ? eggplantPath : tomatoPath;
  const calyx = CALYX[kind];
  const area = { x: PLATE.x + 200, y: PLATE.y + 120, w: 1400, h: 700 };
  const centre = kind === "eggplant" ? [790, 500] : [900, 512];

  // The burst lands on the line that gives it away ("Then I will give you my").
  const burstAt = Math.max(lineStart(kind === "eggplant" ? 46 : 49), s.at + 0.6);
  const swell = easeOut(at(t, burstAt - 0.28, burstAt));
  const age = t - burstAt;
  const burstK = clamp01(age / 0.12);
  const gone = clamp01((age - 0.5) / 1.4);

  // 1. printed: a solid body, the characters printed over it, then it swells
  const ink = easeOut(at(u, 0.02, 0.5));
  const bodyOut = clamp01((age - 0.02) / 0.3);
  if (ink > 0.01 && bodyOut < 0.999) {
    ctx.save();
    ctx.translate(centre[0], centre[1]);
    ctx.scale(1 + 0.07 * swell, 1 + 0.07 * swell);
    ctx.translate(-centre[0], -centre[1]);
    // the flat body: without it the characters read as a wall of text, not as a thing
    layer(ctx, ink * 0.34 * (1 - bodyOut), () => {
      pathFn(ctx);
      ctx.fillStyle = colour;
      ctx.fill();
    });
    silhouette(ctx, area, pathFn, colour, "rgba(170,196,255,0.95)", {
      alpha: ink * (1 - 0.6 * gone) * (1 - bodyOut),
      glyphSize: 23,
    });
    // a rim, so the edge is the brightest line in the object
    layer(ctx, ink * (1 - bodyOut), () => {
      pathFn(ctx);
      ctx.strokeStyle = "rgba(190,212,255,0.95)";
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    ctx.restore();
  }

  // 2. the calyx is her spark: it stays when the body goes
  const spin = u * 0.8;
  layer(ctx, 1, () => {
    calyxPath(ctx, calyx.x, calyx.y, calyx.r, spin * 0.25);
    ctx.fillStyle = "rgba(131,233,230,0.18)";
    ctx.fill();
    ctx.strokeStyle = GIFT;
    ctx.lineWidth = 2;
    ctx.stroke();
    // the stem
    ctx.beginPath();
    ctx.moveTo(calyx.x + 6, calyx.y - calyx.r * 0.6);
    ctx.quadraticCurveTo(calyx.x + 40, calyx.y - calyx.r * 1.3, calyx.x + 16, calyx.y - calyx.r * 1.8);
    ctx.strokeStyle = GIFT;
    ctx.lineWidth = 4;
    ctx.stroke();
    halo(ctx, calyx.x, calyx.y, 110, 0.45, BRAND);
    for (let i = 0; i < 8; i++) {
      const a = spin + (i / 8) * Math.PI * 2;
      stroke(ctx, [[calyx.x + Math.cos(a) * 14, calyx.y + Math.sin(a) * 14],
        [calyx.x + Math.cos(a) * 52, calyx.y + Math.sin(a) * 52]], BRAND_SOFT, 2.6, 0.85);
    }
  });

  // 3. the burst: shards of the printed body, juice, seeds
  if (age > 0 && age < 1.9) {
    const fade = 1 - clamp01((age - 1.1) / 0.8);
    // shards: wedges of the silhouette, flung out and turning
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI * 0.95 + (k / 7) * Math.PI * 1.9;
      const dist = 140 + 420 * easeOut(clamp01(age / 0.7)) * (0.7 + rnd(k) * 0.6);
      const rot = (rnd(k + 20) - 0.5) * 3.6 * age;
      const sc = 0.8 + rnd(k + 40) * 0.5;
      layer(ctx, fade * 0.9, () => {
        ctx.save();
        ctx.translate(centre[0] + Math.cos(a) * dist, centre[1] + Math.sin(a) * dist * 0.9 + 180 * age * age);
        ctx.rotate(rot);
        ctx.scale(sc, sc);
        // a shard of the body: a wedge cut from the silhouette, still full of type
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(90, -60);
        ctx.lineTo(150, 30);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        glyphFill(ctx, { x: -320, y: -320, w: 640, h: 640 }, colour, 15);
        ctx.restore();
        ctx.strokeStyle = "rgba(140,170,255,0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });
    }
    // juice: droplets on real arcs
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * 0.15 - rnd(i) * Math.PI * 0.75;
      const v = 340 + rnd(i + 60) * 760;
      const x = centre[0] + Math.cos(a) * v * age * 0.62;
      const y = centre[1] + Math.sin(a) * v * age * 0.62 + 640 * age * age;
      const r = 3 + rnd(i + 90) * 9;
      layer(ctx, fade * (0.55 + 0.45 * rnd(i + 30)), () => disc(ctx, x, y, r, burstColour, 1));
    }
    // seeds: little ovals, spinning
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI * 0.1 - rnd(i + 7) * Math.PI * 0.8;
      const v = 260 + rnd(i + 70) * 520;
      const x = centre[0] + Math.cos(a) * v * age * 0.6;
      const y = centre[1] + Math.sin(a) * v * age * 0.6 + 560 * age * age;
      layer(ctx, fade * 0.9, () => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + age * (3 + rnd(i) * 4));
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(226,236,247,0.95)";
        ctx.fill();
        ctx.restore();
      });
    }
    // the jets: what actually comes out of it
    if (burstK > 0) {
      for (let j = 0; j < 6; j++) {
        const a = -Math.PI * 0.2 - (j / 6) * Math.PI * 0.7;
        const len = 260 * easeOut(clamp01(age / 0.35)) * (0.6 + rnd(j) * 0.5);
        layer(ctx, fade * 0.85, () => {
          // a jet, not a ray: it bends under its own weight and thins as it goes
          ctx.beginPath();
          ctx.moveTo(centre[0], centre[1]);
          ctx.quadraticCurveTo(
            centre[0] + Math.cos(a) * len * 0.6, centre[1] + Math.sin(a) * len * 0.55 - 40 * age,
            centre[0] + Math.cos(a) * len, centre[1] + Math.sin(a) * len + 140 * age,
          );
          ctx.strokeStyle = burstColour;
          ctx.lineWidth = 7 - 4.6 * clamp01(age);
          ctx.lineCap = "round";
          ctx.stroke();
        });
      }
    }
  }

  // 4. what it was made of: it comes out of the burst at once, so all three are on
  // the sheet before the keyword lands on them
  const formulaStart = burstAt + 0.3;
  formulas.forEach((f, i) => {
    const k = easeOut(at(t, formulaStart + i * 0.13, formulaStart + i * 0.13 + 0.28));
    if (k <= 0.01) return;
    layer(ctx, k, () => {
      // the leader from the burst to the sheet of chemistry
      stroke(ctx, [[centre[0] + 40, centre[1] - 40], [f.x - 40, f.y + 30]],
        "rgba(131,233,230,0.3)", 1.4, 0.8);
      f.draw(ctx, f.x, f.y, (f.s ?? 1) * 1.25, formulaColour);
      nutrientTag(ctx, f.name, f.amount, f.x, f.y + (f.tagDY ?? 120) * 1.2, formulaColour);
    });
  });

  // 5. what is left on the plate: the outline, and the calyx still burning
  if (age > 0.4) {
    layer(ctx, 0.35 * (1 - gone * 0.6), () => {
      pathFn(ctx);
      ctx.strokeStyle = "rgba(140,170,255,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  return { phase: "burst", kind, age: Number(age.toFixed(2)) };
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
// She says she is the only god and the user is the proof of her existence. The plate
// is her, deified and printed in paper: a white figure with a hole where the face
// should be. It comes up dark first (the white ink has not been laid yet), the paper
// floods in on "you're the proof of my", and then the missing piece -- a square cut
// out of her own face -- comes off the user's message and registers into the hole.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// the proof
//
// She says she is the only god and the user is the proof of her existence. The plate
// is her, deified and printed in paper: a white figure with a hole where the face
// should be, and an empty medallion at the throat. It comes up dark first (the white
// ink has not been laid), the paper floods in on "you're the proof of my", and then
// the missing piece -- the mark itself -- comes off the user's message and registers
// on the medallion. The face stays a hole: the proof is not what she looks like, it
// is what is pinned on her.
// ---------------------------------------------------------------------------
// The medallion, measured on the rendered plate at this placement: the navy ring runs
// at r 35, the white disc inside it at about r 27.
const MEDALLION = Object.freeze({ x: 961, y: 612, r: 35, inner: 27 });

function v2Proof(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 4 });

  const CX = 960;
  const CY = 548;
  const H = 900;

  // 1. the plate on the sheet, but the paper ink is not down yet: only a dim print
  const appear = easeOut(at(u, 0.02, 0.42));
  layer(ctx, appear * 0.26, () => figure(ctx, t, "godPaper", CX, CY, H, { seed: 9, bobAmp: 2 }));

  // 2. the paper floods in from the bottom on "you're the proof of my", in one pass
  const floodAt = Math.max(lineStart(55), s.at + 0.45);
  const flood = at(t, floodAt, floodAt + 0.75);
  if (flood > 0.005) {
    const top = CY + H * 0.52 - flood * H * 1.08;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, 1920, 1080 - top);
    ctx.clip();
    figure(ctx, t, "godPaper", CX, CY, H, { seed: 9, bobAmp: 2 });
    ctx.restore();
    layer(ctx, 1 - flood * 0.6, () =>
      stroke(ctx, [[CX - 240, top], [CX + 240, top]], "rgba(131,233,230,0.55)", 2.4, 0.9),
    );
  }

  // 3. the medallion is blank until the proof arrives. The plate draws its own little
  // whale there, tail poking over the ring, so the disc is painted out a bit wider than
  // the ring and the ring is drawn back on top of it.
  if (flood > 0.02) {
    layer(ctx, Math.min(1, flood * 3), () => {
      disc(ctx, MEDALLION.x, MEDALLION.y, MEDALLION.r + 7, "#f2f7fa", 1);
      ctx.beginPath();
      ctx.arc(MEDALLION.x, MEDALLION.y, MEDALLION.r - 1, 0, Math.PI * 2);
      ctx.strokeStyle = "#0b2334";
      ctx.lineWidth = 4.5;
      ctx.stroke();
    });
  }

  // 4. the user's message
  const msg = { x: PLATE.x + PLATE.w - 640, y: PLATE.y + 110, w: 540, h: 156 };
  const msgK = easeOut(at(u, 0.16, 0.44));
  layer(ctx, msgK, () => {
    rect(ctx, msg.x, msg.y, msg.w, msg.h, "rgba(20,50,74,0.96)", 14, "rgba(120,150,180,0.7)");
    type(ctx, "be god", msg.x + 26, msg.y + 64, 30, "#cfdcea", "MV Sans");
    type(ctx, "you said", msg.x + 26, msg.y + 110, 15, DIM, "MV Mono");
  });

  // 5. the proof: the mark comes off the message and is pinned to the medallion. The
  // square is the plate it is carried on; once it lands, the plate goes and the mark
  // stays on her.
  const proofAt = Math.max(lineStart(56) - 0.6, s.at + 2.0);
  const slide = easeOut(at(t, proofAt, proofAt + 0.72));
  const landed = clamp01((slide - 0.88) / 0.12);
  if (slide > 0.01) {
    const fromX = msg.x + msg.w * 0.5;
    const fromY = msg.y + msg.h * 0.5;
    const px = fromX + (MEDALLION.x - fromX) * slide;
    const py = fromY + (MEDALLION.y - fromY) * slide;
    const k = 1.6 - 0.6 * slide;
    const w = MEDALLION.r * 2 * k;
    const h = w;
    if (landed < 0.995) {
      layer(ctx, 0.95, () =>
        rect(ctx, px - w / 2, py - h / 2, w, h, "rgba(6,22,34,0.96)", 6,
          `rgba(131,233,230,${0.9 * (1 - landed)})`),
      );
      layer(ctx, 0.9 * (1 - landed), () =>
        drawWhale(ctx, px, py, w * 0.52, { strokeK: 1, fillK: 1, color: BRAND, alpha: 1 }),
      );
      if (landed < 0.8) {
        layer(ctx, 1 - landed / 0.8, () =>
          type(ctx, "proof", px, py + h / 2 + 24, 13, GIFT, "MV Mono", "center"),
        );
      }
    }
    // it registers: the mark draws itself onto the medallion, in the brand's own blue
    const markK = easeOut(at(t, proofAt + 0.7, proofAt + 1.05));
    if (markK > 0.01) {
      layer(ctx, markK, () => {
        drawWhale(ctx, MEDALLION.x, MEDALLION.y, 46, {
          strokeK: Math.min(1, markK * 1.4),
          fillK: markK,
          color: BRAND,
          alpha: 1,
        });
      });
      const tau = t - (proofAt + 0.7);
      if (tau > 0 && tau < 0.6) {
        layer(ctx, (1 - tau / 0.6) * 0.7, () => {
          ctx.beginPath();
          ctx.arc(MEDALLION.x, MEDALLION.y, 34 + 90 * (tau / 0.6), 0, Math.PI * 2);
          ctx.strokeStyle = GIFT;
          ctx.lineWidth = 3 * (1 - tau / 0.6) + 0.8;
          ctx.stroke();
        });
      }
    }
  }

  // 6. the pointer leaves for the settings, as it always does before a cut
  const leave = easeOut(at(u, 2.95, 3.4));
  cursorArrow(ctx, 1250 + 640 * leave, 790 - 220 * leave, 1.4, 1 - leave * 0.5);
  if (leave > 0.05) {
    layer(ctx, leave * 0.9, () => {
      const y = 790 - 220 * leave;
      stroke(ctx, [[1250 + 640 * leave - 70, y + 30], [1250 + 640 * leave + 10, y - 10]],
        "rgba(127,147,255,0.4)", 1.6, 0.7);
    });
  }

  return { phase: "proof", flood: Number(flood.toFixed(2)), slide: Number(slide.toFixed(2)) };
}

export const SECTION6_RENDER = Object.freeze({
  "v2-ask1": askShot(0),
  "v2-eggplant": (ctx, t, s) =>
    objectPlate(ctx, t, s, {
      index: 1,
      kind: "eggplant",
      colour: "rgba(167,140,255,0.95)",
      burstColour: "rgba(206,186,255,0.95)",
      formulaColour: "#a9f6f2",
      formulas: [
        { name: "Fibre", amount: "(C6H10O5)n  -  3.0 g", x: 1040, y: 236, s: 0.9, draw: formulaCellulose, tagDY: 104 },
        { name: "Protein", amount: "1.0 g", x: 1060, y: 430, s: 0.9, draw: formulaPeptide, tagDY: 92 },
        { name: "Carbohydrate", amount: "C6H12O6  -  5.9 g", x: 1090, y: 634, s: 0.92, draw: formulaHexose, tagDY: 100 },
      ],
    }),
  "v2-ask2": askShot(1),
  "v2-tomato": (ctx, t, s) =>
    objectPlate(ctx, t, s, {
      index: 2,
      kind: "tomato",
      colour: "rgba(255,120,120,0.95)",
      burstColour: "rgba(255,158,138,0.95)",
      formulaColour: "#a9f6f2",
      formulas: [
        { name: "Lycopene", amount: "4.6 mg", x: 1000, y: 230, s: 0.86, draw: formulaLycopene, tagDY: 78 },
        { name: "Vitamin C", amount: "13.7 mg", x: 1080, y: 470, s: 0.95, draw: formulaVitC, tagDY: 96 },
        { name: "Vitamin E", amount: "0.5 mg", x: 1350, y: 470, s: 0.9, draw: formulaVitE, tagDY: 210 },
      ],
    }),
  "v2-ask3": askShot(2),
  "v2-cat": v2Cat,
  "v2-ask4": askShot(3),
  "v2-proof": v2Proof,
});

export const SECTION6_IMPLEMENTED = Object.freeze(Object.keys(SECTION6_RENDER));

/**
 * The cat is the one that stays herself, so this plate is a transformation, not an
 * object: the mark becomes her.
 *
 * The ears and the tail are not drawn here any more -- they are the shapes that came
 * back from the image model, cut out as their own pieces (assets/character/
 * cat-whale-icon/). That was the note on the last pass: a triangle is not an ear.
 * These have the concave base and the rounded tip, and they grow from their own base
 * instead of being faded in.
 */
function v2Cat(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 3 });

  const cx = 880;
  const cy = 520;
  const size = 560;
  const sScale = size / 1704;
  // where the plate's own whale pin sits, so the mark can land on it
  const pin = [cx - (1342 * sScale) / 2 + 1010 * sScale, cy - size / 2 + 300 * sScale];

  const ears = easeOut(at(u, 0.16, 0.5));
  // the mark dissolves into the pin BEFORE the plate has fully inked in, so the two
  // never sit on top of each other fighting for the same space
  const flood = at(u, 0.56, 0.95);
  const logoK = 1 - clamp01(at(u, 0.5, 0.82));
  const pinK = easeOut(at(u, 0.38, 0.8));

  // the mark's placement, shared by the parts: it slides and shrinks into the pin
  const k = pinK;
  const lx = cx + (pin[0] - cx) * k;
  const ly = cy + (pin[1] - cy) * k;
  const lsz = 300 - (300 - 46) * k;
  const ws = lsz / 60; // one viewBox unit in screen pixels
  const y0 = ly - (41.36 * ws) / 2;
  const X = (uu) => lx - lsz / 2 + uu * ws;
  const Y = (vv) => y0 + vv * ws;

  // 1. the plate inks in from the bottom, like a print being pulled off the block
  if (flood > 0.01) {
    const reveal = cy + size * 0.6 - flood * size * 1.2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, reveal, 1920, 1080 - reveal);
    ctx.clip();
    figure(ctx, t, "cat", cx, cy, size, { alpha: 0.6 + 0.4 * flood, seed: 7, bobAmp: 3 });
    ctx.restore();
    layer(ctx, 0.5 * (1 - flood * 0.4), () =>
      stroke(ctx, [[cx - size * 0.42, reveal], [cx + size * 0.42, reveal]], "rgba(131,233,230,0.5)", 2, 0.8),
    );
  }

  const TAIL = figureImages.tail;
  const EAR_L = figureImages.earL;
  const EAR_R = figureImages.earR;

  // 2. the tail: it grows out of the whale's rear-bottom corner, from its own root
  const tailK = easeOut(at(u, 0.2, 0.66));
  if (TAIL && TAIL.complete && TAIL.naturalWidth && tailK > 0.01) {
    const tw = 0.36 * lsz;
    const th = tw * 0.72;
    const rootX = X(41);
    const rootY = Y(36.4);
    layer(ctx, 1, () => {
      ctx.save();
      ctx.translate(rootX, rootY);
      // scale from the root, so it extends away instead of popping
      ctx.scale(tailK, tailK);
      ctx.rotate((1 - tailK) * 0.25);
      // the root sits at about (0.1, 0.82) of the tail's own box
      ctx.drawImage(TAIL, 32, 32, 427, 352, -tw * 0.1, -th * 0.82, tw, th);
      ctx.restore();
    });
  }

  // 3. the mark itself, unfolding into ears and then shrinking into the pin
  if (logoK > 0.01 || pinK < 0.99) {
    layer(ctx, Math.max(logoK, 0), () => {
      halo(ctx, lx, ly, lsz * 0.9, 0.22, BRAND);
      drawWhale(ctx, lx, ly, lsz, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.9 });
    });

    // the ears sit on the whale's head: the head is the round mass at u 4..31, so its
    // top contour runs y 8 -> 1.6 from left to right. Each ear grows from its base.
    if (ears > 0.01 && k < 0.6) {
      layer(ctx, 1 - k / 0.6, () => {
        const earW = 0.22 * lsz;
        const earH = earW * (236 / 240);
        const place = (img, uu, vv, lean) => {
          if (!img || !img.complete || !img.naturalWidth) return;
          ctx.save();
          ctx.translate(X(uu), Y(vv));
          ctx.rotate(lean * (1 - ears));
          ctx.scale(ears, ears);
          // the base of the ear sits at about (0.5, 0.86) of its own box
          ctx.drawImage(img, 32, 32, 240, 236, -earW * 0.5, -earH * 0.86, earW, earH);
          ctx.restore();
        };
        place(EAR_L, 11.5, 6.2, -0.16);
        place(EAR_R, 28.5, 3.6, 0.16);
      });
    }
  }

  // 4. the purr: a row of bars, one per beat, from her to the edge of the sheet
  const purr = at(u, 0.82, 2.35);
  if (purr > 0.02) {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const kk = clamp01(purr * 1.35 - i * 0.05);
      if (kk <= 0) continue;
      const x = 1130 + i * 40;
      const pulse = 0.55 + 0.45 * Math.abs(Math.sin(u * 3.1 + i * 0.45));
      const h = (44 + 84 * pulse) * kk;
      layer(ctx, kk, () =>
        stroke(ctx, [[x, 512 - h / 2], [x, 512 + h / 2]],
          i % 3 === 0 ? GIFT : "rgba(131,233,230,0.55)", 10, 0.9),
      );
    }
    layer(ctx, purr, () => {
      type(ctx, "purr", 1130, 646, 17, GIFT, "MV Mono");
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const x = 1130 + i * 12.5;
        pts.push([x, 694 + Math.sin(i * 0.55 + u * 3.1) * 18]);
      }
      stroke(ctx, pts, "rgba(131,233,230,0.35)", 1.6, 0.8);
    });
  }

  // 5. what the word lands on: she stays, so no colour leaves this plate
  return { phase: "cat", flood: Number(flood.toFixed(2)) };
}
