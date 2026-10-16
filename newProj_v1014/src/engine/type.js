// Kinetic typography. Canvas 2D only, all motion a pure function of song time.
//
// The project's three faces are "MV Serif" (600), "MV Sans" (400) and
// "MV Mono" (400); `spec()` builds the ctx.font string for them.

export const FACES = { serif: "MV Serif", sans: "MV Sans", mono: "MV Mono" };
const WEIGHT = { "MV Serif": 600, "MV Sans": 400, "MV Mono": 400 };

export function spec(size, family = "MV Sans") {
  return { size, family, weight: WEIGHT[family] ?? 400 };
}
export function fontString(s) {
  return `${s.weight ?? 400} ${s.size}px "${s.family ?? "MV Sans"}"`;
}
export function applyFont(ctx, s) {
  ctx.font = fontString(s);
}

export function measure(ctx, text, s) {
  applyFont(ctx, s);
  return ctx.measureText(text).width;
}

// Shrink until the text fits, but never below minSize.
export function fitSize(ctx, text, maxWidth, s, minSize = 18) {
  let size = s.size;
  while (size > minSize) {
    applyFont(ctx, { ...s, size });
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

// Greedy word wrap; long single words are left oversized rather than split.
export function wrap(ctx, text, maxWidth, s) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const rows = [];
  let row = "";
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    applyFont(ctx, s);
    if (row && ctx.measureText(next).width > maxWidth) {
      rows.push(row);
      row = word;
    } else {
      row = next;
    }
  }
  if (row) rows.push(row);
  return rows.length ? rows : [String(text)];
}

// Fit a multi-row block: shrink until at most maxRows and every row fits.
export function fitBlock(ctx, text, maxWidth, s, { maxRows = 2, minSize = 40 } = {}) {
  let size = s.size;
  let rows = wrap(ctx, text, maxWidth, { ...s, size });
  while (size > minSize && (rows.length > maxRows ||
    rows.some((r) => measure(ctx, r, { ...s, size }) > maxWidth))) {
    size -= 2;
    rows = wrap(ctx, text, maxWidth, { ...s, size });
  }
  return { size, rows };
}

// ---- per-character reveal -------------------------------------------------

// Cumulative kerning-aware x offsets, so a slammed word keeps the width it was
// fitted to instead of drifting.
export function charOffsets(ctx, text, s) {
  const offsets = [];
  for (let i = 0; i < text.length; i++) {
    offsets.push(measure(ctx, text.slice(0, i), s));
  }
  offsets.push(measure(ctx, text, s));
  return offsets;
}

export function typewriter(text, t, start, cps) {
  const n = Math.max(0, Math.floor((t - start) * cps));
  return text.slice(0, Math.min(text.length, n));
}

const SCRAMBLE = "!<>-_\\/[]{}=+*^?#%$&@01|~:;";

export function scrambleText(text, t, start, { cps = 26, settle = 0.5 } = {}) {
  const revealed = Math.floor((t - start) * cps);
  let out = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " ") {
      out += " ";
      continue;
    }
    if (i < revealed) {
      out += text[i];
      continue;
    }
    // Each unresolved glyph re-rolls a few times a second, never per frame.
    const tick = Math.floor((t * 24) / 2) + i * 31;
    out += SCRAMBLE[Math.abs(tick) % SCRAMBLE.length];
  }
  return out;
}

// ---- drawing --------------------------------------------------------------

/**
 * Per-character entry: each glyph starts oversized and settles, staggered left
 * to right. `perChar` is the stagger between glyphs and `dur` the settle time.
 */
export function drawSlam(ctx, text, x, y, t, start, opts = {}) {
  const {
    size = 56,
    family = "MV Serif",
    color = "#e6f2ef",
    align = "left",
    perChar = 0.022,
    dur = 0.16,
    from = 1.55,
    rise = 0,
    alpha = 1,
  } = opts;
  const s = { ...spec(size, family) };
  const offsets = charOffsets(ctx, text, s);
  const total = offsets[offsets.length - 1];
  const x0 = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  applyFont(ctx, s);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  for (let i = 0; i < text.length; i++) {
    const k = Math.max(0, Math.min(1, (t - (start + i * perChar)) / dur));
    if (k <= 0) continue;
    const e = 1 - (1 - k) ** 3;
    const scale = from + (1 - from) * e;
    const a = alpha * Math.min(1, k * 2.2);
    const cx = x0 + offsets[i];
    const cy = y + rise * (1 - e);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  return { x: x0, width: total };
}

/**
 * Horizontal wipe reveal, row by row. `rows` is an array of strings; each row
 * is clipped from the left and slides up slightly as it appears.
 */
export function drawWipeRows(ctx, rows, x, yBase, t, start, opts = {}) {
  const {
    size = 56,
    family = "MV Serif",
    color = "#e6f2ef",
    width = 1600,
    align = "left",
    rowGap = 1.12,
    perRow = 0.07,
    dur = 0.26,
    rise = 10,
    shadow = true,
    alphas = null,
    staggerGrowth = 0,
  } = opts;
  const s = spec(size, family);
  const lineHeight = size * rowGap;
  ctx.save();
  if (shadow) {
    ctx.shadowColor = "#020b16";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 3;
  }
  const boxes = [];
  for (let r = 0; r < rows.length; r++) {
    const k = Math.max(0, Math.min(1, (t - (start + r * perRow)) / dur));
    if (k <= 0) {
      boxes.push(null);
      continue;
    }
    const e = 1 - (1 - k) ** 3;
    const y = yBase + r * lineHeight + rise * (1 - e);
    // Align each row on its own measured width so centred captions stay centred
    // while still wiping from the row's own leading edge.
    applyFont(ctx, s);
    const rowW = ctx.measureText(rows[r]).width;
    const rx = align === "center" ? x - rowW / 2 : align === "right" ? x - rowW : x;
    // Wipes are drawn widest-first so the row reads as printed, not faded.
    const reveal = (align === "right" ? rowW : rowW) * Math.min(1, e * (1 + staggerGrowth));
    ctx.save();
    ctx.beginPath();
    if (align === "right") {
      ctx.rect(rx + rowW - reveal - 4, y - size * 1.05, reveal + 8, size * 1.5);
    } else {
      ctx.rect(rx - 4, y - size * 1.05, reveal + 8, size * 1.5);
    }
    ctx.clip();
    applyFont(ctx, s);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = alphas ? alphas[r] : 1;
    ctx.fillStyle = color;
    ctx.fillText(rows[r], rx, y);
    ctx.restore();
    boxes.push({ row: r, x: rx, y, width: reveal });
  }
  ctx.restore();
  return { lineHeight, boxes };
}

// A short accent rule that draws out under a row; used to mark emphasised lines.
export function drawRule(ctx, x, y, maxWidth, t, start, opts = {}) {
  const { dur = 0.34, color = "#25bdd4", height = 2, alpha = 0.7 } = opts;
  const k = Math.max(0, Math.min(1, (t - start) / dur));
  if (k <= 0) return 0;
  const e = 1 - (1 - k) ** 3;
  const w = maxWidth * e;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, height);
  ctx.restore();
  return w;
}

/**
 * Type as a window onto a picture: `source` (a canvas or image) shows only
 * inside the glyphs. Needs a scratch canvas at least as large as the target
 * because the mask has to be composited, so the caller owns it and can reuse
 * it across frames.
 */
export function drawMaskedText(ctx, text, x, y, source, scratch, opts = {}) {
  const {
    size = 200,
    family = "MV Serif",
    align = "center",
    alpha = 1,
    color = "#ffffff",
    sourceRect = null,
  } = opts;
  if (!scratch) throw new Error("drawMaskedText needs a scratch canvas");
  const s = spec(size, family);
  applyFont(ctx, s);
  const w = ctx.measureText(text).width;
  const x0 = align === "center" ? x - w / 2 : align === "right" ? x - w : x;

  const g = scratch.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  g.clearRect(0, 0, scratch.width, scratch.height);
  applyFont(g, s);
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.fillStyle = color;
  g.fillText(text, x0, y);
  // Keep only what the glyphs cover, then show the picture there.
  g.globalCompositeOperation = "source-in";
  if (sourceRect) {
    g.drawImage(source, sourceRect[0], sourceRect[1], sourceRect[2], sourceRect[3],
      sourceRect[0], sourceRect[1], sourceRect[2], sourceRect[3]);
  } else {
    g.drawImage(source, 0, 0);
  }
  g.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(scratch, 0, 0, scratch.width, scratch.height, 0, 0, scratch.width, scratch.height);
  ctx.restore();
  return { x: x0, width: w };
}
