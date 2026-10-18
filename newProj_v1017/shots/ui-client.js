// The DeepSeek client, drawn once and shared by every shot that shows it.
//
// Section 1 ends on this window and section 2 lives inside it, so two shots would
// otherwise each carry their own copy of the chrome and drift apart. Everything
// that varies between them is an option here: what the chip says, whether the
// presence dot is lit, what is in the composer, and how the send button reads.
//
// `tone` is the other axis. Section 1's client is the product: nearly black, lit
// only where it must be. Section 2 steps inside it, so the same chrome is drawn in
// a lifted blue -- the room comes up rather than the palette changing hue.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";
import { drawWhale } from "../src/assets/whale.js";
import { caret as chatCaret } from "../src/engine/chat.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";

const TONES = Object.freeze({
  product: {
    shell: "rgba(7,23,34,0.94)",
    edge: "#1f3f52",
    sidebar: "rgba(5,17,26,0.9)",
    rule: "#1f3f52",
    text: "#dfe6ef",
    dim: "#4a6b83",
    dimmer: "#3d5f76",
    mid: "#5b7590",
    composer: "#0b2433",
    composerEdge: "#24495b",
    placeholder: "#3b5a74",
    newChat: "#0f2434",
    newChatEdge: "#274b60",
    activeRow: "rgba(77,107,254,0.10)",
    mark: 0.42,
  },
  chat: {
    shell: "rgba(17,48,68,0.95)",
    edge: "#356b8a",
    sidebar: "rgba(13,38,54,0.94)",
    rule: "#2b5c78",
    text: "#f2f7fd",
    dim: "#7d9cb8",
    dimmer: "#5f809a",
    mid: "#82a2bd",
    composer: "#16405c",
    composerEdge: "#3d7a9c",
    placeholder: "#6f93ae",
    newChat: "#1a4a68",
    newChatEdge: "#3d7796",
    activeRow: "rgba(127,147,255,0.18)",
    mark: 0.62,
  },
});

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
 * A lens flare on the mark: a hot core, an anamorphic streak, slow rotating rays
 * and a shimmer ring. This is the film's one piece of pure spectacle, so it is
 * used only where the mark itself is the subject.
 */
export function markFlare(ctx, x, y, size, t, k = 1, opts = {}) {
  if (k <= 0) return;
  const { rays = true, streak = true, alpha = 1 } = opts;
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.1);
  const spin = t * 0.22;
  layer(ctx, alpha * k, () => {
    halo(ctx, x, y, size * (1.5 + 0.18 * breathe), 0.26, BRAND);
    if (rays) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spin);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r0 = size * 0.55;
        const r1 = r0 + size * (0.5 + 0.42 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 1.3)));
        const w = size * 0.055;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const g = ctx.createLinearGradient(ca * r0, sa * r0, ca * r1, sa * r1);
        g.addColorStop(0, "rgba(196,212,255,0.85)");
        g.addColorStop(1, "rgba(77,107,254,0)");
        ctx.fillStyle = g;
        // a spike: wide at the mark, drawn to a point outward. The reverse reads
        // as an arrowhead aimed at the mark, which looks like a bug.
        ctx.beginPath();
        ctx.moveTo(ca * r1, sa * r1);
        ctx.lineTo(ca * r0 - sa * w, sa * r0 + ca * w);
        ctx.lineTo(ca * r0 + sa * w, sa * r0 - ca * w);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    if (streak) {
      const g = ctx.createLinearGradient(x - size * 3, 0, x + size * 3, 0);
      g.addColorStop(0, "rgba(127,147,255,0)");
      g.addColorStop(0.5, `rgba(216,228,255,${0.5 + 0.35 * breathe})`);
      g.addColorStop(1, "rgba(127,147,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - size * 3, y - 3, size * 6, 6);
    }
    ctx.beginPath();
    ctx.arc(x, y, size * (1.15 + 0.25 * breathe), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(160,185,255,${0.18 + 0.14 * breathe})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });
}

/** Draw the client shell and return its geometry for a shot to place against. */
export function clientWindow(ctx, R, t, opts = {}) {
  const {
    tone = "product",
    sideW = 340,
    threadTitle = "New chat",
    chip = { text: "harness · ready", on: true },
    presence = "silent",
    recents = RECENTS,
    activeRecent = 0,
    placeholder = "发消息，/ 调用指令",
    composerText = "",
    caret = false,
    sendMode = "hollow",
    sendK = 0,
    markSize = 220,
    markAlpha = null,
    markDX = 0,
    markDY = 0,
    markPulse = 0,
    hint = null,
    ink = 1,
  } = opts;

  const T = TONES[tone] ?? TONES.product;
  const mx = R.x + sideW;
  const mw = R.w - sideW;
  const markX = mx + mw / 2 + markDX;
  const markY = R.y + R.h / 2 - 46 + markDY;
  const pulse = markPulse > 0 ? 1 + markPulse * 0.16 * Math.sin(t * 2.6) : 1;
  const alpha = markAlpha ?? T.mark;

  layer(ctx, ink, () => {
    ctx.beginPath();
    ctx.roundRect(R.x, R.y, R.w, R.h, 22);
    ctx.fillStyle = T.shell;
    ctx.fill();
    ctx.strokeStyle = T.edge;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // ---- sidebar
    if (sideW > 0) {
      ctx.fillStyle = T.sidebar;
      ctx.fillRect(R.x, R.y, sideW, R.h);
      stroke(ctx, [[R.x + sideW, R.y], [R.x + sideW, R.y + R.h]], T.rule, 1.2);
      const lx = R.x + 26 + 34 + 22 * 0.62;
      drawWhale(ctx, R.x + 43, R.y + 47, 34, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.95 });
      type(ctx, "deepseek", lx, R.y + 54, 22, T.text, "MV Sans");
      ctx.font = `400 22px "MV Sans"`;
      type(ctx, "/ harness", lx + ctx.measureText("deepseek").width + 14, R.y + 54, 15.8, T.dim, "MV Mono");

      const nb = { x: R.x + 20, y: R.y + 88, w: sideW - 40, h: 50 };
      rect(ctx, nb.x, nb.y, nb.w, nb.h, T.newChat, 8, T.newChatEdge);
      type(ctx, "+", nb.x + 18, nb.y + 33, 19, BRAND_SOFT, "MV Sans");
      type(ctx, "New chat", nb.x + 44, nb.y + 33, 17, T.text, "MV Sans");

      type(ctx, "Recents", R.x + 28, nb.y + nb.h + 38, 13, T.dimmer, "MV Mono");
      recents.forEach((title, i) => {
        const ry = nb.y + nb.h + 60 + i * 38;
        const active = i === activeRecent;
        if (active) rect(ctx, R.x + 14, ry - 17, sideW - 28, 34, T.activeRow, 6);
        type(ctx, title, R.x + 28, ry, 14.5, active ? "#cfe0f5" : T.dim, "MV Sans");
      });

      stroke(ctx, [[R.x, R.y + R.h - 60], [R.x + sideW, R.y + R.h - 60]], T.rule, 1.2);
      disc(ctx, R.x + 34, R.y + R.h - 30, 10, T.mid, 1);
      type(ctx, "you", R.x + 52, R.y + R.h - 25, 15, T.mid, "MV Sans");
      const online = presence === "online";
      disc(ctx, R.x + sideW - 100, R.y + R.h - 30, 4, online ? BRAND_SOFT : T.dimmer, 1);
      if (online) halo(ctx, R.x + sideW - 100, R.y + R.h - 30, 26, 0.4, BRAND);
      type(ctx, presence, R.x + sideW - 86, R.y + R.h - 25, 13, online ? BRAND_SOFT : T.dimmer, "MV Mono");
    }

    // ---- main
    type(ctx, threadTitle, mx + 40, R.y + 58, 22, T.text, "MV Sans");
    if (chip) {
      const w = 12 + chip.text.length * 9 + 34;
      rect(ctx, R.x + R.w - w - 34, R.y + 34, w, 34, T.activeRow, 17, T.rule);
      disc(ctx, R.x + R.w - w - 16, R.y + 51, 4.5, chip.on ? BRAND_SOFT : T.dimmer, 1);
      if (chip.on) halo(ctx, R.x + R.w - w - 16, R.y + 51, 26, 0.35, BRAND);
      type(ctx, chip.text, R.x + R.w - w - 2, R.y + 57, 14, T.text, "MV Mono");
    }
    stroke(ctx, [[mx, R.y + 84], [R.x + R.w, R.y + 84]], T.rule, 1.2);

    if (markSize > 0) {
      drawWhale(ctx, markX, markY, markSize * pulse, {
        strokeK: 1, fillK: 1, color: BRAND, alpha: Math.min(1, alpha * pulse),
      });
      halo(ctx, markX, markY, markSize * 1.4 * pulse, 0.1 * Math.min(1.4, alpha + 0.3), BRAND);
    }
    if (hint && hint.alpha > 0.001) {
      layer(ctx, hint.alpha, () =>
        type(ctx, hint.text, markX, markY + markSize * 0.6, 14, T.dimmer, "MV Mono", "center"),
      );
    }

    // ---- composer
    const cb = { x: mx + 40, y: R.y + R.h - 144, w: mw - 80, h: 104 };
    rect(ctx, cb.x, cb.y, cb.w, cb.h, T.composer, 12, T.composerEdge);
    const baseY = cb.y + cb.h / 2 + 6;
    if (!composerText) {
      type(ctx, placeholder, cb.x + 30, baseY, 19, T.placeholder, "MV Sans");
    } else {
      type(ctx, composerText, cb.x + 30, baseY, 20, T.text, "MV Sans");
      if (caret) {
        ctx.font = `400 20px "MV Sans"`;
        chatCaret(ctx, cb.x + 32 + ctx.measureText(composerText).width, cb.y + cb.h / 2, 23, t, {
          on: true, color: BRAND_SOFT, width: 2,
        });
      }
    }
    sendButton(ctx, cb.x + cb.w - 58, cb.y + cb.h / 2, sendMode, sendK, t);
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

/** A tick that strokes itself on: the moment a connection is confirmed. */
export function checkMark(ctx, x, y, r, k, color = "#83e9e6") {
  if (k <= 0) return;
  const p = Math.min(1, k);
  // save/restore rather than layer(1): a nested layer would reset the ambient
  // alpha and leave the tick floating after its toast had faded out
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.globalAlpha *= 0.5;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha /= 0.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.24);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const a = { x: x - r * 0.42, y: y + r * 0.02 };
  const b = { x: x - r * 0.1, y: y + r * 0.34 };
  const c = { x: x + r * 0.46, y: y - r * 0.34 };
  const s1 = Math.min(1, p * 2);
  const s2 = Math.max(0, p * 2 - 1);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(a.x + (b.x - a.x) * s1, a.y + (b.y - a.y) * s1);
  if (s2 > 0) ctx.lineTo(b.x + (c.x - b.x) * s2, b.y + (c.y - b.y) * s2);
  ctx.stroke();
  ctx.restore();
}

/** A confirmation pill that slides in under the status chip, then leaves. */
export function connectionToast(ctx, R, t, start, text = "连接成功", label = "connected") {
  const k = at(t, start, start + 0.36);
  if (k <= 0) return 0;
  const fade = 1 - at(t, start + 1.6, start + 2.1);
  const w = 276;
  const x = R.x + R.w - w - 34;
  const y = R.y + 80 + (1 - k) * 12;
  layer(ctx, k * fade, () => {
    rect(ctx, x, y, w, 52, "rgba(22,64,92,0.94)", 12, "#3d7a9c");
    checkMark(ctx, x + 30, y + 26, 14, Math.min(1, k * 1.7));
    type(ctx, text, x + 56, y + 33, 18, "#e8f3ff", "MV Sans");
    type(ctx, label, x + w - 18, y + 33, 12, "#7d9cb8", "MV Mono", "right");
  });
  return k * fade;
}

/** A sent message: a bubble with its delivery label under the tail. */
export function messageBubble(ctx, R, text, opts = {}) {
  const { label = "Delivered", size = 20, alpha = 1, rise = 0, tone = "chat" } = opts;
  const T = TONES[tone] ?? TONES.chat;
  ctx.font = `400 ${size}px "MV Sans"`;
  const tw = ctx.measureText(text).width;
  const w = tw + 56;
  const h = size + 34;
  const x = R.x + R.w - 46 - w;
  const y = R.y + 108 + rise;
  layer(ctx, alpha, () => {
    rect(ctx, x, y, w, h, T.composer, 14, T.composerEdge);
    type(ctx, text, x + 28, y + h / 2 + 7, size, "#eef3fb", "MV Sans");
    type(ctx, label, x + w - 24, y + h + 24, 13, T.dim, "MV Sans", "right");
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

/** The ring a pointer leaves behind when it lands on the composer. */
export function clickRipple(ctx, x, y, t, start, color = BRAND_SOFT) {
  const k = at(t, start, start + 0.5);
  if (k <= 0 || k >= 1) return;
  layer(ctx, (1 - k) * 0.85, () => {
    ctx.beginPath();
    ctx.arc(x, y, 12 + 36 * k, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6 * (1 - k) + 0.6;
    ctx.stroke();
  });
}

/** A composer on its own, large: the close-up shot is built on this. */
export function composerCloseUp(ctx, R, t, opts = {}) {
  const {
    text = "", caretAt = null, sendMode = "hollow", sendK = 0,
    placeholder = "发消息，/ 调用指令", tone = "chat",
  } = opts;
  const T = TONES[tone] ?? TONES.chat;
  rect(ctx, R.x, R.y, R.w, R.h, T.composer, 20, T.composerEdge);
  ctx.save();
  ctx.shadowColor = "rgba(77,107,254,0.3)";
  ctx.shadowBlur = 44;
  ctx.strokeStyle = "rgba(127,147,255,0.45)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(R.x, R.y, R.w, R.h, 20);
  ctx.stroke();
  ctx.restore();
  disc(ctx, R.x + 42, R.y + R.h - 30, 13, T.mid, 0.95, false, 1.4);
  type(ctx, "+", R.x + 42, R.y + R.h - 23, 18, T.text, "MV Sans", "center");
  type(ctx, "deepseek", R.x + R.w - 152, R.y + R.h - 23, 16, T.mid, "MV Sans", "right");
  const send = sendButton(ctx, R.x + R.w - 54, R.y + R.h - 30, sendMode, sendK, t);
  const baseY = R.y + R.h / 2 + 4;
  if (!text) {
    type(ctx, placeholder, R.x + 40, baseY, 30, T.placeholder, "MV Sans");
  } else {
    type(ctx, text, R.x + 40, baseY, 32, "#f2f7fd", "MV Sans");
    if (caretAt != null && Math.floor(t * 2.6) % 2 === 0) {
      ctx.fillStyle = BRAND_SOFT;
      ctx.fillRect(caretAt + 3, baseY - 27, 3.4, 34);
    }
  }
  return { send, baseY };
}
