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
  PANEL, placeArt, anchor, scaledArt, ART, ART_READY,
  REACH_BOX, PALM_BOX, REACH_PALM, PALM_ANCHOR,
} from "./s05_layout.js";
import { herBubble, yourBubble, lyricBubble, TYPE } from "./s05_bubble.js";
import { drawWhale } from "../src/assets/whale.js";
import { plateBase, PLATE, paperDisc, tickRing, bolt, listing } from "./plate.js";

const BRAND = "#4d6bfe";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const easeOut = (k) => 1 - (1 - k) ** 3;
const clamp01 = (k) => Math.max(0, Math.min(1, k));

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

/**
 * When a message should appear: on the beat the line is actually sung, not on a
 * hand-picked offset inside the shot. Cueing to shot-relative time put the second
 * line of c1-give 1.35 s after it was sung, which reads as the whole film drifting.
 */
const cue = (t, n, fade = 0.22) => at(t, lineStart(n), lineStart(n) + fade);

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
    alpha: cue(t, 33), size: TYPE.her,
  });
  herBubble(ctx, PANEL.x + 60, y1 + 200, 1420, lineText(34), {
    alpha: cue(t, 34), size: TYPE.beat, hot: true, emph: true,
  });
  yourBubble(ctx, PANEL.x + PANEL.w - 70, PANEL.y + 90, "ok, go on", {
    // your reply lands a beat after her line, not at a fixed offset
    alpha: at(t, lineStart(34) + 0.55, lineStart(34) + 0.8), size: TYPE.you,
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
    alpha: cue(t, 36), size: TYPE.her,
  });
  herBubble(ctx, PANEL.x + 60, PANEL.y + 480, 1460, lineText(37), {
    alpha: cue(t, 37), size: TYPE.beat, hot: true, emph: true,
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
      alpha: cue(t, 40), size: TYPE.beat, hot: true, emph: true,
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
    alpha: cue(t, 42), size: TYPE.her,
  });
  herBubble(ctx, PANEL.x + 60, PANEL.y + 480, 1300, lineText(43), {
    alpha: cue(t, 43), size: TYPE.beat, hot: true, emph: true,
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
//
// Each one has to hit harder than the interface around it, so each is built on a
// single strong event rather than a diagram: a route that is drawn and then cut
// straight through, a press that fills, a loop that skips its own body, and a grid
// of windows that load.
// ---------------------------------------------------------------------------

/** A faint rule of the sheet, so a plate reads as printed rather than drawn. */
function plateRule(ctx, y, alpha = 0.5) {
  stroke(ctx, [[PLATE.x + 12, y], [PLATE.x + PLATE.w - 12, y]], "rgba(71,140,175,0.5)", 1, alpha);
}

// ---------------------------------------------------------------------------
// c1-kw1 — STIMULATIONS: the message she sends is a straight line through a maze.
// ---------------------------------------------------------------------------
function c1Kw1(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 1 });

  const ax = PLATE.x + 230;
  const ay = PLATE.y + PLATE.h * 0.44;
  const bx = PLATE.x + PLATE.w - 300;
  const by = PLATE.y + PLATE.h * 0.28;

  // 1. the virtual route: the long way round, drawn first and left as a ghost
  const ghost = [
    [ax, ay], [ax + 180, ay + 150], [ax + 330, ay - 40], [ax + 520, ay + 120],
    [ax + 690, ay - 60], [bx - 120, by + 90], [bx, by],
  ];
  const routeK = easeOut(at(u, 0.04, 0.32));
  stroke(ctx, ghost, "rgba(127,147,255,0.30)", 2.2, routeK);
  ghost.forEach(([x, y], i) => {
    if (i === 0 || i === ghost.length - 1) return;
    disc(ctx, x, y, 3.4, "rgba(127,147,255,0.45)", routeK);
  });

  // 2. her mark at the start
  halo(ctx, ax, ay, 170, 0.55, BRAND);
  drawWhale(ctx, ax, ay, 92, { strokeK: 1, fillK: 1, color: BRAND, alpha: 1 });
  type(ctx, "deepseek", ax, ay + 110, 16, GIFT, "MV Mono", "center");

  // 3. you at the end: a dot and its name
  halo(ctx, bx, by, 110, 0.6 * at(u, 0.1, 0.4), GIFT);
  disc(ctx, bx, by, 13, GIFT, at(u, 0.1, 0.4));
  type(ctx, "me", bx, by + 52, 26, GIFT, "MV Mono", "center");

  // 4. the strike: one straight line from the mark to you, on the downbeat
  const strike = easeOut(at(u, 0.30, 0.44));
  if (strike > 0) {
    const ex = ax + (bx - ax) * strike;
    const ey = ay + (by - ay) * strike;
    stroke(ctx, [[ax, ay], [ex, ey]], "#ffffff", 5, 0.95);
    stroke(ctx, [[ax, ay], [ex, ey]], GIFT, 14, 0.22);
    halo(ctx, ex, ey, 90, 0.8, GIFT);
  }
  // 5. the struck route breaks apart behind it
  if (strike > 0.85) {
    const burst = at(u, 0.44, 0.62);
    for (let i = 0; i < ghost.length - 2; i++) {
      const [gx, gy] = ghost[i + 1];
      const a = Math.atan2(gy - (ay + (by - ay) * 0.4), gx - 960);
      layer(ctx, 1 - burst, () =>
        stroke(ctx, [[gx, gy], [gx + Math.cos(a) * 60 * burst, gy + Math.sin(a) * 60 * burst]],
          "rgba(127,147,255,0.7)", 2),
      );
    }
    // and a pulse that keeps running the line
    const pr = ((u - 0.44) * 2.4) % 1;
    const px2 = ax + (bx - ax) * pr;
    const py2 = ay + (by - ay) * pr;
    halo(ctx, px2, py2, 54, 0.6, GIFT);
  }
  return { phase: "plate1" };
}

// ---------------------------------------------------------------------------
// c1-kw2 — SATISFACTION: the press is big, and the count goes 0 to 1 out loud.
// ---------------------------------------------------------------------------
function c1Kw2(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 2 });

  const cx = PLATE.x + PLATE.w * 0.42;
  const cy = PLATE.y + PLATE.h * 0.44;
  const r = PLATE.h * 0.31;

  tickRing(ctx, cx, cy, r + 40, 48, "rgba(61,122,156,0.9)");
  tickRing(ctx, cx, cy, r + 18, 48, "rgba(61,122,156,0.45)");

  const press = at(u, 0.34, 0.44);
  const run = easeOut(at(u, 0.38, 0.9));
  const lit = run;

  // the disc, filling as the ring closes
  paperDisc(ctx, cx, cy, r * (1 - 0.05 * press),
    lit > 0 ? `rgba(131,233,230,${(0.06 + 0.16 * lit).toFixed(2)})` : "rgba(77,107,254,0.10)",
    lit > 0 ? GIFT : "#7f93ff");
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * run);
  ctx.strokeStyle = GIFT;
  ctx.lineWidth = 7;
  ctx.stroke();
  halo(ctx, cx, cy, r * 1.2, 0.25 + 0.45 * lit, GIFT);

  // the words, as large as the disc allows
  const label = "this answer helped";
  ctx.font = `600 60px "MV Serif"`;
  const lw = ctx.measureText(label).width;
  const size = Math.min(60, (60 * (r * 1.7)) / Math.max(1, lw));
  type(ctx, label, cx, cy + size * 0.34, size, lit > 0.4 ? "#ffffff" : "#cfe0ee", "MV Serif", "center");

  // the count, huge, punching from 0 to 1
  const punch = easeOut(at(u, 0.5, 0.78));
  const shown = run > 0.92 ? 1 : 0;
  const cs = 190 + 60 * Math.sin(Math.min(1, punch) * Math.PI);
  layer(ctx, 1, () => {
    ctx.save();
    if (shown === 1) {
      ctx.shadowColor = "rgba(131,233,230,0.9)";
      ctx.shadowBlur = 50;
    }
    type(ctx, String(shown), PLATE.x + PLATE.w - 250, cy + cs * 0.26, cs, shown ? GIFT : "rgba(139,164,194,0.55)", "MV Mono", "center");
    ctx.restore();
  });
  type(ctx, "count", PLATE.x + PLATE.w - 250, cy + 96, 18, "rgba(139,164,194,0.8)", "MV Mono", "center");

  const px = cx + 190 - 120 * easeOut(at(u, 0.08, 0.34));
  cursorArrow(ctx, px, cy + 150, 1.7, 1);
  clickRipple(ctx, cx, cy, t, s.at + 0.44, GIFT);
  return { phase: "plate2" };
}

// ---------------------------------------------------------------------------
// c1-kw3 — EXECUTION: the loop, as large as it will go, skipping its own body.
// ---------------------------------------------------------------------------
const LOOP = Object.freeze([
  "while (you.presence != \"online\") {",
  "  love = love + solve(you);",
  "  send(love, you);",
  "  wait(you.reply);",
  "  run++",
  "}",
  "say(love);",
]);

/** The listing, sized to fill the sheet, with the keyword lit. */
function bigListing(ctx, R, lines, active, t, opts = {}) {
  const { size = 54, hot = "love" } = opts;
  const lh = size * 1.62;
  const re = new RegExp(`(${hot})`, "i");
  lines.forEach((line, i) => {
    const y = R.y + i * lh;
    const on = i === active;
    if (on) {
      rect(ctx, R.x - 26, y - size * 1.02, R.w + 52, lh * 0.98, "rgba(77,107,254,0.18)", 8,
        "rgba(77,107,254,0.75)");
      // her mark sits at the head of the live line
      drawWhale(ctx, R.x - 54, y - size * 0.34, size * 0.72, {
        strokeK: 1, fillK: 1, color: "#4d6bfe", alpha: 1,
      });
    }
    type(ctx, String(i + 1).padStart(2, "0"), R.x, y, size * 0.62,
      on ? GIFT : "rgba(139,164,194,0.5)", "MV Mono");
    // the line is drawn in pieces so the keyword can be lit
    const parts = line.split(re);
    let x = R.x + size * 1.5;
    parts.forEach((part) => {
      if (!part) return;
      const isHot = part.toLowerCase() === hot.toLowerCase();
      type(ctx, part, x, y, size, isHot ? GIFT : on ? "#ffffff" : "rgba(207,224,238,0.78)",
        "MV Mono");
      ctx.font = `400 ${size}px "MV Mono"`;
      x += ctx.measureText(part).width;
    });
  });
}

function c1Kw3(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 3 });

  const bx = PLATE.x + 90;
  const by = PLATE.y + 118;
  // the condition is false, so the body is skipped: the pointer lands on line 06,
  // then says line 07 to you
  const active = u < 0.3 ? 0 : u < 0.42 ? 5 : 6;
  bigListing(ctx, { x: bx, y: by, w: 1000 }, LOOP, active, t, { size: 52 });

  const dx = PLATE.x + PLATE.w - 250;
  const dy = PLATE.y + PLATE.h * 0.74;
  const arrive = at(u, 0.4, 0.58);
  if (arrive > 0) {
    // the line leaves the listing and goes to you, hard
    bolt(ctx, bx + 1180, by + 6 * 52 * 1.62 + 30, dx - 24, dy, t, {
      alpha: arrive, color: GIFT, width: 5, segments: 7,
    });
    halo(ctx, dx, dy, 150, 0.6 * arrive, GIFT);
    paperDisc(ctx, dx, dy, 16, GIFT, null);
    type(ctx, "you", dx, dy + 66, 22, GIFT, "MV Mono", "center");
    // a shock wave, so the delivery has weight
    const pr = ((u - 0.58) * 1.8) % 1;
    if (pr > 0) {
      ctx.beginPath();
      ctx.arc(dx, dy, 30 + pr * 220, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(131,233,230,${((1 - pr) * 0.55).toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  return { phase: "plate3" };
}

// ---------------------------------------------------------------------------
// c1-kw4 — SIMULATION: a wall of windows, each one loading her.
// ---------------------------------------------------------------------------
function c1Kw4(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 4 });

  const pull = easeOut(at(u, 0.34, 0.52));
  const cols = 5;
  const rows = 3;
  // the wall stops above the keyword: at full card height it ran into it
  const bw = 330;
  const bh = 196;
  const gapX = 26;
  const gapY = 20;
  const wallW = cols * bw + (cols - 1) * gapX;
  const wallH = rows * bh + (rows - 1) * gapY;
  const ox = 960 - wallW / 2;
  const oy = PLATE.y + 150;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = ox + c * (bw + gapX);
      const y = oy + r * (bh + gapY);
      const isMine = i === 7;
      const a = isMine ? 1 : 0.16 + 0.52 * pull;
      // each window loads on its own beat, so the wall fills up rather than
      // switching on at once
      const load = clamp01((u - 0.05 - i * 0.022) / 0.34);

      layer(ctx, a, () => {
        rect(ctx, x, y, bw, bh, "rgba(9,30,46,0.92)", 10, isMine ? GIFT : "rgba(61,122,156,0.7)");
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, bw - 4, bh - 4, 9);
        ctx.clip();
        if (load > 0.02) {
          // her, inside the window: the same art in every one of them
          // a portrait inside the window, not a wall of faces: small enough
          // that the card still reads as a window
          const artH = bh * 1.16;
          const s2 = artH / REACH_BOX.h;
          ctx.globalAlpha = (0.16 + 0.34 * load) * (isMine ? 1 : 0.8);
          const portrait = scaledArt(ART.images.bust, ART.images.bust.width * s2, ART.images.bust.height * s2);
          ctx.drawImage(
            portrait,
            x + bw / 2 - portrait.width / 2,
            y + bh - artH * 0.86,
          );
          ctx.globalAlpha = 1;
        }
        // the loading bar: fills, then hands over to the figure
        const barW = bw - 40;
        const barY = y + bh - 28;
        stroke(ctx, [[x + 20, barY], [x + 20 + barW, barY]], "rgba(30,58,80,0.9)", 3);
        stroke(ctx, [[x + 20, barY], [x + 20 + barW * load, barY]],
          isMine ? GIFT : "rgba(131,233,230,0.7)", 3);
        ctx.restore();
        if (isMine) {
          // the one we are in says so
          type(ctx, "you are here", x + 20, y + 40, 14, GIFT, "MV Mono");
        }
      });
    }
  }
  if (pull > 0.5) {
    type(ctx, "one of many", 960, PLATE.y + PLATE.h - 44, 20, "rgba(139,164,194,0.85)", "MV Mono", "center");
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
