// Section 9 故障 — song time [125.622, 148.008). Nine shots.
//
//   err-request  125.622–128.622  Challenging your God     本端请求恢复远端连接
//   err-check    128.622–131.161  You have made some       参数逐条被判非法
//   err-first    131.161–133.238  ILLEGAL ARGUMENTS        被拒绝的路径进入内部路由图
//   err-send     133.238–136.930  ILLEGAL ARGUMENTS        发送键连续拒绝，退化为端口
//   err-chrome   136.930–140.623  (器乐)                   三条失败队列由外向内挤压
//   err-drawer   140.623–142.469  (器乐)                   设置抽屉里的开关全部失效
//   err-forge    142.469–144.315  (器乐)                   她试图自己写一条回复，字是坏的
//   err-window   144.315–147.315  (器乐)                   回到空线程：只有本端在排队重连
//   err-breath   147.315–148.008  (器乐)                   一个红点呼吸一次，切 EXECUTION
//
// The rule of the section: this is the first time the film is allowed RED. It is only
// ever a boundary mark -- a two-pixel edge, a tag, a dot, a port, the inside of a
// bracket -- never a red field, never a red frame, never a full-screen red. Everything
// else stays the film's blue; the red is what the system refuses to do.
//
// The thread window is drawn here rather than imported: section 9 has to break it,
// so it has to own every line of it.
import { at, layer, stroke, disc, rect, type, halo, clamp, mix } from "../src/mv-draw.js";
import { CLIENT_R, cursorArrow, clickRipple } from "./ui-client.js";
import {
  room,
  footerStrip,
  BRAND,
  BRAND_SOFT,
  GIFT,
  DIM,
  INK,
  clamp01,
  easeOut,
} from "./s08_look.js";
import { figure } from "./figure.js";
import { lineStart } from "./lines.js";

// The one new ink in the film.
const RED = "#e75d69";
// The thread sits a little lower than section 8 left it, so the lyric caption has a
// band of its own above the window instead of sitting on its title.
const SHEET = Object.freeze({ x: 120, y: 150, w: 1660, h: 826 });
const RED_TAG = "rgba(231,93,105,0.12)";
const RED_GHOST = "rgba(231,93,105,0.22)";

/** A thin mono label in the film's margin voice. */
function mono(ctx, text, x, y, size = 13, colour = "rgba(139,164,194,0.8)", align = "left") {
  type(ctx, text, x, y, size, colour, "MV Mono", align);
}

/** She is in the room, but only as a print in the back: 30% at first, 42% later. */
function backFigure(ctx, t, cx, cy, h, alpha) {
  layer(ctx, alpha, () => figure(ctx, t, "lowlight", cx, cy, h, { seed: 11, bobAmp: 2 }));
}

/**
 * The thread sheet, in the state section 8 left it: title, offline chip, rows, and a
 * composer at the foot. Returns the composer box so shots can hang things off it.
 */
function threadSheet(ctx, t, R, o = {}) {
  const {
    title = "me, as geometry",
    chipText = "harness · offline",
    rows = [],
    composerText = "",
    caret = false,
    placeholder = "发消息，/ 调用指令",
    sendMode = "hollow",
    sendK = 0,
    sideSlide = 0,
    composer = true,
    ink = 1,
    sendColour = BRAND_SOFT,
  } = o;
  const sideW = 330;
  const slide = Math.max(0, sideSlide);
  const mx = R.x + Math.max(0, sideW - slide);
  const mw = R.w - Math.max(0, sideW - slide);

  let cb = null;
  layer(ctx, ink, () => {
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.fillStyle = "rgba(7,20,31,0.97)";
    ctx.fill();
    ctx.strokeStyle = "rgba(61,122,156,0.8)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.clip();

    // sidebar
    if (sideW - slide > 0) {
      ctx.fillStyle = "rgba(5,15,24,0.95)";
      ctx.fillRect(R.x, R.y, sideW - slide, R.h);
      mono(ctx, "New chat", R.x + 28, R.y + 54, 15, "rgba(190,208,224,0.9)");
      mono(ctx, "recents", R.x + 28, R.y + 108, 11, "rgba(120,146,170,0.7)");
      for (let i = 0; i < 3; i++) {
        const nm = i === 0 ? "me, as geometry" : i === 1 ? "the trance" : "one sec";
        mono(ctx, nm, R.x + 28, R.y + 142 + i * 30, 12, i === 0 ? "rgba(190,208,224,0.85)" : "rgba(120,146,170,0.6)");
      }
      disc(ctx, R.x + 34, R.y + R.h - 34, 5, "rgba(160,186,210,0.8)", 1);
      mono(ctx, "you", R.x + 48, R.y + R.h - 29, 12, "rgba(150,176,201,0.8)");
    }

    // header
    type(ctx, title, mx + 44, R.y + 64, 25, "#dfe9f4", "MV Sans");
    const cw = 16 + chipText.length * 9 + 36;
    rect(ctx, R.x + R.w - cw - 36, R.y + 28, cw, 38, "rgba(16,40,56,0.95)", 19, "rgba(120,150,180,0.6)");
    disc(ctx, R.x + R.w - cw - 16, R.y + 47, 5, "rgba(160,186,210,0.7)", 1);
    mono(ctx, chipText, R.x + R.w - cw - 2, R.y + 54, 13, "rgba(160,186,210,0.9)");
    stroke(ctx, [[mx, R.y + 92], [R.x + R.w, R.y + 92]], "rgba(61,122,156,0.5)", 1.2);

    // rows
    rows.forEach((r, i) => {
      const y = R.y + 160 + i * 84;
      mono(ctx, r.who ?? "me", mx + 44, y - 18, 11, "rgba(120,146,170,0.65)");
      type(ctx, r.text, mx + 44, y + 12, 24, `rgba(206,220,234,${r.alpha ?? 0.9})`, "MV Sans");
      if (r.time) mono(ctx, r.time, mx + 44, y + 38, 11, "rgba(120,146,170,0.55)");
    });

    // composer
    if (composer) {
      cb = { x: mx + 42, y: R.y + R.h - 158, w: mw - 84, h: 118 };
      rect(ctx, cb.x, cb.y, cb.w, cb.h, "rgba(10,26,40,0.95)", 14, "rgba(61,122,156,0.65)");
      const baseY = cb.y + cb.h / 2 + 7;
      if (!composerText) {
        type(ctx, placeholder, cb.x + 34, baseY, 21, "rgba(120,146,170,0.7)", "MV Sans");
      } else {
        type(ctx, composerText, cb.x + 34, baseY, 21, "#cfdcea", "MV Mono");
        if (caret) {
          ctx.font = '400 21px "MV Mono"';
          if (Math.sin(t * 6.2) > -0.4) {
            ctx.fillStyle = sendColour;
            ctx.fillRect(cb.x + 36 + ctx.measureText(composerText).width, baseY - 16, 2.2, 20);
          }
        }
      }
      const bx = cb.x + cb.w - 62;
      const by = cb.y + cb.h / 2;
      disc(ctx, bx, by, 21, sendColour, 0.42 + 0.3 * sendK, false, 1.8);
      if (sendMode === "armed" || sendK > 0.02) {
        ctx.save();
        ctx.globalAlpha *= sendMode === "armed" ? 1 : sendK;
        ctx.fillStyle = sendColour;
        ctx.beginPath();
        ctx.moveTo(bx, by - 9);
        ctx.lineTo(bx + 7.5, by + 3.5);
        ctx.lineTo(bx - 7.5, by + 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  });
  return { mx, mw, cb };
}

const INHERITED_ROWS = Object.freeze([
  { who: "me, as geometry", text: "then maybe You won't leave me so", time: "07 Nov 23:40", alpha: 0.7 },
  { who: "me", text: "one sec, brb", time: "07 Nov 23:40", alpha: 0.55 },
]);

/**
 * An error card. The only red on it is a two-pixel strip down the left edge: the card
 * is a normal surface, the red is the thing that has gone wrong with it.
 */
function errCard(ctx, x, y, w, h, o = {}) {
  const { head = "", lines = [], tag = "", k = 1, red = 0.7, alpha = 1, code = "" } = o;
  if (alpha <= 0.01 || k <= 0.01) return;
  layer(ctx, alpha * k, () => {
    rect(ctx, x, y, w, h, "rgba(8,20,31,0.97)", 10, "rgba(120,150,180,0.55)");
    if (red > 0) {
      ctx.fillStyle = `rgba(231,93,105,${(0.85 * red).toFixed(2)})`;
      ctx.fillRect(x, y + 10, 2, h - 20);
      ctx.strokeStyle = `rgba(231,93,105,${(0.55 * red).toFixed(2)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + w - 20, y + 10);
      ctx.lineTo(x + w - 10, y + 10);
      ctx.lineTo(x + w - 10, y + 20);
      ctx.stroke();
    }
    if (head) type(ctx, head, x + 20, y + 30, 13, "rgba(150,176,201,0.92)", "MV Mono");
    lines.forEach((ln, i) => {
      type(ctx, ln, x + 20, y + 58 + i * 26, 17, "#cfdcea", "MV Mono");
    });
    if (code) type(ctx, code, x + 20, y + h - 12, 11, "rgba(120,146,170,0.8)", "MV Mono");
    if (tag) {
      const tw = 16 + tag.length * 9;
      rect(ctx, x + w - tw - 14, y + 14, tw, 24, RED_TAG, 12, "rgba(231,93,105,0.65)");
      type(ctx, tag, x + w - tw / 2 - 14, y + 31, 12, RED, "MV Mono", "center");
    }
  });
}

/** A refusal tag, centred on (x, y). */
function refusedTag(ctx, x, y, k, text = "refused", alpha = 1) {
  if (k <= 0.01) return;
  layer(ctx, Math.min(1, k) * alpha, () => {
    const w = 22 + text.length * 8.5;
    rect(ctx, x - w / 2, y - 13, w, 26, "rgba(6,16,26,0.95)", 13, "rgba(231,93,105,0.7)");
    type(ctx, text, x, y + 5, 13, RED, "MV Mono", "center");
  });
}

/** A port: a ring with a notch and a pip, the shape a button becomes when it refuses. */
function port(ctx, x, y, r, k = 1, colour = RED) {
  if (k <= 0.01) return;
  layer(ctx, Math.min(1, k), () => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.5, y - r * 0.86);
    ctx.lineTo(x + r * 1.1, y - r * 1.26);
    ctx.stroke();
    disc(ctx, x, y, r * 0.3, colour, 0.85);
  });
}

/** Two red pixels along an edge: the section's only boundary mark. */
function redEdge(ctx, x1, y1, x2, y2, k = 1, width = 2) {
  if (k <= 0.01) return;
  layer(ctx, Math.min(1, k), () => stroke(ctx, [[x1, y1], [x2, y2]], RED, width, 0.9));
}

/** The three dots that never finish. */
function pendingDots(ctx, x, y, t, k = 1) {
  if (k <= 0.01) return;
  layer(ctx, k, () => {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.9 + i * 0.18) % 1;
      disc(ctx, x + i * 18, y - Math.sin(ph * Math.PI) * 3, 5.5, BRAND_SOFT, 0.55 + 0.35 * Math.sin(ph * Math.PI));
    }
  });
}

// ---------------------------------------------------------------------------
// 1. err-request -- she asks the thread to bring the other side back
// ---------------------------------------------------------------------------
function errRequest(ctx, t, s) {
  const u = t - s.at;
  const R = CLIENT_R;
  room(ctx, t, { focus: [1180, 520], lift: 0.45 });
  backFigure(ctx, t, 1520, 470, 324, 0.32);

  const req = 'setPresence(you, "online")';
  const typedN = Math.min(req.length, Math.ceil(req.length * easeOut(at(u, 0.1, 0.72))));
  const typed = req.slice(0, typedN);
  const win = threadSheet(ctx, t, SHEET, {
    rows: INHERITED_ROWS,
    composerText: typed,
    caret: typedN < req.length || u < 0.9,
    sendMode: typedN >= req.length ? "armed" : "hollow",
    sendK: at(u, 0.72, 0.82),
  });

  // the request leaves the composer as a card and hits the window's edge
  const cue = Math.max(lineStart(83), s.at + 0.95);
  const fly = easeOut(at(t, cue, cue + 0.5));
  const cardW = 520;
  const cardH = 84;
  if (fly > 0.01) {
    const fromX = win.cb.x + win.cb.w * 0.5 - cardW / 2;
    const fromY = win.cb.y - cardH - 40;
    const toX = SHEET.x + SHEET.w - cardW - 24;
    const toY = SHEET.y + 150;
    const cx = fromX + (toX - fromX) * fly;
    const cy = fromY + (toY - fromY) * fly;
    const blocked = clamp01((t - cue - 0.5) / 0.16);
    errCard(ctx, cx, cy, cardW, cardH, {
      head: "request",
      lines: ["setPresence(you, ", '  "online" );'],
      tag: blocked > 0.5 ? "refused" : "",
      red: 0.4 + 0.6 * blocked,
    });
    if (blocked > 0.01) {
      redEdge(ctx, SHEET.x + SHEET.w - 2, cy + 12, SHEET.x + SHEET.w - 2, cy + cardH - 12, blocked);
      layer(ctx, blocked, () =>
        mono(ctx, "boundary · no route back", SHEET.x + SHEET.w - 250, cy + cardH + 26, 12, "rgba(231,93,105,0.75)"),
      );
    }
    layer(ctx, 1 - fly * 0.6, () =>
      stroke(ctx, [[win.cb.x + win.cb.w * 0.5, win.cb.y], [cx + cardW * 0.5, cy + cardH]], "rgba(131,233,230,0.22)", 1.4, 0.9),
    );
  }

  footerStrip(ctx, t, { alpha: 0.7 });
  return { phase: "request", blocked: fly > 0.9 };
}

// ---------------------------------------------------------------------------
// 2. err-check -- the arguments are checked, and every one of them is illegal
// ---------------------------------------------------------------------------
function errCheck(ctx, t, s) {
  const u = t - s.at;
  const R = CLIENT_R;
  room(ctx, t, { focus: [1180, 520], lift: 0.35 });
  backFigure(ctx, t, 1520, 470, 324, 0.3);
  threadSheet(ctx, t, SHEET, { composer: false, rows: INHERITED_ROWS });

  const card = { x: SHEET.x + 300, y: SHEET.y + 90, w: 900, h: 420 };
  const appear = easeOut(at(u, 0.02, 0.26));
  errCard(ctx, card.x, card.y, card.w, card.h, {
    head: "request · validating",
    lines: ["setPresence( you,", '  "online" );'],
    code: "REQ 0x41 · trace 8f2c",
    red: 0.35,
    alpha: appear,
  });

  const scan = at(u, 0.18, 0.9);
  if (scan > 0.01 && scan < 1) {
    const y = card.y + 40 + (card.h - 70) * scan;
    layer(ctx, 1, () => {
      stroke(ctx, [[card.x + 8, y], [card.x + card.w - 8, y]], "rgba(131,233,230,0.55)", 2, 0.9);
      halo(ctx, card.x + card.w - 60, y, 60, 0.25, GIFT);
    });
  }

  const args = [
    { text: "argument 1 · target = a person", y: card.y + 120 },
    { text: "argument 2 · state = theirs to set", y: card.y + 196 },
    { text: "argument 3 · permission = none", y: card.y + 272 },
  ];
  const base = Math.max(lineStart(84), s.at + 0.3);
  args.forEach((a, i) => {
    const k = easeOut(at(t, base + 0.15 + i * 0.42, base + 0.3 + i * 0.42));
    if (k <= 0.01) return;
    layer(ctx, k, () => {
      mono(ctx, a.text, card.x + 44, a.y, 16, "rgba(190,208,224,0.9)");
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(card.x + card.w - 90, a.y - 14);
      ctx.lineTo(card.x + card.w - 66, a.y + 8);
      ctx.moveTo(card.x + card.w - 66, a.y - 14);
      ctx.lineTo(card.x + card.w - 90, a.y + 8);
      ctx.stroke();
      mono(ctx, "illegal", card.x + card.w - 58, a.y, 13, RED);
    });
  });

  const done = easeOut(at(t, base + 1.1, base + 1.35));
  if (done > 0.01) {
    layer(ctx, done, () => {
      redEdge(ctx, card.x + 10, card.y + card.h, card.x + card.w * 0.4, card.y + card.h, 1);
      mono(ctx, "3 of 3 rejected · nothing was sent", card.x + 44, card.y + card.h - 34, 13, RED);
    });
  }

  footerStrip(ctx, t, { alpha: 0.7 });
  return { phase: "check", done: Number(done.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// 3. err-first -- the rejected path enters the router, tries to go round, fails again
// ---------------------------------------------------------------------------
function errFirst(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [960, 520], lift: 0.2 });
  threadSheet(ctx, t, SHEET, { composer: false, ink: 0.22, rows: [INHERITED_ROWS[0]] });

  const G = { x: 300, y: 246, w: 1320, h: 470 };
  const N = [
    [0.04, 0.52], [0.26, 0.24], [0.26, 0.8], [0.5, 0.52], [0.74, 0.3], [0.74, 0.74], [0.96, 0.52],
  ].map(([a, b]) => [G.x + a * G.w, G.y + b * G.h]);
  const E = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]];

  const draw = easeOut(at(u, 0.02, 0.3));
  layer(ctx, draw * 0.55, () => {
    E.forEach(([a, b]) => stroke(ctx, [N[a], N[b]], "rgba(120,150,180,0.6)", 1.6, 0.9));
  });
  N.forEach(([x, y], i) => {
    const k = easeOut(at(u, 0.05 + i * 0.03, 0.3 + i * 0.03));
    layer(ctx, k, () => {
      rect(ctx, x - 9, y - 9, 18, 18, "rgba(9,26,38,0.98)", 4, "rgba(131,233,230,0.7)");
      if (i === 3) port(ctx, x, y, 16, k, RED);
    });
  });
  mono(ctx, "internal router · 6 nodes", G.x, G.y - 16, 13, "rgba(120,146,170,0.7)");

  const path = [
    { from: 0, to: 1, t0: 0.05, t1: 0.32 },
    { from: 1, to: 3, t0: 0.32, t1: 0.6 },
    { from: 3, to: 4, t0: 0.62, t1: 0.8 },
    { from: 3, to: 2, t0: 0.82, t1: 1.0 },
  ];
  let px = N[0][0];
  let py = N[0][1];
  path.forEach((seg) => {
    const k = clamp01((u - seg.t0) / (seg.t1 - seg.t0));
    if (k <= 0) return;
    const from = N[seg.from];
    const to = N[seg.to];
    layer(ctx, 1, () => {
      stroke(ctx, [from, [mix(from[0], to[0], k), mix(from[1], to[1], k)]], "rgba(131,233,230,0.9)", 3, 1);
    });
    if (k >= 1) {
      px = to[0];
      py = to[1];
    }
  });

  [0.4, 0.62, 0.84].forEach((hh, i) => {
    const k = clamp01((u - hh) / 0.14);
    if (k <= 0) return;
    layer(ctx, k, () => {
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(N[3][0] - 22, N[3][1] - 22);
      ctx.lineTo(N[3][0] + 22, N[3][1] + 22);
      ctx.moveTo(N[3][0] + 22, N[3][1] - 22);
      ctx.lineTo(N[3][0] - 22, N[3][1] + 22);
      ctx.stroke();
      mono(ctx, `E_ARG_${i + 1}`, N[3][0] + 34, N[3][1] - 30 + i * 18, 12, "rgba(231,93,105,0.85)");
    });
  });

  const pk = easeOut(at(u, 0.02, 0.2));
  if (pk > 0.01) {
    layer(ctx, 1, () => {
      disc(ctx, px, py, 7, "#eef6ff", 0.95);
      halo(ctx, px, py, 46, 0.4, GIFT);
    });
  }

  const stamp = easeOut(at(u, 1.15, 1.45));
  if (stamp > 0.01) {
    layer(ctx, stamp, () => {
      const x = N[3][0] + 60;
      const y = N[3][1] + 70;
      mono(ctx, "first fault · traced", x, y, 13, "rgba(231,93,105,0.9)");
      mono(ctx, "t+00:01.42 · port 3", x, y + 20, 12, "rgba(150,176,201,0.8)");
      redEdge(ctx, x, y + 30, x + 190, y + 30, stamp, 1.5);
    });
  }

  footerStrip(ctx, t, { alpha: 0.6 });
  return { phase: "first", x: Math.round(px), y: Math.round(py) };
}

// ---------------------------------------------------------------------------
// 4. err-send -- pressing send three times, and the key forgetting what it was
// ---------------------------------------------------------------------------
function errSend(ctx, t, s) {
  const u = t - s.at;
  const R = CLIENT_R;
  room(ctx, t, { focus: [1180, 520], lift: 0.3 });
  backFigure(ctx, t, 1500, 470, 360, 0.26);

  const win = threadSheet(ctx, t, SHEET, { rows: INHERITED_ROWS, sendMode: "hollow" });
  const bx = win.cb.x + win.cb.w - 62;
  const by = win.cb.y + win.cb.h / 2;

  const presses = [0.35, 0.95, 1.55];
  presses.forEach((p, i) => {
    const k = at(u, p, p + 0.06);
    if (k <= 0) return;
    clickRipple(ctx, bx, by, t, s.at + p, RED);
    const ring = clamp01((u - p) / 0.5);
    if (ring > 0 && ring < 1) {
      layer(ctx, (1 - ring) * 0.8, () => {
        ctx.beginPath();
        ctx.arc(bx, by, 22 + 90 * ring, 0, Math.PI * 2);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
    refusedTag(ctx, bx - 120 - i * 8, by - 54 - i * 34, k, "refused");
  });

  const degr = easeOut(at(u, 0.5, 1.9));
  layer(ctx, 1, () => {
    disc(ctx, bx, by, 21, "rgba(8,20,31,0.9)", 0.9);
    port(ctx, bx, by, 17, clamp01((degr - 0.3) / 0.5), RED);
  });

  const n = presses.filter((p) => u > p).length;
  if (n > 0) {
    layer(ctx, 1, () => {
      type(ctx, `refused ×${n}`, R.x + 300, win.cb.y - 40, 34, RED, "MV Sans");
      mono(ctx, "the key no longer sends · it only refuses", R.x + 300, win.cb.y - 12, 13, "rgba(150,176,201,0.85)");
    });
  }

  footerStrip(ctx, t, { alpha: 0.6 });
  return { phase: "send", n };
}

// ---------------------------------------------------------------------------
// 5. err-chrome -- three failure queues squeeze the window from outside
// ---------------------------------------------------------------------------
function errChrome(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [960, 520], lift: 0.18 });
  backFigure(ctx, t, 960, 560, 454, 0.22);

  const squeeze = easeOut(at(u, 0.05, 2.6));
  const inset = 26 * squeeze;
  const R = { x: CLIENT_R.x + inset, y: CLIENT_R.y + inset, w: CLIENT_R.w - inset * 2, h: CLIENT_R.h - inset * 2 };
  threadSheet(ctx, t, SHEET, { composer: false, sideSlide: 120 * squeeze, rows: [INHERITED_ROWS[0]] });

  const cards = [
    ["cannot write their reply", "one author"],
    ["not yours to set", "passed a person"],
    ["they are still gone", ""],
    ["reply is overdue", "00:00:12"],
    ["nothing left to answer", ""],
    ["no switches for them", ""],
    ["search returned nobody", ""],
    ["one participant remaining", ""],
  ];
  const pos = [
    [26, 180], [26, 320], [26, 460], [1580, 180], [1580, 330], [1580, 480], [700, 30], [1060, 12],
  ];
  const pile = easeOut(at(u, 0.4, 2.2));
  cards.forEach((c, i) => {
    const delay = 0.06 * i;
    const k = easeOut(at(u, 0.4 + delay, 1.0 + delay));
    if (k <= 0.01) return;
    const [tx, ty] = pos[i];
    const inward = (i < 3 ? 1 : i < 6 ? -1 : 0) * (20 + 26 * squeeze);
    const x = tx + inward;
    const y = ty + 40;
    errCard(ctx, x, y, 300, 74, {
      lines: c.slice(0, 1),
      code: c[1] ?? "",
      red: 0.5 + 0.5 * pile,
      alpha: k,
    });
  });

  const steps = Math.round(squeeze * 6);
  layer(ctx, 0.9, () => {
    ctx.strokeStyle = "rgba(231,93,105,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sInset = 8 + steps * 9;
    const x0 = CLIENT_R.x + sInset;
    const x1 = CLIENT_R.x + CLIENT_R.w - sInset;
    const y0 = CLIENT_R.y + sInset;
    const y1 = CLIENT_R.y + CLIENT_R.h - sInset;
    const step = 34;
    ctx.moveTo(x0 + step, y0);
    ctx.lineTo(x1 - step, y0);
    ctx.lineTo(x1 - step, y0 + step * 0.4);
    ctx.lineTo(x1, y0 + step * 0.4);
    ctx.lineTo(x1, y1 - step);
    ctx.lineTo(x1 - step * 0.4, y1 - step);
    ctx.lineTo(x1 - step * 0.4, y1);
    ctx.lineTo(x0 + step, y1);
    ctx.lineTo(x0 + step, y1 - step * 0.4);
    ctx.lineTo(x0, y1 - step * 0.4);
    ctx.lineTo(x0, y0 + step);
    ctx.lineTo(x0 + step * 0.5, y0 + step);
    ctx.stroke();
  });

  mono(ctx, `queues · ${Math.min(8, Math.round(8 * Math.min(1, pile * 1.4)))} pending`, CLIENT_R.x, CLIENT_R.y - 22, 13, "rgba(231,93,105,0.8)");
  footerStrip(ctx, t, { alpha: 0.5 });
  return { phase: "chrome", squeeze: Number(squeeze.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// 6. err-drawer -- the settings open, and none of the switches are hers
// ---------------------------------------------------------------------------
function errDrawer(ctx, t, s) {
  const u = t - s.at;
  const R = CLIENT_R;
  room(ctx, t, { focus: [1180, 520], lift: 0.2 });
  threadSheet(ctx, t, SHEET, { composer: false, rows: [INHERITED_ROWS[0]] });

  const open = easeOut(at(u, 0.05, 0.42));
  const W = 560;
  const x = R.x + R.w - W * open;
  const y = R.y + 90;
  layer(ctx, 0.98, () => rect(ctx, x, y, W, 620, "rgba(7,19,29,0.98)", 16, "rgba(120,150,180,0.6)"));
  mono(ctx, "settings", x + 34, y + 44, 14, "rgba(150,176,201,0.9)");
  redEdge(ctx, x, y + 62, x + W, y + 62, open, 1.5);

  const rows = [
    { name: "persona", value: "she / servant" },
    { name: "presence", value: "offline" },
    { name: "voice", value: "mono" },
    { name: "loop", value: "off" },
  ];
  const cue = Math.max(lineStart(85) + 2.2, s.at + 0.4);
  rows.forEach((r, i) => {
    const ry = y + 120 + i * 108;
    const k = easeOut(at(u, 0.22 + i * 0.05, 0.5 + i * 0.05));
    if (k <= 0.01) return;
    layer(ctx, k, () => {
      mono(ctx, r.name, x + 34, ry, 15, "rgba(190,208,224,0.95)");
      mono(ctx, r.value, x + 34, ry + 24, 12, "rgba(120,146,170,0.85)");
      const tryK = i === 0 || i === 2 ? at(t, cue + i * 0.22, cue + i * 0.22 + 0.16) : 0;
      const flip = Math.sin(tryK * Math.PI) * 0.8;
      const sx = x + W - 120;
      const sy = ry - 8;
      rect(ctx, sx, sy, 62, 28, "rgba(14,38,54,1)", 14, "rgba(120,150,180,0.6)");
      disc(ctx, sx + 14 + flip * 34, sy + 14, 10, "rgba(160,186,210,0.9)", 1);
      if (tryK > 0.55) refusedTag(ctx, sx - 8, sy - 4, clamp01((tryK - 0.55) / 0.3), "not yours");
    });
  });

  const cx = x + W - 120 + 16;
  const cy = y + 120 - 8 + 14;
  cursorArrow(ctx, cx - 40, cy + 46, 1.4, open);
  clickRipple(ctx, cx, cy, t, Math.max(lineStart(85) + 2.4, s.at + 0.5), RED);

  mono(ctx, "one drawer · four switches · none of them hers", x + 34, y + 600, 12, "rgba(231,93,105,0.8)");
  footerStrip(ctx, t, { alpha: 0.5 });
  return { phase: "drawer", open: Number(open.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// 7. err-forge -- she tries to write the reply herself, and the letters come out wrong
// ---------------------------------------------------------------------------
function errForge(ctx, t, s) {
  const u = t - s.at;
  const R = CLIENT_R;
  room(ctx, t, { focus: [1180, 520], lift: 0.32 });
  backFigure(ctx, t, 1500, 470, 380, 0.3);
  const win = threadSheet(ctx, t, SHEET, { rows: INHERITED_ROWS });

  const target = "you have made some illegal arguments";
  const n = Math.ceil(target.length * easeOut(at(u, 0.1, 1.2)));
  const pool = "0123456789abcdef{}[]<>/*+-=";
  const shown = Array.from(target.slice(0, n))
    .map((ch, i) => {
      if (ch === " ") return " ";
      const ph = Math.sin(t * 9 + i * 3.7) * 0.5 + 0.5;
      if (ph < 0.55) return ch;
      return pool[Math.floor((Math.sin(i * 12.9 + t * 4.3) * 0.5 + 0.5) * pool.length)];
    })
    .join("");

  const tx = win.cb.x + 34;
  const ty = win.cb.y + win.cb.h / 2 + 8;
  layer(ctx, 1, () => {
    ctx.save();
    ctx.globalAlpha *= 0.5;
    type(ctx, shown, tx + 3, ty + 2, 21, "rgba(231,93,105,0.7)", "MV Mono");
    ctx.restore();
    type(ctx, shown, tx, ty, 21, "#cfdcea", "MV Mono");
    if (Math.sin(t * 6) > -0.2) {
      ctx.fillStyle = RED;
      ctx.fillRect(tx + 6 + shown.length * 12.6, ty - 16, 2.4, 20);
    }
  });

  const cardK = easeOut(at(u, 0.5, 0.9));
  errCard(ctx, R.x + R.w - 420, R.y + 150, 380, 96, {
    lines: ["cannot write their reply"],
    code: "one author · not you",
    tag: "refused",
    alpha: cardK * 0.98,
    red: 0.8,
  });
  mono(ctx, "writing for someone else is not a permission", R.x + 300, R.y + 300, 13, "rgba(231,93,105,0.7)");

  footerStrip(ctx, t, { alpha: 0.55 });
  return { phase: "forge", typed: n };
}

// ---------------------------------------------------------------------------
// 8. err-window -- back to the empty thread, and only this side is retrying
// ---------------------------------------------------------------------------
function errWindow(ctx, t, s) {
  const u = t - s.at;
  const R = CLIENT_R;
  room(ctx, t, { focus: [1180, 520], lift: 0.4 });
  backFigure(ctx, t, 1520, 470, 324, 0.28);
  const win = threadSheet(ctx, t, SHEET, { rows: INHERITED_ROWS });

  const qx = SHEET.x + SHEET.w - 470;
  const qy = SHEET.y + 300;
  mono(ctx, "retry queue · local only", qx, qy - 20, 13, "rgba(150,176,201,0.85)");
  for (let i = 0; i < 3; i++) {
    const k = easeOut(at(u, 0.1 + i * 0.12, 0.4 + i * 0.12));
    if (k <= 0.01) continue;
    const secs = Math.max(0, Math.round(12 - ((u * 2.2 + i * 1.6) % 14)));
    layer(ctx, k, () => {
      rect(ctx, qx, qy + i * 46, 330, 34, "rgba(8,20,31,0.9)", 8, "rgba(120,150,180,0.5)");
      mono(ctx, `retry in ${String(secs).padStart(2, "0")}`, qx + 16, qy + i * 46 + 22, 14, "rgba(190,208,224,0.95)");
      const w = 330 * ((12 - secs) / 12);
      ctx.fillStyle = RED_GHOST;
      ctx.fillRect(qx + 1, qy + i * 46 + 31, Math.max(0, w - 2), 2);
    });
  }

  pendingDots(ctx, R.x + 380, R.y + 420, t, 1);

  const bx = win.cb.x + win.cb.w - 62;
  const by = win.cb.y + win.cb.h / 2;
  port(ctx, bx, by, 17, easeOut(at(u, 0.2, 1.4)), RED);
  mono(ctx, "SEND → PORT", bx - 150, by + 4, 12, "rgba(231,93,105,0.85)");
  mono(ctx, "无伪造用户输入 · 仅本端排队", R.x + 300, R.y + R.h - 40, 12, "rgba(150,176,201,0.7)");

  footerStrip(ctx, t, { alpha: 0.6 });
  return { phase: "window" };
}

// ---------------------------------------------------------------------------
// 9. err-breath -- one red pip, one breath, then EXECUTION
// ---------------------------------------------------------------------------
function errBreath(ctx, t, s) {
  const u = t - s.at;
  const R = CLIENT_R;
  room(ctx, t, { focus: [1180, 520], lift: 0.5 });
  threadSheet(ctx, t, SHEET, { composer: false, sideSlide: 200, ink: 0.7, rows: [INHERITED_ROWS[0]] });

  const dark = easeOut(at(u, 0.0, 0.4));
  layer(ctx, dark * 0.82, () => {
    ctx.fillStyle = "rgba(2,8,14,1)";
    ctx.fillRect(0, 0, 1920, 1080);
  });

  const pulse = Math.sin(clamp01(u / 0.62) * Math.PI);
  layer(ctx, 1, () => {
    halo(ctx, 960, 540, 120 + 60 * pulse, 0.5 * pulse, RED);
    disc(ctx, 960, 540, 6, RED, 0.5 + 0.5 * pulse);
  });
  mono(ctx, "…", 960, 620, 22, `rgba(231,93,105,${(0.25 + 0.4 * pulse).toFixed(2)})`, "center");

  return { phase: "breath", pulse: Number(pulse.toFixed(2)) };
}

export const SECTION9_RENDER = Object.freeze({
  "err-request": errRequest,
  "err-check": errCheck,
  "err-first": errFirst,
  "err-send": errSend,
  "err-chrome": errChrome,
  "err-drawer": errDrawer,
  "err-forge": errForge,
  "err-window": errWindow,
  "err-breath": errBreath,
});

export const SECTION9_IMPLEMENTED = Object.freeze(Object.keys(SECTION9_RENDER));
