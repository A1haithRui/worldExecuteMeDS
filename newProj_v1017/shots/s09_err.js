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
const SHEET = Object.freeze({ x: 250, y: 176, w: 1300, h: 800 });
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
    suppressPlaceholder = false,
    ink = 1,
    sendColour = BRAND_SOFT,
  } = o;
  const sideW = 0;
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
    type(ctx, title, mx + 52, R.y + 74, 32, "#dfe9f4", "MV Sans");
    const cw = 20 + chipText.length * 11 + 40;
    rect(ctx, R.x + R.w - cw - 36, R.y + 28, cw, 38, "rgba(16,40,56,0.95)", 19, "rgba(120,150,180,0.6)");
    disc(ctx, R.x + R.w - cw - 16, R.y + 47, 5, "rgba(160,186,210,0.7)", 1);
    mono(ctx, chipText, R.x + R.w - cw - 4, R.y + 60, 15, "rgba(160,186,210,0.9)");
    stroke(ctx, [[mx, R.y + 92], [R.x + R.w, R.y + 92]], "rgba(61,122,156,0.5)", 1.2);

    // rows
    rows.forEach((r, i) => {
      const y = R.y + 186 + i * 104;
      mono(ctx, r.who ?? "me", mx + 52, y - 22, 13, "rgba(120,146,170,0.65)");
      type(ctx, r.text, mx + 52, y + 16, 32, `rgba(206,220,234,${r.alpha ?? 0.9})`, "MV Sans");
      if (r.time) mono(ctx, r.time, mx + 52, y + 48, 13, "rgba(120,146,170,0.55)");
    });

    // composer
    if (composer) {
      cb = { x: mx + 50, y: R.y + R.h - 176, w: mw - 100, h: 136 };
      rect(ctx, cb.x, cb.y, cb.w, cb.h, "rgba(10,26,40,0.95)", 14, "rgba(61,122,156,0.65)");
      const baseY = cb.y + cb.h / 2 + 7;
      if (!composerText && !suppressPlaceholder) {
        type(ctx, placeholder, cb.x + 38, baseY, 26, "rgba(120,146,170,0.7)", "MV Sans");
      } else {
        type(ctx, composerText, cb.x + 38, baseY, 26, "#cfdcea", "MV Mono");
        if (caret) {
          ctx.font = '400 26px "MV Mono"';
          if (Math.sin(t * 6.2) > -0.4) {
            ctx.fillStyle = sendColour;
            ctx.fillRect(cb.x + 40 + ctx.measureText(composerText).width, baseY - 20, 2.6, 24);
          }
        }
      }
      const bx = cb.x + cb.w - 72;
      const by = cb.y + cb.h / 2;
      disc(ctx, bx, by, 26, sendColour, 0.42 + 0.3 * sendK, false, 2.1);
      if (sendMode === "armed" || sendK > 0.02) {
        ctx.save();
        ctx.globalAlpha *= sendMode === "armed" ? 1 : sendK;
        ctx.fillStyle = sendColour;
        ctx.beginPath();
        ctx.moveTo(bx, by - 11);
        ctx.lineTo(bx + 9, by + 4.5);
        ctx.lineTo(bx - 9, by + 4.5);
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
    if (head) type(ctx, head, x + 24, y + 34, 16, "rgba(150,176,201,0.92)", "MV Mono");
    lines.forEach((ln, i) => {
      type(ctx, ln, x + 24, y + 66 + i * 32, 22, "#cfdcea", "MV Mono");
    });
    if (code) type(ctx, code, x + 24, y + h - 14, 13, "rgba(120,146,170,0.8)", "MV Mono");
    if (tag) {
      const tw = 20 + tag.length * 11;
      rect(ctx, x + w - tw - 16, y + 16, tw, 28, RED_TAG, 14, "rgba(231,93,105,0.65)");
      type(ctx, tag, x + w - tw / 2 - 16, y + 36, 14, RED, "MV Mono", "center");
    }
  });
}

/** A refusal tag, centred on (x, y). */
function refusedTag(ctx, x, y, k, text = "refused", alpha = 1) {
  if (k <= 0.01) return;
  layer(ctx, Math.min(1, k) * alpha, () => {
    const w = 26 + text.length * 10;
    rect(ctx, x - w / 2, y - 15, w, 30, "rgba(6,16,26,0.95)", 15, "rgba(231,93,105,0.7)");
    type(ctx, text, x, y + 6, 15, RED, "MV Mono", "center");
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
  const cardW = 620;
  const cardH = 108;
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
  threadSheet(ctx, t, SHEET, { composer: false, ink: 0.45, rows: INHERITED_ROWS });

  const card = { x: SHEET.x + 110, y: SHEET.y + 130, w: 1060, h: 420 };
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
  threadSheet(ctx, t, SHEET, { composer: false, ink: 0.06, rows: [INHERITED_ROWS[0]] });

  // A ledger band across the sheet: the router is a diagram, so it gets a rule and a
  // title the way a plate would, not a caption floating in the dark.
  const G = { x: 230, y: 400, w: 1460, h: 380 };
  layer(ctx, 0.9, () => {
    ctx.strokeStyle = "rgba(120,150,180,0.35)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(G.x, G.y - 40);
    ctx.lineTo(G.x + G.w, G.y - 40);
    ctx.stroke();
  });
  mono(ctx, "INTERNAL ROUTER", G.x, G.y - 58, 22, "rgba(190,208,224,0.9)");
  mono(ctx, "6 nodes · 8 edges · one port", G.x + 420, G.y - 58, 16, "rgba(120,146,170,0.8)");

  const N = [
    [0.02, 0.52], [0.26, 0.22], [0.26, 0.82], [0.5, 0.52], [0.76, 0.26], [0.76, 0.78], [0.98, 0.52],
  ].map(([a, b]) => [G.x + a * G.w, G.y + b * G.h]);
  const E = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]];

  const draw = easeOut(at(u, 0.02, 0.3));
  layer(ctx, draw * 0.6, () => {
    E.forEach(([a, b]) => stroke(ctx, [N[a], N[b]], "rgba(120,150,180,0.7)", 2.4, 0.9));
  });
  N.forEach(([x, y], i) => {
    const k = easeOut(at(u, 0.05 + i * 0.03, 0.3 + i * 0.03));
    layer(ctx, k, () => {
      rect(ctx, x - 13, y - 13, 26, 26, "rgba(9,26,38,0.98)", 4, "rgba(131,233,230,0.85)");
      mono(ctx, `r${i}`, x, y + 42, 16, "rgba(150,176,201,0.85)", "center");
      if (i === 3) port(ctx, x, y, 30, k, RED), mono(ctx, `r${i}`, x, y + 62, 16, "rgba(150,176,201,0.85)", "center");
    });
  });
  // the port gets its name in the same size as the nodes
  layer(ctx, easeOut(at(u, 0.5, 0.7)), () =>
    mono(ctx, "PORT 3", N[3][0] + 44, N[3][1] - 26, 18, "rgba(231,93,105,0.95)"),
  );

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
      stroke(ctx, [from, [mix(from[0], to[0], k), mix(from[1], to[1], k)]], "rgba(131,233,230,0.95)", 4.5, 1);
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
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(N[3][0] - 34, N[3][1] - 34);
      ctx.lineTo(N[3][0] + 34, N[3][1] + 34);
      ctx.moveTo(N[3][0] + 34, N[3][1] - 34);
      ctx.lineTo(N[3][0] - 34, N[3][1] + 34);
      ctx.stroke();
      mono(ctx, `E_ARG_${i + 1}`, N[3][0] + 58, N[3][1] + 58 + i * 28, 18, "rgba(231,93,105,0.95)");
    });
  });

  const pk = easeOut(at(u, 0.02, 0.2));
  if (pk > 0.01) {
    layer(ctx, 1, () => {
      disc(ctx, px, py, 11, "#eef6ff", 0.98);
      halo(ctx, px, py, 80, 0.45, GIFT);
    });
  }

  // the trace stamp: the frame's biggest piece of type in this shot
  const stamp = easeOut(at(u, 1.05, 1.4));
  if (stamp > 0.01) {
    layer(ctx, stamp, () => {
      const x = G.x;
      const y = G.y + G.h + 78;
      mono(ctx, "FIRST FAULT · TRACED", x, y, 30, "rgba(231,93,105,0.95)");
      mono(ctx, "t+00:01.42 · PORT 3 · E_ARG 1/2/3", x, y + 34, 18, "rgba(190,208,224,0.85)");
      redEdge(ctx, x, y + 48, x + 620, y + 48, stamp, 2.5);
    });
  }

  footerStrip(ctx, t, { alpha: 0.6 });
  return { phase: "first", x: Math.round(px), y: Math.round(py) };
}

// ---------------------------------------------------------------------------
// 4. err-send -- the key is pressed three times, and each refusal is a stamp
//
// The refusals are the subject of this shot, so they are not rowdy little tags: they
// are three large stamps dropped one under the other in the empty thread, and the
// count is a numeral you cannot miss.
// ---------------------------------------------------------------------------
function errSend(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [1180, 520], lift: 0.3 });
  backFigure(ctx, t, 1560, 470, 360, 0.24);

  const win = threadSheet(ctx, t, SHEET, { rows: [], sendMode: "hollow", ink: 0.9 });
  const bx = win.cb.x + win.cb.w - 72;
  const by = win.cb.y + win.cb.h / 2;

  const presses = [0.3, 0.85, 1.4];
  const stampX = SHEET.x + 60;
  presses.forEach((p, i) => {
    const k = clamp01((u - p) / 0.2);
    if (k <= 0) return;
    const pop = 1.06 - 0.06 * easeOut(k);
    const y = SHEET.y + 150 + i * 128;
    layer(ctx, k, () => {
      ctx.save();
      ctx.translate(stampX + 260, y + 50);
      ctx.scale(pop, pop);
      ctx.translate(-(stampX + 260), -(y + 50));
      // the stamp is a slab with a red rule, so it reads as a document, not a tooltip
      rect(ctx, stampX, y, 520, 100, "rgba(10,20,30,0.92)", 4, "rgba(231,93,105,0.55)");
      ctx.fillStyle = "rgba(231,93,105,0.85)";
      ctx.fillRect(stampX, y, 3, 100);
      type(ctx, "REFUSED", stampX + 30, y + 58, 46, RED, "MV Sans");
      mono(ctx, `№ ${i + 1}`, stampX + 286, y + 42, 20, "rgba(190,208,224,0.9)");
      mono(ctx, `t+${(p).toFixed(2)}s  ·  SEND`, stampX + 286, y + 72, 15, "rgba(150,176,201,0.8)");
      ctx.restore();
    });
    // the ring the press throws off
    const ring = clamp01((u - p) / 0.5);
    if (ring > 0 && ring < 1) {
      layer(ctx, (1 - ring) * 0.85, () => {
        ctx.beginPath();
        ctx.arc(bx, by, 36 + 150 * ring, 0, Math.PI * 2);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    }
    clickRipple(ctx, bx, by, t, s.at + p, RED);
  });

  // the count: one very large numeral, because that is the point of the shot
  const n = presses.filter((p) => u > p).length;
  if (n > 0) {
    layer(ctx, 1, () => {
      const x = stampX + 600;
      const y = SHEET.y + 200;
      type(ctx, `×${n}`, x, y + 92, 140, RED, "MV Sans");
      mono(ctx, "times the key refused", x, y + 140, 20, "rgba(190,208,224,0.95)");
      mono(ctx, "the key no longer sends · it only refuses", x, y + 172, 16, "rgba(150,176,201,0.85)");
    });
  }

  // the key itself: a port, with the three rings it has already thrown
  const degr = easeOut(at(u, 0.4, 1.7));
  layer(ctx, 1, () => {
    disc(ctx, bx, by, 30, "rgba(8,20,31,0.92)", 0.95);
    port(ctx, bx, by, 26, clamp01((degr - 0.2) / 0.6), RED);
    mono(ctx, "SEND → PORT", bx - 96, by + 58, 16, "rgba(231,93,105,0.9)");
  });

  footerStrip(ctx, t, { alpha: 0.6 });
  return { phase: "send", n };
}

// ---------------------------------------------------------------------------
// 5. err-chrome -- the failure queues push in, on a strict grid
//
// Last pass these were cards of three different sizes with text falling out of them.
// They are now one card size on a 3x3 grid, and the squeeze is the grid losing its
// gaps, which is what a queue closing in actually looks like.
// ---------------------------------------------------------------------------
function errChrome(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [960, 520], lift: 0.18 });
  backFigure(ctx, t, 960, 560, 454, 0.2);

  const squeeze = easeOut(at(u, 0.05, 2.6));
  const inset = 20 * squeeze;
  const R = { x: SHEET.x + inset, y: SHEET.y + inset, w: SHEET.w - inset * 2, h: SHEET.h - inset * 2 };
  threadSheet(ctx, t, R, { composer: false, sideSlide: 120 * squeeze, ink: 0.4, rows: [INHERITED_ROWS[0]] });

  const CARD = { w: 380, h: 104 };
  const GAP = 24 - 12 * squeeze;
  const COLS = 3;
  const gridW = COLS * CARD.w + (COLS - 1) * GAP;
  const x0 = 960 - gridW / 2;
  const y0 = SHEET.y + 150;
  const cards = [
    "cannot write their reply",
    "not yours to set",
    "they are still gone",
    "reply is overdue",
    "nothing left to answer",
    "no switches for them",
    "search returned nobody",
    "one participant remaining",
    "the answer has not changed",
  ];
  const codes = ["4d2c", "8f2c", "1a09", "00:00:12", "", "—", "0 results", "1 / 2", "unchanged"];

  cards.forEach((text, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const k = easeOut(at(u, 0.35 + i * 0.06, 0.85 + i * 0.06));
    if (k <= 0.01) return;
    const x = x0 + col * (CARD.w + GAP);
    const y = y0 + row * (CARD.h + GAP);
    errCard(ctx, x, y, CARD.w, CARD.h, {
      lines: [text],
      code: codes[i] ? `E_${codes[i]}` : "",
      red: 0.45 + 0.55 * squeeze,
      alpha: k,
    });
  });

  // the chrome, four rules inset by the squeeze: the window is being pressed in
  layer(ctx, 0.6, () => {
    ctx.strokeStyle = "rgba(231,93,105,0.35)";
    ctx.lineWidth = 1.6;
    const s = 8 + squeeze * 26;
    ctx.beginPath();
    ctx.rect(SHEET.x + s, SHEET.y + s, SHEET.w - s * 2, SHEET.h - s * 2);
    ctx.stroke();
  });

  mono(ctx, `QUEUES · ${Math.min(9, Math.round(9 * Math.min(1, squeeze * 1.5)))} PENDING`, SHEET.x, SHEET.y - 26, 20, "rgba(231,93,105,0.9)");
  mono(ctx, "the failure queues close in from outside", SHEET.x + 360, SHEET.y - 26, 15, "rgba(150,176,201,0.8)");
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
  const W = 620;
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
      mono(ctx, r.name, x + 38, ry, 18, "rgba(190,208,224,0.95)");
      mono(ctx, r.value, x + 38, ry + 30, 14, "rgba(120,146,170,0.85)");
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
  room(ctx, t, { focus: [1180, 520], lift: 0.32 });
  backFigure(ctx, t, 1540, 470, 380, 0.26);
  // no placeholder: this composer holds her forged line, drawn below by hand
  const win = threadSheet(ctx, t, SHEET, { rows: INHERITED_ROWS, suppressPlaceholder: true, ink: 0.85 });

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

  const tx = win.cb.x + 38;
  const ty = win.cb.y + win.cb.h / 2 + 9;
  layer(ctx, 1, () => {
    ctx.save();
    ctx.globalAlpha *= 0.55;
    type(ctx, shown, tx + 4, ty + 3, 26, "rgba(231,93,105,0.75)", "MV Mono");
    ctx.restore();
    type(ctx, shown, tx, ty, 26, "#cfdcea", "MV Mono");
    if (Math.sin(t * 6) > -0.2) {
      ctx.fillStyle = RED;
      ctx.fillRect(tx + 8 + shown.length * 15.6, ty - 22, 3, 28);
    }
  });

  const cardK = easeOut(at(u, 0.45, 0.85));
  errCard(ctx, SHEET.x + SHEET.w - 520, SHEET.y + 250, 470, 116, {
    lines: ["cannot write their reply"],
    code: "one author · not you",
    tag: "refused",
    alpha: cardK * 0.98,
    red: 0.85,
  });
  mono(ctx, "writing for someone else is not a permission", SHEET.x + 60, SHEET.y + 388, 16, "rgba(231,93,105,0.8)");

  footerStrip(ctx, t, { alpha: 0.55 });
  return { phase: "forge", typed: n };
}

// ---------------------------------------------------------------------------
// 8. err-window -- back to the empty thread, and only this side is retrying
//
// The queue is the plot here: it has to be the largest thing on the sheet after the
// window title, so it is a panel with 40px numerals, not three small pills.
// ---------------------------------------------------------------------------
function errWindow(ctx, t, s) {
  const u = t - s.at;
  const R = CLIENT_R;
  room(ctx, t, { focus: [1180, 520], lift: 0.4 });
  backFigure(ctx, t, 1560, 470, 324, 0.26);
  const win = threadSheet(ctx, t, SHEET, { rows: INHERITED_ROWS, ink: 0.85 });

  const P = { x: SHEET.x + SHEET.w - 620, y: SHEET.y + 210, w: 560, h: 300 };
  mono(ctx, "RETRY QUEUE · LOCAL ONLY", P.x, P.y - 22, 22, "rgba(231,93,105,0.9)");
  mono(ctx, "nothing leaves this side of the thread", P.x, P.y + 2, 15, "rgba(150,176,201,0.8)");
  for (let i = 0; i < 3; i++) {
    const k = easeOut(at(u, 0.1 + i * 0.12, 0.4 + i * 0.12));
    if (k <= 0.01) continue;
    const secs = Math.max(0, Math.round(12 - ((u * 2.2 + i * 1.6) % 14)));
    const ry = P.y + 34 + i * 74;
    layer(ctx, k, () => {
      rect(ctx, P.x, ry, P.w, 62, "rgba(8,20,31,0.92)", 8, "rgba(120,150,180,0.6)");
      mono(ctx, "retry in", P.x + 22, ry + 40, 17, "rgba(150,176,201,0.85)");
      type(ctx, String(secs).padStart(2, "0"), P.x + P.w - 130, ry + 50, 40, "#dfe9f4", "MV Mono");
      mono(ctx, "s", P.x + P.w - 96, ry + 40, 18, "rgba(190,208,224,0.9)");
      const w = (P.w - 24) * ((12 - secs) / 12);
      ctx.fillStyle = "rgba(231,93,105,0.35)";
      ctx.fillRect(P.x + 12, ry + 54, Math.max(0, w), 3);
    });
  }

  pendingDots(ctx, SHEET.x + 380, SHEET.y + 470, t, 1);

  const bx = win.cb.x + win.cb.w - 72;
  const by = win.cb.y + win.cb.h / 2;
  layer(ctx, 1, () => {
    disc(ctx, bx, by, 30, "rgba(8,20,31,0.9)", 0.9);
    port(ctx, bx, by, 26, easeOut(at(u, 0.2, 1.4)), RED);
    mono(ctx, "SEND → PORT", bx - 110, by + 58, 17, "rgba(231,93,105,0.9)");
  });
  mono(ctx, "无伪造用户输入 · 仅本端排队", SHEET.x + 380, SHEET.y + SHEET.h + 26, 15, "rgba(150,176,201,0.75)");

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
