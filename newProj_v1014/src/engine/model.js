// Model interior: the visual language for "what is happening inside the agent".
//
// Roughly twenty of the fifty-six shots are model-internal, so this is a shared
// vocabulary rather than per-shot drawing: a drifting node grid, signal paths
// carrying several packets at once, scrolling TUI data columns, and an
// audio-reactive waveform.
//
// The design rule from the storyboard: these are not permanent wallpaper. A
// shot picks one or two of them, and they carry the event of that shot.
//
// Everything is a pure function of song time.
import { hash01, clamp, mix } from "./motion.js";
import { spec, applyFont, measure } from "./type.js";
import { audio, sampleAt, seriesAt } from "./audio.js";

const MONO = "MV Mono";
const GLYPHS = "0123456789ABCDEFabcdef<>/\\|=+-*:.".split("");

/** A glowing node with an optional pulse ring. */
export function node(ctx, x, y, t, opts = {}) {
  const {
    r = 5,
    color = "#83e9e6",
    alpha = 1,
    pulse = 0,
    ring = true,
    seed = 0,
  } = opts;
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 7);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = clamp(alpha) * (0.28 + 0.5 * pulse);
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
  ctx.globalAlpha = clamp(alpha);
  ctx.beginPath();
  ctx.arc(x, y, r * (1 + 0.35 * pulse), 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (ring && pulse > 0.01) {
    ctx.globalAlpha = clamp(alpha) * 0.5 * pulse;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r * (2 + 7 * (1 - pulse)), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * A drifting lattice of nodes with faint connecting rules. Continuous motion
 * over the whole frame, at low contrast, so it reads as the space the shot
 * happens in rather than as decoration.
 */
export function nodeGrid(ctx, t, opts = {}) {
  const {
    x = 0,
    y = 0,
    w = 1920,
    h = 1080,
    step = 104,
    drift = [26, 14],
    alpha = 0.3,
    lineAlpha = 0.07,
    color = "#25bdd4",
    pulseRate = 0.55,
    beatPulse = 0,
    lowEnv = 0,
    seed = 3,
  } = opts;
  if (alpha <= 0.001) return;
  // Modulo the drift by one cell: the lattice is periodic, so the wrap is
  // seamless and there is no jump when the offset resets.
  const ox = (t * drift[0]) % step;
  const oy = (t * drift[1]) % step;
  const cols = Math.ceil(w / step) + 2;
  const rows = Math.ceil(h / step) + 2;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  ctx.globalAlpha = clamp(lineAlpha * (0.7 + 0.6 * lowEnv));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < cols; i++) {
    const px = x + i * step - ox;
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
  }
  for (let j = 0; j < rows; j++) {
    const py = y + j * step - oy;
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py);
  }
  ctx.stroke();

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const px = x + i * step - ox;
      const py = y + j * step - oy;
      const ph = hash01(i * 131 + j * 977, seed) * Math.PI * 2;
      const s = Math.max(0, Math.sin(t * pulseRate + ph));
      const a = alpha * (0.16 + 0.84 * s ** 3) * (0.75 + 0.5 * lowEnv);
      if (a < 0.01) continue;
      ctx.globalAlpha = clamp(a);
      ctx.fillStyle = color;
      const r = 1.1 + 1.0 * s + 0.9 * beatPulse;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/**
 * A path carrying several packets at once, so it is never momentarily still.
 * `route` is the object from mv-draw's `route()`: { pts, dist, length }.
 * `along` is passed in to avoid importing mv-draw (which imports this module).
 */
export function signalPath(ctx, r, t, along, opts = {}) {
  const {
    packets = 3,
    speed = 0.28,
    phase = 0,
    color = "#25bdd4",
    packetColor = "#83e9e6",
    baseAlpha = 0.2,
    alpha = 1,
    width = 2.5,
    packetR = 5,
    beatPulse = 0,
    tails = true,
  } = opts;
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = clamp(baseAlpha * alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  r.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < packets; i++) {
    // Each packet runs the whole path, offset so one is always leaving and
    // another arriving: the route reads as busy rather than as a single sweep.
    const p = ((t * speed + i / packets + phase) % 1 + 1) % 1;
    const [px, py] = along(r, p);
    if (tails) {
      ctx.save();
      ctx.globalAlpha = clamp(alpha * 0.35);
      ctx.strokeStyle = packetColor;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const q = Math.max(0, p - k * 0.012);
        const [qx, qy] = along(r, q);
        if (k === 0) ctx.moveTo(qx, qy);
        else ctx.lineTo(qx, qy);
      }
      ctx.stroke();
      ctx.restore();
    }
    node(ctx, px, py, t, {
      r: packetR * (1 + 0.25 * beatPulse),
      color: packetColor,
      alpha,
      pulse: 0.35 + 0.65 * beatPulse,
      ring: false,
      seed: i,
    });
  }
}

/**
 * Columns of scrolling terminal characters. Gives an internal shot texture and
 * continuous motion without competing with the shot's subject.
 */
export function dataColumns(ctx, t, opts = {}) {
  const {
    x = 0,
    y = 0,
    w = 1920,
    h = 1080,
    columns = 26,
    rowH = 26,
    size = 15,
    alpha = 0.22,
    color = "#3f7f92",
    hotColor = "#83e9e6",
    speed = 22,
    seed = 11,
    focus = null,
  } = opts;
  if (alpha <= 0.001) return;
  const s = spec(size, MONO);
  applyFont(ctx, s);
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const colW = w / columns;
  const rows = Math.ceil(h / rowH) + 2;
  for (let c = 0; c < columns; c++) {
    const cx = x + c * colW + colW * 0.5;
    const scroll = (t * speed * (0.6 + hash01(c, seed) * 0.9)) % rowH;
    for (let r = 0; r < rows; r++) {
      const py = y + r * rowH - scroll;
      // A character is stable for a few frames and only some rows mutate.
      const tick = Math.floor(t * 7 + r * 0.7);
      const gi = Math.floor(hash01(c * 8191 + r * 131 + tick, seed) * GLYPHS.length);
      const ch = GLYPHS[gi % GLYPHS.length];
      const near =
        focus == null
          ? 0
          : Math.max(0, 1 - Math.hypot(cx - focus[0], py - focus[1]) / 520);
      const a = alpha * (0.35 + 0.65 * hash01(c * 977 + r, seed + 5)) * (1 + near * 2.2);
      ctx.globalAlpha = clamp(a);
      ctx.fillStyle = near > 0.35 ? hotColor : color;
      ctx.fillText(ch, cx, py);
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/**
 * Audio-reactive bar waveform: a short window of one feature series drawn as
 * bars, so the picture is visibly following the music rather than only pulsing.
 */
export function waveform(ctx, x, y, w, h, t, opts = {}) {
  const {
    bars = 72,
    span = 2.4,
    series = "mid",
    color = "#25bdd4",
    hotColor = "#83e9e6",
    alpha = 0.5,
    mirror = true,
    minBar = 2,
  } = opts;
  if (alpha <= 0.001) return;
  const bw = w / bars;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < bars; i++) {
    const tt = t - span + (i / (bars - 1)) * span;
    const v = seriesAt(series, Math.max(0, tt), 0.25);
    const bh = Math.max(minBar, v * h);
    // The newest bars read hotter, so the eye follows the left-to-right scan.
    const fresh = i / (bars - 1);
    ctx.globalAlpha = clamp(alpha * (0.35 + 0.65 * fresh));
    ctx.fillStyle = fresh > 0.82 ? hotColor : color;
    const bx = x + i * bw;
    if (mirror) ctx.fillRect(bx, y + (h - bh) / 2, Math.max(1, bw - 2), bh);
    else ctx.fillRect(bx, y + h - bh, Math.max(1, bw - 2), bh);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/** A ring that leaves a node on every beat; used to keep a focus point alive. */
export function beatRings(ctx, x, y, t, opts = {}) {
  const {
    count = 2,
    color = "#25bdd4",
    alpha = 0.3,
    maxR = 220,
    life = 1.0,
    period = 60 / 130,
    phase = 0,
  } = opts;
  const base = (t - phase) / period;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let k = 0; k < count; k++) {
    const index = Math.floor(base) - k;
    if (index < 0) continue;
    const age = (t - (phase + index * period)) / life;
    if (age < 0 || age > 1) continue;
    const a = Math.pow(1 - age, 2.2) * alpha;
    if (a < 0.003) continue;
    ctx.globalAlpha = clamp(a);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x, y, 30 + age * maxR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/**
 * How much internal texture a shot wants. Close-ups take little; wide internal
 * views take a lot. Keeps the storyboard rule that a support layer stays well
 * under the subject's contrast.
 */
export const MODEL_DENSITY = Object.freeze({
  quiet: { gridAlpha: 0.14, columnAlpha: 0.10, waveAlpha: 0.22 },
  normal: { gridAlpha: 0.26, columnAlpha: 0.18, waveAlpha: 0.38 },
  busy: { gridAlpha: 0.4, columnAlpha: 0.3, waveAlpha: 0.55 },
});

export function densityFor(level) {
  return MODEL_DENSITY[level] || MODEL_DENSITY.normal;
}
