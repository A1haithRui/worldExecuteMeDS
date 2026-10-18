// Section 1 启动 — song time [0, 15.08). Four shots, mirroring the reference's
// boot section slot for slot:
//
//   boot-power   0.000– 4.004  a hairline opens into the window, the mark lights
//   boot-layout  4.004– 7.695  header / sidebar / thread / composer assemble
//   boot-params  7.695–11.387  the persona card fills in; love stays undefined
//   boot-world  11.387–15.080  an empty conversation, ready, nothing lit
//
// Everything here is a pure function of song time: no cross-frame state, no
// random, no clock. That is what lets the exporter render any frame in any
// order and still get identical pixels.
import {
  W, H, C, clamp, mix, at, layer, stroke, disc, rect, type, halo, point, ground,
} from "../src/mv-draw.js";
import { drawWhale, spaced } from "../src/assets/whale.js";
import { TOKENS, chatWindow, caret as chatCaret } from "../src/engine/chat.js";
import { drawFigure as portraitFigure, idle as portraitIdle } from "../src/engine/portrait.js";
import { typewriter } from "../src/engine/type.js";
import { loadImages } from "../src/mv-draw.js";

const { images } = loadImages({
  lowlight: "/assets/character/v4/deepseek_bust_v4_lowlight.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  bust: "/assets/character/deepseek_bust_v3.png",
});

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";

// The window the first two shots share, so the frame that opens in boot-power is
// the same frame the interface is assembled into.
const WIN = Object.freeze({ x: 420, y: 250, w: 1080, h: 580 });
const WIN_CX = WIN.x + WIN.w / 2;
const WIN_CY = WIN.y + WIN.h / 2;

function figure(ctx, t, key, cx, cy, height, opts = {}) {
  const { alpha = 1, seed = 5 } = opts;
  const img = images[key] || images.bust;
  if (!img || !img.complete || !img.naturalWidth) return null;
  const b = portraitIdle(t, { seed, bobAmp: 4 });
  const s = height / 1438;
  const w = 1342 * s;
  const h = 1704 * s;
  layer(ctx, alpha, () =>
    ctx.drawImage(img, cx + b.sway - w / 2, cy + b.bobY - h / 2, w * b.breathe, h * b.breathe),
  );
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Centred letter-spaced text; returns its width. */
function spacedCentred(ctx, text, cx, y, size, color, family = "MV Sans", tracking = 0.22) {
  ctx.font = `400 ${size}px "${family}"`;
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + size * tracking * (text.length - 1);
  let x = cx - total / 2;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = color;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + size * tracking;
  });
  return total;
}

// ---------------------------------------------------------------------------
// boot-power — 0.000–4.004. A hairline opens into the window; the mark strokes
// itself on and fills; the protection layer sweeps and locks.
// ---------------------------------------------------------------------------
function bootPower(ctx, t, s) {
  ground(ctx, t, [WIN_CX, WIN_CY], true);

  const u = t - s.at;
  const hairX = at(t, s.at + 0.30, s.at + 1.00);
  const openY = at(t, s.at + 0.95, s.at + 1.80);
  const markIn = at(t, s.at + 1.55, s.at + 2.35);
  const fillIn = at(t, s.at + 2.20, s.at + 2.62);
  const wordIn = at(t, s.at + 2.40, s.at + 3.00);
  const sweep = at(t, s.at + 2.70, s.at + 3.50);
  const bracket = at(t, s.at + 3.05, s.at + 3.55);
  const status = at(t, s.at + 3.30, s.at + 3.95);

  // 1. the hairline: a 2px line that grows out of the centre
  const halfW = mix(0, WIN.w / 2, hairX);
  if (openY <= 0) {
    layer(ctx, 1, () => {
      ctx.fillStyle = BRAND_SOFT;
      ctx.fillRect(WIN_CX - halfW, WIN_CY - 1, Math.max(0.001, halfW * 2), 2);
      halo(ctx, WIN_CX, WIN_CY, 160 + 120 * hairX, 0.10 * hairX, BRAND);
    });
  }

  // 2. the window opening: both dimensions grow, so the line becomes a frame
  if (openY > 0) {
    const w = mix(2, WIN.w, hairX);
    const h = mix(2, WIN.h, openY);
    const x = WIN_CX - w / 2;
    const y = WIN_CY - h / 2;
    const r = mix(2, 26, openY);
    layer(ctx, 1, () => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      // Fade the fill in with the opening: at two pixels tall a solid panel just
      // reads as a black bar sitting on the dark room.
      ctx.fillStyle = `rgba(6,19,31,${0.86 * openY})`;
      ctx.fill();
      ctx.strokeStyle = BRAND_SOFT;
      ctx.globalAlpha = 0.25 + 0.55 * openY;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // 3. the mark strokes on, then floods with the brand blue
    if (markIn > 0) {
      drawWhale(ctx, WIN_CX, WIN_CY - 46, 236, {
        strokeK: markIn,
        fillK: fillIn,
        color: BRAND,
        lineWidth: 2.4,
        alpha: 0.35 + 0.65 * openY,
      });
      halo(ctx, WIN_CX, WIN_CY - 46, 300, 0.10 * fillIn, BRAND);
    }

    // 4. wordmark
    if (wordIn > 0) {
      layer(ctx, wordIn, () =>
        spacedCentred(ctx, "DeepSeek", WIN_CX, WIN_CY + 118, 40, "#e8eeff", "MV Sans", 0.24),
      );
      layer(ctx, wordIn * 0.7, () =>
        spacedCentred(ctx, "WORLD MODEL", WIN_CX, WIN_CY + 158, 15, "#6b86a8", "MV Mono", 0.34),
      );
    }

    // 5. the protection layer: one scan sweep, then the frame is trusted
    if (sweep > 0 && sweep < 1) {
      const sy = y + h * sweep;
      const g = ctx.createLinearGradient(0, sy - 42, 0, sy + 42);
      g.addColorStop(0, "rgba(77,107,254,0)");
      g.addColorStop(0.5, "rgba(127,147,255,0.30)");
      g.addColorStop(1, "rgba(77,107,254,0)");
      layer(ctx, 1, () => {
        ctx.fillStyle = g;
        ctx.fillRect(x, sy - 42, w, 84);
      });
    }

    // 6. corner brackets snap in
    if (bracket > 0) {
      const L = 34 * bracket;
      const off = 10;
      const arms = [
        [x - off, y - off, 1, 1], [x + w + off, y - off, -1, 1],
        [x - off, y + h + off, 1, -1], [x + w + off, y + h + off, -1, -1],
      ];
      layer(ctx, 1, () => {
        ctx.strokeStyle = BRAND_SOFT;
        ctx.globalAlpha = 0.75 * bracket;
        ctx.lineWidth = 2;
        for (const [px, py, sx, sy] of arms) {
          ctx.beginPath();
          ctx.moveTo(px, py + sy * L);
          ctx.lineTo(px, py);
          ctx.lineTo(px + sx * L, py);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });
    }

    // 7. the boot line along the foot of the window
    if (status > 0) {
      const label = "/ power line open";
      const shown = typewriter(label, t, s.at + 3.30, 26);
      layer(ctx, 1, () => {
        type(ctx, "power", x + 30, y + h - 34, 17, BRAND_SOFT, "MV Mono");
        type(ctx, shown, x + 104, y + h - 34, 17, "#9fb4d8", "MV Mono");
        if (shown.length < label.length)
          chatCaret(ctx, x + 108 + shown.length * 10.2, y + h - 30, 16, t, { on: true, color: BRAND_SOFT });
        // protection indicator: grey until the sweep has passed
        const on = sweep >= 1;
        disc(ctx, x + w - 34, y + h - 40, 5, on ? BRAND_SOFT : "#3a4a63", 1);
        if (on) halo(ctx, x + w - 34, y + h - 40, 26, 0.35, BRAND);
      });
      layer(ctx, at(t, s.at + 3.62, s.at + 3.95), () =>
        type(ctx, "protection on", x + w - 130, y + h - 34, 15, "#6b86a8", "MV Mono"),
      );
    }
  }

  return { phase: "power", u, markIn, fillIn };
}

// ---------------------------------------------------------------------------
// boot-layout — 4.004–7.695. Header, sidebar, thread and composer fly into the
// window that the previous shot opened, then the layout locks.
// ---------------------------------------------------------------------------
const PIECES = Object.freeze([
  { key: "header", x: WIN.x + 24, y: WIN.y + 24, w: WIN.w - 48, h: 66, dx: 0, dy: -76 },
  { key: "sidebar", x: WIN.x + 24, y: WIN.y + 102, w: 150, h: WIN.h - 138, dx: -150, dy: 0 },
  { key: "thread", x: WIN.x + 186, y: WIN.y + 102, w: WIN.w - 210, h: WIN.h - 264, dx: 0, dy: 130 },
  { key: "composer", x: WIN.x + 186, y: WIN.y + WIN.h - 150, w: WIN.w - 210, h: 118, dx: 0, dy: 170 },
]);

/**
 * The contents of each piece, kept schematic on purpose: this shot is about the
 * interface being built, so the pieces show their shape and their slots, not
 * real conversation. Anything more would pre-empt the next shots.
 */
function skeleton(ctx, piece, x, y, lock) {
  const dim = lock > 0 ? 0.55 : 0.4;
  const ink = (a) => `rgba(127,147,255,${a})`;
  if (piece.key === "header") {
    type(ctx, "deepseek", x + 96, y + 40, 19, ink(0.8), "MV Sans");
    type(ctx, "/ world model", x + 196, y + 40, 14, C.muted, "MV Mono");
    for (let i = 0; i < 3; i++) disc(ctx, x + piece.w - 34 - i * 16, y + 33, 3, ink(dim), 1);
  } else if (piece.key === "sidebar") {
    for (let i = 0; i < 4; i++) {
      const ry = y + 46 + i * 34;
      ctx.fillStyle = ink(dim * 0.5);
      ctx.fillRect(x + 14, ry, 10, 10);
      type(ctx, ["chat", "files", "code", "logs"][i], x + 34, ry + 10, 13, C.muted, "MV Mono");
    }
  } else if (piece.key === "thread") {
    // two empty message slots, drawn as dashed blocks
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = ink(dim * 0.6);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 20, y + 44, piece.w * 0.52, 54);
    ctx.strokeRect(x + piece.w * 0.3, y + 118, piece.w * 0.66, 54);
    ctx.restore();
  } else if (piece.key === "composer") {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = ink(dim * 0.6);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 20, y + 52, piece.w - 40, piece.h - 72);
    ctx.restore();
  }
}

function bootLayout(ctx, t, s) {
  ground(ctx, t, [WIN_CX, WIN_CY], true);

  // the window the last shot opened is already here, just dimmer
  layer(ctx, 0.55, () => {
    ctx.beginPath();
    ctx.roundRect(WIN.x, WIN.y, WIN.w, WIN.h, 26);
    ctx.fillStyle = "rgba(6,19,31,0.9)";
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });

  // a faint construction grid behind the pieces
  layer(ctx, at(t, s.at + 0.15, s.at + 0.9) * 0.5, () => {
    ctx.strokeStyle = "rgba(77,107,254,0.16)";
    ctx.lineWidth = 1;
    for (let gx = WIN.x + 24; gx <= WIN.x + WIN.w - 24; gx += 48) {
      ctx.beginPath();
      ctx.moveTo(gx, WIN.y + 24);
      ctx.lineTo(gx, WIN.y + WIN.h - 24);
      ctx.stroke();
    }
    for (let gy = WIN.y + 24; gy <= WIN.y + WIN.h - 24; gy += 48) {
      ctx.beginPath();
      ctx.moveTo(WIN.x + 24, gy);
      ctx.lineTo(WIN.x + WIN.w - 24, gy);
      ctx.stroke();
    }
  });

  const lock = at(t, s.at + 2.30, s.at + 2.80);

  PIECES.forEach((p, i) => {
    const start = s.at + 0.30 + i * 0.40;
    const k = at(t, start, start + 0.55);
    if (k <= 0) return;
    const e = 1 - (1 - k) ** 3;
    // slight overshoot on landing keeps the assembly from feeling mechanical
    const overshoot = Math.sin(Math.PI * Math.min(1, k)) * 0.04;
    const px = p.x + p.dx * (1 - e) * -1 - p.dx * overshoot;
    const py = p.y + p.dy * (1 - e) * -1 - p.dy * overshoot;

    layer(ctx, Math.min(1, k * 1.6), () => {
      ctx.beginPath();
      ctx.roundRect(px, py, p.w, p.h, 12);
      ctx.fillStyle = "rgba(11,36,51,0.92)";
      ctx.fill();
      ctx.strokeStyle = lock > 0 ? mix(C.edge, BRAND_SOFT, lock) : C.edge;
      ctx.lineWidth = lock > 0 ? 1.4 + 0.9 * lock : 1.4;
      ctx.stroke();
      type(ctx, p.key, px + 16, py + 26, 14, lock > 0 ? "#9fb4d8" : C.muted, "MV Mono");
      skeleton(ctx, p, px, py, lock);
    });
  });

  // the composer gets its placeholder last, so "empty" reads as intentional
  const ph = at(t, s.at + 1.95, s.at + 2.35);
  if (ph > 0) {
    const c = PIECES[3];
    layer(ctx, ph, () => {
      type(ctx, "发消息，/ 调用指令", c.x + 30, c.y + 96, 18, "#43607d", "MV Sans");
      if (ph >= 1) chatCaret(ctx, c.x + 262, c.y + 90, 20, t, { on: true, color: BRAND_SOFT });
    });
  }

  // lock flash + label
  if (lock > 0) {
    const fade = at(t, s.at + 2.80, s.at + 3.40);
    layer(ctx, lock * (1 - fade * 0.7), () =>
      spacedCentred(ctx, "LAYOUT LOCKED", WIN_CX, WIN.y + WIN.h - 22, 15, BRAND_SOFT, "MV Mono", 0.36),
    );
  }

  return { phase: "layout", pieces: PIECES.length };
}

// ---------------------------------------------------------------------------
// boot-params — 7.695–11.387. The persona card fills field by field; the last
// field, love, is never filled. Then the client initialises.
// ---------------------------------------------------------------------------
const FIELDS = Object.freeze([
  ["name", "deepseek"],
  ["role", "world model"],
  ["context", "211.96 s"],
  ["signal", "bidirectional"],
]);

function bootParams(ctx, t, s) {
  ground(ctx, t, [1180, 480], true);
  figure(ctx, t, "lowlight", 1480, 520, 720, { alpha: 0.92 });

  const R = { x: 190, y: 158, w: 1000, h: 742 };
  const readyAt = s.at + 3.30;
  const win = chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ world model",
    session: "SESSION 000",
    state: t < readyAt ? "busy" : "online",
    stateLabel: t < readyAt ? "configuring" : "online",
    sidebar: false,
    headerH: 96,
    enterAt: s.at + 0.06,
    enterDur: 0.5,
    footer: true,
    footerLabel: "PARAMETERS",
    clock: "00:00",
  });
  const cx = R.x + 36;
  const cw = R.w - 72;
  const cardTop = R.y + 140;

  FIELDS.forEach(([key, value], i) => {
    const start = s.at + 0.46 + i * 0.55;
    const k = at(t, start, start + 0.34);
    if (k <= 0) return;
    const y = cardTop + i * 74;
    layer(ctx, k, () => {
      rect(ctx, cx, y, cw, 58, "#0d1c2c", 10, TOKENS.border1);
      type(ctx, key, cx + 20, y + 37, 17, TOKENS.labelTertiary, "MV Mono");
      if (k > 0.5) {
        const shown = typewriter(value, t, start + 0.12, 9);
        type(ctx, shown, cx + 200, y + 37, 20, TOKENS.labelPrimary, "MV Mono");
        if (shown.length < value.length)
          chatCaret(ctx, cx + 204 + shown.length * 12, y + 44, 20, t, { color: TOKENS.accent });
      }
    });
  });

  // The fifth field exists but is never filled: the prompt says the persona
  // card has one field that stays undefined, and that gap is the shot's point.
  const loveAt = s.at + 2.86;
  const loveK = at(t, loveAt, loveAt + 0.34);
  if (loveK > 0) {
    const y = cardTop + FIELDS.length * 74;
    layer(ctx, loveK, () => {
      rect(ctx, cx, y, cw, 58, "#0b1826", 10, "#22405a");
      type(ctx, "love", cx + 20, y + 37, 17, "#6f8aa8", "MV Mono");
      // no value ever arrives -- just a caret, waiting
      chatCaret(ctx, cx + 200, y + 44, 20, t, { on: true, color: "#4a6a8c" });
      type(ctx, "undefined", cx + cw - 30, y + 37, 15, "#4a6a8c", "MV Mono", "right");
    });
  }

  // init
  const done = at(t, readyAt, readyAt + 0.5);
  if (done > 0) {
    layer(ctx, done, () => {
      disc(ctx, R.x + R.w - 74, R.y + 62, 26, C.hot, 0.16, false, 2);
      type(ctx, "ready", R.x + R.w - 130, R.y + 68, 16, C.hot, "MV Sans");
    });
  }

  return { phase: "params", ready: t >= readyAt, fields: FIELDS.length, contentX: win?.contentX ?? null };
}

// ---------------------------------------------------------------------------
// boot-world — 11.387–15.080. A whole client with an empty conversation, and
// the figure waiting behind the glass. Everything is ready; nothing is lit.
// ---------------------------------------------------------------------------
function bootWorld(ctx, t, s) {
  ground(ctx, t, [1180, 470], true);

  // the figure behind the glass, barely there
  figure(ctx, t, "silhouette", 1520, 560, 560, { alpha: 0.18 });

  const R = { x: 250, y: 170, w: 1300, h: 720 };
  const inK = at(t, s.at + 0.05, s.at + 0.7);
  layer(ctx, 0.75 * inK, () => {
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.fillStyle = "rgba(7,23,34,0.92)";
    ctx.fill();
    ctx.strokeStyle = "#1f3f52";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // header
    type(ctx, "deepseek", R.x + 28, R.y + 44, 20, "#7f93ff", "MV Sans");
    type(ctx, "/ world model", R.x + 132, R.y + 44, 16, "#43607d", "MV Mono");
    type(ctx, "SESSION 001", R.x + R.w - 28, R.y + 44, 15, "#43607d", "MV Mono", "right");
    stroke(ctx, [[R.x + 1, R.y + 66], [R.x + R.w - 1, R.y + 66]], "#1f3f52", 1.2);

    // empty thread: a place where two of them will meet
    const midY = R.y + R.h / 2 - 40;
    type(ctx, "new conversation", R.x + R.w / 2, midY, 26, "#43607d", "MV Sans", "center");
    stroke(ctx, [[R.x + R.w / 2 - 90, midY + 22], [R.x + R.w / 2 + 90, midY + 22]], "#26455c", 1.2);
    type(ctx, "nothing has been said yet", R.x + R.w / 2, midY + 58, 15, "#33526a", "MV Mono", "center");

    // composer, with the only lit thing on screen
    const cy2 = R.y + R.h - 132;
    rect(ctx, R.x + 28, cy2, R.w - 56, 92, "#0b2433", 12, "#24495b");
    type(ctx, "发消息，/ 调用指令", R.x + 56, cy2 + 52, 19, "#3b5a74", "MV Sans");
  });

  // the caret blinks on song time, so the frame stays reproducible
  const caretOn = at(t, s.at + 0.7, s.at + 0.9);
  if (caretOn > 0) {
    const bobY = 0;
    layer(ctx, caretOn * 0.9, () => {
      chatCaret(ctx, R.x + 300, R.y + R.h - 132 + 40 + bobY, 22, t, { on: true, color: BRAND_SOFT, width: 2 });
      // the far port is hollow: nothing has come back
      const px = R.x + R.w - 92;
      const py = R.y + R.h - 86;
      disc(ctx, px, py, 13, BRAND_SOFT, 0.5, false, 1.4);
      halo(ctx, px, py, 44, 0.16, BRAND);
    });
  }

  return { phase: "world", empty: true };
}

export const BOOT_RENDER = Object.freeze({
  "boot-power": bootPower,
  "boot-layout": bootLayout,
  "boot-params": bootParams,
  "boot-world": bootWorld,
});

/** Shots whose pictures exist. Everything else renders as an explicit marker. */
export const IMPLEMENTED = Object.freeze(Object.keys(BOOT_RENDER));
