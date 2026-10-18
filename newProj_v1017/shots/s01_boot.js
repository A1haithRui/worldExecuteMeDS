// Section 1 启动 — song time [0, 15.08). Four shots, mirroring the reference's
// boot section slot for slot:
//
//   boot-power   0.000– 4.004  a hairline opens into the window, the mark lights
//   boot-layout  4.004– 7.695  header / sidebar / thread / composer assemble
//   boot-params  7.695–11.387  the persona card fills in; love stays undefined
//   boot-world  11.387–15.080  a whole client, empty, with the mark in front
//
// Naming, settled with the director: the product line reads "deepseek / harness"
// (we are booting dsh, not a generic "world model"), the persona card's role is
// "assistant" (the role it plays in the conversation, and not a second name for
// the product), and the boot line is a terminal prompt -- "power" alone read as
// PowerShell to a viewer, which is not what the frame means.
//
// Everything here is a pure function of song time: no cross-frame state, no
// random, no clock. That is what lets the exporter render any frame in any
// order and still get identical pixels.
import { C, mix, at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { drawWhale } from "../src/assets/whale.js";
import { TOKENS, chatWindow, caret as chatCaret } from "../src/engine/chat.js";
import { idle as portraitIdle } from "../src/engine/portrait.js";
import { typewriter } from "../src/engine/type.js";
import { loadImages } from "../src/mv-draw.js";

const { images } = loadImages({
  lowlight: "/assets/character/v4/deepseek_bust_v4_lowlight.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  bust: "/assets/character/deepseek_bust_v3.png",
});

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const PRODUCT = "deepseek";
const SUBSYSTEM = "/ harness";

// The window the first two shots share, so the frame that opens in boot-power is
// the same frame the interface is assembled into. Sized to fill the frame the
// way the reference does: the lyric caption owns the bottom-left, so the window
// stops just above it and takes the width instead.
const WIN = Object.freeze({ x: 200, y: 120, w: 1520, h: 748 });
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

/** `deepseek / harness` lockup with the mark; x is the left edge, y the baseline. */
function lockup(ctx, x, y, size, markW, color, subColor, markAlpha = 1) {
  drawWhale(ctx, x + markW / 2, y - size * 0.34, markW, { strokeK: 1, fillK: 1, color: BRAND, alpha: markAlpha });
  type(ctx, PRODUCT, x + markW + size * 0.62, y, size, color, "MV Sans");
  ctx.font = `400 ${size}px "MV Sans"`;
  const tw = ctx.measureText(PRODUCT).width;
  type(ctx, SUBSYSTEM, x + markW + size * 0.62 + tw + size * 0.6, y, size * 0.72, subColor, "MV Mono");
  return markW + size * 0.62 + tw + size * 0.6 + ctx.measureText(SUBSYSTEM).width;
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
      drawWhale(ctx, WIN_CX, WIN_CY - 56, 300, {
        strokeK: markIn,
        fillK: fillIn,
        color: BRAND,
        lineWidth: 2.4,
        alpha: 0.35 + 0.65 * openY,
      });
      halo(ctx, WIN_CX, WIN_CY - 56, 360, 0.10 * fillIn, BRAND);
    }

    // 4. wordmark: the product name, then what it is running on
    if (wordIn > 0) {
      layer(ctx, wordIn, () =>
        spacedCentred(ctx, "DeepSeek", WIN_CX, WIN_CY + 158, 46, "#e8eeff", "MV Sans", 0.24),
      );
      layer(ctx, wordIn * 0.7, () =>
        spacedCentred(ctx, "HARNESS", WIN_CX, WIN_CY + 204, 17, "#6b86a8", "MV Mono", 0.34),
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

    // 7. the boot line: a terminal prompt, so the frame says "a shell is up"
    if (status > 0) {
      const cmd = "dsh --boot";
      const shown = typewriter(cmd, t, s.at + 3.30, 22);
      layer(ctx, 1, () => {
        ctx.font = `400 18px "MV Mono"`;
        const promptW = ctx.measureText("❯ ").width;
        type(ctx, "❯", x + 34, y + h - 44, 19, BRAND_SOFT, "MV Mono");
        type(ctx, shown, x + 34 + promptW + 4, y + h - 44, 19, "#9fb4d8", "MV Mono");
        if (shown.length < cmd.length)
          chatCaret(ctx, x + 38 + promptW + shown.length * 11.4, y + h - 40, 17, t, { on: true, color: BRAND_SOFT });
        // terminal status: grey until the sweep has passed
        const on = sweep >= 1;
        disc(ctx, x + w - 40, y + h - 50, 5, on ? BRAND_SOFT : "#3a4a63", 1);
        if (on) halo(ctx, x + w - 40, y + h - 50, 26, 0.35, BRAND);
      });
      layer(ctx, at(t, s.at + 3.62, s.at + 3.95), () =>
        // right-aligned so it stops short of the status dot instead of running
        // underneath it
        type(ctx, "terminal ready", x + w - 66, y + h - 44, 16, "#6b86a8", "MV Mono", "right"),
      );
    }
  }

  return { phase: "power", u, markIn, fillIn };
}

// ---------------------------------------------------------------------------
// boot-layout — 4.004–7.695. Header, sidebar, thread and composer fly into the
// window that the previous shot opened, then the layout locks.
// ---------------------------------------------------------------------------
// Piece geometry scales with the window: a bigger frame needs a taller header, a
// wider sidebar and a deeper composer, or it just looks like the old one with
// more empty space inside.
const PAD = 30;
const HEADER_H = 80;
const SIDEBAR_W = 210;
const COMPOSER_H = 136;
const PIECES = Object.freeze([
  { key: "header", x: WIN.x + PAD, y: WIN.y + PAD, w: WIN.w - PAD * 2, h: HEADER_H, dx: 0, dy: -90 },
  {
    key: "sidebar", x: WIN.x + PAD, y: WIN.y + PAD + HEADER_H + 16,
    w: SIDEBAR_W, h: WIN.h - PAD * 2 - HEADER_H - 16, dx: -180, dy: 0,
  },
  {
    key: "thread", x: WIN.x + PAD + SIDEBAR_W + 18, y: WIN.y + PAD + HEADER_H + 16,
    w: WIN.w - PAD * 2 - SIDEBAR_W - 18, h: WIN.h - PAD * 2 - HEADER_H - COMPOSER_H - 40, dx: 0, dy: 150,
  },
  {
    key: "composer", x: WIN.x + PAD + SIDEBAR_W + 18, y: WIN.y + WIN.h - PAD - COMPOSER_H,
    w: WIN.w - PAD * 2 - SIDEBAR_W - 18, h: COMPOSER_H, dx: 0, dy: 190,
  },
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
    // No "header" key label here: the lockup is the header's content, and a label
    // at the same baseline ran straight through the mark.
    lockup(ctx, x + 24, y + 50, 21, 32, ink(0.85), C.muted, 0.9);
    for (let i = 0; i < 3; i++) disc(ctx, x + piece.w - 40 - i * 18, y + 40, 3.4, ink(dim), 1);
  } else if (piece.key === "sidebar") {
    for (let i = 0; i < 5; i++) {
      const ry = y + 58 + i * 44;
      ctx.fillStyle = ink(dim * 0.5);
      ctx.fillRect(x + 18, ry, 11, 11);
      type(ctx, ["chat", "files", "code", "logs", "models"][i], x + 40, ry + 11, 14, C.muted, "MV Mono");
    }
  } else if (piece.key === "thread") {
    // Placeholder messages, not dashed frames. A thread reads as alternating
    // blocks -- assistant on the left, you on the right -- and solid blocks say
    // "this is where words go" without looking like a wireframe nobody filled
    // in. No text: the words come in the next shot, not here.
    const bh = 56;
    const gap = 22;
    const rows = [
      { w: 0.54, side: "left" },
      { w: 0.40, side: "right" },
      { w: 0.48, side: "left" },
      { w: 0.33, side: "right" },
      { w: 0.44, side: "left" },
    ];
    rows.forEach((r, i) => {
      const bw = piece.w * r.w;
      const by = y + 62 + i * (bh + gap);
      if (by + bh > y + piece.h - 24) return;
      const bx = r.side === "left" ? x + 28 : x + piece.w - 28 - bw;
      const assistant = r.side === "left";
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 14);
      ctx.fillStyle = assistant ? "rgba(18,50,78,0.62)" : "rgba(26,40,54,0.62)";
      ctx.fill();
      ctx.strokeStyle = assistant ? "rgba(77,107,254,0.28)" : "rgba(120,150,175,0.16)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // two short rules inside each block, so it reads as text at a glance
      const inx = bx + 20;
      const line1 = assistant ? "rgba(127,147,255,0.30)" : "rgba(150,175,195,0.24)";
      const line2 = assistant ? "rgba(127,147,255,0.22)" : "rgba(150,175,195,0.18)";
      stroke(ctx, [[inx, by + bh / 2 - 7], [inx + bw * 0.52, by + bh / 2 - 7]], line1, 3);
      stroke(ctx, [[inx, by + bh / 2 + 10], [inx + bw * 0.34, by + bh / 2 + 10]], line2, 3);
    });
  } else if (piece.key === "composer") {
    // A solid input field rather than a dashed frame: dashed reads as "to be
    // built", and by this point the field exists.
    ctx.beginPath();
    ctx.roundRect(x + 24, y + 50, piece.w - 48, piece.h - 84, 12);
    ctx.fillStyle = "rgba(9,26,38,0.85)";
    ctx.fill();
    ctx.strokeStyle = "rgba(38,74,96,0.85)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
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
      // The header piece carries its own lockup instead of a key label.
      if (p.key !== "header") type(ctx, p.key, px + 20, py + 32, 15, lock > 0 ? "#9fb4d8" : C.muted, "MV Mono");
      skeleton(ctx, p, px, py, lock);
    });
  });

  // the composer gets its placeholder last, so "empty" reads as intentional.
  // It sits on the centre line of its field, not above it.
  const ph = at(t, s.at + 1.95, s.at + 2.35);
  if (ph > 0) {
    const c = PIECES[3];
    const fieldY = c.y + 50;
    const fieldH = c.h - 84;
    const baseY = fieldY + fieldH / 2 + 7;
    const label = "发消息，/ 调用指令";
    layer(ctx, ph, () => {
      type(ctx, label, c.x + 48, baseY, 19, "#43607d", "MV Sans");
      if (ph >= 1) {
        ctx.font = `400 20px "MV Sans"`;
        const tw = ctx.measureText(label).width;
        chatCaret(ctx, c.x + 48 + tw + 12, baseY - 7, 21, t, { on: true, color: BRAND_SOFT });
      }
    });
  }

  // lock label: above the window, clear of both the frame edge and the lyric
  // caption, which occupies the bottom of the frame
  if (lock > 0) {
    const fade = at(t, s.at + 2.80, s.at + 3.40);
    layer(ctx, lock * (1 - fade * 0.7), () => {
      spacedCentred(ctx, "LAYOUT LOCKED", WIN_CX, WIN.y - 24, 15, BRAND_SOFT, "MV Mono", 0.36);
      const half = 92;
      stroke(ctx, [[WIN_CX - half, WIN.y - 12], [WIN_CX + half, WIN.y - 12]], BRAND_SOFT, 1);
    });
  }

  return { phase: "layout", pieces: PIECES.length };
}

// ---------------------------------------------------------------------------
// boot-params — 7.695–11.387. The persona card fills field by field; the last
// field, love, is never filled. Then the client initialises and holds.
// ---------------------------------------------------------------------------
const FIELDS = Object.freeze([
  ["name", "deepseek"],
  ["role", "assistant"],
  ["context", "211.96 s"],
  ["signal", "bidirectional"],
]);

// Field fill times, all relative to the shot start. They are front-loaded so the
// finished card can hold for over a second before the cut: previously the last
// field landed 0.3 s before the edit, which read as "it flashed past".
const T = Object.freeze({ f0: 0.30, step: 0.36, love: 2.02, ready: 2.34 });

function bootParams(ctx, t, s) {
  ground(ctx, t, [1180, 480], true);
  figure(ctx, t, "lowlight", 1480, 520, 720, { alpha: 0.92 });

  // Height keeps the footer clear of the lyric caption, which is drawn at y=940
  // and is ~82px tall when the line is emphasised.
  const R = { x: 150, y: 110, w: 1120, h: 740 };
  const readyAt = s.at + T.ready;
  const win = chatWindow(ctx, R, t, {
    title: PRODUCT,
    subtitle: SUBSYSTEM,
    session: "SESSION 000",
    state: t < readyAt ? "busy" : "online",
    stateLabel: t < readyAt ? "configuring" : "online",
    sidebar: false,
    headerH: 100,
    enterAt: s.at + 0.06,
    enterDur: 0.5,
    footer: true,
    footerLabel: "PARAMETERS",
    clock: "00:00",
  });
  const cx = R.x + 40;
  const cw = R.w - 80;
  const cardTop = R.y + 150;

  // The mark as a watermark behind the fields: the card belongs to this product.
  layer(ctx, 0.06, () =>
    drawWhale(ctx, cx + cw / 2, cardTop + 190, 340, { strokeK: 1, fillK: 1, color: BRAND }),
  );

  FIELDS.forEach(([key, value], i) => {
    const start = s.at + T.f0 + i * T.step;
    const k = at(t, start, start + 0.28);
    if (k <= 0) return;
    const y = cardTop + i * 80;
    layer(ctx, k, () => {
      rect(ctx, cx, y, cw, 62, "#0d1c2c", 10, TOKENS.border1);
      type(ctx, key, cx + 22, y + 40, 18, TOKENS.labelTertiary, "MV Mono");
      if (k > 0.5) {
        const shown = typewriter(value, t, start + 0.08, 22);
        type(ctx, shown, cx + 220, y + 40, 21, TOKENS.labelPrimary, "MV Mono");
        if (shown.length < value.length)
          chatCaret(ctx, cx + 224 + shown.length * 12.6, y + 47, 21, t, { color: TOKENS.accent });
      }
    });
  });

  // The fifth field exists but is never filled: the prompt says the persona card
  // has one field that stays undefined, and that gap is the shot's point.
  const loveAt = s.at + T.love;
  const loveK = at(t, loveAt, loveAt + 0.30);
  if (loveK > 0) {
    const y = cardTop + FIELDS.length * 80;
    layer(ctx, loveK, () => {
      rect(ctx, cx, y, cw, 62, "#0b1826", 10, "#22405a");
      type(ctx, "love", cx + 22, y + 40, 18, "#6f8aa8", "MV Mono");
      // no value ever arrives -- just a caret, waiting
      chatCaret(ctx, cx + 220, y + 47, 21, t, { on: true, color: "#4a6a8c" });
      type(ctx, "undefined", cx + cw - 32, y + 40, 16, "#4a6a8c", "MV Mono", "right");
    });
  }

  // init: the window's own state chip flips to online, and one thin highlight
  // runs down the card to say "committed". No extra label -- the chip and its dot
  // already sit in the header, and a second "ready" there collided with them.
  const done = at(t, readyAt, readyAt + 0.45);
  if (done > 0) {
    const sweepK = at(t, readyAt, readyAt + 0.9);
    layer(ctx, done, () => {
      const sy = cardTop - 20 + (R.h - 120) * (1 - sweepK);
      const g = ctx.createLinearGradient(0, sy - 60, 0, sy + 60);
      g.addColorStop(0, "rgba(131,233,230,0)");
      g.addColorStop(0.5, "rgba(131,233,230,0.07)");
      g.addColorStop(1, "rgba(131,233,230,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx, sy - 60, cw, 120);
      // a settled hairline under the last field
      stroke(ctx, [[cx, cardTop + (FIELDS.length + 1) * 80 + 16], [cx + cw, cardTop + (FIELDS.length + 1) * 80 + 16]], "rgba(131,233,230,0.35)", 1.2);
    });
  }

  return { phase: "params", ready: t >= readyAt, fields: FIELDS.length, contentX: win?.contentX ?? null };
}

// ---------------------------------------------------------------------------
// boot-world — 11.387–15.080. Reworked against the reference's SIMULATION shot:
// a whole client with its sidebar of past conversations, the mark in front, and
// the figure dim behind the glass. Nothing has been said yet.
// ---------------------------------------------------------------------------
const RECENTS = Object.freeze([
  "sine wave, explained",
  "where do you sleep between messages",
  "the message I deleted",
  "is a whale a machine",
  "how many worlds at once",
  "why can't I sleep",
]);

// The shot's motion: the lyric that is on screen is typed into the composer.
// 20 characters at 22 cps takes 0.9 s, so it lands about when that same lyric
// line finishes on screen -- the box and the caption read as one gesture.
const TYPED_LINE = "Set up our new world";
const TYPING = 0.6;
const TYPING_CPS = 22;

function bootWorld(ctx, t, s) {
  ground(ctx, t, [1180, 470], true);

  // The figure behind the glass: large enough to fill the right of the frame and
  // bleed past the edges, the way the reference frames it, and bright enough to
  // be unmistakably a person -- dim, but not a smudge.
  figure(ctx, t, "silhouette", 1700, 560, 1320, { alpha: 0.48 });

  // Height leaves the lyric caption clear: captions are drawn at y=940 and an
  // emphasised line is ~82px, so the window's foot has to stop above ~870.
  const R = { x: 150, y: 105, w: 1500, h: 750 };
  const inK = at(t, s.at + 0.05, s.at + 0.65);
  const SIDE = 340;

  layer(ctx, 0.86 * inK, () => {
    // shell
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.fillStyle = "rgba(7,23,34,0.94)";
    ctx.fill();
    ctx.strokeStyle = "#1f3f52";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // ---- sidebar: who this window belongs to, and what has been said before
    ctx.fillStyle = "rgba(5,17,26,0.9)";
    ctx.fillRect(R.x, R.y, SIDE, R.h);
    stroke(ctx, [[R.x + SIDE, R.y], [R.x + SIDE, R.y + R.h]], "#1f3f52", 1.2);
    lockup(ctx, R.x + 26, R.y + 54, 22, 34, "#dfe6ef", "#43607d", 0.95);

    // new chat
    const nb = { x: R.x + 20, y: R.y + 88, w: SIDE - 40, h: 50 };
    rect(ctx, nb.x, nb.y, nb.w, nb.h, "#0f2434", 8, "#274b60");
    type(ctx, "+", nb.x + 18, nb.y + 33, 19, BRAND_SOFT, "MV Sans");
    type(ctx, "New chat", nb.x + 44, nb.y + 33, 17, "#9fb4d8", "MV Sans");

    type(ctx, "Recents", R.x + 28, nb.y + nb.h + 38, 13, "#3d5f76", "MV Mono");
    RECENTS.forEach((title, i) => {
      const ry = nb.y + nb.h + 60 + i * 38;
      // one of them is this session's slot, still empty
      const active = i === 0;
      if (active) rect(ctx, R.x + 14, ry - 17, SIDE - 28, 34, "rgba(77,107,254,0.10)", 6);
      type(ctx, title, R.x + 28, ry, 14.5, active ? "#a9bde0" : "#4a6b83", "MV Sans");
    });

    // who is waiting at the bottom
    stroke(ctx, [[R.x, R.y + R.h - 60], [R.x + SIDE, R.y + R.h - 60]], "#1f3f52", 1.2);
    disc(ctx, R.x + 34, R.y + R.h - 30, 10, "#2a4459", 1);
    type(ctx, "you", R.x + 52, R.y + R.h - 25, 15, "#5b7590", "MV Sans");
    disc(ctx, R.x + SIDE - 100, R.y + R.h - 30, 4, "#3d5f76", 1);
    type(ctx, "silent", R.x + SIDE - 86, R.y + R.h - 25, 13, "#3d5f76", "MV Mono");

    // ---- main: the empty conversation
    const mx = R.x + SIDE;
    const mw = R.w - SIDE;
    type(ctx, "New chat", mx + 40, R.y + 58, 22, "#dfe6ef", "MV Sans");
    // the ready chip, top right
    rect(ctx, R.x + R.w - 196, R.y + 34, 162, 34, "rgba(77,107,254,0.10)", 17, "#2b4a6b");
    disc(ctx, R.x + R.w - 176, R.y + 51, 4.5, BRAND_SOFT, 1);
    type(ctx, "harness · ready", R.x + R.w - 162, R.y + 57, 14, "#9fb4d8", "MV Mono");
    stroke(ctx, [[mx, R.y + 84], [R.x + R.w, R.y + 84]], "#1f3f52", 1.2);

    // the mark in front: this is the thing you are talking to
    const markY = R.y + R.h / 2 - 46;
    drawWhale(ctx, mx + mw / 2, markY, 220, {
      strokeK: 1, fillK: 1, color: BRAND, alpha: 0.42 + 0.1 * at(t, s.at + 1.2, s.at + 3.2),
    });
    halo(ctx, mx + mw / 2, markY, 300, 0.10, BRAND);

    // The hint fades as the box starts filling: the room stops being empty the
    // moment someone types into it.
    const said = typewriter(TYPED_LINE, t, s.at + TYPING, TYPING_CPS);
    const fill = said.length / TYPED_LINE.length;
    layer(ctx, 1 - fill, () =>
      type(ctx, "nothing has been said yet", mx + mw / 2, markY + 132, 14, "#3d5f76", "MV Mono", "center"),
    );

    // composer: the shot's only motion. The lyric that is on screen is also
    // being written into the box, one character at a time.
    const cb = { x: mx + 40, y: R.y + R.h - 144, w: mw - 80, h: 104 };
    rect(ctx, cb.x, cb.y, cb.w, cb.h, "#0b2433", 12, "#24495b");
    const baseY = cb.y + cb.h / 2 + 6;
    if (said.length === 0) {
      type(ctx, "发消息，/ 调用指令", cb.x + 30, baseY, 19, "#3b5a74", "MV Sans");
    } else {
      type(ctx, said, cb.x + 30, baseY, 20, "#cfd9ea", "MV Sans");
      ctx.font = `400 20px "MV Sans"`;
      chatCaret(ctx, cb.x + 32 + ctx.measureText(said).width, cb.y + cb.h / 2, 23, t, {
        on: true, color: BRAND_SOFT, width: 2,
      });
    }
    // the send affordance wakes up once there is something to send
    const armed = at(t, s.at + TYPING + 0.1, s.at + TYPING + 0.6) * (said.length > 0 ? 1 : 0);
    const send = { x: cb.x + cb.w - 58, y: cb.y + cb.h / 2 };
    disc(ctx, send.x, send.y, 19, BRAND_SOFT, 0.5 + 0.45 * armed, false, 1.4 + armed * 0.8);
    halo(ctx, send.x, send.y, 58, 0.18 + 0.22 * armed, BRAND);
  });

  return { phase: "world", empty: true, recents: RECENTS.length };
}

export const BOOT_RENDER = Object.freeze({
  "boot-power": bootPower,
  "boot-layout": bootLayout,
  "boot-params": bootParams,
  "boot-world": bootWorld,
});

/** Shots whose pictures exist. Everything else renders as an explicit marker. */
export const IMPLEMENTED = Object.freeze(Object.keys(BOOT_RENDER));
