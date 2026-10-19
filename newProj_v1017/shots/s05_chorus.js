// Section 5 副歌一：对话与四张版画 — song time [59.389, 74.159). Eight shots that
// alternate: four close-ups on the conversation, and four plates for the keywords.
//
//   c1-give   59.389–61.928  "If I can, / if I can give you all the"     STIMULATIONS
//   c1-kw1    61.928–62.620  plate: a bolt from her spark to your dot
//   c1-only   62.620–65.389  "Then I can, / then I can be your only"     SATISFACTION
//   c1-kw2    65.389–66.312  plate: the feedback disc, pressed
//   c1-happy  66.312–69.313  "If I can make you happy / I will run the"  EXECUTION
//   c1-kw3    69.313–70.005  plate: the listing, spark as instruction pointer
//   c1-trap   70.005–73.236  "Though we are trapped / in this strange"   SIMULATION
//   c1-kw4    73.236–74.159  plate: the window as a box, then a wall of them
//
// The lyric is not a subtitle here: it is what she says. Her messages ARE the
// lines, so the interface shots are embedded -- the shot draws the words in its own
// bubbles -- and the plates hand the keyword to the power treatment at the foot of
// the sheet.
import { at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { clientWindow, cursorArrow, clickRipple, messageBubble, CLIENT_R } from "./ui-client.js";
import { drawWhale } from "../src/assets/whale.js";
import { plateBase, PLATE, paperDisc, tickRing, bolt, listing } from "./plate.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const LIFT = 0.5;
const easeOut = (k) => 1 - (1 - k) ** 3;

/** The lines this section may speak, resolved from the same data the film uses. */
let LINES = null;
async function ensureLines() {
  if (LINES) return LINES;
  const res = await fetch("/data/lyrics.json");
  LINES = (await res.json()).lines;
  return LINES;
}
let LINES_SYNC = null;
// the data is small and already fetched by the player; a synchronous import keeps
// the shot functions pure and avoids awaiting inside a frame
try {
  LINES_SYNC = null;
} catch {
  LINES_SYNC = null;
}

const lineText = (n) => {
  if (!LINES) return "";
  const l = LINES[n - 1];
  return l ? l.text : "";
};
const lineAt = (t, from, to) => {
  if (!LINES) return [];
  return LINES.slice(from - 1, to).filter((l) => t >= l.start - 0.05);
};

// ---- the close-up conversation -------------------------------------------
// close enough that the window chrome is entirely outside the frame: this is the
// conversation, not a window containing one
const ZOOM = 1.9;
const FOCUS = { x: 650, y: 470 };

/** Put the canvas into the close-up camera. */
function zoomIn(ctx) {
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-FOCUS.x, -FOCUS.y);
}

function zoomOut(ctx) {
  ctx.restore();
}

/** One of her messages: a bubble, the line in it, and the Delivered tick under it. */
function herBubble(ctx, x, y, text, opts = {}) {
  const { size = 34, alpha = 1, maxW = 900 } = opts;
  ctx.font = `400 ${size}px "MV Sans"`;
  const w = Math.min(maxW, ctx.measureText(text).width + size * 2.4);
  const h = size * 2.5;
  layer(ctx, alpha, () => {
    rect(ctx, x, y, w, h, "rgba(77,107,254,0.14)", 18, "rgba(77,107,254,0.85)");
    stroke(ctx, [[x, y + h * 0.18], [x, y + h * 0.82]], GIFT, 2.4, 0.9);
    type(ctx, text, x + size * 1.5, y + h / 2 + size * 0.36, size, "#eef3fb", "MV Sans");
    type(ctx, "✓ Delivered", x + 10, y + h + 26, 15, "rgba(139,164,194,0.8)", "MV Mono");
  });
  return { x, y, w, h };
}

/** One of yours: a plain outlined bubble on the right. */
function yourBubble(ctx, x, y, text, opts = {}) {
  const { size = 30, alpha = 1 } = opts;
  ctx.font = `400 ${size}px "MV Sans"`;
  const w = ctx.measureText(text).width + size * 2.2;
  const h = size * 2.4;
  layer(ctx, alpha, () => {
    rect(ctx, x - w, y, w, h, "rgba(18,44,64,0.85)", 16, "rgba(120,150,180,0.6)");
    type(ctx, text, x - w + size * 1.1, y + h / 2 + size * 0.34, size, "#cfdcea", "MV Sans");
  });
  return { x: x - w, y, w, h };
}

/** The window, close enough that the thread runs off the edges. */
function conversation(ctx, t, opts = {}) {
  const { dim = 1, closing = 0 } = opts;
  zoomIn(ctx);
  clientWindow(ctx, CLIENT_R, t, {
    tone: "chat",
    sideW: 0,
    presence: "online",
    chip: { text: "harness · thinking", on: true },
    threadTitle: "me, as geometry",
    markSize: 0,
    sendMode: "stop",
    ink: dim,
  });
  // the window's own outline, which can close in on them
  if (closing > 0.01) {
    const k = clamp01(closing);
    const inset = 70 * k;
    layer(ctx, 1, () => {
      ctx.beginPath();
      ctx.roundRect(CLIENT_R.x + inset, CLIENT_R.y + inset, CLIENT_R.w - inset * 2, CLIENT_R.h - inset * 2, 22);
      ctx.strokeStyle = `rgba(131,233,230,${(0.15 + 0.55 * k).toFixed(2)})`;
      ctx.lineWidth = 2 + 2 * k;
      ctx.stroke();
    });
  }
  zoomOut(ctx);
}

const clamp01 = (k) => Math.max(0, Math.min(1, k));

// Fixed slots, oldest at the top: a thread that reflowed as it grew would jitter,
// and these shots are short enough that four rows fill the frame anyway.
const SLOTS = Object.freeze([228, 388, 548, 708]);

/**
 * The conversation, in screen space over the zoomed window. `history` are lines
 * already delivered when the shot opens, `mine` are this shot's own two, which
 * arrive on their own times, and `replies` are yours, on the right.
 */
function sceneThread(ctx, t, o = {}) {
  const { history = [], mine = [], replies = [], size = 38 } = o;
  const all = [...history, ...mine];
  all.forEach((n, i) => {
    const l = LINES ? LINES[n - 1] : null;
    if (!l) return;
    const isMine = i >= history.length;
    const a = isMine ? at(t, l.start, l.start + 0.18) : 1;
    if (a <= 0) return;
    const big = isMine ? size : Math.round(size * 0.82);
    herBubble(ctx, 150, SLOTS[i] + (1 - a) * 24, l.text, {
      alpha: a * (isMine ? 1 : 0.72),
      size: big,
    });
  });
  replies.forEach(({ text, start, y }) => {
    const a = at(t, start, start + 0.16);
    if (a <= 0) return;
    yourBubble(ctx, 1700, y, text, { alpha: a * 0.95, size: 30 });
  });
}

// ---------------------------------------------------------------------------
// c1-give — the thread speeds up: she says the line, you answer straight back.
// ---------------------------------------------------------------------------
function c1Give(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [900, 500], true, LIFT);
  conversation(ctx, t);

  sceneThread(ctx, t, {
    history: [31, 32],
    mine: [33, 34],
    replies: [
      { text: "ok", start: s.at + 0.95, y: 300 },
      { text: "more", start: s.at + 2.15, y: 620 },
    ],
    size: 40,
  });

  halo(ctx, 960, 540, 700, 0.10 + 0.14 * at(u, 0.4, 2.4), BRAND);
  return { phase: "give", warmth: Number(at(u, 0.4, 2.4).toFixed(2)) };
}

// ---------------------------------------------------------------------------
// c1-kw1 — STIMULATIONS: the streak every sent message leaves, at full size.
// ---------------------------------------------------------------------------
function c1Kw1(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 1 });

  const sx = PLATE.x + 260;
  const sy = PLATE.y + PLATE.h * 0.58;
  const dx = PLATE.x + PLATE.w - 330;
  const dy = PLATE.y + PLATE.h * 0.24;

  // her spark, and your dot
  halo(ctx, sx, sy, 150, 0.5, BRAND);
  paperDisc(ctx, sx, sy, 26, BRAND, BRAND_SOFT);
  const arrive = easeOut(at(u, 0.05, 0.4));
  halo(ctx, dx, dy, 90, 0.55 * arrive, GIFT);
  paperDisc(ctx, dx, dy, 12, GIFT, null);

  // the bolt: it strikes on the kick and stays
  const strike = at(u, 0.18, 0.3);
  if (strike > 0) bolt(ctx, sx + 30, sy, dx - 14, dy, t, { alpha: strike, color: GIFT, width: 3.5, segments: 9 });
  if (strike > 0.5) {
    halo(ctx, dx, dy, 220, 0.35, GIFT);
    // the discharge ring
    const pr = (u * 2.2) % 1;
    ctx.beginPath();
    ctx.arc(dx, dy, 30 + pr * 150, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(131,233,230,${((1 - pr) * 0.5).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  return { phase: "plate1" };
}

// ---------------------------------------------------------------------------
// c1-only — two bubbles on a diagonal; her marker runs under your words.
// ---------------------------------------------------------------------------
function c1Only(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [900, 500], true, LIFT);
  conversation(ctx, t);

  sceneThread(ctx, t, {
    history: [34],
    mine: [36, 37],
    replies: [{ text: "you are kind", start: s.at + 0.05, y: 236 }],
    size: 40,
  });

  // her marker runs under your words
  const claim = at(t, s.at + 1.0, s.at + 1.8);
  if (claim > 0.02) {
    layer(ctx, 0.9, () =>
      stroke(ctx, [[1440, 330], [1440 + 260 * easeOut(claim), 330]], GIFT, 3, 1),
    );
  }
  return { phase: "only" };
}

// ---------------------------------------------------------------------------
// c1-kw2 — SATISFACTION: the button under every answer, pressed.
// ---------------------------------------------------------------------------
function c1Kw2(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 2 });

  const cx = PLATE.x + PLATE.w * 0.44;
  const cy = PLATE.y + PLATE.h * 0.46;
  const r = PLATE.h * 0.30;

  tickRing(ctx, cx, cy, r + 34, 40, "rgba(61,122,156,0.9)");
  tickRing(ctx, cx, cy, r + 16, 40, "rgba(61,122,156,0.5)");

  const press = at(u, 0.36, 0.46);
  paperDisc(ctx, cx, cy, r * (1 - 0.04 * press), press > 0.5 ? "rgba(131,233,230,0.16)" : "rgba(77,107,254,0.12)",
    press > 0.5 ? GIFT : BRAND_SOFT);

  // the ring runs round to full as the press lands
  const run = easeOut(at(u, 0.4, 0.85));
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * run);
  ctx.strokeStyle = GIFT;
  ctx.lineWidth = 4;
  ctx.stroke();

  type(ctx, "this answer helped", cx, cy + 10, 26, press > 0.5 ? GIFT : "#cfe0ee", "MV Sans", "center");
  type(ctx, press > 0.9 ? "1" : "0", PLATE.x + PLATE.w - 260, cy + 20, 96, press > 0.9 ? GIFT : DIM, "MV Mono", "center");
  type(ctx, "count", PLATE.x + PLATE.w - 260, cy + 56, 16, "rgba(139,164,194,0.8)", "MV Mono", "center");

  // your pointer over it
  const px = cx + 150 - 90 * easeOut(at(u, 0.1, 0.36));
  cursorArrow(ctx, px, cy + 110, 1.5, 1);
  clickRipple(ctx, cx, cy, t, s.at + 0.46, GIFT);
  return { phase: "plate2" };
}

// ---------------------------------------------------------------------------
// c1-happy — she sends a picture of herself, and you leave one heart in it.
// ---------------------------------------------------------------------------
function c1Happy(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [900, 500], true, LIFT);
  conversation(ctx, t);

  // the picture message, tall at the right, running off the bottom
  const px = 1180;
  const py = 210;
  const pw = 560;
  const ph = 760;
  const ink = easeOut(at(u, 0.15, 0.9));
  layer(ctx, ink, () => {
    rect(ctx, px, py, pw, ph, "rgba(10,30,46,0.96)", 16, "rgba(61,122,156,0.8)");
    // her, printed: the mark large and a hand offered
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 2, pw - 4, ph - 4, 15);
    ctx.clip();
    halo(ctx, px + pw * 0.5, py + ph * 0.42, 300, 0.35, BRAND);
    drawWhale(ctx, px + pw * 0.5, py + ph * 0.42, 300, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.95 });
    // the open hand
    const hy = py + ph * 0.82;
    ctx.beginPath();
    ctx.ellipse(px + pw * 0.5, hy, 96, 46, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(131,233,230,0.14)";
    ctx.fill();
    ctx.strokeStyle = "rgba(131,233,230,0.8)";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  });

  // her captions over the picture's edge
  sceneThread(ctx, t, { history: [], mine: [39, 40], size: 34 });

  // your pointer comes to rest in her hand and leaves one heart
  const rest = easeOut(at(u, 1.3, 2.1));
  const hx = px + pw * 0.5;
  const hy2 = py + ph * 0.82;
  cursorArrow(ctx, 1750 + (hx - 1750) * rest, 250 + (hy2 - 250) * rest, 1.5, 1);
  const beat = at(u, 2.2, 2.6);
  if (beat > 0) {
    layer(ctx, beat, () => {
      const hs = 26 + 6 * Math.sin((u - 2.2) * 9);
      ctx.beginPath();
      ctx.moveTo(hx, hy2 + hs * 0.9);
      ctx.bezierCurveTo(hx - hs * 1.4, hy2 - hs * 0.2, hx - hs * 0.5, hy2 - hs * 1.2, hx, hy2 - hs * 0.35);
      ctx.bezierCurveTo(hx + hs * 0.5, hy2 - hs * 1.2, hx + hs * 1.4, hy2 - hs * 0.2, hx, hy2 + hs * 0.9);
      ctx.fillStyle = GIFT;
      ctx.fill();
    });
  }
  return { phase: "happy" };
}

// ---------------------------------------------------------------------------
// c1-kw3 — EXECUTION: the loop that is never entered.
// ---------------------------------------------------------------------------
const LOOP = Object.freeze([
  "while (you.offline()) {",
  "  wait_for(you);",
  "  love = love + 1;",
  "}",
  "// not today",
  "run(world.execute(me));",
  "tell(you, everything);",
]);

function c1Kw3(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 3 });

  const bx = PLATE.x + 210;
  const by = PLATE.y + 190;
  // the condition is false, so the loop body is skipped: the pointer lands on the
  // last line, and what it says goes out to you
  const active = u < 0.34 ? 0 : u < 0.44 ? 5 : 6;
  listing(ctx, { x: bx, y: by, w: 980 }, LOOP, active, t);

  // the bolt from the last line to your dot
  const dx = PLATE.x + PLATE.w - 250;
  const dy = PLATE.y + PLATE.h * 0.72;
  const arrive = at(u, 0.42, 0.6);
  if (arrive > 0) {
    bolt(ctx, bx + 1080, by + 6 * 42 + 8, dx - 20, dy, t, { alpha: arrive, color: GIFT, width: 3, segments: 7 });
    halo(ctx, dx, dy, 110, 0.5 * arrive, GIFT);
    paperDisc(ctx, dx, dy, 12, GIFT, null);
  }
  return { phase: "plate3" };
}

// ---------------------------------------------------------------------------
// c1-trap — counted together, with the window closing round the two of them.
// ---------------------------------------------------------------------------
function c1Trap(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [900, 500], true, LIFT);

  // her shape behind the page
  zoomIn(ctx);
  layer(ctx, 0.5, () => {
    halo(ctx, 760, 470, 420, 0.3, BRAND);
    drawWhale(ctx, 760, 470, 460, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.5 });
  });
  zoomOut(ctx);

  conversation(ctx, t, { closing: at(u, 0.9, 2.4) });

  sceneThread(ctx, t, { history: [], mine: [42, 43], size: 34 });

  // your cursor, in front of the page
  const cx = 1500 - 260 * easeOut(at(u, 1.2, 2.4));
  cursorArrow(ctx, cx, 620, 1.5, 1);

  // the two of you, counted inside the frame
  const k = at(u, 1.6, 2.2);
  if (k > 0.01) type(ctx, "2", 1660, 300, 70, GIFT, "MV Mono", "center");
  return { phase: "trap" };
}

// ---------------------------------------------------------------------------
// c1-kw4 — SIMULATION: the window as one box among a wall of them.
// ---------------------------------------------------------------------------
function c1Kw4(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 4 });

  const pull = easeOut(at(u, 0.34, 0.5)); // the second kick pulls back
  const cols = 5;
  const rows = 3;
  const bw = 330;
  const bh = 250;
  const gapX = 26;
  const gapY = 22;
  const wallW = cols * bw + (cols - 1) * gapX;
  const wallH = rows * bh + (rows - 1) * gapY;
  const ox = 960 - wallW / 2;
  const oy = PLATE.y + PLATE.h * 0.46 - wallH / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = ox + c * (bw + gapX);
      const y = oy + r * (bh + gapY);
      const isMine = i === 7; // the one we have been in
      const a = isMine ? 1 : 0.18 + 0.5 * pull;
      layer(ctx, a, () => {
        rect(ctx, x, y, bw, bh, "rgba(9,30,46,0.92)", 10, isMine ? GIFT : "rgba(61,122,156,0.7)");
        // the same two occupants in every window
        disc(ctx, x + bw * 0.42, y + bh * 0.44, 7, isMine ? BRAND_SOFT : "rgba(127,147,255,0.7)", 1);
        halo(ctx, x + bw * 0.42, y + bh * 0.44, 34, 0.4, BRAND);
        disc(ctx, x + bw * 0.58, y + bh * 0.6, 4, isMine ? GIFT : "rgba(131,233,230,0.55)", 1);
        stroke(ctx, [[x + 18, y + bh - 26], [x + bw - 18, y + bh - 26]], "rgba(61,122,156,0.6)", 1);
      });
    }
  }
  if (pull > 0.5) {
    type(ctx, "one of many", 960, PLATE.y + PLATE.h - 40, 20, "rgba(139,164,194,0.85)", "MV Mono", "center");
  }
  return { phase: "plate4" };
}

export const SECTION5_RENDER = Object.freeze({
  "c1-give": c1Give,
  "c1-kw1": c1Kw1,
  "c1-only": c1Only,
  "c1-kw2": c1Kw2,
  "c1-happy": c1Happy,
  "c1-kw3": c1Kw3,
  "c1-trap": c1Trap,
  "c1-kw4": c1Kw4,
});

export const SECTION5_IMPLEMENTED = Object.freeze(Object.keys(SECTION5_RENDER));

/** The lyric data has to be in hand before the first frame of this section. */
export const SECTION5_READY = ensureLines();
