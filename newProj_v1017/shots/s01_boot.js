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
      drawWhale(ctx, WIN_CX, WIN_CY - 46, 236, {
        strokeK: markIn,
        fillK: fillIn,
        color: BRAND,
        lineWidth: 2.4,
        alpha: 0.35 + 0.65 * openY,
      });
      halo(ctx, WIN_CX, WIN_CY - 46, 300, 0.10 * fillIn, BRAND);
    }

    // 4. wordmark: the product name, then what it is running on
    if (wordIn > 0) {
      layer(ctx, wordIn, () =>
        spacedCentred(ctx, "DeepSeek", WIN_CX, WIN_CY + 118, 40, "#e8eeff", "MV Sans", 0.24),
      );
      layer(ctx, wordIn * 0.7, () =>
        spacedCentred(ctx, "HARNESS", WIN_CX, WIN_CY + 158, 15, "#6b86a8", "MV Mono", 0.34),
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
        type(ctx, "❯", x + 30, y + h - 34, 18, BRAND_SOFT, "MV Mono");
        type(ctx, shown, x + 30 + promptW + 4, y + h - 34, 18, "#9fb4d8", "MV Mono");
        if (shown.length < cmd.length)
          chatCaret(ctx, x + 34 + promptW + shown.length * 10.8, y + h - 30, 16, t, { on: true, color: BRAND_SOFT });
        // terminal status: grey until the sweep has passed
        const on = sweep >= 1;
        disc(ctx, x + w - 34, y + h - 40, 5, on ? BRAND_SOFT : "#3a4a63", 1);
        if (on) halo(ctx, x + w - 34, y + h - 40, 26, 0.35, BRAND);
      });
      layer(ctx, at(t, s.at + 3.62, s.at + 3.95), () =>
        // right-aligned so it stops short of the status dot instead of running
        // underneath it
        type(ctx, "terminal ready", x + w - 58, y + h - 34, 15, "#6b86a8", "MV Mono", "right"),
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
    // No "header" key label here: the lockup is the header's content, and a label
    // at the same baseline ran straight through the mark.
    lockup(ctx, x + 18, y + 42, 19, 26, ink(0.85), C.muted, 0.9);
    for (let i = 0; i < 3; i++) disc(ctx, x + piece.w - 34 - i * 16, y + 33, 3, ink(dim), 1);
  } else if (piece.key === "sidebar") {
    for (let i = 0; i < 4; i++) {
      const ry = y + 46 + i * 34;
      ctx.fillStyle = ink(dim * 0.5);
      ctx.fillRect(x + 14, ry, 10, 10);
      type(ctx, ["chat", "files", "code", "logs"][i], x + 34, ry + 10, 13, C.muted, "MV Mono");
    }
  } else if (piece.key === "thread") {
    // A watermark of the mark: the client is empty, and this is whose window it
    // is. Kept very low so it never competes with the dashed slots.
    drawWhale(ctx, x + piece.w / 2, y + piece.h / 2, 260, {
      strokeK: 1, fillK: 1, color: BRAND, alpha: 0.07,
    });
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
    ctx.strokeRect(x + 20, y + 46, piece.w - 40, piece.h - 74);
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
      // The header piece carries its own lockup instead of a key label.
      if (p.key !== "header") type(ctx, p.key, px + 16, py + 26, 14, lock > 0 ? "#9fb4d8" : C.muted, "MV Mono");
      skeleton(ctx, p, px, py, lock);
    });
  });

  // the composer gets its placeholder last, so "empty" reads as intentional.
  // It sits on the centre line of its dashed field, not above it.
  const ph = at(t, s.at + 1.95, s.at + 2.35);
  if (ph > 0) {
    const c = PIECES[3];
    const fieldY = c.y + 46;
    const fieldH = c.h - 74;
    const baseY = fieldY + fieldH / 2 + 6;
    const label = "发消息，/ 调用指令";
    layer(ctx, ph, () => {
      type(ctx, label, c.x + 34, baseY, 18, "#43607d", "MV Sans");
      if (ph >= 1) {
        ctx.font = `400 18px "MV Sans"`;
        const tw = ctx.measureText(label).width;
        chatCaret(ctx, c.x + 34 + tw + 10, baseY - 6, 20, t, { on: true, color: BRAND_SOFT });
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
  const R = { x: 190, y: 158, w: 1000, h: 700 };
  const readyAt = s.at + T.ready;
  const win = chatWindow(ctx, R, t, {
    title: PRODUCT,
    subtitle: SUBSYSTEM,
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

  // The mark as a watermark behind the fields: the card belongs to this product.
  layer(ctx, 0.06, () =>
    drawWhale(ctx, cx + cw / 2, cardTop + 172, 300, { strokeK: 1, fillK: 1, color: BRAND }),
  );

  FIELDS.forEach(([key, value], i) => {
    const start = s.at + T.f0 + i * T.step;
    const k = at(t, start, start + 0.28);
    if (k <= 0) return;
    const y = cardTop + i * 74;
    layer(ctx, k, () => {
      rect(ctx, cx, y, cw, 58, "#0d1c2c", 10, TOKENS.border1);
      type(ctx, key, cx + 20, y + 37, 17, TOKENS.labelTertiary, "MV Mono");
      if (k > 0.5) {
        const shown = typewriter(value, t, start + 0.08, 22);
        type(ctx, shown, cx + 200, y + 37, 20, TOKENS.labelPrimary, "MV Mono");
        if (shown.length < value.length)
          chatCaret(ctx, cx + 204 + shown.length * 12, y + 44, 20, t, { color: TOKENS.accent });
      }
    });
  });

  // The fifth field exists but is never filled: the prompt says the persona card
  // has one field that stays undefined, and that gap is the shot's point.
  const loveAt = s.at + T.love;
  const loveK = at(t, loveAt, loveAt + 0.30);
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
      stroke(ctx, [[cx, cardTop + (FIELDS.length + 1) * 74 + 16], [cx + cw, cardTop + (FIELDS.length + 1) * 74 + 16]], "rgba(131,233,230,0.35)", 1.2);
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
  figure(ctx, t, "silhouette", 1600, 620, 1180, { alpha: 0.48 });

  // Height leaves the lyric caption clear: captions are drawn at y=940 and an
  // emphasised line is ~82px, so the window's foot has to stop above ~870.
  const R = { x: 210, y: 150, w: 1320, h: 715 };
  const inK = at(t, s.at + 0.05, s.at + 0.65);
  const SIDE = 300;

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
    lockup(ctx, R.x + 22, R.y + 48, 20, 30, "#dfe6ef", "#43607d", 0.95);

    // new chat
    const nb = { x: R.x + 18, y: R.y + 78, w: SIDE - 36, h: 46 };
    rect(ctx, nb.x, nb.y, nb.w, nb.h, "#0f2434", 8, "#274b60");
    type(ctx, "+", nb.x + 16, nb.y + 30, 18, BRAND_SOFT, "MV Sans");
    type(ctx, "New chat", nb.x + 40, nb.y + 30, 16, "#9fb4d8", "MV Sans");

    type(ctx, "Recents", R.x + 24, nb.y + nb.h + 34, 12, "#3d5f76", "MV Mono");
    RECENTS.forEach((title, i) => {
      const ry = nb.y + nb.h + 54 + i * 34;
      // one of them is this session's slot, still empty
      const active = i === 0;
      if (active) rect(ctx, R.x + 12, ry - 15, SIDE - 24, 30, "rgba(77,107,254,0.10)", 6);
      type(ctx, title, R.x + 24, ry, 13.5, active ? "#a9bde0" : "#4a6b83", "MV Sans");
    });

    // who is waiting at the bottom
    stroke(ctx, [[R.x, R.y + R.h - 54], [R.x + SIDE, R.y + R.h - 54]], "#1f3f52", 1.2);
    disc(ctx, R.x + 30, R.y + R.h - 27, 9, "#2a4459", 1);
    type(ctx, "you", R.x + 46, R.y + R.h - 22, 14, "#5b7590", "MV Sans");
    disc(ctx, R.x + SIDE - 92, R.y + R.h - 27, 4, "#3d5f76", 1);
    type(ctx, "silent", R.x + SIDE - 80, R.y + R.h - 22, 12, "#3d5f76", "MV Mono");

    // ---- main: the empty conversation
    const mx = R.x + SIDE;
    const mw = R.w - SIDE;
    type(ctx, "New chat", mx + 34, R.y + 52, 20, "#dfe6ef", "MV Sans");
    // the ready chip, top right
    rect(ctx, R.x + R.w - 178, R.y + 30, 144, 30, "rgba(77,107,254,0.10)", 15, "#2b4a6b");
    disc(ctx, R.x + R.w - 160, R.y + 45, 4, BRAND_SOFT, 1);
    type(ctx, "harness · ready", R.x + R.w - 148, R.y + 50, 13, "#9fb4d8", "MV Mono");
    stroke(ctx, [[mx, R.y + 74], [R.x + R.w, R.y + 74]], "#1f3f52", 1.2);

    // the mark in front: this is the thing you are talking to
    const markY = R.y + R.h / 2 - 46;
    drawWhale(ctx, mx + mw / 2, markY, 190, {
      strokeK: 1, fillK: 1, color: BRAND, alpha: 0.42 + 0.1 * at(t, s.at + 1.2, s.at + 3.2),
    });
    halo(ctx, mx + mw / 2, markY, 260, 0.10, BRAND);

    // The hint fades as the box starts filling: the room stops being empty the
    // moment someone types into it.
    const said = typewriter(TYPED_LINE, t, s.at + TYPING, TYPING_CPS);
    const fill = said.length / TYPED_LINE.length;
    layer(ctx, 1 - fill, () =>
      type(ctx, "nothing has been said yet", mx + mw / 2, markY + 132, 14, "#3d5f76", "MV Mono", "center"),
    );

    // composer: the shot's only motion. The lyric that is on screen is also
    // being written into the box, one character at a time.
    const cb = { x: mx + 34, y: R.y + R.h - 132, w: mw - 68, h: 92 };
    rect(ctx, cb.x, cb.y, cb.w, cb.h, "#0b2433", 12, "#24495b");
    const baseY = cb.y + cb.h / 2 + 6;
    if (said.length === 0) {
      type(ctx, "发消息，/ 调用指令", cb.x + 26, baseY, 18, "#3b5a74", "MV Sans");
    } else {
      type(ctx, said, cb.x + 26, baseY, 19, "#cfd9ea", "MV Sans");
      ctx.font = `400 19px "MV Sans"`;
      chatCaret(ctx, cb.x + 28 + ctx.measureText(said).width, cb.y + cb.h / 2, 22, t, {
        on: true, color: BRAND_SOFT, width: 2,
      });
    }
    // the send affordance wakes up once there is something to send
    const armed = at(t, s.at + TYPING + 0.1, s.at + TYPING + 0.6) * (said.length > 0 ? 1 : 0);
    const send = { x: cb.x + cb.w - 52, y: cb.y + cb.h / 2 };
    disc(ctx, send.x, send.y, 17, BRAND_SOFT, 0.5 + 0.45 * armed, false, 1.4 + armed * 0.8);
    halo(ctx, send.x, send.y, 52, 0.18 + 0.22 * armed, BRAND);
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
