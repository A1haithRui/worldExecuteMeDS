// What the main area shows through section 4.
//
// The section is one continuous session on one screen: the sidebar is gone, the
// settings drawer stays open, and only the middle of the window changes. So the
// bodies live here rather than inside one shot -- the drawer and the window frame
// are shared, and each body is a different thing being done to her.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";
import { drawWhale } from "../src/assets/whale.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const GRID = "rgba(61,122,156,0.30)";
const easeOut = (k) => 1 - (1 - k) ** 3;

const hash = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// 1. the scope
//
// She is described as a current, so the main area becomes the instrument that
// measures one: a grid, a sweep, a phosphor trace and a gauge. AC is the sine and
// DC is the flat line -- the same joke as the lyric, now with the instruments that
// would actually show it.
// ---------------------------------------------------------------------------
export function scopeBody(ctx, R, t, opts = {}) {
  const { dc = 0, energy = 1, beat = 0 } = opts;
  layer(ctx, 1, () => {
    rect(ctx, R.x, R.y, R.w, R.h, "rgba(6,22,35,0.92)", 14, "rgba(61,122,156,0.6)");

    const inner = { x: R.x + 26, y: R.y + 54, w: R.w - 52, h: R.h - 132 };
    const midY = inner.y + inner.h * 0.52;
    const amp = inner.h * 0.30 * (1 - dc) * (0.85 + 0.15 * beat);

    // the sweep runs across the screen and repeats
    const sweep = (t * 0.42) % 1;
    const sweepX = inner.x + inner.w * sweep;

    // grid, brighter near the beam
    for (let gx = inner.x; gx <= inner.x + inner.w; gx += 42) {
      const near = Math.max(0, 1 - Math.abs(gx - sweepX) / 190);
      stroke(ctx, [[gx, inner.y], [gx, inner.y + inner.h]], GRID, 1, 0.55 + near * 0.9);
    }
    for (let gy = inner.y; gy <= inner.y + inner.h; gy += 38) {
      stroke(ctx, [[inner.x, gy], [inner.x + inner.w, gy]], GRID, 1, 0.45);
    }
    // the axis
    stroke(ctx, [[inner.x, midY], [inner.x + inner.w, midY]], "rgba(61,122,156,0.85)", 1.2);

    // the trace: what the beam has written stays on the phosphor, so the whole wave
    // is visible at low brightness with a bright tail behind the beam. Drawing only
    // the tail left most of the screen empty between sweeps, which read as broken.
    const waveY = (x) => midY - amp * Math.sin(((x - inner.x) / inner.w) * Math.PI * 2 * 2.2 + t * 2.0);
    const tail = inner.w * 0.42;
    ctx.beginPath();
    for (let x = inner.x; x <= inner.x + inner.w; x += 4) {
      const y = waveY(x);
      x === inner.x ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = dc > 0.5 ? "rgba(131,233,230,0.34)" : "rgba(127,147,255,0.34)";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let x = inner.x; x < inner.x + inner.w; x += 4) {
      const d = sweepX - x;
      const k = d < 0 ? 0 : Math.exp(-d / tail);
      if (k < 0.02) continue;
      const y0 = waveY(x);
      const y1 = waveY(x + 4);
      layer(ctx, k, () =>
        stroke(ctx, [[x, y0], [x + 4, y1]], dc > 0.5 ? GIFT : BRAND_SOFT, 2.4, 1),
      );
    }

    // the beam itself
    const beamGrad = ctx.createLinearGradient(sweepX - 64, 0, sweepX + 6, 0);
    beamGrad.addColorStop(0, "rgba(131,233,230,0)");
    beamGrad.addColorStop(1, "rgba(131,233,230,0.26)");
    ctx.fillStyle = beamGrad;
    ctx.fillRect(sweepX - 64, inner.y, 70, inner.h);
    stroke(ctx, [[sweepX, inner.y], [sweepX, inner.y + inner.h]], GIFT, 1.6, 0.9);
    disc(ctx, sweepX, waveY(sweepX), 4.5, "#ffffff", 1);
    halo(ctx, sweepX, waveY(sweepX), 26, 0.6, GIFT);

    // scale ticks along the top edge
    for (let i = 0; i <= 10; i++) {
      const tx = inner.x + (inner.w * i) / 10;
      const big = i % 5 === 0;
      stroke(ctx, [[tx, inner.y - 12], [tx, inner.y - (big ? 2 : 7)]], "rgba(61,122,156,0.9)", big ? 1.6 : 1);
    }

    // readouts
    type(ctx, dc > 0.5 ? "CH1 · DC" : "CH1 · AC", R.x + 26, R.y + 34, 16, dc > 0.5 ? GIFT : BRAND_SOFT, "MV Mono");
    const hz = dc > 0.5 ? 0 : 60 + Math.sin(t * 1.3) * 0.4;
    type(ctx, hz.toFixed(1) + " Hz", R.x + R.w - 26, R.y + 34, 16, DIM, "MV Mono", "right");
    type(
      ctx,
      "I " + (dc > 0.5 ? 0 : 2.3 * (1 - dc) + 1.1).toFixed(2) + " A",
      R.x + 26, R.y + R.h - 26, 16, "#cfe0ee", "MV Mono",
    );
    type(ctx, energy.toFixed(2) + " ×", R.x + R.w - 26, R.y + R.h - 26, 16, DIM, "MV Mono", "right");

    // the gauge, drawn over the grid's left end
    const gx = R.x + 92;
    const gy = R.y + R.h - 58;
    const gr = 34;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, Math.PI * 1.16, Math.PI * 1.84);
    ctx.strokeStyle = "rgba(61,122,156,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    const needle = dc > 0.5 ? 0 : 0.5 + 0.5 * Math.sin(t * 2.4);
    const na = Math.PI * 1.16 + Math.PI * 0.68 * needle;
    stroke(ctx, [[gx, gy], [gx + Math.cos(na) * gr * 0.86, gy + Math.sin(na) * gr * 0.86]], GIFT, 2, 1);
    disc(ctx, gx, gy, 3, GIFT, 1);
  });
}

// ---------------------------------------------------------------------------
// 2. vision off
//
// The picture breaks into square blocks. The words are drawn after this, so they
// survive it -- which is the whole point of the line.
// ---------------------------------------------------------------------------
export function breakIntoBlocks(ctx, amount, seed = 0, size = 44) {
  if (amount <= 0.01) return;
  layer(ctx, Math.min(1, amount), () => {
    for (let x = 0; x < 1920; x += size) {
      for (let y = 0; y < 1080; y += size) {
        const n = Math.sin((x * 0.37 + y * 0.61 + seed) * 0.9) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(2,7,13,${(0.3 + 0.6 * n).toFixed(3)})`;
        ctx.fillRect(x, y, size, size);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 3. travelling through the record
//
// Dragging the knowledge date back should feel like falling through it, so the
// main area becomes a tunnel: the eras rush past in perspective, streaks radiate
// from the vanishing point, and the year spins down under it.
// ---------------------------------------------------------------------------
const ERAS = Object.freeze([
  { label: "A.D. 2026", kind: "tower" },
  { label: "A.D. 1200", kind: "spire" },
  { label: "A.D. 1", kind: "column" },
  { label: "1000 B.C.", kind: "column" },
  { label: "3000 B.C.", kind: "pyramid" },
]);

function eraShape(ctx, kind, cx, cy, h, ink, lw) {
  if (kind === "pyramid") {
    stroke(ctx, [[cx - h * 0.62, cy + h * 0.4], [cx, cy - h * 0.6]], ink, lw);
    stroke(ctx, [[cx + h * 0.62, cy + h * 0.4], [cx, cy - h * 0.6]], ink, lw);
    stroke(ctx, [[cx - h * 0.62, cy + h * 0.4], [cx + h * 0.62, cy + h * 0.4]], ink, lw);
  } else if (kind === "tower") {
    stroke(ctx, [[cx - h * 0.18, cy + h * 0.45], [cx - h * 0.18, cy - h * 0.35]], ink, lw);
    stroke(ctx, [[cx + h * 0.18, cy + h * 0.45], [cx + h * 0.18, cy - h * 0.35]], ink, lw);
    stroke(ctx, [[cx - h * 0.18, cy - h * 0.35], [cx, cy - h * 0.62]], ink, lw);
    stroke(ctx, [[cx + h * 0.18, cy - h * 0.35], [cx, cy - h * 0.62]], ink, lw);
    stroke(ctx, [[cx - h * 0.34, cy + h * 0.45], [cx + h * 0.34, cy + h * 0.45]], ink, lw);
  } else if (kind === "spire") {
    stroke(ctx, [[cx - h * 0.22, cy + h * 0.45], [cx, cy - h * 0.6]], ink, lw);
    stroke(ctx, [[cx + h * 0.22, cy + h * 0.45], [cx, cy - h * 0.6]], ink, lw);
    stroke(ctx, [[cx - h * 0.22, cy + h * 0.45], [cx + h * 0.22, cy + h * 0.45]], ink, lw);
  } else {
    for (let i = -1; i <= 1; i++) {
      stroke(ctx, [[cx + i * h * 0.3, cy + h * 0.45], [cx + i * h * 0.3, cy - h * 0.38]], ink, lw);
    }
    stroke(ctx, [[cx - h * 0.54, cy - h * 0.38], [cx + h * 0.54, cy - h * 0.38]], ink, lw);
    stroke(ctx, [[cx - h * 0.54, cy + h * 0.45], [cx + h * 0.54, cy + h * 0.45]], ink, lw);
  }
}

export function timeBody(ctx, R, t, opts = {}) {
  const { year = 2026, speed = 1 } = opts;
  layer(ctx, 1, () => {
    rect(ctx, R.x, R.y, R.w, R.h, "rgba(5,20,33,0.95)", 14, "rgba(61,122,156,0.6)");
    const vx = R.x + R.w * 0.5;
    const vy = R.y + R.h * 0.5;
    const maxR = Math.hypot(R.w, R.h) * 0.62;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(R.x + 1, R.y + 1, R.w - 2, R.h - 2, 13);
    ctx.clip();

    // 1. streaks: everything is moving away from the vanishing point
    for (let i = 0; i < 130; i++) {
      const a = hash(i) * Math.PI * 2;
      const lane = 0.35 + hash(i + 90) * 0.65;
      const ph = (t * (0.55 + hash(i + 40) * 0.9) * speed + hash(i + 7)) % 1;
      const r0 = ph ** 1.7 * maxR * lane;
      const len = 26 + 150 * ph;
      const al = 0.08 + 0.5 * ph;
      stroke(
        ctx,
        [[vx + Math.cos(a) * r0, vy + Math.sin(a) * r0],
         [vx + Math.cos(a) * (r0 + len), vy + Math.sin(a) * (r0 + len)]],
        i % 5 === 0 ? GIFT : "rgba(127,147,255,0.9)",
        1 + 2.2 * ph, al,
      );
    }

    // 2. the eras, flying toward us in perspective
    const N = 5;
    for (let i = 0; i < N; i++) {
      const z = (t * 0.5 * speed + i / N) % 1; // 0 = far, 1 = at the glass
      const s = 0.22 + z * z * 2.6;
      const px = vx + (i % 2 === 0 ? -1 : 1) * (R.w * 0.16) * (0.4 + z);
      const py = vy + Math.sin(i * 2.1 + z * 2.4) * R.h * 0.16 * (0.5 + z);
      const h = 150 * s;
      const ink = z > 0.82 ? "rgba(131,233,230,0.95)" : `rgba(127,147,255,${(0.25 + 0.6 * (1 - z)).toFixed(2)})`;
      ctx.save();
      ctx.globalAlpha = Math.min(1, 0.25 + z * 1.2);
      eraShape(ctx, ERAS[i].kind, px, py, h, ink, 1.4 + 2.2 * z);
      if (z > 0.55) {
        type(ctx, ERAS[i].label, px, py + h * 0.72, 13 + 12 * z, ink, "MV Mono", "center");
      }
      ctx.restore();
    }

    // 3. the year, spinning down at a fixed cadence
    const shown = Math.round(year);
    const digitShift = (Math.floor(t * 9) % 2) * 4;
    ctx.save();
    ctx.shadowColor = "rgba(77,107,254,0.9)";
    ctx.shadowBlur = 26;
    type(ctx, String(shown), vx, vy + 62, 128, "#ffffff", "MV Sans", "center");
    ctx.restore();
    type(
      ctx, shown > 0 ? "A.D." : "B.C.", vx, vy + 116, 28,
      GIFT, "MV Mono", "center",
    );
    // the digits jitter, so the number is clearly running rather than printed
    type(ctx, "knowledge date", R.x + 26, R.y + 34, 16, DIM, "MV Mono");
    type(ctx, "travelling", R.x + R.w - 26, R.y + 34, 16, GIFT, "MV Mono", "right");
    ctx.restore();

    // 4. a vignette so the tunnel has depth
    const vg = ctx.createRadialGradient(vx, vy, R.h * 0.1, vx, vy, maxR);
    vg.addColorStop(0, "rgba(2,7,13,0)");
    vg.addColorStop(1, "rgba(2,7,13,0.85)");
    ctx.fillStyle = vg;
    ctx.fillRect(R.x, R.y, R.w, R.h);
  });
}

// ---------------------------------------------------------------------------
// 4. unite
//
// Same window, same drawer. The main area holds her mark, and every step of the
// depth slider feeds it: the halo widens, rings leave it, particles fall inward.
// The closer the two become, the more light the mark gives off.
// ---------------------------------------------------------------------------
export function uniteBody(ctx, R, t, opts = {}) {
  const { depth = 0.15, unity = 0, memory = 0 } = opts;
  layer(ctx, 1, () => {
    rect(ctx, R.x, R.y, R.w, R.h, "rgba(6,22,35,0.94)", 14, "rgba(61,122,156,0.6)");
    // the glow and its rings belong to the panel: un-clipped they crossed the
    // window frame and the composer, which read as an effect leaking
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(R.x + 1, R.y + 1, R.w - 2, R.h - 2, 13);
    ctx.clip();
    const cx = R.x + R.w * 0.5;
    const cy = R.y + R.h * 0.46;
    const size = 190;

    // rings leaving the mark, one per depth step
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.55 + i / 5) % 1;
      const r = size * (0.55 + ph * 2.1) * (0.75 + unity * 0.5);
      const a = (1 - ph) * (0.12 + 0.5 * depth);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(131,233,230,${a.toFixed(3)})`;
      ctx.lineWidth = 1.4 + 2 * depth;
      ctx.stroke();
    }

    // particles falling into the mark, denser as it deepens
    const N = Math.round(26 + 90 * depth);
    for (let i = 0; i < N; i++) {
      const a = hash(i) * Math.PI * 2;
      const ph = (t * (0.4 + hash(i + 13) * 0.6) + hash(i + 3)) % 1;
      const r = size * (0.55 + (1 - ph) * 2.4);
      const px = cx + Math.cos(a + ph * 1.4) * r;
      const py = cy + Math.sin(a + ph * 1.4) * r;
      disc(ctx, px, py, 1.2 + 1.6 * (1 - ph), GIFT, (1 - ph) * (0.25 + 0.7 * depth));
    }

    // the mark itself: the halo is the readout of how deep this goes
    const glow = 0.25 + 0.75 * depth;
    halo(ctx, cx, cy, size * (0.9 + 0.9 * glow), 0.28 + 0.5 * glow, BRAND);
    halo(ctx, cx, cy, size * (0.5 + 0.4 * glow), 0.5 + 0.45 * glow, GIFT);
    ctx.save();
    ctx.shadowColor = "rgba(77,107,254,0.95)";
    ctx.shadowBlur = 24 + 70 * glow;
    drawWhale(ctx, cx, cy, size, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.92 + 0.08 * unity });
    ctx.restore();

    // the depth readout under it
    type(
      ctx, memory > 0.5 ? "shared · " + Math.round(depth * 100) + "%" : Math.round(depth * 100) + "%",
      cx, cy + size * 0.78, 17, GIFT, "MV Mono", "center",
    );
    type(ctx, "context depth", R.x + 26, R.y + 34, 16, DIM, "MV Mono");
    ctx.restore();
  });
}
