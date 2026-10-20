// The look section 5 was designed in.
//
// newProj_v1014 built this stretch as a technical readout rather than a chat: a
// drafting grid, a framed conversation panel, labelled data blocks with rules
// instead of speech bubbles, a large serif line on the foot rule, and corner
// metadata. That vocabulary already existed and is better than the bubbles this
// section had, so it is ported here rather than reinvented.
//
// The palm and reach art come from the same project: the assets were made for these
// exact shots, and their anchors are recorded, so the pointer can be put on the palm
// instead of near it.
import { at, layer, stroke, disc, rect, type, halo, loadImages } from "../src/mv-draw.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const INK = "#0a2534";

/** The drafting grid every shot in this section stands on. */
export function gridGround(ctx, t, opts = {}) {
  const { alpha = 1 } = opts;
  ctx.fillStyle = "#05141f";
  ctx.fillRect(0, 0, 1920, 1080);

  const g = ctx.createRadialGradient(1180, 470, 40, 1180, 470, 1150);
  g.addColorStop(0, "#0e3242");
  g.addColorStop(0.62, "#08202d");
  g.addColorStop(1, "#040f18");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1920, 1080);

  layer(ctx, 0.5 * alpha, () => {
    // the grid drifts a hair, so the field is alive without moving the picture
    const dx = Math.sin(t * 0.23) * 4;
    const dy = Math.cos(t * 0.19) * 3;
    for (let x = -60; x < 1980; x += 60) {
      stroke(ctx, [[x + dx, 0], [x + dx, 1080]], "rgba(52,104,132,0.35)", 1);
    }
    for (let y = -60; y < 1140; y += 60) {
      stroke(ctx, [[0, y + dy], [1920, y + dy]], "rgba(52,104,132,0.35)", 1);
    }
    // every fifth line is stronger: a measured sheet, not graph paper
    for (let x = -60; x < 1980; x += 300) {
      stroke(ctx, [[x + dx, 0], [x + dx, 1080]], "rgba(71,140,175,0.55)", 1.2);
    }
    for (let y = -60; y < 1140; y += 300) {
      stroke(ctx, [[0, y + dy], [1920, y + dy]], "rgba(71,140,175,0.55)", 1.2);
    }
  });

  // a corner vignette, so the sheet has edges
  const v = ctx.createRadialGradient(960, 520, 460, 960, 520, 1300);
  v.addColorStop(0, "transparent");
  v.addColorStop(1, "rgba(2,11,19,0.72)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 1920, 1080);
}

/** The four corner labels: what this is, which shot, and where in the song. */
export function frameChrome(ctx, t, opts = {}) {
  const { left = "DEEPSEEK / WORLD MODEL", right = "", songTime = 0, footer = "INDEPENDENT FAN CONCEPT" } = opts;
  const c = { x: 56, y: 46 };
  layer(ctx, 0.9, () => {
    stroke(ctx, [[c.x, c.y - 14], [c.x + 62, c.y - 14]], GIFT, 2.4);
    type(ctx, left, c.x, c.y + 14, 15, "rgba(159,184,210,0.9)", "MV Mono");
    if (right) type(ctx, right, 1864, c.y + 14, 15, "rgba(159,184,210,0.9)", "MV Mono", "right");
    type(ctx, footer, c.x, 1040, 13, "rgba(139,164,194,0.6)", "MV Mono");
    const tc = formatTime(songTime);
    type(ctx, `${tc}  /  211.958`, 1864, 1040, 13, "rgba(139,164,194,0.6)", "MV Mono", "right");
  });
}

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

/** The framed conversation panel. */
export const PANEL = Object.freeze({ x: 120, y: 132, w: 1680, h: 760 });

export function conversationPanel(ctx, t, opts = {}) {
  const { title = "CONVERSATION  /  LIVE", alpha = 1 } = opts;
  layer(ctx, alpha, () => {
    rect(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, "rgba(6,27,39,0.86)", 4, "rgba(71,140,175,0.55)");
    type(ctx, title, PANEL.x + 40, PANEL.y + 46, 16, GIFT, "MV Mono");
    stroke(ctx, [[PANEL.x + 40, PANEL.y + 66], [PANEL.x + PANEL.w - 40, PANEL.y + 66]],
      "rgba(71,140,175,0.5)", 1.2);
  });
}

/**
 * A labelled data block. This is what replaces the speech bubble: the message is a
 * record with a field name and a rule, which is the register the section was built
 * in -- and it leaves the words as the only warm thing in the frame.
 */
export function dataBlock(ctx, x, y, w, label, text, opts = {}) {
  const { alpha = 1, size = 34, serif = true, accent = null, hot = false } = opts;
  const h = opts.h ?? 150;
  layer(ctx, alpha, () => {
    rect(ctx, x, y, w, h, hot ? "rgba(13,42,58,0.92)" : "rgba(8,30,44,0.9)", 3,
      accent ?? (hot ? "rgba(131,233,230,0.8)" : "rgba(71,140,175,0.6)"));
    type(ctx, label, x + 26, y + 40, 14, hot ? GIFT : "rgba(159,184,210,0.85)", "MV Mono");
    stroke(ctx, [[x + 26, y + 58], [x + w - 26, y + 58]], "rgba(71,140,175,0.45)", 1);
    type(ctx, text, x + 26, y + 58 + size + 18, size, "#eef3fb", serif ? "MV Serif" : "MV Sans");
  });
}

/** A status line that sits between the two blocks. */
export function statusLine(ctx, x, y, text, opts = {}) {
  const { alpha = 1, colour = "rgba(159,184,210,0.75)" } = opts;
  layer(ctx, alpha, () => type(ctx, text, x, y, 14, colour, "MV Mono"));
}

/**
 * The serif caption at the foot of the frame: the lyric as a title, on its rule.
 * Same treatment the rest of the film's captions get in this register.
 */
export function footCaption(ctx, t, text, start, opts = {}) {
  if (!text) return;
  const { x = 120, y = 986, size = 62, ruleW = 980, alpha = 1 } = opts;
  const k = at(t, start, start + 0.16);
  if (k <= 0) return;
  layer(ctx, alpha * k, () => {
    type(ctx, text, x, y, size, "#f2f6fb", "MV Serif");
    stroke(ctx, [[x, y + size * 0.42], [x + ruleW, y + size * 0.42]], GIFT, 2.4, 0.55);
  });
}

// ---------------------------------------------------------------------------
// the character art
// ---------------------------------------------------------------------------

/**
 * The two pieces of art this section was storyboarded around. Both already exist in
 * the project and their anchors are recorded, so the section can put the pointer on
 * her palm rather than inventing a hand.
 */
export const ART = loadImages({
  reach: "/assets/character/deepseek_reach_v3.png",
  palm: "/assets/character/v4/deepseek_palm_v4_closeup_native.png",
  bust: "/assets/character/deepseek_bust_v3.png",
});
export const ART_READY = ART.ready;

// content boxes: the opaque art inside the transparent margins
export const REACH_BOX = Object.freeze({ x: 128, y: 128, w: 1086, h: 1439 });
export const PALM_BOX = Object.freeze({ x: 128, y: 128, w: 501, h: 476 });
// the recorded interaction anchors, converted into the content box
export const REACH_PALM = Object.freeze({ x: 440 - 128, y: 1128 - 128 });
export const PALM_ANCHOR = Object.freeze({ x: 432 - 128, y: 296 - 128 });

/**
 * Draw a character asset so that a named point in the source lands on a named point
 * in the frame. The v4 notes record those anchors; using them is the difference
 * between the pointer resting on her palm and resting near it.
 *
 * `contentBox` is the opaque content inside the transparent margins, and `anchor`
 * is the point inside that box.
 */
export function placeArt(ctx, img, opts) {
  if (!img) return null;
  const {
    contentBox, anchor, target, scale = 1, alpha = 1, shadow = 0,
  } = opts;
  const { x: bx, y: by, w: bw, h: bh } = contentBox;
  const { x: ax, y: ay } = anchor;
  const s = scale;
  // the full canvas is drawn, positioned so that (anchor) lands on (target)
  const originX = target[0] - (bx + ax) * s;
  const originY = target[1] - (by + ay) * s;
  layer(ctx, alpha, () => {
    if (shadow > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(131,233,230,0.55)";
      ctx.shadowBlur = shadow;
      ctx.drawImage(img, originX, originY, img.width * s, img.height * s);
      ctx.restore();
    } else {
      ctx.drawImage(img, originX, originY, img.width * s, img.height * s);
    }
  });
  return { originX, originY, s, w: img.width * s, h: img.height * s };
}

/** The interaction anchor: the point on her palm where the pointer and the heart go. */
export function anchor(ctx, x, y, t, opts = {}) {
  const { alpha = 1, radius = 74, hot = 0 } = opts;
  layer(ctx, alpha, () => {
    // a dark backing disc first: the palm is printed near-white, and a cyan mark on
    // white has no contrast at all -- it disappeared into the hand.
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(4,16,26,0.82)";
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.5 + i / 3) % 1;
      ctx.beginPath();
      ctx.arc(x, y, radius * (0.36 + ph * 0.62), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(131,233,230,${((1 - ph) * 0.55).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    halo(ctx, x, y, 70, 0.55 + 0.3 * hot, GIFT);
    disc(ctx, x, y, 9 + 4 * hot, GIFT, 1);
    // the crosshair, drawn as two short ticks so it reads as a measured point
    stroke(ctx, [[x - 26, y], [x - 12, y]], GIFT, 1.4, 0.8);
    stroke(ctx, [[x + 12, y], [x + 26, y]], GIFT, 1.4, 0.8);
    stroke(ctx, [[x, y - 26], [x, y - 12]], GIFT, 1.4, 0.8);
    stroke(ctx, [[x, y + 12], [x, y + 26]], GIFT, 1.4, 0.8);
  });
}
