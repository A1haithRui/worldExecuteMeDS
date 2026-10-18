// The DeepSeek client, drawn once and shared by every shot that shows it.
//
// Section 1 ends on this window and section 2 lives inside it, so two shots would
// otherwise each carry their own copy of the chrome and drift apart. Everything
// that varies between them is an option here: what the chip says, whether the
// presence dot is lit, what is in the composer, and how the send button reads.
import { C, at, layer, stroke, disc, rect, type, halo, mix } from "../src/mv-draw.js";
import { drawWhale } from "../src/assets/whale.js";
import { caret as chatCaret } from "../src/engine/chat.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";

/** Past conversations in the sidebar. Three of them are the film's own echoes. */
export const RECENTS = Object.freeze([
  "sine wave, explained",
  "where do you sleep between messages",
  "the message I deleted",
  "is a whale a machine",
  "how many worlds at once",
  "why can't I sleep",
]);

/** The full client's frame: about 86% of the picture. */
export const CLIENT_R = Object.freeze({ x: 120, y: 80, w: 1660, h: 910 });

/**
 * Draw the client shell and return its geometry, so a shot can place things
 * against it (the composer's centre, the mark's position) without recomputing.
 */
export function clientWindow(ctx, R, t, opts = {}) {
  const {
    sideW = 340,
    threadTitle = "New chat",
    chip = { text: "harness · ready", on: true },
    presence = "silent",
    recents = RECENTS,
    activeRecent = 0,
    placeholder = "发消息，/ 调用指令",
    composerText = "",
    caretAt = null,
    sendMode = "hollow",
    sendK = 0,
    markSize = 220,
    markAlpha = 0.42,
    caret = false,
    markDX = 0,
    markDY = 0,
    hint = null,
    ink = 0.86,
  } = opts;

  const mx = R.x + sideW;
  const mw = R.w - sideW;
  const markX = mx + mw / 2 + markDX;
  const markY = R.y + R.h / 2 - 46 + markDY;

  layer(ctx, ink, () => {
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.fillStyle = "rgba(7,23,34,0.94)";
    ctx.fill();
    ctx.strokeStyle = "#1f3f52";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // ---- sidebar
    if (sideW > 0) {
      ctx.fillStyle = "rgba(5,17,26,0.9)";
      ctx.fillRect(R.x, R.y, sideW, R.h);
      stroke(ctx, [[R.x + sideW, R.y], [R.x + sideW, R.y + R.h]], "#1f3f52", 1.2);
      // same lockup as the header: mark, name, and what it is running on
      drawWhale(ctx, R.x + 26 + 17, R.y + 54 - 22 * 0.34, 34, {
        strokeK: 1, fillK: 1, color: BRAND, alpha: 0.95,
      });
      const lx = R.x + 26 + 34 + 22 * 0.62;
      type(ctx, "deepseek", lx, R.y + 54, 22, "#dfe6ef", "MV Sans");
      ctx.font = `400 22px "MV Sans"`;
      type(ctx, "/ harness", lx + ctx.measureText("deepseek").width + 14, R.y + 54, 22 * 0.72, "#43607d", "MV Mono");

      const nb = { x: R.x + 20, y: R.y + 88, w: sideW - 40, h: 50 };
      rect(ctx, nb.x, nb.y, nb.w, nb.h, "#0f2434", 8, "#274b60");
      type(ctx, "+", nb.x + 18, nb.y + 33, 19, BRAND_SOFT, "MV Sans");
      type(ctx, "New chat", nb.x + 44, nb.y + 33, 17, "#9fb4d8", "MV Sans");

      type(ctx, "Recents", R.x + 28, nb.y + nb.h + 38, 13, "#3d5f76", "MV Mono");
      recents.forEach((title, i) => {
        const ry = nb.y + nb.h + 60 + i * 38;
        const active = i === activeRecent;
        if (active) rect(ctx, R.x + 14, ry - 17, sideW - 28, 34, "rgba(77,107,254,0.10)", 6);
        type(ctx, title, R.x + 28, ry, 14.5, active ? "#a9bde0" : "#4a6b83", "MV Sans");
      });

      // who is here at the foot
      stroke(ctx, [[R.x, R.y + R.h - 60], [R.x + sideW, R.y + R.h - 60]], "#1f3f52", 1.2);
      disc(ctx, R.x + 34, R.y + R.h - 30, 10, "#2a4459", 1);
      type(ctx, "you", R.x + 52, R.y + R.h - 25, 15, "#5b7590", "MV Sans");
      const online = presence === "online";
      disc(ctx, R.x + sideW - 100, R.y + R.h - 30, 4, online ? BRAND_SOFT : "#3d5f76", 1);
      if (online) halo(ctx, R.x + sideW - 100, R.y + R.h - 30, 26, 0.35, BRAND);
      type(ctx, presence, R.x + sideW - 86, R.y + R.h - 25, 13, online ? "#9fb4d8" : "#3d5f76", "MV Mono");
    }

    // ---- main
    type(ctx, threadTitle, mx + 40, R.y + 58, 22, "#dfe6ef", "MV Sans");
    if (chip) {
      const w = 12 + chip.text.length * 9 + 34;
      rect(ctx, R.x + R.w - w - 34, R.y + 34, w, 34, "rgba(77,107,254,0.10)", 17, "#2b4a6b");
      disc(ctx, R.x + R.w - w - 16, R.y + 51, 4.5, chip.on ? BRAND_SOFT : "#3d5f76", 1);
      if (chip.on) halo(ctx, R.x + R.w - w - 16, R.y + 51, 24, 0.3, BRAND);
      type(ctx, chip.text, R.x + R.w - w - 2, R.y + 57, 14, "#9fb4d8", "MV Mono");
    }
    stroke(ctx, [[mx, R.y + 84], [R.x + R.w, R.y + 84]], "#1f3f52", 1.2);

    // the mark: the thing you are talking to
    if (markSize > 0) {
      drawWhale(ctx, markX, markY, markSize, { strokeK: 1, fillK: 1, color: BRAND, alpha: markAlpha });
      halo(ctx, markX, markY, markSize * 1.35, 0.10 * markAlpha, BRAND);
    }
    if (hint && hint.alpha > 0.001) {
      layer(ctx, hint.alpha, () =>
        type(ctx, hint.text, markX, markY + markSize * 0.6, 14, "#3d5f76", "MV Mono", "center"),
      );
    }

    // ---- composer
    const cb = { x: mx + 40, y: R.y + R.h - 144, w: mw - 80, h: 104 };
    rect(ctx, cb.x, cb.y, cb.w, cb.h, "#0b2433", 12, "#24495b");
    const baseY = cb.y + cb.h / 2 + 6;
    if (!composerText) {
      type(ctx, placeholder, cb.x + 30, baseY, 19, "#3b5a74", "MV Sans");
    } else {
      type(ctx, composerText, cb.x + 30, baseY, 20, "#cfd9ea", "MV Sans");
      if (caret) {
        ctx.font = `400 20px "MV Sans"`;
        chatCaret(ctx, cb.x + 32 + ctx.measureText(composerText).width, cb.y + cb.h / 2, 23, t, {
          on: true, color: BRAND_SOFT, width: 2,
        });
      }
    }
    const send = sendButton(ctx, cb.x + cb.w - 58, cb.y + cb.h / 2, sendMode, sendK, t);
    return { mx, mw, cb, markX, markY, send, baseY };
  });

  return { mx, mw, cb: { x: mx + 40, y: R.y + R.h - 144, w: mw - 80, h: 104 }, markX, markY };
}

/**
 * The composer's right-hand control: an empty ring when there is nothing to send,
 * an arrow once there is, and a stop square while the model is answering.
 */
export function sendButton(ctx, x, y, mode, k = 0, t = 0) {
  if (mode === "stop") {
    disc(ctx, x, y, 19, BRAND, 1);
    halo(ctx, x, y, 62, 0.3, BRAND);
    ctx.fillStyle = "#06131f";
    ctx.fillRect(x - 6, y - 6, 12, 12);
    return { x, y, mode };
  }
  const armed = mode === "armed" ? 1 : k;
  disc(ctx, x, y, 19, BRAND_SOFT, 0.5 + 0.45 * armed, false, 1.4 + armed * 0.8);
  if (armed > 0.01) {
    ctx.save();
    ctx.globalAlpha = armed;
    ctx.fillStyle = BRAND_SOFT;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 6.5, y + 3);
    ctx.lineTo(x - 6.5, y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x - 2, y + 1, 4, 7);
    ctx.restore();
    halo(ctx, x, y, 58, 0.18 + 0.22 * armed, BRAND);
  } else {
    halo(ctx, x, y, 58, 0.18, BRAND);
  }
  return { x, y, mode };
}

/** A sent message: a bubble with its delivery label under the tail. */
export function messageBubble(ctx, R, text, opts = {}) {
  const { label = "Delivered", size = 20, alpha = 1, rise = 0 } = opts;
  ctx.font = `400 ${size}px "MV Sans"`;
  const tw = ctx.measureText(text).width;
  const w = tw + 56;
  const h = size + 34;
  const x = R.x + R.w - 46 - w;
  const y = R.y + 108 + rise;
  layer(ctx, alpha, () => {
    rect(ctx, x, y, w, h, "#12293c", 14, "#28465c");
    type(ctx, text, x + 28, y + h / 2 + 7, size, "#dfe6ef", "MV Sans");
    type(ctx, label, x + w - 24, y + h + 24, 13, "#4a6b83", "MV Sans", "right");
  });
  return { x, y, w, h };
}

/** The pointer. It is the only thing in the frame that says a person is here. */
export function cursorArrow(ctx, x, y, scale = 1.5, alpha = 1) {
  layer(ctx, alpha, () => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 17);
    ctx.lineTo(4.6, 12.8);
    ctx.lineTo(7.4, 18.6);
    ctx.lineTo(10.4, 17.2);
    ctx.lineTo(7.6, 11.6);
    ctx.lineTo(13.4, 11.4);
    ctx.closePath();
    ctx.fillStyle = "#f2f6fb";
    ctx.fill();
    ctx.strokeStyle = "rgba(6,19,31,0.85)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  });
}

/** A composer on its own, large: the close-up shot is built on this. */
export function composerCloseUp(ctx, R, t, opts = {}) {
  const { text = "", caretAt = null, sendMode = "hollow", sendK = 0, placeholder = "发消息，/ 调用指令" } = opts;
  rect(ctx, R.x, R.y, R.w, R.h, "#0b2433", 20, "#2b4f66");
  ctx.save();
  ctx.shadowColor = "rgba(77,107,254,0.25)";
  ctx.shadowBlur = 40;
  ctx.strokeStyle = "rgba(127,147,255,0.35)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(R.x, R.y, R.w, R.h, 20);
  ctx.stroke();
  ctx.restore();
  // the attach control, the model name, and the send button, as in the client
  disc(ctx, R.x + 42, R.y + R.h - 30, 13, "#5b7590", 0.9, false, 1.4);
  type(ctx, "+", R.x + 42, R.y + R.h - 23, 18, "#8fa4bd", "MV Sans", "center");
  type(ctx, "deepseek", R.x + R.w - 152, R.y + R.h - 23, 16, "#5b7590", "MV Sans", "right");
  const send = sendButton(ctx, R.x + R.w - 54, R.y + R.h - 30, sendMode, sendK, t);
  const baseY = R.y + R.h / 2 + 4;
  if (!text) {
    type(ctx, placeholder, R.x + 40, baseY, 30, "#3b5a74", "MV Sans");
  } else {
    type(ctx, text, R.x + 40, baseY, 32, "#e8eefc", "MV Sans");
    if (caretAt != null) chatCaretAt(ctx, caretAt, baseY, 34, t);
  }
  return { send, baseY };
}

function chatCaretAt(ctx, x, baseY, size, t) {
  if (Math.floor(t * 2.6) % 2 === 1) return;
  ctx.fillStyle = BRAND_SOFT;
  ctx.fillRect(x + 3, baseY - size * 0.82, 3.2, size * 1.0);
}
