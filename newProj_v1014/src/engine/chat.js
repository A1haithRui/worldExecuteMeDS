// DeepSeek Harness flavoured chat interface, drawn on canvas.
//
// The structure and the motion numbers follow the real DeepSeek Harness client
// (row enter 0.12s / leave 0.25s, caret blink half-period 0.53s, the 300px
// 2.6s reasoning-row sweep, 432 deg/s spinner, 22px bubbles, 12px cards,
// 24px pills), re-tinted for this film's deep-sea palette. Nothing here is
// copied from the reference projects' code or assets.
//
// Every function is a pure function of song time.
import { spec, applyFont, measure, wrap } from "./type.js";

export const TOKENS = Object.freeze({
  shell: "#050b14",
  panel: "#0a1424",
  panelRaised: "#0e1c30",
  sidebar: "#08111e",
  border1: "#182842",
  border2: "#213455",
  bubbleUser: "#16304a",
  bubbleAgent: "#0d1c2c",
  field: "#0b1728",
  selector: "#152741",
  labelPrimary: "#eef4ff",
  labelSecondary: "#c2cfe2",
  labelTertiary: "#8b9ab1",
  labelCaption: "#66768c",
  brand: "#4f7fe8",
  accent: "#25bdd4",
  accentHot: "#83e9e6",
  success: "#3fb950",
  warn: "#d29922",
  error: "#f25a5a",
  radius: Object.freeze({ bubble: 22, card: 12, pill: 24, field: 12, panel: 14, chip: 6 }),
  font: Object.freeze({ ui: "MV Sans", mono: "MV Mono", serif: "MV Serif" }),
});

export const TIMING = Object.freeze({
  caretBlink: 0.53,
  rowEnter: 0.12,
  rowLeave: 0.25,
  sweepPeriod: 2.6,
  sweepWidth: 300,
  spinnerRate: 432,
  pop: 0.08,
});

const easeOut = (x) => 1 - (1 - Math.max(0, Math.min(1, x))) ** 3;
const smooth = (x) => {
  const p = Math.max(0, Math.min(1, x));
  return p * p * (3 - 2 * p);
};
const span = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a || 1e-9)));

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

// ---- small parts ----------------------------------------------------------

export function statusDot(ctx, x, y, r, state = "idle", alpha = 1) {
  const color =
    state === "online" || state === "running" ? TOKENS.success
      : state === "warn" || state === "waiting" ? TOKENS.warn
        : state === "error" ? TOKENS.error
          : state === "busy" ? TOKENS.brand
            : TOKENS.labelCaption;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.22;
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function statsPill(ctx, x, y, items, alpha = 1) {
  const s = spec(15, TOKENS.font.mono);
  applyFont(ctx, s);
  const pad = 10;
  const gap = 14;
  const widths = items.map((it) => ctx.measureText(it).width);
  const w = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1) + pad * 2;
  const h = 28;
  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "rgba(13,28,44,.85)";
  ctx.fill();
  ctx.strokeStyle = TOKENS.border1;
  ctx.lineWidth = 1;
  ctx.stroke();
  let cx = x + pad;
  items.forEach((it, i) => {
    applyFont(ctx, s);
    ctx.fillStyle = i === 0 ? TOKENS.labelSecondary : TOKENS.labelTertiary;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(it, cx, y + h / 2 + 1);
    cx += widths[i] + gap;
  });
  ctx.restore();
  return { x, y, w, h };
}

// The context meter from the real client: an inline ring, r=5.5, stroke 2.
export function contextRing(ctx, cx, cy, fill, alpha = 1) {
  const r = 6.5;
  const p = Math.max(0, Math.min(1, fill));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = TOKENS.border2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = fill > 0.95 ? TOKENS.error : TOKENS.brand;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function caret(ctx, x, y, h, t, { on = true, color = TOKENS.accentHot, width = 3 } = {}) {
  if (!on) return;
  const blink = Math.floor(t / TIMING.caretBlink) % 2 === 0 ? 1 : 0.45;
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.fillStyle = color;
  ctx.fillRect(x, y - h * 0.82, width, h);
  ctx.restore();
}

// The reasoning row: hover sweep while running, a summary line when done.
export function reasoningRow(ctx, x, y, w, t, opts = {}) {
  const {
    running = false,
    startedAt = 0,
    title = "思考",
    summary = "",
    alpha = 1,
    height = 30,
    sweep = true,
  } = opts;
  const h = height;
  ctx.save();
  ctx.globalAlpha = alpha;
  // Chevron
  ctx.strokeStyle = TOKENS.labelTertiary;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h * 0.36);
  ctx.lineTo(x + 9, y + h * 0.5);
  ctx.lineTo(x + 4, y + h * 0.64);
  ctx.stroke();
  const s = spec(15, TOKENS.font.ui);
  applyFont(ctx, s);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = running ? TOKENS.labelSecondary : TOKENS.labelTertiary;
  ctx.fillText(title, x + 18, y + h / 2);
  const titleW = ctx.measureText(title).width;
  // 2x2 separator dot
  ctx.fillStyle = TOKENS.labelCaption;
  ctx.fillRect(x + 22 + titleW, y + h / 2 - 1, 2, 2);
  const sumSize = spec(15, TOKENS.font.ui);
  applyFont(ctx, sumSize);
  const summaryText = summary;
  const maxW = w - 36 - titleW;
  let text = summaryText;
  if (measure(ctx, text, sumSize) > maxW) {
    while (text.length > 4 && measure(ctx, text + "…", sumSize) > maxW) text = text.slice(0, -1);
    text += "…";
  }
  ctx.fillStyle = running ? TOKENS.labelSecondary : TOKENS.labelTertiary;
  ctx.fillText(text, x + 30 + titleW, y + h / 2);

  if (running && sweep) {
    // 0% -> 90% of the cycle travels; the last 10% is off-screen, as in the
    // real client, so the shimmer reads as a pass rather than a constant glow.
    const phase = ((t - startedAt) % TIMING.sweepPeriod) / TIMING.sweepPeriod;
    const travel = Math.min(1, phase / 0.9);
    const left = x + 14 - TIMING.sweepWidth + travel * (w + TIMING.sweepWidth * 1.4);
    ctx.save();
    roundRect(ctx, x, y - 2, w, h + 4, TOKENS.radius.chip);
    ctx.clip();
    const g = ctx.createLinearGradient(left, 0, left + TIMING.sweepWidth, 0);
    g.addColorStop(0, "rgba(37,189,212,0)");
    g.addColorStop(0.55, "rgba(37,189,212,.16)");
    g.addColorStop(1, "rgba(37,189,212,0)");
    ctx.fillStyle = g;
    ctx.fillRect(left, y - 2, TIMING.sweepWidth, h + 4);
    ctx.restore();
  }
  ctx.restore();
  return { h };
}

// A tool / IO card, as the client renders bash and tool calls.
export function toolCard(ctx, x, y, w, t, opts = {}) {
  const {
    title = "pwsh",
    detail = "",
    state = "running",
    startedAt = 0,
    alpha = 1,
    size = 14,
  } = opts;
  const pad = 12;
  const s = spec(size, TOKENS.font.mono);
  applyFont(ctx, s);
  const lines = wrap(ctx, detail, w - pad * 2, s).slice(0, 3);
  const h = pad * 2 + size + (lines.length ? lines.length * size * 1.45 + 6 : 0);
  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(ctx, x, y, w, h, TOKENS.radius.card);
  ctx.fillStyle = "rgba(8,18,30,.92)";
  ctx.fill();
  ctx.strokeStyle = TOKENS.border1;
  ctx.lineWidth = 1;
  ctx.stroke();
  statusDot(ctx, x + pad + 4, y + pad + size * 0.42, 5,
    state === "running" ? "busy" : state === "error" ? "error" : "online");
  applyFont(ctx, s);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = state === "error" ? TOKENS.error : TOKENS.labelSecondary;
  ctx.fillText(title, x + pad + 16, y + pad + size * 0.45);
  if (state === "running") {
    const ang = ((t - startedAt) * TIMING.spinnerRate) % 360;
    ctx.save();
    ctx.translate(x + w - pad - 7, y + pad + size * 0.45);
    ctx.rotate((ang * Math.PI) / 180);
    ctx.strokeStyle = TOKENS.accent;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
  }
  applyFont(ctx, s);
  ctx.textBaseline = "top";
  ctx.fillStyle = TOKENS.labelTertiary;
  lines.forEach((row, i) => ctx.fillText(row, x + pad, y + pad + size + 10 + i * size * 1.45));
  ctx.restore();
  return { h };
}

// ---- text streaming -------------------------------------------------------

export function streamText(ctx, text, x, y, t, start, opts = {}) {
  const {
    cps = 22,
    size = 16,
    family = TOKENS.font.ui,
    color = TOKENS.labelPrimary,
    alpha = 1,
    caretColor = TOKENS.accentHot,
    showCaret = true,
    width = Infinity,
    lineHeight = 1.5,
    typed = true,
  } = opts;
  const s = spec(size, family);
  const full = String(text);
  const revealed = typed ? Math.max(0, Math.floor((t - start) * cps)) : full.length;
  const shown = full.slice(0, Math.min(full.length, revealed));
  const done = revealed >= full.length;
  applyFont(ctx, s);
  const rows = Number.isFinite(width) ? wrap(ctx, shown, width, s) : [shown];
  ctx.save();
  ctx.globalAlpha = alpha;
  applyFont(ctx, s);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let lastW = 0;
  rows.forEach((row, i) => {
    ctx.fillText(row, x, y + i * size * lineHeight);
    lastW = ctx.measureText(row).width;
  });
  ctx.restore();
  const caretX = x + lastW + 2;
  const caretY = y + (rows.length - 1) * size * lineHeight;
  if (showCaret && !done) caret(ctx, caretX, caretY, size * 1.1, t, { color: caretColor });
  else if (showCaret && done) caret(ctx, caretX, caretY, size * 1.1, t, { color: caretColor });
  return { rows: rows.length, caretX, caretY, done, revealed };
}

// ---- composite parts ------------------------------------------------------

/** Window chrome: rounded shell, header strip, optional sidebar column. */
export function chatWindow(ctx, rect, t, opts = {}) {
  const { x, y, w, h } = rect;
  const {
    title = "deepseek",
    subtitle = "",
    session = "SESSION 001",
    state = "online",
    stateLabel = "online",
    sidebar = true,
    sidebarW = 230,
    headerH = 74,
    alpha = 1,
    enterAt = null,
    enterDur = 0.7,
    footer = true,
    footerLabel = "MODEL ACTIVE",
    clock = "",
    pillItems = null,
  } = opts;
  const k = enterAt == null ? 1 : easeOut(span(t, enterAt, enterAt + enterDur));
  ctx.save();
  ctx.globalAlpha = alpha * k;
  ctx.translate(0, (1 - k) * 16);

  // shell + shadow
  ctx.save();
  ctx.shadowColor = "rgba(1,6,12,.75)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 26;
  roundRect(ctx, x, y, w, h, TOKENS.radius.panel);
  ctx.fillStyle = TOKENS.shell;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, TOKENS.radius.panel);
  ctx.clip();

  // header
  ctx.fillStyle = "rgba(8,16,28,.9)";
  ctx.fillRect(x, y, w, headerH);
  applyFont(ctx, spec(20, TOKENS.font.ui));
  ctx.fillStyle = TOKENS.labelPrimary;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, x + 34, y + headerH * 0.44);
  const tw = ctx.measureText(title).width;
  if (subtitle) {
    applyFont(ctx, spec(15, TOKENS.font.ui));
    ctx.fillStyle = TOKENS.labelCaption;
    ctx.fillText(subtitle, x + 34 + tw + 12, y + headerH * 0.46);
  }
  statusDot(ctx, x + w - 118, y + headerH * 0.44, 7, state);
  applyFont(ctx, spec(14, TOKENS.font.ui));
  ctx.fillStyle = TOKENS.labelTertiary;
  ctx.textAlign = "right";
  ctx.fillText(stateLabel, x + w - 34, y + headerH * 0.46);
  ctx.strokeStyle = TOKENS.border1;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + headerH);
  ctx.lineTo(x + w, y + headerH);
  ctx.stroke();

  // sidebar
  if (sidebar) {
    ctx.fillStyle = TOKENS.sidebar;
    ctx.fillRect(x, y + headerH, sidebarW, h - headerH);
    ctx.strokeStyle = TOKENS.border1;
    ctx.beginPath();
    ctx.moveTo(x + sidebarW, y + headerH);
    ctx.lineTo(x + sidebarW, y + h);
    ctx.stroke();
    roundRect(ctx, x + 22, y + headerH + 34, sidebarW - 46, 46, 10);
    ctx.fillStyle = "rgba(21,39,65,.9)";
    ctx.fill();
    ctx.strokeStyle = TOKENS.border2;
    ctx.stroke();
    applyFont(ctx, spec(15, TOKENS.font.ui));
    ctx.fillStyle = TOKENS.accentHot;
    ctx.textAlign = "left";
    ctx.fillText("New signal", x + 40, y + headerH + 58);
    applyFont(ctx, spec(13, TOKENS.font.ui));
    ctx.fillStyle = TOKENS.labelCaption;
    ctx.fillText("Today", x + 26, y + headerH + 118);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "rgba(102,118,140,.30)";
      ctx.fillRect(x + 26, y + headerH + 146 + i * 36, 60 + ((i * 47) % 90), 6);
    }
  }

  // footer status strip
  if (footer) {
    const fy = y + h - 46;
    ctx.strokeStyle = TOKENS.border1;
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(x + w, fy);
    ctx.stroke();
    applyFont(ctx, spec(13, TOKENS.font.mono));
    ctx.fillStyle = TOKENS.labelCaption;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(footerLabel, x + 28, fy + 23);
    ctx.textAlign = "right";
    ctx.fillStyle = TOKENS.labelTertiary;
    ctx.fillText(session, x + w - 190, fy + 23);
    if (clock) {
      applyFont(ctx, spec(13, TOKENS.font.mono));
      ctx.fillStyle = TOKENS.labelSecondary;
      ctx.fillText(clock, x + w - 28, fy + 23);
    }
  }
  ctx.restore();

  if (pillItems?.length) {
    statsPill(ctx, x + w - 34 - 240, y + headerH + 16, pillItems, alpha * k);
  }
  ctx.restore();
  return { headerH, sidebarW, contentX: sidebar ? x + sidebarW : x, k };
}

/**
 * Message row. `side` is "user" (right, filled bubble) or "agent" (left, avatar
 * and name). Enter animation is a short rise plus fade, as in the client.
 */
export function messageRow(ctx, x, y, maxW, t, start, opts = {}) {
  const {
    side = "user",
    text = "",
    size = 17,
    alpha = 1,
    enterDur = TIMING.rowEnter,
    maxLines = 3,
    showAvatar = true,
    name = "DeepSeek",
    typed = false,
    cps = 26,
  } = opts;
  const k = easeOut(span(t, start, start + enterDur));
  if (k <= 0) return { height: 0, y };
  const s = spec(size, TOKENS.font.ui);
  applyFont(ctx, s);
  const inner = maxW - 32;
  const shown = typed ? text.slice(0, Math.max(0, Math.floor((t - start) * cps))) : text;
  const rows = wrap(ctx, shown, inner, s).slice(0, maxLines);
  const lineH = size * 1.5;
  const bubbleH = rows.length * lineH + 18;
  const textW = Math.max(...rows.map((r) => measure(ctx, r, s)), 20);
  const bubbleW = Math.min(maxW, textW + 34);

  ctx.save();
  ctx.globalAlpha = alpha * k;
  ctx.translate(0, (1 - k) * 12);

  let bx;
  if (side === "user") {
    bx = x + maxW - bubbleW;
    roundRect(ctx, bx, y, bubbleW, bubbleH, TOKENS.radius.bubble);
    ctx.fillStyle = TOKENS.bubbleUser;
    ctx.fill();
    ctx.strokeStyle = "rgba(37,189,212,.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
    applyFont(ctx, s);
    ctx.fillStyle = TOKENS.labelPrimary;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    rows.forEach((row, i) => ctx.fillText(row, bx + 17, y + 27 + i * lineH));
    var caretX = bx + 17 + measure(ctx, rows[rows.length - 1] || "", s) + 2;
  } else {
    const avX = x + 12;
    if (showAvatar) {
      ctx.beginPath();
      ctx.arc(avX + 16, y + 16, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(21,39,65,.95)";
      ctx.fill();
      ctx.strokeStyle = "rgba(37,189,212,.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      applyFont(ctx, spec(15, TOKENS.font.ui));
      ctx.fillStyle = TOKENS.accentHot;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("D", avX + 16, y + 17);
    }
    applyFont(ctx, spec(14, TOKENS.font.ui));
    ctx.fillStyle = TOKENS.accent;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(name, avX + 44, y + 14);
    bx = avX + 44;
    applyFont(ctx, s);
    ctx.fillStyle = TOKENS.labelPrimary;
    rows.forEach((row, i) => ctx.fillText(row, bx, y + 44 + i * lineH));
    var caretX = bx + measure(ctx, rows[rows.length - 1] || "", s) + 2;
  }
  ctx.restore();

  const height = side === "user" ? bubbleH : 44 + rows.length * lineH + 6;
  if (typed && shown.length < text.length) {
    caret(ctx, caretX, side === "user" ? y + 27 + (rows.length - 1) * lineH : y + 44 + (rows.length - 1) * lineH,
      size * 1.1, t, { color: TOKENS.accentHot });
  }
  return { height, y, bubbleW, rows: rows.length };
}

/** Composer: input field, placeholder, trailing send affordance. */
export function composer(ctx, x, y, w, t, opts = {}) {
  const {
    placeholder = "发消息，/ 调用指令",
    alpha = 1,
    focused = true,
    caretOn = true,
    typed = "",
    cps = 26,
    startedAt = 0,
    sendArmed = false,
  } = opts;
  const h = 58;
  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(ctx, x, y, w, h, TOKENS.radius.field);
  ctx.fillStyle = TOKENS.field;
  ctx.fill();
  ctx.strokeStyle = focused ? "rgba(37,189,212,.42)" : TOKENS.border1;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const s = spec(16, TOKENS.font.ui);
  applyFont(ctx, s);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if (typed) {
    const shown = typed.slice(0, Math.max(0, Math.floor((t - startedAt) * cps)));
    ctx.fillStyle = TOKENS.labelPrimary;
    ctx.fillText(shown, x + 20, y + h / 2);
    if (caretOn && shown.length < typed.length) {
      const cw = measure(ctx, shown, s);
      caret(ctx, x + 22 + cw, y + h / 2 + 9, 18, t, { color: TOKENS.accent });
    }
  } else {
    ctx.fillStyle = TOKENS.labelCaption;
    ctx.fillText(placeholder, x + 20, y + h / 2);
  }

  // send button
  const bx = x + w - 46;
  const by = y + h / 2;
  const armed = sendArmed ? easeOut(span(t, sendArmed, sendArmed + 0.16)) : 0;
  ctx.beginPath();
  ctx.arc(bx, by, 16, 0, Math.PI * 2);
  ctx.fillStyle = armed > 0.02 ? TOKENS.accent : "rgba(21,39,65,.95)";
  ctx.globalAlpha = alpha * (armed > 0.02 ? 0.5 + 0.5 * armed : 1);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = armed > 0.02 ? TOKENS.accentHot : TOKENS.border2;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = armed > 0.02 ? "#04121c" : TOKENS.labelTertiary;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bx, by + 6);
  ctx.lineTo(bx, by - 6);
  ctx.moveTo(bx - 4, by - 2);
  ctx.lineTo(bx, by - 6);
  ctx.lineTo(bx + 4, by - 2);
  ctx.stroke();
  ctx.restore();
  return { h };
}
