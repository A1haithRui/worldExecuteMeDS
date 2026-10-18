// Shared deterministic drawing primitives. No cross-frame animation state.
import { spec, fitBlock, drawWipeRows, drawRule } from "./engine/type.js";
import { noteReversedWindow } from "./engine/motion.js";

const W = 1920,
  H = 1080,
  C = {
    bg: "#06131f",
    panel: "#0b2433",
    cyan: "#25bdd4",
    hot: "#83e9e6",
    white: "#e6f2ef",
    muted: "#526c7c",
    edge: "#285363",
    // Fault red. The storyboard allows it only on out-of-bounds ports and on
    //局部 fault edges from S36 onward -- never as a full-screen wash.
    danger: "#e75d69",
    dangerDim: "#8f3b45",
  };
const clamp = (x) => Math.max(0, Math.min(1, x)),
  mix = (a, b, k) => a + (b - a) * k,
  // Guarded: a window with b < a would clamp silently and invert the meaning,
  // which is invisible in a frame dump. See engine/motion.js.
  phase = (t, a, b) => {
    noteReversedWindow(t, a, b, "mv-draw.phase");
    return clamp((t - a) / (b - a));
  };
const ease = (x) => {
    const p = clamp(x);
    return p * p * (3 - 2 * p);
  },
  out = (x) => 1 - (1 - clamp(x)) ** 3,
  at = (t, a, b) => ease(phase(t, a, b));
let texture;
function makeTexture() {
  const c = document.createElement("canvas");
  c.width = 480;
  c.height = 270;
  const g = c.getContext("2d"),
    p = g.createImageData(480, 270);
  let seed = 71124;
  for (let i = 0; i < p.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    p.data[i] = p.data[i + 1] = p.data[i + 2] = seed >>> 24;
    p.data[i + 3] = 2;
  }
  g.putImageData(p, 0, 0);
  return c;
}
function layer(ctx, alpha, fn) {
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  fn();
  ctx.restore();
}
function stroke(ctx, pts, color = C.edge, width = 2, alpha = 1) {
  layer(ctx, alpha, () => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  });
}
function disc(ctx, x, y, r, color, alpha = 1, fill = true, width = 2) {
  layer(ctx, alpha, () => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    fill ? ctx.fill() : ctx.stroke();
  });
}
function rect(ctx, x, y, w, h, fill, r = 18, border) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
function type(
  ctx,
  text,
  x,
  y,
  size = 24,
  color = C.muted,
  font = "MV Mono",
  align = "left",
) {
  ctx.font = `${font === "MV Serif" ? 600 : 400} ${size}px "${font}"`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function halo(ctx, x, y, r, alpha = 0.15, color = C.cyan) {
  layer(ctx, alpha, () => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  });
}
function point(ctx, x, y, white = false, alpha = 1, r = 7) {
  layer(ctx, alpha, () => {
    halo(ctx, x, y, 42, 0.2, white ? C.white : C.cyan);
    disc(ctx, x, y, r, white ? C.white : C.hot);
  });
}
// Mix two #rrggbb strings. Needed because the ground's tone has to be lifted by a
// number rather than swapped for another hard-coded palette.
const mixHex = (a, b, k) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(mix((pa >> 16) & 255, (pb >> 16) & 255, k));
  const g = Math.round(mix((pa >> 8) & 255, (pb >> 8) & 255, k));
  const bl = Math.round(mix(pa & 255, pb & 255, k));
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
};

/**
 * The room. `lift` raises the whole thing toward a lit interior without changing
 * its hue, which is how the film moves from the product world's near-black into
 * the chat world's blue without leaving the DeepSeek palette.
 */
function ground(ctx, t, focus = [1250, 440], quiet = false, lift = 0) {
  const bg = mixHex(C.bg, "#0f2a3d", lift);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(...focus, 30, ...focus, 1100);
  g.addColorStop(0, mixHex(quiet ? "#0b2936" : "#103747", "#2a6a8a", lift));
  g.addColorStop(0.6, mixHex("#08202d", "#153c54", lift));
  g.addColorStop(1, bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  layer(ctx, (quiet ? 0.16 : 0.28) * (1 + lift * 0.5), () => {
    ctx.fillStyle = mixHex("#0c3040", "#1d5c7a", lift);
    ctx.beginPath();
    ctx.moveTo(1330, 0);
    ctx.lineTo(1730, 0);
    ctx.lineTo(1060, H);
    ctx.lineTo(720, H);
    ctx.fill();
  });
  texture ||= makeTexture();
  ctx.drawImage(texture, 0, 0, W, H);
  const vig = ctx.createRadialGradient(960, 520, 420, 960, 520, 1250);
  vig.addColorStop(0, "transparent");
  vig.addColorStop(1, mixHex("#020b13", "#061726", lift) + "a0");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
function wrap(ctx, text, width, size) {
  ctx.font = `600 ${size}px "MV Serif"`;
  const rows = [];
  let row = "";
  for (const word of text.split(/\s+/)) {
    const next = row ? row + " " + word : word;
    if (ctx.measureText(next).width > width && row) {
      rows.push(row);
      row = word;
    } else row = next;
  }
  if (row) rows.push(row);
  return rows;
}
// Captions are planned by the shot and drawn by the stage after the transition
// composite, so a wipe or a dissolve never cuts through the lyric text.
function caption(ctx, line, t, layout, diag) {
  if (!line?.text) return null;
  const { x, y, width, align = "left", size = 56 } = layout;
  const target = line.emphasis ? Math.min(size + 24, 82) : size;
  const { size: n, rows } = fitBlock(ctx, line.text, width, spec(target, "MV Serif"), {
    maxRows: 2,
    minSize: 40,
  });
  const plan = {
    rows,
    size: n,
    x,
    baseY: y,
    width,
    align,
    color: line.emphasis ? C.hot : C.white,
    emphasis: !!line.emphasis,
    start: line.start,
  };
  diag.caption = {
    line: line.index,
    size: n,
    rows: rows.length,
    x,
    y,
    width,
    align,
    bottom: y + (rows.length - 1) * n * 1.12,
  };
  diag.captionPlan = plan;
  return plan;
}

function drawCaption(ctx, plan, t) {
  if (!plan) return;
  const yy = plan.baseY + (1 - out(phase(t, plan.start, plan.start + 0.18))) * 9;
  const drawn = drawWipeRows(ctx, plan.rows, plan.x, yy, t, plan.start, {
    size: plan.size,
    family: "MV Serif",
    color: plan.color,
    align: plan.align,
    perRow: 0.05,
    dur: 0.13,
    rise: 9,
  });
  // Emphasis lines get one short accent rule under the last row.
  if (plan.emphasis && plan.rows.length) {
    const last = drawn.boxes[drawn.boxes.length - 1];
    const rowWidth = Math.min(plan.width, last ? last.width : plan.width);
    const ruleX =
      plan.align === "center" ? plan.x - rowWidth / 2
        : plan.align === "right" ? plan.x - rowWidth
          : plan.x;
    drawRule(
      ctx,
      ruleX,
      yy + (plan.rows.length - 1) * drawn.lineHeight + plan.size * 0.34,
      rowWidth,
      t,
      plan.start + 0.1,
      { dur: 0.4, color: C.cyan, alpha: 0.55 },
    );
  }
}
function bezier(a, b, c, d, u) {
  const v = 1 - u;
  return [
    v * v * v * a[0] +
      3 * v * v * u * b[0] +
      3 * v * u * u * c[0] +
      u * u * u * d[0],
    v * v * v * a[1] +
      3 * v * v * u * b[1] +
      3 * v * u * u * c[1] +
      u * u * u * d[1],
  ];
}
// Sample a curve into a polyline with cumulative arc length.
// Accepts 4 control points (cubic) or 3 (quadratic). Anything else is a bug:
// the cubic evaluator would silently receive `undefined` and the whole route
// would become NaN, which then blows up deep inside a gradient or a path.
function route(control) {
  let evalAt;
  if (control.length === 4) {
    evalAt = (u) => bezier(control[0], control[1], control[2], control[3], u);
  } else if (control.length === 3) {
    evalAt = (u) => {
      const v = 1 - u;
      return [
        v * v * control[0][0] + 2 * v * u * control[1][0] + u * u * control[2][0],
        v * v * control[0][1] + 2 * v * u * control[1][1] + u * u * control[2][1],
      ];
    };
  } else {
    throw new Error(`route() needs 3 or 4 control points, got ${control.length}`);
  }
  const pts = Array.from({ length: 161 }, (_, i) => evalAt(i / 160)),
    dist = [0];
  for (let i = 1; i < pts.length; i++)
    dist.push(
      dist[i - 1] +
        Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]),
    );
  return { pts, dist, length: dist.at(-1) };
}

// A polyline resampled to the same 161-point form as route(), so trace / along /
// signalPath work on it unchanged. `closed` joins the last point back to the
// first, which is what most of the reconnect and loop shots need.
function polyline(points, closed = false) {
  const src = points.map((p) => [p[0], p[1]]);
  if (src.length < 2) throw new Error("polyline() needs at least 2 points");
  if (closed) src.push([src[0][0], src[0][1]]);
  const seg = [0];
  for (let i = 1; i < src.length; i++)
    seg.push(
      seg[i - 1] + Math.hypot(src[i][0] - src[i - 1][0], src[i][1] - src[i - 1][1]),
    );
  const total = seg[seg.length - 1] || 1e-9;
  const pts = [];
  for (let i = 0; i < 161; i++) {
    const d = (i / 160) * total;
    let j = 1;
    while (j < seg.length - 1 && seg[j] < d) j++;
    const k = (d - seg[j - 1]) / (seg[j] - seg[j - 1] || 1e-9);
    pts.push([
      src[j - 1][0] + (src[j][0] - src[j - 1][0]) * k,
      src[j - 1][1] + (src[j][1] - src[j - 1][1]) * k,
    ]);
  }
  const dist = [0];
  for (let i = 1; i < pts.length; i++)
    dist.push(
      dist[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]),
    );
  return { pts, dist, length: dist[dist.length - 1] };
}
function along(r, p) {
  const d = clamp(p) * r.length;
  let i = 1;
  while (i < r.dist.length - 1 && r.dist[i] < d) i++;
  const k = (d - r.dist[i - 1]) / (r.dist[i] - r.dist[i - 1]);
  return [
    mix(r.pts[i - 1][0], r.pts[i][0], k),
    mix(r.pts[i - 1][1], r.pts[i][1], k),
  ];
}
function trace(ctx, r, p, color, width = 3, alpha = 1, from = 0) {
  const a = Math.floor(clamp(from) * 160),
    b = Math.floor(clamp(p) * 160);
  if (b < a) return;
  stroke(
    ctx,
    [along(r, from), ...r.pts.slice(a + 1, b + 1), along(r, p)],
    color,
    width,
    alpha,
  );
}

export function loadImages(sources) {
  const images = {};
  const ready = Promise.all(
    Object.entries(sources).map(async ([key, url]) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      images[key] = image;
    }),
  );
  return { images, ready };
}

export {
  W,
  H,
  C,
  clamp,
  mix,
  phase,
  ease,
  out,
  at,
  layer,
  stroke,
  disc,
  rect,
  type,
  halo,
  point,
  ground,
  caption,
  drawCaption,
  route,
  polyline,
  along,
  trace,
};
