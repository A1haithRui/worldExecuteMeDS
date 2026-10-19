// The plates.
//
// Section 5 alternates between the interface and a plate for each keyword: when the
// lyric turns to STIMULATIONS, SATISFACTION, EXECUTION or SIMULATION, the film
// stops being a screen and becomes a printed sheet. The reference does exactly
// this, and it is the best idea in its section -- the four words get a register of
// their own instead of another bubble.
//
// Ours are dark sheets rather than light paper, on purpose: the film has one big
// white flash at the title and the safety gate exists for it, so four more
// full-frame bright cuts in fifteen seconds would be a second, unplanned event.
// What makes them read as plates is the register, not the value: a flat sheet with
// a ruled edge and cut-paper shapes, no window chrome, no depth.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const SHEET = "#071a2b";
const INK = "#2b4a6b";

export const PLATE = Object.freeze({ x: 96, y: 72, w: 1728, h: 936 });

/** The sheet every plate is printed on, plus the ruled edge that frames it. */
export function plateBase(ctx, t, opts = {}) {
  const { alpha = 1 } = opts;
  layer(ctx, alpha, () => {
    ctx.fillStyle = SHEET;
    ctx.fillRect(0, 0, 1920, 1080);
    // a flat wash, slightly lighter at the top left, so the sheet is not dead
    const g = ctx.createLinearGradient(PLATE.x, PLATE.y, PLATE.x + PLATE.w, PLATE.y + PLATE.h);
    g.addColorStop(0, "rgba(23,58,86,0.55)");
    g.addColorStop(1, "rgba(6,22,35,0.2)");
    ctx.fillStyle = g;
    ctx.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);

    // the ruled edge: two rules, the print registration look
    stroke(
      ctx,
      [[PLATE.x, PLATE.y], [PLATE.x + PLATE.w, PLATE.y],
       [PLATE.x + PLATE.w, PLATE.y + PLATE.h], [PLATE.x, PLATE.y + PLATE.h],
       [PLATE.x, PLATE.y]],
      INK, 1.6, 0.9,
    );
    stroke(
      ctx,
      [[PLATE.x + 12, PLATE.y + 12], [PLATE.x + PLATE.w - 12, PLATE.y + 12],
       [PLATE.x + PLATE.w - 12, PLATE.y + PLATE.h - 12], [PLATE.x + 12, PLATE.y + PLATE.h - 12],
       [PLATE.x + 12, PLATE.y + 12]],
      INK, 1, 0.5,
    );
    // the sheet's own label, in the corner like a print number
    type(ctx, "plate " + (opts.index ?? 1) + " / 4", PLATE.x + 30, PLATE.y + 44, 15, "rgba(139,164,194,0.75)", "MV Mono");
    type(ctx, "me, as geometry", PLATE.x + PLATE.w - 30, PLATE.y + 44, 15, "rgba(139,164,194,0.75)", "MV Mono", "right");
  });
}

/** A cut-paper disc: a flat fill with a thin rim, no shading. */
export function paperDisc(ctx, cx, cy, r, fill, rim = null) {
  disc(ctx, cx, cy, r, fill, 1);
  if (rim) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** A ring of ticks, the print-decoration that reads as a dial. */
export function tickRing(ctx, cx, cy, r, n, color, from = -Math.PI / 2, sweep = Math.PI * 2) {
  for (let i = 0; i < n; i++) {
    const a = from + (sweep * i) / n;
    const long = i % 5 === 0;
    const r0 = r - (long ? 16 : 8);
    stroke(ctx, [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0],
                 [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], color, long ? 2.4 : 1.2, 0.9);
  }
}

/** A bolt: the streak a sent message leaves, drawn as a cut-paper zigzag. */
export function bolt(ctx, x0, y0, x1, y1, t, opts = {}) {
  const { color = GIFT, seed = 0, width = 3, alpha = 1, segments = 7 } = opts;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const px = x0 + (x1 - x0) * u;
    const py = y0 + (y1 - y0) * u;
    const off = i === 0 || i === segments ? 0 : Math.sin(i * 2.7 + seed) * 34;
    pts.push([px + off * 0.5, py + off]);
  }
  layer(ctx, alpha, () => {
    stroke(ctx, pts, color, width, 1);
    halo(ctx, x1, y1, 60, 0.5, color);
  });
  return pts;
}

/** The program listing plate: a monospace block with the live line marked. */
export function listing(ctx, R, lines, active, t) {
  const size = 26;
  const lh = size + 16;
  lines.forEach((line, i) => {
    const y = R.y + i * lh;
    const on = i === active;
    if (on) {
      rect(ctx, R.x - 18, y - 24, R.w + 36, lh, "rgba(77,107,254,0.16)", 6, "rgba(77,107,254,0.6)");
    }
    type(ctx, String(i + 1).padStart(2, "0"), R.x, y, size * 0.8, on ? GIFT : "rgba(139,164,194,0.6)", "MV Mono");
    type(ctx, line, R.x + 62, y, size, on ? "#ffffff" : "rgba(207,224,238,0.82)", "MV Mono");
  });
}
