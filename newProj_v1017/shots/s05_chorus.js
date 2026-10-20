// Section 5 副歌一：对话与四张版画 — song time [59.389, 74.159). Eight shots that
// alternate: four interface shots and four plates for the keywords.
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
// The interface shots use the register this section was designed in: a drafting
// grid, a framed conversation panel, labelled data blocks with rules instead of
// speech bubbles, and the lyric set as a serif line on the foot rule. The fifth
// hands over to the real art -- the reach pose, then the palm close-up -- because
// those assets exist for exactly this beat and their anchors are recorded.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";
import { cursorArrow, clickRipple } from "./ui-client.js";
import {
  gridGround, frameChrome, conversationPanel,
  PANEL, placeArt, anchor, ART, ART_READY,
  REACH_BOX, PALM_BOX, REACH_PALM, PALM_ANCHOR,
} from "./s05_layout.js";
import { herBubble, yourBubble, lyricBubble, TYPE } from "./s05_bubble.js";
import { drawWhale } from "../src/assets/whale.js";
import { plateBase, PLATE, paperDisc, tickRing, bolt, listing } from "./plate.js";

const BRAND = "#4d6bfe";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const easeOut = (k) => 1 - (1 - k) ** 3;

export { ART_READY };

/** The lyric data, resolved from the same file the player uses. */
let LINES = null;
async function ensureLines() {
  if (LINES) return LINES;
  const res = await fetch("/data/lyrics.json");
  LINES = (await res.json()).lines;
  return LINES;
}
const lineText = (n) => (LINES && LINES[n - 1] ? LINES[n - 1].text : "");
const lineStart = (n) => (LINES && LINES[n - 1] ? LINES[n - 1].start : 0);

/** The chrome every interface shot shares. */
function shell(ctx, t, state) {
  gridGround(ctx, t);
  frameChrome(ctx, t, { right: `S05  /  ${state}`, songTime: t });
  conversationPanel(ctx, t, { title: "CONVERSATION  /  LIVE" });
}

/** The lyric for the current line, as a serif title at the foot. */
function caption(ctx, t, n, opts = {}) {
  const txt = lineText(n);
  if (!txt) return;
  footCaption(ctx, t, txt, lineStart(n), opts);
}

// ---------------------------------------------------------------------------
// c1-give — the thread runs: she says it, you answer straight back.
// ---------------------------------------------------------------------------
function c1Give(ctx, t, s) {
  const u = t - s.at;
  shell(ctx, t, "接收");

  const y1 = PANEL.y + 250;
  herBubble(ctx, PANEL.x + 60, y1, 1120, lineText(33), {
    alpha: at(u, 0.15, 0.42), size: TYPE.her,
  });
  herBubble(ctx, PANEL.x + 60, y1 + 200, 1420, lineText(34), {
    alpha: at(u, 1.65, 1.92), size: TYPE.beat, hot: true, emph: true,
  });
  yourBubble(ctx, PANEL.x + PANEL.w - 70, PANEL.y + 90, "ok, go on", {
    alpha: at(u, 0.95, 1.18), size: TYPE.you,
  });

  // the receipt runs back along the panel's rule
  const k = easeOut(at(u, 0.4, 1.6));
  if (k > 0) {
    const dx = PANEL.x + 900 - 700 * k;
    const dy = PANEL.y + 200;
    halo(ctx, dx, dy, 46, 0.35, GIFT);
    disc(ctx, dx, dy, 6, GIFT, 1);
  }

  return { phase: "give" };
}

// ---------------------------------------------------------------------------
// c1-only — the exchange narrows, and she marks yours as hers.
// ---------------------------------------------------------------------------
function c1Only(ctx, t, s) {
  const u = t - s.at;
  shell(ctx, t, "确认");

  const yourY = PANEL.y + 96;
  const yourRight = PANEL.x + PANEL.w - 70;
  yourBubble(ctx, yourRight, yourY, "you are kind", {
    alpha: at(u, 0.05, 0.26), size: TYPE.you,
  });
  herBubble(ctx, PANEL.x + 60, PANEL.y + 300, 1120, lineText(36), {
    alpha: at(u, 0.2, 0.46), size: TYPE.her,
  });
  herBubble(ctx, PANEL.x + 60, PANEL.y + 480, 1460, lineText(37), {
    alpha: at(u, 1.0, 1.26), size: TYPE.beat, hot: true, emph: true,
  });

  // her marker runs under your words: the claim on the record above
  const claim = easeOut(at(u, 1.4, 2.2));
  if (claim > 0.02) {
    ctx.font = `400 ${TYPE.you}px "MV Sans"`;
    const bw = ctx.measureText("you are kind").width + 60;
    const x1 = yourRight - 30;
    const x0 = x1 - (bw - 60);
    layer(ctx, 0.95, () =>
      stroke(ctx, [[x0, yourY + TYPE.you * 2.1 + 14], [x0 + (x1 - x0) * claim, yourY + TYPE.you * 2.1 + 14]],
        GIFT, 3, 1),
    );
  }

  return { phase: "only" };
}

// ---------------------------------------------------------------------------
// c1-happy — she sends a picture of herself, the camera goes to her hand, and you
// leave one heart in it.
// ---------------------------------------------------------------------------
function c1Happy(ctx, t, s) {
  const u = t - s.at;
  const reachBox = REACH_BOX;
  const sReach = 800 / reachBox.h;

  // where a named point of the art lands in the frame
  const placement = (target) => {
    const ox = target[0] - (reachBox.x + reachBox.w / 2) * sReach;
    const oy = target[1] - (reachBox.y + reachBox.h / 2) * sReach;
    return {
      ox, oy,
      palm: [ox + (reachBox.x + REACH_PALM.x) * sReach, oy + (reachBox.y + REACH_PALM.y) * sReach],
    };
  };

  // 1. the picture, and the mark beside her, both coming up out of the dark
  const bright = at(u, 0.1, 1.1);
  const zoom = easeOut(at(u, 1.35, 2.35));
  // a short cross-fade: held any longer and the zoomed reach hand and the palm
  // close-up are on screen together as two hands
  const palmFade = at(u, 2.25, 2.5);

  gridGround(ctx, t);
  frameChrome(ctx, t, { right: palmFade > 0.5 ? "S05  /  触点" : "S05  /  图像", songTime: t });

  const PL = placement([1330, 552]);
  const z = 1 + zoom * 2.2;

  if (palmFade < 0.999) {
    ctx.save();
    // the camera goes to the hand rather than cutting to it
    ctx.translate(PL.palm[0], PL.palm[1]);
    ctx.scale(z, z);
    ctx.translate(-PL.palm[0], -PL.palm[1]);
    layer(ctx, (1 - palmFade) * (0.35 + 0.65 * bright), () => {
      ctx.save();
      ctx.shadowColor = "rgba(131,233,230,0.5)";
      ctx.shadowBlur = 60 * bright;
      ctx.drawImage(ART.images.reach, PL.ox, PL.oy, ART.images.reach.width * sReach, ART.images.reach.height * sReach);
      ctx.restore();
    });
    ctx.restore();

    // her mark on the empty side, brightening with her
    layer(ctx, (1 - palmFade) * (0.25 + 0.75 * bright), () => {
      halo(ctx, 420, 520, 300 * (0.6 + 0.4 * bright), 0.3 + 0.3 * bright, BRAND);
      drawWhale(ctx, 420, 520, 300, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.5 + 0.5 * bright });
      type(ctx, "me", 420, 760, 22, GIFT, "MV Mono", "center");
    });

    if (palmFade < 0.5) {
      layer(ctx, (1 - palmFade * 2) * at(u, 0.15, 0.5), () => {
        rect(ctx, 980, 120, 720, 860, "rgba(6,27,39,0.18)", 4, "rgba(71,140,175,0.65)");
        type(ctx, "IMAGE  /  attached", 1000, 152, 15, GIFT, "MV Mono");
      });
    }
  }

  // 2. the palm close-up, cross-faded in at the same point
  if (palmFade > 0.001) {
    const s2 = 620 / PALM_BOX.w;
    placeArt(ctx, ART.images.palm, {
      contentBox: PALM_BOX,
      anchor: PALM_ANCHOR,
      target: [1080, 540],
      scale: s2,
      alpha: palmFade,
      shadow: 50,
    });
    layer(ctx, palmFade, () => anchor(ctx, 1080, 540, t, { radius: 104, hot: 0.5 + 0.5 * Math.sin(u * 3) }));

    const rest = easeOut(at(u, 2.35, 2.8));
    cursorArrow(ctx, 1760 + (1150 - 1760) * rest, 320 + (560 - 320) * rest, 1.7, 1);

    // the heart, large and lit
    const beat = at(u, 2.9, 3.05);
    if (beat > 0) {
      layer(ctx, beat, () => {
        const hs = 40 + 6 * Math.sin((u - 2.9) * 9);
        halo(ctx, 1080, 540, 160, 0.5, GIFT);
        ctx.beginPath();
        ctx.moveTo(1080, 540 + hs * 0.95);
        ctx.bezierCurveTo(1080 - hs * 1.5, 540 - hs * 0.25, 1080 - hs * 0.55, 540 - hs * 1.25, 1080, 540 - hs * 0.35);
        ctx.bezierCurveTo(1080 + hs * 0.55, 540 - hs * 1.25, 1080 + hs * 1.5, 540 - hs * 0.25, 1080, 540 + hs * 0.95);
        ctx.fillStyle = GIFT;
        ctx.shadowColor = "rgba(131,233,230,0.9)";
        ctx.shadowBlur = 40;
        ctx.fill();
      });
    }
    herBubble(ctx, 120, 806, 1180, lineText(40), {
      alpha: at(u, 2.5, 2.8), size: TYPE.beat, hot: true, emph: true,
    });
    type(ctx, "CONTACT  /  HEART 001", 120, 200, TYPE.meta, "rgba(159,184,210,0.85)", "MV Mono");
    type(ctx, "one signal remains", 120, 226, TYPE.meta - 1, "rgba(139,164,194,0.6)", "MV Mono");
  }

  return { phase: "happy", toPalm: Number(palmFade.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// c1-trap — counted together inside the same frame, and the frame closes.
// ---------------------------------------------------------------------------
function c1Trap(ctx, t, s) {
  const u = t - s.at;
  shell(ctx, t, "隔离");

  // her, behind the page, standing in the frame rather than above it
  const sReach = 760 / REACH_BOX.h;
  placeArt(ctx, ART.images.bust, {
    contentBox: REACH_BOX,
    anchor: { x: REACH_BOX.w / 2, y: REACH_BOX.h / 2 },
    target: [1480, 600],
    scale: sReach,
    alpha: 0.28,
    shadow: 0,
  });

  herBubble(ctx, PANEL.x + 60, PANEL.y + 300, 1060, lineText(42), {
    alpha: at(u, 0.1, 0.36), size: TYPE.her,
  });
  herBubble(ctx, PANEL.x + 60, PANEL.y + 480, 1300, lineText(43), {
    alpha: at(u, 0.9, 1.16), size: TYPE.beat, hot: true, emph: true,
  });

  cursorArrow(ctx, 1560 - 300 * easeOut(at(u, 1.2, 2.4)), 640, 1.5, 1);

  const close = easeOut(at(u, 1.0, 2.6));
  if (close > 0.01) {
    const inset = 40 * close;
    layer(ctx, 1, () => {
      ctx.beginPath();
      ctx.roundRect(PANEL.x + inset, PANEL.y + inset, PANEL.w - inset * 2, PANEL.h - inset * 2, 6);
      ctx.strokeStyle = `rgba(131,233,230,${(0.2 + 0.55 * close).toFixed(2)})`;
      ctx.lineWidth = 2 + 2 * close;
      ctx.stroke();
    });
    type(ctx, "2", 1786, 300, 64, GIFT, "MV Mono", "center");
    type(ctx, "counted", 1786, 342, 14, "rgba(159,184,210,0.8)", "MV Mono", "center");
  }

  return { phase: "trap" };
}

// ---------------------------------------------------------------------------
// the four plates
// ---------------------------------------------------------------------------
function c1Kw1(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 1 });
  const sx = PLATE.x + 260;
  const sy = PLATE.y + PLATE.h * 0.58;
  const dx = PLATE.x + PLATE.w - 330;
  const dy = PLATE.y + PLATE.h * 0.24;

  halo(ctx, sx, sy, 150, 0.5, "#4d6bfe");
  paperDisc(ctx, sx, sy, 26, "#4d6bfe", "#7f93ff");
  const arrive = easeOut(at(u, 0.05, 0.4));
  halo(ctx, dx, dy, 90, 0.55 * arrive, GIFT);
  paperDisc(ctx, dx, dy, 12, GIFT, null);

  const strike = at(u, 0.18, 0.3);
  if (strike > 0) bolt(ctx, sx + 30, sy, dx - 14, dy, t, { alpha: strike, color: GIFT, width: 3.5, segments: 9 });
  if (strike > 0.5) {
    halo(ctx, dx, dy, 220, 0.35, GIFT);
    const pr = (u * 2.2) % 1;
    ctx.beginPath();
    ctx.arc(dx, dy, 30 + pr * 150, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(131,233,230,${((1 - pr) * 0.5).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  return { phase: "plate1" };
}

function c1Kw2(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 2 });
  const cx = PLATE.x + PLATE.w * 0.44;
  const cy = PLATE.y + PLATE.h * 0.46;
  const r = PLATE.h * 0.3;

  tickRing(ctx, cx, cy, r + 34, 40, "rgba(61,122,156,0.9)");
  tickRing(ctx, cx, cy, r + 16, 40, "rgba(61,122,156,0.5)");

  const press = at(u, 0.36, 0.46);
  paperDisc(ctx, cx, cy, r * (1 - 0.04 * press),
    press > 0.5 ? "rgba(131,233,230,0.16)" : "rgba(77,107,254,0.12)",
    press > 0.5 ? GIFT : "#7f93ff");

  const run = easeOut(at(u, 0.4, 0.85));
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * run);
  ctx.strokeStyle = GIFT;
  ctx.lineWidth = 4;
  ctx.stroke();

  type(ctx, "this answer helped", cx, cy + 10, 26, press > 0.5 ? GIFT : "#cfe0ee", "MV Sans", "center");
  type(ctx, press > 0.9 ? "1" : "0", PLATE.x + PLATE.w - 260, cy + 20, 96, press > 0.9 ? GIFT : DIM, "MV Mono", "center");
  type(ctx, "count", PLATE.x + PLATE.w - 260, cy + 56, 16, "rgba(139,164,194,0.8)", "MV Mono", "center");

  const px = cx + 150 - 90 * easeOut(at(u, 0.1, 0.36));
  cursorArrow(ctx, px, cy + 110, 1.5, 1);
  clickRipple(ctx, cx, cy, t, s.at + 0.46, GIFT);
  return { phase: "plate2" };
}

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
  const active = u < 0.34 ? 0 : u < 0.44 ? 5 : 6;
  listing(ctx, { x: bx, y: by, w: 980 }, LOOP, active, t);

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

function c1Kw4(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 4 });
  const pull = easeOut(at(u, 0.34, 0.5));
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
      const isMine = i === 7;
      const a = isMine ? 1 : 0.18 + 0.5 * pull;
      layer(ctx, a, () => {
        rect(ctx, x, y, bw, bh, "rgba(9,30,46,0.92)", 10, isMine ? GIFT : "rgba(61,122,156,0.7)");
        disc(ctx, x + bw * 0.42, y + bh * 0.44, 7, isMine ? "#7f93ff" : "rgba(127,147,255,0.7)", 1);
        halo(ctx, x + bw * 0.42, y + bh * 0.44, 34, 0.4, "#4d6bfe");
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
