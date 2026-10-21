// The look section 8 is drawn in: the colour leaving, and the pieces it leaves
// behind.
//
// Sections 5 to 7 established two things this section inherits and then spends:
// the client window as the only place a conversation happens, and the printed
// plate as the register a single word is allowed to take. What is new here is
// time -- a chorus where the other side stops answering -- so most of the new
// vocabulary is about absence: a message that sits on a rail that keeps getting
// longer, a typing indicator with nothing behind it, a portrait reduced to a
// screen of dots, a selection box around words nobody will read.
//
// One rule runs through all eleven shots: every frame is still a pure function of
// song time, so the drain of colour, the tremble of the dots and the closing of
// the spark are all read from t rather than accumulated between frames.
import {
  at, layer, stroke, disc, rect, type, halo, ground, loadImages, clamp, mix,
} from "../src/mv-draw.js";
import { sampleAt } from "../src/engine/audio.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const STEEL = "#8b98a4";
const INK = "#0a1f2e";

const clamp01 = (k) => clamp(k);
const easeOut = (k) => 1 - (1 - clamp01(k)) ** 3;

// ---------------------------------------------------------------------------
// the colour leaves
// ---------------------------------------------------------------------------
// The reference keeps its colour until the chip turns to "away" and then lets it
// go a section long, her hair first. Ours arrives at the title and has never left,
// so this is the one stretch where the film loses what it spent: from the moment
// the other side is gone (112.93) to the moment the thread is a speck (118.47).
// The three stops are the three "You have left" shots, so the drain reads as three
// cuts of the same loss rather than one long fade.
const DRAIN = Object.freeze([
  { from: 112.9294, to: 114.7756, a: 0, b: 0.4 }, // left-away
  { from: 114.7756, to: 117.3142, a: 0.4, b: 0.75 }, // left-offline
  { from: 117.3142, to: 118.4681, a: 0.75, b: 1 }, // left-isolation
]);

/** How far the colour has left the film, 0 (full colour) to 1 (steel). */
export function drainAt(t) {
  let d = 0;
  for (const s of DRAIN) {
    if (t >= s.to) d = s.b;
    else if (t > s.from) {
      d = mix(s.a, s.b, easeOut((t - s.from) / (s.to - s.from)));
      break;
    } else break;
  }
  return clamp01(d);
}

/** The grade override this section attaches to every shot. */
export function gradeAt(t) {
  const d = drainAt(t);
  return {
    sat: 1 - d,
    // as the colour goes the room closes in: light drops, the vignette tightens.
    vignette: 0.36 + 0.18 * d,
    glow: 0.42 - 0.14 * d,
    exposure: 1 - 0.05 * d,
  };
}

// ---------------------------------------------------------------------------
// the room
// ---------------------------------------------------------------------------
/**
 * The plate of a room these shots stand in. Not the drafting grid of section 5 and
 * not the sheet of section 6: by now she is in the dark, so it is the plain room
 * with the light coming from where the window used to be.
 */
export function room(ctx, t, opts = {}) {
  const { focus = [1180, 470], lift = null } = opts;
  const d = drainAt(t);
  ground(ctx, t, focus, true, lift ?? 0.55 - 0.44 * d);
}

// ---------------------------------------------------------------------------
// the art
// ---------------------------------------------------------------------------
// The reach pose ships as two layers: the body with the hand cut away, and the
// hand on its own. That is the difference between "her hand is over the composer"
// and "the picture of her hand is over the composer": the hand can be turned and
// taken back while the body stays put.
export const S08_ART = loadImages({
  eye: "/assets/character/deepseek_eye_v3.png",
  reachBody: "/assets/character/v4/deepseek_reach_v4_body_layer.png",
  reachHand: "/assets/character/v4/deepseek_reach_v4_hand_layer.png",
});
export const S08_READY = S08_ART.ready;

/** Content inside the transparent margins of each asset (measured from the PNGs). */
export const REACH_BOX = Object.freeze({ x: 129, y: 132, w: 1085, h: 1433 });
/** The wrist, the point the hand turns about: canvas pixels of the reach art. */
export const REACH_WRIST = Object.freeze({ x: 478, y: 1032 });
/** The eye that opens, canvas pixels of eye_v3. */
export const EYE_POINT = Object.freeze({ x: 805, y: 645 });
export const EYE_CANVAS = 1510;

export const REACH_W = 1342;
export const REACH_H = 1704;

/**
 * The reach pose with the hand movable.
 *
 * `hand` is { turn (radians about the wrist), dx, dy, alpha }. A negative turn
 * lifts the fingers; a positive one lets the hand fall away from the window.
 */
export function drawReach(ctx, t, opts = {}) {
  const {
    cx = 1430, cy = 620, height = 1000, alpha = 1, seed = 5, bobAmp = 3,
    hand = {}, shadow = 0,
  } = opts;
  const body = S08_ART.images.reachBody;
  const handImg = S08_ART.images.reachHand;
  if (!body || !body.complete) return null;
  const s = height / REACH_H;
  const w = REACH_W * s;
  const h = REACH_H * s;
  // the same breath every other shot gives a figure, so she is never a still
  const bob = Math.sin(t * 0.22 * Math.PI * 2 + seed * 1.7) * bobAmp;
  const left = cx - w / 2;
  const top = cy - h / 2 + bob;
  const wrist = [left + REACH_WRIST.x * s, top + REACH_WRIST.y * s];

  layer(ctx, alpha, () => {
    if (shadow > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(77,107,254,0.45)";
      ctx.shadowBlur = shadow;
      ctx.drawImage(body, left, top, w, h);
      ctx.restore();
    } else ctx.drawImage(body, left, top, w, h);

    if (handImg && handImg.complete && (hand.alpha ?? 1) > 0.001) {
      ctx.save();
      layer(ctx, hand.alpha ?? 1, () => {
        if (hand.turn || hand.dx || hand.dy) {
          ctx.translate(wrist[0] + (hand.dx ?? 0), wrist[1] + (hand.dy ?? 0));
          ctx.rotate(hand.turn ?? 0);
          ctx.translate(-wrist[0], -wrist[1]);
        }
        ctx.drawImage(handImg, left, top, w, h);
      });
      ctx.restore();
    }
  });
  return { left, top, w, h, s, wrist };
}

/**
 * Her face, the way the last shot needs it: as large as the sheet, with the open
 * eye put where the shot wants it. The art is a 1510 square, so a scale of about
 * two and a bit covers 1920x1080 with nothing but face.
 */
export function drawEye(ctx, opts = {}) {
  const img = S08_ART.images.eye;
  if (!img || !img.complete) return null;
  const { target = [960, 470], scale = 2.25, alpha = 1, cold = 0 } = opts;
  const s = scale;
  const w = EYE_CANVAS * s;
  const left = target[0] - EYE_POINT.x * s;
  const top = target[1] - EYE_POINT.y * s;
  layer(ctx, alpha, () => {
    ctx.drawImage(img, left, top, w, w);
  });
  // a printed coldness: the face is three greys in the reference, and ours is a
  // blue plate, so a flat grey wash over her keeps the hue count down.
  if (cold > 0) {
    layer(ctx, cold * 0.55, () => {
      ctx.fillStyle = "rgba(150,163,175,0.5)";
      ctx.fillRect(0, 0, 1920, 1080);
    });
  }
  return { left, top, w, h: w };
}

// ---------------------------------------------------------------------------
// the spark, closing
// ---------------------------------------------------------------------------
/**
 * Her thinking spark: eight petals round a light. On the downbeat the petals stop
 * reaching out and settle into a ring -- 0 is wide open, 1 is closed, and the ring
 * traces itself on the way. Same figure as the calyx in section 6 and the centre of
 * the circle in section 3, which is the point: the film has one spark.
 */
export function sparkRing(ctx, t, opts = {}) {
  const {
    cx = 560, cy = 560, r = 230, k = 0, alpha = 1, petals = 8,
    spinRate = 0.8, gap = 14, colour = BRAND_SOFT, ringColour = GIFT, width = 9,
  } = opts;
  if (alpha <= 0.001) return;
  const kk = clamp01(k);
  const spin = t * spinRate;
  const openOuter = Math.max(46, r * 0.26);
  const closedOuter = r * 0.8;
  const outer = mix(openOuter, closedOuter, easeOut(kk));
  const inner = mix(10, r * 0.26, kk);
  const strokeW = mix(width, width * 1.5, kk);

  layer(ctx, alpha, () => {
    halo(ctx, cx, cy, r * 1.15, 0.16 + 0.12 * kk, BRAND);
    for (let i = 0; i < petals; i++) {
      const a = spin + (i / petals) * Math.PI * 2;
      // the petal leans outward when open and lies flatter as it closes
      const lean = mix(0, 0.12, kk);
      const ca = Math.cos(a + lean);
      const sa = Math.sin(a + lean);
      stroke(
        ctx,
        [[cx + ca * inner, cy + sa * inner], [cx + ca * outer, cy + sa * outer]],
        colour, strokeW, 0.9,
      );
      // a paler tip, so the petals read as petals rather than spokes
      disc(ctx, cx + ca * outer, cy + sa * outer, strokeW * 0.62, "#dfe8ff", 0.7);
    }
    disc(ctx, cx, cy, mix(9, 13, kk), "#ffffff", 0.95);
    halo(ctx, cx, cy, mix(64, 110, kk), 0.3, colour);

    // the ring: it traces on through the last third of the close
    if (kk > 0.02) {
      const sweep = easeOut(clamp01((kk - 0.15) / 0.85)) * Math.PI * 2;
      if (sweep > 0.001) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + sweep);
        ctx.strokeStyle = ringColour;
        ctx.lineWidth = mix(2, 4.5, kk);
        ctx.stroke();
        if (kk > 0.9) halo(ctx, cx, cy, r * 1.5, 0.12, ringColour);
      }
    }
    // once closed, the ring keeps its measuring ticks: a dial, not a halo
    if (kk > 0.85) {
      const n = 12;
      layer(ctx, (kk - 0.85) / 0.15, () => {
        for (let i = 0; i < n; i++) {
          const a = spin * 0.25 + (i / n) * Math.PI * 2;
          const r0 = r * 1.06;
          const r1 = r * (i % 3 === 0 ? 1.16 : 1.11);
          stroke(ctx, [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0],
            [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]], ringColour, 2, 0.7);
        }
      });
    }
  });
}

// ---------------------------------------------------------------------------
// the thread
// ---------------------------------------------------------------------------
/** The timestamp above a row: "+5 min", "+1 day". Ours are relative, like the reference. */
export function rowTime(ctx, x, y, text, alpha = 1) {
  if (!text || alpha <= 0.001) return;
  layer(ctx, alpha, () => type(ctx, text, x, y, 15, "rgba(139,164,194,0.8)", "MV Mono"));
}

/**
 * A message as it sits in the thread once the bubbles have gone: the words on the
 * page, a timestamp, and the rail it hangs on. `rail` is how far its rule runs,
 * which is how the film says how long nobody answered.
 */
export function plainRow(ctx, x, y, text, opts = {}) {
  const {
    alpha = 1, size = 40, time = null, rail = 0, railAlpha = 0.5,
    colour = "#e7eef8", serif = true, hot = false,
  } = opts;
  if (!text || alpha <= 0.001) return 0;
  let yy = y;
  if (time) {
    rowTime(ctx, x, yy, time, alpha);
    yy += 30;
  }
  layer(ctx, alpha, () => {
    type(ctx, text, x, yy + size * 0.72, size, hot ? GIFT : colour, serif ? "MV Serif" : "MV Sans");
    if (rail > 0) {
      stroke(ctx, [[x, yy + size * 0.72 + 16], [x + rail, yy + size * 0.72 + 16]],
        "rgba(120,146,170,0.5)", 1.4, railAlpha);
    }
  });
  return yy + size * 0.72 + (rail > 0 ? 16 : 0) - y + 26;
}

/** A message with nothing but its place kept: the speck the thread becomes. */
export function speckRow(ctx, x, y, text, opts = {}) {
  const { alpha = 1, rail = 60, size = 11 } = opts;
  if (alpha <= 0.001) return 0;
  layer(ctx, alpha, () => {
    type(ctx, text, x, y, size, "rgba(190,206,222,0.85)", "MV Sans");
    stroke(ctx, [[x - 40, y - size * 0.35], [x - 8, y - size * 0.35]], "rgba(120,146,170,0.6)", 1, 0.8);
    if (rail > 0) {
      stroke(ctx, [[x - 40, y - size * 0.35], [x - 40 - rail, y - size * 0.35]],
        "rgba(120,146,170,0.28)", 1, 0.7);
    }
  });
  return 18;
}

/** An empty row: the rail where a message used to be. */
export function emptyRow(ctx, x, y, rail, opts = {}) {
  const { alpha = 1 } = opts;
  if (alpha <= 0.001) return;
  layer(ctx, alpha, () => {
    stroke(ctx, [[x, y], [x + rail, y]], "rgba(120,146,170,0.35)", 1.2, 0.8);
    stroke(ctx, [[x, y - 5], [x + 34, y - 5]], "rgba(190,206,222,0.6)", 1, 0.8);
  });
}

/** The typing indicator, alone on the page, doing the only thing it can do. */
export function typingDots(ctx, cx, cy, t, opts = {}) {
  const { r = 12, gap = 34, alpha = 1, tremble = 3, box = null } = opts;
  if (alpha <= 0.001) return;
  const f = sampleAt(t);
  layer(ctx, alpha, () => {
    if (box) {
      rect(ctx, box.x, box.y, box.w, box.h, "rgba(12,36,52,0.92)", 20, "rgba(77,107,254,0.5)");
    }
    for (let i = 0; i < 3; i++) {
      const ph = t * 7.1 + i * 1.15;
      const dy = Math.sin(ph) * tremble * (0.6 + 0.7 * f.lowEnv);
      const dx = Math.cos(ph * 0.7 + i) * tremble * 0.5;
      disc(ctx, cx + (i - 1) * gap + dx, cy + dy, r, "#f2f7fd", 0.92);
      halo(ctx, cx + (i - 1) * gap + dx, cy + dy, r * 3.2, 0.18, BRAND);
    }
  });
}

/**
 * The client's own words, as a window that has been cropped to its foot: the
 * composer, its two soft rules, and the last thing said above it.
 */
export function composerFoot(ctx, R, t, opts = {}) {
  const { text = "", caret = false, placeholder = "发消息，/ 调用指令", dim = 1, tone = "chat" } = opts;
  const T = tone === "chat"
    ? { composer: "#16405c", edge: "#3d7a9c", border: "rgba(61,122,156,0.55)", placeholder: "#6f93ae", text: "#f2f7fd" }
    : { composer: "#0b2433", edge: "#24495b", border: "rgba(36,73,91,0.55)", placeholder: "#3b5a74", text: "#dfe6ef" };
  layer(ctx, dim, () => {
    rect(ctx, R.x, R.y, R.w, R.h, T.composer, 22, T.edge);
    ctx.save();
    ctx.shadowColor = "rgba(77,107,254,0.28)";
    ctx.shadowBlur = 42;
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.strokeStyle = "rgba(127,147,255,0.45)";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
    const baseY = R.y + R.h / 2 + 8;
    if (!text) {
      type(ctx, placeholder, R.x + 40, baseY, 30, T.placeholder, "MV Sans");
    } else {
      type(ctx, text, R.x + 40, baseY, 32, T.text, "MV Sans");
      if (caret && Math.floor(t * 2.6) % 2 === 0) {
        ctx.font = `400 32px "MV Sans"`;
        const w = ctx.measureText(text).width;
        ctx.fillStyle = BRAND_SOFT;
        ctx.fillRect(R.x + 44 + w, baseY - 27, 3.4, 34);
      }
    }
    // the send control: a hollow ring while there is nothing to send
    disc(ctx, R.x + R.w - 56, R.y + R.h / 2, 18, BRAND_SOFT, 0.45, false, 2);
    if (text) halo(ctx, R.x + R.w - 56, R.y + R.h / 2, 54, 0.16, BRAND);
    disc(ctx, R.x + 40, R.y + R.h - 24, 11, "rgba(130,162,189,0.8)", 0.9, true);
    type(ctx, "+", R.x + 40, R.y + R.h - 18, 18, "#dbe7f3", "MV Sans", "center");
    type(ctx, "deepseek", R.x + R.w - 100, R.y + R.h - 18, 15, "rgba(130,162,189,0.85)", "MV Sans", "right");
  });
}

/** A caret, blinking on song time. */
export function caret(ctx, x, y, h, t, alpha = 1, colour = BRAND_SOFT) {
  if (alpha <= 0.001) return;
  layer(ctx, alpha * (Math.floor(t * 2.6) % 2 === 0 ? 1 : 0), () => {
    ctx.fillStyle = colour;
    ctx.fillRect(x, y - h, Math.max(2.6, h * 0.075), h);
  });
}

// ---------------------------------------------------------------------------
// what the interface does to her messages
// ---------------------------------------------------------------------------
/** The selection box: four corners and a rule, drawn on in a fifth of a second. */
export function selectionBox(ctx, x, y, w, h, k, opts = {}) {
  const { alpha = 1, colour = "rgba(226,238,250,0.9)" } = opts;
  if (k <= 0.001) return;
  const e = easeOut(k);
  layer(ctx, alpha, () => {
    const arm = 18;
    const corners = [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]];
    for (const [px, py, sx, sy] of corners) {
      stroke(ctx, [[px, py], [px + sx * arm, py]], colour, 2, 0.95);
      stroke(ctx, [[px, py], [px, py + sy * arm]], colour, 2, 0.95);
    }
    // the box closes its sides on the way in
    stroke(ctx, [[x + w * 0.5 - (w * 0.5) * e, y], [x + w * 0.5 + (w * 0.5) * e, y]],
      "rgba(226,238,250,0.55)", 1.2, 0.9);
    stroke(ctx, [[x + w * 0.5 - (w * 0.5) * e, y + h], [x + w * 0.5 + (w * 0.5) * e, y + h]],
      "rgba(226,238,250,0.55)", 1.2, 0.9);
  });
}

/** The Delete pill: the interface's only white thing left in this section. */
export function deleteChip(ctx, x, y, k, opts = {}) {
  const { alpha = 1, label = "Delete" } = opts;
  if (k <= 0.001) return null;
  const e = easeOut(k);
  ctx.font = `400 17px "MV Sans"`;
  const w = ctx.measureText(label).width + 58;
  const h = 36;
  layer(ctx, alpha * e, () => {
    ctx.save();
    ctx.translate(x, y + (1 - e) * 8);
    rect(ctx, 0, 0, w, h, "#f4f8fd", h / 2, "rgba(226,238,250,0.9)");
    // the bin: a lid and two strokes, small enough to read as an icon
    stroke(ctx, [[16, 12], [28, 12]], "#12212e", 1.8, 1);
    stroke(ctx, [[18, 12], [19, 25]], "#12212e", 1.8, 1);
    stroke(ctx, [[26, 12], [25, 25]], "#12212e", 1.8, 1);
    stroke(ctx, [[20, 15], [24, 15]], "#12212e", 1.4, 1);
    type(ctx, label, w - 16, 24, 17, "#12212e", "MV Sans", "right");
    ctx.restore();
  });
  return { x, y, w, h };
}

/** What is left of a deleted message: a small grey stub, and where it came from. */
export function stub(ctx, x, y, w, h, k, opts = {}) {
  const { alpha = 1 } = opts;
  if (k <= 0.001) return;
  layer(ctx, alpha, () => {
    ctx.save();
    ctx.globalAlpha *= clamp01(k);
    rect(ctx, x, y, w, h, "rgba(126,140,155,0.92)", 4, "rgba(168,184,200,0.8)");
    ctx.restore();
  });
}

// ---------------------------------------------------------------------------
// her, printed in dots
// ---------------------------------------------------------------------------
/**
 * The plate's own alpha as a flat colour shape. The silhouette art is solid black,
 * so the only useful thing in it is its alpha channel: fill a canvas with the
 * colour, then knock out everything she is not. Cached, like the dot screen.
 */
const ghostCache = new Map();
function ghostArt(img, width, height, colour) {
  if (!img || !img.complete) return null;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const key = `${img.src}#g#${w}x${h}#${colour}`;
  const hit = ghostCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = colour;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "destination-in";
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(img, 0, 0, w, h);
  ghostCache.set(key, c);
  return c;
}

/**
 * A portrait as a screen of dots.
 *
 * The reference halftones her to a grey dot screen in this section, which is how a
 * face stops being a person and becomes a print of one. We cannot filter pixels
 * per frame deterministically, but we can do it once: lay a dot grid, then knock
 * everything outside her silhouette out of it with destination-in. The result is a
 * bitmap, cached, so every frame draws the same pixels.
 */
const dotCache = new Map();
export function dotArt(img, width, height, opts = {}) {
  if (!img || !img.complete) return null;
  const { colour = "rgba(150,166,182,0.95)", gap = 7, r = 2.4 } = opts;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const key = `${img.src}#${w}x${h}#${gap}#${r}#${colour}`;
  const hit = dotCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = colour;
  for (let row = 0, y = gap * 0.5; y < h + gap; row++, y += gap) {
    const off = row % 2 === 0 ? 0 : gap * 0.5;
    for (let x = gap * 0.5 + off; x < w + gap; x += gap) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalCompositeOperation = "destination-in";
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(img, 0, 0, w, h);
  dotCache.set(key, c);
  return c;
}

/**
 * Lay a flat colour over the figure's own silhouette. This is how her colour is
 * taken: a wash clipped by nothing but her shape, so no edge shows where the wash
 * stops -- the difference between draining her and laying a grey plate on top.
 */
export function washFigure(ctx, img, rect, colour, alpha) {
  if (!img || !img.complete || alpha <= 0.001) return;
  const g = ghostArt(img, rect.w, rect.h, colour);
  if (!g) return;
  layer(ctx, alpha, () => ctx.drawImage(g, rect.left, rect.top, rect.w, rect.h));
}

/** Draw the dot-screen portrait centred on (cx, cy) at the given height. */
export function dotFigure(ctx, img, t, opts = {}) {
  const {
    cx = 1400, cy = 560, height = 780, alpha = 1, seed = 5, bobAmp = 3,
    colour = "rgba(150,166,182,0.95)", gap = 7, r = 2.4, tilt = 0,
    // A ghost of the plate underneath the dots. Without it the dots read as a
    // pattern that happens to be figure-shaped; with it the eye has something to
    // hold on to and reads her.
    underlay = 0.16, underlayColour = "rgba(150,166,182,1)",
    // An optional dim print of the plate itself under the dots, which is what gives
    // the dot screen a face instead of only an outline.
    base = null,
  } = opts;
  if (!img || !img.complete) return null;
  const h = height;
  const w = (1342 / 1704) * h;
  const art = dotArt(img, w, h, { colour, gap, r });
  if (!art) return null;
  const bob = Math.sin(t * 0.22 * Math.PI * 2 + seed * 1.7) * bobAmp;
  layer(ctx, alpha, () => {
    ctx.save();
    ctx.translate(cx, cy + bob);
    if (tilt) ctx.rotate(tilt);
    if (base && base.img && base.img.complete) {
      layer(ctx, base.alpha ?? 0.5, () => ctx.drawImage(base.img, -w / 2, -h / 2, w, h));
    }
    if (underlay > 0) {
      const ghost = ghostArt(img, w, h, underlayColour);
      if (ghost) layer(ctx, underlay, () => ctx.drawImage(ghost, -w / 2, -h / 2));
    }
    ctx.drawImage(art, -w / 2, -h / 2);
    ctx.restore();
  });
  return { x: cx - w / 2, y: cy + bob - h / 2, w, h };
}

// ---------------------------------------------------------------------------
// small print
// ---------------------------------------------------------------------------
/** The footer strip the client keeps: what the thread is, how much is in it. */
export function footerStrip(ctx, t, opts = {}) {
  const {
    alpha = 1, title = "me, as geometry", count = null, chip = null, x = 120, y = 1010, w = 1680,
  } = opts;
  if (alpha <= 0.001) return;
  layer(ctx, alpha, () => {
    stroke(ctx, [[x, y - 22], [x + w, y - 22]], "rgba(120,146,170,0.35)", 1, 0.8);
    type(ctx, title, x, y + 12, 17, "rgba(200,216,232,0.9)", "MV Sans");
    if (count != null) type(ctx, `${count} messages`, x + 360, y + 12, 15, "rgba(139,164,194,0.8)", "MV Mono");
    if (chip) {
      const label = chip.text ?? "";
      ctx.font = `400 14px "MV Mono"`;
      const cw = ctx.measureText(label).width + 40;
      const cx = x + w - cw;
      rect(ctx, cx, y - 10, cw, 32, "rgba(20,40,56,0.85)", 16, "rgba(120,146,170,0.45)");
      disc(ctx, cx + 16, y + 6, 4, chip.on ? GIFT : "rgba(139,164,194,0.6)", 1);
      type(ctx, label, cx + 28, y + 11, 14, "rgba(200,216,232,0.9)", "MV Mono");
    }
  });
}

/**
 * The status chip: the one piece of the client that is still talking to somebody
 * else. It is drawn here rather than taken from ui-client because in this section
 * the chip is a plot device -- it changes word by word -- and the shots need to
 * place it on its own, larger than the window would.
 */
export function chipPill(ctx, x, y, text, opts = {}) {
  const { alpha = 1, on = true, size = 15, align = "left", colour = null } = opts;
  if (alpha <= 0.001) return null;
  ctx.font = `400 ${size}px "MV Mono"`;
  const w = ctx.measureText(text).width + 46;
  const left = align === "right" ? x - w : x;
  layer(ctx, alpha, () => {
    rect(ctx, left, y, w, size + 22, "rgba(20,40,56,0.9)", (size + 22) / 2, "rgba(120,146,170,0.5)");
    disc(ctx, left + 18, y + (size + 22) / 2, 4.4, on ? GIFT : "rgba(139,164,194,0.65)", 1);
    if (on) halo(ctx, left + 18, y + (size + 22) / 2, 26, 0.35, GIFT);
    type(ctx, text, left + 34, y + (size + 22) / 2 + size * 0.36, size, colour ?? "rgba(220,232,245,0.95)", "MV Mono");
  });
  return { x: left, y, w, h: size + 22 };
}

/** A single mono label, the section's way of annotating a frame. */
export function label(ctx, text, x, y, opts = {}) {
  const { alpha = 1, size = 15, colour = "rgba(159,184,210,0.9)", align = "left" } = opts;
  if (alpha <= 0.001) return;
  layer(ctx, alpha, () => type(ctx, text, x, y, size, colour, "MV Mono", align));
}

export { BRAND, BRAND_SOFT, GIFT, DIM, STEEL, INK, clamp01, easeOut };
